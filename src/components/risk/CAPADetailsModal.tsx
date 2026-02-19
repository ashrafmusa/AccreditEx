import React, { useState } from "react";
import { CAPAReport, Project } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { XMarkIcon, TrashIcon } from "@/components/icons";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/useToast";
import { evaluateCapaCompleteness } from "@/services/tqmReadinessService";
import { aiAgentService } from "@/services/aiAgentService";

interface CAPADetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  capa: CAPAReport;
  project?: Project;
}

const CAPADetailsModal: React.FC<CAPADetailsModalProps> = ({
  isOpen,
  onClose,
  capa,
  project,
}) => {
  const { t, dir } = useTranslation();
  const toast = useToast();
  const { updateCapa, deleteCapa } = useProjectStore();
  const { currentUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCapa, setEditedCapa] = useState<CAPAReport>(capa);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAIPreFilling, setIsAIPreFilling] = useState(false);
  const [isAIReviewing, setIsAIReviewing] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "Admin";

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!project) return;
    try {
      await updateCapa(project.id, editedCapa);
      toast.success(t("capaUpdatedSuccessfully"));
      setIsEditing(false);
      onClose();
    } catch (error) {
      toast.error(t("failedToUpdateCapa"));
    }
  };

  const handleDelete = async () => {
    if (!project) {
      toast.error(t("cannotDeleteCapaProjectNotFound"));
      console.error("Project is undefined. CAPA:", capa);
      return;
    }

    setShowDeleteConfirm(false);

    try {
      await deleteCapa(project.id, capa.id);
      toast.success(t("capaDeletedSuccessfully"));
      onClose();
    } catch (error: any) {
      console.error("Delete CAPA error:", error);
      toast.error(error?.message || t("failedToDeleteCapa"));
    }
  };

  // A-5: AI pre-fill root cause, corrective action, preventive action
  const handleAIPreFill = async () => {
    if (isAIPreFilling) return;
    setIsAIPreFilling(true);
    try {
      const prompt = `You are a healthcare accreditation CAPA expert. Analyze this CAPA and suggest root cause analysis, corrective actions, and preventive actions.

CAPA Description: ${editedCapa.description || "Not provided"}
Current Root Cause: ${editedCapa.rootCause || "Not yet analyzed"}
Current Stage: ${editedCapa.pdcaStage || "Plan"}
Project: ${project?.name || "Unknown"}

Respond with EXACTLY these three sections:
### RootCause
(Provide a thorough root cause analysis using 5-Why or Fishbone methodology. 3-5 sentences.)

### CorrectiveAction
(Provide specific, actionable corrective actions with timelines. 3-5 bullet points.)

### PreventiveAction
(Provide systemic preventive measures to avoid recurrence. 2-4 bullet points.)

Use healthcare accreditation terminology. Be specific and actionable.`;

      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || "";

      const parseSection = (header: string): string => {
        const regex = new RegExp(
          `###\\s*${header}\\s*\\n([\\s\\S]*?)(?=###|$)`,
        );
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };

      const rootCause = parseSection("RootCause");
      const corrective = parseSection("CorrectiveAction");
      const preventive = parseSection("PreventiveAction");

      setEditedCapa((prev) => ({
        ...prev,
        rootCause: rootCause || prev.rootCause,
        correctiveAction: corrective || prev.correctiveAction,
        preventiveAction: preventive || prev.preventiveAction,
      }));
      toast.success("AI pre-filled CAPA fields.");
    } catch (error) {
      console.error("AI CAPA pre-fill error:", error);
      toast.error("Failed to generate AI suggestions.");
    } finally {
      setIsAIPreFilling(false);
    }
  };

  // A-15: AI effectiveness verification review
  const handleAIEffectivenessReview = async () => {
    if (isAIReviewing) return;
    setIsAIReviewing(true);
    setAiReviewResult(null);
    try {
      const prompt = `You are a healthcare accreditation quality expert. Review this CAPA for effectiveness and completeness.

CAPA Description: ${capa.description || "N/A"}
Root Cause: ${capa.rootCause || "Not defined"}
Corrective Action: ${capa.correctiveAction || "Not defined"}
Preventive Action: ${capa.preventiveAction || "Not defined"}
Current PDCA Stage: ${capa.pdcaStage || "Plan"}
Status: ${capa.status || "Open"}
Project: ${project?.name || "Unknown"}

Evaluate the following:
1. Is the root cause analysis thorough enough?
2. Are corrective actions specific and measurable?
3. Are preventive actions systemic (not just reactive)?
4. Is the CAPA ready for closure?

Provide:
- An effectiveness score (0-100%)
- A recommendation: CLOSE, NEEDS_REVISION, or REOPEN
- Specific gaps or missing elements (if any)
- Suggested improvements

Format your response clearly with headers.`;

      const response = await aiAgentService.chat(prompt, true);
      setAiReviewResult(response.response || "No review generated.");
      toast.success("AI effectiveness review complete.");
    } catch (error) {
      console.error("AI effectiveness review error:", error);
      toast.error("Failed to generate effectiveness review.");
    } finally {
      setIsAIReviewing(false);
    }
  };

  const pdcaStages = ["Plan", "Do", "Check", "Act"];
  const completeness = evaluateCapaCompleteness(editedCapa);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("capaReportDetails")}
            </h2>
            {project && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("inProject")} {project.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Pre-fill banner in edit mode */}
          {isEditing && (
            <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-cyan-50 dark:from-pink-900/20 dark:to-cyan-900/20 border border-rose-200 dark:border-pink-800 rounded-lg p-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                🤖 Use AI to pre-fill root cause, corrective &amp; preventive
                actions
              </span>
              <button
                type="button"
                onClick={handleAIPreFill}
                disabled={isAIPreFilling}
                className="text-xs bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-3 py-1.5 rounded-md hover:from-rose-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isAIPreFilling ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>{" "}
                    Analyzing...
                  </>
                ) : (
                  "🤖 AI Pre-fill"
                )}
              </button>
            </div>
          )}
          {/* Warning if project not found */}
          {!project && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t("parentProjectNotFoundWarning")}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                CAPA ID: {capa.id} | Source Project ID:{" "}
                {capa.sourceProjectId || "N/A"}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("description")}
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.description || ""}
                onChange={(e) =>
                  setEditedCapa({ ...editedCapa, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
              />
            ) : (
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                {capa.description || t("noDescription")}
              </p>
            )}
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("rootCauseAnalysis")}
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.rootCause}
                onChange={(e) =>
                  setEditedCapa({ ...editedCapa, rootCause: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder={t("describeRootCausePlaceholder")}
              />
            ) : (
              <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-wrap">
                {capa.rootCause}
              </div>
            )}
          </div>

          {/* Corrective Action */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("correctiveActionAiPlan")}
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.correctiveAction}
                onChange={(e) =>
                  setEditedCapa({
                    ...editedCapa,
                    correctiveAction: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder={t("defineCorrectiveActionPlaceholder")}
              />
            ) : (
              <div className="text-gray-900 dark:text-white bg-linear-to-br from-rose-50 to-cyan-50 dark:from-pink-900/20 dark:to-cyan-900/20 p-4 rounded-md border border-rose-200 dark:border-pink-700 whitespace-pre-wrap">
                {capa.correctiveAction}
              </div>
            )}
          </div>

          {/* Preventive Action */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("preventiveAction")}
            </label>
            {isEditing ? (
              <textarea
                value={editedCapa.preventiveAction || ""}
                onChange={(e) =>
                  setEditedCapa({
                    ...editedCapa,
                    preventiveAction: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder={t("definePreventiveActionPlaceholder")}
              />
            ) : (
              <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-md whitespace-pre-wrap">
                {capa.preventiveAction || t("toBeDefined")}
              </div>
            )}
          </div>

          {/* PDCA Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("pdcaStage")}
              </label>
              {isEditing ? (
                <select
                  value={editedCapa.pdcaStage || "Plan"}
                  onChange={(e) =>
                    setEditedCapa({
                      ...editedCapa,
                      pdcaStage: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {pdcaStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {t(`pdca${stage}`)}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    capa.pdcaStage === "Plan"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : capa.pdcaStage === "Do"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : capa.pdcaStage === "Check"
                          ? "bg-rose-100 text-pink-700 dark:bg-pink-900/30 dark:text-rose-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {capa.pdcaStage || "Plan"}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("status")}
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  capa.status === "Open"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                {capa.status}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {t("createdLabel")}
              </span>
              <span className="ms-2 text-gray-900 dark:text-white">
                {new Date(capa.createdAt).toLocaleDateString()}
              </span>
            </div>
            {capa.updatedAt && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  {t("updatedLabel")}
                </span>
                <span className="ms-2 text-gray-900 dark:text-white">
                  {new Date(capa.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* AI Effectiveness Review (A-15) */}
          <div className="border border-rose-200 dark:border-pink-800 rounded-md p-4 bg-gradient-to-r from-rose-50/50 to-cyan-50/50 dark:from-pink-900/10 dark:to-cyan-900/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                🤖 AI Effectiveness Review
              </p>
              <button
                type="button"
                onClick={handleAIEffectivenessReview}
                disabled={isAIReviewing}
                className="text-xs bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-3 py-1 rounded-md hover:from-rose-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isAIReviewing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>{" "}
                    Reviewing...
                  </>
                ) : (
                  "Run Review"
                )}
              </button>
            </div>
            {aiReviewResult ? (
              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white/60 dark:bg-gray-800/60 p-3 rounded">
                {aiReviewResult}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Run an AI review to assess CAPA completeness, root cause
                quality, and closure readiness.
              </p>
            )}
          </div>

          {/* Evidence Governance Check (non-blocking) */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t("evidenceGovernanceCheck")}
              </p>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {completeness.completenessScore}%
              </span>
            </div>
            {completeness.missingFields.length > 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t("missingFields")} {completeness.missingFields.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-green-700 dark:text-green-300">
                {t("evidenceFieldsComplete")}
              </p>
            )}
            {!completeness.isClosureReady && (
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                {t("closureReadinessIncomplete")}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          {isAdmin && !isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              {t("deleteCapa")}
            </button>
          )}
          <div
            className={`flex gap-3 ${isAdmin && !isEditing ? "" : "ms-auto"}`}
          >
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedCapa(capa);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-pink-600"
                >
                  {t("saveChanges")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t("close")}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-pink-600"
                >
                  {t("edit")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t("deleteCapaConfirmTitle")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("deleteCapaConfirmMessage")}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CAPADetailsModal;
