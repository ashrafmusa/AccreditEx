import React, { useState, useEffect } from "react";
import { Project, Risk, User, Department, Competency } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useAIAgent } from "../../hooks/useAIAgent";
import {
  SparklesIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowPathIcon,
} from "../icons";
import ReactMarkdown from "react-markdown";

interface AIQualityBriefingProps {
  projects: Project[];
  risks: Risk[];
  users: User[];
  departments: Department[];
  competencies: Competency[];
}

const AIQualityBriefing: React.FC<AIQualityBriefingProps> = ({
  projects,
  risks,
  users,
  departments,
  competencies,
}) => {
  const { t } = useTranslation();
  const { chatHistory, isLoading, error, sendMessage, clearHistory } =
    useAIAgent();
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = () => {
    clearHistory();
    setHasGenerated(true);

    // Prepare a summary of the data for the AI
    const dataSummary = {
      projectCount: projects.length,
      activeProjects: projects.filter((p) => p.status === "In Progress").length,
      highRisks: risks.filter((r) => r.level === "High").length,
      riskCount: risks.length,
      departmentCount: departments.length,
      competencyGaps: "Calculated based on user training status", // Simplified for prompt
    };

    const prompt = `
      Generate a strategic Quality Briefing for the Accreditation Director.
      
      Context Data:
      ${JSON.stringify(dataSummary, null, 2)}
      
      Please provide:
      1. **Strategic Strengths**: What are we doing well?
      2. **Critical Concerns**: What high-level risks need attention?
      3. **Strategic Recommendations**: 3 actionable steps for continuous improvement (PDCA).
      
      Format as a professional executive summary with clear sections.
    `;

    sendMessage(prompt, {
      page_title: "Quality Insights Hub",
      user_role: "Quality Manager",
    });
  };

  const lastMessage =
    chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;

  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-sky-50 dark:from-sky-900/50 to-pink-50 dark:to-pink-900/50 p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-brand-primary" />
            {t("aiQualityBriefing")}
          </h3>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 max-w-2xl">
            {t("aiQualityBriefingDescription")}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center font-semibold shadow-sm w-full sm:w-auto disabled:bg-sky-400 disabled:cursor-wait"
        >
          {isLoading ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin ltr:mr-2 rtl:ml-2" />
          ) : (
            <SparklesIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
          )}
          {isLoading
            ? t("generatingBriefing")
            : hasGenerated
              ? t("regenerateBriefing")
              : t("generateBriefing")}
        </button>
      </div>

      <div className="mt-6 border-t border-sky-200 dark:border-sky-800 pt-6">
        {isLoading && !lastMessage ? renderSkeleton() : null}

        {error && <p className="text-red-500 text-center">{error}</p>}

        {lastMessage?.role === "assistant" && (
          <div className="prose prose-sm dark:prose-invert max-w-none animate-[fadeInUp_0.5s_ease-out]">
            <ReactMarkdown>{lastMessage.content}</ReactMarkdown>
          </div>
        )}

        {!isLoading && !hasGenerated && (
          <div className="text-center text-brand-text-secondary dark:text-dark-brand-text-secondary py-8 italic">
            {t("clickToGenerateBriefing") ||
              'Click "Generate Briefing" to receive a strategic analysis of your quality metrics.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIQualityBriefing;
