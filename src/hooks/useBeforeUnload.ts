/**
 * useBeforeUnload Hook
 * 
 * Simple hook that prevents the browser from closing/refreshing
 * when there are unsaved changes. Pass a boolean condition — when
 * true, the browser will show a "Leave site?" confirmation dialog.
 * 
 * Usage:
 *   useBeforeUnload(hasChanges);
 */

import { useEffect, useRef } from "react";

export function useBeforeUnload(shouldPrevent: boolean): void {
    const ref = useRef(shouldPrevent);

    useEffect(() => {
        ref.current = shouldPrevent;
    }, [shouldPrevent]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!ref.current) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);
}
