/**
 * useTenantStore — Unit Tests
 *
 * Tests multi-tenancy store: org loading, state transitions, module resolution triggers.
 */
import { useTenantStore } from '@/stores/useTenantStore';

// Reset store between tests
beforeEach(() => {
    useTenantStore.getState().clearTenant();
});

describe('useTenantStore', () => {
    describe('initial state', () => {
        it('starts with null organization', () => {
            const state = useTenantStore.getState();
            expect(state.currentOrganization).toBeNull();
            expect(state.organizationId).toBe('');
            expect(state.isMultiTenant).toBe(false);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('setOrganization', () => {
        it('sets organization and extracts organizationId', () => {
            const org = {
                id: 'org-123',
                name: 'Test Hospital',
                type: 'hospital' as const,
                isActive: true,
                plan: 'professional' as const,
                createdAt: '2025-01-01',
            };
            useTenantStore.getState().setOrganization(org);
            const state = useTenantStore.getState();
            expect(state.currentOrganization).toEqual(org);
            expect(state.organizationId).toBe('org-123');
            expect(state.isMultiTenant).toBe(true);
        });

        it('handles null org (legacy mode)', () => {
            useTenantStore.getState().setOrganization(null as any);
            const state = useTenantStore.getState();
            expect(state.isMultiTenant).toBe(false);
        });
    });

    describe('clearTenant', () => {
        it('resets all state', () => {
            // Set org first
            useTenantStore.getState().setOrganization({
                id: 'org-123',
                name: 'Test',
                type: 'hospital',
                isActive: true,
                createdAt: '2025-01-01',
            } as any);

            // Clear
            useTenantStore.getState().clearTenant();
            const state = useTenantStore.getState();
            expect(state.currentOrganization).toBeNull();
            expect(state.organizationId).toBe('');
            expect(state.isMultiTenant).toBe(false);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });
});
