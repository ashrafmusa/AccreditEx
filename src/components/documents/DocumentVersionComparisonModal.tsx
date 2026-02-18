import React, { useMemo, useEffect, useCallback } from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useSanitizedHTML } from "../../hooks/useSanitizedHTML";
import { XMarkIcon } from "../icons";

interface DocumentVersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  version1: number | "current";
  version2: number | "current";
}

const DocumentVersionComparisonModal: React.FC<
  DocumentVersionComparisonModalProps
> = ({ isOpen, onClose, document, version1, version2 }) => {
  const { t, lang, dir } = useTranslation();

  const getVersionContent = (version: number | "current") => {
    if (version === "current") {
      return {
        version: document.currentVersion,
        content: document.content,
        date: document.approvalDate || document.uploadedAt,
        label: t("currentVersion") || "Current Version",
      };
    }
    const historyItem = document.versionHistory?.find(
      (v) => v.version === version,
    );
    return {
      version: version,
      content: historyItem?.content || document.content,
      date: historyItem?.date || "",
      label: `${t("version") || "Version"} ${version}`,
    };
  };

  const leftVersion = useMemo(
    () => getVersionContent(version1),
    [version1, document],
  );
  const rightVersion = useMemo(
    () => getVersionContent(version2),
    [version2, document],
  );

  // Escape key handler
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleEscapeKey);
      return () => window.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-comparison-modal-title"
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-7xl h-[90vh] m-4 flex flex-col modal-content-enter"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center flex-shrink-0">
          <div>
            <h3
              id="version-comparison-modal-title"
              className="text-xl font-semibold dark:text-dark-brand-text-primary"
            >
              {t("compareVersions") || "Compare Versions"}:{" "}
              {document.name[lang]}
            </h3>
            <p className="text-sm text-gray-500">
              {t("sideBySideComparison") || "Side-by-side comparison"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t("close") || "Close"}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Content - Side by Side */}
        <main className="flex-grow flex overflow-hidden">
          {/* Left Version */}
          <div className="flex-1 flex flex-col border-e dark:border-dark-brand-border">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b dark:border-dark-brand-border">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                {leftVersion.label} (v{leftVersion.version})
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {new Date(leftVersion.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <SanitizedVersionContent
                content={
                  (leftVersion.content && leftVersion.content[lang]) || ""
                }
              />
            </div>
          </div>

          {/* Right Version */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border-b dark:border-dark-brand-border">
              <h4 className="font-semibold text-green-900 dark:text-green-300">
                {rightVersion.label} (v{rightVersion.version})
              </h4>
              <p className="text-xs text-green-700 dark:text-green-400">
                {new Date(rightVersion.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <SanitizedVersionContent
                content={
                  (rightVersion.content && rightVersion.content[lang]) || ""
                }
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end items-center border-t dark:border-dark-brand-border flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex justify-center py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
          >
            {t("close") || "Close"}
          </button>
        </footer>
      </div>
    </div>
  );
};

// Helper component to render sanitized HTML
const SanitizedVersionContent: React.FC<{ content: string }> = ({
  content,
}) => {
  const sanitizedContent = useSanitizedHTML(content);
  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default DocumentVersionComparisonModal;
