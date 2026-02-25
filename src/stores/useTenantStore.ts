/**
 * Tenant Store — Multi-Tenancy Foundation
 *
 * Manages the current organization context for the logged-in user.
 * Every Firestore query should use `organizationId` from this store
 * to ensure data isolation between institutions.
 *
 * Backward compatible: if no organizationId is set (legacy single-tenant),
 * queries run unfiltered so existing data keeps working.
 */

import { create } from 'zustand';
import { Organization } from '@/types';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface TenantState {
    /** The currently active organization (null = legacy single-tenant mode) */
    currentOrganization: Organization | null;
    /** Shortcut: current org ID (empty string = no tenant filter) */
    organizationId: string;
    /** Whether multi-tenancy is active for this deployment */
    isMultiTenant: boolean;
    /** Loading state */
    loading: boolean;
    /** Error */
    error: string | null;

    /** Set the active organization after login */
    setOrganization: (org: Organization | null) => void;
    /** Load organization from Firestore by ID */
    loadOrganization: (orgId: string) => Promise<void>;
    /** Load organization from user's organizationId after login */
    loadOrganizationForUser: (userOrgId?: string) => Promise<void>;
    /** Clear on logout */
    clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
    currentOrganization: null,
    organizationId: '',
    isMultiTenant: false,
    loading: false,
    error: null,

    setOrganization: (org) => {
        set({
            currentOrganization: org,
            organizationId: org?.id || '',
            isMultiTenant: !!org,
            error: null,
        });
    },

    loadOrganization: async (orgId: string) => {
        if (!orgId) return;
        set({ loading: true, error: null });
        try {
            const orgRef = doc(db, 'organizations', orgId);
            const snap = await getDoc(orgRef);
            if (snap.exists()) {
                const org = { id: snap.id, ...snap.data() } as Organization;
                set({
                    currentOrganization: org,
                    organizationId: org.id,
                    isMultiTenant: true,
                    loading: false,
                });
            } else {
                set({ loading: false, error: 'Organization not found' });
            }
        } catch (err: any) {
            console.error('Failed to load organization:', err);
            set({ loading: false, error: err.message });
        }
    },

    loadOrganizationForUser: async (userOrgId?: string) => {
        if (!userOrgId) {
            // Legacy single-tenant: no organization assigned
            set({
                currentOrganization: null,
                organizationId: '',
                isMultiTenant: false,
                loading: false,
            });
            return;
        }
        await get().loadOrganization(userOrgId);
    },

    clearTenant: () => {
        set({
            currentOrganization: null,
            organizationId: '',
            isMultiTenant: false,
            loading: false,
            error: null,
        });
    },
}));

/**
 * Hook: get the current organizationId for queries.
 * Returns empty string if not in multi-tenant mode (backward compatible).
 */
export const useOrganizationId = (): string => {
    return useTenantStore((s) => s.organizationId);
};
