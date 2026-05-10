/**
 * PredictiveCAPAGenerator
 *
 * AI-powered panel that generates a complete CAPA draft from an incident
 * description and optional classification context. The user can review
 * the draft and save it as a real CAPA record into any accreditation project.
 */

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import type { ClassificationResult } from "./PatientSafetyEventClassifier";

interface CAPADraft {
  title: string;
  description: string;
  rootCause: string;
  correctiveActions: string[];
  preventiveActions: string[];
  suggestedTimeline: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

interface Props {
  /** Pre-filled from classifier — both optional */
  prefillDescription?: string;
  prefillClassification?: ClassificationResult;
}

function parseCAPADraft(raw: string): CAPADraft {
  const get = (header: string): string => {
    const m = raw.match(
      new RegExp(`###\\s*${header}\\s*\\n([\\s\\S]*?)(?=###|$)`),
    );
    return m ? m[1].trim() : "";
  };
  const toList = (text: string): string[] =>
    text
      .split(/\n/)
      .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
      .filter(Boolean);

  const priority = get("Priority") as CAPADraft["priority"];
  return {
    title: get("Title") || "CAPA Report",
    description: get("Description") || "",
    rootCause: get("RootCause") || "",
    correctiveActions: toList(get("CorrectiveActions")),
    preventiveActions: toList(get("PreventiveActions")),
    suggestedTimeline: get("Timeline") || "30 days",
    priority: ["Low", "Medium", "High", "Critical"].includes(priority)
      ? priority
      : "Medium",
  };
}

const PRIORITY_CONFIG: Record<
  CAPADraft["priority"],
  { bg: string; text: string }
> = {
  Low: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  Medium: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  High: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  Critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
  },
};

