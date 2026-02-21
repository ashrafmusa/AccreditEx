import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CHART_COLORS,
  getChartTheme,
  ChartTooltip,
  BarGradientDef,
  CHART_ANIMATION,
} from "@/utils/chartTheme";
import {
  NavigationState,
  ProjectStatus,
  CAPAReport,
  ComplianceStatus,
  Risk,
} from "@/types";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  PlayCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/components/common/ThemeProvider";
import StatCard from "@/components/common/StatCard";
import StatCardSkeleton from "@/components/common/StatCardSkeleton";
import ChartSkeleton from "@/components/common/ChartSkeleton";
import EmptyStatePlaceholder from "@/components/common/EmptyStatePlaceholder";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { exportDashboardMetricsToCSV } from "@/utils/exportUtils";
import { statusToTranslationKey } from "@/utils/complianceUtils";
import {
  calculateAssessorPackExportMetrics,
  getAssessorPackExportAudit,
} from "@/services/assessorReportPackService";
import { calculatePortfolioReadiness } from "@/services/tqmReadinessService";
import {
  calculateGuideReadinessCorrelation,
  getRecentMonthlyQualityOutcomeSnapshots,
  recordMonthlyQualityOutcomeSnapshot,
} from "@/services/qualityOutcomeIntelligenceService";
import DashboardHeader from "./DashboardHeader";
// FIX: Corrected import path for CapaListItem
import CapaListItem from "./CapaListItem";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { FeatureDiscoveryWidget } from "./widgets/FeatureDiscoveryWidget";
import PendingApprovalsWidget from "./PendingApprovalsWidget";

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
  risks?: Risk[];
}

// Default data structure for error fallback
const getDefaultDashboardData = () => ({
  totalProjects: 0,
  inProgressCount: 0,
  completedCount: 0,
  overallCompliance: "0.0%",
  openCapaCount: 0,
  upcomingDeadlinesCount: 0,
  complianceChartData: [],
  pieChartData: [],
  recentOpenCapa: [],
  // New metrics
  auditComplianceRate: "0%",
  riskExposure: 0,
  documentsReviewOverdue: 0,
  mitigatedRisks: 0,
});

const PIE_COLORS = CHART_COLORS.palette;

