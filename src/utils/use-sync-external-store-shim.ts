/**
 * Compatibility shim for use-sync-external-store/shim/with-selector
 * 
 * Problem: The use-sync-external-store package uses CommonJS exports (module.exports),
 * but Vite treats imports as ES modules, causing a mismatch when Recharts/Zustand tries to
 * destructure named exports from the module.
 * 
 * Solution: Directly import and re-export from the actual implementation files.
 * The shim/with-selector.js redirects to cjs/use-sync-external-store-shim/with-selector.development.js
 */

// @ts-nocheck
// Import React's useSyncExternalStore from the shim
import { useSyncExternalStore } from 'use-sync-external-store/shim';

// Import React hooks we need
import { useRef, useEffect, useMemo, useDebugValue } from 'react';

// Polyfill for Object.is
const objectIs = typeof Object.is === 'function' ? Object.is : (x: any, y: any) => {
    return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
};

/**
 * Re-implementation of useSyncExternalStoreWithSelector based on React's source
 * From: use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
 */
export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot,
    getServerSnapshot: undefined | null | (() => Snapshot),
    selector: (snapshot: Snapshot) => Selection,
    isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
    const instRef = useRef<any>(null);

    if (instRef.current === null) {
        instRef.current = { hasValue: false, value: null };
    }

    const inst = instRef.current;

    const [getSelection, getServerSelection] = useMemo(() => {
        let hasMemo = false;
        let memoizedSnapshot: Snapshot;
        let memoizedSelection: Selection;

        const memoizedSelector = (nextSnapshot: Snapshot) => {
            if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                const nextSelection = selector(nextSnapshot);

                if (isEqual !== undefined && inst.hasValue) {
                    const currentSelection = inst.value;
                    if (isEqual(currentSelection, nextSelection)) {
                        memoizedSelection = currentSelection;
                        return currentSelection;
                    }
                }

                memoizedSelection = nextSelection;
                return nextSelection;
            }

            const prevSnapshot = memoizedSnapshot;
            const prevSelection = memoizedSelection;

            if (objectIs(prevSnapshot, nextSnapshot)) {
                return prevSelection;
            }

            const nextSelection = selector(nextSnapshot);

            if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
                return prevSelection;
            }

            memoizedSnapshot = nextSnapshot;
            memoizedSelection = nextSelection;
            return nextSelection;
        };

        const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
        const getServerSnapshotWithSelector =
            getServerSnapshot === null || getServerSnapshot === undefined
                ? undefined
                : () => memoizedSelector(getServerSnapshot());

        return [getSnapshotWithSelector, getServerSnapshotWithSelector];
    }, [getSnapshot, getServerSnapshot, selector, isEqual]);

    const value = useSyncExternalStore(subscribe, getSelection, getServerSelection);

    useEffect(() => {
        inst.hasValue = true;
        inst.value = value;
    }, [value]);

    useDebugValue(value);

    return value;
}
