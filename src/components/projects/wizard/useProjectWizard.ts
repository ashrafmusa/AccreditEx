import { ChecklistItem } from "@/types";
import { ChecklistItemTemplate, ProjectTemplate } from "@/types/templates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  validateAllSteps,
  validateStep1,
  validateStep2,
  validateStep3,
} from "./projectValidation";

export interface WizardData {
  templateId: string | null;
  projectName: string;
  description: string;
  programId: string;
  standardIds: string[];
  leadId: string;
  teamMemberIds: string[];
  teamMemberRoles: Record<string, string>;
  departmentIds: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  checklistItems: (ChecklistItem | ChecklistItemTemplate)[];
  aiEnhanced: boolean;
}

const freshData = (): WizardData => ({
  templateId: null,
  projectName: "",
  description: "",
  programId: "",
  standardIds: [],
  leadId: "",
  teamMemberIds: [],
  teamMemberRoles: {},
  departmentIds: [],
  startDate: new Date(),
  endDate: undefined,
  checklistItems: [],
  aiEnhanced: false,
});

function restoreDraft(text: string): WizardData {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object")
    throw new Error("Invalid project draft");
  const draft = value as Record<string, unknown>;
  const strings = [
    "projectName",
    "description",
    "programId",
    "leadId",
  ] as const;
  const arrays = ["standardIds", "teamMemberIds", "departmentIds"] as const;
  if (
    strings.some((key) => typeof draft[key] !== "string") ||
    arrays.some(
      (key) =>
        !Array.isArray(draft[key]) ||
        !draft[key].every((id: unknown) => typeof id === "string"),
    )
  ) {
    throw new Error("Invalid project draft fields");
  }
  const data = freshData();
  for (const key of strings) data[key] = draft[key] as string;
  for (const key of arrays) data[key] = draft[key] as string[];
  data.templateId =
    typeof draft.templateId === "string" ? draft.templateId : null;
  if (draft.teamMemberRoles && typeof draft.teamMemberRoles === "object") {
    data.teamMemberRoles = Object.fromEntries(
      Object.entries(draft.teamMemberRoles).filter(
        ([id, role]) =>
          data.teamMemberIds.includes(id) && typeof role === "string",
      ),
    );
  }
  for (const key of ["startDate", "endDate"] as const) {
    data[key] =
      typeof draft[key] === "string" ? new Date(draft[key]) : undefined;
    if (data[key] && !Number.isFinite(data[key].getTime()))
      throw new Error("Invalid project draft date");
  }
  return data;
}

export interface UseProjectWizardOptions {
  initialData?: Partial<WizardData>;
  isEditMode?: boolean;
  editProjectId?: string;
  draftKey?: string;
}

export const useProjectWizard = ({
  initialData,
  isEditMode = false,
  draftKey,
}: UseProjectWizardOptions = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => ({
    ...freshData(),
    ...initialData,
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [draftStatus, setDraftStatus] = useState<
    "new" | "restored" | "saved" | "failed"
  >("new");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completed = useRef(false);

  useEffect(() => {
    if (isEditMode || !draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        setData(restoreDraft(saved));
        setDraftStatus("restored");
      }
    } catch (error) {
      console.error("Project draft could not be restored:", error);
      completed.current = true;
      setDraftStatus("failed");
    }
  }, [draftKey, isEditMode]);

  useEffect(() => {
    if (isEditMode || !draftKey || completed.current) return;
    timer.current = setTimeout(() => {
      try {
        const { checklistItems, ...draft } = data;
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftStatus("saved");
      } catch (error) {
        console.error("Project draft could not be saved:", error);
        setDraftStatus("failed");
      }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [data, draftKey, isEditMode]);

  const validation = useMemo(
    () => validateAllSteps(data, isEditMode),
    [data, isEditMode],
  );
  const stepResults = [
    validateStep1(data),
    validateStep2(data),
    validateStep3(data, isEditMode),
    validation,
  ];
  const updateData = useCallback((updates: Partial<WizardData>) => {
    completed.current = false;
    setData((prev) => ({ ...prev, ...updates }));
  }, []);
  const touchField = useCallback(
    (field: string) => setTouched((prev) => ({ ...prev, [field]: true })),
    [],
  );
  const goToStep = (step: number) => {
    if (!Number.isInteger(step) || step < 0 || step > 3) return;
    if (step > currentStep) {
      const errors = Object.assign(
        {},
        ...stepResults.slice(0, step).map((result) => result.errors),
      );
      if (Object.keys(errors).length) {
        setTouched((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.keys(errors).map((key) => [key, true])),
        }));
        return;
      }
    }
    setCurrentStep(step);
  };
  const clearDraft = () => {
    completed.current = true;
    clearTimeout(timer.current);
    if (!draftKey || isEditMode) return;
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error("Project draft could not be cleared:", error);
      setDraftStatus("failed");
    }
  };
  const saveDraft = () => {
    if (!draftKey || isEditMode || completed.current) return;
    clearTimeout(timer.current);
    try {
      const { checklistItems, ...draft } = data;
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setDraftStatus("saved");
    } catch (error) {
      console.error("Project draft could not be saved:", error);
      setDraftStatus("failed");
    }
  };
  const resetWizard = () => {
    clearDraft();
    setData(freshData());
    setCurrentStep(0);
    setTouched({});
    setDraftStatus("new");
  };
  const applyTemplate = (template: ProjectTemplate) => {
    updateData({
      templateId: template.id,
      projectName: template.name,
      description: template.description,
      programId: template.programId,
      standardIds: [],
      checklistItems: template.checklist,
      endDate:
        data.startDate && template.estimatedDuration
          ? new Date(
              data.startDate.getTime() + template.estimatedDuration * 86400000,
            )
          : undefined,
    });
    setCurrentStep(1);
  };
  return {
    currentStep,
    data,
    touched,
    validationErrors: validation.errors,
    draftStatus,
    updateData,
    touchField,
    goToStep,
    saveDraft,
    goToNextStep: () => goToStep(currentStep + 1),
    goToPreviousStep: () => goToStep(currentStep - 1),
    applyTemplate,
    resetWizard,
    clearDraft,
    canProceedToNextStep: () => stepResults[currentStep].isValid,
    validateCurrentStep: () => stepResults[currentStep],
  };
};
