import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import {
  FolderIcon,
  UserGroupIcon,
  ClockIcon,
  BookmarkIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  PaperClipIcon,
  ChartBarIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  Bars3Icon,
} from "../icons";
import { Department } from "../../types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DocumentSidebarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  documentCounts: Record<string, number>;
  departments: Department[];
  /** Total storage used in bytes (shown in usage bar) */
  totalStorageBytes?: number;
  /** Callback when the mobile drawer close button is pressed */
  onMobileClose?: () => void;
  /** Whether the mobile drawer is open */
  isMobileOpen?: boolean;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
  activeIconColor?: string;
}

/* ------------------------------------------------------------------ */
/*  Icon colour map for document types                                 */
/* ------------------------------------------------------------------ */

const typeIconMap: Record<
  string,
  { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }
> = {
  Policy: { icon: ShieldCheckIcon, color: "text-blue-500" },
  Procedure: { icon: ClipboardDocumentListIcon, color: "text-green-500" },
  "Process Map": { icon: ArrowPathIcon, color: "text-teal-500" },
  Evidence: { icon: PaperClipIcon, color: "text-amber-500" },
  Report: { icon: ChartBarIcon, color: "text-purple-500" },
};

/* ------------------------------------------------------------------ */
/*  Reusable collapsible section                                       */
/* ------------------------------------------------------------------ */

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-2 py-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
        aria-expanded={isOpen}
      >
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none">
          {title}
        </h3>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? "" : "ltr:-rotate-90 rtl:rotate-90"
          }`}
        />
      </button>

      <div
        ref={contentRef}
        style={{ maxHeight: isOpen ? (contentHeight ?? "none") : 0 }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div className="space-y-0.5 mt-1">{children}</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Helper: format bytes to human-readable                             */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  activeCategory,
  onSelectCategory,
  documentCounts,
  departments,
  totalStorageBytes,
  onMobileClose,
  isMobileOpen = false,
}) => {
  const { t, lang } = useTranslation();
  const isRTL = lang === "ar";

  /* ---- search state ---- */
  const [searchQuery, setSearchQuery] = useState("");

  /* ---- data ---- */
  const categories: SidebarItem[] = [
    {
      id: "all",
      label: t("allDocuments") || "All Documents",
      icon: FolderIcon,
    },
    {
      id: "my_documents",
      label: t("myDocuments") || "My Documents",
      icon: BookmarkIcon,
    },
    { id: "recent", label: t("recent") || "Recent", icon: ClockIcon },
  ];

  const types: SidebarItem[] = [
    {
      id: "Policy",
      label: t("policies") || "Policies",
      icon: ShieldCheckIcon,
      iconColor: "text-blue-500",
      activeIconColor: "text-blue-600",
    },
    {
      id: "Procedure",
      label: t("procedures") || "Procedures",
      icon: ClipboardDocumentListIcon,
      iconColor: "text-green-500",
      activeIconColor: "text-green-600",
    },
    {
      id: "Process Map",
      label: t("processMaps") || "Process Maps",
      icon: ArrowPathIcon,
      iconColor: "text-teal-500",
      activeIconColor: "text-teal-600",
    },
    {
      id: "Evidence",
      label: t("evidence") || "Evidence",
      icon: PaperClipIcon,
      iconColor: "text-amber-500",
      activeIconColor: "text-amber-600",
    },
    {
      id: "Report",
      label: t("reports") || "Reports",
      icon: ChartBarIcon,
      iconColor: "text-purple-500",
      activeIconColor: "text-purple-600",
    },
  ];

  const departmentItems: SidebarItem[] = departments.map((dept) => ({
    id: dept.id,
    label: dept.name[lang] || dept.name.en,
    icon: UserGroupIcon,
  }));

  /* ---- keyboard nav ---- */
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled])",
      );
      if (!focusable || focusable.length === 0) return;

      const items = Array.from(focusable);
      const idx = items.indexOf(document.activeElement as HTMLElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    },
    [],
  );

  /* ---- filtered departments by search ---- */
  const filteredDepartments = searchQuery
    ? departmentItems.filter((d) =>
        d.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : departmentItems;

  const filteredCategories = searchQuery
    ? categories.filter((c) =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : categories;

  const filteredTypes = searchQuery
    ? types.filter((t) =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : types;

  /* ---- total documents count ---- */
  const totalDocuments = Object.values(documentCounts).reduce(
    (sum, n) => sum + n,
    0,
  );

  /* ---- storage bar percentage (cap at 1 GB for display) ---- */
  const storageCapBytes = 1024 * 1024 * 1024; // 1 GB
  const storagePercent = totalStorageBytes
    ? Math.min((totalStorageBytes / storageCapBytes) * 100, 100)
    : 0;

  /* ---- render a single sidebar item ---- */
  const renderItem = (item: SidebarItem) => {
    const isActive = activeCategory === item.id;
    const Icon = item.icon;

    const iconColorClass = isActive
      ? item.activeIconColor || "text-brand-primary"
      : item.iconColor || "text-gray-400 dark:text-gray-500";

    return (
      <button
        key={item.id}
        onClick={() => onSelectCategory(item.id)}
        className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
                    transition-all duration-150 group
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary
                    ${
                      isActive
                        ? `bg-linear-to-r ${isRTL ? "from-transparent to-brand-primary/10" : "from-brand-primary/10 to-transparent"}
                           text-brand-primary dark:text-brand-primary
                           ${isRTL ? "border-r-[3px] border-brand-primary" : "border-l-[3px] border-brand-primary"}`
                        : `text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50
                           ${isRTL ? "border-r-[3px] border-transparent" : "border-l-[3px] border-transparent"}`
                    }
                `}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {documentCounts[item.id] > 0 && (
          <span
            className={`
                        shrink-0 py-0.5 px-2 rounded-full text-xs font-medium
                        ${
                          isActive
                            ? "bg-brand-primary/20 text-brand-primary"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }
                    `}
          >
            {documentCounts[item.id]}
          </span>
        )}
      </button>
    );
  };

  /* ---- sidebar content (shared between desktop and mobile) ---- */
  const sidebarContent = (
    <div
      ref={sidebarRef}
      role="navigation"
      aria-label={t("documentSidebar") || "Document sidebar"}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full"
    >
      {/* Search input */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <MagnifyingGlassIcon
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 ${isRTL ? "right-2.5" : "left-2.5"}`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchSidebar") || "Search…"}
            className={`
                            w-full py-1.5 text-sm rounded-md
                            bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                            text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                            focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary
                            transition-colors ${isRTL ? "pr-8 pl-8" : "pl-8 pr-8"}
                        `}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className={`absolute top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${isRTL ? "left-2" : "right-2"}`}
              aria-label={t("clearSearch") || "Clear search"}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {/* Library */}
        {filteredCategories.length > 0 && (
          <SidebarSection title={t("library") || "Library"} defaultOpen>
            {filteredCategories.map(renderItem)}
          </SidebarSection>
        )}

        {/* Document Types */}
        {filteredTypes.length > 0 && (
          <SidebarSection title={t("types") || "Types"} defaultOpen>
            {filteredTypes.map(renderItem)}
          </SidebarSection>
        )}

        {/* Departments */}
        {filteredDepartments.length > 0 && (
          <SidebarSection title={t("departments") || "Departments"} defaultOpen>
            {filteredDepartments.map(renderItem)}
          </SidebarSection>
        )}

        {/* Empty search state */}
        {filteredCategories.length === 0 &&
          filteredTypes.length === 0 &&
          filteredDepartments.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
              {t("noResults") || "No results found"}
            </p>
          )}
      </div>

      {/* Storage / Usage Indicator */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>
            {totalDocuments} {t("documents") || "documents"}
          </span>
          {totalStorageBytes !== undefined && (
            <span>
              {formatBytes(totalStorageBytes)} {t("used") || "used"}
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              storagePercent > 90
                ? "bg-red-500"
                : storagePercent > 70
                  ? "bg-amber-500"
                  : "bg-brand-primary"
            }`}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ---- Desktop sidebar ---- */}
      <div className="w-64 bg-white dark:bg-dark-brand-surface border-r dark:border-l-0 rtl:border-r-0 rtl:border-l border-gray-200 dark:border-dark-brand-border shrink-0 min-h-150 hidden md:flex flex-col rounded-l-lg rtl:rounded-l-none rtl:rounded-r-lg">
        {sidebarContent}
      </div>

      {/* ---- Mobile: floating filter button ---- */}
      <button
        type="button"
        onClick={onMobileClose}
        className="md:hidden fixed bottom-6 ltr:left-4 rtl:right-4 z-40 p-3 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-transform active:scale-95"
        aria-label={t("openFilters") || "Open filters"}
      >
        <FunnelIcon className="h-5 w-5" />
      </button>

      {/* ---- Mobile: drawer overlay ---- */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ---- Mobile: slide-out drawer ---- */}
      <div
        className={`
                    md:hidden fixed top-0 z-50 h-full w-72
                    bg-white dark:bg-dark-brand-surface shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${isRTL ? "right-0" : "left-0"}
                    ${
                      isMobileOpen
                        ? "translate-x-0"
                        : isRTL
                          ? "translate-x-full"
                          : "-translate-x-full"
                    }
                `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bars3Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t("filters") || "Filters"}
            </span>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={t("close") || "Close"}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {sidebarContent}
      </div>
    </>
  );
};

export default DocumentSidebar;
