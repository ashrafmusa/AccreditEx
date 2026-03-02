/**
 * Step 1: Template & Basic Info
 * Phase 1: Forms & Wizards Enhancement
 *
 * First step of project creation wizard
 * - Select template OR start from scratch
 * - Enter project name (auto-filled from template)
 * - Enter description (AI-enhanced)
 */

import { SparklesIcon } from "@/components/icons";
import { Button, ErrorMessage, Input } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { ProjectTemplate } from "@/types/templates";
import React, { useEffect, useState } from "react";
import { WizardData } from "./useProjectWizard";

interface Step1TemplateBasicsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  validationErrors: Record<string, string>;
  touched: Record<string, boolean>;
  touchField: (field: string) => void;
  templates: ProjectTemplate[];
  applyTemplate: (template: ProjectTemplate) => void;
}

export const Step1TemplateBasics: React.FC<Step1TemplateBasicsProps> = ({
  data,
  updateData,
  validationErrors,
  touched,
  touchField,
  templates,
  applyTemplate,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [showTemplates, setShowTemplates] = useState(
    !data.templateId && !data.projectName,
  );

  // Update showTemplates when data changes
  useEffect(() => {
    setShowTemplates(!data.templateId && !data.projectName);
  }, [data.templateId, data.projectName]);

  /**
   * Handle project name change with real-time validation
   */
  const handleNameChange = (value: string) => {
    updateData({ projectName: value });
    touchField("projectName");
  };

  /**
   * Handle description change with real-time validation
   */
  const handleDescriptionChange = (value: string) => {
    updateData({ description: value });
    touchField("description");
  };

  /**
   * AI-generate project description
   */
  const handleAIGenerateDescription = async () => {
    if (isGeneratingDesc) return;
    if (!data.projectName.trim()) {
      toast.error(
        t("pleaseEnterProjectNameFirst") ||
          "Please enter a project name first.",
      );
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const prompt = `You are a healthcare accreditation expert. Generate a professional project description for this accreditation project.

Project Name: ${data.projectName.trim()}
${data.programId ? `Program: [Program ID: ${data.programId}]` : ""}

Write a clear, professional 2-3 sentence project description that:
- States the project's objective and scope
- Mentions the accreditation standards being addressed
- Highlights expected outcomes

Return ONLY the description text, no headers or formatting.`;

      const response = await aiAgentService.chat(prompt, true);
      const cleanDesc = (response.response || "")
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*/g, "")
        .trim();

      updateData({ description: cleanDesc.slice(0, 1000) });
      touchField("description");
      toast.success(
        t("aiGeneratedDescription") || "AI generated project description.",
      );
    } catch (error) {
      console.error("AI description generation error:", error);
      toast.error(
        t("failedToGenerateDescription") ||
          "Failed to generate description. Please try again.",
      );
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  /**
   * Select template
   */
  const handleSelectTemplate = (template: ProjectTemplate) => {
    applyTemplate(template);
    setShowTemplates(false);
    touchField("projectName");
  };

  /**
   * Start from scratch
   */
  const handleStartFromScratch = () => {
    // applyTemplate with null is not needed - just close templates view
    setShowTemplates(false);
  };

  // Show template selector if no template/name entered
  if (showTemplates && templates.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("chooseProjectTemplate") || "Choose a Project Template"}
          </h2>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("templateHelpsQuickStart") ||
              "Start with a template to save time, or build from scratch."}
          </p>
        </div>

        {/* Template Cards */}
        <div className="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
          {/* Start from Scratch Card */}
          <button
            onClick={handleStartFromScratch}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-brand-primary hover:bg-brand-surface dark:hover:bg-dark-brand-surface transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary flex items-center justify-center text-2xl group-hover:bg-brand-primary-light transition-colors">
                ✏️
              </div>
              <h3 className="font-bold text-lg text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("startFromScratch") || "Start from Scratch"}
              </h3>
            </div>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("buildCustomProject") ||
                "Build a custom project from the ground up with full flexibility."}
            </p>
          </button>

          {/* Template Cards */}
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-brand-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center text-xl font-bold">
                  {template.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-brand-text-primary dark:text-dark-brand-text-primary">
                    {template.name}
                  </h3>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {template.category}
                  </p>
                </div>
              </div>
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-3">
                {template.description ||
                  `${t("includes")} ${template.checklist.length} ${t("checklistItems")}`}
              </p>
              <div className="flex items-center gap-3 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                <span>
                  📋 {template.checklist.length} {t("items")}
                </span>
                {template.estimatedDuration && (
                  <span>
                    ⏱️ {template.estimatedDuration} {t("days")}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowTemplates(false)}
            className="text-brand-primary hover:underline text-sm"
          >
            {t("skipTemplates") || "Skip templates, I'll enter manually →"}
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t("projectBasicInformation") || "Project Basic Information"}
        </h2>
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("enterBasicProjectDetails") ||
            "Enter the basic details for your accreditation project."}
        </p>
      </div>

      {/* Show selected template (if any) */}
      {data.templateId && (
        <div className="bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary border border-brand-border dark:border-dark-brand-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                  {t("usingTemplate") || "Using Template:"}
                </p>
                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {templates.find((t) => t.id === data.templateId)?.name ||
                    "Template"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTemplates(true)}
              className="text-xs text-brand-primary hover:underline"
            >
              {t("changeTemplate") || "Change"}
            </button>
          </div>
        </div>
      )}

      {/* Project Name */}
      <div>
        <label
          htmlFor="projectName"
          className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2"
        >
          {t("projectName")} <span className="text-red-500">*</span>
        </label>
        <Input
          id="projectName"
          value={data.projectName}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => touchField("projectName")}
          placeholder={t("enterProjectName") || "Enter project name..."}
          maxLength={200}
          className={
            validationErrors.projectName && touched.projectName
              ? "border-red-500"
              : ""
          }
        />
        {validationErrors.projectName && touched.projectName && (
          <ErrorMessage message={validationErrors.projectName} />
        )}
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
          {data.projectName.length}/200 {t("characters")}
        </p>
      </div>

      {/* Project Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            {t("projectDescription")}{" "}
            <span className="text-xs text-brand-text-secondary">
              ({t("optional")})
            </span>
          </label>
          <Button
            type="button"
            onClick={handleAIGenerateDescription}
            disabled={isGeneratingDesc || !data.projectName.trim()}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            {isGeneratingDesc ? (
              <>{t("generating")}...</>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-1" />
                {t("aiGenerate") || "AI Generate"}
              </>
            )}
          </Button>
        </div>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onBlur={() => touchField("description")}
          placeholder={
            t("enterProjectDescription") ||
            "Briefly describe the project scope and objectives..."
          }
          rows={4}
          maxLength={1000}
          className={`w-full rounded-lg border px-4 py-2 text-brand-text-primary dark:text-dark-brand-text-primary bg-white dark:bg-gray-800 ${
            validationErrors.description && touched.description
              ? "border-red-500 focus:ring-red-500"
              : "bor border-brand-border dark:border-dark-brand-border focus:ring-brand-primary"
          }`}
        />
        {validationErrors.description && touched.description && (
          <ErrorMessage message={validationErrors.description} />
        )}
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
          {data.description.length}/1000 {t("characters")}
        </p>
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>{t("tip")}:</strong>{" "}
          {t("step1Tip") ||
            "A clear project name and description help team members understand the project scope quickly."}
        </p>
      </div>
    </div>
  );
};
