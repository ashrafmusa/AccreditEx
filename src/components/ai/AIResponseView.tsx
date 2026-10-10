import AIActionCard from "@/components/ai/AIActionCard";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { submitAIFeedback } from "@/services/aiFeedbackService";
import type { AIGrounding } from "@/services/aiGroundingService";
import type { AIResponse, AIResponseType } from "@/types/aiResponse";
import { normalizeAIResponse } from "@/utils/aiResponse";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import React, { useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type AIFeedback = "up" | "down";

export interface AIResponseViewProps {
  /** Normalised response (preferred). */
  response?: AIResponse | null;
  /** Raw AI text or payload; normalised automatically when `response` is not given. */
  content?: unknown;
  grounding?: AIGrounding;
  type?: AIResponseType;
  title?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onFeedback?: (feedback: AIFeedback, response: AIResponse) => void;
  /** Show the extracted one-line summary above the body. */
  showSummary?: boolean;
  /** Render proposed action cards (create risk / CAPA). */
  showActions?: boolean;
  /** Copy + feedback toolbar. */
  showToolbar?: boolean;
  showConfidence?: boolean;
  showDisclaimer?: boolean;
  compact?: boolean;
  className?: string;
}

const markdownComponents = (compact: boolean): Components => ({
  h1: ({ node: _n, ...props }) => (
    <h3 className={`${compact ? "text-sm" : "text-base"} font-bold mt-3 mb-1.5 text-brand-text-primary dark:text-dark-brand-text-primary`} {...props} />
  ),
  h2: ({ node: _n, ...props }) => (
    <h4 className={`${compact ? "text-sm" : "text-base"} font-semibold mt-3 mb-1.5 text-brand-text-primary dark:text-dark-brand-text-primary border-b border-brand-border dark:border-dark-brand-border pb-1`} {...props} />
  ),
  h3: ({ node: _n, ...props }) => (
    <h5 className="text-sm font-semibold mt-2 mb-1 text-brand-text-primary dark:text-dark-brand-text-primary" {...props} />
  ),
  h4: ({ node: _n, ...props }) => (
    <h6 className="text-sm font-semibold mt-2 mb-1 text-brand-text-primary dark:text-dark-brand-text-primary" {...props} />
  ),
  p: ({ node: _n, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
  ul: ({ node: _n, ...props }) => <ul className="list-disc ps-5 mb-2 space-y-1" {...props} />,
  ol: ({ node: _n, ...props }) => <ol className="list-decimal ps-5 mb-2 space-y-1" {...props} />,
  li: ({ node: _n, ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ node: _n, ...props }) => (
    <strong className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary" {...props} />
  ),
  a: ({ node: _n, ...props }) => (
    <a className="text-brand-primary underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  code: ({ node: _n, className, children, ...props }) => (
    <code
      className={`${className ?? ""} bg-brand-background dark:bg-dark-brand-background px-1 py-0.5 rounded text-[0.85em] font-mono`}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ node: _n, ...props }) => (
    <pre className="bg-brand-background dark:bg-dark-brand-background p-3 rounded-lg overflow-x-auto mb-2 text-xs" {...props} />
  ),
  blockquote: ({ node: _n, ...props }) => (
    <blockquote className="border-s-4 border-brand-warning ps-3 my-2 italic text-brand-text-secondary dark:text-dark-brand-text-secondary" {...props} />
  ),
  table: ({ node: _n, ...props }) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full text-xs border border-brand-border dark:border-dark-brand-border" {...props} />
    </div>
  ),
  th: ({ node: _n, ...props }) => (
    <th className="px-2 py-1 text-start font-semibold bg-brand-background dark:bg-dark-brand-background border border-brand-border dark:border-dark-brand-border" {...props} />
  ),
  td: ({ node: _n, ...props }) => (
    <td className="px-2 py-1 align-top border border-brand-border dark:border-dark-brand-border" {...props} />
  ),
  hr: () => <hr className="my-3 border-brand-border dark:border-dark-brand-border" />,
});

const confidenceLevel = (c: number): "High" | "Medium" | "Low" =>
  c >= 0.8 ? "High" : c >= 0.65 ? "Medium" : "Low";

const confidenceClass: Record<"High" | "Medium" | "Low", string> = {
  High: "bg-brand-success/10 text-brand-success",
  Medium: "bg-brand-warning/10 text-brand-warning",
  Low: "bg-brand-danger/10 text-brand-danger",
};

const EvidenceProvenance: React.FC<{ grounding: AIGrounding }> = ({ grounding }) => {
  const { t } = useTranslation();

  return (
    <details className="mt-3 rounded-lg border border-brand-border dark:border-dark-brand-border p-3 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
      <summary className="cursor-pointer font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
        {t("aiEvidenceTitle")} ({grounding.sources.length})
      </summary>
      <p className="mt-2">{t("aiEvidenceDisclaimer")}</p>
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <div><dt className="inline">{t("aiEvidenceAvailable")}: </dt><dd className="inline">{grounding.coverage.available}</dd></div>
        <div><dt className="inline">{t("aiEvidenceSelected")}: </dt><dd className="inline">{grounding.coverage.selected}</dd></div>
        <div><dt className="inline">{t("aiEvidenceOmitted")}: </dt><dd className="inline">{grounding.coverage.omitted}</dd></div>
      </dl>
      {grounding.coverage.limitations.length > 0 && (
        <div className="mt-2">
          <h4 className="font-semibold">{t("aiEvidenceLimits")}</h4>
          <ul className="list-disc ps-5">
            {grounding.coverage.limitations.map((limit, index) => <li key={index} dir="auto">{limit}</li>)}
          </ul>
        </div>
      )}
      {grounding.sources.length === 0 ? (
        <p className="mt-2">{t("aiEvidenceNoSources")}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {grounding.sources.map((source) => (
            <li key={source.ref} className="rounded-md bg-brand-background dark:bg-dark-brand-background p-2 break-words">
              <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary" dir="auto">{source.title || source.ref}</h4>
              <dl className="mt-1 space-y-1">
                <div><dt className="inline">{t("aiEvidenceReference")}: </dt><dd className="inline" dir="auto">{source.ref}</dd></div>
                {source.version !== undefined && <div><dt className="inline">{t("aiEvidenceVersion")}: </dt><dd className="inline">{source.version}</dd></div>}
                <div><dt className="inline">{t("aiEvidenceStatus")}: </dt><dd className="inline" dir="auto">{source.status || t("aiEvidenceStatusUnknown")}</dd></div>
              </dl>
              <p className="mt-2 font-semibold">{t("aiEvidenceExcerpt")}</p>
              <p className="whitespace-pre-wrap" dir="auto">{source.excerpt || t("aiEvidenceNoExcerpt")}</p>
              {source.excerptTruncated && <p className="mt-1 text-brand-warning">{t("aiEvidencePartialExcerpt")}</p>}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
};

/** Single, standard renderer for every AI-generated answer in AccreditEx. */
const AIResponseView: React.FC<AIResponseViewProps> = ({
  response,
  content,
  grounding,
  type,
  title,
  loading = false,
  error = null,
  onRetry,
  onFeedback,
  showSummary = false,
  showActions = true,
  showToolbar = true,
  showConfidence = false,
  showDisclaimer = false,
  compact = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);

  const data = useMemo<AIResponse | null>(() => {
    if (response) return response;
    if (content === undefined || content === null || content === "") return null;
    return normalizeAIResponse(content, { type, title });
  }, [response, content, type, title]);

  const components = useMemo(() => markdownComponents(compact), [compact]);
  const textSize = compact ? "text-xs" : "text-sm";
  const evidence = grounding ? <EvidenceProvenance grounding={grounding} /> : null;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${textSize} text-brand-text-secondary dark:text-dark-brand-text-secondary ${className}`} role="status" aria-live="polite">
        <ArrowPathIcon className="w-4 h-4 animate-spin" />
        <span>{t("aiResponseLoading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-brand-danger/40 bg-brand-danger/5 p-3 ${textSize} ${className}`} role="alert">
        <div className="flex items-center gap-2 font-semibold text-brand-danger">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {t("aiResponseErrorTitle")}
        </div>
        <p className="mt-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 text-brand-primary hover:underline">
            <ArrowPathIcon className="w-4 h-4" /> {t("aiResponseRetry")}
          </button>
        )}
      </div>
    );
  }

  if (!data) return evidence;

  if (data.status === "empty" && !data.actions.length) {
    return (
      <div className={`${textSize} text-brand-text-secondary dark:text-dark-brand-text-secondary ${className}`}>
        {t("aiResponseEmpty")}
        {onRetry && (
          <button type="button" onClick={onRetry} className="ms-2 text-brand-primary hover:underline">
            {t("aiResponseRetry")}
          </button>
        )}
        {evidence}
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.contentMarkdown);
      setCopied(true);
      toast.success(t("aiResponseCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleFeedback = (value: AIFeedback) => {
    setFeedback(value);
    if (onFeedback) onFeedback(value, data);
    else void submitAIFeedback(value, data);
    toast.success(t("aiResponseFeedbackThanks"));
  };

  const level = data.confidence !== null ? confidenceLevel(data.confidence) : null;

  return (
    <div className={`ai-response ${textSize} text-brand-text-primary dark:text-dark-brand-text-primary ${className}`} dir="auto" data-testid="ai-response">
      {(data.title || (showConfidence && level)) && (
        <div className="flex items-center justify-between gap-2 mb-2">
          {data.title && <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{data.title}</h3>}
          {showConfidence && level && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${confidenceClass[level]}`}>
              {t("aiResponseConfidence")}: {t(`aiResponseConfidence${level}`)}
            </span>
          )}
        </div>
      )}

      {data.source === "fallback" && (
        <p className="mb-2 text-[11px] text-brand-warning">{t("aiResponseFallbackNotice")}</p>
      )}

      {showSummary && data.summary && (
        <div className="mb-2 rounded-md bg-brand-primary/5 border-s-4 border-brand-primary px-3 py-2">
          <span className="sr-only">{t("aiResponseSummary")}: </span>
          {data.summary}
        </div>
      )}

      {data.contentMarkdown && (
        <div className="ai-response-body break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {data.contentMarkdown}
          </ReactMarkdown>
        </div>
      )}

      {showActions && data.actions.map((action, i) => <AIActionCard key={`${action.type}-${i}`} action={action} />)}

      {evidence}

      {(showToolbar || showDisclaimer) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
          <span>{showDisclaimer ? t("aiResponseDisclaimer") : ""}</span>
          {showToolbar && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={handleCopy} title={t("aiResponseCopy")} aria-label={t("aiResponseCopy")} className="p-1 rounded hover:bg-brand-background dark:hover:bg-dark-brand-background">
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-brand-success" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => handleFeedback("up")} disabled={!!feedback} title={t("aiResponseHelpful")} aria-label={t("aiResponseHelpful")} aria-pressed={feedback === "up"} className={`p-1 rounded hover:bg-brand-background dark:hover:bg-dark-brand-background ${feedback === "up" ? "text-brand-success" : ""}`}>
                <HandThumbUpIcon className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => handleFeedback("down")} disabled={!!feedback} title={t("aiResponseNotHelpful")} aria-label={t("aiResponseNotHelpful")} aria-pressed={feedback === "down"} className={`p-1 rounded hover:bg-brand-background dark:hover:bg-dark-brand-background ${feedback === "down" ? "text-brand-danger" : ""}`}>
                <HandThumbDownIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResponseView;
