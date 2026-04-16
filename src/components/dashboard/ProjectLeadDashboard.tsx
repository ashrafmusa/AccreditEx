import ChartSkeleton from "@/components/common/ChartSkeleton";
import EmptyStatePlaceholder from "@/components/common/EmptyStatePlaceholder";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import StatCard from "@/components/common/StatCard";
import StatCardSkeleton from "@/components/common/StatCardSkeleton";
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  UsersIcon,
} from "@/components/icons";
import ProjectCard from "@/components/projects/ProjectCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  ComplianceStatus,
  NavigationState,
  ProjectStatus,
  User,
} from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./DashboardHeader";

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

const getDefaultLeadStats = () => ({
  totalProjects: 0,
  inProgressCount: 0,
  openCapaCount: 0,
  overallCompliance: "0.0%",
  // New metrics
  teamMembersCount: 0,
  overdueTasks: 0,
  teamComplianceAverage: "0.0%",
  assignmentCoverage: "0.0%",
});

const ProjectLeadDashboard: React.FC<DashboardPageProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { currentUser, users } = useUserStore();
  const { projects, deleteProject } = useProjectStore();
  const { accreditationPrograms } = useAppStore();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const myProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter((p) => p.projectLead?.id === currentUser.id);
  }, [projects, currentUser]);

  const leadStats = useMemo(() => {
    try {
      const totalProjects = myProjects.length;
      const inProgressCount = myProjects.filter(
        (p) => p?.status === ProjectStatus.InProgress,
      ).length;
      const openCapaReports = myProjects
        .flatMap((p) => p?.capaReports || [])
        .filter((c) => c?.status === "Open");
      const openCapaCount = openCapaReports.length;

      let totalScore = 0;
      let totalApplicableTasks = 0;
      let allTeamMemberIds = new Set<string>();
      let overdueTaskCount = 0;

      myProjects.forEach((p) => {
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

            // Track overdue tasks
            if (item.dueDate) {
              try {
                if (
                  new Date(item.dueDate) < new Date() &&
                  item.status !== ComplianceStatus.Compliant
                ) {
                  overdueTaskCount += 1;
                }
              } catch (e) {
                // Skip invalid dates
              }
            }

            // Collect team members
            if (item.assignedTo) {
              allTeamMemberIds.add(item.assignedTo);
            }
          });

          // Add project lead to team
          if (p.projectLead?.id) {
            allTeamMemberIds.add(p.projectLead.id);
          }
        } catch (error) {
          console.warn(
            "ProjectLeadDashboard: Error processing project checklist",
            error,
          );
        }
      });

      const overallCompliance =
        totalApplicableTasks > 0
          ? ((totalScore / totalApplicableTasks) * 100).toFixed(1)
          : "0.0";
      const teamMembersCount = allTeamMemberIds.size;

      // Calculate assignment coverage: (tasks assigned / total tasks) * 100
      const totalTasks = myProjects.flatMap((p) => p?.checklist || []).length;
      const assignedTasks = myProjects
        .flatMap((p) => p?.checklist || [])
        .filter((t) => t?.assignedTo).length;
      const assignmentCoverage =
        totalTasks > 0
          ? ((assignedTasks / totalTasks) * 100).toFixed(1)
          : "0.0";

      return {
        totalProjects,
        inProgressCount,
        openCapaCount,
        overallCompliance: `${overallCompliance}%`,
        // New metrics
        teamMembersCount,
        overdueTasks: overdueTaskCount,
        teamComplianceAverage: `${overallCompliance}%`,
        assignmentCoverage: `${assignmentCoverage}%`,
      };
    } catch (error) {
      console.error("ProjectLeadDashboard stats calculation error:", error);
      return getDefaultLeadStats();
    }
  }, [myProjects]);

  const handleDelete = async (projectId: string) => {
    if (
      await useConfirmStore
        .getState()
        .confirm(
          t("areYouSureDeleteProject"),
          t("deleteProject") || "Delete Project",
          t("delete") || "Delete",
        )
    ) {
      deleteProject(projectId);
    }
  };

  const programMap = useMemo(
    () => new Map(accreditationPrograms.map((p) => [p.id, p.name])),
    [accreditationPrograms],
  );

  if (!currentUser) return null;

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <DashboardHeader
          setNavigation={setNavigation}
          title={t("projectLeadDashboardTitle")}
          greeting={t("dashboardGreeting")}
          roleShortcuts={[
            {
              label: t("createNewProject") || "Create New Project",
              navigation: { view: "createProject" },
            },
            {
              label: t("documentControl") || "Document Control",
              navigation: { view: "documentControl" },
            },
            {
              label: t("openCapaReports") || "Open CAPA Reports",
              navigation: { view: "projects", filter: "openCapa" },
            },
          ]}
        />

        {/* Quick Actions - Click-depth reduction for top ProjectLead journeys */}
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-xl border border-brand-border dark:border-dark-brand-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("quickActions") || "Quick Actions"}
            </h2>
            <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("projectLead")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setNavigation({ view: "createProject" })}
              className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border text-left hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors"
            >
              {t("createNewProject")}
            </button>
            <button
              onClick={() => setNavigation({ view: "documentControl" })}
              className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border text-left hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors"
            >
              {t("documentControl")}
            </button>
            <button
              onClick={() =>
                setNavigation({ view: "projects", filter: "inProgress" })
              }
              className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border text-left hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors"
            >
              {t("inProgress")}
            </button>
            <button
              onClick={() =>
                setNavigation({ view: "projects", filter: "openCapa" })
              }
              className="px-3 py-2 text-sm rounded-lg border border-brand-border dark:border-dark-brand-border text-left hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors"
            >
              {t("openCapaReports")}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCardSkeleton count={7} />
            </div>
            <div className="mt-8">
              <div className="h-6 w-32 bg-brand-border dark:bg-dark-brand-border rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <ChartSkeleton height="250px" lines={3} />
                <ChartSkeleton height="250px" lines={3} />
                <ChartSkeleton height="250px" lines={3} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={t("myProjects")}
                value={leadStats.totalProjects}
                icon={FolderIcon}
                color="from-blue-500 to-brand-primary/80 bg-linear-to-br"
                onClick={() => setNavigation({ view: "projects" })}
              />
              <StatCard
                title={t("inProgress")}
                value={leadStats.inProgressCount}
                icon={CheckCircleIcon}
                color="from-orange-400 to-orange-600 bg-linear-to-br"
                onClick={() =>
                  setNavigation({ view: "projects", filter: "inProgress" })
                }
              />
              <StatCard
                title={t("teamCompliance")}
                value={leadStats.overallCompliance}
                icon={CheckCircleIcon}
                color="from-sky-500 to-sky-700 bg-linear-to-br"
              />
              <StatCard
                title={t("openCapaReports")}
                value={leadStats.openCapaCount}
                icon={ExclamationTriangleIcon}
                color="from-red-500 to-red-700 bg-linear-to-br"
                onClick={() =>
                  setNavigation({ view: "projects", filter: "openCapa" })
                }
              />
              <StatCard
                title={t("teamMembers")}
                value={leadStats.teamMembersCount}
                icon={UsersIcon}
                color="from-cyan-500 to-cyan-700 bg-linear-to-br"
                onClick={() => setNavigation({ view: "departments" })}
              />
              <StatCard
                title={t("overdueTasks")}
                value={leadStats.overdueTasks}
                icon={ClockIcon}
                color="from-amber-500 to-amber-700 bg-linear-to-br"
                onClick={() =>
                  setNavigation({ view: "myTasks", filter: "overdue" })
                }
              />
              <StatCard
                title={t("assignmentCoverage")}
                value={leadStats.assignmentCoverage}
                icon={CheckBadgeIcon}
                color="from-green-500 to-green-700 bg-linear-to-br"
                onClick={() => setNavigation({ view: "myTasks" })}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">{t("myProjects")}</h2>
              {myProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {myProjects.map((p) => {
                    const assignedUserIds = new Set(
                      p.checklist
                        .map((item) => item.assignedTo)
                        .filter(Boolean),
                    );
                    if (p.projectLead?.id) {
                      assignedUserIds.add(p.projectLead.id);
                    }
                    const teamMembers = Array.from(assignedUserIds)
                      .map((id) => users.find((u) => u.id === id))
                      .filter((u): u is User => !!u);
                    return (
                      <ProjectCard
                        key={p.id}
                        project={{
                          ...p,
                          teamMembers: teamMembers as any,
                          programName: programMap.get(p.programId) || "?",
                        }}
                        currentUser={currentUser}
                        onSelect={() =>
                          setNavigation({
                            view: "projectDetail",
                            projectId: p.id,
                          })
                        }
                        onEdit={() =>
                          setNavigation({
                            view: "editProject",
                            projectId: p.id,
                          })
                        }
                        onDelete={() => handleDelete(p.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyStatePlaceholder
                  icon={FolderIcon}
                  title={t("noProjectsYet")}
                  message={t("noProjectsYetMessage")}
                  actionLabel={t("browseAllProjects")}
                  onAction={() => setNavigation({ view: "projects" })}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProjectLeadDashboard;
