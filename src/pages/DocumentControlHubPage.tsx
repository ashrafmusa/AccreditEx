import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../hooks/useToast";
import { ContextualHelp } from "../components/common/ContextualHelp";
import { getHelpContent } from "../data/helpContent";
import {
  AppDocument,
  User,
  UserRole,
  Standard,
  Department,
  NavigationState,
} from "../types";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  permissionService,
  Action,
  Resource,
} from "@/services/permissionService";
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
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  PaperClipIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
const AIDocumentGenerator = lazy(
  () => import("../components/ai/AIDocumentGenerator"),
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
  navigation?: NavigationState;
  setNavigation?: (state: NavigationState) => void;
  onUpdateDocument: (updatedDocument: AppDocument) => Promise<void> | void;
  onCreateDocument: (data: {
    name: { en: string; ar: string };
    type: AppDocument["type"];
    fileUrl?: string;
    tags?: string[];
    category?: string;
    departmentIds?: string[];
    content?: { en: string; ar: string };
  }) => Promise<void> | void;
  onAddProcessMap: (data: {
    name: { en: string; ar: string };
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => Promise<void> | void;
  onDeleteDocument: (docId: string) => Promise<void> | void;
  onApproveDocument: (docId: string) => Promise<void> | void;
}

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string; t: (key: string) => string }> = ({
  status,
  t,
}) => {
  const colors: Record<string, string> = {
    Approved:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    "Pending Review":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    "Under Review":
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    Draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    Obsolete:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };
  const statusKey = status.toLowerCase().replace(/\s+/g, "");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {t(statusKey) || status}
    </span>
  );
};

// --- Type Badge Component ---
const TypeBadge: React.FC<{ type: string; t: (key: string) => string }> = ({
  type,
  t,
}) => {
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
  const typeKey = type.toLowerCase().replace(/\s+/g, "");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
    >
      {t(typeKey) || type}
    </span>
  );
};

// --- Type Icon Map for Grid Cards ---
const DOC_TYPE_ICON_MAP: Record<
  string,
  { icon: React.ElementType; bgColor: string; iconColor: string }