const PredictiveCAPAGenerator: React.FC<Props> = ({
  prefillDescription,
  prefillClassification,
}) => {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const createCAPA = useProjectStore((s) => s.createCAPA);
  const currentUser = useUserStore((s) => s.currentUser);

  const [description, setDescription] = useState(prefillDescription || "");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<CAPADraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync pre-fill when parent pushes new context
  useEffect(() => {
    if (prefillDescription) setDescription(prefillDescription);
  }, [prefillDescription]);

  const handleGenerate = async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    setSaved(false);

    const classCtx = prefillClassification
      ? `
Event Type: ${prefillClassification.eventType}
Severity: ${prefillClassification.severity}
Root Cause Category: ${prefillClassification.rootCauseCategory}
Risk Level: ${prefillClassification.riskLevel}
`
      : "";

    const prompt = `You are a healthcare accreditation CAPA expert. Generate a complete, actionable CAPA draft for the following patient safety event.

Event Description: ${description}
${classCtx}

Respond with EXACTLY these sections:

### Title
(Concise CAPA report title, max 10 words)

### Description
(2–3 sentences summarising the event and why a CAPA is required)

### Priority
(One of: Low, Medium, High, Critical)

### RootCause
(Thorough root cause analysis using 5-Why or Fishbone methodology. 4–6 sentences. Use healthcare accreditation terminology.)

### CorrectiveActions
(4–6 numbered bullet points. Specific, assignable, time-bound corrective actions that directly address the root cause.)

### PreventiveActions
(3–5 numbered bullet points. Systemic preventive measures to stop recurrence across the organisation.)

### Timeline
(Single phrase — suggested completion timeframe, e.g. "30 days", "60 days", "90 days")

Be specific, clinically accurate, and actionable. Use JCI / CBAHI / ISO 15189 terminology where relevant.`;

    try {
      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || "";
      setDraft(parseCAPADraft(text));
    } catch (err: any) {
      setError(err?.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!draft || !selectedProjectId || saving) return;
    setSaving(true);
    setError(null);

    const dueDate = new Date(
      Date.now() + parseDays(draft.suggestedTimeline) * 24 * 60 * 60 * 1000,
    ).toISOString();

    try {
      await createCAPA(selectedProjectId, {
        checklistItemId: `ai-capa-${Date.now()}`,
        description: draft.description,
        rootCause: draft.rootCause,
        correctiveAction: draft.correctiveActions.join("\n"),
        preventiveAction: draft.preventiveActions.join("\n"),
        status: "Open",
        assignedTo: currentUser?.id || "",
        dueDate,
        pdcaStage: "Plan",
        pdcaHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: draft.title,
      } as any);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Failed to save CAPA. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pConfig = draft ? PRIORITY_CONFIG[draft.priority] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-primary/10">
          <SparklesIcon className="h-5 w-5 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-dark-brand-text-primary">
            {t("aiCAPAGeneratorTitle") || "Predictive CAPA Auto-Generator"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-brand-text-secondary mt-0.5">
            {t("aiCAPAGeneratorDesc") ||
              "Generate a complete CAPA draft with root cause analysis, corrective and preventive actions. Save it directly into an accreditation project."}
          </p>
        </div>
      </div>

      {/* Pre-fill notice */}
      {prefillClassification && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-primary/5 border border-brand-primary/20 text-sm text-brand-primary">
          <SparklesIcon className="h-4 w-4 shrink-0" />
          {t("prefillFromClassifier") || "Pre-filled from classifier"}:{" "}
          <strong>{prefillClassification.severity}</strong>{" "}
          {prefillClassification.eventType} —{" "}
          {prefillClassification.rootCauseCategory}
        </div>
      )}

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

        <Button
          variant="primary"
          onClick={handleGenerate}
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
              {t("generating") || "Generating…"}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              {t("generateCAPADraft") || "Generate CAPA Draft"}
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

      {/* Draft Result */}
      <AnimatePresence>
        {draft && pConfig && !saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-card p-5 space-y-5"
          >
            {/* Title + priority */}
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="font-semibold text-gray-900 dark:text-dark-brand-text-primary text-base flex-1">
                {draft.title}
              </h4>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pConfig.bg} ${pConfig.text}`}
              >
                {draft.priority} {t("priority") || "Priority"}
              </span>
              <span className="text-xs text-gray-500 dark:text-dark-brand-text-secondary bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                {t("timeline") || "Timeline"}: {draft.suggestedTimeline}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-dark-brand-text-secondary">
              {draft.description}
            </p>

            {/* Root Cause */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-brand-text-secondary font-medium mb-2">
                {t("rootCauseAnalysis") || "Root Cause Analysis"}
              </p>
              <p className="text-sm text-gray-800 dark:text-dark-brand-text-primary whitespace-pre-line">
                {draft.rootCause}
              </p>
            </div>

            {/* Corrective Actions */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-brand-text-secondary font-medium mb-2">
                {t("correctiveActions") || "Corrective Actions"}
              </p>
              <ol className="space-y-1.5">
                {draft.correctiveActions.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-dark-brand-text-primary"
                  >
                    <span className="mt-0.5 text-xs font-bold text-brand-primary w-4 shrink-0">
                      {i + 1}.
                    </span>
                    {a}
                  </li>
                ))}
              </ol>
            </div>

            {/* Preventive Actions */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-brand-text-secondary font-medium mb-2">
                {t("preventiveAction") || "Preventive Actions"}
              </p>
              <ol className="space-y-1.5">
                {draft.preventiveActions.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-dark-brand-text-primary"
                  >
                    <span className="mt-0.5 text-xs font-bold text-brand-primary w-4 shrink-0">
                      {i + 1}.
                    </span>
                    {a}
                  </li>
                ))}
              </ol>
            </div>

            {/* Save section */}
            <div className="pt-4 border-t border-gray-100 dark:border-dark-brand-border space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-brand-text-primary mb-1">
                  {t("saveToProject") || "Save to Project"}
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-white dark:bg-dark-brand-card px-3 py-2 text-sm text-gray-900 dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">
                    — {t("selectProject") || "Select a project"} —
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {typeof p.name === "object"
                        ? (p.name as any).en || p.id
                        : p.name || p.id}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!selectedProjectId || saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
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
                    {t("saving") || "Saving…"}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    {t("saveCAPAReport") || "Save CAPA Report"}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved confirmation */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                {t("capaSavedSuccess") || "CAPA saved successfully!"}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {t("capaSavedDetail") ||
                  "The CAPA report has been added to the selected project. You can view it in the CAPA Reports tab."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaved(false);
                setDraft(null);
                setDescription(prefillDescription || "");
                setSelectedProjectId("");
              }}
              className="ml-auto shrink-0"
            >
              {t("newCapa") || "New CAPA"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Parse "30 days" → 30, "90 days" → 90, fallback 30 */
function parseDays(text: string): number {
  const m = text.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 30;
}

export default PredictiveCAPAGenerator;
