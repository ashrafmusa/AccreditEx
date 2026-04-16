/**
 * CreateProjectWizard - Main Controller
 * Phase 1: Forms & Wizards Enhancement
 * Phase 2: A1 Edit mode, A2 Team roles, A3 Conditional standards
 *
 * Multi-step wizard for project creation AND editing
 */

import { Step1TemplateBasics } from "@/components/projects/wizard/Step1TemplateBasics";
import { Step2ProgramStandards } from "@/components/projects/wizard/Step2ProgramStandards";
import { Step3TeamTimeline } from "@/components/projects/wizard/Step3TeamTimeline";
import { Step4ReviewConfirm } from "@/components/projects/wizard/Step4ReviewConfirm";
import {
  WizardData,
  useProjectWizard,
} from "@/components/projects/wizard/useProjectWizard";
import { MultiStepWizard, WizardStep } from "@/components/ui/MultiStepWizard";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  ChecklistItem,
  ComplianceStatus,
  NavigationState,
  Project,
  ProjectStatus,
} from "@/types";
import React, { useMemo, useState } from "react";

interface CreateProjectWizardProps {
  setNavigation?: (state: NavigationState) => void;
  /** Present to activate edit mode — pre-fills wizard from existing project */
  projectId?: string;
}

/**
 * CreateProjectWizard Component
 * 4-step guided project creation + editing
 */
