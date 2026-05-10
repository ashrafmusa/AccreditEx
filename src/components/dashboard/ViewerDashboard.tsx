import EmptyStatePlaceholder from "@/components/common/EmptyStatePlaceholder";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import StatCard from "@/components/common/StatCard";
import StatCardSkeleton from "@/components/common/StatCardSkeleton";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { ComplianceStatus, NavigationState, ProjectStatus } from "@/types";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardHeader from "./DashboardHeader";

interface ViewerDashboardProps {
  setNavigation: (state: NavigationState) => void;
}

const ViewerDashboard: React.FC<ViewerDashboardProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const { projects } = useProjectStore();
  const { accreditationPrograms } = useAppStore();

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === ProjectStatus.InProgress,
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === ProjectStatus.Completed,
    ).length;

    let totalApplicable = 0;
    let totalScore = 0;
    let totalOverdue = 0;

    projects.forEach((p) => {
      if (!Array.isArray(p.checklist)) return;
      const applicable = p.checklist.filter(
        (c) => c.status !== ComplianceStatus.NotApplicable,
      );
      totalApplicable += applicable.length;
      applicable.forEach((item) => {
        if (item.status === ComplianceStatus.Compliant) totalScore += 1;
        else if (item.status === ComplianceStatus.PartiallyCompliant)
          totalScore += 0.5;
        if (
          item.dueDate &&
          new Date(item.dueDate) < new Date() &&
          item.status !== ComplianceStatus.Compliant
        ) {
          totalOverdue += 1;
        }
      });
    });

    const overallCompliance =
      totalApplicable > 0
        ? Math.round((totalScore / totalApplicable) * 100)
        : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overallCompliance,
      totalOverdue,
      totalPrograms: accreditationPrograms.length,
      openCapaCount: projects.reduce(
        (acc, p) =>
          acc + (p.capaReports?.filter((c) => c.status === "Open").length ?? 0),
        0,
      ),
      openRiskCount: projects.reduce(
        (acc, p) =>
          acc +
          (p.risks?.filter(
            (r) => r.status !== "Closed" && r.status !== "Mitigated",
          ).length ?? 0),
        0,
      ),
    };
  }, [projects, accreditationPrograms]);

  const complianceTrendData = useMemo(() => {
    return [...projects]
      .map((p) => {
        const applicable =
          p.checklist?.filter(
            (c) => c.status !== ComplianceStatus.NotApplicable,
          ) ?? [];
        const score = applicable.reduce((acc, c) => {
          if (c.status === ComplianceStatus.Compliant) return acc + 1;
          if (c.status === ComplianceStatus.PartiallyCompliant)
            return acc + 0.5;
          return acc;
        }, 0);
        const pct =
          applicable.length > 0
            ? Math.round((score / applicable.length) * 100)
            : 0;
        return {
          name: p.name.length > 12 ? p.name.substring(0, 12) + "…" : p.name,
          fullName: p.name,
          compliance: pct,
        };
      })
      .sort((a, b) => b.compliance - a.compliance)
      .slice(0, 8);
  }, [projects]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [projects]);

  const getComplianceColor = (pct: number) => {
    if (pct >= 80) return "text-green-600 dark:text-green-400";
    if (pct >= 60) return "text-amber-500 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  const getProjectStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      InProgress:
        "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
      Completed:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      NotStarted:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      OnHold:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    };
    return (
      map[status] ||
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <DashboardHeader
          setNavigation={setNavigation}
          title={`${t("welcomeBack")}!`}
          greeting={t("viewerDashboardTitle") || "Organisation Overview"}
        />

        {projects.length === 0 && accreditationPrograms.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardSkeleton count={6} />
          </div>
        ) : (
          <>
            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard
                title={t("overallCompliance") || "Overall Compliance"}
                value={`${stats.overallCompliance}%`}
                icon={ShieldCheckIcon}
                color="from-green-500 to-green-700 bg-linear-to-br"
              />
              <StatCard
                title={t("activeProjects") || "Active Projects"}
                value={stats.activeProjects}
                icon={FolderIcon}
                color="from-sky-500 to-sky-700 bg-linear-to-br"
                onClick={() => setNavigation({ view: "projects" })}
              />
              <StatCard
                title={t("completedProjects") || "Completed"}
                value={stats.completedProjects}
                icon={CheckCircleIcon}
                color="from-emerald-500 to-emerald-700 bg-linear-to-br"
              />
              <StatCard
                title={t("overdueItems") || "Overdue Items"}
                value={stats.totalOverdue}
                icon={ExclamationTriangleIcon}
                color="from-red-500 to-red-700 bg-linear-to-br"
              />
              <StatCard
                title={t("openCapaReports") || "Open CAPAs"}
                value={stats.openCapaCount}
                icon={ExclamationTriangleIcon}
                color="from-orange-500 to-orange-700 bg-linear-to-br"
                onClick={() => setNavigation({ view: "projects" })}
              />
              <StatCard
                title={t("openRisks") || "Open Risks"}
                value={stats.openRiskCount}
                icon={ShieldCheckIcon}
                color="from-rose-500 to-rose-700 bg-linear-to-br"
                onClick={() => setNavigation({ view: "riskHub" })}
              />
            </div>

            {/* Compliance trend chart */}
            {complianceTrendData.length > 0 && (
              <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl border border-brand-border dark:border-dark-brand-border p-6 shadow-sm">
                <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                  {t("complianceByProject") || "Compliance by Project"}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={complianceTrendData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value}%`,
                        t("compliance") || "Compliance",
                      ]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullName ?? label
                      }
                    />
                    <Bar
                      dataKey="compliance"
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Compliance progress bar */}
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl border border-brand-border dark:border-dark-brand-border p-6 shadow-sm">
              <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("organisationComplianceHealth") ||
                  "Organisation Compliance Health"}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("overallCompliance") || "Overall Compliance"}
                    </span>
                    <span
                      className={`font-bold ${getComplianceColor(stats.overallCompliance)}`}
                    >
                      {stats.overallCompliance}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        stats.overallCompliance >= 80
                          ? "bg-green-500"
                          : stats.overallCompliance >= 60
                            ? "bg-amber-400"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(100, stats.overallCompliance)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {stats.totalPrograms} {t("programs") || "program(s)"}
                  </p>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {stats.totalProjects} {t("projects") || "project(s)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent projects */}
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl border border-brand-border dark:border-dark-brand-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {t("recentProjects") || "Recent Projects"}
                </h3>
                <button
                  className="text-sm text-brand-primary hover:underline"
                  onClick={() => setNavigation({ view: "projects" })}
                >
                  {t("viewAll") || "View all"}
                </button>
              </div>
              {recentProjects.length === 0 ? (
                <EmptyStatePlaceholder
                  icon={FolderIcon}
                  title={t("noProjects") || "No projects yet"}
                  message=""
                  secondary
                  compact
                />
              ) : (
                <div className="divide-y divide-brand-border dark:divide-dark-brand-border">
                  {recentProjects.map((project) => {
                    const applicable =
                      project.checklist?.filter(
                        (c) => c.status !== ComplianceStatus.NotApplicable,
                      ) ?? [];
                    const score = applicable.reduce((acc, c) => {
                      if (c.status === ComplianceStatus.Compliant)
                        return acc + 1;
                      if (c.status === ComplianceStatus.PartiallyCompliant)
                        return acc + 0.5;
                      return acc;
                    }, 0);
                    const pct =
                      applicable.length > 0
                        ? Math.round((score / applicable.length) * 100)
                        : 0;
                    return (
                      <button
                        key={project.id}
                        onClick={() =>
                          setNavigation({
                            view: "projectDetail",
                            projectId: project.id,
                          })
                        }
                        className="w-full py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                            {project.name}
                          </p>
                          {project.updatedAt && (
                            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary flex items-center gap-1 mt-0.5">
                              <CalendarDaysIcon className="h-3 w-3" />
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-semibold ${getComplianceColor(pct)}`}
                          >
                            {pct}%
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${getProjectStatusBadge(project.status)}`}
                          >
                            {t(project.status.toLowerCase()) || project.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ViewerDashboard;
