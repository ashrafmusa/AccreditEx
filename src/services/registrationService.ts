/**
 * registrationService — Self-service free trial registration
 *
 * Creates a Firebase Auth account + Organization document + User document
 * in a single atomic-style flow. No card required. Trial lasts 14 days
 * at the Professional plan tier.
 *
 * Security model:
 *   - Firestore rule allows any authenticated user to create ONE org
 *     where `createdBy == auth.uid` and `plan == 'professional'` and `trialActive == true`.
 *   - User document creation is allowed via `isOwner(userId)` rule (uid == userId).
 *   - No Admin SDK or Cloud Functions required.
 */

import { db, getAuthInstance } from '@/firebase/firebaseConfig';
import type { Organization } from '@/types';
import { UserRole } from '@/types';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

export interface SelfRegistrationData {
    /** Full name of the person signing up */
    fullName: string;
    /** Work email — becomes Firebase Auth email */
    email: string;
    /** Password (min 8 chars enforced client-side) */
    password: string;
    /** Organization / hospital name */
    organizationName: string;
    /** Organization type */
    organizationType: Organization['type'];
    /** Optional country */
    country?: string;
}

export interface RegistrationResult {
    orgId: string;
    userId: string;
}

/**
 * Create a new account + organization + 14-day professional trial.
 *
 * Step 1: Create Firebase Auth account (user is signed in after this).
 * Step 2: Create org document in Firestore (plan=professional, trialActive=true).
 * Step 3: Create user document linked to the new org.
 *
 * The Firestore onAuthStateChanged listener in firebaseHooks will automatically
 * pick up the new user doc and load the organization, transitioning the UI
 * from the registration page to the onboarding flow.
 */
export async function selfRegister(data: SelfRegistrationData): Promise<RegistrationResult> {
    const auth = getAuthInstance();

    // 1. Create Firebase Auth account
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = credential.user.uid;
    const now = new Date().toISOString();

    // 2. Calculate trial window
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // 3. Create organization document
    const orgRef = doc(collection(db, 'organizations'));
    const orgId = orgRef.id;

    await setDoc(orgRef, {
        name: data.organizationName,
        type: data.organizationType,
        country: data.country ?? '',
        contactEmail: data.email,
        isActive: true,
        plan: 'professional',
        trialActive: true,
        trialEndsAt: trialEndsAt.toISOString(),
        maxUsers: 10,
        createdAt: now,
        updatedAt: now,
        createdBy: uid,
    });

    // 4. Create user document (keyed by Firebase Auth UID)
    await setDoc(doc(db, 'users', uid), {
        name: data.fullName,
        email: data.email,
        role: UserRole.Admin,
        organizationId: orgId,
        isActive: true,
        createdAt: now,
    });

    return { orgId, userId: uid };
}
