import AIResponseView from "@/components/ai/AIResponseView";
import { ClipboardDocumentListIcon, XMarkIcon } from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { aiResponseToPlainText } from "@/utils/aiResponse";
import React from "react";

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type?:
    | "action-plan"
    | "root-cause"
    | "improvements"
    | "risk-assessment"
    | "compliance-check"
    | "readiness-check";
  footer?: React.ReactNode;
}

const AISuggestionModal: React.FC<AISuggestionModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  type = "improvements",
  footer,
}) => {
  const toast = useToast();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(aiResponseToPlainText(content));
    toast.success(t("aiResponseCopied"));
  };

  const getIcon = () => {
    switch (type) {
      case "action-plan":
        return "📋";
      case "root-cause":
        return "🔍";
      case "improvements":
        return "💡";
      case "risk-assessment":
        return "⚠️";
      case "compliance-check":
        return "✅";
      case "readiness-check":
        return "🏁";
      default:
        return "🤖";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500/75 dark:bg-gray-900/75"
          onClick={onClose}
        />

        {/* Center modal */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-brand-surface dark:bg-dark-brand-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-linear-to-r from-rose-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getIcon()}</span>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <AIResponseView content={content} showDisclaimer />
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-between items-center border-t dark:border-gray-700">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              {t("aiResponseCopy")}
            </button>
            {footer ? (
              footer
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm bg-linear-to-r from-rose-600 to-cyan-600 text-white rounded-lg hover:from-pink-600 hover:to-cyan-700 transition-colors font-semibold"
              >
                {t("close")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionModal;
