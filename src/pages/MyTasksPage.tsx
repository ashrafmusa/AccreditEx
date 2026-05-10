import EmptyState from "@/components/common/EmptyState";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AccreditationProgram,
  ChecklistItem,
  ComplianceStatus,
  Project,
  User,
} from "@/types";
import React, { useMemo } from "react";

interface MyTasksPageProps {
  projects: Project[];
  currentUser: User;
  programs: AccreditationProgram[];
}

type TaskWithMeta = ChecklistItem & {
  projectName: string;
  programId: string;
  isOverdue: boolean;
  isDueSoon: boolean;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  [ComplianceStatus.NonCompliant]: {
    label: "Non-Compliant",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  [ComplianceStatus.PartiallyCompliant]: {
    label: "In Progress",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  [ComplianceStatus.NotApplicable]: {
    label: "N/A",
    className:
      "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  },
};

const MyTasksPage: React.FC<MyTasksPageProps> = ({
  projects,
  currentUser,
  programs,
}) => {
  const { t } = useTranslation();
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // All tasks assigned to the current user (including completed for stats)
  const allMyTasks = useMemo<TaskWithMeta[]>(() => {
    return projects.flatMap((project) =>
      (project.checklist ?? [])
        .filter((item) => item.assignedTo === currentUser.id)
        .map((item) => {
          const dueDate = item.dueDate ? new Date(item.dueDate) : null;
          return {
            ...item,
            projectName: project.name,
            programId: project.programId,
            isOverdue:
              !!dueDate &&
              dueDate < now &&
              item.status !== ComplianceStatus.Compliant,
            isDueSoon:
              !!dueDate &&
              dueDate >= now &&
              dueDate <= nextWeek &&
              item.status !== ComplianceStatus.Compliant,
          };
        }),
    );
  }, [projects, currentUser]);

  // Open tasks only (not compliant, not N/A)
  const openTasks = useMemo(
    () =>
      allMyTasks.filter(
        (t) =>
          t.status !== ComplianceStatus.Compliant &&
          t.status !== ComplianceStatus.NotApplicable,
      ),
    [allMyTasks],
  );

  const stats = useMemo(() => {
    const total = allMyTasks.filter(
      (t) => t.status !== ComplianceStatus.NotApplicable,
    ).length;
    const completed = allMyTasks.filter(
      (t) => t.status === ComplianceStatus.Compliant,
    ).length;
    const overdue = allMyTasks.filter((t) => t.isOverdue).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const programCount = new Set(allMyTasks.map((t) => t.programId)).size;
    return { total, completed, overdue, completionPct, programCount };
  }, [allMyTasks]);

  const groupedOpen = useMemo(() => {
    return openTasks.reduce(
      (acc, task) => {
        const program = programs.find((p) => p.id === task.programId);
        const programName = program?.name || t("uncategorized") || "Other";
        if (!acc[programName]) acc[programName] = {};
        if (!acc[programName][task.projectName])
          acc[programName][task.projectName] = [];
        acc[programName][task.projectName].push(task);
        return acc;
      },
      {} as Record<string, Record<string, TaskWithMeta[]>>,
    );
  }, [openTasks, programs, t]);

  const allDone = stats.total > 0 && stats.completed === stats.total;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <ClipboardDocumentCheckIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("myTasks")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("myTasksDescription") ||
              "Tasks assigned to you across all accreditation projects"}
          </p>
        </div>
      </div>

      {/* Progress summary */}
      {stats.total > 0 && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl border border-brand-border dark:border-dark-brand-border p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {stats.total}
              </p>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                {t("totalTasks") || "Total Tasks"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed}
              </p>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                {t("tasksCompleted") || "Completed"}
              </p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"}`}
              >
                {stats.overdue}
              </p>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                {t("overdue") || "Overdue"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-primary">
                {stats.completionPct}%
              </p>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                {t("completionRate") || "Complete"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${
                stats.completionPct >= 80
                  ? "bg-green-500"
                  : stats.completionPct >= 50
                    ? "bg-brand-primary"
                    : "bg-amber-400"
              }`}
              style={{ width: `${stats.completionPct}%` }}
            />
          </div>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {stats.programCount > 0
              ? (
                  t("contributingToPrograms") ||
                  `Contributing to ${stats.programCount} accreditation program(s)`
                ).replace("{count}", String(stats.programCount))
              : ""}
          </p>
        </div>
      )}

      {/* All done state */}
      {allDone && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 flex items-center gap-4">
          <CheckCircleIcon className="h-10 w-10 text-green-500 shrink-0" />
          <div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              {t("allTasksComplete") || "All tasks complete!"}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
              {t("allTasksCompleteMessage") ||
                "Great work — you've completed all your assigned tasks."}
            </p>
          </div>
        </div>
      )}

      {/* Task list */}
      {Object.keys(groupedOpen).length > 0 ? (
        Object.entries(groupedOpen).map(([programName, projectTasks]) => (
          <div key={programName}>
            <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-brand-primary" />
              {programName}
            </h2>
            <div className="space-y-3">
              {Object.entries(projectTasks).map(([projectName, tasks]) => (
                <div
                  key={projectName}
                  className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg border border-brand-border dark:border-dark-brand-border shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-brand-border dark:border-dark-brand-border">
                    <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {projectName}
                    </h3>
                  </div>
                  <div className="divide-y divide-brand-border dark:divide-dark-brand-border">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`px-4 py-3 flex items-start justify-between gap-3 ${
                          task.isOverdue
                            ? "bg-red-50/50 dark:bg-red-900/10"
                            : task.isDueSoon
                              ? "bg-amber-50/50 dark:bg-amber-900/10"
                              : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                            {task.item}
                          </p>
                          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                            {task.standardId}
                          </p>
                          {task.dueDate && (
                            <p
                              className={`text-xs mt-1 flex items-center gap-1 ${
                                task.isOverdue
                                  ? "text-red-600 dark:text-red-400 font-semibold"
                                  : task.isDueSoon
                                    ? "text-amber-600 dark:text-amber-400 font-medium"
                                    : "text-brand-text-secondary dark:text-dark-brand-text-secondary"
                              }`}
                            >
                              {task.isOverdue ? (
                                <ExclamationTriangleIcon className="h-3 w-3" />
                              ) : (
                                <CalendarDaysIcon className="h-3 w-3" />
                              )}
                              {task.isOverdue
                                ? t("overdue") || "Overdue"
                                : task.isDueSoon
                                  ? t("dueSoon") || "Due soon"
                                  : t("dueDate") || "Due"}
                              {" · "}
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                            statusConfig[task.status]?.className ||
                            "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {statusConfig[task.status]?.label || task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : !allDone ? (
        <EmptyState
          icon={ClipboardDocumentCheckIcon}
          title={t("noTasksAssigned") || "No open tasks"}
          message=""
        />
      ) : null}
    </div>
  );
};

export default MyTasksPage;
