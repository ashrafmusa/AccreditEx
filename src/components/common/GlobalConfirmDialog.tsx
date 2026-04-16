import { ExclamationTriangleIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirmStore } from "@/stores/useConfirmStore";
import React from "react";

/**
 * GlobalConfirmDialog — renders at the app root, driven by useConfirmStore.
 * Replaces window.confirm() for all destructive actions in AccrediTex.
 * Mount once in App.tsx; trigger from anywhere via useConfirmStore.getState().confirm().
 */
const GlobalConfirmDialog: React.FC = () => {
  const { open, title, message, confirmLabel, _onConfirm, _onCancel } =
    useConfirmStore();
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center backdrop-blur-sm"
      onClick={_onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-dark-brand-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={_onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={_onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalConfirmDialog;
