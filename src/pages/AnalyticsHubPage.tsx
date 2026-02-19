import React, { useState, lazy, Suspense } from "react";
import { NavigationState } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { ChartBarSquareIcon, SparklesIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import LoadingScreen from "@/components/common/LoadingScreen";

const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const QualityInsightsPage = lazy(() => import("@/pages/QualityInsightsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));

type AnalyticsHubTab = "overview" | "qualityInsights" | "reports";

interface AnalyticsHubPageProps {
  setNavigation: (state: NavigationState) => void;
}

const AnalyticsHubPage: React.FC<AnalyticsHubPageProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { users, currentUser } = useUserStore();
  const { departments, competencies, risks, userTrainingStatuses } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<AnalyticsHubTab>("overview");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const totalProjects = projects.length;
      const activeProjects = projects.filter(
        (p) => p.status === "In Progress",
      ).length;
      const completedProjects = projects.filter(
        (p) => p.status === "Completed",
      ).length;
      const allChecklist = projects.flatMap((p) => p.checklist);
      const compliant = allChecklist.filter(
        (i) => i.status === "Compliant",
      ).length;
      const complianceRate =
        allChecklist.length > 0
          ? Math.round((compliant / allChecklist.length) * 100)
          : 0;
      const totalRisks = risks.length;
      const openRisks = risks.filter(
        (r) => r.status !== "Mitigated" && r.status !== "Closed",
      ).length;

      const prompt = `You are a healthcare accreditation analytics specialist. Analyze the following organizational data and provide strategic insights:

**Portfolio Overview:**
- Total Projects: ${totalProjects} (${activeProjects} active, ${completedProjects} completed)
- Overall Compliance Rate: ${complianceRate}%
- Total Staff: ${users.length}
- Departments: ${departments.length}
- Risk Register: ${totalRisks} total risks (${openRisks} open)
- Competencies Tracked: ${competencies.length}

Provide a structured executive analysis with:
1. **Executive Summary** — Overall organizational health assessment
2. **Compliance Trajectory** — Trend analysis and projections
3. **Risk Landscape** — Key risk areas needing attention
4. **Workforce Readiness** — Training and competency gaps
5. **Strategic Recommendations** — Top 5 actions for leadership
6. **Accreditation Readiness** — Estimated readiness for upcoming surveys

Format your response in clear Markdown with headers and bullet points.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI analytics analysis failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const tabs: { key: AnalyticsHubTab; label: string }[] = [
    { key: "overview", label: t("analytics") || "Analytics" },
    {
      key: "qualityInsights",
      label: t("qualityInsights") || "Quality Insights",
    },
    { key: "reports", label: t("reports") || "Reports" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <ChartBarSquareIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("analyticsHub") || "Analytics Hub"}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("analyticsHubDescription") ||
                "Comprehensive analytics, quality insights, and reports"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAIAnalyze}
          variant="ghost"
          disabled={aiLoading}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 dark:text-purple-400 dark:border-purple-800"
        >
          <SparklesIcon className="h-4 w-4" />
          {aiLoading ? t("loading") + "..." : "AI Analyze"}
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-brand-border">
        <nav
          className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              variant={activeTab === tab.key ? "primary" : "ghost"}
              className="rounded-t-lg border-b-2 whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === "overview" && (
          <Suspense fallback={<LoadingScreen />}>
            <AnalyticsPage setNavigation={setNavigation} />
          </Suspense>
        )}
        {activeTab === "qualityInsights" && (
          <Suspense fallback={<LoadingScreen />}>
            <QualityInsightsPage
              projects={projects}
              risks={risks}
              users={users}
              departments={departments}
              competencies={competencies}
              userTrainingStatuses={userTrainingStatuses}
            />
          </Suspense>
        )}
        {activeTab === "reports" && (
          <Suspense fallback={<LoadingScreen />}>
            <ReportsPage />
          </Suspense>
        )}
      </div>

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Strategic Analytics"
        content={aiModalContent}
        type="improvements"
      />
    </div>
  );
};

export default AnalyticsHubPage;
