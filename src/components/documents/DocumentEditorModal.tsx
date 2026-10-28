import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSanitizedHTML } from "../../hooks/useSanitizedHTML";
import { useTranslation } from "../../hooks/useTranslation";
import { exportToDocx } from "../../services/docxExportService";
import { AppDocument, Standard } from "../../types";
import { getLocalizedValue } from "@/utils/localization";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  LinkIcon,
  PencilIcon,
  PrinterIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SpinnerIcon,
  XMarkIcon,
} from "../icons";
import { useToast } from "@/hooks/useToast";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import AuditChangeControlPanel from "./AuditChangeControlPanel";
import BatchAuditModal from "./BatchAuditModal";
import CommentsPanel from "./CommentsPanel";
import ComplianceScoringPanel from "./ComplianceScoringPanel";
import DocumentAuditPanel from "./DocumentAuditPanel";
import DocumentEditorSidebar from "./DocumentEditorSidebar";
import DocumentRelationshipsPanel from "./DocumentRelationshipsPanel";
import DocumentVersionComparisonModal from "./DocumentVersionComparisonModal";

const RichTextEditor = lazy(() => import("./RichTextEditor"));

// --- Helpers ---
const getWordCount = (html: string): number => {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
};
const getReadingTime = (wordCount: number): number =>
  Math.max(1, Math.ceil(wordCount / 200));

const DOC_TYPE_COLORS: Record<string, string> = {
  Policy: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Procedure:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Report:
    "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/90/40 dark:text-brand-primary",
  Evidence:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Process Map":
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

const AUTOSAVE_INTERVAL_MS = 10_000;

type SaveStatus = "idle" | "saving" | "saved" | "unsaved" | "error";

// --- Props ---
interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => Promise<void>;
  standards: Standard[];
  allDocuments?: AppDocument[];
  onAutoSave?: (doc: AppDocument) => Promise<void>;
  canApprove?: boolean;
  onApproveRequest?: (doc: AppDocument) => void;
  organizationName?: string;
}

