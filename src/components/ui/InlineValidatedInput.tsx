/**
 * Inline Validated Input Component
 * Enhanced input with real-time validation and visual feedback
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ValidatorFn, ValidationResult, debounce } from '@/utils/formValidation';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface InlineValidatedInputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  validators?: ValidatorFn[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showSuccessIcon?: boolean;
  validateOn?: 'blur' | 'change' | 'both';
  debounceMs?: number;
  maxLength?: number;
  showCharCount?: boolean;
  autoFocus?: boolean;
}

export const InlineValidatedInput: React.FC<InlineValidatedInputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  onValidationChange,
  validators = [],
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  showSuccessIcon = true,
  validateOn = 'blur',
  debounceMs = 500,
  maxLength,
  showCharCount = false,
  autoFocus = false,
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Run validation
  const validate = useCallback((val: string): ValidationResult => {
    if (validators.length === 0) {
      return { isValid: true };
    }

    for (const validator of validators) {
      const result = validator(val);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }, [validators]);

  // Debounced validation for onChange
  const debouncedValidate = useCallback(
    debounce((val: string) => {
      const result = validate(val);
      setValidationResult(result);
      onValidationChange?.(result.isValid, result.error);
    }, debounceMs),
    [validate, onValidationChange, debounceMs]
  );

  // Handle blur event
  const handleBlur = () => {
    setIsTouched(true);
    setIsFocused(false);

    if (validateOn === 'blur' || validateOn === 'both') {
      const result = validate(value);
      setValidationResult(result);
      onValidationChange?.(result.isValid, result.error);
    }
  };

  // Handle focus event
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle change event
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (isTouched && (validateOn === 'change' || validateOn === 'both')) {
      debouncedValidate(newValue);
    }
  };

  // Validate on mount if there's an initial value
  useEffect(() => {
    if (value && validators.length > 0) {
      const result = validate(value);
      setValidationResult(result);
      onValidationChange?.(result.isValid, result.error);
    }
  }, []); // Only run on mount

  const hasError = isTouched && !validationResult.isValid;
  const showSuccess = isTouched && validationResult.isValid && value && showSuccessIcon;
  const showCharCounter = showCharCount && maxLength;
  const charCountClass = maxLength && value.length > maxLength * 0.8
    ? value.length > maxLength * 0.95
      ? 'text-red-500'
      : 'text-yellow-500'
    : 'text-gray-400';

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 transition-colors
            disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            ${hasError
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : showSuccess
              ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary'
            }
            ${showSuccess || hasError ? 'pr-10' : ''}
            ${className}
          `}
        />

        {/* Success Icon */}
        {showSuccess && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && validationResult.error && (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {validationResult.error}
        </p>
      )}

      {/* Character Counter */}
      {showCharCounter && (
        <p className={`text-xs ${charCountClass}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};
