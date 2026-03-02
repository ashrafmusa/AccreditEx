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

import { CalendarIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import { Button, ErrorMessage } from "@/components/ui";
import DatePicker from "@/components/ui/DatePicker";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { User } from "@/types";
import React, { useState } from "react";
import { WizardData } from "./useProjectWizard";

interface Step3TeamTimelineProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  validationErrors: Record<string, string>;
  touched: Record<string, boolean>;
  touchField: (field: string) => void;
  users: User[];
  departments: any[]; // Department type
}

export const Step3TeamTimeline: React.FC<Step3TeamTimelineProps> = ({
  data,
  updateData,
  validationErrors,
  touched,
  touchField,
  users,
  departments,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);

  /**
   * Handle project lead selection
   */
  const handleLeadChange = (leadId: string) => {
    updateData({ leadId });
    touchField("leadId");
  };

  /**
   * Handle team member toggle
   */
  const handleTeamMemberToggle = (userId: string) => {
    const newTeamMemberIds = data.teamMemberIds.includes(userId)
      ? data.teamMemberIds.filter((id) => id !== userId)
      : [...data.teamMemberIds, userId];

    updateData({ teamMemberIds: newTeamMemberIds });
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

    // Auto-adjust end date if it becomes invalid
    if (date && data.endDate && data.endDate <= date) {
      const suggestedEnd = new Date(date);
      suggestedEnd.setDate(suggestedEnd.getDate() + 30); // Default 30 days
      updateData({ endDate: suggestedEnd });
    }
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
      const text = response.response || "";

      const startMatch = text.match(/START:\s*(\d{4}-\d{2}-\d{2})/);
      const endMatch = text.match(/END:\s*(\d{4}-\d{2}-\d{2})/);

      if (startMatch) {
        const suggestedStart = new Date(startMatch[1]);
        if (!isNaN(suggestedStart.getTime())) {
          updateData({ startDate: suggestedStart });
          touchField("startDate");
        }
      }
      if (endMatch) {
        const suggestedEnd = new Date(endMatch[1]);
        if (!isNaN(suggestedEnd.getTime())) {
          updateData({ endDate: suggestedEnd });
          touchField("endDate");
        }
      }

      const rationaleMatch = text.match(/RATIONALE:\s*(.+)/);
      if (rationaleMatch) {
        toast.success(`Timeline set: ${rationaleMatch[1].trim()}`);
      } else {
        toast.success(
          t("aiSuggestedTimeline") || "AI suggested project timeline.",
        );
      }
    } catch (error) {
      console.error("AI timeline generation error:", error);
      toast.error(
        t("failedToGenerateTimeline") ||
          "Failed to generate timeline. Please try again.",
      );
    } finally {
      setIsGeneratingTimeline(false);
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
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role}){" "}
              {user.departmentId ? `- ${user.departmentId}` : ""}
            </option>
          ))}
        </select>
        {validationErrors.leadId && touched.leadId && (
          <ErrorMessage message={validationErrors.leadId} />
        )}
      </div>

      {/* Team Members (Optional, Multi-select) */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          <UsersIcon className="w-4 h-4 inline mr-1" />
          {t("teamMembers")}{" "}
          <span className="text-xs text-brand-text-secondary">
            ({t("optional")})
          </span>
        </label>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
          {users
            .filter((u) => u.id !== data.leadId)
            .map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-brand-surface-secondary dark:hover:bg-dark-brand-surface-secondary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={data.teamMemberIds.includes(user.id)}
                  onChange={() => handleTeamMemberToggle(user.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {user.name}
                  </div>
                  <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {user.role}{" "}
                    {user.departmentId ? `• ${user.departmentId}` : ""}
                  </div>
                </div>
              </label>
            ))}
        </div>
        {data.teamMemberIds.length > 0 && (
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {data.teamMemberIds.length} {t("membersSelected")}
          </p>
        )}
      </div>

      {/* Departments (Optional, Multi-select) */}
      {departments.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("departments")}{" "}
            <span className="text-xs text-brand-text-secondary">
              ({t("optional")})
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => handleDepartmentToggle(dept.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  data.departmentIds.includes(dept.id)
                    ? "bg-brand-primary text-white"
                    : "bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-brand-primary-light"
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
                {t("aiSuggestTimeline") || "AI Suggest Timeline"}
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t("startDate")} <span className="text-red-500">*</span>
            </label>
            <DatePicker
              date={data.startDate}
              setDate={(date) => {
                handleStartDateChange(date);
                touchField("startDate");
              }}
              fromDate={new Date()}
            />
            {validationErrors.startDate && touched.startDate && (
              <ErrorMessage message={validationErrors.startDate} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t("endDate")}{" "}
              <span className="text-xs text-brand-text-secondary">
                ({t("optional")})
              </span>
            </label>
            <DatePicker
              date={data.endDate}
              setDate={(date) => {
                handleEndDateChange(date);
                touchField("endDate");
              }}
              fromDate={data.startDate || new Date()}
            />
            {validationErrors.endDate && touched.endDate && (
              <ErrorMessage message={validationErrors.endDate} />
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
