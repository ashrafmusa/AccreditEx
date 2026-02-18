import React, { useState } from "react";
import {
  Project,
  MockSurvey,
  User,
  NavigationState,
  MockSurveyResult,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { useToast } from "@/hooks/useToast";

interface SurveyComponentProps {
  project: Project;
  survey: MockSurvey;
  users: User[];
  onUpdateSurvey: (projectId: string, survey: MockSurvey) => void;
  setNavigation: (state: NavigationState) => void;
}

const SurveyComponent: React.FC<SurveyComponentProps> = ({
  project,
  survey,
  users,
  onUpdateSurvey,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [results, setResults] = useState<MockSurveyResult[]>(survey.results);
  const surveyor = users.find((u) => u.id === survey.surveyorId);
  const [aiHints, setAiHints] = useState<Record<string, string>>({});
  const [loadingHint, setLoadingHint] = useState<string | null>(null);
  const [surveyBriefing, setSurveyBriefing] = useState<string | null>(null);
  const [isBriefing, setIsBriefing] = useState(false);

  const handleResultChange = (
    checklistItemId: string,
    field: keyof MockSurveyResult,
    value: any,
  ) => {
    const newResults = results.map((r) =>
      r.checklistItemId === checklistItemId ? { ...r, [field]: value } : r,
    );
    setResults(newResults);
  };

  const handleSave = () => {
    onUpdateSurvey(project.id, { ...survey, results });
    alert("Progress saved!");
  };

  const handleAIHint = async (
    itemId: string,
    itemText: string,
    standardId: string,
  ) => {
    if (loadingHint) return;
    setLoadingHint(itemId);
    try {
      const prompt = `You are a healthcare accreditation mock survey coach. A surveyor is evaluating this checklist item during a mock survey. Provide brief, practical guidance.

Checklist Item: ${itemText}
Standard: ${standardId}
Project: ${project.name}

Provide:
1. **What to Look For** — 2-3 specific things the surveyor should check
2. **Common Pitfalls** — 1-2 frequent mistakes or oversights
3. **Surveyor Tip** — one practical tip for this item

Keep it very concise (5-6 lines max). This is quick guidance during an active survey.`;

      const response = await aiAgentService.chat(prompt, true);
      setAiHints((prev) => ({ ...prev, [itemId]: response.response }));
    } catch (error) {
      console.error("AI hint error:", error);
      toast.error("Failed to get AI guidance.");
    } finally {
      setLoadingHint(null);
    }
  };

  const handleSurveyBriefing = async () => {
    if (isBriefing) return;
    setIsBriefing(true);
    try {
      const totalItems = project.checklist.length;
      const completed = results.filter(
        (r) => r.result && r.result !== "Not Applicable",
      ).length;
      const failed = results.filter((r) => r.result === "Fail").length;

      const prompt = `You are a healthcare accreditation survey coach. Provide a pre-survey briefing for this mock survey.

Project: ${project.name}
Surveyor: ${surveyor?.name || "Unknown"}
Total Items: ${totalItems}
Completed: ${completed}, Failed: ${failed}

Provide a brief survey preparation guide:
1. **Focus Areas** — 3 key areas to prioritize
2. **Survey Tips** — 3 practical tips for effective surveying
3. **Red Flags** — 2-3 things that commonly cause survey failures

Keep it actionable and concise.`;

      const response = await aiAgentService.chat(prompt, true);
      setSurveyBriefing(response.response);
    } catch (error) {
      console.error("Survey briefing error:", error);
      toast.error("Failed to generate survey briefing.");
    } finally {
      setIsBriefing(false);
    }
  };

  const handleComplete = () => {
    onUpdateSurvey(project.id, { ...survey, results, status: "Completed" });
    setNavigation({
      view: "surveyReport",
      projectId: project.id,
      surveyId: survey.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <h1 className="text-2xl font-bold">
          {t("mockSurvey")} - {project.name}
        </h1>
        <p className="text-sm text-gray-500">
          Date: {new Date(survey.date).toLocaleDateString()} | Surveyor:{" "}
          {surveyor?.name}
        </p>
        <button
          onClick={handleSurveyBriefing}
          disabled={isBriefing}
          className="mt-3 bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-rose-700 hover:to-cyan-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isBriefing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              Generating...
            </>
          ) : (
            <>🤖 AI Survey Briefing</>
          )}
        </button>
      </div>

      {surveyBriefing && (
        <div className="bg-gradient-to-r from-rose-50 to-cyan-50 dark:from-rose-900/10 dark:to-cyan-900/10 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              🤖 AI Survey Briefing
            </h3>
            <button
              onClick={() => setSurveyBriefing(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕ Dismiss
            </button>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {surveyBriefing}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {project.checklist.map((item) => {
          const result = results.find((r) => r.checklistItemId === item.id);
          return (
            <div
              key={item.id}
              className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg border dark:border-dark-brand-border"
            >
              <p className="font-semibold">{item.item}</p>
              <p className="text-xs text-gray-400">{item.standardId}</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-4">
                    {(["Pass", "Fail", "Not Applicable"] as const).map(
                      (res) => (
                        <label
                          key={res}
                          className="flex items-center gap-1 text-sm"
                        >
                          <input
                            type="radio"
                            name={`result-${item.id}`}
                            value={res}
                            checked={result?.result === res}
                            onChange={() =>
                              handleResultChange(item.id, "result", res)
                            }
                          />
                          {res}
                        </label>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <textarea
                    value={result?.notes || ""}
                    onChange={(e) =>
                      handleResultChange(item.id, "notes", e.target.value)
                    }
                    rows={2}
                    placeholder="Surveyor notes..."
                    className="w-full text-sm p-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-start gap-2">
                <button
                  onClick={() =>
                    handleAIHint(item.id, item.item, item.standardId)
                  }
                  disabled={loadingHint !== null}
                  className="text-xs bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-3 py-1 rounded-md hover:from-rose-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                >
                  {loadingHint === item.id ? (
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
                      Loading...
                    </>
                  ) : (
                    <>🤖 AI Hint</>
                  )}
                </button>
                {aiHints[item.id] && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-cyan-50 dark:bg-cyan-900/20 p-2 rounded-md flex-1 whitespace-pre-wrap">
                    {aiHints[item.id]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md"
        >
          {t("saveChanges")}
        </button>
        <button
          onClick={handleComplete}
          className="bg-brand-primary text-white py-2 px-4 rounded-md"
        >
          {t("completeSurvey")}
        </button>
      </div>
    </div>
  );
};

export default SurveyComponent;
