import { useTranslation } from "@/hooks/useTranslation";
import { AppDocument } from "@/types";
import React, { useMemo, useState } from "react";
import { LinkIcon, PlusIcon, XMarkIcon } from "../icons";

interface DocumentRelationshipsPanelProps {
  document: AppDocument;
  allDocuments: AppDocument[];
  onAddRelationship?: (relatedDocId: string, type: string) => void;
  onRemoveRelationship?: (relatedDocId: string) => void;
}

/**
 * Document relationships panel for visualizing and managing document links
 * Shows connected documents (implements, references, supersedes, related)
 */
const DocumentRelationshipsPanel: React.FC<DocumentRelationshipsPanelProps> = ({
  document,
  allDocuments,
  onAddRelationship,
  onRemoveRelationship,
}) => {
  const { t, lang } = useTranslation();
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [relationshipType, setRelationshipType] = useState<
    "implements" | "references" | "supersedes" | "related"
  >("references");
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  // Find related documents
  const relatedDocs = useMemo(() => {
    if (!document.relatedDocumentIds) return [];
    return document.relatedDocumentIds
      .map((id) => allDocuments.find((d) => d.id === id))
      .filter((d) => d !== undefined) as AppDocument[];
  }, [document.relatedDocumentIds, allDocuments]);

  // Available documents (all except current)
  const availableDocs = useMemo(
    () => allDocuments.filter((d) => d.id !== document.id),
    [allDocuments, document.id],
  );

  const relationshipTypeLabels = {
    implements: t("implements") || "Implements",
    references: t("references") || "References",
    supersedes: t("supersedes") || "Supersedes",
    related: t("relatedTo") || "Related to",
  };

  const handleAddRelationship = () => {
    if (selectedDocId && onAddRelationship) {
      onAddRelationship(selectedDocId, relationshipType);
      setSelectedDocId("");
      setIsAddingRelationship(false);
    }
  };

  const handleRemoveRelationship = (docId: string) => {
    if (onRemoveRelationship) {
      onRemoveRelationship(docId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("relatedDocuments") || "Related Documents"}
          </h3>
        </div>
        {onAddRelationship && (
          <button
            onClick={() => setIsAddingRelationship(!isAddingRelationship)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title={t("addRelationship") || "Add relationship"}
          >
            <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Add Relationship Form */}
      {isAddingRelationship && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
          {/* Relationship Type Selector */}
          <select
            value={relationshipType}
            onChange={(e) =>
              setRelationshipType(
                e.target.value as
                  | "implements"
                  | "references"
                  | "supersedes"
                  | "related",
              )
            }
            className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {Object.entries(relationshipTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Document Selector */}
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {t("selectDocument") || "Select a document..."}
            </option>
            {availableDocs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name[lang]} ({doc.type})
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddRelationship}
              disabled={!selectedDocId}
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-brand-primary hover:bg-brand-primary/90 disabled:bg-gray-300 text-white rounded transition-colors"
            >
              {t("add") || "Add"}
            </button>
            <button
              onClick={() => setIsAddingRelationship(false)}
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t("cancel") || "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Related Documents List */}
      {relatedDocs.length > 0 ? (
        <div className="space-y-2">
          {relatedDocs.map((relatedDoc) => {
            const relType = document.relationshipType || "related";
            return (
              <div
                key={relatedDoc.id}
                className="flex items-start justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                      {
                        relationshipTypeLabels[
                          relType as keyof typeof relationshipTypeLabels
                        ]
                      }
                    </span>
                  </div>
                  <p className="text-xs font-medium text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                    {relatedDoc.name[lang]}
                  </p>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {relatedDoc.type}
                    {relatedDoc.documentNumber &&
                      ` · ${relatedDoc.documentNumber}`}
                  </p>
                </div>
                {onRemoveRelationship && (
                  <button
                    onClick={() => handleRemoveRelationship(relatedDoc.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0 ltr:ml-2 rtl:mr-2"
                    title={t("remove") || "Remove"}
                  >
                    <XMarkIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : !isAddingRelationship ? (
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary italic">
          {t("noRelatedDocuments") || "No related documents"}
        </p>
      ) : null}
    </div>
  );
};

export default DocumentRelationshipsPanel;
