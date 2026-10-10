import React, { useEffect, useMemo, useRef, useState } from "react";
import { Step1TemplateBasics } from "@/components/projects/wizard/Step1TemplateBasics";
import { Step2ProgramStandards } from "@/components/projects/wizard/Step2ProgramStandards";
import { Step3TeamTimeline } from "@/components/projects/wizard/Step3TeamTimeline";
import { Step4ReviewConfirm } from "@/components/projects/wizard/Step4ReviewConfirm";
import {
  useProjectWizard,
  WizardData,
} from "@/components/projects/wizard/useProjectWizard";
import { MultiStepWizard } from "@/components/ui/MultiStepWizard";
import { Button } from "@/components/ui";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { NavigationState, Project, ProjectStatus } from "@/types";
import { isEligibleProjectLead } from "@/utils/roleAccess";
import {
  buildProjectChecklist,
  resolveProjectStandards,
} from "@/utils/projectSetup";
import { validateAllSteps } from "@/components/projects/wizard/projectValidation";

interface Props {
  setNavigation?: (state: NavigationState) => void;
  projectId?: string;
}

const ProjectSetup: React.FC<Props> = ({ setNavigation, projectId }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { can } = usePermission();
  const { organizationId } = useTenantStore();
  const { users: allUsers, currentUser } = useUserStore();
  const { projects, addProject, updateProject } = useProjectStore();
  const catalogue = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const isEditMode = Boolean(projectId);
  const existingProject = projects.find(
    (project) =>
      project.id === projectId && project.organizationId === organizationId,
  );
  const users = useMemo(
    () =>
      allUsers.filter(
        (user) =>
          user.organizationId === organizationId && user.isActive !== false,
      ),
    [allUsers, organizationId],
  );
  const departments = useMemo(
    () =>
      catalogue.departments.filter(
        (dept) =>
          dept.organizationId === organizationId && dept.isActive !== false,
      ),
    [catalogue.departments, organizationId],
  );
  const programs = useMemo(
    () =>
      catalogue.accreditationPrograms.filter(
        (program) =>
          (program.scope === "global" ||
            program.organizationId === organizationId) &&
          (program.status === undefined || program.status === "active"),
      ),
    [catalogue.accreditationPrograms, organizationId],
  );
  const resolvedStandards = useMemo(
    () =>
      resolveProjectStandards(
        catalogue.standards.filter(
          (standard) =>
            standard.scope === "global" ||
            standard.organizationId === organizationId,
        ),
      ),
    [catalogue.standards, organizationId],
  );
  const standards = resolvedStandards.standards;
  const templates = useMemo(
    () =>
      catalogue.projectTemplates.filter((template) =>
        programs.some((program) => program.id === template.programId),
      ),
    [catalogue.projectTemplates, programs],
  );
  const initialData = useMemo(
    (): Partial<WizardData> | undefined =>
      existingProject
        ? {
            projectName: existingProject.name,
            description: existingProject.description || "",
            programId: existingProject.programId,
            standardIds: existingProject.standardIds?.length
              ? existingProject.standardIds
              : [
                  ...new Set(
                    existingProject.checklist
                      .map((item) => item.standardId)
                      .filter(Boolean),
                  ),
                ],
            leadId: existingProject.projectLead?.id || "",
            teamMemberIds: existingProject.teamMembers || [],
            teamMemberRoles: existingProject.teamMemberRoles || {},
            departmentIds:
              existingProject.departmentIds ||
              (existingProject.departmentId
                ? [existingProject.departmentId]
                : []),
            startDate: new Date(existingProject.startDate),
            endDate: existingProject.endDate
              ? new Date(existingProject.endDate)
              : undefined,
            checklistItems: existingProject.checklist,
          }
        : undefined,
    [existingProject],
  );
  const wizard = useProjectWizard({
    initialData,
    isEditMode,
    draftKey:
      currentUser && organizationId
        ? `accreditex_project_setup:${organizationId}:${currentUser.id}`
        : undefined,
  });
  const {
    data,
    currentStep,
    updateData,
    touchField,
    touched,
    validationErrors,
    goToStep,
  } = wizard;
  const selectedTemplate = templates.find(
    (template) =>
      template.id === data.templateId && template.programId === data.programId,
  );
  const referenceErrors: Record<string, string> = {};
  if (!programs.some((program) => program.id === data.programId))
    referenceErrors.programId = "setupProgramUnavailable";
  if (
    data.standardIds.some(
      (id) =>
        !existingProject?.checklist.some((item) => item.standardId === id) &&
        !standards.some(
          (standard) =>
            standard.programId === data.programId && standard.standardId === id,
        ),
    )
  ) {
    referenceErrors.standardIds = "setupStandardsUnavailable";
  }
  if (
    !users.some(
      (user) => user.id === data.leadId && isEligibleProjectLead(user),
    )
  )
    referenceErrors.leadId = "setupLeadUnavailable";
  if (data.teamMemberIds.some((id) => !users.some((user) => user.id === id)))
    referenceErrors.teamMemberIds = "setupTeamUnavailable";
  const responsibilityRoles = new Set([
    "TeamMember",
    "Auditor",
    "Viewer",
    "ProjectLead",
  ]);
  if (
    data.teamMemberIds.some(
      (id) =>
        data.teamMemberRoles[id] &&
        !responsibilityRoles.has(data.teamMemberRoles[id]),
    )
  ) {
    referenceErrors.teamMemberIds = "setupTeamRolesInvalid";
  }
  if (
    data.departmentIds.some((id) => !departments.some((dept) => dept.id === id))
  )
    referenceErrors.departmentIds = "setupDepartmentsUnavailable";
  if (data.templateId && !selectedTemplate)
    referenceErrors.templateId = "setupTemplateUnavailable";
  const stepFields = [
    ["projectName", "description", "templateId"],
    ["programId", "standardIds"],
    ["leadId", "startDate", "endDate", "teamMemberIds", "departmentIds"],
  ];
  const errors = { ...validationErrors, ...referenceErrors };
  const validCurrentStep = (
    currentStep === 3 ? Object.keys(errors) : stepFields[currentStep]
  ).every((field) => !errors[field]);
  const checklist = useMemo(() => {
    const availableIds = data.standardIds.filter((id) =>
      standards.some(
        (standard) =>
          standard.programId === data.programId && standard.standardId === id,
      ),
    );
    return buildProjectChecklist(
      data.programId,
      availableIds,
      standards,
      selectedTemplate?.checklist || [],
      existingProject?.checklist || [],
    );
  }, [
    data.programId,
    data.standardIds,
    standards,
    selectedTemplate,
    existingProject,
  ]);
  const allowed =
    currentUser &&
    organizationId &&
    can(isEditMode ? Action.Update : Action.Create, Resource.Project) &&
    (!isEditMode ||
      (existingProject &&
        !existingProject.archived &&
        existingProject.status !== ProjectStatus.Finalized));

  const handleSubmit = async () => {
    if (submitting.current) return;
    const validation = validateAllSteps(data, isEditMode);
    if (
      !allowed ||
      !validation.isValid ||
      Object.keys(referenceErrors).length ||
      !checklist.length ||
      (existingProject && data.programId !== existingProject.programId)
    ) {
      toast.error(t("setupReviewErrors"));
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const lead = users.find((user) => user.id === data.leadId);
      if (!lead || !data.startDate)
        throw new Error("Project setup references are unavailable");
      const memberIds = [...new Set(data.teamMemberIds)].filter(
        (id) => id !== lead.id,
      );
      const projectData = {
        name: data.projectName.trim(),
        description: data.description.trim(),
        programId: data.programId,
        projectLead: lead,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
        teamMembers: memberIds,
        teamMemberRoles: Object.fromEntries(
          memberIds.map((id) => [id, data.teamMemberRoles[id] || "TeamMember"]),
        ),
        departmentIds: [...new Set(data.departmentIds)],
        standardIds: [
          ...new Set([
            ...data.standardIds,
            ...(existingProject?.checklist
              .map((item) => item.standardId)
              .filter(Boolean) || []),
          ]),
        ],
        checklist,
      };
      let savedId: string;
      if (existingProject) {
        await updateProject({ ...existingProject, ...projectData });
        savedId = existingProject.id;
      } else {
        const now = new Date().toISOString();
        const project: Omit<Project, "id"> = {
          ...projectData,
          status: ProjectStatus.NotStarted,
          progress: 0,
          createdAt: now,
          updatedAt: now,
        };
        const saved = await addProject(project);
        savedId = saved.id;
      }
      wizard.clearDraft();
      if (active.current) {
        toast.success(
          t(
            isEditMode
              ? "projectUpdatedSuccessfully"
              : "projectCreatedSuccessfully",
          ),
        );
        setNavigation?.({ view: "projectDetail", projectId: savedId });
      }
    } catch (error) {
      console.error("Project setup save failed:", error);
      if (active.current) toast.error(t("errorSavingProject"));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };
  const handleCancel = async () => {
    if (isSubmitting) return;
    if (
      (data.projectName || data.description) &&
      !(await useConfirmStore
        .getState()
        .confirm(
          t(isEditMode ? "confirmCancelEdit" : "setupLeaveConfirm"),
          t("cancelProject"),
          t("cancel"),
        ))
    )
      return;
    wizard.saveDraft();
    setNavigation?.({ view: "projects" });
  };
  if (!allowed)
    return (
      <div role="alert" className="p-6 space-y-4">
        <p>{t("setupUnavailable")}</p>
        <Button onClick={() => setNavigation?.({ view: "projects" })}>
          {t("projectBackToList")}
        </Button>
      </div>
    );
  const shared = {
    data,
    updateData,
    validationErrors: errors,
    touched,
    touchField,
  };
  const steps = [
    { id: "basics", title: t("templateAndBasics") },
    { id: "program", title: t("programAndStandards") },
    { id: "team", title: t("teamAndTimeline") },
    { id: "review", title: t("reviewAndConfirm") },
  ];
  return (
    <div className="bg-brand-background dark:bg-dark-brand-background py-6 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            disabled={isSubmitting}
            onClick={handleCancel}
          >
            {t("back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t(isEditMode ? "editProject" : "createNewProject")}
            </h1>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("setupJourney")}
            </p>
          </div>
        </div>
        {!isEditMode && (
          <div className="flex flex-wrap justify-between items-center gap-2 rounded-lg border border-brand-border dark:border-dark-brand-border p-3">
            <p role={wizard.draftStatus === "failed" ? "alert" : "status"}>
              {t(`setupDraft_${wizard.draftStatus}`)}
            </p>
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={async () => {
                if (
                  await useConfirmStore
                    .getState()
                    .confirm(
                      t("setupResetConfirm"),
                      t("setupReset"),
                      t("setupReset"),
                    )
                )
                  wizard.resetWizard();
              }}
            >
              {t("setupReset")}
            </Button>
          </div>
        )}
        {isEditMode && <p className="text-sm">{t("setupEditPreserves")}</p>}
        <MultiStepWizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={goToStep}
          onComplete={handleSubmit}
          onCancel={handleCancel}
          canGoNext={wizard.canProceedToNextStep() && validCurrentStep}
          isSubmitting={isSubmitting}
          completeLabel={t(isEditMode ? "saveChanges" : "createProject")}
          className="bg-brand-surface dark:bg-dark-brand-surface shadow rounded-xl"
        >
          <fieldset disabled={isSubmitting} className="min-w-0">
            {currentStep === 0 && (
              <Step1TemplateBasics
                {...shared}
                templates={templates}
                applyTemplate={wizard.applyTemplate}
              />
            )}
            {currentStep === 1 && (
              <Step2ProgramStandards
                {...shared}
                programs={programs}
                allStandards={standards}
                lockedProgram={isEditMode}
                conflictingIds={resolvedStandards.conflicts
                  .filter((record) => record.programId === data.programId)
                  .map((record) => record.standardId)}
              />
            )}
            {currentStep === 2 && (
              <Step3TeamTimeline
                {...shared}
                users={users}
                departments={departments}
                isEditMode={isEditMode}
              />
            )}
            {currentStep === 3 && (
              <Step4ReviewConfirm
                data={data}
                goToStep={goToStep}
                users={users}
                programs={programs}
                allStandards={standards}
                templates={templates}
                departments={departments}
                checklist={checklist}
              />
            )}
            {currentStep === 3 && Object.keys(errors).length > 0 && (
              <p role="alert">{t("setupReviewErrors")}</p>
            )}
            {currentStep === 0 && referenceErrors.templateId && (
              <div role="alert" className="space-y-2">
                <p>{t("setupTemplateUnavailable")}</p>
                <Button
                  onClick={() =>
                    updateData({ templateId: null, checklistItems: [] })
                  }
                >
                  {t("startFromScratch")}
                </Button>
              </div>
            )}
          </fieldset>
        </MultiStepWizard>
      </div>
    </div>
  );
};

const CreateProjectWizard: React.FC<Props> = (props) => {
  const organizationId = useTenantStore((state) => state.organizationId);
  const userId = useUserStore((state) => state.currentUser?.id);
  const exists = useProjectStore((state) =>
    state.projects.some((project) => project.id === props.projectId),
  );
  return (
    <ProjectSetup
      key={`${organizationId}:${userId}:${props.projectId || "create"}:${exists}`}
      {...props}
    />
  );
};
export default CreateProjectWizard;
