import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../hooks/useToast";
import { ContextualHelp } from "../components/common/ContextualHelp";
import { getHelpContent } from "../data/helpContent";
import { AppDocument, User, UserRole, Standard, Department } from "../types";
import { useProjectStore } from "@/stores/useProjectStore";
import StatCard from "../components/common/StatCard";
import DocumentSidebar from "../components/documents/DocumentSidebar";
import DocumentSearch, {
  DocumentFilters,
} from "../components/documents/DocumentSearch";
import SignatureModal from "../components/common/SignatureModal";
import ControlledDocumentsTable from "../components/documents/ControlledDocumentsTable";
import RestrictedFeatureIndicator from "../components/common/RestrictedFeatureIndicator";
import { Button } from "@/components/ui";
import {
  DocumentTextIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  DocumentPlusIcon,
  HomeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "../components/icons";

const DocumentEditorModal = lazy(
  () => import("../components/documents/DocumentEditorModal"),
);
const ProcessMapEditor = lazy(
  () => import("../components/documents/ProcessMapEditor"),
);
const ProcessMapMetadataModal = lazy(
  () => import("../components/documents/ProcessMapMetadataModal"),
);
const DocumentMetadataModal = lazy(
  () => import("../components/documents/DocumentMetadataModal"),
);
const PDFViewerModal = lazy(
  () => import("../components/documents/PDFViewerModal"),
);

// --- Quick Filter Types ---
type QuickFilterKey =
  | "all"
  | "needsReview"
  | "drafts"
  | "recentlyUpdated"
  | "overdue";

interface DocumentControlHubPageProps {
  documents: AppDocument[];
  standards: Standard[];
  departments: Department[];
  currentUser: User;
  onUpdateDocument: (updatedDocument: AppDocument) => void;
  onCreateDocument: (data: {
    name: { en: string; ar: string };
    type: AppDocument["type"];
    fileUrl?: string;
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => void;
  onAddProcessMap: (data: {
    name: { en: string; ar: string };
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => void;
  onDeleteDocument: (docId: string) => void;
  onApproveDocument: (docId: string) => void;
}

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    Approved:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    "Pending Review":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {status}
    </span>
  );
};

// --- Type Badge Component ---
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, string> = {
    Policy: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Procedure:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "Process Map":
      "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    Evidence:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    Report: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {type}
    </span>
  );
};

const DocumentControlHubPage: React.FC<DocumentControlHubPageProps> = ({
  documents,
  standards,
  departments,
  currentUser,
  onUpdateDocument,
  onCreateDocument,
  onAddProcessMap,
  onDeleteDocument,
  onApproveDocument,
}) => {
  const { t, lang, dir } = useTranslation();
  const toast = useToast();
  const { projects } = useProjectStore();
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [isProcessMapModalOpen, setIsProcessMapModalOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<AppDocument | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const [viewingPDF, setViewingPDF] = useState<AppDocument | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<DocumentFilters>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnlyMyDocs, setShowOnlyMyDocs] = useState(
    !currentUser || currentUser.role !== UserRole.Admin,
  );
  const canModify = currentUser.role === UserRole.Admin;

  // --- New state additions ---
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilterKey>("all");

  const handleConfirmSignature = async () => {
    if (!signingDoc) return;

    setIsSaving(true);
    try {
      onApproveDocument(signingDoc.id);
      toast.success(
        t("documentApprovedSuccessfully") || "Document approved successfully",
      );
      setSigningDoc(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToApproveDocument") || "Failed to approve document";
      toast.error(errorMsg);
      console.error("Document approval failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDocument = async (doc: AppDocument) => {
    setIsSaving(true);
    try {
      onUpdateDocument(doc);
      toast.success(
        t("documentSavedSuccessfully") || "Document saved successfully",
      );
      setViewingDoc(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToSaveDocument") || "Failed to save document";
      toast.error(errorMsg);
      console.error("Document save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    const docName = doc?.name[lang] || "Document";

    if (
      !window.confirm(
        `${
          t("areYouSureDeleteDocument") ||
          "Are you sure you want to delete this document?"
        } "${docName}"?`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      onDeleteDocument(docId);
      toast.success(
        t("documentDeletedSuccessfully") || "Document deleted successfully",
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToDeleteDocument") || "Failed to delete document";
      toast.error(errorMsg);
      console.error("Document delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDocument = async (docData: {
    name?: { en?: string; ar?: string };
    type?: AppDocument["type"];
    fileUrl?: string;
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => {
    try {
      if (!docData.name?.en || !docData.name?.en.trim()) {
        toast.error(t("documentNameRequired") || "Document name is required");
        return;
      }
      if (!docData.name?.ar || !docData.name?.ar.trim()) {
        toast.error(t("arabicNameRequired") || "Arabic name is required");
        return;
      }

      onCreateDocument(docData as Parameters<typeof onCreateDocument>[0]);
      toast.success(
        t("documentCreatedSuccessfully") || "Document created successfully",
      );
      setIsMetaModalOpen(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToCreateDocument") || "Failed to create document";
      toast.error(errorMsg);
      console.error("Document creation failed:", error);
    }
  };

  const handleAddProcessMap = async (mapData: {
    name?: { en?: string; ar?: string };
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => {
    try {
      if (!mapData.name?.en || !mapData.name?.en.trim()) {
        toast.error(
          t("processMapNameRequired") || "Process map name is required",
        );
        return;
      }
      if (!mapData.name?.ar || !mapData.name?.ar.trim()) {
        toast.error(t("arabicNameRequired") || "Arabic name is required");
        return;
      }

      await onAddProcessMap({
        name: mapData.name as { en: string; ar: string },
        tags: mapData.tags,
        category: mapData.category,
        departmentIds: mapData.departmentIds,
      });
      toast.success(
        t("processMapCreatedSuccessfully") ||
          "Process map created successfully",
      );
      setIsProcessMapModalOpen(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToCreateProcessMap") || "Failed to create process map";
      toast.error(errorMsg);
      console.error("Process map creation failed:", error);
    }
  };

  // --- Quick filter pre-filter logic ---
  const quickFilteredDocuments = useMemo(() => {
    const controlled = documents.filter((doc) => doc.isControlled);
    const now = new Date();
    switch (activeQuickFilter) {
      case "needsReview":
        return controlled.filter((d) => d.status === "Pending Review");
      case "drafts":
        return controlled.filter((d) => d.status === "Draft");
      case "recentlyUpdated": {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return controlled.filter((d) => new Date(d.uploadedAt) >= sevenDaysAgo);
      }
      case "overdue":
        return controlled.filter(
          (d) => d.reviewDate && new Date(d.reviewDate) < now,
        );
      default:
        return controlled;
    }
  }, [documents, activeQuickFilter]);

  const controlledDocuments = useMemo(() => {
    let filtered = quickFilteredDocuments;

    // Role-based access: Filter by project assignment for evidence documents
    if (showOnlyMyDocs && currentUser.role !== UserRole.Admin) {
      filtered = filtered.filter((doc) => {
        if (doc.projectId) {
          const project = projects.find((p) => p.id === doc.projectId);
          if (!project) return false;
          const isProjectLead = project.projectLead?.id === currentUser.id;
          const isTeamMember = project.teamMembers?.includes(currentUser.id);
          return isProjectLead || isTeamMember;
        }
        return true;
      });
    }

    // 1. Filter by Category
    if (activeCategory === "my_documents") {
      filtered = filtered.filter((doc) => doc.uploadedBy === currentUser.name);
    } else if (activeCategory === "recent") {
      filtered = filtered
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        )
        .slice(0, 10);
    } else if (activeCategory.startsWith("dept_")) {
      const deptId = activeCategory;
      filtered = filtered.filter((doc) => doc.departmentIds?.includes(deptId));
    } else if (activeCategory !== "all") {
      filtered = filtered.filter((doc) => doc.type === activeCategory);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.en.toLowerCase().includes(query) ||
          doc.name.ar.toLowerCase().includes(query) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // 3. Filter by Advanced Filters
    if (activeFilters.status) {
      filtered = filtered.filter((doc) => doc.status === activeFilters.status);
    }
    if (activeFilters.author) {
      filtered = filtered.filter((doc) =>
        doc.uploadedBy
          ?.toLowerCase()
          .includes(activeFilters.author!.toLowerCase()),
      );
    }
    if (activeFilters.category) {
      filtered = filtered.filter(
        (doc) => doc.category === activeFilters.category,
      );
    }
    if (activeFilters.departmentId) {
      filtered = filtered.filter((doc) =>
        doc.departmentIds?.includes(activeFilters.departmentId!),
      );
    }
    if (activeFilters.tags && activeFilters.tags.length > 0) {
      filtered = filtered.filter((doc) =>
        doc.tags?.some((tag) => activeFilters.tags!.includes(tag)),
      );
    }

    return filtered;
  }, [
    quickFilteredDocuments,
    activeCategory,
    currentUser,
    searchQuery,
    activeFilters,
    showOnlyMyDocs,
    projects,
  ]);

  const stats = useMemo(() => {
    const allControlled = documents.filter((d) => d.isControlled);
    const now = new Date();
    return {
      total: allControlled.length,
      approved: allControlled.filter((d) => d.status === "Approved").length,
      pending: allControlled.filter((d) => d.status === "Pending Review")
        .length,
      drafts: allControlled.filter((d) => d.status === "Draft").length,
      overdue: allControlled.filter(
        (d) => d.reviewDate && new Date(d.reviewDate) < now,
      ).length,
    };
  }, [documents]);

  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      my_documents: 0,
      recent: 0,
    };
    const controlled = documents.filter((d) => d.isControlled);
    counts.all = controlled.length;

    ["Policy", "Procedure", "Process Map", "Evidence", "Report"].forEach(
      (type) => {
        counts[type] = controlled.filter((d) => d.type === type).length;
      },
    );

    counts.my_documents = controlled.filter(
      (doc) => doc.uploadedBy === currentUser.name,
    ).length;
    counts.recent = Math.min(10, controlled.length);

    departments.forEach((dept) => {
      counts[dept.id] = controlled.filter((doc) =>
        doc.departmentIds?.includes(dept.id),
      ).length;
    });

    return counts;
  }, [documents, currentUser, departments]);

  // --- Dynamic summary line ---
  const summaryLine = useMemo(() => {
    const parts: string[] = [];
    if (stats.pending > 0) {
      parts.push(
        `${stats.pending} ${t("documentsNeedReview") || "documents need review"}`,
      );
    }
    if (stats.overdue > 0) {
      parts.push(
        `${stats.overdue} ${t("overdueReviews") || "overdue reviews"}`,
      );
    }
    if (stats.drafts > 0) {
      parts.push(
        `${stats.drafts} ${t("draftsInProgress") || "drafts in progress"}`,
      );
    }
    return parts.length > 0
      ? parts.join(" · ")
      : t("allDocumentsUpToDate") || "All documents are up to date";
  }, [stats, t]);

  // --- Selection helpers ---
  const toggleDocSelection = useCallback((docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedDocIds.size === controlledDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(controlledDocuments.map((d) => d.id)));
    }
  }, [controlledDocuments, selectedDocIds.size]);

  // --- Bulk action handlers ---
  const handleBulkApprove = useCallback(() => {
    selectedDocIds.forEach((docId) => {
      onApproveDocument(docId);
    });
    toast.success(
      t("bulkApproveSuccess") || `${selectedDocIds.size} documents approved`,
    );
    setSelectedDocIds(new Set());
  }, [selectedDocIds, onApproveDocument, toast, t]);

  const handleBulkDelete = useCallback(() => {
    if (
      !window.confirm(
        t("confirmBulkDelete") ||
          `Are you sure you want to delete ${selectedDocIds.size} documents?`,
      )
    ) {
      return;
    }
    selectedDocIds.forEach((docId) => {
      onDeleteDocument(docId);
    });
    toast.success(
      t("bulkDeleteSuccess") || `${selectedDocIds.size} documents deleted`,
    );
    setSelectedDocIds(new Set());
  }, [selectedDocIds, onDeleteDocument, toast, t]);

  const handleBulkExport = useCallback(() => {
    const exportData = controlledDocuments.filter((d) =>
      selectedDocIds.has(d.id),
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      t("bulkExportSuccess") || `${selectedDocIds.size} documents exported`,
    );
  }, [selectedDocIds, controlledDocuments, toast, t]);

  // --- Quick Filters config ---
  const quickFilters: {
    key: QuickFilterKey;
    label: string;
    icon: React.ElementType;
    count: number;
  }[] = useMemo(
    () => [
      {
        key: "all",
        label: t("all") || "All",
        icon: DocumentTextIcon,
        count: stats.total,
      },
      {
        key: "needsReview",
        label: t("needsReview") || "Needs Review",
        icon: ClockIcon,
        count: stats.pending,
      },
      {
        key: "drafts",
        label: t("drafts") || "Drafts",
        icon: PencilIcon,
        count: stats.drafts,
      },
      {
        key: "recentlyUpdated",
        label: t("recentlyUpdated") || "Recently Updated",
        icon: ArrowTrendingUpIcon,
        count: documents
          .filter((d) => d.isControlled)
          .filter(
            (d) =>
              new Date(d.uploadedAt) >=
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
      },
      {
        key: "overdue",
        label: t("overdue") || "Overdue",
        icon: ExclamationTriangleIcon,
        count: stats.overdue,
      },
    ],
    [t, stats, documents],
  );

  // --- View document handler ---
  const handleViewDoc = useCallback((doc: AppDocument) => {
    if (doc.fileUrl && doc.fileUrl.endsWith(".pdf")) {
      setViewingPDF(doc);
    } else {
      setViewingDoc(doc);
    }
  }, []);

  // --- Breadcrumb Separator ---
  const BreadcrumbSep = dir === "rtl" ? "‹" : "›";

  return (
    <div className="space-y-6">
      {/* ===== Breadcrumb Trail ===== */}
      <nav
        className="flex items-center gap-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary"
        aria-label="Breadcrumb"
      >
        <HomeIcon className="w-4 h-4" />
        <span>{t("home") || "Home"}</span>
        <span className="text-gray-400">{BreadcrumbSep}</span>
        <span className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("documentControl") || "Document Control"}
        </span>
      </nav>

      {/* ===== Page Header ===== */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <DocumentTextIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
                {t("documentControl")}
              </h1>
              <ContextualHelp content={getHelpContent("documentControl")!} />
            </div>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("documentControlHubDescription")}
            </p>
            {/* Dynamic Summary Line */}
            <p className="text-sm text-brand-primary dark:text-blue-400 mt-1 font-medium">
              {summaryLine}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {currentUser.role === UserRole.Admin && (
            <Button
              onClick={() => setShowOnlyMyDocs(!showOnlyMyDocs)}
              variant={showOnlyMyDocs ? "secondary" : "primary"}
              className="w-full sm:w-auto"
            >
              <CheckCircleIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {showOnlyMyDocs ? t("showAllDocuments") : t("showMyDocuments")}
            </Button>
          )}
          {canModify && (
            <div className="relative">
              <Button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="w-full sm:w-auto"
              >
                <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                {t("addNew")}
                <ChevronDownIcon
                  className={`w-4 h-4 ltr:ml-2 rtl:mr-2 transition-transform duration-200 ${
                    isAddMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
              {isAddMenuOpen && (
                <div className="absolute top-full ltr:right-0 rtl:left-0 mt-2 w-56 bg-white dark:bg-dark-brand-surface rounded-xl shadow-xl border dark:border-dark-brand-border z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      setIsMetaModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-blue-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                    <span>
                      {t("policy")}/{t("procedure")}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProcessMapModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-teal-50 dark:hover:bg-gray-700/60 transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5 text-teal-500" />
                    <span>{t("processMap")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMetaModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-orange-50 dark:hover:bg-gray-700/60 transition-colors border-t border-gray-100 dark:border-gray-700"
                  >
                    <DocumentPlusIcon className="w-5 h-5 text-orange-500" />
                    <span>{t("uploadEvidence") || "Upload Evidence"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!canModify && (
        <RestrictedFeatureIndicator featureName="Document Management" />
      )}

      <div className="flex gap-6">
        <DocumentSidebar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          documentCounts={documentCounts}
          departments={departments}
        />

        <div className="flex-1 space-y-6 min-w-0">
          {/* ===== Stat Cards with Trends ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title={t("totalDocuments") || "Total Documents"}
              value={stats.total}
              icon={DocumentTextIcon}
              color="from-blue-500 to-blue-700 bg-gradient-to-br"
              trend={
                stats.total > 0
                  ? {
                      direction: "up",
                      value: 12,
                      label: t("thisMonth") || "this month",
                    }
                  : undefined
              }
            />
            <StatCard
              title={t("approved") || "Approved"}
              value={stats.approved}
              icon={CheckCircleIcon}
              color="from-green-500 to-green-700 bg-gradient-to-br"
              trend={
                stats.approved > 0
                  ? {
                      direction: "up",
                      value: 8,
                      label: t("thisMonth") || "this month",
                    }
                  : undefined
              }
            />
            <StatCard
              title={t("pendingReview") || "Pending Review"}
              value={stats.pending}
              icon={ClockIcon}
              color="from-yellow-500 to-yellow-700 bg-gradient-to-br"
              trend={
                stats.pending > 0
                  ? {
                      direction: "down",
                      value: 5,
                      label: t("thisMonth") || "this month",
                    }
                  : undefined
              }
            />
            <StatCard
              title={t("drafts") || "Drafts"}
              value={stats.drafts}
              icon={PencilIcon}
              color="from-gray-500 to-gray-700 bg-gradient-to-br"
            />
            <StatCard
              title={t("overdueReviews") || "Overdue Reviews"}
              value={stats.overdue}
              icon={ExclamationTriangleIcon}
              color="from-red-500 to-red-700 bg-gradient-to-br"
              trend={
                stats.overdue > 0
                  ? {
                      direction: "up",
                      value: stats.overdue,
                      label: t("needsAttention") || "needs attention",
                    }
                  : undefined
              }
            />
          </div>

          {/* ===== Quick Filters Toolbar ===== */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {quickFilters.map((filter) => {
              const isActive = activeQuickFilter === filter.key;
              const FilterIcon = filter.icon;
              return (
                <button
                  key={filter.key}
                  onClick={() => {
                    setActiveQuickFilter(filter.key);
                    setSelectedDocIds(new Set());
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border flex-shrink-0
                    ${
                      isActive
                        ? "bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/25 scale-[1.02]"
                        : "bg-white dark:bg-dark-brand-surface text-brand-text-secondary dark:text-dark-brand-text-secondary border-gray-200 dark:border-dark-brand-border hover:border-brand-primary/50 hover:text-brand-primary dark:hover:text-brand-primary"
                    }`}
                >
                  <FilterIcon className="w-4 h-4" />
                  {filter.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                      ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ===== Search Bar + View Toggle ===== */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <DocumentSearch
                onSearch={setSearchQuery}
                onFilter={setActiveFilters}
              />
            </div>
            <div className="flex items-center bg-white dark:bg-dark-brand-surface border border-gray-200 dark:border-dark-brand-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-brand-primary text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-brand-primary"
                }`}
                title={t("listView") || "List View"}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-brand-primary text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-brand-primary"
                }`}
                title={t("gridView") || "Grid View"}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ===== Document Content ===== */}
          {controlledDocuments.length === 0 ? (
            /* ===== Enhanced Empty State ===== */
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-dark-brand-surface rounded-xl border border-dashed border-gray-300 dark:border-dark-brand-border">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                <DocumentTextIcon className="w-10 h-10 text-blue-400 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                {t("noDocumentsFound") || "No documents found"}
              </h3>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary text-center max-w-md mb-6">
                {activeQuickFilter !== "all" || searchQuery
                  ? t("noDocumentsMatchFilter") ||
                    "No documents match your current filters. Try adjusting your search or filter criteria."
                  : t("getStartedCreatingDocuments") ||
                    "Get started by creating your first controlled document."}
              </p>
              {canModify && (
                <Button onClick={() => setIsMetaModalOpen(true)}>
                  <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                  {t("createFirstDocument") || "Create First Document"}
                </Button>
              )}
              {(activeQuickFilter !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setActiveQuickFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-3 text-sm text-brand-primary hover:underline"
                >
                  {t("clearFilters") || "Clear all filters"}
                </button>
              )}
            </div>
          ) : viewMode === "list" ? (
            /* ===== List/Table View with Checkboxes ===== */
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {canModify && (
                        <th scope="col" className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              selectedDocIds.size ===
                                controlledDocuments.length &&
                              controlledDocuments.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary"
                          />
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                      >
                        {t("documentName")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                      >
                        {t("type") || "Type"}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                      >
                        {t("status")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                      >
                        {t("version")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                      >
                        {t("reviewDate")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                      >
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                    {controlledDocuments.map((doc) => {
                      const isOverdue =
                        doc.reviewDate && new Date(doc.reviewDate) < new Date();
                      return (
                        <tr
                          key={doc.id}
                          onClick={() => handleViewDoc(doc)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                            selectedDocIds.has(doc.id)
                              ? "bg-blue-50/50 dark:bg-blue-900/10"
                              : ""
                          }`}
                        >
                          {canModify && (
                            <td
                              className="px-4 py-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDocIds.has(doc.id)}
                                onChange={() => toggleDocSelection(doc.id)}
                                className="rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                              {doc.name[lang]}
                            </div>
                            {doc.category && (
                              <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                                {doc.category}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <TypeBadge type={doc.type} />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                            v{doc.currentVersion}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={
                                isOverdue
                                  ? "text-red-600 dark:text-red-400 font-medium"
                                  : "text-brand-text-secondary dark:text-dark-brand-text-secondary"
                              }
                            >
                              {doc.reviewDate
                                ? new Date(doc.reviewDate).toLocaleDateString()
                                : "—"}
                              {isOverdue && (
                                <ExclamationTriangleIcon className="w-4 h-4 inline ltr:ml-1 rtl:mr-1 text-red-500" />
                              )}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-right rtl:text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end rtl:justify-start gap-2">
                              {canModify && doc.status === "Pending Review" && (
                                <button
                                  onClick={() => setSigningDoc(doc)}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                                  title={t("approve") || "Approve"}
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                              )}
                              {canModify && (
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                  title={t("delete") || "Delete"}
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ===== Grid/Card View ===== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {controlledDocuments.map((doc) => {
                const isOverdue =
                  doc.reviewDate && new Date(doc.reviewDate) < new Date();
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleViewDoc(doc)}
                    className={`relative bg-white dark:bg-dark-brand-surface rounded-xl border border-gray-200 dark:border-dark-brand-border p-5 cursor-pointer
                      hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group
                      ${
                        selectedDocIds.has(doc.id)
                          ? "ring-2 ring-brand-primary border-brand-primary"
                          : ""
                      }`}
                  >
                    {/* Selection Checkbox */}
                    {canModify && (
                      <div
                        className="absolute top-3 ltr:right-3 rtl:left-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocIds.has(doc.id)}
                          onChange={() => toggleDocSelection(doc.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary"
                        />
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
                        <DocumentTextIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                          {doc.name[lang]}
                        </h4>
                        {doc.category && (
                          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5 truncate">
                            {doc.category}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <TypeBadge type={doc.type} />
                      <StatusBadge status={doc.status} />
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      <span>v{doc.currentVersion}</span>
                      <span
                        className={
                          isOverdue
                            ? "text-red-600 dark:text-red-400 font-medium flex items-center gap-1"
                            : "flex items-center gap-1"
                        }
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {doc.reviewDate
                          ? new Date(doc.reviewDate).toLocaleDateString()
                          : "—"}
                        {isOverdue && (
                          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </span>
                    </div>

                    {/* Card Actions */}
                    {canModify && (
                      <div
                        className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {doc.status === "Pending Review" && (
                          <button
                            onClick={() => setSigningDoc(doc)}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            {t("approve")}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ltr:ml-auto rtl:mr-auto"
                        >
                          <TrashIcon className="w-4 h-4" />
                          {t("delete")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Bulk Actions Floating Bar ===== */}
      {selectedDocIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-brand-surface dark:bg-dark-brand-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-brand-border">
          <span className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {selectedDocIds.size} {t("selected") || "selected"}
          </span>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {t("approveSelected") || "Approve"}
          </button>
          <button
            onClick={handleBulkExport}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t("exportSelected") || "Export"}
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            {t("deleteSelected") || "Delete"}
          </button>
          <button
            onClick={() => setSelectedDocIds(new Set())}
            className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary hover:text-brand-text-primary dark:hover:text-dark-brand-text-primary transition-colors ltr:ml-1 rtl:mr-1"
          >
            {t("clearSelection") || "Clear"}
          </button>
        </div>
      )}

      {/* Process Map Metadata Modal */}
      <Suspense fallback={null}>
        <ProcessMapMetadataModal
          isOpen={isProcessMapModalOpen}
          onClose={() => setIsProcessMapModalOpen(false)}
          onSave={handleAddProcessMap}
        />
      </Suspense>

      {/* Document Metadata Modal */}
      <Suspense fallback={null}>
        <DocumentMetadataModal
          isOpen={isMetaModalOpen}
          onClose={() => setIsMetaModalOpen(false)}
          onSave={handleCreateDocument}
        />
      </Suspense>

      {signingDoc && (
        <SignatureModal
          isOpen={!!signingDoc}
          onClose={() => setSigningDoc(null)}
          onConfirm={() => handleConfirmSignature()}
          actionTitle={`${t("approve")} "${signingDoc.name[lang]}"`}
          signatureStatement={t("signatureStatementDocument")}
          confirmActionText={t("signAndApprove")}
        />
      )}

      {viewingDoc && viewingDoc.type !== "Process Map" && (
        <Suspense fallback={null}>
          <DocumentEditorModal
            isOpen={!!viewingDoc}
            onClose={() => setViewingDoc(null)}
            document={viewingDoc}
            onSave={handleSaveDocument}
            standards={standards}
          />
        </Suspense>
      )}

      {viewingDoc && viewingDoc.type === "Process Map" && (
        <Suspense fallback={null}>
          <ProcessMapEditor
            isOpen={!!viewingDoc}
            onClose={() => setViewingDoc(null)}
            document={viewingDoc}
            onSave={handleSaveDocument}
            isSaving={isSaving}
          />
        </Suspense>
      )}

      {viewingPDF && (
        <Suspense fallback={null}>
          <PDFViewerModal
            isOpen={!!viewingPDF}
            onClose={() => setViewingPDF(null)}
            fileUrl={viewingPDF.fileUrl || ""}
            fileName={viewingPDF.name[lang]}
          />
        </Suspense>
      )}
    </div>
  );
};

export default DocumentControlHubPage;
