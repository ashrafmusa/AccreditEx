import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  importDocxFile,
  validateDocxFile,
} from "@/services/documentImportService";
import React, { useRef, useState } from "react";
import {
  CheckCircleIcon,
  DocumentArrowUpIcon,
  SpinnerIcon,
  XMarkIcon,
} from "../icons";

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (content: string, name: string) => void;
}

const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<{
    fileName: string;
    title: string;
    summary: string;
    wordCount: number;
    html: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    const validation = validateDocxFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importDocxFile(file);
      setPreview({
        fileName: file.name,
        title: result.metadata.title,
        summary: result.metadata.summary,
        wordCount: result.metadata.wordCount,
        html: result.html,
      });
      toast.success(t("fileImported") || "File imported successfully");
    } catch (error) {
      console.error("Import failed:", error);
      toast.error((error as Error).message || "Failed to import document");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = () => {
    if (!preview) return;
    onImportComplete(preview.html, preview.title);
    handleClose();
  };

  const handleClose = () => {
    setPreview(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        dir={document.dir}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b dark:border-dark-brand-border flex items-center justify-between bg-white dark:bg-dark-brand-surface">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("importDocument") || "Import Document"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t("close") || "Close"}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!preview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <DocumentArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t("dragDropDocx") || "Drag and drop your DOCX file here"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t("docxFormatInfo") ||
                  "Supports Microsoft Word (.docx) documents up to 10 MB"}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-sky-700 transition-colors"
              >
                {t("selectFile") || "Select File"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success indicator */}
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-200">
                    {t("importSuccessful") || "Import Successful"}
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                    {preview.fileName}
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("title") || "Title"}
                </label>
                <input
                  type="text"
                  value={preview.title}
                  onChange={(e) =>
                    setPreview({ ...preview, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("summary") || "Summary"}
                </label>
                <textarea
                  value={preview.summary}
                  onChange={(e) =>
                    setPreview({ ...preview, summary: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("preview") || "Preview"}
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div
                    className="prose dark:prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: preview.html.substring(0, 1000),
                    }}
                  />
                  {preview.html.length > 1000 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t("documentTruncated") ||
                        "...[Content truncated for preview]"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>📊 {preview.wordCount} words</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t dark:border-dark-brand-border bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t("cancel") || "Cancel"}
          </button>
          {preview && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isImporting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {t("importAndEdit") || "Import & Edit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentImportModal;
