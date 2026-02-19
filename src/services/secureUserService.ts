/**
 * Secure User Service — AccreditEx
 * 
 * Security fix (2026-02-18): Fixes Critical findings C-1 and C-2 from RBAC audit.
 * 
 * PROBLEM (C-1): User documents were stored with custom IDs like "user-{timestamp}"
 * but Firestore security rules look up roles using `request.auth.uid` (Firebase Auth UID).
 * This caused ALL server-side role checks (isAdmin, isProjectLead) to silently fail,
 * rendering the entire Firestore RBAC decorative.
 * 
 * PROBLEM (C-2): The old `addUser` function only created a Firestore document without
 * creating a Firebase Auth account, meaning users couldn't actually log in.
 * 
 * SOLUTION:
 * - `createUserSecurely()` uses a secondary Firebase app instance to create both
 *   a Firebase Auth account AND a Firestore document keyed by the Auth UID.
 * - The secondary app pattern prevents the admin from being logged out during creation.
 * - A password reset email is sent to the new user so they can set their own password.
 * 
 * See: RBAC_SECURITY_CHANGELOG.md for full details.
 */

import { initializeApp, deleteApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
    Auth
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, getAuthInstance } from '@/firebase/firebaseConfig';
import { User, UserRole } from '@/types';
import { logger } from '@/services/logger';

// =====================================================
// SECONDARY APP FOR USER CREATION
// =====================================================
// Using a secondary Firebase app instance prevents the
// admin from being signed out when creating a new user,
// since createUserWithEmailAndPassword signs in as the
// new user on the auth instance used.
// =====================================================

let secondaryApp: FirebaseApp | null = null;
let secondaryAuth: Auth | null = null;

function getSecondaryAuth(): Auth {
    if (!secondaryAuth) {
        // Get the primary app's config
        const primaryApp = getApps()[0];
        if (!primaryApp) {
            throw new Error('Primary Firebase app not initialized');
        }
        const config = primaryApp.options;

        // Create or reuse secondary app
        const existingSecondary = getApps().find(app => app.name === 'secondary-auth');
        if (existingSecondary) {
            secondaryApp = existingSecondary;
        } else {
            secondaryApp = initializeApp(config, 'secondary-auth');
        }
        secondaryAuth = getAuth(secondaryApp);
    }
    return secondaryAuth;
}

function cleanupSecondaryAuth(): void {
    if (secondaryAuth) {
        firebaseSignOut(secondaryAuth).catch(() => { });
    }
    // Don't delete the app — reuse it across calls to avoid re-initialization overhead
}

/**
 * Generate a cryptographically random temporary password.
 * The user will never see this — they get a password reset email.
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Create a new user with both a Firebase Auth account and a properly-keyed
 * Firestore document. Sends a password reset email to the new user.
 * 
 * @param userData - User profile data (without id)
 * @param callerRole - Role of the calling user (for authorization)
 * @returns The created User object with Auth UID as id
 * @throws Error if caller is not Admin or if user creation fails
 */
export async function createUserSecurely(
    userData: Omit<User, 'id'>,
    callerRole: UserRole
): Promise<User> {
    // Authorization: Only admins can create users
    if (callerRole !== UserRole.Admin) {
        throw new Error('Only administrators can create new users');
    }

    if (!userData.email || !userData.name || !userData.role) {
        throw new Error('Email, name, and role are required to create a user');
    }

    const tempPassword = generateTempPassword();
    const secAuth = getSecondaryAuth();

    let newUid: string;

    try {
        // Step 1: Create Firebase Auth account via secondary app (admin stays logged in)
        const userCredential = await createUserWithEmailAndPassword(
            secAuth,
            userData.email,
            tempPassword
        );
        newUid = userCredential.user.uid;

        logger.info(`[SecureUserService] Created Auth account for ${userData.email} with UID ${newUid}`);

        // Step 2: Sign out from secondary auth immediately
        await firebaseSignOut(secAuth);

    } catch (error: any) {
        cleanupSecondaryAuth();

        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`A user with email ${userData.email} already exists in Firebase Auth`);
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error(`Invalid email address: ${userData.email}`);
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('Generated password was too weak — please try again');
        }
        throw new Error(`Failed to create auth account: ${error.message}`);
    }

    try {
        // Step 3: Create Firestore document keyed by Auth UID (the critical fix)
        const now = new Date().toISOString();
        const newUser: User = {
            ...userData,
            id: newUid,
            createdAt: now,
            updatedAt: now,
            isActive: true,
        };

        await setDoc(doc(db, 'users', newUid), newUser);

        logger.info(`[SecureUserService] Created Firestore doc for ${userData.email} at users/${newUid}`);

        // Step 4: Send password reset email so user can set their own password
        try {
            const primaryAuth = getAuthInstance();
            await sendPasswordResetEmail(primaryAuth, userData.email);
            logger.info(`[SecureUserService] Password reset email sent to ${userData.email}`);
        } catch (emailError) {
            // Non-blocking — user still created, admin can resend reset manually
            logger.warn(`[SecureUserService] Failed to send password reset email to ${userData.email}:`, emailError);
        }

        return newUser;

    } catch (error: any) {
        // If Firestore write fails, we have an orphaned Auth account.
        // Log it for manual cleanup but don't try to delete (we're on secondary auth).
        logger.error(
            `[SecureUserService] CRITICAL: Auth account created for ${userData.email} (${newUid}) but Firestore write failed. ` +
            `Manual cleanup required in Firebase Console. Error: ${error.message}`
        );
        throw new Error(`User auth account created but profile save failed. Contact admin for cleanup.`);
    }
}

/**
 * Check if a Firestore user document exists for a given Auth UID.
 */
export async function userDocExistsByUid(uid: string): Promise<boolean> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

/**
 * Migrate a user document from a legacy custom ID (e.g. "user-{timestamp}")
 * to the correct Firebase Auth UID as the document ID.
 * 
 * This runs automatically on login (see firebaseHooks.ts) to gradually
 * migrate all existing users without downtime.
 * 
 * @param legacyDocId - The old document ID (e.g. "user-5", "user-1708123456789")
 * @param authUid - The correct Firebase Auth UID
 * @returns true if migration was performed, false if not needed
 */
export async function migrateUserDocToAuthUid(
    legacyDocId: string,
    authUid: string
): Promise<boolean> {
    // Skip if IDs already match
    if (legacyDocId === authUid) {
        return false;
    }

    // Check if a correct doc already exists
    const correctDocRef = doc(db, 'users', authUid);
    const correctDoc = await getDoc(correctDocRef);

    if (correctDoc.exists()) {
        logger.info(`[Migration] User doc already exists at users/${authUid}, skipping migration`);
        return false;
    }

    // Read the legacy document
    const legacyDocRef = doc(db, 'users', legacyDocId);
    const legacyDoc = await getDoc(legacyDocRef);

    if (!legacyDoc.exists()) {
        logger.warn(`[Migration] Legacy doc users/${legacyDocId} not found`);
        return false;
    }

    const userData = legacyDoc.data();

    // Atomic batch: create new doc + delete old doc
    const batch = writeBatch(db);

    // Create new document with Auth UID as ID
    batch.set(correctDocRef, {
        ...userData,
        id: authUid,
        _migratedFrom: legacyDocId,
        _migratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    // Delete legacy document
    batch.delete(legacyDocRef);

    await batch.commit();

    logger.info(
        `[Migration] Successfully migrated user doc from users/${legacyDocId} to users/${authUid} ` +
        `for ${userData.email}`
    );

    return true;
}
