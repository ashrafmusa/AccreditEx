import React from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  getFileTypeIcon,
  formatFileSize,
  getFileExtension,
} from "../../utils/fileTypeHelper";
import {
  canViewDocument,
  canDownloadDocument,
  getDocumentDisplayName,
} from "../../utils/documentViewingHelper";
import { EyeIcon, DownloadIcon, XMarkIcon } from "../icons";

interface DocumentListItemProps {
  document: AppDocument;
  onView?: (doc: AppDocument) => void;
  onDownload?: (doc: AppDocument) => void;
  onRemove?: (docId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  showStatus?: boolean;
  showFileInfo?: boolean;
}

const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  onView,
  onDownload,
  onRemove,
  showActions = true,
  compact = false,
  showStatus = true,
  showFileInfo = true,
}) => {
  const { t, lang } = useTranslation();

  const displayName = getDocumentDisplayName(document, lang);
  const fileIcon = getFileTypeIcon(document);
  const fileExtension = document.fileUrl
    ? getFileExtension(document.fileUrl)
    : null;

  const statusColors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    "Pending Review":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    Approved:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    Archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  const handleView = () => {
    if (onView && canViewDocument(document)) {
      onView(document);
    }
  };

  const handleDownload = () => {
    if (onDownload && canDownloadDocument(document)) {
      onDownload(document);
    } else if (document.fileUrl) {
      // Default download behavior
      const link = window.document.createElement("a");
      link.href = document.fileUrl;
      link.download = displayName;
      link.click();
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(document.id);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{fileIcon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {displayName}
          </span>
          {fileExtension && (
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase flex-shrink-0">
              {fileExtension}
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {canViewDocument(document) && onView && (
              <button
                onClick={handleView}
                className="p-1.5 text-gray-600 hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary transition-colors"
                title={t("view") || "View"}
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            {canDownloadDocument(document) && (
              <button
                onClick={handleDownload}
                className="p-1.5 text-gray-600 hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary transition-colors"
                title={t("download") || "Download"}
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={handleRemove}
                className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title={t("remove") || "Remove"}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="text-3xl flex-shrink-0">{fileIcon}</span>

        <div className="flex-1 min-w-0">
          <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
            {displayName}
          </h4>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t(document.type.toLowerCase()) || document.type}
            </span>

            {fileExtension && showFileInfo && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded uppercase">
                {fileExtension}
              </span>
            )}

            {showStatus && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${statusColors[document.status]}`}
              >
                {t(document.status.toLowerCase().replace(" ", "_")) ||
                  document.status}
              </span>
            )}
          </div>

          {showFileInfo && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {t("version") || "Version"}: {document.currentVersion}
              </span>
              <span>•</span>
              <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
              {document.approvedBy && (
                <>
                  <span>•</span>
                  <span>
                    {t("approvedBy") || "Approved by"}: {document.approvedBy}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {canViewDocument(document) && onView && (
            <button
              onClick={handleView}
              className="px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary rounded-md transition-colors"
            >
              {t("view") || "View"}
            </button>
          )}
          {canDownloadDocument(document) && (
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary transition-colors"
              title={t("download") || "Download"}
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={handleRemove}
              className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title={t("remove") || "Remove"}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(DocumentListItem);
