import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useTranslation } from "../hooks/useTranslation";
import {
  ClipboardDocumentSearchIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from "../components/icons";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
import { useProjectStore } from "../stores/useProjectStore";
import { AuditPlan, ActivityLogItem } from "../types";
import AuditPlanModal from "../components/audits/AuditPlanModal";
import { Button, Input, TableContainer } from "@/components/ui";
import { getRecentActivityLogs } from "../services/activityLogService";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import LoadingScreen from "@/components/common/LoadingScreen";

const QualityRoundingPage = lazy(() => import("@/pages/QualityRoundingPage"));
const TracerWorksheetTab = lazy(
  () => import("@/components/audits/TracerWorksheetTab"),
);

interface AuditHubPageProps {
  setNavigation: (state: any) => void;
}

type AuditHubTab = "plans" | "log" | "rounding" | "tracers";

const AuditHubPage: React.FC<AuditHubPageProps> = () => {
  const { t, lang } = useTranslation();
  const {
    auditPlans,
    addAuditPlan,
    updateAuditPlan,
    deleteAuditPlan,
    runAudit,
  } = useAppStore();
  const { users } = useUserStore();
  const { projects } = useProjectStore();

  const [activeTab, setActiveTab] = useState<AuditHubTab>("plans");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AuditPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [isLoadingLog, setIsLoadingLog] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");

  const fetchActivityLog = useCallback(async () => {
    setIsLoadingLog(true);
    try {
      const logs = await getRecentActivityLogs(200);
      setActivityLog(logs);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoadingLog(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "log") {
      fetchActivityLog();
    }
  }, [activeTab, fetchActivityLog]);

  const handleSavePlan = (plan: AuditPlan | Omit<AuditPlan, "id">) => {
    if ("id" in plan) {
      updateAuditPlan(plan);
    } else {
      addAuditPlan(plan);
    }
    setIsModalOpen(false);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm(t("areYouSureDeleteAuditPlan"))) {
      deleteAuditPlan(planId);
    }
  };

  const formatAuditsText = (itemCount: number, frequency: string) => {
    const frequencyText = frequency === "weekly" ? t("weekly") : t("monthly");
    return `${t("auditLog")} ${itemCount} ${t(
      "itemsToAudit",
    )} ${frequencyText}`;
  };

  const filteredLog = useMemo(() => {
    return (activityLog || []).filter((log) => {
      const searchLower = searchTerm.toLowerCase();
      const actionText =
        typeof log.action === "string" ? log.action : log.action?.[lang] || "";
      const detailsText =
        typeof log.details === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(log.details);
                return parsed?.[lang] || log.details;
              } catch {
                return log.details;
              }
            })()
          : log.details || "";
      return (
        log.user.toLowerCase().includes(searchLower) ||
        actionText.toLowerCase().includes(searchLower) ||
        detailsText.toLowerCase().includes(searchLower)
      );
    });
  }, [activityLog, searchTerm, lang]);

  const tabButtonClasses = (tabName: AuditHubTab) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
      activeTab === tabName
        ? "border-brand-primary text-brand-primary"
        : "border-transparent text-brand-text-secondary dark:text-dark-brand-text-secondary hover:border-gray-300 dark:hover:border-gray-600"
    }`;

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const planCount = auditPlans.length;
      const recentLogs = activityLog.slice(0, 20);
      const logSummary = recentLogs
        .map(
          (l) =>
            `${typeof l.action === "string" ? l.action : l.action?.[lang] || ""}`,
        )
        .join("; ");

      const prompt = `You are a healthcare accreditation audit & quality specialist. Analyze the following audit hub data and provide actionable insights:

**Audit Plans:** ${planCount} configured
**Recent Activity (last 20):** ${logSummary || "No recent activity"}
**Projects:** ${projects.length} total

Provide a structured analysis with:
1. **Audit Coverage Assessment** — Are there gaps in audit plan coverage?
2. **Quality Rounding Insights** — Recommendations for quality rounding schedule and focus areas
3. **Compliance Risks** — Potential compliance risks based on audit patterns
4. **Activity Patterns** — What the activity log reveals about audit discipline
5. **Priority Actions** — Top 3 immediate actions for audit improvement

