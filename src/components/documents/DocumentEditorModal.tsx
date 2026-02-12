import React, { useState, useEffect, useMemo } from "react";
import { AppDocument, Standard } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useSanitizedHTML } from "../../hooks/useSanitizedHTML";
import { XMarkIcon } from "../icons";
import DocumentEditorSidebar from "./DocumentEditorSidebar";
import RichTextEditor from "./RichTextEditor";
import DocumentVersionComparisonModal from "./DocumentVersionComparisonModal";
import { exportToDocx } from "../../services/docxExportService";

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
  standards: Standard[];
}

const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  document: documentData,
  onSave,
  standards,
}) => {
  const { t, lang, dir } = useTranslation();

  const [document, setDocument] = useState<AppDocument>(documentData);
  const [isEditMode, setIsEditMode] = useState(documentData.status === "Draft");
  const [viewingVersion, setViewingVersion] = useState<number | "current">(
    "current"
  );
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    version1: number | "current";
    version2: number | "current";
  }>({ isOpen: false, version1: "current", version2: "current" });

  useEffect(() => {
    setDocument(documentData);
    setIsEditMode(documentData.status === "Draft");
    setViewingVersion("current");
  }, [documentData, isOpen]);

  const currentContent = useMemo(() => {
    if (viewingVersion === "current") {
      return document.content;
    }
    const historyItem = document.versionHistory.find(
      (v) => v.version === viewingVersion
    );
    return historyItem ? historyItem.content : document.content;
  }, [document, viewingVersion]);

  const handleSave = () => {
    let docToSave = { ...document };
    if (document.status === "Approved" && isEditMode) {
      if (!window.confirm(t("newVersionPrompt"))) return;
      docToSave = {
        ...document,
        status: "Draft",
        currentVersion: document.currentVersion + 1,
        versionHistory: [
          ...document.versionHistory,
          {
            version: document.currentVersion,
            date: document.approvalDate || new Date().toISOString(),
            uploadedBy: document.approvedBy || "",
            content: documentData.content, // Save the old approved content
          },
        ],
      };
    }
    onSave(docToSave);
  };

  const canEdit = document.status === "Draft" || document.status === "Approved";

  const handleCompareVersions = (
    v1: number | "current",
    v2: number | "current"
  ) => {
    setComparisonModal({ isOpen: true, version1: v1, version2: v2 });
  };

  const handleExportToDocx = async () => {
    try {
      const fileName = `${document.name[lang]}_v${document.currentVersion}.docx`;
      await exportToDocx(currentContent[lang] || "", { fileName });
    } catch (error) {
      console.error("Failed to export document:", error);
      alert("Failed to export document to DOCX format");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-7xl h-[90vh] m-4 flex flex-col modal-content-enter"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold dark:text-dark-brand-text-primary">
              {document.name[lang]}
            </h3>
            <p className="text-sm text-gray-500">
              v{document.currentVersion} -{" "}
              {t(
                (document.status.charAt(0).toLowerCase() +
                  document.status.slice(1).replace(" ", "")) as any
              )}
            </p>
          </div>
<<<<<<< HEAD
          <button
            onClick={onClose}
            className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
=======
          <div className="flex items-center gap-2">
            {isEditMode && viewingVersion === "current" && (
              <button
                onClick={() => setTemplateGalleryOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Templates
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
>>>>>>> d4dbbd0 (fix: Purple Ban compliance - automated bulk replacement of purple/indigo colors)
        </header>

        <main className="flex-grow flex overflow-hidden">
          <div className="flex-grow p-6 overflow-y-auto">
            {viewingVersion !== "current" && (
              <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-4 text-sm">
                {t("preview")} v{viewingVersion}.{" "}
                <button
                  onClick={() => setViewingVersion("current")}
                  className="font-semibold underline"
                >
                  {t("backToCurrent")}
                </button>
              </div>
            )}

            {isEditMode && viewingVersion === "current" ? (
              <RichTextEditor
                content={document.content[lang] || ""}
                onChange={(html) =>
                  setDocument((d) => ({
                    ...d,
                    content: { ...d.content, [lang]: html },
                  }))
                }
                editable={true}
                placeholder={t("startTyping") || "Start typing..."}
              />
            ) : (
              <SanitizedDocContent content={currentContent[lang] || ""} />
            )}
          </div>
          <DocumentEditorSidebar
            document={document}
            setDocument={setDocument}
            standards={standards}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            canEdit={canEdit}
            viewingVersion={viewingVersion}
            setViewingVersion={setViewingVersion}
            onCompareVersions={handleCompareVersions}
          />
        </main>

        <footer className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end items-center space-x-3 rtl:space-x-reverse border-t dark:border-dark-brand-border shrink-0">
          <button
            type="button"
            onClick={handleExportToDocx}
            className="inline-flex justify-center py-2 px-4 rounded-md text-sm font-medium text-brand-primary hover:bg-sky-50 dark:hover:bg-sky-900/20 border border-brand-primary"
          >
            {t("exportToDocx") || "Export to DOCX"}
          </button>
          {document.status === "Draft" && (
            <button type="button" className="text-sm font-medium">
              {t("requestApproval")}
            </button>
          )}
          {isEditMode && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-sky-700"
            >
              {t("saveChanges")}
            </button>
          )}
        </footer>
      </div>

      {/* Version Comparison Modal */}
      <DocumentVersionComparisonModal
        isOpen={comparisonModal.isOpen}
        onClose={() =>
          setComparisonModal((prev) => ({ ...prev, isOpen: false }))
        }
        document={document}
        version1={comparisonModal.version1}
        version2={comparisonModal.version2}
      />
    </div>
  );
};

// Helper component to render sanitized HTML
const SanitizedDocContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useSanitizedHTML(content);
  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default DocumentEditorModal;
