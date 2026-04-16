/**
 * Organization Service — AccrediTex
 *
 * Single source of truth for all Firestore reads/writes against the
 * /organizations collection.  Components and stores MUST go through
 * this service — never call Firestore directly for org data.
 *
 * Security model:
 *  - Any authenticated user can read their own org document.
 *  - Only platform super-admins (listed in /platformAdmins/{uid}) can write.
 *  - Firestore rules enforce this server-side; this service enforces it
 *    client-side for fast-fail UX feedback.
 *
 * How to grant super-admin:
 *  In Firebase Console → Firestore → platformAdmins collection,
 *  create a document with ID = the user's Auth UID, containing
 *  { email: "...", grantedAt: "<ISO date>" }.
 */

import { db, getAuthInstance } from '@/firebase/firebaseConfig';
import { Organization } from '@/types';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

// ── Helpers ────────────────────────────────────────────────

/**
 * Returns true if the currently signed-in user has a document in the
 * /platformAdmins/{uid} collection.  No Cloud Functions or custom claims
 * are required — access is granted via Firebase Console.
 *
 * Firestore rules protect the platformAdmins collection so only
 * existing super-admins (or no one) can write to it.
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
    const auth = getAuthInstance();
    const user = auth.currentUser;
    if (!user) return false;
    try {
        const snap = await getDoc(doc(db, 'platformAdmins', user.uid));
        return snap.exists();
    } catch {
        return false;
    }
}

// ── Read operations ────────────────────────────────────────

/**
 * Fetch a single organization by ID.
 * Any authenticated member of that org (or a super-admin) can call this.
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
    if (!orgId) return null;
    const snap = await getDoc(doc(db, 'organizations', orgId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Organization;
}

/**
 * List ALL organizations — super-admin only.
 * Sorted by name ascending.
 */
export async function listAllOrganizations(): Promise<Organization[]> {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
        throw new Error('Insufficient permissions: super-admin required to list all organizations.');
    }
    const q = query(collection(db, 'organizations'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
}

/**
 * List organizations filtered by plan tier — super-admin only.
 */
export async function listOrganizationsByPlan(
    plan: Organization['plan'],
): Promise<Organization[]> {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
        throw new Error('Insufficient permissions: super-admin required.');
    }
    const q = query(
        collection(db, 'organizations'),
        where('plan', '==', plan),
        orderBy('name', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
}

// ── Write operations (super-admin only) ───────────────────

/**
 * Update fields on an organization document.
 * Performs a client-side super-admin check before writing.
 * Firestore rules provide the authoritative server-side enforcement.
 */
export async function updateOrganization(
    orgId: string,
    updates: Partial<Omit<Organization, 'id' | 'createdAt'>>,
): Promise<void> {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
        throw new Error(
            'Insufficient permissions: only platform super-admins can modify organization settings.',
        );
    }
    const ref = doc(db, 'organizations', orgId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString(),
    } as Record<string, unknown>);
}

/**
 * Activate or suspend an organization (toggle isActive).
 */
export async function setOrganizationActive(orgId: string, isActive: boolean): Promise<void> {
    return updateOrganization(orgId, { isActive });
}

/**
 * Change the subscription plan of an organization.
 */
export async function setOrganizationPlan(
    orgId: string,
    plan: Organization['plan'],
    maxUsers?: number,
): Promise<void> {
    return updateOrganization(orgId, {
        plan,
        ...(maxUsers !== undefined ? { maxUsers } : {}),
    });
}

/**
 * Extend or revoke the trial period for an organization.
 */
export async function setOrganizationTrial(
    orgId: string,
    trialActive: boolean,
    trialEndsAt?: string,
): Promise<void> {
    return updateOrganization(orgId, {
        trialActive,
        ...(trialEndsAt !== undefined ? { trialEndsAt } : {}),
    });
}
