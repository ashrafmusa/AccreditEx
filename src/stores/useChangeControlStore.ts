/**
 * Change Control Store
 * Zustand store for managing change control state and actions
 */

import {
    addApproval,
    createChangeRequest,
    deleteChangeRequest,
    getChangeMetrics,
    getChangeRequest,
    getChangeRequests,
    recordImplementation,
    recordVerification,
    submitForApproval,
    updateChangeRequest,
    updateImpact,
} from '@/services/changeControlService';
import {
    ApprovalRecord,
    ChangeImpact,
    ChangeMetrics,
    ChangePriority,
    ChangeRequest,
    ChangeStatus,
    ImplementationRecord,
    VerificationRecord,
} from '@/types/changeControl';
import { create } from 'zustand';

interface ChangeControlFilters {
    status?: ChangeStatus;
    priority?: ChangePriority;
    search?: string;
}

interface ChangeControlStore {
    // State
    requests: ChangeRequest[];
    currentRequest: ChangeRequest | null;
    metrics: ChangeMetrics | null;
    loading: boolean;
    error: string | null;
    filters: ChangeControlFilters;

    // Actions
    fetchAllRequests: () => Promise<void>;
    fetchRequest: (id: string) => Promise<void>;
    setCurrentRequest: (request: ChangeRequest | null) => void;
    createRequest: (request: Omit<ChangeRequest, 'id' | 'auditTrail' | 'createdAt' | 'updatedAt'>, userId: string) => Promise<void>;
    updateRequest: (id: string, updates: Partial<ChangeRequest>, userId: string) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
    submitRequest: (id: string, requiredApprovals: number, userId: string) => Promise<void>;
    addApprovalRecord: (requestId: string, approval: Omit<ApprovalRecord, 'id' | 'dateSubmitted'>, userId: string) => Promise<void>;
    updateRequestImpact: (requestId: string, impact: ChangeImpact, userId: string) => Promise<void>;
    recordImpl: (requestId: string, impl: Omit<ImplementationRecord, 'id' | 'dateCompleted'>, userId: string) => Promise<void>;
    recordVerify: (requestId: string, verify: Omit<VerificationRecord, 'id' | 'dateVerified'>, userId: string) => Promise<void>;
    fetchMetrics: () => Promise<void>;
    setFilters: (filters: ChangeControlFilters) => void;
    clearError: () => void;
}

export const useChangeControlStore = create<ChangeControlStore>((set) => ({
    // Initial state
    requests: [],
    currentRequest: null,
    metrics: null,
    loading: false,
    error: null,
    filters: {},

    // Fetch all requests with filters
    fetchAllRequests: async () => {
        set({ loading: true, error: null });
        try {
            const state = (useChangeControlStore as any).getState();
            const requests = await getChangeRequests(state.filters);
            set({ requests, loading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch requests';
            set({ error: message, loading: false });
        }
    },

    // Fetch single request
    fetchRequest: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const request = await getChangeRequest(id);
            if (request) {
                set({ currentRequest: request, loading: false });
            } else {
                set({ error: 'Request not found', loading: false });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch request';
            set({ error: message, loading: false });
        }
    },

    // Set current request (for detail view)
    setCurrentRequest: (request) => {
        set({ currentRequest: request });
    },

    // Create new request
    createRequest: async (request, userId) => {
        set({ loading: true, error: null });
        try {
            const newRequest = await createChangeRequest(request, userId);
            set((state) => ({
                requests: [newRequest, ...state.requests],
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create request';
            set({ error: message, loading: false });
        }
    },

    // Update request
    updateRequest: async (id, updates, userId) => {
        set({ loading: true, error: null });
        try {
            await updateChangeRequest(id, updates, userId);
            set((state) => ({
                requests: state.requests.map((r) => (r.id === id ? { ...r, ...updates } : r)),
                currentRequest: state.currentRequest?.id === id ? { ...state.currentRequest, ...updates } : state.currentRequest,
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update request';
            set({ error: message, loading: false });
        }
    },

    // Delete request
    deleteRequest: async (id) => {
        set({ loading: true, error: null });
        try {
            await deleteChangeRequest(id);
            set((state) => ({
                requests: state.requests.filter((r) => r.id !== id),
                currentRequest: state.currentRequest?.id === id ? null : state.currentRequest,
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete request';
            set({ error: message, loading: false });
        }
    },

    // Submit for approval
    submitRequest: async (id, requiredApprovals, userId) => {
        set({ loading: true, error: null });
        try {
            await submitForApproval(id, requiredApprovals, userId);
            set((state) => ({
                requests: state.requests.map((r) =>
                    r.id === id ? { ...r, status: 'submitted' as ChangeStatus, requiredApprovals } : r
                ),
                currentRequest: state.currentRequest?.id === id
                    ? { ...state.currentRequest, status: 'submitted' as ChangeStatus, requiredApprovals }
                    : state.currentRequest,
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit request';
            set({ error: message, loading: false });
        }
    },

    // Add approval
    addApprovalRecord: async (requestId, approval, userId) => {
        set({ loading: true, error: null });
        try {
            await addApproval(requestId, approval, userId);
            set((state) => ({
                requests: state.requests.map((r) =>
                    r.id === requestId ? { ...r, approvals: [...(r.approvals || []), { ...approval, id: `approval-${Date.now()}`, dateSubmitted: new Date() }] } : r
                ),
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add approval';
            set({ error: message, loading: false });
        }
    },

    // Update impact analysis
    updateRequestImpact: async (requestId, impact, userId) => {
        set({ loading: true, error: null });
        try {
            await updateImpact(requestId, impact, userId);
            set((state) => ({
                requests: state.requests.map((r) => (r.id === requestId ? { ...r, impact } : r)),
                currentRequest: state.currentRequest?.id === requestId ? { ...state.currentRequest, impact } : state.currentRequest,
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update impact';
            set({ error: message, loading: false });
        }
    },

    // Record implementation
    recordImpl: async (requestId, impl, userId) => {
        set({ loading: true, error: null });
        try {
            await recordImplementation(requestId, impl, userId);
            set((state) => ({
                requests: state.requests.map((r) =>
                    r.id === requestId ? { ...r, status: 'implemented' as ChangeStatus, implementation: { ...impl, id: `impl-${Date.now()}`, dateCompleted: new Date() } } : r
                ),
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to record implementation';
            set({ error: message, loading: false });
        }
    },

    // Record verification
    recordVerify: async (requestId, verify, userId) => {
        set({ loading: true, error: null });
        try {
            await recordVerification(requestId, verify, userId);
            set((state) => ({
                requests: state.requests.map((r) =>
                    r.id === requestId ? { ...r, verification: { ...verify, id: `verify-${Date.now()}`, dateVerified: new Date() } } : r
                ),
                loading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to record verification';
            set({ error: message, loading: false });
        }
    },

    // Fetch metrics
    fetchMetrics: async () => {
        set({ loading: true, error: null });
        try {
            const metrics = await getChangeMetrics();
            set({ metrics, loading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch metrics';
            set({ error: message, loading: false });
        }
    },

    // Set filters
    setFilters: (filters) => {
        set({ filters });
    },

    // Clear error
    clearError: () => {
        set({ error: null });
    },
}));
