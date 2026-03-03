/**
 * Project Wizard — State Management Hook
 * Phase 1: Forms & Wizards Enhancement
 * 
 * Centralized state management for multi-step project creation wizard
 * Handles validation, step navigation, and data persistence
 */

import { ProjectTemplate } from '@/types/templates';
import { useCallback, useEffect, useState } from 'react';
import {
    validateStep1,
    validateStep2,
    validateStep3,
    ValidationResult
} from './projectValidation';

export interface WizardData {
    // Step 1: Template & Basics
    templateId: string | null;
    projectName: string;
    description: string;

    // Step 2: Program & Standards
    programId: string;
    standardIds: string[];

    // Step 3: Team & Timeline
    leadId: string;
    teamMemberIds: string[];
    teamMemberRoles: Record<string, string>; // userId -> role (A2)
    departmentIds: string[];
    startDate: Date | undefined;
    endDate: Date | undefined;

    // Step 4: Review
    checklistItems: any[];
    aiEnhanced: boolean;
}

const STORAGE_KEY = 'accreditex_project_wizard_draft';

const initialWizardData: WizardData = {
    templateId: null,
    projectName: '',
    description: '',
    programId: '',
    standardIds: [],
    leadId: '',
    teamMemberIds: [],
    teamMemberRoles: {},
    departmentIds: [],
    startDate: new Date(),
    endDate: undefined,
    checklistItems: [],
    aiEnhanced: false,
};

export interface UseProjectWizardOptions {
    initialData?: Partial<WizardData>;
    isEditMode?: boolean;
    editProjectId?: string;
}

export const useProjectWizard = (options: UseProjectWizardOptions = {}) => {
    const { initialData, isEditMode = false } = options;

    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<WizardData>(() => ({
        ...initialWizardData,
        ...initialData,
    }));
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Load saved draft on mount — only in create mode (not edit)
    useEffect(() => {
        if (isEditMode) return; // Skip draft restore in edit mode
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                // Convert date strings back to Date objects
                if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
                if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
                // Merge with initialWizardData to ensure all fields exist
                // (guards against old drafts missing newly added fields like teamMemberRoles)
                setData({ ...initialWizardData, ...parsed });
            } catch (error) {
                console.error('Failed to parse saved wizard draft:', error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save draft on data change (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [data]);

    /**
     * Update wizard data
     */
    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    }, []);

    /**
     * Mark field as touched (for validation display)
     */
    const touchField = useCallback((field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }, []);

    /**
     * Compute validation for the current step — PURE, no state updates.
     * Safe to call during render.
     */
    const computeCurrentStepValidation = useCallback((): ValidationResult => {
        switch (currentStep) {
            case 0:
                return validateStep1({ projectName: data.projectName, description: data.description });
            case 1:
                return validateStep2({ programId: data.programId, standardIds: data.standardIds });
            case 2:
                return validateStep3({ leadId: data.leadId, startDate: data.startDate, endDate: data.endDate });
            case 3:
                return { isValid: true, errors: {} };
            default:
                return { isValid: false, errors: {} };
        }
    }, [currentStep, data]);

    /**
     * Validate current step AND update validationErrors state.
     * Only call from event handlers (goToNextStep, goToStep) — NOT during render.
     */
    const validateCurrentStep = useCallback((): ValidationResult => {
        const result = computeCurrentStepValidation();
        setValidationErrors(result.errors);
        return result;
    }, [computeCurrentStepValidation]);

    /**
     * Check if can proceed to next step — pure, safe during render.
     */
    const canProceedToNextStep = useCallback((): boolean => {
        return computeCurrentStepValidation().isValid;
    }, [computeCurrentStepValidation]);

    /**
     * Go to next step (with validation)
     */
    const goToNextStep = useCallback(() => {
        if (canProceedToNextStep()) {
            setCurrentStep((prev) => Math.min(prev + 1, 3));
            setValidationErrors({});
        }
    }, [canProceedToNextStep]);

    /**
     * Go to previous step
     */
    const goToPreviousStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        setValidationErrors({});
    }, []);

    /**
     * Jump to specific step (only if previous steps are valid)
     */
    const goToStep = useCallback((step: number) => {
        if (step < currentStep) {
            // Allow going back
            setCurrentStep(step);
            setValidationErrors({});
        } else if (step > currentStep) {
            // Validate current step before jumping forward
            if (canProceedToNextStep()) {
                setCurrentStep(step);
                setValidationErrors({});
            }
        }
    }, [currentStep, canProceedToNextStep]);

    /**
     * Apply template data
     */
    const applyTemplate = useCallback((template: ProjectTemplate) => {
        const estimatedEndDate = template.estimatedDuration && data.startDate
            ? new Date(data.startDate.getTime() + template.estimatedDuration * 24 * 60 * 60 * 1000)
            : undefined;

        updateData({
            templateId: template.id,
            projectName: template.name,
            description: template.description || '',
            programId: template.programId || data.programId,
            checklistItems: template.checklist || [],
            endDate: estimatedEndDate,
        });

        // Auto-advance to step 2 if template has all basics
        if (template.name && template.description) {
            setCurrentStep(1);
        }
    }, [data.startDate, data.programId, updateData]);

    /**
     * Clear wizard (start fresh)
     */
    const resetWizard = useCallback(() => {
        setData(initialWizardData);
        setCurrentStep(0);
        setValidationErrors({});
        setTouched({});
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    /**
     * Clear saved draft
     */
    const clearDraft = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        // State
        currentStep,
        data,
        validationErrors,
        touched,

        // Actions
        updateData,
        touchField,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        applyTemplate,
        resetWizard,
        clearDraft,

        // Validation
        validateCurrentStep,
        canProceedToNextStep,
    };
};