// --- Component ---
const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  document: documentData,
  onSave,
  standards,
  allDocuments = [],
  onAutoSave,
  canApprove = false,
  onApproveRequest,
  organizationName,
}) => {
  const { t, lang, dir } = useTranslation();
  const toast = useToast();
  const { currentUser, updateUser } = useUserStore();
  const { projects, updateChecklistItem } = useProjectStore();
  const currentOrganization = useTenantStore(
    (state) => state.currentOrganization,
  );
  const effectiveOrgName =
    organizationName ||
    currentOrganization?.name ||
    currentUser?.profile?.organizationName ||
    "Healthcare Facility";

  // Core state
  const [document, setDocument] = useState<AppDocument>(documentData);
  const [isEditMode, setIsEditMode] = useState(documentData.status === "Draft");
  const [viewingVersion, setViewingVersion] = useState<number | "current">(
    "current",
  );
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    version1: number | "current";
    version2: number | "current";
  }>({ isOpen: false, version1: "current", version2: "current" });

  // New state for enhancements
  const [editorLang, setEditorLang] = useState<"en" | "ar">(
    lang as "en" | "ar",
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [pendingVersionDoc, setPendingVersionDoc] =
    useState<AppDocument | null>(null);
  const [showShortcutsTooltip, setShowShortcutsTooltip] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showBatchAudit, setShowBatchAudit] = useState(false);
  const [showChangeControl, setShowChangeControl] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    documentData.status === "Approved",
  );
  const [showComplianceScoringPanel, setShowComplianceScoringPanel] =
    useState(false);
  const [showRelationshipsPanel, setShowRelationshipsPanel] = useState(false);
  const [showStandardLinker, setShowStandardLinker] = useState(false);
  const [standardSearchQuery, setStandardSearchQuery] = useState("");
  const [selectedProjectIdForLink, setSelectedProjectIdForLink] =
    useState<string>("");

  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentSnapshotRef = useRef<string>(
    JSON.stringify(documentData.content),
  );

  // Sync props → state on open / data change
  useEffect(() => {
    setDocument(documentData);
    setIsEditMode(documentData.status === "Draft");
    setIsSidebarCollapsed(documentData.status === "Approved");
    setViewingVersion("current");
    setHasUnsavedChanges(false);
    setSaveStatus("idle");
    setLastSavedAt(null);
    contentSnapshotRef.current = JSON.stringify(documentData.content);
    setEditorLang(lang as "en" | "ar");
  }, [documentData, isOpen, lang]);

  // --- Derived values ---
  const currentContent = useMemo(() => {
    if (viewingVersion === "current") {
      return document.content;
    }
    const historyItem = (document.versionHistory || []).find(
      (v) => v.version === viewingVersion,
    );
    return historyItem ? historyItem.content : document.content;
  }, [document, viewingVersion]);

  const activeContentHtml = currentContent?.[editorLang] || "";
  const wordCount = useMemo(
    () => getWordCount(activeContentHtml),
    [activeContentHtml],
  );
  const readingTime = useMemo(() => getReadingTime(wordCount), [wordCount]);

  const timeSinceSave = useMemo(() => {
    if (!lastSavedAt) return null;
    const diffMs = Date.now() - lastSavedAt.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return t("justNow") || "Just now";
    return `${diffMin} ${t("minAgo") || "min ago"}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSavedAt, saveStatus, t]);

  // --- Track unsaved changes ---
  useEffect(() => {
    const current = JSON.stringify(document.content);
    if (current !== contentSnapshotRef.current) {
      setHasUnsavedChanges(true);
      setSaveStatus("unsaved");
    }
  }, [document.content]);

  // --- Protect against browser close/refresh with unsaved changes ---
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // --- Autosave timer ---
  useEffect(() => {
    if (!isEditMode) return;

    autosaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        void performSave(true);
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, hasUnsavedChanges, document]);

  // --- Save logic ---
  const performSave = useCallback(
    async (isAutoSave = false): Promise<boolean> => {
      setSaveStatus("saving");

      let docToSave = { ...document };
      if (document.status === "Approved" && isEditMode && !isAutoSave) {
        const newVersionDoc = {
          ...document,
          status: "Draft" as const,
          currentVersion: document.currentVersion + 1,
          versionHistory: [
            ...(document.versionHistory || []),
            {
              version: document.currentVersion,
              date: document.approvalDate || new Date().toISOString(),
              uploadedBy: document.approvedBy || "",
              content: documentData.content ?? { en: "", ar: "" },
            } as AppDocument["versionHistory"] extends (infer U)[] ? U : never,
          ],
        };
        // Show dialog instead of window.confirm — store pending doc and abort this save
        setSaveStatus("unsaved");
        setPendingVersionDoc(newVersionDoc);
        setShowNewVersionDialog(true);
        return false;
      }

      try {
        if (isAutoSave && onAutoSave) {
          await onAutoSave(docToSave);
        } else {
          await onSave(docToSave);
        }
      } catch (error) {
        console.error("Document save failed:", error);
        setHasUnsavedChanges(true);
        setSaveStatus("error");
        return false;
      }

      contentSnapshotRef.current = JSON.stringify(docToSave.content);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());

      // Brief "saving" → "saved" animation
      setTimeout(() => setSaveStatus("saved"), 600);
      return true;
    },
    [document, documentData.content, isEditMode, onAutoSave, onSave],
  );

  const handleSave = useCallback(() => {
    void performSave(false);
  }, [performSave]);

  // --- Close with unsaved-changes guard ---
  const attemptClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleSaveAndClose = useCallback(async () => {
    if (!(await performSave(false))) return;
    setShowUnsavedDialog(false);
    onClose();
  }, [performSave, onClose]);

  const handleDiscardAndClose = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    onClose();
  }, [onClose]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd+S  →  Save
      if (isMod && e.key === "s") {
        e.preventDefault();
        if (isEditMode) handleSave();
      }

      // Escape  →  Close (with guard)
      if (e.key === "Escape") {
        e.preventDefault();
        attemptClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isEditMode, handleSave, attemptClose]);

  // --- Misc handlers ---
  const canEdit = document.status === "Draft" || document.status === "Approved";

  const handleCompareVersions = (
    v1: number | "current",
    v2: number | "current",
  ) => {
    setComparisonModal({ isOpen: true, version1: v1, version2: v2 });
  };

  // --- Document Linking ---
  const handleLinkDocument = () => {
    setLinkSearchQuery("");
    setShowLinkPicker(true);
  };

  const handleAddRelatedDocument = (docId: string) => {
    const existing = document.relatedDocumentIds || [];
    if (!existing.includes(docId) && docId !== document.id) {
      setDocument((prev) => ({
        ...prev,
        relatedDocumentIds: [...(prev.relatedDocumentIds || []), docId],
      }));
      setHasUnsavedChanges(true);
      setSaveStatus("unsaved");
    }
    setShowLinkPicker(false);
  };

  const handleRelatedDocumentClick = async (docId: string) => {
    // Switch to viewing the clicked related document inline — find it in allDocuments
    const target = allDocuments.find((d) => d.id === docId);
    if (target) {
      // Save current document if unsaved, then switch
      if (hasUnsavedChanges) {
        if (!(await performSave(false))) return;
      }
      setDocument(target);
      setIsEditMode(target.status === "Draft");
      setViewingVersion("current");
      setHasUnsavedChanges(false);
      setSaveStatus("idle");
      contentSnapshotRef.current = JSON.stringify(target.content);
    }
  };

  const linkPickerDocs = useMemo(() => {
    if (!showLinkPicker) return [];
    const existing = new Set(document.relatedDocumentIds || []);
    existing.add(document.id);
    return allDocuments
      .filter((d) => !existing.has(d.id))
      .filter(
        (d) =>
          !linkSearchQuery ||
          getLocalizedValue(d.name, "en").toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
          getLocalizedValue(d.name, "ar").toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
          d.documentNumber
            ?.toLowerCase()
            .includes(linkSearchQuery.toLowerCase()),
      )
      .slice(0, 10);
  }, [
    showLinkPicker,
    allDocuments,
    document.id,
    document.relatedDocumentIds,
    linkSearchQuery,
  ]);

  const handleExportToDocx = async () => {
    try {
      const fileName = `${getLocalizedValue(document.name, editorLang)}_v${document.currentVersion}.docx`;
      await exportToDocx(
        currentContent?.[editorLang] || currentContent?.[lang] || "",
        { fileName },
      );
    } catch (error) {
      console.error("Failed to export document:", error);
      alert(t("exportFailed") || "Failed to export document to DOCX format");
    }
  };

  const docControlNumber = useMemo(
    () =>
      document.documentNumber ||
      `${document.type === "Policy" ? "POL" : document.type === "Procedure" ? "SOP" : "DOC"}-${document.id.slice(0, 6).toUpperCase()}`,
    [document.documentNumber, document.id, document.type],
  );

  // --- Staff Read & Acknowledge Attestation ---
  const isAcknowledgedByCurrentUser = useMemo(() => {
    if (!currentUser) return false;
    const ackKey = `${document.id}_v${document.currentVersion}`;
    if (currentUser.readAndAcknowledge?.[ackKey] || currentUser.readAndAcknowledge?.[document.id]) {
      return true;
    }
    if (
      (document.acknowledgedBy || []).some(
        (entry) =>
          entry.userId === currentUser.id &&
          entry.version === document.currentVersion,
      )
    ) {
      return true;
    }
    try {
      const localAcks = JSON.parse(
        localStorage.getItem("accreditex_policy_acknowledgments") || "{}",
      );
      return Boolean(localAcks[`${currentUser.id}_${ackKey}`]);
    } catch {
      return false;
    }
  }, [currentUser, document.acknowledgedBy, document.currentVersion, document.id]);

  const acknowledgmentCount = useMemo(() => {
    const versionAcks = (document.acknowledgedBy || []).filter(
      (a) => a.version === document.currentVersion,
    );
    const uniqueUsers = new Set(versionAcks.map((a) => a.userId));
    if (currentUser && isAcknowledgedByCurrentUser) {
      uniqueUsers.add(currentUser.id);
    }
    return uniqueUsers.size;
  }, [
    currentUser,
    document.acknowledgedBy,
    document.currentVersion,
    isAcknowledgedByCurrentUser,
  ]);

  const handleAcknowledgePolicy = useCallback(async () => {
    if (!currentUser) return;
    const ackKey = `${document.id}_v${document.currentVersion}`;
    const newEntry = {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      version: document.currentVersion,
      acknowledgedAt: new Date().toISOString(),
    };

    try {
      const localAcks = JSON.parse(
        localStorage.getItem("accreditex_policy_acknowledgments") || "{}",
      );
      localAcks[`${currentUser.id}_${ackKey}`] = newEntry.acknowledgedAt;
      localStorage.setItem(
        "accreditex_policy_acknowledgments",
        JSON.stringify(localAcks),
      );
    } catch {
      // ignore storage errors
    }

    const existingList = (document.acknowledgedBy || []).filter(
      (a) =>
        !(a.userId === currentUser.id && a.version === document.currentVersion),
    );
    const updatedDoc: AppDocument = {
      ...document,
      acknowledgedBy: [...existingList, newEntry],
    };
    setDocument(updatedDoc);

    try {
      if (onAutoSave) {
        await onAutoSave(updatedDoc);
      } else {
        await onSave(updatedDoc);
      }
    } catch {
      // Fallback: update user record if user doesn't have document write permission
    }

    try {
      await updateUser({
        ...currentUser,
        readAndAcknowledge: {
          ...(currentUser.readAndAcknowledge || {}),
          [document.id]: true,
          [ackKey]: true,
        },
      });
    } catch {
      // Non-blocking
    }

    toast.success(
      editorLang === "ar"
        ? "تم تسجيل قراءة واستيعاب السياسة بنجاح"
        : `Policy v${document.currentVersion} Read & Acknowledged by ${currentUser.name}`,
    );
  }, [
    currentUser,
    document,
    editorLang,
    onAutoSave,
    onSave,
    toast,
    updateUser,
  ]);

  // --- 1-Click Project Standard Evidence Linker ---
  const activeProjectForLink = useMemo(() => {
    const targetId =
      selectedProjectIdForLink || document.projectId || projects[0]?.id || "";
    return projects.find((p) => p.id === targetId) || projects[0] || null;
  }, [document.projectId, projects, selectedProjectIdForLink]);

  const linkedChecklistCount = useMemo(() => {
    let count = 0;
    for (const proj of projects) {
      for (const item of proj.checklist || []) {
        if ((item.evidenceFiles || []).includes(document.id)) {
          count += 1;
        }
      }
    }
    return count;
  }, [document.id, projects]);

  const matchingChecklistItems = useMemo(() => {
    if (!activeProjectForLink) return [];
    const docTokens = [
      getLocalizedValue(document.name, "en"),
      document.category || "",
      ...(document.tags || []),
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4);

    const q = standardSearchQuery.trim().toLowerCase();
    const list = (activeProjectForLink.checklist || []).map((item) => {
      const hay = `${item.standardId} ${item.item} ${item.category || ""}`.toLowerCase();
      const score = docTokens.reduce(
        (acc, tok) => (hay.includes(tok) ? acc + 1 : acc),
        0,
      );
      const isLinked = (item.evidenceFiles || []).includes(document.id);
      return { item, score, isLinked };
    });

    return list
      .filter(({ item }) => {
        if (!q) return true;
        return (
          item.standardId.toLowerCase().includes(q) ||
          item.item.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isLinked !== b.isLinked) return a.isLinked ? -1 : 1;
        return b.score - a.score;
      })
      .slice(0, 20);
  }, [
    activeProjectForLink,
    document.category,
    document.id,
    document.name,
    document.tags,
    standardSearchQuery,
  ]);

  const handleToggleLinkChecklistItem = useCallback(
    async (projectId: string, checklistItemId: string, currentlyLinked: boolean) => {
      const targetProj = projects.find((p) => p.id === projectId);
      const targetItem = targetProj?.checklist.find(
        (c) => c.id === checklistItemId,
      );
      if (!targetItem) return;

      const currentFiles = targetItem.evidenceFiles || [];
      const updatedFiles = currentlyLinked
        ? currentFiles.filter((id) => id !== document.id)
        : Array.from(new Set([...currentFiles, document.id]));

      await updateChecklistItem(projectId, checklistItemId, {
        evidenceFiles: updatedFiles,
      });

      toast.success(
        currentlyLinked
          ? `Unlinked from standard ${targetItem.standardId}`
          : `Linked "${getLocalizedValue(document.name, lang)}" as evidence for ${targetItem.standardId}`,
      );
    },
    [document.id, document.name, lang, projects, toast, updateChecklistItem],
  );

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printDir = editorLang === "ar" ? "rtl" : "ltr";
      const docTitle = getLocalizedValue(document.name, editorLang);
      const bodyHtml =
        currentContent?.[editorLang] || currentContent?.[lang] || "";
      const effectiveDateStr = document.approvalDate
        ? new Date(document.approvalDate).toLocaleDateString()
        : new Date(document.uploadedAt).toLocaleDateString();
      const reviewDateStr = document.reviewDate
        ? new Date(document.reviewDate).toLocaleDateString()
        : "Annual Review";
      const approvedByStr =
        document.approvedBy ||
        (document.status === "Approved"
          ? "Quality & Patient Safety Committee"
          : "Pending Final Sign-Off");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${printDir}" lang="${editorLang}">
        <head>
          <meta charset="utf-8" />
          <title>${docControlNumber} - ${docTitle}</title>
          <style>
            @page { margin: 18mm 16mm; }
            body {
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
              color: #0f172a;
              max-width: 840px;
              margin: 0 auto;
              padding: 12px;
              line-height: 1.6;
              font-size: 13.5px;
            }
            .control-header {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              border: 2px solid #0f172a;
            }
            .control-header th, .control-header td {
              border: 1px solid #334155;
              padding: 8px 12px;
              font-size: 12px;
              text-align: start;
            }
            .control-header .org-banner {
              background: #0f172a;
              color: #ffffff;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .control-header .label {
              background: #f1f5f9;
              font-weight: 700;
              color: #334155;
              width: 18%;
            }
            .status-stamp {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              border: 1px solid #047857;
              color: #047857;
              background: #ecfdf5;
            }
            h1, h2, h3 { color: #0f172a; margin-top: 1.2em; margin-bottom: 0.4em; }
            h1 { font-size: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            h2 { font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 14px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 7px 10px; }
            th { background: #f8fafc; font-weight: 600; }
            .signoff-footer {
              margin-top: 36px;
              width: 100%;
              border-collapse: collapse;
              page-break-inside: avoid;
            }
            .signoff-footer th, .signoff-footer td {
              border: 1px solid #475569;
              padding: 8px 12px;
              font-size: 11.5px;
            }
            .signoff-footer th { background: #f1f5f9; text-align: start; }
            .watermark {
              margin-top: 16px;
              text-align: center;
              font-size: 10.5px;
              color: #64748b;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <table class="control-header">
            <tr>
              <th colspan="4" class="org-banner">
                ${effectiveOrgName} &mdash; OFFICIAL CONTROLLED ${document.type.toUpperCase()}
              </th>
            </tr>
            <tr>
              <td class="label">Document Title</td>
              <td colspan="3"><strong>${docTitle}</strong></td>
            </tr>
            <tr>
              <td class="label">Document No.</td>
              <td><strong>${docControlNumber}</strong></td>
              <td class="label">Version &amp; Status</td>
              <td>v${document.currentVersion}.0 &nbsp; <span class="status-stamp">${document.status}</span></td>
            </tr>
            <tr>
              <td class="label">Effective Date</td>
              <td>${effectiveDateStr}</td>
              <td class="label">Next Review Date</td>
              <td>${reviewDateStr}</td>
            </tr>
            <tr>
              <td class="label">Category / Dept</td>
              <td>${document.category || document.type}</td>
              <td class="label">Approved By</td>
              <td>${approvedByStr}</td>
            </tr>
          </table>

          <div class="doc-body">
            ${bodyHtml}
          </div>

          <table class="signoff-footer">
            <tr>
              <th>Prepared / Uploaded By</th>
              <th>Reviewed By</th>
              <th>Approved &amp; Authorized By</th>
              <th>Staff Acknowledgments</th>
            </tr>
            <tr>
              <td>${document.uploadedBy || "Quality Coordinator"}</td>
              <td>Quality &amp; Accreditation Office</td>
              <td><strong>${approvedByStr}</strong><br/><small>${effectiveDateStr}</small></td>
              <td>${acknowledgmentCount} Staff Attested (v${document.currentVersion})</td>
            </tr>
          </table>

          <div class="watermark">
            CONTROLLED DOCUMENT COPY &bull; ${effectiveOrgName} &bull; Printed from AccreditEx Document Control on ${new Date().toLocaleString()} &bull; Verify latest version online before clinical or operational use.
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [
    acknowledgmentCount,
    currentContent,
    docControlNumber,
    document.approvalDate,
    document.approvedBy,
    document.category,
    document.currentVersion,
    document.name,
    document.reviewDate,
    document.status,
    document.type,
    document.uploadedAt,
    document.uploadedBy,
    editorLang,
    effectiveOrgName,
    lang,
  ]);

  const handleCopyContent = useCallback(
    (from: "en" | "ar", to: "en" | "ar") => {
      setDocument(
        (d) =>
          ({
            ...d,
            content: {
              ...(d.content || { en: "", ar: "" }),
              [to]: d.content?.[from] || "",
            },
          }) as AppDocument,
      );
      setHasUnsavedChanges(true);
      setSaveStatus("unsaved");
    },
    [],
  );

  const handleContentChange = useCallback(
    (html: string) => {
      setDocument(
        (d) =>
          ({
            ...d,
            content: {
              ...(d.content || { en: "", ar: "" }),
              [editorLang]: html,
            },
          }) as AppDocument,
      );
    },
    [editorLang],
  );

  // --- Save status indicator ---
  const renderSaveIndicator = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
            {t("saving") || "Saving..."}
          </span>
        );
      case "saved":
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="w-3.5 h-3.5" />
            {timeSinceSave
              ? `${t("saved") || "Saved"} ${timeSinceSave}`
              : t("saved") || "Saved"}
          </span>
        );
      case "unsaved":
        return (
          <span className="flex items-center gap-1.5 text-xs text-orange-500 dark:text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            {t("unsavedChanges") || "Unsaved changes"}
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
            {t("saveError") || "Save failed. Your changes are still unsaved."}
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — click does NOT close the editor to prevent accidental data loss.
           Use the ✕ button in the header or press Escape to close. */}
      <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter">
        {/* Modal container - supports fullscreen mode */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="document-editor-title"
          className={`bg-white dark:bg-dark-brand-surface shadow-2xl flex flex-col modal-content-enter ring-1 ring-black/5 dark:ring-white/10 ${
            isFullscreen
              ? "w-full h-full rounded-none"
              : "rounded-xl w-full max-w-7xl h-[92vh] m-4 lg:max-w-7xl md:max-w-5xl"
          }`}
          onClick={(e) => e.stopPropagation()}
          dir={dir}
        >
          {/* ========== HEADER ========== */}
          <header className="px-5 py-3 border-b dark:border-dark-brand-border flex justify-between items-center gap-3 shrink-0 bg-gray-50/80 dark:bg-gray-900/50 rounded-t-xl flex-wrap">
            {/* Left: title + meta */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    {docControlNumber}
                  </span>
                  <h3
                    id="document-editor-title"
                    className="text-lg font-semibold dark:text-dark-brand-text-primary truncate"
                  >
                    {getLocalizedValue(document.name, lang)}
                  </h3>
                  {/* Document type badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DOC_TYPE_COLORS[document.type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                  >
                    {t(document.type.toLowerCase().replace(" ", "") as never) ||
                      document.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    v{document.currentVersion}.0 &middot;{" "}
                    <span
                      className={`font-semibold ${
                        document.status === "Approved"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : document.status === "Pending Review"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {t(
                        (document.status.charAt(0).toLowerCase() +
                          document.status.slice(1).replace(" ", "")) as never,
                      ) || document.status}
                    </span>
                  </p>
                  {acknowledgmentCount > 0 && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      &middot; {acknowledgmentCount}{" "}
                      {t("staffAcknowledged") || "staff acknowledged"}
                    </span>
                  )}
                  {renderSaveIndicator()}
                </div>
              </div>
            </div>

            {/* Right: header actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Reader Mode / Edit Mode Switcher */}
              {canEdit && viewingVersion === "current" && (
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5 me-1">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      !isEditMode
                        ? "bg-brand-primary text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                    }`}
                  >
                    <BookOpenIcon className="w-3.5 h-3.5" />
                    {t("readerMode") || "Reader"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(true);
                      setIsSidebarCollapsed(false);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isEditMode
                        ? "bg-brand-primary text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                    }`}
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    {t("edit") || "Edit"}
                  </button>
                </div>
              )}

              {/* AI Document Audit button */}
              <button
                onClick={() => setShowAudit((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showAudit
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                aria-label={t("documentAuditor") || "Document Auditor"}
                title={t("documentAuditor") || "AI Document Compliance Audit"}
              >
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("aiAudit") || "AI Audit"}
                </span>
              </button>

              {/* Compliance Scoring button */}
              <button
                onClick={() => setShowComplianceScoringPanel((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showComplianceScoringPanel
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                aria-label={
                  t("documents.complianceScoring") || "Compliance Scoring"
                }
                title={
                  t("documents.complianceScoringHint") ||
                  "View compliance scoring data"
                }
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("score") || "Score"}
                </span>
              </button>

              {/* Comments button */}
              <button
                onClick={() => setShowComments((v) => !v)}
                data-tour="comments-button"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showComments
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                aria-label={t("comments") || "Comments"}
              >
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                <span className="hidden md:inline">
                  {t("comments") || "Comments"}
                </span>
              </button>

              {/* Relationships button */}
              <button
                onClick={() => setShowRelationshipsPanel((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showRelationshipsPanel
                    ? "bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                aria-label={t("documents.relationships") || "Relationships"}
                title={
                  t("documents.relationshipsHint") ||
                  "View document relationships"
                }
              >
                <LinkIcon className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {t("documents.relationships") || "Relations"}
                </span>
              </button>

              {/* Change Control button */}
              <button
                onClick={() => setShowChangeControl(true)}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={t("documents.changeControl") || "Change Control"}
                title={
                  t("documents.changeControlHint") ||
                  "View linked change requests from audits"
                }
              >
                <ShieldCheckIcon className="w-4 h-4" />
                <span className="hidden xl:inline">
                  {t("documents.changeControl") || "Changes"}
                </span>
              </button>

              {/* Toggle Metadata & AI Sidebar */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !isSidebarCollapsed
                    ? "bg-sky-50 dark:bg-sky-900/30 text-brand-primary dark:text-sky-300 border-brand-primary/30"
                    : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                aria-label={t("toggleSidebar") || "Toggle Metadata & AI Sidebar"}
                title={t("toggleSidebar") || "Toggle Metadata & AI Sidebar"}
              >
                <InformationCircleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isSidebarCollapsed
                    ? t("showSidebar") || "Metadata & AI"
                    : t("hideSidebar") || "Hide Panel"}
                </span>
              </button>

              {/* Help & Shortcuts button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowHelpTooltip((v) => !v);
                    setShowShortcutsTooltip(false);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  aria-label={t("help") || "Help"}
                  title={t("help") || "Help"}
                >
                  <QuestionMarkCircleIcon className="w-5 h-5" />
                </button>
                {showHelpTooltip && (
                  <div className="absolute end-0 top-full mt-1 z-10 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-3 text-xs">
                    <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      {t("quickHelp") || "Quick Help"}
                    </p>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400 list-disc ps-4">
                      <li>{t("save") || "Save"}: Ctrl+S</li>
                      <li>{t("close") || "Close"}: Esc</li>
                      <li>Switch English / العربية anytime in Reader or Edit mode</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={attemptClose}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={t("close") || "Close"}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* ========== MAIN ========== */}
          <main className="grow flex overflow-hidden relative">
            {/* Comments Panel - Desktop: Sidebar, Mobile: Fullscreen Overlay */}
            {showComments && (
              <>
                {/* Mobile: Fullscreen overlay */}
                <div className="md:hidden absolute inset-0 z-10 bg-white dark:bg-dark-brand-surface">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b dark:border-dark-brand-border">
                      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                        {t("comments") || "Comments"}
                      </h3>
                      <button
                        onClick={() => setShowComments(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <CommentsPanel
                        documentId={document.id}
                        onClose={() => setShowComments(false)}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Sidebar */}
                <div className="hidden md:block w-80 border-s dark:border-dark-brand-border shrink-0 bg-gray-50/50 dark:bg-gray-900/20">
                  <CommentsPanel
                    documentId={document.id}
                    onClose={() => setShowComments(false)}
                  />
                </div>
              </>
            )}

            {/* Audit Panel - Desktop: Sidebar, Mobile: Fullscreen Overlay */}
            {showAudit && (
              <>
                {/* Mobile: Fullscreen overlay */}
                <div className="md:hidden absolute inset-0 z-10 bg-white dark:bg-dark-brand-surface">
                  <DocumentAuditPanel
                    content={
                      currentContent?.[
                        viewingVersion === "current" ? editorLang : "en"
                      ] || ""
                    }
                    documentName={getLocalizedValue(document.name, lang)}
                    onClose={() => setShowAudit(false)}
                  />
                </div>

                {/* Desktop: Sidebar */}
                <div className="hidden md:block w-80 border-s dark:border-dark-brand-border shrink-0 bg-gray-50/50 dark:bg-gray-900/20">
                  <DocumentAuditPanel
                    content={
                      currentContent?.[
                        viewingVersion === "current" ? editorLang : "en"
                      ] || ""
                    }
                    documentName={getLocalizedValue(document.name, lang)}
                    onClose={() => setShowAudit(false)}
                  />
                </div>
              </>
            )}

            {/* Compliance Scoring Panel - Desktop: Sidebar, Mobile: Fullscreen Overlay */}
            {showComplianceScoringPanel && (
              <>
                {/* Mobile: Fullscreen overlay */}
                <div className="md:hidden absolute inset-0 z-10 bg-white dark:bg-dark-brand-surface">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b dark:border-dark-brand-border">
                      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                        {t("documents.complianceScoring") ||
                          "Compliance Scoring"}
                      </h3>
                      <button
                        onClick={() => setShowComplianceScoringPanel(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ComplianceScoringPanel
                        htmlContent={
                          currentContent?.[
                            viewingVersion === "current" ? editorLang : "en"
                          ] || ""
                        }
                        documentType={document.type}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Sidebar */}
                <div className="hidden md:block w-80 border-s dark:border-dark-brand-border shrink-0 bg-gray-50/50 dark:bg-gray-900/20">
                  <ComplianceScoringPanel
                    htmlContent={
                      currentContent?.[
                        viewingVersion === "current" ? editorLang : "en"
                      ] || ""
                    }
                    documentType={document.type}
                  />
                </div>
              </>
            )}

            {/* Relationships Panel - Desktop: Sidebar, Mobile: Fullscreen Overlay */}
            {showRelationshipsPanel && (
              <>
                {/* Mobile: Fullscreen overlay */}
                <div className="md:hidden absolute inset-0 z-10 bg-white dark:bg-dark-brand-surface">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b dark:border-dark-brand-border">
                      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                        {t("documents.relationships") || "Relationships"}
                      </h3>
                      <button
                        onClick={() => setShowRelationshipsPanel(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden p-4">
                      <DocumentRelationshipsPanel
                        document={document}
                        allDocuments={allDocuments}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Sidebar */}
                <div className="hidden md:block w-80 border-s dark:border-dark-brand-border shrink-0 bg-gray-50/50 dark:bg-gray-900/20 p-4">
                  <DocumentRelationshipsPanel
                    document={document}
                    allDocuments={allDocuments}
                  />
                </div>
              </>
            )}

            <div className="grow flex flex-col overflow-hidden">
              {/* Language tabs — ALWAYS visible in both Reader Mode and Edit Mode */}
              <div className="flex items-center gap-1 px-5 pt-2.5 pb-0 border-b dark:border-dark-brand-border bg-white dark:bg-dark-brand-surface shrink-0">
                <button
                  type="button"
                  onClick={() => setEditorLang("en")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
                    editorLang === "en"
                      ? "border-brand-primary text-brand-primary dark:text-sky-400 dark:border-sky-400 bg-sky-50/60 dark:bg-sky-900/20"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span>English</span>
                  {Boolean(currentContent?.en?.trim()) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditorLang("ar")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
                    editorLang === "ar"
                      ? "border-brand-primary text-brand-primary dark:text-sky-400 dark:border-sky-400 bg-sky-50/60 dark:bg-sky-900/20"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span>العربية</span>
                  {Boolean(currentContent?.ar?.trim()) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
                <div className="flex-1" />
                {isEditMode && viewingVersion === "current" ? (
                  <>
                    {/* Copy content between languages */}
                    <button
                      type="button"
                      onClick={() => handleCopyContent("en", "ar")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                      title={t("copyEnToAr") || "Copy EN → AR"}
                    >
                      EN
                      <ArrowRightIcon className="w-3 h-3" />
                      AR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyContent("ar", "en")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                      title={t("copyArToEn") || "Copy AR → EN"}
                    >
                      AR
                      <ArrowRightIcon className="w-3 h-3" />
                      EN
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 pb-1.5">
                    {editorLang === "ar"
                      ? "وضع القراءة الرسمي للمستند المعتمد"
                      : "Controlled Document Reader View"}
                  </span>
                )}
              </div>

              {/* Editor / Reader area */}
              <div
                className={`grow overflow-y-auto ${isEditMode && viewingVersion === "current" ? "" : "p-6 bg-slate-50/50 dark:bg-slate-950/30"}`}
                dir={editorLang === "ar" ? "rtl" : "ltr"}
              >
                {viewingVersion !== "current" && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-4 text-sm">
                    {t("preview") || "Preview"} v{viewingVersion}.{" "}
                    <button
                      onClick={() => setViewingVersion("current")}
                      className="font-semibold underline"
                    >
                      {t("backToCurrent") || "Back to current"}
                    </button>
                  </div>
                )}

                {isEditMode && viewingVersion === "current" ? (
                  <Suspense
                    fallback={
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {t("loadingEditor") || "Loading editor..."}
                      </div>
                    }
                  >
                    <RichTextEditor
                      content={document.content?.[editorLang] || ""}
                      onChange={handleContentChange}
                      editable={true}
                      placeholder={t("startTyping") || "Start typing..."}
                    />
                  </Suspense>
                ) : (
                  <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                    {/* Official Controlled Document Header Box */}
                    <div className="mb-6 rounded-lg border-2 border-slate-800 dark:border-slate-600 overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs font-bold tracking-wider uppercase">
                        <span>
                          {effectiveOrgName} &mdash;{" "}
                          {editorLang === "ar"
                            ? "مستند رسمي مراقب"
                            : `OFFICIAL CONTROLLED ${document.type.toUpperCase()}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            document.status === "Approved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                              : document.status === "Pending Review"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                                : "bg-slate-700 text-slate-200"
                          }`}
                        >
                          {document.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-slate-200 dark:divide-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-xs">
                        <div className="p-2.5">
                          <div className="text-slate-500 dark:text-slate-400 font-medium">
                            {editorLang === "ar" ? "رقم المستند" : "Document No."}
                          </div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {docControlNumber}
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-slate-500 dark:text-slate-400 font-medium">
                            {editorLang === "ar" ? "الإصدار والتصنيف" : "Version & Category"}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            v
                            {viewingVersion === "current"
                              ? document.currentVersion
                              : viewingVersion}
                            .0 &middot; {document.category || document.type}
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-slate-500 dark:text-slate-400 font-medium">
                            {editorLang === "ar"
                              ? "تاريخ السريان / المراجعة"
                              : "Effective / Next Review"}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {document.approvalDate
                              ? new Date(
                                  document.approvalDate,
                                ).toLocaleDateString()
                              : new Date(
                                  document.uploadedAt,
                                ).toLocaleDateString()}{" "}
                            &rarr;{" "}
                            {document.reviewDate
                              ? new Date(
                                  document.reviewDate,
                                ).toLocaleDateString()
                              : "Annual"}
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-slate-500 dark:text-slate-400 font-medium">
                            {editorLang === "ar" ? "اعتماد الإدارة" : "Approved By"}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                            {document.approvedBy ||
                              (document.status === "Approved"
                                ? "Quality & Safety"
                                : "Pending Sign-Off")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {currentContent?.[editorLang]?.trim() ? (
                      <SanitizedDocContent
                        content={currentContent?.[editorLang] || ""}
                      />
                    ) : (
                      <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {editorLang === "ar"
                            ? "لا يوجد محتوى باللغة العربية لهذا المستند حتى الآن."
                            : "No English content has been authored for this document yet."}
                        </p>
                        {Boolean(
                          currentContent?.[editorLang === "en" ? "ar" : "en"]?.trim(),
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditorLang(editorLang === "en" ? "ar" : "en")
                            }
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-sky-700 transition-colors"
                          >
                            {editorLang === "ar"
                              ? "عرض النسخة الإنجليزية (View English Version)"
                              : "Switch to Arabic Version (عرض النسخة العربية)"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible Metadata & AI Sidebar */}
            {!isSidebarCollapsed && (
              <DocumentEditorSidebar
                document={document}
                setDocument={setDocument}
                standards={standards}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                canEdit={canEdit}
                viewingVersion={viewingVersion}
                setViewingVersion={setViewingVersion}
                onCompareVersions={handleCompareVersions}
                onRelatedDocumentClick={handleRelatedDocumentClick}
                onLinkDocument={handleLinkDocument}
              />
            )}
          </main>

          {/* 1-Click Project Standard Evidence Linker Modal */}
          {showStandardLinker && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs"
              onClick={() => setShowStandardLinker(false)}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl mx-4 p-5 border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
                dir={dir}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {t("linkToProjectStandards") ||
                        "Link Controlled Document to Project Standards"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Attach <strong>{docControlNumber}</strong> directly as
                      audit evidence to accreditation checklist items.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStandardLinker(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                    No active accreditation projects found. Create a project in
                    Project Hub first.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                      <select
                        value={activeProjectForLink?.id || ""}
                        onChange={(e) =>
                          setSelectedProjectIdForLink(e.target.value)
                        }
                        aria-label="Select accreditation project"
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.checklist?.length || 0} standards)
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={standardSearchQuery}
                        onChange={(e) => setStandardSearchQuery(e.target.value)}
                        placeholder="Search standard ID or requirement..."
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
                      />
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 border rounded-lg dark:border-gray-700">
                      {matchingChecklistItems.length > 0 ? (
                        matchingChecklistItems.map(
                          ({ item, score, isLinked }) => (
                            <div
                              key={item.id}
                              className="p-2.5 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-brand-primary dark:text-sky-400">
                                    {item.standardId}
                                  </span>
                                  {score > 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                      Suggested Match
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                                  {item.item}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  activeProjectForLink &&
                                  handleToggleLinkChecklistItem(
                                    activeProjectForLink.id,
                                    item.id,
                                    isLinked,
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                                  isLinked
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-red-100 hover:text-red-700"
                                    : "bg-brand-primary text-white hover:bg-sky-700"
                                }`}
                              >
                                {isLinked ? "✓ Linked" : "+ Link Evidence"}
                              </button>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-6">
                          No matching checklist standards found.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStandardLinker(false)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    {t("done") || "Done"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Link Picker Modal */}
          {showLinkPicker && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/40"
              onClick={() => setShowLinkPicker(false)}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t("linkDocument") || "Link Document"}
                </h3>
                <input
                  type="text"
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                  placeholder={t("searchDocuments") || "Search documents..."}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm mb-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  autoFocus
                />
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {linkPickerDocs.length > 0 ? (
                    linkPickerDocs.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleAddRelatedDocument(d.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getLocalizedValue(d.name, lang)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {d.documentNumber} • {d.type}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      {t("noDocumentsFound") || "No documents found"}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setShowLinkPicker(false)}
                    className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("cancel") || "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========== FOOTER ========== */}
          <footer className="bg-gray-50 dark:bg-gray-900/50 px-5 py-2.5 flex items-center justify-between gap-3 border-t dark:border-dark-brand-border shrink-0 rounded-b-xl flex-wrap">
            {/* Left: word count / reading time + Link to Project Standards */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span>
                {wordCount.toLocaleString()} {t("words") || "words"} &middot;{" "}
                {readingTime} {t("minRead") || "min read"}
              </span>
              {projects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowStandardLinker(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 transition-colors border border-indigo-200/70 dark:border-indigo-700/50"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {t("linkToStandards") || "Link to Project Standards"}
                  {linkedChecklistCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      {linkedChecklistCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Right: action buttons for Staff, Authors, and Approvers */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Frontline Staff Read & Acknowledge button (when Approved) */}
              {document.status === "Approved" && (
                <button
                  type="button"
                  onClick={handleAcknowledgePolicy}
                  disabled={isAcknowledgedByCurrentUser}
                  className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    isAcknowledgedByCurrentUser
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-default"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  }`}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {isAcknowledgedByCurrentUser
                    ? editorLang === "ar"
                      ? "✓ تم الإقرار بالقراءة"
                      : "✓ Policy Acknowledged"
                    : editorLang === "ar"
                      ? "قرأت واستوعبت هذه السياسة"
                      : "Read & Acknowledge Policy"}
                </button>
              )}

              {/* Controlled Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                title="Print Official Controlled Copy with Governance Header & Footer"
              >
                <PrinterIcon className="w-4 h-4" />
                {t("print") || "Controlled Print"}
              </button>

              {/* Export to DOCX – secondary */}
              <button
                type="button"
                onClick={handleExportToDocx}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs sm:text-sm font-medium text-brand-primary dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 border border-brand-primary/30 dark:border-sky-400/30 transition-colors"
              >
                {t("exportToDocx") || "Export DOCX"}
              </button>

              {/* Request Approval – for Draft documents */}
              {document.status === "Draft" && (
                <button
                  type="button"
                  onClick={async () => {
                    const updatedDoc = {
                      ...document,
                      status: "Pending Review" as const,
                    };
                    setDocument(updatedDoc);
                    setSaveStatus("saving");
                    try {
                      await onSave(updatedDoc);
                      contentSnapshotRef.current = JSON.stringify(
                        updatedDoc.content,
                      );
                      setHasUnsavedChanges(false);
                      setSaveStatus("saved");
                      setLastSavedAt(new Date());
                    } catch (error) {
                      console.error("Document approval request failed:", error);
                      setHasUnsavedChanges(true);
                      setSaveStatus("error");
                    }
                  }}
                  className="inline-flex items-center gap-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 border border-amber-300/60 transition-colors"
                >
                  {t("requestApproval") || "Submit for Review"}
                  <ArrowRightIcon className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              )}

              {/* Return to Draft – for Leaders reviewing a Pending Review document */}
              {canApprove && document.status === "Pending Review" && (
                <button
                  type="button"
                  onClick={async () => {
                    const updatedDoc = {
                      ...document,
                      status: "Draft" as const,
                    };
                    setDocument(updatedDoc);
                    setIsEditMode(true);
                    setSaveStatus("saving");
                    try {
                      await onSave(updatedDoc);
                      setSaveStatus("saved");
                      toast.info(
                        t("returnedToDraft") ||
                          "Document returned to Draft for revision.",
                      );
                    } catch {
                      setSaveStatus("error");
                    }
                  }}
                  className="inline-flex items-center gap-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors"
                >
                  {t("returnToDraft") || "Return to Draft"}
                </button>
              )}

              {/* Leader 1-Click Approve & Sign right inside the Viewer! */}
              {canApprove &&
                (document.status === "Pending Review" ||
                  document.status === "Draft") && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (hasUnsavedChanges) {
                        const saved = await performSave(false);
                        if (!saved) return;
                      }
                      if (onApproveRequest) {
                        onApproveRequest(document);
                      } else {
                        const approvedDoc: AppDocument = {
                          ...document,
                          status: "Approved",
                          approvedBy: currentUser?.name || "Quality Leader",
                          approvalDate: new Date().toISOString(),
                        };
                        await onSave(approvedDoc);
                        setDocument(approvedDoc);
                        setIsEditMode(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {t("approveAndSign") || "Approve & Sign"}
                  </button>
                )}

              {/* Save Changes – primary */}
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 py-2 px-5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-brand-primary hover:bg-sky-700 shadow-sm hover:shadow-md transition-all"
                >
                  <CheckIcon className="w-4 h-4" />
                  {t("saveChanges") || "Save Changes"}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* ========== UNSAVED CHANGES DIALOG ========== */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 ring-1 ring-black/5 dark:ring-white/10"
            dir={dir}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("unsavedChangesTitle") || "Unsaved Changes"}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {t("unsavedChangesMessage") ||
                "You have unsaved changes. Save before closing?"}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowUnsavedDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleDiscardAndClose}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                {t("discardChanges") || "Discard Changes"}
              </button>
              <button
                onClick={handleSaveAndClose}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-sky-700 rounded-lg shadow-sm transition-all"
              >
                {t("saveAndClose") || "Save & Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== NEW VERSION DIALOG ========== */}
      {showNewVersionDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 ring-1 ring-black/5 dark:ring-white/10"
            dir={dir}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("newVersionPromptTitle") || "Create New Version?"}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {t("newVersionPrompt") ||
                "This document is already approved. Saving will create a new draft version. Continue?"}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewVersionDialog(false);
                  setPendingVersionDoc(null);
                  setSaveStatus("unsaved");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={async () => {
                  if (!pendingVersionDoc) return;
                  setSaveStatus("saving");
                  try {
                    await onSave(pendingVersionDoc);
                    contentSnapshotRef.current = JSON.stringify(
                      pendingVersionDoc.content,
                    );
                    setHasUnsavedChanges(false);
                    setLastSavedAt(new Date());
                    setTimeout(() => setSaveStatus("saved"), 600);
                    setShowNewVersionDialog(false);
                    setPendingVersionDoc(null);
                  } catch (error) {
                    console.error("New document version save failed:", error);
                    setHasUnsavedChanges(true);
                    setSaveStatus("error");
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-sky-700 rounded-lg shadow-sm transition-all"
              >
                {t("createNewVersion") || "Create New Version"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Comparison Modal */}
      <DocumentVersionComparisonModal
        isOpen={comparisonModal.isOpen}
        onClose={() =>
          setComparisonModal((prev) => ({ ...prev, isOpen: false }))
        }
        document={document}
        version1={comparisonModal.version1}
        version2={comparisonModal.version2}
      />

      {/* Batch Audit Modal */}
      <BatchAuditModal
        isOpen={showBatchAudit}
        onClose={() => setShowBatchAudit(false)}
        projectId={document.projectId || ""}
        documentIds={[document.id]}
        onAuditComplete={() => {
          // Refresh audit panel or document
          setShowAudit(true);
        }}
      />

      {/* Audit Change Control Panel - shown in modal if needed */}
      {showChangeControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-text-primary">
                {t("documents.auditChangeControl") || "Audit & Change Control"}
              </h2>
              <button
                onClick={() => setShowChangeControl(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <AuditChangeControlPanel
              documentId={document.id}
              projectId={document.projectId || ""}
              documentName={getLocalizedValue(document.name, lang)}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Helper component to render sanitized HTML
const SanitizedDocContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useSanitizedHTML(content);
  return (
    <div
      className="prose dark:prose-invert max-w-none document-content-view"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default DocumentEditorModal;
