import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { DocumentPlusIcon, SparklesIcon } from "../icons";

interface DocumentEmptyStateProps {
  onCreateBlank?: () => void;
  onCreateAI?: () => void;
  onUpload?: () => void;
}

/**
 * Empty state component shown when no documents match current filters
 * Guides users to create their first document or adjust filters
 */
const DocumentEmptyState: React.FC<DocumentEmptyStateProps> = ({
  onCreateBlank,
  onCreateAI,
  onUpload,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center py-12 px-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <DocumentPlusIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Heading */}
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t("noDocumentsFound") || "No documents found"}
        </h3>

        {/* Description */}
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-6">
          {t("noDocumentsDesc") ||
            "Get started by creating your first policy, procedure, or uploading a document."}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* AI Generation Button (Primary) */}
          {onCreateAI && (
            <button
              onClick={onCreateAI}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              {t("generateWithAI") || "Generate with AI"}
            </button>
          )}

          {/* Create Blank Button (Secondary) */}
          {onCreateBlank && (
            <button
              onClick={onCreateBlank}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-brand-text-primary dark:text-dark-brand-text-primary rounded-lg font-medium transition-colors"
            >
              <DocumentPlusIcon className="w-4 h-4" />
              {t("createBlankDocument") || "Create blank document"}
            </button>
          )}

          {/* Upload Button (Tertiary) */}
          {onUpload && (
            <button
              onClick={onUpload}
              className="w-full px-4 py-2.5 text-brand-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors border border-brand-primary/20"
            >
              {t("uploadFile") || "Upload file"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEmptyState;
