import EmptyState from "@/components/common/EmptyState";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  SearchIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AccreditationProgram,
  ChecklistItem,
  ComplianceStatus,
  Project,
  User,
  NavigationState,
} from "@/types";
import React, { useState } from "react";
import { STATUS_COLORS, statusToTranslationKey } from "@/utils/complianceUtils";

interface MyTasksPageProps {
  projects: Project[];
  currentUser: User;
  programs: AccreditationProgram[];
  setNavigation: (state: NavigationState) => void;
}

type TaskWithMeta = ChecklistItem & {
  projectName: string;
  projectId: string;
  programId: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  dueDateValue: Date | null;
};

const MyTasksPage: React.FC<MyTasksPageProps> = ({
  projects,
  currentUser,
  programs,
  setNavigation,
}) => {
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "dueSoon">("all");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 8);

  // All tasks assigned to the current user (including completed for stats)
  const allMyTasks: TaskWithMeta[] = projects
    .filter(
      (project) =>
        !!currentUser.organizationId &&
        project.organizationId === currentUser.organizationId &&
        !project.archived,
    )
    .flatMap((project) =>
      (project.checklist ?? [])
        .filter((item) => item.assignedTo === currentUser.id)
        .map((item) => {
          const dueDate =
            item.dueDate && Number.isFinite(Date.parse(item.dueDate))
              ? new Date(
                  /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
                    ? `${item.dueDate}T00:00:00`
                    : item.dueDate,
                )
              : null;
          const open =
            item.status !== ComplianceStatus.Compliant &&
            item.status !== ComplianceStatus.NotApplicable;
          return {
            ...item,
            projectName: project.name,
            projectId: project.id,
            programId: project.programId,
            dueDateValue: dueDate,
            isOverdue: !!dueDate && dueDate < today && open,
            isDueSoon:
              !!dueDate && dueDate >= today && dueDate < nextWeek && open,
          };
        }),
    );

  // Open tasks only (not compliant, not N/A)
  const openTasks = allMyTasks
    .filter(
      (t) =>
        t.status !== ComplianceStatus.Compliant &&
        t.status !== ComplianceStatus.NotApplicable,
    )
    .sort((a, b) => {
      return (
        (a.dueDateValue?.getTime() ?? Infinity) -
          (b.dueDateValue?.getTime() ?? Infinity) ||
        a.item.localeCompare(b.item)
      );
    });
  const visibleTasks = openTasks.filter((task) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "overdue" ? task.isOverdue : task.isDueSoon);
    const program = programs.find((p) => p.id === task.programId);
    return (
      matchesFilter &&
      [task.item, task.standardId, task.projectName, program?.name || ""]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
    );
  });

  const stats = (() => {
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
  })();

  const groupedOpen = new Map<string, Map<string, TaskWithMeta[]>>();
  visibleTasks.forEach((task) => {
    if (!groupedOpen.has(task.programId))
      groupedOpen.set(task.programId, new Map());
    const programGroup = groupedOpen.get(task.programId)!;
    if (!programGroup.has(task.projectId)) programGroup.set(task.projectId, []);
    programGroup.get(task.projectId)!.push(task);
  });

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
            {t("myTasksDescription")}
          </p>
        </div>
      </div>
      <section
        aria-label={t("qualityTaskFilters")}
        className="rounded-xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface p-4"
      >
        <label
          htmlFor="assigned-task-search"
          className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary"
        >
          {t("qualityTaskSearch")}
        </label>
        <div className="relative mt-2">
          <SearchIcon
            className="absolute start-3 top-3 h-5 w-5 text-brand-text-secondary"
            aria-hidden="true"
          />
          <input
            id="assigned-task-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("qualityTaskSearchPlaceholder")}
            className="min-h-11 w-full rounded-lg border border-brand-border dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background ps-10 pe-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-2 focus:outline-brand-primary"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "overdue", "dueSoon"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold ${
                filter === value
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-brand-border dark:border-dark-brand-border text-brand-text-secondary dark:text-dark-brand-text-secondary"
              }`}
            >
              {t(
                value === "all"
                  ? "qualityTaskAll"
                  : value === "overdue"
                    ? "qualityTaskOverdue"
                    : "qualityTaskDueSoon",
              )}{" "}
              (
              {value === "all"
                ? openTasks.length
                : openTasks.filter((task) =>
                    value === "overdue" ? task.isOverdue : task.isDueSoon,
                  ).length}
              )
            </button>
          ))}
        </div>
        <p
          role="status"
          className="mt-3 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary"
        >
          {t("qualityTaskResults")
            .replace("{shown}", String(visibleTasks.length))
            .replace("{total}", String(openTasks.length))}
        </p>
      </section>

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
              ? t("qualityTaskPrograms").replace(
                  "{count}",
                  String(stats.programCount),
                )
              : ""}
          </p>
          <p className="mt-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("qualityTaskProgressNotice")}
          </p>
        </div>
      )}

      {/* All done state */}
      {allDone && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 flex items-center gap-4">
          <CheckCircleIcon className="h-10 w-10 text-green-500 shrink-0" />
          <div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">
              {t("allTasksComplete")}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
              {t("qualityTaskProgressNotice")}
            </p>
          </div>
        </div>
      )}

      {/* Task list */}
      {groupedOpen.size > 0 ? (
        Array.from(groupedOpen, ([programId, projectTasks]) => (
          <div key={programId}>
            <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-brand-primary" />
              {programs.find((program) => program.id === programId)?.name ||
                t("qualityTaskUnknownProgram")}
            </h2>
            <div className="space-y-3">
              {Array.from(projectTasks, ([projectId, tasks]) => (
                <div
                  key={projectId}
                  className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg border border-brand-border dark:border-dark-brand-border shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-brand-border dark:border-dark-brand-border flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {tasks[0].projectName}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setNavigation({ view: "projectDetail", projectId })
                      }
                      aria-label={t("qualityTaskOpenProjectLabel").replace(
                        "{name}",
                        tasks[0].projectName,
                      )}
                      className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                    >
                      {t("qualityTaskOpenProject")}
                    </button>
                  </div>
                  <div className="divide-y divide-brand-border dark:divide-dark-brand-border">
                    {tasks.map((task) => (
                      <div
                        key={`${task.projectId}-${task.id}`}
                        className={`px-4 py-3 flex flex-wrap items-start justify-between gap-3 ${
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
                          {task.dueDateValue ? (
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
                                ? t("overdue")
                                : task.isDueSoon
                                  ? t("dueSoon")
                                  : t("dueDate")}
                              {" · "}
                              {task.dueDateValue.toLocaleDateString(
                                lang === "ar" ? "ar" : "en",
                              )}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                              {t(
                                task.dueDate
                                  ? "qualityTaskInvalidDate"
                                  : "qualityTaskNoDate",
                              )}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_COLORS[task.status] ||
                            "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {t(statusToTranslationKey(task.status))}
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
          title={t(
            openTasks.length ? "qualityTaskNoMatches" : "noTasksAssigned",
          )}
          message={t(
            openTasks.length
              ? "qualityTaskNoMatchesHelp"
              : "qualityTaskEmptyHelp",
          )}
        />
      ) : null}
      {(search || filter !== "all") && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setFilter("all");
          }}
          className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10"
        >
          {t("qualityTaskReset")}
        </button>
      )}
    </div>
  );
};

export default MyTasksPage;
