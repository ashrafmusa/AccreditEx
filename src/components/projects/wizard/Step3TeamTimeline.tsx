/**
 * Step 3: Team & Timeline
 * Phase 1: Forms & Wizards Enhancement
 *
 * Third step of project creation wizard
 * - Select project lead (required)
 * - Select team members (optional, multi-select)
 * - Select departments (optional, multi-select)
 * - Set start & end dates (with AI timeline suggestion)
 */

import { LanguageContext } from "@/components/common/LanguageProvider";
import { CalendarIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import { Button, ErrorMessage } from "@/components/ui";
import DatePicker from "@/components/ui/DatePicker";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { Department, User, UserRole } from "@/types";
import { isEligibleProjectLead } from "@/utils/roleAccess";
import { parseProjectTimeline } from "@/utils/projectSetup";
import { validateStep3 } from "./projectValidation";
import React, { useContext, useEffect, useRef, useState } from "react";
import { WizardData } from "./useProjectWizard";

interface Step3TeamTimelineProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  validationErrors: Record<string, string>;
  touched: Record<string, boolean>;
  touchField: (field: string) => void;
  users: User[];
  departments: Department[];
  isEditMode?: boolean;
}

export const Step3TeamTimeline: React.FC<Step3TeamTimelineProps> = ({
  data,
  updateData,
  validationErrors,
  touched,
  touchField,
  users,
  departments,
  isEditMode = false,
}) => {
  const { t } = useTranslation();
  const { lang } = useContext(LanguageContext);
  const toast = useToast();
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [timelineSuggestion, setTimelineSuggestion] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(
    () => setTimelineSuggestion(null),
    [data.projectName, data.programId, data.standardIds],
  );

  /**
   * Handle project lead selection
   */
  const handleLeadChange = (leadId: string) => {
    const teamMemberRoles = { ...data.teamMemberRoles };
    delete teamMemberRoles[leadId];
    updateData({
      leadId,
      teamMemberIds: data.teamMemberIds.filter((id) => id !== leadId),
      teamMemberRoles,
    });
    touchField("leadId");
  };

  /**
   * Handle team member toggle (A2: assign default role on add)
   */
  const handleTeamMemberToggle = (userId: string) => {
    const isSelected = data.teamMemberIds.includes(userId);
    const newTeamMemberIds = isSelected
      ? data.teamMemberIds.filter((id) => id !== userId)
      : [...data.teamMemberIds, userId];

    // Remove role when deselecting; set default role when selecting
    // Guard against undefined teamMemberRoles (old localStorage drafts)
    const newRoles = { ...(data.teamMemberRoles ?? {}) };
    if (isSelected) {
      delete newRoles[userId];
    } else {
      newRoles[userId] = newRoles[userId] ?? UserRole.TeamMember;
    }

    updateData({ teamMemberIds: newTeamMemberIds, teamMemberRoles: newRoles });
  };

  /**
   * Handle role change for a team member (A2)
   */
  const handleMemberRoleChange = (userId: string, role: string) => {
    updateData({
      teamMemberRoles: { ...(data.teamMemberRoles ?? {}), [userId]: role },
    });
  };

  /**
   * Handle department toggle
   */
  const handleDepartmentToggle = (deptId: string) => {
    const newDepartmentIds = data.departmentIds.includes(deptId)
      ? data.departmentIds.filter((id) => id !== deptId)
      : [...data.departmentIds, deptId];

    updateData({ departmentIds: newDepartmentIds });
  };

  /**
   * Handle start date change
   */
  const handleStartDateChange = (date: Date | undefined) => {
    updateData({ startDate: date });
    touchField("startDate");
  };

  /**
   * Handle end date change
   */
  const handleEndDateChange = (date: Date | undefined) => {
    updateData({ endDate: date });
    touchField("endDate");
  };

  /**
   * AI-generate timeline suggestion
   */
  const handleAIGenerateTimeline = async () => {
    if (isGeneratingTimeline) return;
    if (!data.projectName.trim()) {
      toast.error(
        t("pleaseEnterProjectNameFirst") ||
          "Please enter a project name first.",
      );
      return;
    }

    setIsGeneratingTimeline(true);
    try {
      const prompt = `You are a healthcare accreditation project planning expert. Suggest a realistic timeline for this accreditation project.

Project Name: ${data.projectName.trim()}
Description: ${data.description || "N/A"}
Selected Standards: ${data.standardIds.length} standards
Today's date: ${new Date().toISOString().split("T")[0]}

Based on the scope and complexity of this accreditation project, suggest a recommended start date and end date.
Consider typical healthcare accreditation timelines, preparation phases, and review cycles.

Respond ONLY in this exact format (dates in YYYY-MM-DD):
START: YYYY-MM-DD
END: YYYY-MM-DD
RATIONALE: (one sentence explaining the timeline)`;

      const response = await aiAgentService.chat(prompt, true);
      if (!active.current) return;
      const text = response.response || "";

      const suggestion = parseProjectTimeline(text);
      if (
        !validateStep3({ ...suggestion, leadId: data.leadId }, isEditMode)
          .isValid
      ) {
        throw new Error("AI timeline is not valid for this project");
      }
      setTimelineSuggestion(suggestion);
    } catch (error) {
      console.error("AI timeline generation error:", error);
      if (active.current)
        toast.error(
          t("failedToGenerateTimeline") ||
            "Failed to generate timeline. Please try again.",
        );
    } finally {
      if (active.current) setIsGeneratingTimeline(false);
    }
  };

  /**
   * Calculate project duration
   */
  const projectDuration =
    data.startDate && data.endDate
      ? Math.ceil(
          (data.endDate.getTime() - data.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t("teamAndTimeline") || "Team & Timeline"}
        </h2>
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("assignTeamAndSetDates") ||
            "Assign team members and set the project timeline."}
        </p>
      </div>

      {/* Project Lead (Required) */}
      <div>
        <label
          htmlFor="lead"
          className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2"
        >
          <UsersIcon className="w-4 h-4 inline mr-1" />
          {t("projectLead")} <span className="text-red-500">*</span>
        </label>
        <select
          id="lead"
          value={data.leadId}
          onChange={(e) => handleLeadChange(e.target.value)}
          onBlur={() => touchField("leadId")}
          className={`w-full rounded-lg border px-4 py-2 text-brand-text-primary dark:text-dark-brand-text-primary bg-white dark:bg-gray-800 ${
            validationErrors.leadId && touched.leadId
              ? "border-red-500 focus:ring-red-500"
              : "border-brand-border dark:border-dark-brand-border focus:ring-brand-primary"
          }`}
        >
          <option value="">
            {t("selectProjectLead") || "Select project lead..."}
          </option>
          {users.filter(isEligibleProjectLead).map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        {validationErrors.leadId && touched.leadId && (
          <ErrorMessage message={t(validationErrors.leadId)} />
        )}
      </div>

      {/* Team Members (Optional, Multi-select) */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          <UsersIcon className="w-4 h-4 inline mr-1" />
          {t("teamMembers")}{" "}
          <span className="text-xs text-brand-text-secondary">
            ({t("setupOptional")})
          </span>
        </label>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
          {users
            .filter((u) => u.id !== data.leadId)
            .map((user) => {
              const isChecked = data.teamMemberIds.includes(user.id);
              return (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-brand-surface-secondary dark:hover:bg-dark-brand-surface-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTeamMemberToggle(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                      {user.name}
                    </div>
                    <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {departments.find((dept) => dept.id === user.departmentId)
                        ?.name?.[lang] || ""}
                    </div>
                  </div>
                  {/* A2: per-member role selector (only visible when checked) */}
                  {isChecked && (
                    <select
                      value={
                        (data.teamMemberRoles ?? {})[user.id] ??
                        UserRole.TeamMember
                      }
                      onChange={(e) =>
                        handleMemberRoleChange(user.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs rounded border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary px-2 py-1 focus:ring-brand-primary"
                      title={t("projectRole") || "Project role"}
                      aria-label={`${t("projectRole")} — ${user.name}`}
                    >
                      <option value={UserRole.TeamMember}>
                        {t("teamMember") || "Team Member"}
                      </option>
                      <option value={UserRole.Auditor}>
                        {t("auditor") || "Auditor"}
                      </option>
                      <option value={UserRole.Viewer}>
                        {t("viewer") || "Viewer"}
                      </option>
                      <option value={UserRole.ProjectLead}>
                        {t("projectLead") || "Project Lead"}
                      </option>
                    </select>
                  )}
                </label>
              );
            })}
        </div>
        {data.teamMemberIds.length > 0 && (
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {data.teamMemberIds.length} {t("membersSelected")}
          </p>
        )}
        {validationErrors.teamMemberIds && (
          <ErrorMessage message={t(validationErrors.teamMemberIds)} />
        )}
        {data.teamMemberIds
          .filter((id) => !users.some((user) => user.id === id))
          .map((id) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => handleTeamMemberToggle(id)}
            >
              {t("setupRemoveUnavailableMember")} ({id})
            </Button>
          ))}
      </div>

      {/* Departments (Optional, Multi-select) */}
      {departments.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("departments")}{" "}
            <span className="text-xs text-brand-text-secondary">
              ({t("setupOptional")})
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                aria-pressed={data.departmentIds.includes(dept.id)}
                onClick={() => handleDepartmentToggle(dept.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  data.departmentIds.includes(dept.id)
                    ? "bg-brand-primary text-white"
                    : "bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-brand-primary-light"
                }`}
              >
                {typeof dept.name === "string"
                  ? dept.name
                  : dept.name?.[lang] || dept.name?.en || dept.id}
              </button>
            ))}
          </div>
        </div>
      )}
      {validationErrors.departmentIds && (
        <ErrorMessage message={t(validationErrors.departmentIds)} />
      )}
      {data.departmentIds
        .filter((id) => !departments.some((dept) => dept.id === id))
        .map((id) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => handleDepartmentToggle(id)}
          >
            {t("setupRemoveUnavailableDepartment")} ({id})
          </Button>
        ))}

      {/* Timeline Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-text-secondary" />
            <h3 className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("projectTimeline")}
            </h3>
          </div>
          <Button
            type="button"
            onClick={handleAIGenerateTimeline}
            disabled={isGeneratingTimeline || !data.projectName.trim()}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            {isGeneratingTimeline ? (
              <>{t("generating")}...</>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-1" />
                {t("setupSuggestTimeline")}
              </>
            )}
          </Button>
        </div>

        {timelineSuggestion && (
          <div
            role="status"
            className="p-3 rounded-lg border border-brand-border dark:border-dark-brand-border mb-4 space-y-2"
          >
            <p>
              {t("setupTimelineReview")}{" "}
              {timelineSuggestion.startDate.toLocaleDateString(lang)} —{" "}
              {timelineSuggestion.endDate.toLocaleDateString(lang)}
            </p>
            <Button
              onClick={() => {
                updateData(timelineSuggestion);
                setTimelineSuggestion(null);
              }}
            >
              {t("setupApplyTimeline")}
            </Button>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="setup-start-date" className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t("startDate")} <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="setup-start-date"
              ariaLabel={t("startDate")}
              date={data.startDate}
              setDate={(date) => {
                handleStartDateChange(date);
                touchField("startDate");
              }}
              fromDate={
                isEditMode
                  ? undefined
                  : new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
            {validationErrors.startDate && touched.startDate && (
              <ErrorMessage message={t(validationErrors.startDate)} />
            )}
          </div>

          <div>
            <label htmlFor="setup-end-date" className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t("setupTargetDate")}{" "}
              <span className="text-xs text-brand-text-secondary">
                ({t("setupOptional")})
              </span>
            </label>
            <DatePicker
              id="setup-end-date"
              ariaLabel={t("setupTargetDate")}
              date={data.endDate}
              setDate={(date) => {
                handleEndDateChange(date);
                touchField("endDate");
              }}
              fromDate={data.startDate || new Date()}
            />
            {validationErrors.endDate && touched.endDate && (
              <ErrorMessage message={t(validationErrors.endDate)} />
            )}
          </div>
        </div>

        {/* Project Duration Indicator */}
        {projectDuration && (
          <div className="mt-4 bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary border border-brand-border dark:border-dark-brand-border rounded-lg p-3">
            <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
              📅 <strong>{t("projectDuration")}:</strong> {projectDuration}{" "}
              {t("days")}
              {projectDuration < 30 && (
                <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                  ({t("shortDurationWarning") || "Short duration"})
                </span>
              )}
              {projectDuration > 180 && (
                <span className="text-blue-600 dark:text-blue-400 ml-2">
                  ({t("longTermProject") || "Long-term project"})
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>{t("tip")}:</strong>{" "}
          {t("step3Tip") ||
            "Use AI to suggest a realistic timeline based on project scope. You can adjust dates manually if needed."}
        </p>
      </div>
    </div>
  );
};
