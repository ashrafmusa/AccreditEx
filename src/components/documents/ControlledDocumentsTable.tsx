import React, { useState, useRef, useEffect, useMemo } from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import DocumentRow from "./DocumentRow";
import { EmptyState, TableContainer } from "@/components/ui";
import {
  DocumentIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from "../icons";

type SortField = "name" | "status" | "version" | "reviewDate";
type SortDirection = "asc" | "desc";

type ColumnKey = "name" | "status" | "version" | "reviewDate" | "actions";

const ALL_COLUMNS: ColumnKey[] = [
  "name",
  "status",
  "version",
  "reviewDate",
  "actions",
];

interface ControlledDocumentsTableProps {
  documents: AppDocument[];
  canModify: boolean;
  onApprove: (doc: AppDocument) => void;
  onDelete: (docId: string) => void;
  onView: (doc: AppDocument) => void;
  // Selection support
  selectedDocIds?: Set<string>;
  onToggleSelect?: (docId: string) => void;
  onSelectAll?: () => void;
  totalCount?: number;
}

const ControlledDocumentsTable: React.FC<ControlledDocumentsTableProps> = ({
  documents,
  canModify,
  onApprove,
  onDelete,
  onView,
  selectedDocIds,
  onToggleSelect,
  onSelectAll,
  totalCount,
}) => {
  const { t, lang } = useTranslation();

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS),
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Close column menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(e.target as Node)
      ) {
        setShowColumnMenu(false);
      }
    };
    if (showColumnMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnMenu]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort documents
  const sortedDocuments = useMemo(() => {
    if (!sortField) return documents;

    return [...documents].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.name[lang] || "").localeCompare(b.name[lang] || "");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "version":
          comparison = a.currentVersion - b.currentVersion;
          break;
        case "reviewDate": {
          const dateA = a.reviewDate ? new Date(a.reviewDate).getTime() : 0;
          const dateB = b.reviewDate ? new Date(b.reviewDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [documents, sortField, sortDirection, lang]);

  // Toggle column visibility
  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        // Don't allow hiding all columns
        if (next.size > 1) next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  // Selection helpers
  const hasSelection = !!selectedDocIds && !!onToggleSelect;
  const allSelected =
    hasSelection &&
    documents.length > 0 &&
    documents.every((doc) => selectedDocIds!.has(doc.id));

  // Sort indicator renderer
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="inline-flex flex-col ml-1 rtl:mr-1 rtl:ml-0 opacity-30">
          <ChevronUpIcon className="w-3 h-3 -mb-1" />
          <ChevronDownIcon className="w-3 h-3" />
        </span>
      );
    }
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="w-3 h-3 inline ml-1 rtl:mr-1 rtl:ml-0" />
    ) : (
      <ChevronDownIcon className="w-3 h-3 inline ml-1 rtl:mr-1 rtl:ml-0" />
    );
  };

  // Column label map
  const columnLabels: Record<ColumnKey, string> = {
    name: t("documentName") || "Document Name",
    status: t("status") || "Status",
    version: t("version") || "Version",
    reviewDate: t("reviewDate") || "Review Date",
    actions: t("actions") || "Actions",
  };

  const displayedTotal = totalCount ?? documents.length;

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
      <TableContainer>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              {/* Selection checkbox header */}
              {hasSelection && (
                <th scope="col" className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onSelectAll?.()}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary dark:border-gray-600 dark:bg-gray-800"
                    aria-label={t("selectAll") || "Select all"}
                  />
                </th>
              )}

              {/* Name column header */}
              {visibleColumns.has("name") && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <span className="inline-flex items-center">
                    {columnLabels.name}
                    {renderSortIndicator("name")}
                  </span>
                </th>
              )}

              {/* Status column header */}
              {visibleColumns.has("status") && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <span className="inline-flex items-center">
                    {columnLabels.status}
                    {renderSortIndicator("status")}
                  </span>
                </th>
              )}

              {/* Version column header */}
              {visibleColumns.has("version") && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  onClick={() => handleSort("version")}
                >
                  <span className="inline-flex items-center">
                    {columnLabels.version}
                    {renderSortIndicator("version")}
                  </span>
                </th>
              )}

              {/* Review Date column header */}
              {visibleColumns.has("reviewDate") && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  onClick={() => handleSort("reviewDate")}
                >
                  <span className="inline-flex items-center">
                    {columnLabels.reviewDate}
                    {renderSortIndicator("reviewDate")}
                  </span>
                </th>
              )}

              {/* Actions column header + column visibility gear */}
              {visibleColumns.has("actions") && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  <div className="flex items-center justify-end rtl:justify-start gap-2">
                    <span>{columnLabels.actions}</span>
                    <div className="relative" ref={columnMenuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColumnMenu((prev) => !prev);
                        }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label={t("columnSettings") || "Column settings"}
                      >
                        <Cog6ToothIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                      {showColumnMenu && (
                        <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                            {t("columns") || "Columns"}
                          </div>
                          {ALL_COLUMNS.map((col) => (
                            <label
                              key={col}
                              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={visibleColumns.has(col)}
                                onChange={() => toggleColumn(col)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary dark:border-gray-600"
                              />
                              {columnLabels[col]}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
            {sortedDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canModify={canModify}
                onApprove={onApprove}
                onDelete={onDelete}
                onView={onView}
                isSelected={selectedDocIds?.has(doc.id)}
                onToggleSelect={onToggleSelect}
                visibleColumns={visibleColumns}
              />
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <EmptyState
            icon={<DocumentIcon className="w-6 h-6" />}
            title={t("noControlledDocuments")}
            message=""
          />
        )}
      </TableContainer>

      {/* Row count footer */}
      {documents.length > 0 && (
        <div className="px-6 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-dark-brand-border text-xs text-gray-500 dark:text-gray-400">
          {t("showingXOfY")
            ? (t("showingXOfY") as string)
                .replace("{x}", String(documents.length))
                .replace("{y}", String(displayedTotal))
            : `Showing ${documents.length} of ${displayedTotal} documents`}
        </div>
      )}
    </div>
  );
};

export default ControlledDocumentsTable;