const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({
  setNavigation,
  projectId,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global state
  const { addProject, updateProject, projects } = useProjectStore();
  const { users } = useUserStore();
  const { projectTemplates, accreditationPrograms, standards, departments } =
    useAppStore();
  const { showToast } = useToast();

  // A1: Derive edit mode and convert existing project → WizardData initial values
  const isEditMode = Boolean(projectId);
  const existingProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const initialData = useMemo((): Partial<WizardData> | undefined => {
    if (!existingProject) return undefined;
    const leadUser = existingProject.projectLead;
    return {
      projectName: existingProject.name,
      description: existingProject.description || "",
      programId: existingProject.programId,
      standardIds: existingProject.standardIds ?? [],
      leadId: leadUser?.id ?? "",
      teamMemberIds: existingProject.teamMembers ?? [],
      teamMemberRoles: existingProject.teamMemberRoles ?? {},
      departmentIds: existingProject.departmentIds ?? [],
      startDate: existingProject.startDate
        ? new Date(existingProject.startDate)
        : new Date(),
      endDate: existingProject.endDate
        ? new Date(existingProject.endDate)
        : undefined,
      checklistItems: existingProject.checklist ?? [],
    };
  }, [existingProject]);

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
  } = useProjectWizard({ initialData, isEditMode, editProjectId: projectId });

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
   * Build a proper ChecklistItem[] from the wizard state.
   * - Selected standards → one ChecklistItem each (item = description, standardId set)
   * - Template checklist items that already have item+standardId are preserved as-is
   * - Template items without standardId are kept as freeform items
   */
  const buildChecklist = (): ChecklistItem[] => {
    // Separate already-proper ChecklistItems (have item + standardId) from template blobs
    const existing = (data.checklistItems as any[]).filter(
      (i) => typeof i.item === "string" && i.standardId,
    ) as ChecklistItem[];
    const existingStdIds = new Set(existing.map((i) => i.standardId));

    // Freeform template items (no standardId) — convert title→item, give defaults
    const freeform: ChecklistItem[] = (data.checklistItems as any[])
      .filter((i) => !i.standardId)
      .map((i, idx) => ({
        id: i.id || `tmpl-${Date.now()}-${idx}`,
        item: i.item || i.title || "",
        standardId: "",
        status: i.status || ComplianceStatus.NotStarted,
        assignedTo: i.assignedTo || "",
        dueDate: i.dueDate || "",
        actionPlan: i.actionPlan || "",
        notes: i.notes || "",
        evidenceFiles: i.evidenceFiles || [],
        comments: i.comments || [],
        ...(i.departmentId != null ? { departmentId: i.departmentId } : {}),
      }));

    // Generate one ChecklistItem per selected standard (skip those already covered)
    const fromStandards: ChecklistItem[] = data.standardIds
      .filter((stdId) => !existingStdIds.has(stdId))
      .map((stdId) => {
        const std =
          standards.find(
            (s) => s.standardId === stdId && s.programId === data.programId,
          ) ?? standards.find((s) => s.standardId === stdId);
        return {
          id: `item-${stdId}-${Date.now()}`,
          item: std?.description || stdId,
          standardId: stdId,
          status: ComplianceStatus.NotStarted,
          assignedTo: "",
          dueDate: "",
          actionPlan: "",
          notes: "",
          evidenceFiles: [],
          comments: [],
        };
      });

    return [...existing, ...fromStandards, ...freeform];
  };

  /**
   * Handle final submission — create OR update depending on mode (A1)
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Find user object for projectLead
      const leadUser = users.find((u) => u.id === data.leadId);

      if (isEditMode && existingProject) {
        // --- EDIT MODE: Update existing project ---
        const updatedProject: Project = {
          ...existingProject,
          name: data.projectName,
          description: data.description || "",
          programId: data.programId,
          startDate: data.startDate?.toISOString() || existingProject.startDate,
          endDate: data.endDate?.toISOString(),
          projectLead: leadUser
            ? ({
                id: leadUser.id,
                name: leadUser.name,
                email: leadUser.email,
                role: leadUser.role,
                departmentId: leadUser.departmentId,
              } as any)
            : existingProject.projectLead,
          teamMembers: data.teamMemberIds,
          teamMemberRoles: data.teamMemberRoles,
          departmentIds: data.departmentIds,
          standardIds: data.standardIds,
          checklist: buildChecklist(),
          updatedAt: new Date().toISOString(),
        };

        await updateProject(updatedProject);
        showToast(
          t("projectUpdatedSuccessfully") || "Project updated successfully!",
          "success",
        );
      } else {
        // --- CREATE MODE: Add new project ---
        const newProject: Omit<Project, "id"> = {
          name: data.projectName,
          description: data.description || "",
          programId: data.programId,
          startDate: data.startDate?.toISOString() || new Date().toISOString(),
          endDate: data.endDate?.toISOString(),
          status: ProjectStatus.NotStarted,
          progress: 0,
          projectLead: leadUser
            ? ({
                id: leadUser.id,
                name: leadUser.name,
                email: leadUser.email,
                role: leadUser.role,
                departmentId: leadUser.departmentId,
              } as any)
            : undefined,
          teamMembers: data.teamMemberIds,
          teamMemberRoles: data.teamMemberRoles,
          departmentIds: data.departmentIds,
          standardIds: data.standardIds,
          checklist: buildChecklist(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any;

        await addProject(newProject);
        clearDraft();
        showToast(
          t("projectCreatedSuccessfully") || "Project created successfully!",
          "success",
        );
      }

      // Navigate to projects list
      setNavigation?.({ view: "projects" });
    } catch (error) {
      console.error("Error saving project:", error);
      showToast(
        t("errorSavingProject") || "Error saving project. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = async () => {
    if (data.projectName || data.description) {
      // Show confirmation if user has entered data
      const confirmMsg = isEditMode
        ? t("confirmCancelEdit") || "Discard unsaved changes?"
        : t("confirmCancelWizard") ||
          "Are you sure you want to cancel? Your draft is saved and you can resume later.";
      if (
        !(await useConfirmStore
          .getState()
          .confirm(
            confirmMsg,
            t("cancelProject") || "Cancel",
            t("discard") || "Discard",
          ))
      )
        return;
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
        {/* Page heading — changes based on create vs. edit mode (A1) */}
        <div className="mb-5 flex items-start gap-4">
          <button
            type="button"
            onClick={() => setNavigation?.({ view: "projects" })}
            className="mt-1 flex-shrink-0 p-1.5 rounded-lg text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-brand-surface-secondary dark:hover:bg-dark-brand-surface-secondary hover:text-brand-text-primary dark:hover:text-dark-brand-text-primary transition-colors"
            aria-label={t("back") || "Back"}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {isEditMode
                ? t("editProject") || "Edit Project"
                : t("createNewProject") || "Create New Project"}
            </h1>
            {isEditMode && existingProject ? (
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                {existingProject.name}
              </p>
            ) : (
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                {t("createProjectSubtitle") ||
                  "Fill in the details below to set up your accreditation project."}
              </p>
            )}
          </div>
        </div>
        <MultiStepWizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={(step: number) => goToStep(step)}
          onComplete={handleSubmit}
          onCancel={handleCancel}
          canGoNext={canProceedToNextStep()}
          canGoBack={true}
          isSubmitting={isSubmitting}
          className="bg-brand-surface dark:bg-dark-brand-surface shadow-xl rounded-xl overflow-hidden"
        >
          {renderStep()}
        </MultiStepWizard>
      </div>
    </div>
  );
};

export default CreateProjectWizard;
