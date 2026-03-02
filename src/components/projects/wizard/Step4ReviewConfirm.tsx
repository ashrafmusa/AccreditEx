/**
 * Step 4: Review & Confirm
 * Phase 1: Forms & Wizards Enhancement
 *
 * Final review step before project creation
 * - Display summary of all entered data
 * - Show checklist preview (from template)
 * - Option to edit any previous step
 * - Final confirmation
 */

import {
  CalendarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PencilIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { AccreditationProgram, Standard, User } from "@/types";
import { ProjectTemplate } from "@/types/templates";
import React from "react";
import { WizardData } from "./useProjectWizard";

interface Step4ReviewConfirmProps {
  data: WizardData;
  goToStep: (step: number) => void;
  users: User[];
  programs: AccreditationProgram[];
  allStandards: Standard[];
  templates: ProjectTemplate[];
  departments: any[];
}

export const Step4ReviewConfirm: React.FC<Step4ReviewConfirmProps> = ({
  data,
  goToStep,
  users,
  programs,
  allStandards,
  templates,
  departments,
}) => {
  const { t } = useTranslation();

  // Get selected entities
  const selectedTemplate = templates.find((t) => t.id === data.templateId);
  const selectedProgram = programs.find((p) => p.id === data.programId);
  const selectedLead = users.find((u) => u.id === data.leadId);
  const selectedTeamMembers = users.filter((u) =>
    data.teamMemberIds.includes(u.id),
  );
  const selectedStandards = allStandards.filter((s) =>
    data.standardIds.includes(s.standardId),
  );
  const selectedDepartments = departments.filter((d) =>
    data.departmentIds.includes(d.id),
  );

  // Calculate duration
  const duration =
    data.startDate && data.endDate
      ? Math.ceil(
          (data.endDate.getTime() - data.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

  /**
   * Format date
   */
  const formatDate = (date: Date | undefined) => {
    if (!date) return t("notSet") || "Not set";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t("reviewYourProject") || "Review Your Project"}
        </h2>
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("reviewDetailsBeforeCreating") ||
            "Review all details before creating the project. You can go back to edit any section."}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Section 1: Basic Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              {t("basicInformation")}
            </h3>
            <Button
              type="button"
              onClick={() => goToStep(0)}
              variant="ghost"
              size="sm"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              {t("edit")}
            </Button>
          </div>
          <dl className="space-y-3">
            {selectedTemplate && (
              <div>
                <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("template")}
                </dt>
                <dd className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary mt-1">
                  ✅ {selectedTemplate.name}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("projectName")}
              </dt>
              <dd className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mt-1">
                {data.projectName}
              </dd>
            </div>
            {data.description && (
              <div>
                <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("description")}
                </dt>
                <dd className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary mt-1">
                  {data.description}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Section 2: Program & Standards */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              {t("programAndStandards")}
            </h3>
            <Button
              type="button"
              onClick={() => goToStep(1)}
              variant="ghost"
              size="sm"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              {t("edit")}
            </Button>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("accreditationProgram")}
              </dt>
              <dd className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mt-1">
                {selectedProgram?.name || t("notSelected")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("selectedStandards")}
              </dt>
              <dd className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
                {selectedStandards.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStandards.map((std) => (
                      <span
                        key={std.standardId}
                        className="inline-flex items-center px-2 py-1 rounded bg-brand-primary-light dark:bg-brand-primary/10 text-brand-primary text-xs font-medium"
                      >
                        {std.standardId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-brand-text-secondary">
                    {t("noStandardsSelected")}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 3: Team & Timeline */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              {t("teamAndTimeline")}
            </h3>
            <Button
              type="button"
              onClick={() => goToStep(2)}
              variant="ghost"
              size="sm"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              {t("edit")}
            </Button>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("projectLead")}
              </dt>
              <dd className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mt-1">
                {selectedLead
                  ? `${selectedLead.name} (${selectedLead.role})`
                  : t("notSelected")}
              </dd>
            </div>
            {selectedTeamMembers.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("teamMembers")}
                </dt>
                <dd className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedTeamMembers.map((member) => (
                      <span
                        key={member.id}
                        className="inline-flex items-center px-2 py-1 rounded bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-xs"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            {selectedDepartments.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("departments")}
                </dt>
                <dd className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedDepartments.map((dept) => (
                      <span
                        key={dept.id}
                        className="inline-flex items-center px-2 py-1 rounded bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-xs"
                      >
                        {dept.name}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{t("timeline")}</span>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("start")}
                  </span>
                  <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {formatDate(data.startDate)}
                  </p>
                </div>
                <span className="text-brand-text-secondary">→</span>
                <div>
                  <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("end")}
                  </span>
                  <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {formatDate(data.endDate)}
                  </p>
                </div>
                {duration && (
                  <>
                    <span className="text-brand-text-secondary">•</span>
                    <div>
                      <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {t("duration")}
                      </span>
                      <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                        {duration} {t("days")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </dl>
        </div>

        {/* Checklist Preview (if from template) */}
        {data.checklistItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
              📋 {t("checklistPreview")} ({data.checklistItems.length}{" "}
              {t("items")})
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {data.checklistItems.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded bg-brand-surface dark:bg-dark-brand-surface"
                >
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                      {item.item || item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {data.checklistItems.length > 10 && (
                <p className="text-xs text-center text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
                  + {data.checklistItems.length - 10} {t("moreItems")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Message */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-sm text-green-700 dark:text-green-300 text-center">
          ✅{" "}
          {t("readyToCreateProject") ||
            'Everything looks good! Click "Create Project" to finalize.'}
        </p>
      </div>
    </div>
  );
};
