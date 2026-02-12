/**
 * Form Validation Utilities
 * Centralized validation rules for consistent form behavior
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type ValidatorFn = (value: any) => ValidationResult;

// Basic Validators
export const required = (message: string = "This field is required"): ValidatorFn => {
  return (value: any): ValidationResult => {
    const isEmpty = value === null || value === undefined || 
                    (typeof value === 'string' && value.trim() === '') ||
                    (Array.isArray(value) && value.length === 0);
    
    return {
      isValid: !isEmpty,
      error: isEmpty ? message : undefined
    };
  };
};

export const minLength = (min: number, message?: string): ValidatorFn => {
  return (value: string): ValidationResult => {
    if (!value) return { isValid: true }; // Let 'required' handle empty values
    
    const isValid = value.trim().length >= min;
    return {
      isValid,
      error: isValid ? undefined : (message || `Minimum ${min} characters required`)
    };
  };
};

export const maxLength = (max: number, message?: string): ValidatorFn => {
  return (value: string): ValidationResult => {
    if (!value) return { isValid: true };
    
    const isValid = value.trim().length <= max;
    return {
      isValid,
      error: isValid ? undefined : (message || `Maximum ${max} characters allowed`)
    };
  };
};

export const email = (message: string = "Please enter a valid email address"): ValidatorFn => {
  return (value: string): ValidationResult => {
    if (!value) return { isValid: true };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    
    return {
      isValid,
      error: isValid ? undefined : message
    };
  };
};

export const pattern = (regex: RegExp, message: string): ValidatorFn => {
  return (value: string): ValidationResult => {
    if (!value) return { isValid: true };
    
    const isValid = regex.test(value);
    return {
      isValid,
      error: isValid ? undefined : message
    };
  };
};

export const dateAfter = (compareDate: Date | undefined, message?: string): ValidatorFn => {
  return (value: Date | undefined): ValidationResult => {
    if (!value || !compareDate) return { isValid: true };
    
    const isValid = value > compareDate;
    return {
      isValid,
      error: isValid ? undefined : (message || "Date must be after the start date")
    };
  };
};

// Composite Validator - runs multiple validators
export const compose = (...validators: ValidatorFn[]): ValidatorFn => {
  return (value: any): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
};

// Async validator support
export type AsyncValidatorFn = (value: any) => Promise<ValidationResult>;

export const asyncCompose = (...validators: AsyncValidatorFn[]): AsyncValidatorFn => {
  return async (value: any): Promise<ValidationResult> => {
    for (const validator of validators) {
      const result = await validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
};

// Debounced validation helper
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
