import React, { useMemo } from "react";
import { User, Project, ProjectStatus } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { EmptyState } from "@/components/ui";
import { FolderIcon } from "../icons";

interface Props {
  user: User;
  projects: Project[];
}

const UserProjectInvolvement: React.FC<Props> = ({ user, projects }) => {
  const { t } = useTranslation();

  const { userProjects, tasksCount, leadingCount, completionStats } =
    useMemo(() => {
      const projectSet = new Map<string, Project>();

      projects.forEach((p) => {
        if (
          p.projectLead?.id === user.id ||
          p.checklist.some((item) => item.assignedTo === user.id)
        ) {
          projectSet.set(p.id, p);
        }
      });

      const userProjectsArray = Array.from(projectSet.values());

      let tasksCount = 0;
      let completedTasks = 0;
      userProjectsArray.forEach((p) => {
        const assigned = p.checklist.filter(
          (item) => item.assignedTo === user.id
        );
        tasksCount += assigned.length;
        completedTasks += assigned.filter(
          (item) => item.status === "Compliant"
        ).length;
      });

      const leadingCount = userProjectsArray.filter(
        (p) => p.projectLead?.id === user.id
      ).length;
      const completionRate =
        tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0;

      return {
        userProjects: userProjectsArray,
        tasksCount,
        leadingCount,
        completionStats: {
          completed: completedTasks,
          total: tasksCount,
          rate: completionRate,
        },
      };
    }, [projects, user.id]);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
          {t("projectInvolvement")}
        </h2>

        {/* Performance Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userProjects.length}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t("projects")}
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-pink-900/20 p-3 rounded-lg border border-rose-200 dark:border-pink-700">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {leadingCount}
            </p>
            <p className="text-xs text-pink-600 dark:text-rose-300">
              {t("leading")}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completionStats.rate}%
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              {t("completed")}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {tasksCount > 0 && (
          <div className="space-y-1">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                style={{ width: `${completionStats.rate}%` }}
              />
            </div>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {completionStats.completed} / {completionStats.total}{" "}
              {t("tasksCompleted")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {userProjects.map((p) => {
          const assigned = p.checklist.filter(
            (item) => item.assignedTo === user.id
          );
          const completed = assigned.filter(
            (item) => item.status === "Compliant"
          ).length;
          const assignmentRate =
            assigned.length > 0
              ? Math.round((completed / assigned.length) * 100)
              : 0;
          const isLead = p.projectLead?.id === user.id;

          return (
            <div
              key={p.id}
              className={`p-3 rounded-lg border ${
                p.status === ProjectStatus.Completed
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        p.status === ProjectStatus.Completed
                          ? "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                          : "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {p.status}
                    </span>
                    {isLead && (
                      <span className="text-xs px-2 py-1 rounded bg-rose-200 dark:bg-pink-900/50 text-pink-700 dark:text-rose-300">
                        {t("lead")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {assigned.length > 0 && (
                <>
                  <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${assignmentRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {completed}/{assigned.length} {t("tasks")} • {t("progress")}
                    : {p.progress}%
                  </p>
                </>
              )}
            </div>
          );
        })}
        {userProjects.length === 0 && (
          <EmptyState
            icon={FolderIcon}
            title={t("noProjectsAssigned")}
            message=""
          />
        )}
      </div>
    </div>
  );
};

export default UserProjectInvolvement;