Format your response in clear Markdown with headers and bullet points.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalTitle("AI Audit & Quality Analysis");
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <ClipboardDocumentSearchIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("auditHub")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("auditHubDescription")}
            </p>
          </div>
        </div>
        {activeTab === "plans" && (
          <Button
            onClick={() => {
              setEditingPlan(null);
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto"
          >
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("newAuditPlan")}
          </Button>
        )}
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
          <Button
            onClick={() => {
              setActiveTab("plans");
              setSearchTerm("");
            }}
            variant={activeTab === "plans" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            {t("auditPlans")}
          </Button>
          <Button
            onClick={() => {
              setActiveTab("log");
              setSearchTerm("");
            }}
            variant={activeTab === "log" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            {t("auditLog")}
          </Button>
          <Button
            onClick={() => setActiveTab("rounding")}
            variant={activeTab === "rounding" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            {t("qualityRounding")}
          </Button>
          <Button
            onClick={() => setActiveTab("tracers")}
            variant={activeTab === "tracers" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            Tracers
          </Button>
        </nav>
      </div>

      {activeTab === "plans" && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
          <h2 className="text-xl font-semibold mb-4">{t("auditPlans")}</h2>
          <div className="space-y-4">
            {auditPlans.map((plan) => {
              const project = projects.find((p) => p.id === plan.projectId);
              const auditor = users.find(
                (u) => u.id === plan.assignedAuditorId,
              );
              return (
                <div
                  key={plan.id}
                  className="p-4 border rounded-lg dark:border-dark-brand-border flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-gray-500">{project?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatAuditsText(plan.itemCount, plan.frequency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      {t("auditor")}: {auditor?.name}
                    </span>
                    <Button
                      onClick={() => runAudit(plan.id)}
                      variant="ghost"
                      size="sm"
                    >
                      {t("runAudit")}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsModalOpen(true);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeletePlan(plan.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              );
            })}
            {auditPlans.length === 0 && (
              <p className="text-center py-8 text-gray-500">
                {t("noAuditPlans")}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "log" && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
          <div className="p-4 sm:p-6 border-b dark:border-dark-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("auditLog")}
              </h2>
            </div>
            <div className="w-full sm:w-auto sm:max-w-xs">
              <Input
                type="text"
                placeholder={t("searchActivity")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<SearchIcon className="h-5 w-5" />}
              />
            </div>
          </div>
          <TableContainer>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right"
                  >
                    {t("timestamp")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right"
                  >
                    {t("user")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right"
                  >
                    {t("action")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                {isLoadingLog ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                        {t("loading")}...
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLog.map((log) => {
                    const actionText =
                      typeof log.action === "string"
                        ? log.action
                        : log.action?.[lang] || "";
                    const detailsText =
                      typeof log.details === "string"
                        ? (() => {
                            try {
                              const parsed = JSON.parse(log.details);
                              return parsed?.[lang] || "";
                            } catch {
                              return "";
                            }
                          })()
                        : "";
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString(
                            lang === "ar" ? "ar-OM" : "en-US",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                          {log.user}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                            {actionText}
                          </p>
                          {detailsText && (
                            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                              {detailsText}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {!isLoadingLog && filteredLog.length === 0 && (
              <p className="text-center py-8 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {searchTerm ? t("noProjectsFound") : t("noActivity")}
              </p>
            )}
          </TableContainer>
        </div>
      )}

      {isModalOpen && (
        <AuditPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePlan}
          existingPlan={editingPlan}
          projects={projects}
          users={users}
        />
      )}

      {activeTab === "rounding" && (
        <Suspense fallback={<LoadingScreen />}>
          <QualityRoundingPage />
        </Suspense>
      )}

      {activeTab === "tracers" && (
        <Suspense fallback={<LoadingScreen />}>
          <TracerWorksheetTab />
        </Suspense>
      )}

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        content={aiModalContent}
        type="compliance-check"
      />
    </div>
  );
};

export default AuditHubPage;
