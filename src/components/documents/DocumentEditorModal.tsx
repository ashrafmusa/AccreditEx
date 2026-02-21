import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { AppDocument, Standard } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useSanitizedHTML } from "../../hooks/useSanitizedHTML";
import {
  XMarkIcon,
  PrinterIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  CheckIcon,
} from "../icons";
import DocumentEditorSidebar from "./DocumentEditorSidebar";
import DocumentVersionComparisonModal from "./DocumentVersionComparisonModal";
import { exportToDocx } from "../../services/docxExportService";

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
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Evidence:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Process Map":
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

const AUTOSAVE_INTERVAL_MS = 30_000;

type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

// --- Props ---
interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
  standards: Standard[];
  allDocuments?: AppDocument[];
  onAutoSave?: (doc: AppDocument) => void;
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
}) => {
  const { t, lang, dir } = useTranslation();

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
  const [showShortcutsTooltip, setShowShortcutsTooltip] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");

  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentSnapshotRef = useRef<string>(
    JSON.stringify(documentData.content),
  );

  // Sync props → state on open / data change
  useEffect(() => {
    setDocument(documentData);
    setIsEditMode(documentData.status === "Draft");
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
        performSave(true);
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, hasUnsavedChanges, document]);

  // --- Save logic ---
  const performSave = useCallback(
    (isAutoSave = false) => {
      setSaveStatus("saving");

      let docToSave = { ...document };
      if (document.status === "Approved" && isEditMode && !isAutoSave) {
        if (!window.confirm(t("newVersionPrompt"))) {
          setSaveStatus("unsaved");
          return;
        }
        docToSave = {
          ...document,
          status: "Draft",
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
      }

      if (isAutoSave && onAutoSave) {
        onAutoSave(docToSave);
      } else {
        onSave(docToSave);
      }

      contentSnapshotRef.current = JSON.stringify(docToSave.content);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());

      // Brief "saving" → "saved" animation
      setTimeout(() => setSaveStatus("saved"), 600);
    },
    [document, documentData.content, isEditMode, onAutoSave, onSave, t],
  );

  const handleSave = useCallback(() => performSave(false), [performSave]);

  // --- Close with unsaved-changes guard ---
  const attemptClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleSaveAndClose = useCallback(() => {
    performSave(false);
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

  const handleRelatedDocumentClick = (docId: string) => {
    // Switch to viewing the clicked related document inline — find it in allDocuments
    const target = allDocuments.find((d) => d.id === docId);
    if (target) {
      // Save current document if unsaved, then switch
      if (hasUnsavedChanges) {
        onSave(document);
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
          d.name.en.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
          d.name.ar?.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
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
      const fileName = `${document.name[lang]}_v${document.currentVersion}.docx`;
      await exportToDocx(currentContent?.[lang] || "", { fileName });
    } catch (error) {
      console.error("Failed to export document:", error);
      alert(t("exportFailed") || "Failed to export document to DOCX format");
    }
  };

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>${document.name[lang]}</title></head>
        <body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;">
          ${currentContent?.[lang] || ""}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [document.name, lang, currentContent]);

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
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            {t("autosaving") || "Autosaving..."}
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
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
        onClick={attemptClose}
      >
        {/* Modal container */}
        <div
          className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-7xl h-[92vh] m-4 flex flex-col modal-content-enter ring-1 ring-black/5 dark:ring-white/10"
          onClick={(e) => e.stopPropagation()}
          dir={dir}
        >
          {/* ========== HEADER ========== */}
          <header className="px-5 py-3 border-b dark:border-dark-brand-border flex justify-between items-center shrink-0 bg-gray-50/60 dark:bg-gray-900/40 rounded-t-xl">
            {/* Left: title + meta */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold dark:text-dark-brand-text-primary truncate">
                    {document.name[lang]}
                  </h3>
                  {/* Document type badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DOC_TYPE_COLORS[document.type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                  >
                    {t(document.type.toLowerCase().replace(" ", "") as never) ||
                      document.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    v{document.currentVersion} &middot;{" "}
                    {t(
                      (document.status.charAt(0).toLowerCase() +
                        document.status.slice(1).replace(" ", "")) as never,
                    ) || document.status}
                  </p>
                  {renderSaveIndicator()}
                </div>
              </div>
            </div>

            {/* Right: header actions */}
            <div className="flex items-center gap-2">
              {/* Shortcuts tooltip */}
              <div className="relative">
                <button
                  onClick={() => setShowShortcutsTooltip((v) => !v)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={t("shortcuts") || "Keyboard shortcuts"}
                >
                  <InformationCircleIcon className="w-5 h-5" />
                </button>
                {showShortcutsTooltip && (
                  <div className="absolute end-0 top-full mt-1 z-10 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-3 text-xs">
                    <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      {t("keyboardShortcuts") || "Keyboard Shortcuts"}
                    </p>
                    <div className="space-y-1.5 text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>{t("save") || "Save"}</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">
                          Ctrl+S
                        </kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("close") || "Close"}</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">
                          Esc
                        </kbd>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={attemptClose}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label={t("close") || "Close"}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* ========== MAIN ========== */}
          <main className="grow flex overflow-hidden">
            <div className="grow flex flex-col overflow-hidden">
              {/* Language tabs */}
              {isEditMode && viewingVersion === "current" && (
                <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b dark:border-dark-brand-border bg-white dark:bg-dark-brand-surface">
                  <button
                    onClick={() => setEditorLang("en")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                      editorLang === "en"
                        ? "border-brand-primary text-brand-primary dark:text-sky-400 dark:border-sky-400 bg-sky-50/60 dark:bg-sky-900/20"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setEditorLang("ar")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                      editorLang === "ar"
                        ? "border-brand-primary text-brand-primary dark:text-sky-400 dark:border-sky-400 bg-sky-50/60 dark:bg-sky-900/20"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    العربية
                  </button>
                  <div className="flex-1" />
                  {/* Copy content between languages */}
                  <button
                    onClick={() => handleCopyContent("en", "ar")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title={t("copyEnToAr") || "Copy EN → AR"}
                  >
                    EN
                    <ArrowRightIcon className="w-3 h-3" />
                    AR
                  </button>
                  <button
                    onClick={() => handleCopyContent("ar", "en")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title={t("copyArToEn") || "Copy AR → EN"}
                  >
                    AR
                    <ArrowRightIcon className="w-3 h-3" />
                    EN
                  </button>
                </div>
              )}

              {/* Editor area */}
              <div
                className="grow p-6 overflow-y-auto"
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
                  <SanitizedDocContent
                    content={currentContent?.[editorLang] || ""}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
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
          </main>

          {/* Document Link Picker Modal */}
          {showLinkPicker && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
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
                          {d.name[lang] || d.name.en}
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
          <footer className="bg-gray-50 dark:bg-gray-900/50 px-5 py-2.5 flex items-center border-t dark:border-dark-brand-border shrink-0 rounded-b-xl">
            {/* Left: word count / reading time */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {wordCount.toLocaleString()} {t("words") || "words"} &middot;{" "}
                {readingTime} {t("minRead") || "min read"}
              </span>
            </div>

            <div className="flex-1" />

            {/* Right: action buttons */}
            <div className="flex items-center gap-2">
              {/* Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <PrinterIcon className="w-4 h-4" />
                {t("print") || "Print"}
              </button>

              {/* Export to DOCX – secondary */}
              <button
                type="button"
                onClick={handleExportToDocx}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium text-brand-primary dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 border border-brand-primary/30 dark:border-sky-400/30 transition-colors"
              >
                {t("exportToDocx") || "Export to DOCX"}
              </button>

              {/* Request Approval – tertiary */}
              {document.status === "Draft" && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedDoc = {
                      ...document,
                      status: "Pending Review" as const,
                    };
                    onSave(updatedDoc);
                    setSaveStatus("saved");
                    setLastSavedAt(new Date());
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary dark:text-sky-400 hover:underline transition-colors"
                >
                  {t("requestApproval") || "Request Approval"}
                  <ArrowRightIcon className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              )}

              {/* Save Changes – primary */}
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 py-2 px-5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-sky-700 shadow-sm hover:shadow-md transition-all"
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
    </>
  );
};

// Helper component to render sanitized HTML
const SanitizedDocContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useSanitizedHTML(content);
  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default DocumentEditorModal;
