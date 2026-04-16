/**
 * Branch Service — AccrediTex
 *
 * CRUD operations for organization branches (sub-locations).
 * Branches allow a single Organization to model multiple physical
 * sites (e.g., main campus, north branch, satellite clinic) while
 * sharing the same accreditation programs and user pool.
 *
 * Each branch document is scoped by organizationId for tenant isolation.
 */

import { db } from '@/firebase/firebaseConfig';
import { Branch } from '@/types';
import { getTenantQuery, getTenantStamp } from '@/utils/tenantQuery';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';

const COLLECTION = 'branches';

// ── Read ──────────────────────────────────────────────────────

/**
 * Fetch all branches for the current organization.
 */
export async function getBranches(): Promise<Branch[]> {
    const snap = await getDocs(getTenantQuery(COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Branch));
}

/**
 * Fetch only active branches.
 */
export async function getActiveBranches(): Promise<Branch[]> {
    const all = await getBranches();
    return all.filter((b) => b.isActive);
}

// ── Create ────────────────────────────────────────────────────

/**
 * Create a new branch for the current organization.
 */
export async function addBranch(
    branchData: Omit<Branch, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>,
): Promise<Branch> {
    const now = new Date().toISOString();
    const payload = {
        ...branchData,
        ...getTenantStamp(),
        isActive: branchData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { id: ref.id, ...payload } as Branch;
}

// ── Update ────────────────────────────────────────────────────

/**
 * Update an existing branch.
 */
export async function updateBranch(
    branchId: string,
    updates: Partial<Omit<Branch, 'id' | 'organizationId' | 'createdAt'>>,
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, branchId), {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Deactivate a branch (soft delete — preserves historical data).
 */
export async function deactivateBranch(branchId: string): Promise<void> {
    await updateBranch(branchId, { isActive: false });
}

// ── Delete ────────────────────────────────────────────────────

/**
 * Permanently delete a branch. Prefer deactivateBranch for safety.
 */
export async function deleteBranch(branchId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, branchId));
}
