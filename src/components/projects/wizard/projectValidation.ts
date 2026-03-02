/**
 * Project Wizard — Real-Time Validation Rules
 * Phase 1: Forms & Wizards Enhancement
 * 
 * Provides field-level validation with immediate feedback
 * Eliminates submit-fail loops with real-time error detection
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validate project name (Step 1)
 */
export const validateProjectName = (name: string): string | null => {
    const trimmed = name.trim();

    if (!trimmed) {
        return 'Project name is required';
    }

    if (trimmed.length < 3) {
        return 'Project name must be at least 3 characters';
    }

    if (trimmed.length > 200) {
        return 'Project name must not exceed 200 characters';
    }

    // Check for invalid characters (optional)
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmed)) {
        return 'Project name contains invalid characters';
    }

    return null;
};

/**
 * Validate project description (Step 1)
 */
export const validateDescription = (description: string): string | null => {
    if (description.length > 1000) {
        return 'Description must not exceed 1000 characters';
    }

    return null;
};

/**
 * Validate program selection (Step 2)
 */
export const validateProgram = (programId: string): string | null => {
    if (!programId || programId.trim() === '') {
        return 'Please select an accreditation program';
    }

    return null;
};

/**
 * Validate standards selection (Step 2)
 */
export const validateStandards = (standardIds: string[]): string | null => {
    if (standardIds.length === 0) {
        return 'Please select at least one standard';
    }

    return null;
};

/**
 * Validate project lead selection (Step 3)
 */
export const validateProjectLead = (leadId: string): string | null => {
    if (!leadId || leadId.trim() === '') {
        return 'Please select a project lead';
    }

    return null;
};

/**
 * Validate start date (Step 3)
 */
export const validateStartDate = (startDate: Date | undefined): string | null => {
    if (!startDate) {
        return 'Start date is required';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(startDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return 'Start date cannot be in the past';
    }

    return null;
};

/**
 * Validate end date (Step 3)
 */
export const validateEndDate = (
    startDate: Date | undefined,
    endDate: Date | undefined
): string | null => {
    // End date is optional
    if (!endDate) {
        return null;
    }

    if (!startDate) {
        return 'Please select a start date first';
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end <= start) {
        return 'End date must be after start date';
    }

    // Warn if project duration is too short (< 7 days)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return 'Warning: Project duration is less than 7 days';
    }

    return null;
};

/**
 * Validate entire Step 1
 */
export const validateStep1 = (data: {
    projectName: string;
    description: string;
}): ValidationResult => {
    const errors: Record<string, string> = {};

    const nameError = validateProjectName(data.projectName);
    if (nameError) errors.projectName = nameError;

    const descError = validateDescription(data.description);
    if (descError) errors.description = descError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Validate entire Step 2
 */
export const validateStep2 = (data: {
    programId: string;
    standardIds: string[];
}): ValidationResult => {
    const errors: Record<string, string> = {};

    const programError = validateProgram(data.programId);
    if (programError) errors.programId = programError;

    const standardsError = validateStandards(data.standardIds);
    if (standardsError) errors.standardIds = standardsError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Validate entire Step 3
 */
export const validateStep3 = (data: {
    leadId: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
}): ValidationResult => {
    const errors: Record<string, string> = {};

    const leadError = validateProjectLead(data.leadId);
    if (leadError) errors.leadId = leadError;

    const startError = validateStartDate(data.startDate);
    if (startError) errors.startDate = startError;

    const endError = validateEndDate(data.startDate, data.endDate);
    if (endError) errors.endDate = endError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Validate all wizard data
 */
export const validateAllSteps = (data: {
    projectName: string;
    description: string;
    programId: string;
    standardIds: string[];
    leadId: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
}): ValidationResult => {
    const errors: Record<string, string> = {};

    // Step 1
    const nameError = validateProjectName(data.projectName);
    if (nameError) errors.projectName = nameError;

    const descError = validateDescription(data.description);
    if (descError) errors.description = descError;

    // Step 2
    const programError = validateProgram(data.programId);
    if (programError) errors.programId = programError;

    const standardsError = validateStandards(data.standardIds);
    if (standardsError) errors.standardIds = standardsError;

    // Step 3
    const leadError = validateProjectLead(data.leadId);
    if (leadError) errors.leadId = leadError;

    const startError = validateStartDate(data.startDate);
    if (startError) errors.startDate = startError;

    const endError = validateEndDate(data.startDate, data.endDate);
    if (endError) errors.endDate = endError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
