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
    departmentIds: [],
    startDate: new Date(),
    endDate: undefined,
    checklistItems: [],
    aiEnhanced: false,
};

export const useProjectWizard = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<WizardData>(initialWizardData);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Load saved draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                // Convert date strings back to Date objects
                if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
                if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
                setData(parsed);
            } catch (error) {
                console.error('Failed to parse saved wizard draft:', error);
            }
        }
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
     * Validate current step
     */
    const validateCurrentStep = useCallback((): ValidationResult => {
        let result: ValidationResult;

        switch (currentStep) {
            case 0: // Step 1
                result = validateStep1({
                    projectName: data.projectName,
                    description: data.description,
                });
                break;
            case 1: // Step 2
                result = validateStep2({
                    programId: data.programId,
                    standardIds: data.standardIds,
                });
                break;
            case 2: // Step 3
                result = validateStep3({
                    leadId: data.leadId,
                    startDate: data.startDate,
                    endDate: data.endDate,
                });
                break;
            case 3: // Step 4 (Review - no validation needed)
                result = { isValid: true, errors: {} };
                break;
            default:
                result = { isValid: false, errors: {} };
        }

        setValidationErrors(result.errors);
        return result;
    }, [currentStep, data]);

    /**
     * Check if can proceed to next step
     */
    const canProceedToNextStep = useCallback((): boolean => {
        const validation = validateCurrentStep();
        return validation.isValid;
    }, [validateCurrentStep]);

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
