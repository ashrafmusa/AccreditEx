import React from "react";
import { XMarkIcon } from "../icons";
import DOCXViewer from "./DOCXViewer";
import { useTranslation } from "@/hooks/useTranslation";

interface DOCXViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const DOCXViewerModal: React.FC<DOCXViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-6xl h-[90vh] m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("wordDocumentViewer") || "Word Document Viewer"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-brand-primary hover:bg-sky-50 dark:hover:bg-sky-900/20 border border-brand-primary rounded-md transition-colors"
            >
              {t("download") || "Download"}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={t("close") || "Close"}
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* DOCX Content */}
        <div className="flex-1 overflow-auto">
          <DOCXViewer fileUrl={fileUrl} className="h-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("docxConversionNote") ||
              "This document has been converted from DOCX format for viewing. Download for full formatting."}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-sky-700 rounded-md transition-colors"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DOCXViewerModal;
