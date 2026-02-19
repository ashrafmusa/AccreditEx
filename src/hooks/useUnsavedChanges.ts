/**
 * useUnsavedChanges Hook
 *
 * Provides beforeunload protection and a confirmation callback
 * to guard against accidental data loss when navigating away
 * from a form with unsaved changes.
 *
 * Usage:
 *   const { setDirty, confirmNavigation } = useUnsavedChanges();
 *   // Call setDirty(true) when form changes
 *   // Wrap navigation calls with confirmNavigation(() => navigate(...))
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface UseUnsavedChangesOptions {
    /** Custom confirmation message (browser may override for beforeunload) */
    message?: string;
    /** Whether protection is currently active (default: derived from dirty state) */
    enabled?: boolean;
}

interface UseUnsavedChangesReturn {
    /** Whether the form has unsaved changes */
    isDirty: boolean;
    /** Mark the form as dirty or clean */
    setDirty: (dirty: boolean) => void;
    /** Wrap a navigation action — shows confirm dialog if dirty, then executes */
    confirmNavigation: (onConfirm: () => void) => void;
    /** Reset dirty state (call after successful save) */
    markSaved: () => void;
}

export function useUnsavedChanges(
    options: UseUnsavedChangesOptions = {},
): UseUnsavedChangesReturn {
    const {
        message = "You have unsaved changes. Are you sure you want to leave?",
    } = options;

    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);
    const enabled = options.enabled ?? isDirty;

    // Keep ref in sync for the event handler
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    // ── beforeunload protection ───────────────────────────
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            // Modern browsers ignore custom messages, but returnValue must be set
            e.returnValue = message;
            return message;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [enabled, message]);

    // ── Navigation guard ──────────────────────────────────
    const confirmNavigation = useCallback(
        (onConfirm: () => void) => {
            if (!isDirtyRef.current) {
                onConfirm();
                return;
            }
            // Using window.confirm for maximum compatibility
            if (window.confirm(message)) {
                setIsDirty(false);
                onConfirm();
            }
        },
        [message],
    );

    const setDirty = useCallback((dirty: boolean) => {
        setIsDirty(dirty);
    }, []);

    const markSaved = useCallback(() => {
        setIsDirty(false);
    }, []);

    return {
        isDirty,
        setDirty,
        confirmNavigation,
        markSaved,
    };
}
