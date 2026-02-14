import React, { useState } from "react";
import { Project, MockSurvey, User, NavigationState } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { Button } from "@/components/ui";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import { PlusIcon } from "@/components/icons";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";

interface SurveyReportPageProps {
  project: Project;
  survey: MockSurvey;
  users: User[];
  surveyor?: User;
  onApplyFindings: (projectId: string, surveyId: string) => void;
  setNavigation: (state: NavigationState) => void;
}

const SurveyReportPage: React.FC<SurveyReportPageProps> = ({
  project,
  survey,
  users,
  surveyor,
  onApplyFindings,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { createPDCACycle, createCAPA } = useProjectStore();
  const { addRisk } = useAppStore();
  const toast = useToast();
  const [autoCreating, setAutoCreating] = useState(false);
  const [aiAssessing, setAiAssessing] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");

  const failedItems = survey.results.filter((r) => r.result === "Fail");

  const handleAutoCreateFromSurvey = async () => {
    setAutoCreating(true);
    let risksCreated = 0;
    let capasCreated = 0;

    try {
      for (const result of failedItems) {
        const item = project.checklist.find(
          (c) => c.id === result.checklistItemId,
        );
        if (!item) continue;

        // Create Risk
        await addRisk({
          title: `Survey Finding: ${item.standardId}`,
          description: `Failed during survey on ${new Date(
            survey.date,
          ).toLocaleDateString()}\n\n${result.notes}`,
          severity: "high",
          likelihood: "high",
          category: "Compliance",
          status: "open",
          owner: surveyor?.id || "",
          identifiedDate: survey.date,
          reviewDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        } as any);
        risksCreated++;

        // Create CAPA
        await createCAPA(project.id, {
          checklistItemId: item.id,
          description: `Survey Finding: ${item.item}`,
          rootCause: result.notes || "To be analyzed",
          correctiveAction: "To be defined",
          preventiveAction: "To be defined",
          status: "Open",
          assignedTo: item.assignedTo || surveyor?.id || "",
          dueDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          pdcaStage: "Plan",
          pdcaHistory: [],
        } as any);
        capasCreated++;
      }

      toast.success(
        `✅ Created ${risksCreated} risks and ${capasCreated} CAPA reports from survey findings!`,
      );
    } catch (error) {
      toast.error("Failed to auto-create items from survey");
    } finally {
      setAutoCreating(false);
    }
  };

  const handleAIRiskAssessment = async () => {
    if (aiAssessing || failedItems.length === 0) return;

    setAiAssessing(true);
    try {
      const failedData = failedItems.map((result) => {
        const item = project.checklist.find(
          (c) => c.id === result.checklistItemId,
        );
        return {
          question: item?.item || "Unknown",
          response: result.notes || "Failed",
          category: item?.standardId || "General",
        };
      });

      const assessment = await aiAgentService.assessSurveyRisk({
        surveyTitle: `${project.name} - ${survey.type} Survey`,
        failedItems: failedData,
      });

      setAiModalContent(assessment);
      setAiModalOpen(true);
      toast.success("AI risk assessment complete!");
    } catch (error) {
      toast.error("Failed to generate AI risk assessment");
      console.error("AI risk assessment error:", error);
    } finally {
      setAiAssessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <h1 className="text-2xl font-bold">
          {t("surveyReport")} - {project.name}
        </h1>
        <p className="text-sm text-gray-500">
          Date: {new Date(survey.date).toLocaleDateString()} | Surveyor:{" "}
          {surveyor?.name}
        </p>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => onApplyFindings(project.id, survey.id)}
            size="sm"
          >
            {t("applyFindings")}
          </Button>
          <Button
            onClick={handleAIRiskAssessment}
            disabled={aiAssessing || failedItems.length === 0}
            variant="secondary"
            size="sm"
            className="bg-gradient-to-r from-rose-600 to-cyan-600 hover:from-rose-700 hover:to-cyan-700 text-white"
          >
            {aiAssessing ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
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
                Assessing...
              </>
            ) : (
              <>🤖 AI Risk Assessment</>
            )}
          </Button>
          <Button
            onClick={handleAutoCreateFromSurvey}
            disabled={autoCreating || failedItems.length === 0}
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-pink-600"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {autoCreating
              ? "Creating..."
              : `Auto-Create ${failedItems.length} Risks & CAPAs`}
          </Button>
        </div>
        {failedItems.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            🔗 Smart Flow: Automatically creates Risks in Risk Hub and CAPA
            Reports from all failed items
          </p>
        )}
      </div>

      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <h2 className="text-xl font-semibold mb-4">
          {t("failedItems")} ({failedItems.length})
        </h2>
        <div className="space-y-4">
          {failedItems.map((result) => {
            const item = project.checklist.find(
              (c) => c.id === result.checklistItemId,
            );
            if (!item) return null;
            return (
              <div
                key={result.checklistItemId}
                className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <p className="font-semibold">{item.item}</p>
                <p className="text-xs text-gray-500 mb-2">{item.standardId}</p>
                <p className="text-sm italic">"{result.notes}"</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Suggestion Modal */}
      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Risk Assessment"
        content={aiModalContent}
        type="risk-assessment"
      />
    </div>
  );
};

export default SurveyReportPage;
