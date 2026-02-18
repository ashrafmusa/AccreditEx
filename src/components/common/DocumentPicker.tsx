import React, { useState } from "react";
import { AppDocument, LocalizedString } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { XMarkIcon, CheckIcon, PlusIcon } from "../icons";
import DocumentListItem from "../documents/DocumentListItem";

interface DocumentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (documentIds: string[]) => void;
  documents: AppDocument[];
  selectedIds?: string[];
  multiSelect?: boolean;
  filterType?: AppDocument["type"][];
  showFileInfo?: boolean;
  allowUpload?: boolean;
  onUpload?: () => void;
}

const DocumentPicker: React.FC<DocumentPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  documents = [],
  selectedIds = [],
  multiSelect = true,
  filterType,
  showFileInfo = true,
  allowUpload = false,
  onUpload,
}) => {
  const { t, lang } = useTranslation();
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds, isOpen]);

  if (!isOpen) return null;

  // Filter documents
  let filteredDocuments = documents.filter((doc) => doc.status === "Approved");

  if (filterType && filterType.length > 0) {
    filteredDocuments = filteredDocuments.filter((doc) =>
      filterType.includes(doc.type),
    );
  }

  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter(
      (doc) =>
        doc.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.name.ar.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  const handleToggle = (docId: string) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(docId)
          ? prev.filter((id) => id !== docId)
          : [...prev, docId],
      );
    } else {
      setSelected([docId]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const handleUploadClick = () => {
    if (onUpload) {
      onUpload();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("selectDocuments") || "Select Documents"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filterType && filterType.length > 0
                ? `${t("showing") || "Showing"} ${filterType.join(", ")} ${t("documents") || "documents"}`
                : t("allApprovedDocuments") || "All approved documents"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Upload */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <input
            type="text"
            placeholder={t("searchDocuments") || "Search documents..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          {allowUpload && onUpload && (
            <button
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              {t("uploadNewDocument") || "Upload New Document"}
            </button>
          )}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">
                {t("noDocumentsAvailable") || "No documents available"}
              </p>
              <p className="text-sm mt-2">
                {t("tryDifferentSearch") || "Try a different search or filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleToggle(doc.id)}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                    selected.includes(doc.id)
                      ? "border-brand-primary bg-sky-50 dark:bg-sky-900/20"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <DocumentListItem
                    document={doc}
                    compact={true}
                    showActions={false}
                    showFileInfo={showFileInfo}
                  />
                  {selected.includes(doc.id) && (
                    <div className="absolute top-2 right-2 bg-brand-primary rounded-full p-1">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-brand-primary">
              {selected.length}
            </span>{" "}
            {t("selected") || "selected"}
            {multiSelect && (
              <span className="ml-2">
                ({filteredDocuments.length} {t("available") || "available"})
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("confirm") || "Confirm"}{" "}
              {selected.length > 0 && `(${selected.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPicker;
