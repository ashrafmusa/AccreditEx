/**
 * Global Confirm Dialog Store
 *
 * Provides an imperative async API for confirming destructive actions,
 * replacing window.confirm() across the entire app.
 *
 * Usage (anywhere — component or service):
 *   import { useConfirmStore } from '@/stores/useConfirmStore';
 *   const ok = await useConfirmStore.getState().confirm('Delete this item?');
 *   if (ok) { ... }
 */

import { create } from 'zustand';

interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    /** Internal: resolves the pending Promise when the user responds */
    _resolve: ((value: boolean) => void) | null;

    /**
     * Show a confirm dialog and return a Promise that resolves to true (confirmed)
     * or false (cancelled/dismissed).
     */
    confirm: (message: string, title?: string, confirmLabel?: string) => Promise<boolean>;
    _onConfirm: () => void;
    _onCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    _resolve: null,

    confirm: (message, title = 'Confirm Action', confirmLabel = 'Confirm') => {
        return new Promise<boolean>((resolve) => {
            set({ open: true, message, title, confirmLabel, _resolve: resolve });
        });
    },

    _onConfirm: () => {
        get()._resolve?.(true);
        set({ open: false, _resolve: null });
    },

    _onCancel: () => {
        get()._resolve?.(false);
        set({ open: false, _resolve: null });
    },
}));
