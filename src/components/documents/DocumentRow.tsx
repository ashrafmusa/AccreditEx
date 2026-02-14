import React, { useState, useRef, useEffect } from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  PencilIcon,
  TrashIcon,
  LinkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
} from "../icons";
import { useAppStore } from "@/stores/useAppStore";

type ColumnKey = "name" | "status" | "version" | "reviewDate" | "actions";

interface DocumentRowProps {
  doc: AppDocument;
  canModify: boolean;
  onApprove: (doc: AppDocument) => void;
  onDelete: (docId: string) => void;
  onView: (doc: AppDocument) => void;
  // New props
  isSelected?: boolean;
  onToggleSelect?: (docId: string) => void;
  visibleColumns?: Set<ColumnKey>;
}

/** Relative date formatting helper */
const formatRelativeDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < -30)
    return {
      text: date.toLocaleDateString(),
      color: "text-red-600",
      isOverdue: true,
    };
  if (diffDays < 0)
    return {
      text: `${Math.abs(diffDays)} days overdue`,
      color: "text-red-600 font-medium",
      isOverdue: true,
    };
  if (diffDays === 0)
    return {
      text: "Due today",
      color: "text-amber-600 font-medium",
      isOverdue: false,
    };
  if (diffDays <= 7)
    return {
      text: `Due in ${diffDays} days`,
      color: "text-amber-500",
      isOverdue: false,
    };
  if (diffDays <= 30)
    return {
      text: `Due in ${diffDays} days`,
      color: "text-green-600",
      isOverdue: false,
    };
  return {
    text: date.toLocaleDateString(),
    color: "text-gray-500",
    isOverdue: false,
  };
};

/** Extract file extension from URL */
const getFileExtension = (url: string): string | null => {
  try {
    const pathname = new URL(url, "https://placeholder.com").pathname;
    const ext = pathname.split(".").pop()?.toUpperCase();
    if (
      ext &&
      [
        "PDF",
        "DOCX",
        "DOC",
        "XLSX",
        "XLS",
        "PPTX",
        "PPT",
        "TXT",
        "CSV",
        "PNG",
        "JPG",
      ].includes(ext)
    ) {
      return ext;
    }
    return null;
  } catch {
    return null;
  }
};

/** Status icon mapping */
const StatusIcon: React.FC<{ status: string; className?: string }> = ({
  status,
  className = "w-3.5 h-3.5",
}) => {
  switch (status) {
    case "Approved":
      return <CheckCircleIcon className={className} />;
    case "Pending Review":
      return <ClockIcon className={className} />;
    case "Draft":
      return <PencilIcon className={className} />;
    case "Rejected":
      return <ExclamationTriangleIcon className={className} />;
    case "Archived":
      return <ArchiveBoxIcon className={className} />;
    default:
      return null;
  }
};

