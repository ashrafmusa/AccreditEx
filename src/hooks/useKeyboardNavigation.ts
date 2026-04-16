import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description?: string;
}

type ShortcutMap = Record<string, () => void>;

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[] | ShortcutMap, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Normalize object shorthand to array format
    const normalizedShortcuts: KeyboardShortcut[] = Array.isArray(shortcuts)
      ? shortcuts
      : Object.entries(shortcuts).map(([key, handler]) => ({ key, handler }));

    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      if (target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) {
        return true;
      }
      return false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Never intercept native browser shortcuts (Ctrl/Cmd + C/V/X/A/Z/Y/F/P/R/W/T).
      // These must always reach the browser regardless of registered shortcuts.
      const NATIVE_CTRL_KEYS = new Set(['c', 'v', 'x', 'a', 'z', 'y', 'f', 'p', 'r', 'w', 't']);
      if ((event.ctrlKey || event.metaKey) && NATIVE_CTRL_KEYS.has(event.key.toLowerCase())) {
        return;
      }

      // Do not hijack typing in form fields with single-key shortcuts.
      if (isEditableTarget(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        return;
      }

      for (const shortcut of normalizedShortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, enabled = true) => {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown as EventListener);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [containerRef, enabled]);
};
