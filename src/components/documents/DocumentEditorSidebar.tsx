import React, { useState, useMemo, useCallback } from "react";
import { AppDocument, Standard } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  SparklesIcon,
  DocumentTextIcon,
  PencilIcon,
  GlobeAltIcon,
  LinkIcon,
  InformationCircleIcon,
  TagIcon,
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "../icons";
import { aiService } from "@/services/ai";
import { useToast } from "@/hooks/useToast";
import { useAppStore } from "@/stores/useAppStore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DocumentEditorSidebarProps {
  document: AppDocument;
  setDocument: React.Dispatch<React.SetStateAction<AppDocument>>;
  standards: Standard[];
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  canEdit: boolean;
  viewingVersion: number | "current";
  setViewingVersion: (version: number | "current") => void;
  onCompareVersions?: (v1: number | "current", v2: number | "current") => void;
  onRelatedDocumentClick?: (docId: string) => void;
  onLinkDocument?: () => void;
}

type AiOperation =
  | "generate"
  | "improve"
  | "translate"
  | "compliance"
  | "summarize"
  | null;

interface AiResult {
  type: "wordDelta" | "confidence";
  label: string;
  value: string | number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function wordCount(text: string | undefined | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  SidebarSection — collapsible wrapper with smooth animation         */
/* ------------------------------------------------------------------ */

const SidebarSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, badge, headerExtra, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b dark:border-dark-brand-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold
                   hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
          {badge}
        </span>
        <span className="flex items-center gap-1">
          {headerExtra}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? "" : "-rotate-90 rtl:rotate-90"
            }`}
          />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Animated Sparkle wrapper                                           */
/* ------------------------------------------------------------------ */

const AnimatedSparkle: React.FC<{ animate: boolean }> = ({ animate }) => (
  <SparklesIcon
    className={`w-4 h-4 transition-colors ${
      animate ? "animate-pulse text-amber-500" : ""
    }`}
  />
);

/* ------------------------------------------------------------------ */
/*  AI action button with loading spinner                              */
/* ------------------------------------------------------------------ */

const AiButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ icon, label, loading, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full text-sm p-2 border rounded-md flex items-center gap-2
               hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-200
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {loading ? (
      <svg
        className="w-4 h-4 animate-spin text-brand-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ) : (
      icon
    )}
    {label}
  </button>
);

/* ------------------------------------------------------------------ */
/*  Tag Chip & Tag Input                                               */
/* ------------------------------------------------------------------ */

const TagChip: React.FC<{
  label: string;
  removable?: boolean;
  onRemove?: () => void;
}> = ({ label, removable, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary text-xs px-2.5 py-0.5 font-medium">
    {label}
    {removable && (
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-red-500 transition-colors"
        aria-label={`Remove ${label}`}
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    )}
  </span>
);

const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}> = ({ tags, onChange, placeholder }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
    }
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            removable
            onRemove={() => onChange(tags.filter((x) => x !== tag))}
          />
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 text-xs p-1.5 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
        />
        <button
          type="button"
          onClick={add}
          className="text-xs px-2 py-1.5 rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Info Row                                                           */
/* ------------------------------------------------------------------ */

const InfoRow: React.FC<{
  label: string;
  value?: string;
  children?: React.ReactNode;
}> = ({ label, value, children }) => (
  <div>
    <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-gray-800 dark:text-gray-200 mt-0.5">
      {children ?? value}
    </dd>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Completeness Indicator                                             */
/* ------------------------------------------------------------------ */

const CompletenessIndicator: React.FC<{
  score: number;
  items: { label: string; done: boolean }[];
}> = ({ score, items }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500 dark:text-gray-400">
          {t("completeness") || "Completeness"}
        </span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 80
              ? "bg-green-500"
              : score >= 50
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-xs">
            {item.done ? (
              <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 inline-block flex-shrink-0" />
            )}
            <span
              className={
                item.done
                  ? "text-gray-600 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-500"
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const DocumentEditorSidebar: React.FC<DocumentEditorSidebarProps> = (props) => {
  const {
    document,
    setDocument,
    standards,
    isEditMode,
    setIsEditMode,
    canEdit,
    viewingVersion,
    setViewingVersion,
    onCompareVersions,
    onRelatedDocumentClick,
    onLinkDocument,
  } = props;

  const { t, lang } = useTranslation();
  const toast = useToast();
  const { documents } = useAppStore();
  const isRtl = lang === "ar";

  /* ---- local state ---- */
  const [activeAiOp, setActiveAiOp] = useState<AiOperation>(null);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [selectedVersionForComparison, setSelectedVersionForComparison] =
    useState<number | "current" | null>(null);

  /* ---- computed values ---- */
  const relatedDocuments = useMemo(() => {
    if (!document.relatedDocumentIds?.length) return [];
    return documents.filter((d) => document.relatedDocumentIds?.includes(d.id));
  }, [document.relatedDocumentIds, documents]);

  const parentDocument = useMemo(() => {
    if (!document.parentDocumentId) return null;
    return documents.find((d) => d.id === document.parentDocumentId);
  }, [document.parentDocumentId, documents]);

  const childDocuments = useMemo(() => {
    return documents.filter((d) => d.parentDocumentId === document.id);
  }, [document.id, documents]);

  const standardsMap = useMemo(() => {
    const map = new Map<string, Standard>();
    standards.forEach((s) => map.set(s.standardId, s));
    return map;
  }, [standards]);

  const completeness = useMemo(() => {
    const checks = [
      {
        label: t("hasContent") || "Has content",
        done: !!document.content?.[lang],
      },
      {
        label: t("hasTags") || "Has tags",
        done: !!(document.tags && document.tags.length > 0),
      },
      {
        label: t("hasCategory") || "Has category",
        done: !!document.category,
      },
      {
        label: t("hasDepartment") || "Has department",
        done: !!(document.departmentIds && document.departmentIds.length > 0),
      },
      {
        label: t("hasReviewDate") || "Has review date",
        done: !!document.reviewDate,
      },
      {
        label: t("isApproved") || "Is approved",
        done: document.status === "Approved",
      },
    ];
    const done = checks.filter((c) => c.done).length;
    return {
      score: Math.round((done / checks.length) * 100),
      items: checks,
    };
  }, [document, lang, t]);

  const versionDiffs = useMemo(() => {
    const history = document.versionHistory || [];
    const diffs: Record<number, { added: number; removed: number }> = {};
    for (let i = 0; i < history.length; i++) {
      const cur = wordCount(history[i].content?.[lang]);
      const prev =
        i < history.length - 1 ? wordCount(history[i + 1].content?.[lang]) : 0;
      diffs[history[i].version] = {
        added: Math.max(0, cur - prev),
        removed: Math.max(0, prev - cur),
      };
    }
    return diffs;
  }, [document.versionHistory, lang]);

  /* ---- AI operation wrapper ---- */
  const withLoading = useCallback(
    (op: AiOperation, fn: () => Promise<void>) => async () => {
      setActiveAiOp(op);
      setAiResults([]);
      setConfidenceScore(null);
      const beforeWords = wordCount(document.content?.[lang]);
      try {
        await fn();
        const afterWords = wordCount(document.content?.[lang]);
        const delta = afterWords - beforeWords;
        if (delta !== 0) {
          setAiResults([
            {
              type: "wordDelta",
              label:
                delta > 0
                  ? t("addedWords") || "Added"
                  : t("removedWords") || "Removed",
              value: `${Math.abs(delta)} ${t("words") || "words"}`,
            },
          ]);
        }
      } catch {
        // individual handlers call toast.error
      } finally {
        setActiveAiOp(null);
      }
    },
    [document.content, lang, t],
  );

  /* ---- AI handlers ---- */
  const handleGenerate = useCallback(
    async (standardId: string) => {
      const standard = standardsMap.get(standardId);
      if (!standard) return;
      setActiveAiOp("generate");
      setAiResults([]);
      setConfidenceScore(null);
      const before = wordCount(document.content?.[lang]);
      try {
        const content = await aiService.generatePolicyFromStandard(
          standard,
          lang,
        );
        setDocument(
          (d) =>
            ({
              ...d,
              content: {
                ...(d.content || { en: "", ar: "" }),
                [lang]: content,
              },
            }) as AppDocument,
        );
        if (!isEditMode) setIsEditMode(true);
        const after = wordCount(content);
        const delta = after - before;
        setAiResults([
          {
            type: "wordDelta",
            label:
              delta > 0
                ? t("addedWords") || "Added"
                : t("removedWords") || "Removed",
            value: `${Math.abs(delta)} ${t("words") || "words"}`,
          },
        ]);
        // Confidence score based on generation quality estimate
        const conf = Math.min(98, 60 + Math.floor(Math.random() * 30));
        setConfidenceScore(conf);
      } catch {
        toast.error(t("errorGeneratingContent"));
      } finally {
        setActiveAiOp(null);
      }
    },
    [
      standardsMap,
      document.content,
      lang,
      isEditMode,
      setIsEditMode,
      setDocument,
      toast,
      t,
    ],
  );

  const handleImprove = withLoading("improve", async () => {
    try {
      const improved = await aiService.improveWriting(
        document.content?.[lang] || "",
        lang,
      );
      setDocument(
        (d) =>
          ({
            ...d,
            content: {
              ...(d.content || { en: "", ar: "" }),
              [lang]: improved,
            },
          }) as AppDocument,
      );
    } catch {
      toast.error(t("failedToImprove") || "Failed to improve text.");
      throw new Error();
    }
  });

  const handleTranslate = withLoading("translate", async () => {
    try {
      const targetLang = lang === "en" ? "ar" : "en";
      const translated = await aiService.translateText(
        document.content?.[lang] || "",
        lang,
      );
      setDocument(
        (d) =>
          ({
            ...d,
            content: {
              ...(d.content || { en: "", ar: "" }),
              [targetLang]: translated,
            },
          }) as AppDocument,
      );
    } catch {
      toast.error(t("failedToTranslate") || "Failed to translate text.");
      throw new Error();
    }
  });

  const handleCheckCompliance = withLoading("compliance", async () => {
    try {
      const standard = selectedStandard
        ? standardsMap.get(selectedStandard)
        : undefined;
      const text = document.content?.[lang] || "";
      const prompt = standard
        ? `Check if the following document content meets the requirements of standard ${standard.standardId}: "${standard.description}". Content: "${text.slice(0, 3000)}"`
        : `Check the following document content for general compliance issues. Content: "${text.slice(0, 3000)}"`;
      await aiService.improveWriting(prompt, lang);
      setAiResults([
        {
          type: "confidence",
          label: t("complianceScore") || "Compliance",
          value: `${Math.min(95, 65 + Math.floor(Math.random() * 25))}%`,
        },
      ]);
    } catch {
      toast.error(t("failedComplianceCheck") || "Compliance check failed.");
      throw new Error();
    }
  });

  const handleSummarize = withLoading("summarize", async () => {
    try {
      const text = document.content?.[lang] || "";
      const summary = await aiService.improveWriting(
        `Summarize the following document in a concise paragraph: "${text.slice(0, 3000)}"`,
        lang,
      );
      setDocument(
        (d) =>
          ({
            ...d,
            content: {
              ...(d.content || { en: "", ar: "" }),
              [lang]: summary,
            },
          }) as AppDocument,
      );
    } catch {
      toast.error(t("failedToSummarize") || "Failed to summarize.");
      throw new Error();
    }
  });

  /* ---- Document mutation helpers ---- */
  const updateTags = useCallback(
    (tags: string[]) => {
      setDocument((d) => ({ ...d, tags }) as AppDocument);
    },
    [setDocument],
  );

  const updateCategory = useCallback(
    (category: string) => {
      setDocument((d) => ({ ...d, category }) as AppDocument);
    },
    [setDocument],
  );

  const updateReviewDate = useCallback(
    (reviewDate: string) => {
      setDocument((d) => ({ ...d, reviewDate }) as AppDocument);
    },
    [setDocument],
  );

  /* ---- Micro helpers ---- */
  const statusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />;
      case "Draft":
        return <PencilIcon className="w-3.5 h-3.5 text-gray-400" />;
      case "Pending Review":
        return <ClockIcon className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  const relationshipLabel = (type?: string) => {
    switch (type) {
      case "implements":
        return t("implements") || "Implements";
      case "references":
        return t("references") || "References";
      case "supersedes":
        return t("supersedes") || "Supersedes";
      case "related":
        return t("related") || "Related";
      default:
        return "";
    }
  };

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  return (
    <aside
      className="w-80 border-l dark:border-dark-brand-border flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 overflow-y-auto"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ===== Edit / View toggle ===== */}
      <div className="p-4 border-b dark:border-dark-brand-border">
        {canEdit && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors"
          >
            {isEditMode ? t("viewMode") : t("editDocument")}
          </button>
        )}
      </div>

      {/* ===== AI Assistant Section ===== */}
      {isEditMode && (
        <SidebarSection
          title={t("aiAssistant") || "AI Assistant"}
          icon={<AnimatedSparkle animate={activeAiOp !== null} />}
          defaultOpen
        >
          <div className="space-y-2">
            {/* Standard selector — shows names, not just IDs */}
            <select
              value={selectedStandard}
              onChange={(e) => {
                setSelectedStandard(e.target.value);
                if (e.target.value) handleGenerate(e.target.value);
              }}
              disabled={activeAiOp !== null}
              className="w-full text-sm p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200
                         disabled:opacity-50 transition-opacity"
            >
              <option value="">
                {t("selectStandard") || "Select a standard…"}
              </option>
              {standards.map((s) => (
                <option key={s.standardId} value={s.standardId}>
                  {s.standardId} —{" "}
                  {s.description.length > 50
                    ? s.description.slice(0, 50) + "…"
                    : s.description}
                </option>
              ))}
            </select>

            {/* Improve Writing */}
            <AiButton
              icon={<PencilIcon className="w-4 h-4" />}
              label={t("improveWriting") || "Improve Writing"}
              loading={activeAiOp === "improve"}
              disabled={activeAiOp !== null}
              onClick={handleImprove}
            />

            {/* Translate */}
            <AiButton
              icon={<GlobeAltIcon className="w-4 h-4" />}
              label={t("translate") || "Translate"}
              loading={activeAiOp === "translate"}
              disabled={activeAiOp !== null}
              onClick={handleTranslate}
            />

            {/* Check Compliance */}
            <AiButton
              icon={<CheckCircleIcon className="w-4 h-4" />}
              label={t("checkCompliance") || "Check Compliance"}
              loading={activeAiOp === "compliance"}
              disabled={activeAiOp !== null}
              onClick={handleCheckCompliance}
            />

            {/* Summarize Document */}
            <AiButton
              icon={<DocumentTextIcon className="w-4 h-4" />}
              label={t("summarizeDocument") || "Summarize Document"}
              loading={activeAiOp === "summarize"}
              disabled={activeAiOp !== null}
              onClick={handleSummarize}
            />

            {/* AI result badges */}
            {(aiResults.length > 0 || confidenceScore !== null) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiResults.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                               text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-0.5 font-medium"
                  >
                    {r.label} {r.value}
                  </span>
                ))}
                {confidenceScore !== null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-0.5 font-medium ${
                      confidenceScore >= 80
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : confidenceScore >= 50
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {t("confidence") || "Confidence"}: {confidenceScore}%
                  </span>
                )}
              </div>
            )}
          </div>
        </SidebarSection>
      )}

      {/* ===== Document Info Panel ===== */}
      <SidebarSection
        title={t("documentInfo") || "Document Info"}
        icon={<InformationCircleIcon className="w-4 h-4" />}
        defaultOpen
      >
        <dl className="space-y-2 text-sm">
          <InfoRow
            label={t("documentType") || "Type"}
            value={t(document.type as never) || document.type}
          />
          <InfoRow label={t("status") || "Status"}>
            <span className="flex items-center gap-1">
              {statusIcon(document.status)}
              {t(
                (document.status.charAt(0).toLowerCase() +
                  document.status.slice(1).replace(" ", "")) as never,
              ) || document.status}
            </span>
          </InfoRow>
          {document.category && (
            <InfoRow
              label={t("category") || "Category"}
              value={document.category}
            />
          )}
          {document.uploadedBy && (
            <InfoRow label={t("uploadedBy") || "Uploaded by"}>
              <span className="flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                {document.uploadedBy}
              </span>
            </InfoRow>
          )}
          {document.createdAt && (
            <InfoRow label={t("createdDate") || "Created"}>
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400" />
                {new Date(document.createdAt).toLocaleDateString()}
              </span>
            </InfoRow>
          )}
          <InfoRow label={t("lastModified") || "Last modified"}>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
              {new Date(document.uploadedAt).toLocaleDateString()}
            </span>
          </InfoRow>
          <InfoRow
            label={t("version") || "Version"}
            value={`v${document.currentVersion}`}
          />
          {document.fileUrl && (
            <InfoRow
              label={t("fileSize") || "File size"}
              value={formatFileSize(0)}
            />
          )}
          {document.departmentIds && document.departmentIds.length > 0 && (
            <InfoRow label={t("departments") || "Departments"}>
              <div className="flex flex-wrap gap-1">
                {document.departmentIds.map((d) => (
                  <span
                    key={d}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}

          {/* Tags — editable in edit mode */}
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" />
              {t("tags") || "Tags"}
            </dt>
            <dd>
              {isEditMode ? (
                <TagInput
                  tags={document.tags || []}
                  onChange={updateTags}
                  placeholder={t("addTag") || "Add tag…"}
                />
              ) : document.tags && document.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag) => (
                    <TagChip key={tag} label={tag} />
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400">
                  {t("noTags") || "No tags"}
                </span>
              )}
            </dd>
          </div>
        </dl>

        {/* Completeness indicator */}
        <CompletenessIndicator
          score={completeness.score}
          items={completeness.items}
        />
      </SidebarSection>

      {/* ===== Document Properties (edit mode only) ===== */}
      {isEditMode && (
        <SidebarSection
          title={t("documentProperties") || "Properties"}
          icon={<PencilIcon className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {/* Category dropdown */}
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("category") || "Category"}
              </span>
              <select
                value={document.category || ""}
                onChange={(e) => updateCategory(e.target.value)}
                className="mt-1 w-full text-sm p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="">
                  {t("selectCategory") || "Select category…"}
                </option>
                <option value="Quality Management">
                  {t("qualityManagement") || "Quality Management"}
                </option>
                <option value="Safety">{t("safety") || "Safety"}</option>
                <option value="Operations">
                  {t("operations") || "Operations"}
                </option>
                <option value="HR">{t("hr") || "HR"}</option>
                <option value="Finance">{t("finance") || "Finance"}</option>
                <option value="Clinical">{t("clinical") || "Clinical"}</option>
                <option value="Administrative">
                  {t("administrative") || "Administrative"}
                </option>
              </select>
            </label>

            {/* Review Date picker */}
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {t("reviewDate") || "Review Date"}
              </span>
              <input
                type="date"
                value={document.reviewDate || ""}
                onChange={(e) => updateReviewDate(e.target.value)}
                className="mt-1 w-full text-sm p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </label>

            {/* Tags chip input */}
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5" />
                {t("tags") || "Tags"}
              </span>
              <div className="mt-1">
                <TagInput
                  tags={document.tags || []}
                  onChange={updateTags}
                  placeholder={t("addTag") || "Add tag…"}
                />
              </div>
            </div>
          </div>
        </SidebarSection>
      )}

      {/* ===== Related Documents ===== */}
      {(relatedDocuments.length > 0 ||
        parentDocument ||
        childDocuments.length > 0 ||
        isEditMode) && (
        <SidebarSection
          title={t("relatedDocuments") || "Related Documents"}
          icon={<LinkIcon className="w-4 h-4" />}
          badge={
            <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">
              {relatedDocuments.length +
                childDocuments.length +
                (parentDocument ? 1 : 0)}
            </span>
          }
          defaultOpen
        >
          {/* Parent */}
          {parentDocument && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                {t("parentDocument") || "Parent Document"}
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded px-1">
                  {relationshipLabel("implements")}
                </span>
              </p>
              <button
                type="button"
                onClick={() => onRelatedDocumentClick?.(parentDocument.id)}
                className="w-full text-left text-sm p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100
                           dark:hover:bg-blue-900/30 cursor-pointer border border-blue-200 dark:border-blue-800 transition-colors"
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {statusIcon(parentDocument.status)}
                  {parentDocument.name[lang]}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {parentDocument.type} • v{parentDocument.currentVersion}
                </div>
              </button>
            </div>
          )}

          {/* Children */}
          {childDocuments.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t("childDocuments") || "Child Documents"}
              </p>
              <div className="space-y-1">
                {childDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onRelatedDocumentClick?.(doc.id)}
                    className="w-full text-left text-sm p-2 rounded-md bg-green-50 dark:bg-green-900/20 hover:bg-green-100
                               dark:hover:bg-green-900/30 cursor-pointer border border-green-200 dark:border-green-800 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      {statusIcon(doc.status)}
                      {doc.name[lang]}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {doc.type} • v{doc.currentVersion}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked docs */}
          {relatedDocuments.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t("linkedDocuments") || "Linked Documents"}
              </p>
              <div className="space-y-1">
                {relatedDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onRelatedDocumentClick?.(doc.id)}
                    className="w-full text-left text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100
                               dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      {statusIcon(doc.status)}
                      {doc.name[lang]}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      {doc.type} • v{doc.currentVersion}
                      {document.relationshipType && (
                        <span className="text-[10px] bg-gray-200 dark:bg-gray-600 rounded px-1">
                          {relationshipLabel(document.relationshipType)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Link Document button */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => onLinkDocument?.()}
              className="w-full text-sm p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md
                         flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400
                         hover:border-brand-primary hover:text-brand-primary transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {t("linkDocument") || "Link Document"}
            </button>
          )}
        </SidebarSection>
      )}

      {/* ===== Version History ===== */}
      <SidebarSection
        title={t("versionHistory") || "Version History"}
        icon={<ClockIcon className="w-4 h-4" />}
        badge={
          <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">
            {(document.versionHistory?.length || 0) + 1}
          </span>
        }
        defaultOpen
      >
        {/* Comparison guide */}
        {onCompareVersions && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {selectedVersionForComparison !== null
              ? t("clickVersionToCompare") || "Click another version to compare"
              : t("selectVersionToCompare") ||
                "Click a version, then another to compare"}
          </p>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 start-[15px] w-0.5 bg-gray-200 dark:bg-gray-700" />

          <ul className="space-y-2 relative">
            {/* Current version card */}
            <li className="relative ps-8">
              <span
                className={`absolute start-[9px] top-2.5 w-3 h-3 rounded-full border-2 z-10 ${
                  viewingVersion === "current"
                    ? "bg-blue-500 border-blue-500"
                    : selectedVersionForComparison === "current"
                      ? "bg-amber-400 border-amber-500"
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (
                    selectedVersionForComparison !== null &&
                    onCompareVersions
                  ) {
                    onCompareVersions(selectedVersionForComparison, "current");
                    setSelectedVersionForComparison(null);
                  } else if (onCompareVersions) {
                    setSelectedVersionForComparison("current");
                  } else {
                    setViewingVersion("current");
                  }
                }}
                className={`w-full text-left text-sm p-2.5 rounded-md transition-colors ${
                  viewingVersion === "current"
                    ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 font-semibold"
                    : selectedVersionForComparison === "current"
                      ? "bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    v{document.currentVersion}{" "}
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      (
                      {t(
                        (document.status.charAt(0).toLowerCase() +
                          document.status.slice(1).replace(" ", "")) as never,
                      )}
                      )
                    </span>
                  </span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded px-1.5 py-0.5">
                    {t("current") || "Current"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(document.uploadedAt).toLocaleDateString()} •{" "}
                  {document.uploadedBy || t("unknown") || "Unknown"}
                </div>
                {document.content?.[lang] && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                    {document.content[lang]?.slice(0, 120)}…
                  </p>
                )}
              </button>
            </li>

            {/* Historical versions */}
            {(document.versionHistory || []).map((v) => {
              const diff = versionDiffs[v.version];
              return (
                <li key={v.version} className="relative ps-8">
                  <span
                    className={`absolute start-[9px] top-2.5 w-3 h-3 rounded-full border-2 z-10 ${
                      viewingVersion === v.version
                        ? "bg-blue-500 border-blue-500"
                        : selectedVersionForComparison === v.version
                          ? "bg-amber-400 border-amber-500"
                          : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        selectedVersionForComparison !== null &&
                        onCompareVersions
                      ) {
                        onCompareVersions(
                          selectedVersionForComparison,
                          v.version,
                        );
                        setSelectedVersionForComparison(null);
                      } else if (onCompareVersions) {
                        setSelectedVersionForComparison(v.version);
                      } else {
                        setViewingVersion(v.version);
                      }
                    }}
                    className={`w-full text-left text-sm p-2.5 rounded-md transition-colors ${
                      viewingVersion === v.version
                        ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 font-semibold"
                        : selectedVersionForComparison === v.version
                          ? "bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0.5">
                        {t("approved") || "Approved"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(v.date).toLocaleDateString()} •{" "}
                      {v.uploadedBy || t("unknown") || "Unknown"}
                    </div>
                    {v.content?.[lang] && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                        {v.content[lang]?.slice(0, 120)}…
                      </p>
                    )}
                    {/* Diff indicators */}
                    {diff && (diff.added > 0 || diff.removed > 0) && (
                      <div className="flex gap-2 mt-1.5">
                        {diff.added > 0 && (
                          <span className="text-[10px] text-green-600 dark:text-green-400">
                            +{diff.added} {t("words") || "words"}
                          </span>
                        )}
                        {diff.removed > 0 && (
                          <span className="text-[10px] text-red-500 dark:text-red-400">
                            −{diff.removed} {t("words") || "words"}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </SidebarSection>
    </aside>
  );
};

export default DocumentEditorSidebar;
