/**
 * KeyboardShortcutsModal Component
 * Displays all available keyboard shortcuts in a modal
 * Triggered by pressing '?' key
 */

import { XMarkIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      keys: ["g", "d"],
      description: t("goToDashboard"),
      category: t("navigation"),
    },
    {
      keys: ["g", "p"],
      description: t("goToProjects"),
      category: t("navigation"),
    },
    {
      keys: ["g", "a"],
      description: t("goToAccreditation"),
      category: t("navigation"),
    },
    {
      keys: ["g", "t"],
      description: t("goToTraining"),
      category: t("navigation"),
    },

    // Search & Commands
    {
      keys: ["/"],
      description: t("focusSearch"),
      category: t("searchAndCommands"),
    },
    {
      keys: ["Ctrl", "K"],
      description: t("openCommandPalette"),
      category: t("searchAndCommands"),
    },

    // Actions
    { keys: ["n"], description: t("newItem"), category: t("actions") },
    { keys: ["Ctrl", "S"], description: t("saveForm"), category: t("actions") },
    {
      keys: ["Ctrl", "Enter"],
      description: t("submitForm"),
      category: t("actions"),
    },
    { keys: ["Esc"], description: t("closeModal"), category: t("actions") },

    // Navigation within forms
    {
      keys: ["Tab"],
      description: t("nextField"),
      category: t("formNavigation"),
    },
    {
      keys: ["Shift", "Tab"],
      description: t("previousField"),
      category: t("formNavigation"),
    },

    // Help
    {
      keys: ["?"],
      description: t("showKeyboardShortcuts"),
      category: t("help"),
    },
  ];

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
      >
        <div
          className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto animate-[scaleIn_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2
              id="keyboard-shortcuts-title"
              className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary"
            >
              {t("keyboardShortcuts")}
            </h2>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-primary dark:text-dark-brand-text-secondary dark:hover:text-brand-primary transition-colors"
              aria-label={t("close")}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && (
                                <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mx-1">
                                  {shortcut.keys.length === 2 && i === 1
                                    ? "then"
                                    : "+"}
                                </span>
                              )}
                              <kbd className="px-2 py-1 text-xs font-semibold text-brand-text-primary dark:text-dark-brand-text-primary bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary text-center">
              {t("pressAnyKeyToClose")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsModal;
