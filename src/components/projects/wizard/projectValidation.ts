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
    return "setupNameRequired";
  }

  if (trimmed.length < 3) {
    return "setupNameShort";
  }

  if (trimmed.length > 200) {
    return "setupNameLong";
  }

  // Check for invalid characters (optional)
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmed)) {
    return "setupNameInvalid";
  }

  return null;
};

/**
 * Validate project description (Step 1)
 */
export const validateDescription = (description: string): string | null => {
  if (description.length > 1000) {
    return "setupDescriptionLong";
  }

  return null;
};

/**
 * Validate program selection (Step 2)
 */
export const validateProgram = (programId: string): string | null => {
  if (!programId || programId.trim() === "") {
    return "setupProgramRequired";
  }

  return null;
};

/**
 * Validate standards selection (Step 2)
 */
export const validateStandards = (standardIds: string[]): string | null => {
  if (standardIds.length === 0) {
    return "setupStandardsRequired";
  }

  return null;
};

/**
 * Validate project lead selection (Step 3)
 */
export const validateProjectLead = (leadId: string): string | null => {
  if (!leadId || leadId.trim() === "") {
    return "setupLeadRequired";
  }

  return null;
};

/**
 * Validate start date (Step 3)
 */
export const validateStartDate = (
  startDate: Date | undefined,
  allowPast = false,
): string | null => {
  if (!startDate) {
    return "setupStartRequired";
  }
  if (!Number.isFinite(startDate.getTime())) return "setupDateInvalid";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(startDate);
  selectedDate.setHours(0, 0, 0, 0);

  if (!allowPast && selectedDate < today) {
    return "setupStartPast";
  }

  return null;
};

/**
 * Validate end date (Step 3)
 */
export const validateEndDate = (
  startDate: Date | undefined,
  endDate: Date | undefined,
): string | null => {
  // End date is optional
  if (!endDate) {
    return null;
  }

  if (!startDate) {
    return "setupStartRequired";
  }
  if (
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime())
  )
    return "setupDateInvalid";

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (end <= start) {
    return "setupEndOrder";
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
export const validateStep3 = (
  data: {
    leadId: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  },
  allowPast = false,
): ValidationResult => {
  const errors: Record<string, string> = {};

  const leadError = validateProjectLead(data.leadId);
  if (leadError) errors.leadId = leadError;

  const startError = validateStartDate(data.startDate, allowPast);
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
export const validateAllSteps = (
  data: {
    projectName: string;
    description: string;
    programId: string;
    standardIds: string[];
    leadId: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  },
  allowPast = false,
): ValidationResult => {
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

  const startError = validateStartDate(data.startDate, allowPast);
  if (startError) errors.startDate = startError;

  const endError = validateEndDate(data.startDate, data.endDate);
  if (endError) errors.endDate = endError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
