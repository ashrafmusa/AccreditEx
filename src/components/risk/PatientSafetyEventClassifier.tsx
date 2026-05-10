/**
 * PatientSafetyEventClassifier
 *
 * AI-powered panel that classifies a patient safety event or near-miss,
 * returns event type, severity level, root cause category and immediate
 * action recommendations, and optionally passes the result to the
 * Predictive CAPA Generator.
 */

import { ExclamationTriangleIcon, SparklesIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";

export interface ClassificationResult {
  eventType: string;
  severity: "Minor" | "Moderate" | "Severe" | "Sentinel Event";
  rootCauseCategory: string;
  immediateActions: string[];
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  summary: string;
}

interface Props {
  onClassified?: (description: string, result: ClassificationResult) => void;
}

const SEVERITY_CONFIG: Record<
  ClassificationResult["severity"],
  { bg: string; text: string }
> = {
  Minor: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  Moderate: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  Severe: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  "Sentinel Event": {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
  },
};

const RISK_CONFIG: Record<
  ClassificationResult["riskLevel"],
  { bg: string; text: string; border: string }
> = {
  Low: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-700",
  },
  Medium: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
  },
  High: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-700",
  },
  Critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
  },
};

const EVENT_TYPES = [
  "Patient Safety",
  "Medication Error",
  "Near-Miss",
  "Staff Injury",
  "Facility Issue",
  "Specimen Error",
  "Equipment Malfunction",
  "Result Reporting Error",
  "Biosafety Exposure",
  "Proficiency Testing Failure",
  "Other",
];

function parseClassification(raw: string): ClassificationResult {
  const get = (header: string): string => {
    const m = raw.match(
      new RegExp(`###\\s*${header}\\s*\\n([\\s\\S]*?)(?=###|$)`),
    );
    return m ? m[1].trim() : "";
  };

  const severity =
    (get("Severity") as ClassificationResult["severity"]) || "Moderate";
  const riskLevel =
    (get("RiskLevel") as ClassificationResult["riskLevel"]) || "Medium";
  const actionsRaw = get("ImmediateActions");
  const immediateActions = actionsRaw
    .split(/\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  return {
    eventType: get("EventType") || "Patient Safety",
    severity: ["Minor", "Moderate", "Severe", "Sentinel Event"].includes(
      severity,
    )
      ? severity
      : "Moderate",
    rootCauseCategory: get("RootCauseCategory") || "Process Failure",
    immediateActions: immediateActions.length
      ? immediateActions
      : ["Review the event with the team."],
    riskLevel: ["Low", "Medium", "High", "Critical"].includes(riskLevel)
      ? riskLevel
      : "Medium",
    summary: get("Summary") || raw.slice(0, 300),
  };
}

const PatientSafetyEventClassifier: React.FC<Props> = ({ onClassified }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [typeHint, setTypeHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = `You are a healthcare patient safety expert and accreditation specialist. Classify the following incident or near-miss event.

Event Description: ${description}
${typeHint ? `Type Hint: ${typeHint}` : ""}

Respond with EXACTLY these sections:

### EventType
(One of: Patient Safety, Medication Error, Near-Miss, Staff Injury, Facility Issue, Specimen Error, Equipment Malfunction, Result Reporting Error, Biosafety Exposure, Proficiency Testing Failure, Other)

### Severity
(One of: Minor, Moderate, Severe, Sentinel Event)

### RiskLevel
(One of: Low, Medium, High, Critical)

### RootCauseCategory
(Single phrase — e.g. Communication Failure, Protocol Non-Adherence, Equipment Failure, Human Error, Training Gap, System Design Flaw, Environmental Factor)

### ImmediateActions
(3–5 bullet points of immediate containment and notification actions)

### Summary
(2–3 sentences summarising the classification rationale for the accreditation record)

Use healthcare accreditation terminology. Be concise and clinically accurate.`;

    try {
      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || "";
      const parsed = parseClassification(text);
      setResult(parsed);
    } catch (err: any) {
      setError(err?.message || "Classification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sev = result ? SEVERITY_CONFIG[result.severity] : null;
  const risk = result ? RISK_CONFIG[result.riskLevel] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-primary/10">
          <SparklesIcon className="h-5 w-5 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-dark-brand-text-primary">
            {t("aiEventClassifierTitle") ||
              "AI Patient Safety Event Classifier"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-brand-text-secondary mt-0.5">
            {t("aiEventClassifierDesc") ||
              "Paste or type an event description — the AI classifies severity, type, root cause category, and recommended immediate actions."}
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-brand-text-primary mb-1">
            {t("eventDescription") || "Event Description"} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder={
              t("eventDescriptionPlaceholder") ||
              "Describe what happened, when, where, who was involved, and any immediate actions taken..."
            }
            className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-white dark:bg-dark-brand-card px-3 py-2 text-sm text-gray-900 dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-brand-text-primary mb-1">
            {t("eventTypeHint") || "Event Type (optional hint)"}
          </label>
          <select
            value={typeHint}
            onChange={(e) => setTypeHint(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-white dark:bg-dark-brand-card px-3 py-2 text-sm text-gray-900 dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">
              — {t("selectCategory") || "Select a category"} —
            </option>
            {EVENT_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={handleClassify}
          disabled={!description.trim() || loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
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
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              {t("classifying") || "Classifying…"}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              {t("classifyEvent") || "Classify Event"}
            </span>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && risk && sev && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border p-5 space-y-4 ${risk.bg} ${risk.border}`}
          >
            {/* Top row */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sev.bg} ${sev.text}`}
              >
                {result.severity}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${risk.bg} border ${risk.border} ${risk.text}`}
              >
                {result.riskLevel} {t("risk") || "Risk"}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-dark-brand-text-secondary bg-white dark:bg-dark-brand-card px-2.5 py-1 rounded-full border border-gray-200 dark:border-dark-brand-border">
                {result.eventType}
              </span>
            </div>

            {/* Root cause category */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-brand-text-secondary font-medium mb-1">
                {t("rootCauseCategory") || "Root Cause Category"}
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-dark-brand-text-primary">
                {result.rootCauseCategory}
              </p>
            </div>

            {/* Immediate actions */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-brand-text-secondary font-medium mb-2">
                {t("immediateActions") || "Immediate Actions"}
              </p>
              <ul className="space-y-1">
                {result.immediateActions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-dark-brand-text-primary"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-gray-200 dark:border-dark-brand-border">
              <p className="text-xs text-gray-500 dark:text-dark-brand-text-secondary">
                {result.summary}
              </p>
            </div>

            {/* CTA */}
            {onClassified && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onClassified(description, result)}
                className="w-full sm:w-auto"
              >
                <SparklesIcon className="h-4 w-4 mr-1.5" />
                {t("generateCAPAFromThis") || "Generate CAPA from this →"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientSafetyEventClassifier;
