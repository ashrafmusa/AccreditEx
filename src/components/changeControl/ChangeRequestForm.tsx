/**
 * Change Request Form Component
 * Form for creating and editing change requests
 */

import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useChangeControlStore } from "@/stores/useChangeControlStore";
import { useUserStore } from "@/stores/useUserStore";
import { ChangePriority } from "@/types/changeControl";
import { Loader } from "lucide-react";
import { useState } from "react";

interface ChangeRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChangeRequestForm({
  onSuccess,
  onCancel,
}: ChangeRequestFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useUserStore();
  const { createRequest, loading } = useChangeControlStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    changeType: "standard",
    priority: "medium" as ChangePriority,
    businessJustification: "",
    expectedBenefits: "",
    detailedDescription: "",
    scope: "",
    estimatedHours: 0,
    plannedStartDate: "",
    plannedEndDate: "",
    tags: [] as string[],
    tagInput: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "estimatedHours" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddTag = () => {
    if (
      formData.tagInput.trim() &&
      !formData.tags.includes(formData.tagInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(t("titleRequired") || "Title is required");
      return;
    }

    if (!formData.businessJustification.trim()) {
      toast.error(
        t("businessJustificationRequired") ||
          "Business justification is required",
      );
      return;
    }

    try {
      await createRequest({
        title: formData.title.trim(),
        description: formData.description.trim(),
        changeType: formData.changeType,
        priority: formData.priority,
        businessJustification: formData.businessJustification.trim(),
        expectedBenefits: formData.expectedBenefits.trim(),
        detailedDescription: formData.detailedDescription.trim(),
        scope: formData.scope.trim(),
        tags: formData.tags,
        impact: {
          estimatedHours: formData.estimatedHours,
          affectedSystems: [],
          affectedProcesses: [],
          affectedDocuments: [],
          dependentChanges: [],
          riskAssessment: "",
          riskLevel: "low",
          mitigation: "",
          backoutPlan: "",
        },
        plannedStartDate: formData.plannedStartDate
          ? new Date(formData.plannedStartDate)
          : undefined,
        plannedEndDate: formData.plannedEndDate
          ? new Date(formData.plannedEndDate)
          : undefined,
      } as any);

      onSuccess();
    } catch (error) {
      console.error("Error creating change request:", error);
      toast.error(
        t("errorCreatingChangeRequest") || "Error creating change request",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("title")} *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder={t("enterChangeTitle") || "Enter change request title"}
          className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("description")}
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={t("enterDescription") || "Brief description"}
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-brand-border text-sm resize-none"
        />
      </div>

      {/* Row: Change Type & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
            {t("changeType")}
          </label>
          <select
            name="changeType"
            value={formData.changeType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
          >
            <option value="standard">{t("changeType.standard")}</option>
            <option value="emergency">{t("changeType.emergency")}</option>
            <option value="urgent">{t("changeType.urgent")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
            {t("priority")} *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
            required
          >
            <option value="low">{t("priority.low")}</option>
            <option value="medium">{t("priority.medium")}</option>
            <option value="high">{t("priority.high")}</option>
            <option value="critical">{t("priority.critical")}</option>
          </select>
        </div>
      </div>

      {/* Business Justification */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("businessJustification")} *
        </label>
        <textarea
          name="businessJustification"
          value={formData.businessJustification}
          onChange={handleInputChange}
          placeholder={t("explainWhy") || "Explain why this change is needed"}
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-brand-border text-sm resize-none"
          required
        />
      </div>

      {/* Expected Benefits */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("expectedBenefits")}
        </label>
        <textarea
          name="expectedBenefits"
          value={formData.expectedBenefits}
          onChange={handleInputChange}
          placeholder={
            t("describeExpectedBenefits") || "Describe expected benefits"
          }
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-brand-border text-sm resize-none"
        />
      </div>

      {/* Scope */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("scope")}
        </label>
        <textarea
          name="scope"
          value={formData.scope}
          onChange={handleInputChange}
          placeholder={t("describeScope") || "What areas are affected?"}
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-brand-border text-sm resize-none"
        />
      </div>

      {/* Detailed Description */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("detailedDescription")}
        </label>
        <textarea
          name="detailedDescription"
          value={formData.detailedDescription}
          onChange={handleInputChange}
          placeholder={
            t("enterDetailedDescription") || "Detailed change description"
          }
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-brand-border text-sm resize-none"
        />
      </div>

      {/* Row: Estimated Hours & Dates */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
            {t("estimatedHours")}
          </label>
          <input
            type="number"
            name="estimatedHours"
            value={formData.estimatedHours}
            onChange={handleInputChange}
            placeholder="0"
            min="0"
            step="0.5"
            className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
            {t("plannedStartDate")}
          </label>
          <input
            type="date"
            name="plannedStartDate"
            value={formData.plannedStartDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
            {t("plannedEndDate")}
          </label>
          <input
            type="date"
            name="plannedEndDate"
            value={formData.plannedEndDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-md border border-brand-border text-sm"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          {t("tags")}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={formData.tagInput}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tagInput: e.target.value }))
            }
            onKeyPress={handleTagKeyPress}
            placeholder={t("addTag") || "Add tag..."}
            className="flex-1 px-3 py-2 rounded-md border border-brand-border text-sm"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 rounded-md bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90"
          >
            {t("add")}
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-brand-primary/10 text-brand-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:opacity-70"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium border border-brand-border text-brand-text-primary hover:bg-gray-50"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader size={16} className="animate-spin" />}
          {t("createChangeRequest")}
        </button>
      </div>
    </form>
  );
}
