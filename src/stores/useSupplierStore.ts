/**
 * Supplier Store
 * Zustand store for managing supplier state
 */

import { handleError } from '@/services/errorHandling';
import { logger } from '@/services/logger';
import * as supplierService from '@/services/supplierService';
import { NonConformance, RiskLevel, Supplier, SupplierAudit, SupplierMetrics, VendorScorecard } from '@/types/supplier';
import { create } from 'zustand';

interface SupplierState {
    suppliers: Supplier[];
    currentSupplier: Supplier | null;
    metrics: SupplierMetrics | null;
    loading: boolean;
    error: string | null;
    unsubscribe: (() => void) | null;
    filters: {
        status?: string;
        riskLevel?: RiskLevel;
        search?: string;
    };

    // Actions
    fetchAllSuppliers: () => Promise<void>;
    fetchSupplier: (supplierId: string) => Promise<void>;
    setCurrentSupplier: (supplier: Supplier | null) => void;
    createSupplier: (supplierData: Omit<Supplier, 'id'>, userId: string) => Promise<Supplier>;
    updateSupplier: (supplier: Supplier, userId: string) => Promise<void>;
    deleteSupplier: (supplierId: string) => Promise<void>;
    updateSupplierScorecard: (supplierId: string, scorecard: VendorScorecard, userId: string) => Promise<void>;
    createSupplierAudit: (supplierId: string, audit: Omit<SupplierAudit, 'id'>, userId: string) => Promise<void>;
    createNonConformance: (supplierId: string, nc: Omit<NonConformance, 'id'>, userId: string) => Promise<void>;
    fetchMetrics: () => Promise<void>;
    setFilters: (filters: SupplierState['filters']) => void;
    clearError: () => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
    suppliers: [],
    currentSupplier: null,
    metrics: null,
    loading: false,
    error: null,
    unsubscribe: null,
    filters: {},

    fetchAllSuppliers: async () => {
        try {
            set({ loading: true, error: null });
            const state = (useSupplierStore.getState() as SupplierState);
            const suppliers = await supplierService.getSuppliers(state.filters);
            set({ suppliers, loading: false });
            logger.info(`Fetched ${suppliers.length} suppliers`);
        } catch (error) {
            const appError = handleError(error, 'Failed to fetch suppliers');
            set({ error: appError, loading: false });
            logger.error('fetchAllSuppliers error:', appError);
        }
    },

    fetchSupplier: async (supplierId: string) => {
        try {
            set({ loading: true, error: null });
            const supplier = await supplierService.getSupplier(supplierId);
            if (supplier) {
                set({ currentSupplier: supplier, loading: false });
                logger.info(`Fetched supplier: ${supplierId}`);
            } else {
                set({ error: 'Supplier not found', loading: false });
            }
        } catch (error) {
            const appError = handleError(error, 'Failed to fetch supplier');
            set({ error: appError, loading: false });
            logger.error('fetchSupplier error:', appError);
        }
    },

    setCurrentSupplier: (supplier: Supplier | null) => {
        set({ currentSupplier: supplier });
    },

    createSupplier: async (supplierData: Omit<Supplier, 'id'>, userId: string) => {
        try {
            const supplier = await supplierService.createSupplier(supplierData, userId);
            set((state) => ({
                suppliers: [supplier, ...state.suppliers],
            }));
            logger.info(`Supplier created: ${supplier.id}`);
            return supplier;
        } catch (error) {
            const appError = handleError(error, 'Failed to create supplier');
            set({ error: appError });
            logger.error('createSupplier error:', appError);
            throw appError;
        }
    },

    updateSupplier: async (supplier: Supplier, userId: string) => {
        try {
            await supplierService.updateSupplier(supplier, userId);
            set((state) => ({
                suppliers: state.suppliers.map((s) => (s.id === supplier.id ? supplier : s)),
                currentSupplier: state.currentSupplier?.id === supplier.id ? supplier : state.currentSupplier,
            }));
            logger.info(`Supplier updated: ${supplier.id}`);
        } catch (error) {
            const appError = handleError(error, 'Failed to update supplier');
            set({ error: appError });
            logger.error('updateSupplier error:', appError);
            throw appError;
        }
    },

    deleteSupplier: async (supplierId: string) => {
        try {
            await supplierService.deleteSupplier(supplierId);
            set((state) => ({
                suppliers: state.suppliers.filter((s) => s.id !== supplierId),
                currentSupplier: state.currentSupplier?.id === supplierId ? null : state.currentSupplier,
            }));
            logger.info(`Supplier deleted: ${supplierId}`);
        } catch (error) {
            const appError = handleError(error, 'Failed to delete supplier');
            set({ error: appError });
            logger.error('deleteSupplier error:', appError);
            throw appError;
        }
    },

    updateSupplierScorecard: async (supplierId: string, scorecard: VendorScorecard, userId: string) => {
        try {
            await supplierService.updateSupplierScorecard(supplierId, scorecard, userId);
            set((state) => ({
                suppliers: state.suppliers.map((s) =>
                    s.id === supplierId ? { ...s, scorecard } : s
                ),
                currentSupplier:
                    state.currentSupplier?.id === supplierId
                        ? { ...state.currentSupplier, scorecard }
                        : state.currentSupplier,
            }));
            logger.info(`Supplier scorecard updated: ${supplierId}`);
        } catch (error) {
            const appError = handleError(error, 'Failed to update scorecard');
            set({ error: appError });
            logger.error('updateSupplierScorecard error:', appError);
            throw appError;
        }
    },

    createSupplierAudit: async (supplierId: string, audit: Omit<SupplierAudit, 'id'>, userId: string) => {
        try {
            await supplierService.createSupplierAudit(supplierId, audit, userId);
            // Refetch supplier to get updated audit history
            const supplier = await supplierService.getSupplier(supplierId);
            if (supplier) {
                set((state) => ({
                    suppliers: state.suppliers.map((s) => (s.id === supplierId ? supplier : s)),
                    currentSupplier: state.currentSupplier?.id === supplierId ? supplier : state.currentSupplier,
                }));
            }
            logger.info(`Supplier audit created for: ${supplierId}`);
        } catch (error) {
            const appError = handleError(error, 'Failed to create supplier audit');
            set({ error: appError });
            logger.error('createSupplierAudit error:', appError);
            throw appError;
        }
    },

    createNonConformance: async (supplierId: string, nc: Omit<NonConformance, 'id'>, userId: string) => {
        try {
            await supplierService.createNonConformance(supplierId, nc, userId);
            // Refetch supplier to get updated non-conformance list
            const supplier = await supplierService.getSupplier(supplierId);
            if (supplier) {
                set((state) => ({
                    suppliers: state.suppliers.map((s) => (s.id === supplierId ? supplier : s)),
                    currentSupplier: state.currentSupplier?.id === supplierId ? supplier : state.currentSupplier,
                }));
            }
            logger.info(`Non-conformance created for: ${supplierId}`);
        } catch (error) {
            const appError = handleError(error, 'Failed to create non-conformance');
            set({ error: appError });
            logger.error('createNonConformance error:', appError);
            throw appError;
        }
    },

    fetchMetrics: async () => {
        try {
            const metrics = await supplierService.getSupplierMetrics();
            set({ metrics });
            logger.info('Supplier metrics fetched');
        } catch (error) {
            const appError = handleError(error, 'Failed to fetch metrics');
            set({ error: appError });
            logger.error('fetchMetrics error:', appError);
        }
    },

    setFilters: (filters: SupplierState['filters']) => {
        set({ filters });
    },

    clearError: () => {
        set({ error: null });
    },
}));