const DocumentRow: React.FC<DocumentRowProps> = ({
  doc,
  canModify,
  onApprove,
  onDelete,
  onView,
  isSelected,
  onToggleSelect,
  visibleColumns,
}) => {
  const { t, lang } = useTranslation();
  const { documents } = useAppStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasSelection = onToggleSelect !== undefined;

  // Default all columns visible if prop not provided
  const cols =
    visibleColumns ??
    new Set<ColumnKey>(["name", "status", "version", "reviewDate", "actions"]);

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  // Cleanup tooltip timeout
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const hasRelationships =
    doc.relatedDocumentIds?.length ||
    doc.parentDocumentId ||
    documents.some((d) => d.parentDocumentId === doc.id);

  const statusColors: Record<string, string> = {
    Approved:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    "Pending Review":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    Archived: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    Draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  // Content snippet for hover preview
  const contentSnippet = doc.content?.[lang]
    ? doc.content[lang].substring(0, 100) +
      (doc.content[lang].length > 100 ? "…" : "")
    : null;

  // File type from fileUrl
  const fileExtension = doc.fileUrl ? getFileExtension(doc.fileUrl) : null;

  // File type badge colors
  const fileTypeBadgeColor: Record<string, string> = {
    PDF: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    DOCX: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    DOC: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    XLSX: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    XLS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    PPTX: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    PPT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };

  const handleRowMouseEnter = () => {
    if (contentSnippet) {
      tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(true), 500);
    }
  };

  const handleRowMouseLeave = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setShowTooltip(false);
  };

  return (
    <tr
      onClick={() => onView(doc)}
      onMouseEnter={handleRowMouseEnter}
      onMouseLeave={handleRowMouseLeave}
      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer relative ${
        isSelected ? "bg-brand-primary/5 dark:bg-brand-primary/10" : ""
      }`}
    >
      {/* Selection checkbox */}
      {hasSelection && (
        <td className="px-3 py-4 w-10">
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.(doc.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary dark:border-gray-600 dark:bg-gray-800"
            aria-label={t("selectDocument") || `Select ${doc.name[lang]}`}
          />
        </td>
      )}

      {/* Name column */}
      {cols.has("name") && (
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {/* File type badge */}
            {fileExtension && (
              <span
                className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  fileTypeBadgeColor[fileExtension] ||
                  "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {fileExtension}
              </span>
            )}
            <div className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
              {doc.name[lang]}
            </div>
            {hasRelationships && (
              <span
                className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400"
                title={t("hasRelationships") || "Has linked documents"}
              >
                <LinkIcon className="w-3 h-3" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {doc.type}
            </div>
            {doc.category && (
              <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-pink-900/30 text-pink-600 dark:text-rose-300 rounded">
                {doc.category}
              </span>
            )}
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex gap-1">
                {doc.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {doc.tags.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{doc.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Hover preview tooltip */}
          {showTooltip && contentSnippet && (
            <div className="absolute left-6 rtl:right-6 rtl:left-auto top-full z-50 mt-1 max-w-sm p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md shadow-lg pointer-events-none">
              {contentSnippet}
            </div>
          )}
        </td>
      )}

      {/* Status column */}
      {cols.has("status") && (
        <td className="px-6 py-4">
          <span
            className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusColors[doc.status]}`}
          >
            <StatusIcon status={doc.status} className="w-3.5 h-3.5" />
            {t(
              (doc.status.charAt(0).toLowerCase() +
                doc.status.slice(1).replace(" ", "")) as Parameters<
                typeof t
              >[0],
            ) || doc.status}
          </span>
        </td>
      )}

      {/* Version column */}
      {cols.has("version") && (
        <td className="px-6 py-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          v{doc.currentVersion}
        </td>
      )}

      {/* Review Date column */}
      {cols.has("reviewDate") && (
        <td className="px-6 py-4 text-sm">
          {doc.reviewDate ? (
            <span
              className={formatRelativeDate(doc.reviewDate).color}
              title={new Date(doc.reviewDate).toLocaleDateString()}
            >
              {formatRelativeDate(doc.reviewDate).text}
            </span>
          ) : (
            <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              N/A
            </span>
          )}
        </td>
      )}

      {/* Actions column */}
      {cols.has("actions") && (
        <td className="px-6 py-4 text-right rtl:text-left text-sm font-medium">
          <div className="flex items-center justify-end rtl:justify-start gap-1">
            {/* Approve button */}
            {canModify && doc.status === "Pending Review" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(doc);
                }}
                className="p-1.5 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                title={t("approve") || "Approve"}
              >
                <CheckCircleIcon className="w-4 h-4" />
              </button>
            )}

            {/* View button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(doc);
              }}
              className="p-1.5 rounded-md text-gray-500 hover:text-brand-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t("view") || "View"}
            >
              <EyeIcon className="w-4 h-4" />
            </button>

            {/* Edit button */}
            {canModify && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(doc);
                }}
                className="p-1.5 rounded-md text-gray-500 hover:text-brand-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t("edit") || "Edit"}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}

            {/* Download button */}
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                title={t("download") || "Download"}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </a>
            )}

            {/* More actions menu */}
            {canModify && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu((prev) => !prev);
                  }}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                  title={t("moreActions") || "More actions"}
                >
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc.id);
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      {t("delete") || "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

export default DocumentRow;
