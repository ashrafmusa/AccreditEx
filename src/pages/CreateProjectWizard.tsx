/**
 * CreateProjectWizard - Main Controller
 * Phase 1: Forms & Wizards Enhancement
 *
 * Multi-step wizard for project creation
 * Replaces monolithic 985-line CreateProjectPage
 * Target: 3-5 min completion (vs 8-12 min before)
 */

import { Step1TemplateBasics } from "@/components/projects/wizard/Step1TemplateBasics";
import { Step2ProgramStandards } from "@/components/projects/wizard/Step2ProgramStandards";
import { Step3TeamTimeline } from "@/components/projects/wizard/Step3TeamTimeline";
import { Step4ReviewConfirm } from "@/components/projects/wizard/Step4ReviewConfirm";
import { useProjectWizard } from "@/components/projects/wizard/useProjectWizard";
import { MultiStepWizard, WizardStep } from "@/components/ui/MultiStepWizard";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState, Project, ProjectStatus } from "@/types";
import React, { useState } from "react";

interface CreateProjectWizardProps {
  setNavigation?: (state: NavigationState) => void;
}

/**
 * CreateProjectWizard Component
 * 4-step guided project creation
 */
const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state management
  const {
    currentStep,
    data,
    validationErrors,
    touched,
    updateData,
    touchField,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    applyTemplate,
    resetWizard,
    clearDraft,
    canProceedToNextStep,
  } = useProjectWizard();

  // Global state
  const { addProject } = useProjectStore();
  const { users } = useUserStore();
  const { projectTemplates, accreditationPrograms, standards, departments } =
    useAppStore();
  const { showToast } = useToast();

  /**
   * Define wizard steps
   */
  const steps: WizardStep[] = [
    {
      id: "basics",
      title: t("templateAndBasics") || "Template & Basics",
      description:
        t("chooseTemplateAndBasicInfo") ||
        "Choose a template or start from scratch",
    },
    {
      id: "program",
      title: t("programAndStandards") || "Program & Standards",
      description:
        t("selectProgramAndStandards") ||
        "Select accreditation program and standards",
    },
    {
      id: "team",
      title: t("teamAndTimeline") || "Team & Timeline",
      description:
        t("assignTeamAndSetTimeline") || "Assign project lead and set timeline",
    },
    {
      id: "review",
      title: t("reviewAndConfirm") || "Review & Confirm",
      description:
        t("reviewDetailsBeforeCreating") || "Review all details and confirm",
    },
  ];

  /**
   * Handle final submission
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Convert wizard data to Project object
      const newProject: Omit<Project, "id"> = {
        name: data.projectName,
        description: data.description || "",
        programId: data.programId!,
        startDate: data.startDate?.toISOString() || new Date().toISOString(),
        endDate: data.endDate?.toISOString(),
        status: ProjectStatus.NotStarted,
        progress: 0,
        checklist: data.checklistItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      // Add project
      await addProject(newProject);

      // Clear draft
      clearDraft();

      // Success toast
      showToast(
        t("projectCreatedSuccessfully") || "Project created successfully!",
        "success",
      );

      // Navigate to projects list
      setNavigation?.({ view: "projects" });
    } catch (error) {
      console.error("Error creating project:", error);
      showToast(
        t("errorCreatingProject") ||
          "Error creating project. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (data.projectName || data.description) {
      // Show confirmation if user has entered data
      const confirm = window.confirm(
        t("confirmCancelWizard") ||
          "Are you sure you want to cancel? Your draft is saved and you can resume later.",
      );
      if (!confirm) return;
    }

    setNavigation?.({ view: "projects" });
  };

  /**
   * Render current step
   */
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1TemplateBasics
            data={data}
            updateData={updateData}
            validationErrors={validationErrors}
            touched={touched}
            touchField={touchField}
            templates={projectTemplates}
            applyTemplate={applyTemplate}
          />
        );

      case 1:
        return (
          <Step2ProgramStandards
            data={data}
            updateData={updateData}
            validationErrors={validationErrors}
            touched={touched}
            touchField={touchField}
            programs={accreditationPrograms}
            allStandards={standards}
          />
        );

      case 2:
        return (
          <Step3TeamTimeline
            data={data}
            updateData={updateData}
            validationErrors={validationErrors}
            touched={touched}
            touchField={touchField}
            users={users}
            departments={departments}
          />
        );

      case 3:
        return (
          <Step4ReviewConfirm
            data={data}
            goToStep={goToStep}
            users={users}
            programs={accreditationPrograms}
            allStandards={standards}
            templates={projectTemplates}
            departments={departments}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <MultiStepWizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={(step: number) => goToStep(step)}
          onComplete={handleSubmit}
          onCancel={handleCancel}
          canGoNext={canProceedToNextStep()}
          canGoBack={true}
          isSubmitting={isSubmitting}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg"
        >
          {renderStep()}
        </MultiStepWizard>
      </div>
    </div>
  );
};

export default CreateProjectWizard;
