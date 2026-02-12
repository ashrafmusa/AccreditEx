import React, { useState } from "react";
import { CAPAReport, PDCACycle, PDCAStage } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { ClockIcon, UserIcon, FlagIcon, PlusIcon } from "../icons";
import { useProjectStore } from "@/stores/useProjectStore";
import { useToast } from "@/hooks/useToast";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";

interface PDCACycleCardProps {
  item: CAPAReport | PDCACycle;
  type: "capa" | "cycle";
  onView: () => void;
  onAdvanceStage?: () => void;
  projectId?: string;
  onAISuggestion?: (suggestions: string) => void;
}

const PDCACycleCard: React.FC<PDCACycleCardProps> = ({
  item,
  type,
  onView,
  onAdvanceStage,
  projectId,
  onAISuggestion,
}) => {
  const { t } = useTranslation();
  const { createPDCACycle } = useProjectStore();
  const toast = useToast();
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");
  const [aiModalType, setAiModalType] = useState<"root-cause" | "improvements">(
    "improvements"
  );

  // Determine current stage
  const currentStage: PDCAStage =
    type === "capa"
      ? (item as CAPAReport).pdcaStage || "Plan"
      : (item as PDCACycle).currentStage;

  const handleConvertToPDCA = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;

    const capa = item as CAPAReport;
    try {
      await createPDCACycle(projectId, {
        projectId,
        title: capa.description || "CAPA Conversion",
        description: `Converted from CAPA Report\n\nRoot Cause: ${
          capa.rootCause
        }\nCorrective Action: ${capa.correctiveAction}\nPreventive Action: ${
          capa.preventiveAction || "N/A"
        }`,
        category: "Process",
        priority: "High",
        owner: capa.assignedTo,
        team: [],
        currentStage: capa.pdcaStage || "Plan",
        targetCompletionDate: capa.dueDate,
        improvementMetrics: { baseline: [], target: [], actual: [] },
      });
      toast.success("🔗 CAPA converted to PDCA Cycle!");
    } catch (error) {
      toast.error("Failed to convert CAPA to PDCA");
    }
  };

  const handleAISuggestions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type !== "cycle" || isGeneratingAI) return;

    const cycle = item as PDCACycle;
    setIsGeneratingAI(true);

    try {
      const suggestions = await aiAgentService.suggestPDCAImprovements({
        title: cycle.title,
        currentStage: cycle.currentStage,
        description: cycle.description,
        actions: cycle.actions,
      });

      setAiModalTitle("AI Improvement Suggestions");
      setAiModalContent(suggestions);
      setAiModalType("improvements");
      setAiModalOpen(true);
      toast.success("AI suggestions generated!");
    } catch (error) {
      toast.error("Failed to generate AI suggestions");
      console.error("AI suggestions error:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIRootCause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type !== "capa" || isGeneratingAI) return;

    const capa = item as CAPAReport;
    setIsGeneratingAI(true);

    try {
      const rootCause = await aiAgentService.analyzeRootCause({
        title: capa.description,
        description: capa.description,
        findings: capa.rootCause,
      });

      setAiModalTitle("AI Root Cause Analysis");
      setAiModalContent(rootCause);
      setAiModalType("root-cause");
      setAiModalOpen(true);
      toast.success("AI root cause analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze root cause");
      console.error("AI root cause error:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Get stage color
  const getStageColor = (stage: PDCAStage) => {
    switch (stage) {
      case "Plan":
        return "bg-blue-100 dark:bg-blue-900/20 border-blue-500";
      case "Do":
        return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500";
      case "Check":
        return "bg-rose-100 dark:bg-pink-900/20 border-rose-500";
      case "Act":
        return "bg-green-100 dark:bg-green-900/20 border-green-500";
      case "Completed":
        return "bg-gray-100 dark:bg-gray-800 border-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-400";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Extract data based on type
  const title =
    type === "capa"
      ? (item as CAPAReport).description
      : (item as PDCACycle).title;

  const owner =
    type === "capa"
      ? (item as CAPAReport).assignedTo
      : (item as PDCACycle).owner;

  const dueDate =
    type === "capa"
      ? (item as CAPAReport).dueDate
      : (item as PDCACycle).targetCompletionDate;

  const priority = type === "cycle" ? (item as PDCACycle).priority : "Medium"; // Default for CAPAs

  // Calculate days until due
  const getDaysUntilDue = (date: string) => {
    const due = new Date(date);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(dueDate);
  const isOverdue = daysUntilDue < 0;

  return (
    <div
      className={`${getStageColor(
        currentStage
      )} border-l-4 rounded-lg p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200`}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary line-clamp-2 flex-1">
          {title}
        </h4>
        {type === "cycle" && (
          <span
            className={`${getPriorityColor(
              priority
            )} text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0`}
          >
            {priority}
          </span>
        )}
      </div>

      {/* Type Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {type === "capa" ? (
            <>
              <FlagIcon className="h-3 w-3 mr-1" />
              {(item as CAPAReport).type} CAPA
            </>
          ) : (
            <>
              <FlagIcon className="h-3 w-3 mr-1" />
              {(item as PDCACycle).category}
            </>
          )}
        </span>
      </div>

      {/* Owner & Due Date */}
      <div className="flex items-center justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
        <div className="flex items-center">
          <UserIcon className="h-3 w-3 mr-1" />
          <span className="truncate max-w-[100px]">
            {owner || t("unassigned")}
          </span>
        </div>
        <div
          className={`flex items-center ${
            isOverdue ? "text-red-600 dark:text-red-400 font-semibold" : ""
          }`}
        >
          <ClockIcon className="h-3 w-3 mr-1" />
          <span>
            {isOverdue
              ? `${Math.abs(daysUntilDue)}d ${t("overdue")}`
              : `${daysUntilDue}d`}
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      {type === "capa" &&
        (item as CAPAReport).pdcaHistory &&
        (item as CAPAReport).pdcaHistory!.length > 0 && (
          <div className="mt-3 pt-3 border-t border-brand-border dark:border-dark-brand-border">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("progress")}
              </span>
              <span className="text-brand-text-primary dark:text-dark-brand-text-primary font-semibold">
                {Math.round(
                  ((item as CAPAReport).pdcaHistory!.length / 4) * 100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-brand-primary h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    ((item as CAPAReport).pdcaHistory!.length / 4) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

      {/* CAPA to PDCA Conversion Button */}
      {type === "capa" && projectId && (
        <div className="mt-3 space-y-2">
          <button
            onClick={handleAIRootCause}
            disabled={isGeneratingAI}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded hover:from-rose-700 hover:to-pink-700 transition-colors disabled:opacity-50"
          >
            {isGeneratingAI ? (
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
                </svg>
                Analyzing...
              </>
            ) : (
              <>🤖 AI Root Cause Analysis</>
            )}
          </button>
          <button
            onClick={handleConvertToPDCA}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gradient-to-r from-sky-600 to-rose-600 text-white rounded hover:from-sky-700 hover:to-pink-700 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Convert to PDCA Cycle
          </button>
        </div>
      )}

      {/* PDCA Cycle AI Suggestions */}
      {type === "cycle" && (
        <div className="mt-3">
          <button
            onClick={handleAISuggestions}
            disabled={isGeneratingAI}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gradient-to-r from-rose-600 to-cyan-600 text-white rounded hover:from-rose-700 hover:to-cyan-700 transition-colors disabled:opacity-50"
          >
            {isGeneratingAI ? (
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
                </svg>
                Generating...
              </>
            ) : (
              <>🤖 AI Improvement Suggestions</>
            )}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {onAdvanceStage && currentStage !== "Completed" && (
        <div className="mt-3 pt-3 border-t border-brand-border dark:border-dark-brand-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage();
            }}
            className="w-full text-xs py-1.5 px-3 rounded bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors duration-200"
          >
            {t("advanceToNextStage")}
          </button>
        </div>
      )}

      {/* AI Suggestion Modal */}
      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        content={aiModalContent}
        type={aiModalType}
      />
    </div>
  );
};

export default PDCACycleCard;
