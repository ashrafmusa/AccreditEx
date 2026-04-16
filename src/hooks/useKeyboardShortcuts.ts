import { useEffect } from "react";

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    handler: () => void;
    description?: string;
}

/**
 * Hook for registering keyboard shortcuts
 * Usage: useKeyboardShortcuts([
 *   { key: 'n', ctrlKey: true, handler: () => createDocument(), description: 'Create new document' }
 * ])
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Never intercept native browser shortcuts (Ctrl/Cmd + C/V/X/A/Z/Y/F/P/R/W/T).
            const NATIVE_CTRL_KEYS = new Set(['c', 'v', 'x', 'a', 'z', 'y', 'f', 'p', 'r', 'w', 't']);
            if ((event.ctrlKey || event.metaKey) && NATIVE_CTRL_KEYS.has(event.key.toLowerCase())) {
                return;
            }

            for (const shortcut of shortcuts) {
                const matches =
                    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    (shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
                    (shortcut.shiftKey ? event.shiftKey : !event.shiftKey) &&
                    (shortcut.altKey ? event.altKey : !event.altKey);

                if (matches) {
                    event.preventDefault();
                    shortcut.handler();
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shortcuts]);
}

/**
 * Persist UI state preferences to localStorage
 */
export function getUIPreference<T>(key: string, defaultValue: T): T {
    try {
        const saved = localStorage.getItem(`accreditex_ui_${key}`);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch {
        return defaultValue;
    }
}

export function setUIPreference<T>(key: string, value: T): void {
    try {
        localStorage.setItem(`accreditex_ui_${key}`, JSON.stringify(value));
    } catch {
        console.warn(`Failed to save UI preference: ${key}`);
    }
}

/**
 * Add missing i18n translation keys to locales
 * Call this to ensure all new keys are available
 */
export const ENHANCED_TRANSLATION_KEYS = {
    // Empty state
    noDocumentsFound: "noDocumentsFound",
    noDocumentsDesc: "noDocumentsDesc",
    generateWithAI: "generateWithAI",
    createBlankDocument: "createBlankDocument",

    // Compliance scoring
    complianceScore: "complianceScore",
    structure: "structure",
    complianceLanguage: "complianceLanguage",
    readability: "readability",
    wordCount: "wordCount",
    readingTime: "readingTime",
    sections: "sections",
    missingRequiredSections: "missingRequiredSections",
    improvementTips: "improvementTips",

    // Document relationships
    relatedDocuments: "relatedDocuments",
    addRelationship: "addRelationship",
    implements: "implements",
    references: "references",
    supersedes: "supersedes",
    relatedTo: "relatedTo",
    selectDocument: "selectDocument",
    noRelatedDocuments: "noRelatedDocuments",
    versionHistory: "versionHistory",
    editedBy: "editedBy",
    viewVersion: "viewVersion",

    // Keyboard shortcuts
    keyboardShortcuts: "keyboardShortcuts",
    newDocument: "newDocument",
    searchDocuments: "searchDocuments",
    closeModal: "closeModal",
};