> = {
  Policy: {
    icon: ShieldCheckIcon,
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  Procedure: {
    icon: ClipboardDocumentListIcon,
    bgColor: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-500 dark:text-green-400",
  },
  "Process Map": {
    icon: ArrowPathIcon,
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-500 dark:text-teal-400",
  },
  Evidence: {
    icon: PaperClipIcon,
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  Report: {
    icon: ChartBarIcon,
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-500 dark:text-purple-400",
  },
};

const DocumentControlHubPage: React.FC<DocumentControlHubPageProps> = ({
  documents,
  standards,
  departments,
  currentUser,
  navigation,
  setNavigation,
  onUpdateDocument,
  onCreateDocument,
  onAddProcessMap,
  onDeleteDocument,
  onApproveDocument,
}) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const { projects } = useProjectStore();
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [metaModalPreselectedType, setMetaModalPreselectedType] = useState<
    AppDocument["type"] | undefined
  >(undefined);
  const [isProcessMapModalOpen, setIsProcessMapModalOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<AppDocument | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close Add New dropdown on outside click
  useEffect(() => {
    if (!isAddMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddMenuOpen]);
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
  const canModify = permissionService.can(
    currentUser,
    Action.Delete,
    Resource.Document,
  );
  const canCreate = permissionService.can(
    currentUser,
    Action.Create,
    Resource.Document,
  );
  const canApprove = permissionService.can(
    currentUser,
    Action.Approve,
    Resource.Document,
  );
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // --- New state additions ---
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilterKey>("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Auto-apply filter from navigation (e.g., "overdue" from AdminDashboard)
  useEffect(() => {
    if (navigation?.filter === "overdue") {
      setActiveQuickFilter("overdue");
    }
  }, [navigation?.filter]);

  // Auto-open document from navigation (e.g., from PendingApprovalsWidget)
  useEffect(() => {
    if (navigation?.documentId && documents.length > 0) {
      const targetDoc = documents.find((d) => d.id === navigation.documentId);
      if (targetDoc) {
        if (targetDoc.type === "Process Map") {
          setIsProcessMapModalOpen(true);
        } else {
          setViewingDoc(targetDoc);
        }
      }
    }
  }, [navigation?.documentId, documents]);

  const handleConfirmSignature = async () => {
    if (!signingDoc) return;

    setIsSaving(true);
    try {
      await onApproveDocument(signingDoc.id);
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
      await onUpdateDocument(doc);
      toast.success(
        t("documentSavedSuccessfully") || "Document saved successfully",
      );
      // Update viewingDoc in-place so the editor stays open with fresh data
      setViewingDoc(doc);
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

  /** Lightweight auto-save — no toast, no close */
  const handleAutoSaveDocument = async (doc: AppDocument) => {
    try {
      await onUpdateDocument(doc);
      setViewingDoc(doc);
    } catch (error) {
      console.error("Auto-save failed:", error);
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
      await onDeleteDocument(docId);
      toast.success(
        t("documentDeletedSuccessfully") || "Document deleted successfully",
      );
    } catch (error: unknown) {
      let errorMsg: string;
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        (error as { name: string }).name === "PermissionError"
      ) {
        errorMsg = (error as Error).message;
      } else if (
        error instanceof Error &&
        error.message?.includes("permission")
      ) {
        errorMsg =
          t("insufficientPermissions") ||
          "Insufficient permissions. Your account may need to be re-synchronized. Try logging out and back in.";
      } else {
        errorMsg =
          error instanceof Error
            ? error.message
            : t("failedToDeleteDocument") || "Failed to delete document";
      }
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
    content?: { en: string; ar: string };
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

      await onCreateDocument(docData as Parameters<typeof onCreateDocument>[0]);
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

  // Reset pagination on filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeQuickFilter,
    activeCategory,
    searchQuery,
    activeFilters,
    showOnlyMyDocs,
  ]);

  // --- Pagination ---
  const totalPages = Math.max(
    1,
    Math.ceil(controlledDocuments.length / ITEMS_PER_PAGE),
  );
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return controlledDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [controlledDocuments, currentPage]);

  // --- Collect all unique tags for search ---
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach((doc) => doc.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [documents]);

  const stats = useMemo(() => {
    const allControlled = documents.filter((d) => d.isControlled);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentDocs = allControlled.filter(
      (d) => d.uploadedAt && new Date(d.uploadedAt) >= thirtyDaysAgo,
    );
    const recentApproved = recentDocs.filter(
      (d) => d.status === "Approved",
    ).length;
    const recentPending = recentDocs.filter(
      (d) => d.status === "Pending Review",
    ).length;
    return {
      total: allControlled.length,
      approved: allControlled.filter((d) => d.status === "Approved").length,
      pending: allControlled.filter((d) => d.status === "Pending Review")
        .length,
      drafts: allControlled.filter((d) => d.status === "Draft").length,
      overdue: allControlled.filter(
        (d) => d.reviewDate && new Date(d.reviewDate) < now,
      ).length,
      recentTotal: recentDocs.length,
      recentApproved,
      recentPending,
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
  const handleBulkApprove = useCallback(async () => {
    const results = await Promise.allSettled(
      Array.from(selectedDocIds).map((docId) => onApproveDocument(docId)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    if (failed > 0) {
      toast.error(
        t("bulkApprovePartialFail") ||
          `${succeeded} approved, ${failed} failed`,
      );
    } else {
      toast.success(
        t("bulkApproveSuccess") || `${succeeded} documents approved`,
      );
    }
    setSelectedDocIds(new Set());
  }, [selectedDocIds, onApproveDocument, toast, t]);

  const handleBulkDelete = useCallback(async () => {
    if (
      !window.confirm(
        t("confirmBulkDelete") ||
          `Are you sure you want to delete ${selectedDocIds.size} documents?`,
      )
    ) {
      return;
    }
    const results = await Promise.allSettled(
      Array.from(selectedDocIds).map((docId) => onDeleteDocument(docId)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    if (failed > 0) {
      toast.error(
        t("bulkDeletePartialFail") || `${succeeded} deleted, ${failed} failed`,
      );
    } else {
      toast.success(t("bulkDeleteSuccess") || `${succeeded} documents deleted`);
    }
    setSelectedDocIds(new Set());
  }, [selectedDocIds, onDeleteDocument, toast, t]);

  const handleBulkExport = useCallback(() => {
    const exportData = controlledDocuments.filter((d) =>
      selectedDocIds.has(d.id),
    );
    // Export as CSV for better usability
    const csvHeaders = [
      "Document Number",
      "Name (EN)",
      "Name (AR)",
      "Type",
      "Status",
      "Version",
      "Category",
      "Review Date",
      "Tags",
    ];
    const csvRows = exportData.map((d) => [
      d.documentNumber || "",
      `"${(d.name.en || "").replace(/"/g, '""')}"`,
      `"${(d.name.ar || "").replace(/"/g, '""')}"`,
      d.type,
      d.status,
      `v${d.currentVersion}`,
      d.category || "",
      d.reviewDate ? new Date(d.reviewDate).toLocaleDateString() : "",
      (d.tags || []).join("; "),
    ]);
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents-export-${new Date().toISOString().split("T")[0]}.csv`;
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
    if (doc.fileUrl) {
      const url = doc.fileUrl.toLowerCase();
      if (
        url.endsWith(".pdf") ||
        url.includes("/pdf") ||
        url.includes("f_pdf")
      ) {
        setViewingPDF(doc);
        return;
      }
      if (
        url.endsWith(".docx") ||
        url.endsWith(".xlsx") ||
        url.endsWith(".pptx") ||
        url.endsWith(".doc") ||
        url.endsWith(".xls")
      ) {
        // For office files, open in editor which can handle rich text content
        setViewingDoc(doc);
        return;
      }
    }
    // Default: open in document editor
    setViewingDoc(doc);
  }, []);

  return (
    <div className="space-y-6">
      {/* ===== Page Header ===== */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <DocumentTextIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
                {t("documentControl")}
              </h1>
              <ContextualHelp
                content={
                  getHelpContent("documentControl") || {
                    title: t("documentControl") || "Document Control",
                    description: "",
                  }
                }
              />
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
            <div className="relative" ref={addMenuRef}>
              <Button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="w-full sm:w-auto gap-2"
                aria-haspopup="true"
                aria-expanded={isAddMenuOpen}
              >
                <PlusIcon className="w-5 h-5" />
                {t("addNew")}
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isAddMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
              {isAddMenuOpen && (
                <div
                  className="absolute top-full ltr:right-0 rtl:left-0 mt-2 w-64 bg-white dark:bg-dark-brand-surface rounded-xl shadow-xl border border-gray-200 dark:border-dark-brand-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="p-2 space-y-0.5">
                    <p className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">
                      {t("documents") || "Documents"}
                    </p>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMetaModalPreselectedType("Policy");
                        setIsMetaModalOpen(true);
                        setIsAddMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-blue-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                    >
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <ShieldCheckIcon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-start">
                        <div className="font-medium">
                          {t("newPolicy") || "New Policy"}
                        </div>
                        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {t("newPolicyDesc") ||
                            "Organizational governance policy"}
                        </div>
                      </div>
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMetaModalPreselectedType("Procedure");
                        setIsMetaModalOpen(true);
                        setIsAddMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-purple-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                    >
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                        <ClipboardDocumentListIcon className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="text-start">
                        <div className="font-medium">
                          {t("newProcedure") || "New Procedure"}
                        </div>
                        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {t("newProcedureDesc") ||
                            "Step-by-step operational procedure"}
                        </div>
                      </div>
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsProcessMapModalOpen(true);
                        setIsAddMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-teal-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                    >
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                        <ArrowPathIcon className="w-5 h-5 text-teal-500" />
                      </div>
                      <div className="text-start">
                        <div className="font-medium">{t("processMap")}</div>
                        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {t("createProcessMap") || "Design a process flow"}
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMetaModalPreselectedType("Evidence");
                        setIsMetaModalOpen(true);
                        setIsAddMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-orange-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                    >
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                        <DocumentPlusIcon className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="text-start">
                        <div className="font-medium">
                          {t("uploadEvidence") || "Upload Evidence"}
                        </div>
                        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {t("uploadEvidenceDesc") || "Upload supporting files"}
                        </div>
                      </div>
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setShowAIGenerator(true);
                        setIsAddMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-purple-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                    >
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="text-start">
                        <div className="font-medium">
                          {t("aiDocumentGenerator") || "AI Generate"}
                        </div>
                        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {t("aiDocumentGeneratorDescription") ||
                            "Generate documents with AI"}
                        </div>
                      </div>
                    </button>
                  </div>
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
          isMobileOpen={isMobileSidebarOpen}
          onMobileOpen={() => setIsMobileSidebarOpen(true)}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
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
                stats.recentTotal > 0
                  ? {
                      direction: "up",
                      value: stats.recentTotal,
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
                stats.recentApproved > 0
                  ? {
                      direction: "up",
                      value: stats.recentApproved,
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
                stats.recentPending > 0
                  ? {
                      direction:
                        stats.pending > stats.recentPending ? "up" : "down",
                      value: stats.recentPending,
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border shrink-0
                    ${
                      isActive
                        ? "bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/25 scale-[1.02]"
                        : "bg-white dark:bg-dark-brand-surface text-brand-text-secondary dark:text-dark-brand-text-secondary border-gray-200 dark:border-dark-brand-border hover:border-brand-primary/50 hover:text-brand-primary dark:hover:text-brand-primary"
                    }`}
                >
                  <FilterIcon className="w-4 h-4" />
                  {filter.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold
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
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2.5 bg-white dark:bg-dark-brand-surface border border-gray-200 dark:border-dark-brand-border rounded-lg text-gray-500 dark:text-gray-400 hover:text-brand-primary transition-colors"
              aria-label={t("openFilters") || "Open Filters"}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-[200px]">
              <DocumentSearch
                onSearch={setSearchQuery}
                onFilter={setActiveFilters}
                resultCount={controlledDocuments.length}
                availableTags={allTags}
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
                aria-label={t("listView") || "List View"}
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
                aria-label={t("gridView") || "Grid View"}
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
            /* ===== List/Table View — using ControlledDocumentsTable ===== */
            <ControlledDocumentsTable
              documents={paginatedDocuments}
              canModify={canModify}
              onApprove={(doc) => setSigningDoc(doc)}
              onDelete={(docId) => handleDeleteDocument(docId)}
              onView={handleViewDoc}
              selectedDocIds={canModify ? selectedDocIds : undefined}
              onToggleSelect={canModify ? toggleDocSelection : undefined}
              onSelectAll={canModify ? toggleSelectAll : undefined}
              totalCount={controlledDocuments.length}
            />
          ) : (
            /* ===== Grid/Card View ===== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedDocuments.map((doc) => {
                const isOverdue =
                  doc.reviewDate && new Date(doc.reviewDate) < new Date();
                const typeIcon = DOC_TYPE_ICON_MAP[doc.type] || {
                  icon: DocumentTextIcon,
                  bgColor: "bg-blue-50 dark:bg-blue-900/20",
                  iconColor: "text-blue-500 dark:text-blue-400",
                };
                const TypeIcon = typeIcon.icon;
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
                      <div
                        className={`p-2 rounded-lg ${typeIcon.bgColor} shrink-0`}
                      >
                        <TypeIcon className={`w-5 h-5 ${typeIcon.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                          {doc.documentNumber && (
                            <span className="mr-1.5 px-1.5 py-0.5 text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              {doc.documentNumber}
                            </span>
                          )}
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
                      <TypeBadge type={doc.type} t={t} />
                      <StatusBadge status={doc.status} t={t} />
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
                    <div
                      className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleViewDoc(doc)}
                        className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary/80 font-medium"
                        aria-label={t("view") || "View"}
                      >
                        <EyeIcon className="w-4 h-4" />
                        {t("view") || "View"}
                      </button>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          aria-label={t("download") || "Download"}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {t("download") || "Download"}
                        </a>
                      )}
                      {canModify && doc.status === "Pending Review" && (
                        <button
                          onClick={() => setSigningDoc(doc)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          {t("approve")}
                        </button>
                      )}
                      {canModify && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ltr:ml-auto rtl:mr-auto"
                        >
                          <TrashIcon className="w-4 h-4" />
                          {t("delete")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== Pagination ===== */}
          {controlledDocuments.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("showingPage") || "Page"} {currentPage} {t("of") || "of"}{" "}
                {totalPages}
                <span className="hidden sm:inline">
                  {" "}
                  &middot; {controlledDocuments.length}{" "}
                  {t("documents") || "documents"}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-dark-brand-border text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label={t("previousPage") || "Previous page"}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-brand-primary text-white shadow-sm"
                          : "text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-dark-brand-border"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-dark-brand-border text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label={t("nextPage") || "Next page"}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Bulk Actions Floating Bar ===== */}
      {selectedDocIds.size > 0 && (
        <div
          className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50 flex items-center gap-4 px-6 py-3 bg-brand-surface dark:bg-dark-brand-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-brand-border"
          role="status"
          aria-live="polite"
        >
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
          onClose={() => {
            setIsMetaModalOpen(false);
            setMetaModalPreselectedType(undefined);
          }}
          onSave={handleCreateDocument}
          preselectedType={metaModalPreselectedType}
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
            onAutoSave={handleAutoSaveDocument}
            standards={standards}
            allDocuments={documents}
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

      {showAIGenerator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAIGenerator(false)}
        >
          <div
            className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("aiDocumentGenerator") || "AI Document Generator"}
              </h2>
              <button
                onClick={() => setShowAIGenerator(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <Suspense
              fallback={<div className="py-8 text-center">Loading...</div>}
            >
              <AIDocumentGenerator
                onDocumentGenerated={async (response) => {
                  try {
                    // Create a real document from AI-generated content
                    const docName =
                      response.content
                        .match(/<h[12][^>]*>([^<]+)<\/h[12]>/i)?.[1]
                        ?.trim() || "AI Generated Document";
                    await onCreateDocument({
                      name: { en: docName, ar: docName },
                      type: "Policy",
                      content: { en: response.content, ar: "" },
                      tags: ["ai-generated"],
                    });
                    toast.success(
                      t("aiDocumentSaved") ||
                        "AI-generated document saved to Document Control.",
                    );
                  } catch {
                    toast.error(
                      t("failedToSaveAiDoc") ||
                        "Failed to save AI-generated document.",
                    );
                  }
                  setShowAIGenerator(false);
                }}
                context={{
                  userRole: currentUser.role,
                  departmentId: currentUser.departmentId || "",
                }}
                preferences={{
                  tone: "professional",
                  length: "comprehensive",
                  format: "markdown",
                }}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentControlHubPage;
