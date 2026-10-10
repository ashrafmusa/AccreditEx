import React from "react";
import type { Project, User } from "@/types";
import { ProjectStatus, UserRole } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { PencilIcon, TrashIcon } from "@/components/icons";
import UserAvatar from "@/components/common/UserAvatar";
import {
  PROJECT_STATUS_KEYS,
  projectCalendarDate,
  projectWorkSummary,
} from "@/utils/projectJourney";

interface ProjectCardProps {
  project: Project & { programName: string };
  teamUsers?: User[];
  currentUser: User | null;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  teamUsers = [],
  currentUser,
  onSelect,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}) => {
  const { t, lang } = useTranslation();
  const { can } = usePermission();
  const work = projectWorkSummary(project);
  const progress =
    Number.isFinite(project.progress) &&
    project.progress >= 0 &&
    project.progress <= 100
      ? Math.round(project.progress)
      : null;
  const canModify =
    !!currentUser &&
    (currentUser.role === UserRole.Admin ||
      currentUser.id === project.projectLead?.id) &&
    project.status !== ProjectStatus.Finalized;
  const endDate = projectCalendarDate(project.endDate);
  const actionClass =
    "min-h-11 min-w-11 p-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary";

  return (
    <article
      aria-label={project.name}
      className={`bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-sm border flex flex-col h-full ${selected ? "border-brand-primary ring-2 ring-brand-primary" : "border-brand-border dark:border-dark-brand-border"}`}
    >
      <div className="p-5 grow space-y-4">
        <div className="flex justify-between items-start gap-3">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-brand-primary/10 text-brand-primary">
            {project.programName}
          </span>
          {onToggleSelect && (
            <label className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!selected}
                onChange={onToggleSelect}
                aria-label={t("projectSelectNamed", { name: project.name })}
                className="w-5 h-5 accent-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
              />
            </label>
          )}
        </div>
        <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
          <button
            type="button"
            onClick={onSelect}
            className="min-h-11 text-start hover:underline rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
          >
            {project.name}
          </button>
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full px-2 py-1 bg-brand-primary/10 text-brand-primary">
            {t(PROJECT_STATUS_KEYS[project.status] || project.status)}
          </span>
          {project.archived && (
            <span className="rounded-full px-2 py-1 bg-gray-100 dark:bg-gray-800">
              {t("projectArchivedLabel")}
            </span>
          )}
        </div>
        <dl className="space-y-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          <div className="flex justify-between gap-3">
            <dt>{t("projectLead")}</dt>
            <dd className="text-end font-medium">
              {project.projectLead?.name || t("unassigned")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t("projectTargetDate")}</dt>
            <dd className="text-end">
              {endDate
                ? endDate.toLocaleDateString(lang === "ar" ? "ar" : "en")
                : t(
                    project.endDate
                      ? "projectInvalidDate"
                      : "projectNoTargetDate",
                  )}
            </dd>
          </div>
        </dl>
        <div>
          <div className="flex justify-between gap-3 text-sm mb-2">
            <span>{t("projectChecklistProgress")}</span>
            <strong className="text-brand-primary">
              {progress === null ? t("projectNotAssessed") : `${progress}%`}
            </strong>
          </div>
          {progress !== null && (
            <div
              role="progressbar"
              aria-label={t("projectChecklistProgress")}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
            >
              <div
                className="bg-brand-primary h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("projectChecklistCounts", {
              completed: work.completed,
              total: work.total,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          <span>{t("projectRemainingCount", { count: work.remaining })}</span>
          <span>{t("projectUnassignedCount", { count: work.unassigned })}</span>
          {work.overdue > 0 && (
            <span className="font-semibold text-red-600 dark:text-red-400">
              {t("projectOverdueCount", { count: work.overdue })}
            </span>
          )}
          {work.openCapa > 0 && (
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {t("projectCapaCount", { count: work.openCapa })}
            </span>
          )}
        </div>
        <div className="pt-3 border-t border-brand-border dark:border-dark-brand-border">
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
            {t("teamMembers")}
          </p>
          <div className="flex items-center gap-2">
            {teamUsers.slice(0, 4).map((member) => (
              <UserAvatar
                key={member.id}
                user={member}
                size="sm"
                ariaLabel={member.name}
              />
            ))}
            {teamUsers.length > 4 && (
              <span className="text-xs">+{teamUsers.length - 4}</span>
            )}
            {!teamUsers.length && (
              <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("projectNoTeam")}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-brand-border dark:border-dark-brand-border px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-1">
          {canModify && can(Action.Update, Resource.Project) && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={t("projectEditNamed", { name: project.name })}
              title={t("editProject")}
              className={`${actionClass} text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-brand-primary/10`}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
          {canModify && can(Action.Delete, Resource.Project) && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={t("projectDeleteNamed", { name: project.name })}
              title={t("deleteProject")}
              className={`${actionClass} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onSelect}
          aria-label={t("projectOpenNamed", { name: project.name })}
          className={`${actionClass} px-3 font-semibold text-brand-primary hover:bg-brand-primary/10`}
        >
          {t("projectOpenWorkspace")}
        </button>
      </div>
    </article>
  );
};

export default React.memo(ProjectCard);
