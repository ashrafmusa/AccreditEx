import React, { useMemo, useState } from "react";
import { NavigationState, Project, ChecklistItem } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { ChartBarSquareIcon } from "@/components/icons";
import KpiCard from "@/components/analytics/KpiCard";
import ComplianceOverTimeChart from "@/components/analytics/ComplianceOverTimeChart";
import DepartmentalPerformanceChart from "@/components/analytics/DepartmentalPerformanceChart";
import ProblematicStandardsChart from "@/components/analytics/ProblematicStandardsChart";
import CapaRootCauseChart from "@/components/analytics/CapaRootCauseChart";
import TaskStatusDistributionChart from "@/components/analytics/TaskStatusDistributionChart";
import TaskDistributionByUserChart from "@/components/analytics/TaskDistributionByUserChart";
import StatCard from "@/components/common/StatCard";

import AnalyticsAIWidget from "@/components/analytics/AnalyticsAIWidget";

interface AnalyticsPageProps {
  setNavigation: (state: NavigationState) => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { users } = useUserStore();
  const { departments, accreditationPrograms } = useAppStore();

  const [programFilter, setProgramFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesProgram =
        programFilter === "all" || p.programId === programFilter;
      const matchesDept =
        departmentFilter === "all" ||
        p.departmentId === departmentFilter ||
        (p.departmentIds || []).includes(departmentFilter);
      return matchesProgram && matchesDept;
    });
  }, [projects, programFilter, departmentFilter]);

  const allChecklistItems = useMemo(() => {
    return filteredProjects.flatMap((p) => p.checklist);
  }, [filteredProjects]);

  const kpis = useMemo(() => {
    const overdueTasks = allChecklistItems.filter(
      (item) => item.dueDate && new Date(item.dueDate) < new Date(),
    ).length;
    const activeProjects = filteredProjects.filter(
      (p) => p.status === "In Progress",
    ).length;
    const totalTasks = allChecklistItems.length;
    const compliantTasks = allChecklistItems.filter(
      (i) => i.status === "Compliant",
    ).length;
    const complianceRate =
      totalTasks > 0 ? Math.round((compliantTasks / totalTasks) * 100) : 0;

    // Calculate real CAPA resolution rate from project data
    const allCapas = filteredProjects.flatMap((p) => p.capaReports || []);
    const totalCapas = allCapas.length;
    const resolvedCapas = allCapas.filter(
      (c) => c.status === "Closed" || c.status === "Resolved",
    ).length;
    const capaResolutionRate =
      totalCapas > 0 ? Math.round((resolvedCapas / totalCapas) * 100) : 0;

    return {
      overdueTasks,
      activeProjects,
      complianceRate,
      capaResolutionRate,
      totalCapas,
      resolvedCapas,
    };
  }, [allChecklistItems, filteredProjects]);

  const aiDataSummary = useMemo(
    () => ({
      kpis,
      projectStatus: filteredProjects.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      topRisks: allChecklistItems
        .filter((i) => i.status === "Non-Compliant")
        .slice(0, 5)
        .map((i) => i.requirement)
        .filter((r): r is string => !!r),
    }),
    [kpis, filteredProjects, allChecklistItems],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <ChartBarSquareIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("analyticsHub")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("analyticsHubDescription")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="border border-brand-border dark:border-dark-brand-border rounded-lg py-2 px-3 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface dark:bg-dark-brand-surface text-sm"
          >
            <option value="all">{t("allPrograms")}</option>
            {accreditationPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-brand-border dark:border-dark-brand-border rounded-lg py-2 px-3 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface dark:bg-dark-brand-surface text-sm"
          >
            <option value="all">
              {t("allDepartments") || "All Departments"}
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name.en || d.name.ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ChartBarSquareIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            {t("noDataAvailable") || "No Data Available"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {t("createProjectForAnalytics") ||
              "Create projects to see analytics and insights here."}
          </p>
        </div>
      ) : (
        <>
          {/* AI Insights Widget */}
          <div className="w-full">
            <AnalyticsAIWidget data={aiDataSummary} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title={t("overallComplianceRate")}
              value={kpis.complianceRate}
              total={allChecklistItems.length}
              completed={
                allChecklistItems.filter((i) => i.status === "Compliant").length
              }
              description={t("tasksCompliant")}
              color="#4f46e5"
            />
            <KpiCard
              title={t("capaResolutionRate")}
              value={kpis.capaResolutionRate}
              total={kpis.totalCapas}
              completed={kpis.resolvedCapas}
              description={t("resolved")}
              color="#f97316"
            />
            <StatCard
              title={t("totalActiveProjects")}
              value={kpis.activeProjects}
            />
            <StatCard
              title={t("totalOverdueTasks")}
              value={kpis.overdueTasks}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceOverTimeChart projects={filteredProjects} />
            <CapaRootCauseChart projects={filteredProjects} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProblematicStandardsChart checklistItems={allChecklistItems} />
            <TaskStatusDistributionChart checklistItems={allChecklistItems} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentalPerformanceChart
              projects={filteredProjects}
              departments={departments}
              users={users}
              setNavigation={setNavigation}
            />
            <TaskDistributionByUserChart
              checklistItems={allChecklistItems}
              users={users}
              setNavigation={setNavigation}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