const AdminDashboard: React.FC<DashboardPageProps> = ({
  setNavigation,
  risks = [],
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { theme } = useTheme();

  const projects = useProjectStore((state) => state.projects);
  const { users } = useUserStore();
  const { documents, auditPlans, audits } = useAppStore();

  // Loading state - simulate loading for first 1.5 seconds
  const [isLoading, setIsLoading] = useState(true);
  const [cycleGuideDismissed, setCycleGuideDismissed] = useState<boolean>(
    () => {
      try {
        return (
          localStorage.getItem("accreditex-first-cycle-guide-dismissed") ===
          "true"
        );
      } catch {
        return false;
      }
    },
  );

  const [cycleGuideCompleted, setCycleGuideCompleted] = useState<string[]>(
    () => {
      try {
        const raw = localStorage.getItem("accreditex-first-cycle-guide-steps");
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    },
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "accreditex-first-cycle-guide-dismissed",
        cycleGuideDismissed ? "true" : "false",
      );
      localStorage.setItem(
        "accreditex-first-cycle-guide-steps",
        JSON.stringify(cycleGuideCompleted),
      );
    } catch {
      // no-op
    }
  }, [cycleGuideDismissed, cycleGuideCompleted]);

  const firstProgramId = projects[0]?.programId;

  const accreditationCycleSteps = useMemo(
    () => [
      {
        id: "standards",
        title: "Review accreditation standards",
        action: () =>
          firstProgramId
            ? setNavigation({ view: "standards", programId: firstProgramId })
            : setNavigation({ view: "projects" }),
      },
      {
        id: "project",
        title: "Create first accreditation project",
        action: () => setNavigation({ view: "createProject" }),
      },
      {
        id: "evidence",
        title: "Upload and link controlled evidence",
        action: () => setNavigation({ view: "documentControl" }),
      },
      {
        id: "audit",
        title: "Schedule and run internal audits",
        action: () => setNavigation({ view: "auditHub" }),
      },
      {
        id: "readiness",
        title: "Validate readiness and close open findings",
        action: () => setNavigation({ view: "qualityInsights" }),
      },
    ],
    [firstProgramId, setNavigation],
  );

  const cycleGuideProgress =
    accreditationCycleSteps.length > 0
      ? Math.round(
          (cycleGuideCompleted.length / accreditationCycleSteps.length) * 100,
        )
      : 0;

  const assessorExportMetrics = useMemo(() => {
    const auditEntries = getAssessorPackExportAudit();
    return calculateAssessorPackExportMetrics(auditEntries);
  }, [cycleGuideCompleted.length, cycleGuideDismissed]);

  const readinessMetrics = useMemo(
    () => calculatePortfolioReadiness(projects, risks, documents),
    [projects, risks, documents],
  );

  const monthlyOutcomeSnapshots = useMemo(
    () => getRecentMonthlyQualityOutcomeSnapshots(6),
    [
      readinessMetrics.readinessScore,
      readinessMetrics.criticalOpenFindings,
      cycleGuideProgress,
      assessorExportMetrics.exportsLast30Days,
      assessorExportMetrics.reviewerSignOffRatePercent,
    ],
  );

  const guideReadinessCorrelation = useMemo(
    () => calculateGuideReadinessCorrelation(monthlyOutcomeSnapshots),
    [monthlyOutcomeSnapshots],
  );

  useEffect(() => {
    recordMonthlyQualityOutcomeSnapshot({
      readinessScore: readinessMetrics.readinessScore,
      guideCompletionPercent: cycleGuideProgress,
      assessorExportsLast30Days: assessorExportMetrics.exportsLast30Days,
      reviewerSignOffRatePercent:
        assessorExportMetrics.reviewerSignOffRatePercent,
      criticalOpenFindings: readinessMetrics.criticalOpenFindings,
    });
  }, [
    readinessMetrics.readinessScore,
    readinessMetrics.criticalOpenFindings,
    cycleGuideProgress,
    assessorExportMetrics.exportsLast30Days,
    assessorExportMetrics.reviewerSignOffRatePercent,
  ]);

  const dashboardData = useMemo(() => {
    try {
      // Validate inputs
      if (!projects || !Array.isArray(projects)) {
        console.warn("AdminDashboard: Projects data is invalid");
        return getDefaultDashboardData();
      }

      const totalProjects = projects.length;
      const inProgressCount = projects.filter(
        (p) => p?.status === ProjectStatus.InProgress,
      ).length;
      const completedCount = projects.filter(
        (p) => p?.status === ProjectStatus.Completed,
      ).length;

      let totalScore = 0;
      let totalApplicableTasks = 0;
      projects.forEach((p) => {
        try {
          if (!p || !Array.isArray(p.checklist)) return;
          const applicableItems = p.checklist.filter(
            (c) => c?.status !== ComplianceStatus.NotApplicable,
          );
          totalApplicableTasks += applicableItems.length;
          applicableItems.forEach((item) => {
            if (!item) return;
            if (item.status === ComplianceStatus.Compliant) totalScore += 1;
            if (item.status === ComplianceStatus.PartiallyCompliant)
              totalScore += 0.5;
          });
        } catch (error) {
          console.warn(
            "AdminDashboard: Error processing project checklist",
            error,
          );
        }
      });
      const overallCompliance =
        totalApplicableTasks > 0
          ? ((totalScore / totalApplicableTasks) * 100).toFixed(1)
          : "0.0";

      const openCapaReports = projects
        .flatMap((p) => p?.capaReports || [])
        .filter((c) => c?.status === "Open");

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const now = new Date();

      const upcomingProjectDeadlines = projects.filter((p) => {
        try {
          return (
            p?.endDate &&
            new Date(p.endDate) <= thirtyDaysFromNow &&
            new Date(p.endDate) > now
          );
        } catch (error) {
          console.warn("AdminDashboard: Error parsing project date", error);
          return false;
        }
      });

      const upcomingDocReviews = documents.filter((d) => {
        try {
          return (
            d?.reviewDate &&
            new Date(d.reviewDate) <= thirtyDaysFromNow &&
            new Date(d.reviewDate) > now
          );
        } catch (error) {
          console.warn("AdminDashboard: Error parsing document date", error);
          return false;
        }
      });

      const upcomingDeadlinesCount =
        (upcomingProjectDeadlines?.length || 0) +
        (upcomingDocReviews?.length || 0);

      const complianceChartData = projects
        .filter((p) => p && p.name)
        .map((project) => ({
          name:
            project.name.length > 15
              ? project.name.substring(0, 15) + "..."
              : project.name,
          compliance: Math.min(
            100,
            Math.max(0, parseFloat(project.progress?.toFixed(1) || "0")),
          ),
          id: project.id,
        }));

      const statusCounts = projects.reduce(
        (acc, p) => {
          if (!p?.status) return acc;
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<ProjectStatus, number>,
      );

      const pieChartData = Object.entries(statusCounts).map(
        ([name, value]) => ({
          name: t(statusToTranslationKey(name) as any) || name,
          value,
        }),
      );

      // NEW METRICS: Audit Compliance, Risk Exposure, Document Aging
      let auditMetrics = {
        complianceRate: 0,
        completedAudits: 0,
        scheduledAudits: 0,
      };
      try {
        if (auditPlans && audits) {
          const now = new Date();
          const completedAudits =
            audits?.filter((a) => a && a.dateConducted)?.length || 0;
          const scheduledAudits =
            auditPlans?.filter((ap) => {
              try {
                // Assuming scheduled date is needed - using createdAt as reference
                return ap && ap.id;
              } catch (e) {
                return false;
              }
            })?.length || 0;

          auditMetrics = {
            complianceRate:
              scheduledAudits > 0
                ? Math.round((completedAudits / scheduledAudits) * 100)
                : 0,
            completedAudits,
            scheduledAudits,
          };
        }
      } catch (error) {
        console.warn("AdminDashboard: Error calculating audit metrics", error);
      }

      // Risk Exposure Calculation
      let riskMetrics = {
        totalRisks: 0,
        highRisks: 0,
        mitigatedRisks: 0,
        riskExposure: 0,
      };
      try {
        if (risks && Array.isArray(risks)) {
          const totalRisks = risks.length;
          const highRisks = risks.filter((r) => r && r.impact >= 4).length;
          const mitigatedRisks = risks.filter(
            (r) => r && (r.status === "Mitigated" || r.status === "Closed"),
          ).length;
          const riskExposure =
            totalRisks > 0
              ? Math.round(((totalRisks - mitigatedRisks) / totalRisks) * 100)
              : 0;

          riskMetrics = { totalRisks, highRisks, mitigatedRisks, riskExposure };
        }
      } catch (error) {
        console.warn("AdminDashboard: Error calculating risk metrics", error);
      }

      // Document Review Aging
      let docMetrics = {
        totalDocuments: 0,
        reviewOverdue: 0,
        controlledDocs: 0,
      };
      try {
        if (documents && Array.isArray(documents)) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const totalDocuments = documents.length;
          const reviewOverdue = documents.filter((d) => {
            try {
              return (
                d && d.reviewDate && new Date(d.reviewDate) < thirtyDaysAgo
              );
            } catch (e) {
              return false;
            }
          }).length;
          const controlledDocs = documents.filter(
            (d) => d && d.isControlled,
          ).length;

          docMetrics = { totalDocuments, reviewOverdue, controlledDocs };
        }
      } catch (error) {
        console.warn(
          "AdminDashboard: Error calculating document metrics",
          error,
        );
      }

      return {
        totalProjects,
        inProgressCount,
        completedCount,
        overallCompliance: `${overallCompliance}%`,
        openCapaCount: openCapaReports.length,
        upcomingDeadlinesCount,
        complianceChartData,
        pieChartData,
        recentOpenCapa: openCapaReports
          .sort((a, b) => {
            const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5),
        // New metrics
        auditComplianceRate: `${auditMetrics.complianceRate}%`,
        riskExposure: riskMetrics.riskExposure,
        documentsReviewOverdue: docMetrics.reviewOverdue,
        mitigatedRisks: riskMetrics.mitigatedRisks,
      };
    } catch (error) {
      console.error("AdminDashboard calculation error:", error);
      return getDefaultDashboardData();
    }
  }, [projects, documents, risks, auditPlans, audits, t]);
  const ct = getChartTheme(theme);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const projectId = data.activePayload[0].payload.id;
      setNavigation({ view: "projectDetail", projectId });
    }
  };

  const handleExportMetrics = () => {
    try {
      const metricsData = {
        "Total Projects": dashboardData.totalProjects,
        "In Progress": dashboardData.inProgressCount,
        Completed: dashboardData.completedCount,
        "Overall Compliance": dashboardData.overallCompliance,
        "Open CAPA Reports": dashboardData.openCapaCount,
        "Audit Compliance Rate": dashboardData.auditComplianceRate,
        "Risk Exposure (%)": `${dashboardData.riskExposure}%`,
        "Documents Review Overdue": dashboardData.documentsReviewOverdue,
        "Risks Mitigated": dashboardData.mitigatedRisks,
      };
      exportDashboardMetricsToCSV(metricsData, "Admin Dashboard");
    } catch (error) {
      console.error("Error exporting metrics:", error);
      toast.error(
        t("exportFailed") || "Failed to export metrics. Please try again.",
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <DashboardHeader
          setNavigation={setNavigation}
          title={t("welcomeBack")}
          greeting={t("dashboardGreeting")}
          onExport={handleExportMetrics}
        />

        {/* Feature Discovery Widget - Added to top for visibility */}
        <div>
          <FeatureDiscoveryWidget setNavigation={setNavigation} />
        </div>

        {/* Loading State for Stats Cards */}
        {isLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCardSkeleton count={6} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCardSkeleton count={4} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton height="400px" />
              <ChartSkeleton height="400px" />
            </div>
            <div>
              <ChartSkeleton height="300px" />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title={t("totalProjects")}
                value={dashboardData.totalProjects}
                icon={FolderIcon}
                color="from-blue-500 to-blue-700 bg-gradient-to-br"
                onClick={() => setNavigation({ view: "projects" })}
              />
              <StatCard
                title={t("inProgress")}
                value={dashboardData.inProgressCount}
                icon={PlayCircleIcon}
                color="from-orange-400 to-orange-600 bg-gradient-to-br"
                onClick={() =>
                  setNavigation({ view: "projects", filter: "inProgress" })
                }
              />
              <StatCard
                title={t("completed")}
                value={dashboardData.completedCount}
                icon={CheckCircleIcon}
                color="from-emerald-500 to-emerald-700 bg-gradient-to-br"
                onClick={() =>
                  setNavigation({ view: "projects", filter: "completed" })
                }
              />
              <StatCard
                title={t("overallCompliance")}
                value={dashboardData.overallCompliance}
                icon={CheckCircleIcon}
                color="from-sky-500 to-sky-700 bg-gradient-to-br"
                isLiveLinkable
              />
              <StatCard
                title={t("openCapaReports")}
                value={dashboardData.openCapaCount}
                icon={ExclamationTriangleIcon}
                color="from-red-500 to-red-700 bg-gradient-to-br"
                isLiveLinkable
                onClick={() =>
                  setNavigation({ view: "projects", filter: "openCapa" })
                }
              />
              <StatCard
                title={t("upcomingDeadlines")}
                value={dashboardData.upcomingDeadlinesCount}
                icon={CalendarDaysIcon}
                color="from-amber-400 to-amber-600 bg-gradient-to-br"
                onClick={() => setNavigation({ view: "calendar" })}
              />
            </div>

            {/* New Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={t("auditScheduleCompliance")}
                value={dashboardData.auditComplianceRate}
                icon={CheckCircleIcon}
                color="from-rose-500 to-pink-600 bg-gradient-to-br"
                onClick={() => setNavigation({ view: "auditHub" })}
              />
              <StatCard
                title={t("riskExposure")}
                value={`${dashboardData.riskExposure}%`}
                icon={ExclamationTriangleIcon}
                color="from-rose-500 to-rose-700 bg-gradient-to-br"
                onClick={() => setNavigation({ view: "riskHub" })}
              />
              <StatCard
                title={t("documentsReviewOverdue")}
                value={dashboardData.documentsReviewOverdue}
                icon={CalendarDaysIcon}
                color="from-yellow-500 to-yellow-700 bg-gradient-to-br"
                onClick={() =>
                  setNavigation({ view: "documentControl", filter: "overdue" })
                }
              />
              <StatCard
                title={t("mitigatedRisks")}
                value={dashboardData.mitigatedRisks}
                icon={CheckCircleIcon}
                color="from-teal-500 to-teal-700 bg-gradient-to-br"
                onClick={() =>
                  setNavigation({ view: "riskHub", filter: "mitigated" })
                }
              />
            </div>

            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    Quality Quick Actions
                  </h3>
                  <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                    Jump directly to high-value quality workflows used for
                    readiness, audits, and evidence control.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setNavigation({ view: "qualityInsights" })}
                    className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border hover:bg-gray-50 dark:hover:bg-gray-700/50 text-brand-text-primary dark:text-dark-brand-text-primary"
                  >
                    Open Quality Insights
                  </button>
                  <button
                    onClick={() => setNavigation({ view: "auditHub" })}
                    className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border hover:bg-gray-50 dark:hover:bg-gray-700/50 text-brand-text-primary dark:text-dark-brand-text-primary"
                  >
                    Open Audit Hub
                  </button>
                  <button
                    onClick={() => setNavigation({ view: "standards" })}
                    className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border hover:bg-gray-50 dark:hover:bg-gray-700/50 text-brand-text-primary dark:text-dark-brand-text-primary"
                  >
                    Open Standards
                  </button>
                  <button
                    onClick={() => setNavigation({ view: "documentControl" })}
                    className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border hover:bg-gray-50 dark:hover:bg-gray-700/50 text-brand-text-primary dark:text-dark-brand-text-primary"
                  >
                    Open Document Control
                  </button>
                </div>
              </div>
            </div>

            {!cycleGuideDismissed && (
              <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                      First Accreditation Cycle Guide
                    </h3>
                    <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                      Guided in-app flow to complete your first accreditation
                      cycle.
                    </p>
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
                      Progress: {cycleGuideCompleted.length}/
                      {accreditationCycleSteps.length} ({cycleGuideProgress}%)
                    </p>
                  </div>
                  <button
                    onClick={() => setCycleGuideDismissed(true)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Dismiss guide"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {accreditationCycleSteps.map((step) => {
                    const done = cycleGuideCompleted.includes(step.id);
                    return (
                      <div
                        key={step.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded border border-brand-border dark:border-dark-brand-border"
                      >
                        <label className="flex items-center gap-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => {
                              setCycleGuideCompleted((prev) =>
                                prev.includes(step.id)
                                  ? prev.filter((id) => id !== step.id)
                                  : [...prev, step.id],
                              );
                            }}
                          />
                          {step.title}
                        </label>
                        <button
                          onClick={step.action}
                          className="px-3 py-1 text-xs rounded-lg border border-brand-border dark:border-dark-brand-border hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          Open
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                Governance Adoption Snapshot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-brand-border dark:border-dark-brand-border p-4">
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    First Cycle Guide Completion
                  </p>
                  <p className="text-2xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {cycleGuideProgress}%
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border dark:border-dark-brand-border p-4">
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Assessor Pack Exports (30d)
                  </p>
                  <p className="text-2xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {assessorExportMetrics.exportsLast30Days}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border dark:border-dark-brand-border p-4">
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Reviewer Sign-off Rate
                  </p>
                  <p className="text-2xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {assessorExportMetrics.reviewerSignOffRatePercent}%
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border dark:border-dark-brand-border p-4">
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Guide vs Readiness Correlation
                  </p>
                  <p className="text-2xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {guideReadinessCorrelation.coefficient}
                  </p>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                    {guideReadinessCorrelation.label} (
                    {monthlyOutcomeSnapshots.length} month snapshots)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                  {t("projectComplianceRate")}
                </h3>
                {dashboardData.complianceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={dashboardData.complianceChartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                      onClick={handleBarClick}
                    >
                      <defs>
                        <BarGradientDef id="barGradient" />
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={ct.gridStroke}
                      />
                      <XAxis
                        dataKey="name"
                        tick={ct.tickStyle}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis unit="%" tick={ct.tickStyle} />
                      <Tooltip
                        content={<ChartTooltip formatValue={(v) => `${v}%`} />}
                        cursor={{ fill: ct.cursorFill }}
                      />
                      <Bar
                        dataKey="compliance"
                        fill="url(#barGradient)"
                        name={t("complianceRate")}
                        barSize={30}
                        radius={[4, 4, 0, 0]}
                        style={{ cursor: "pointer" }}
                        animationDuration={CHART_ANIMATION.duration}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyStatePlaceholder
                    title="No Projects"
                    message="Create your first project to see compliance metrics"
                    actionLabel="Create Project"
                    onAction={() => setNavigation({ view: "createProject" })}
                    secondary
                    compact
                  />
                )}
              </div>

              <div className="lg:col-span-2 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                  {t("projectStatusDistribution")}
                </h3>
                {dashboardData.pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {dashboardData.pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={ct.legendStyle} />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={ct.centerTextPrimary}
                        fontSize="24"
                        fontWeight="bold"
                      >
                        {dashboardData.totalProjects}
                      </text>
                      <text
                        x="50%"
                        y="50%"
                        dy={20}
                        textAnchor="middle"
                        fill={ct.centerTextSecondary}
                        fontSize="12"
                      >
                        {t("projects")}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyStatePlaceholder
                    title="No Projects"
                    message="All projects appear here once created"
                    secondary
                    compact
                  />
                )}
              </div>
            </div>

            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("openCapaReports")}
              </h3>
              {dashboardData.recentOpenCapa.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentOpenCapa.map((capa: CAPAReport) => {
                    const project = projects.find(
                      (p) => p.id === capa.sourceProjectId,
                    );
                    const assignee = users.find(
                      (u) => u.id === capa.assignedTo,
                    );
                    return (
                      <CapaListItem
                        key={capa.id}
                        capa={capa}
                        project={project}
                        assignee={assignee}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyStatePlaceholder
                  title="All Clear!"
                  message="No open CAPA reports. Great work maintaining compliance!"
                  secondary
                  compact
                />
              )}
            </div>

            {/* Pending Approvals Widget */}
            <PendingApprovalsWidget setNavigation={setNavigation} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
