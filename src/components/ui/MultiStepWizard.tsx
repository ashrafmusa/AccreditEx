/**
 * Multi-Step Wizard Component
 * Reusable wizard container for multi-step forms
 */

import React, { useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
}

interface MultiStepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  canGoNext?: boolean;
  canGoBack?: boolean;
  isSubmitting?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const MultiStepWizard: React.FC<MultiStepWizardProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  canGoNext = true,
  canGoBack = true,
  isSubmitting = false,
  children,
  className = '',
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else if (canGoNext) {
      onStepChange(currentStep + 1);
    }
  }, [currentStep, isLastStep, canGoNext, onStepChange, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstStep && canGoBack) {
      onStepChange(currentStep - 1);
    }
  }, [currentStep, isFirstStep, canGoBack, onStepChange]);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Only allow clicking on previous steps
    if (stepIndex < currentStep) {
      onStepChange(stepIndex);
    }
  }, [currentStep, onStepChange]);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = index < currentStep;

            return (
              <li
                key={step.id}
                className={`flex-1 ${index !== steps.length - 1 ? 'pr-8' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={`group flex flex-col border-l-4 py-2 pl-4 hover:border-l-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors ${
                    isCompleted
                      ? 'border-brand-primary cursor-pointer'
                      : isCurrent
                      ? 'border-brand-primary'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="flex items-center gap-3">
                    {/* Step Number/Checkmark */}
                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isCompleted
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : isCurrent
                          ? 'border-brand-primary bg-white dark:bg-gray-800 text-brand-primary'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="h-6 w-6" aria-hidden="true" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </span>

                    {/* Step Info */}
                    <div className="flex flex-col items-start text-left">
                      <span
                        className={`text-sm font-medium ${
                          isCurrent
                            ? 'text-brand-primary'
                            : isCompleted
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                        {step.isOptional && (
                          <span className="ml-2 text-xs text-gray-400">(Optional)</span>
                        )}
                      </span>
                      {step.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {step.description}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          {!isFirstStep && (
            <button
              type="button"
              onClick={handleBack}
              disabled={!canGoBack || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || isSubmitting}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isLastStep ? 'Creating...' : 'Processing...'}
              </>
            ) : (
              <>
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <ChevronRightIcon className="h-5 w-5 ml-2" aria-hidden="true" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Form Step Wrapper Component
 * Wrapper for individual steps in the wizard
 */
interface FormStepProps {
  stepId: string;
  children: React.ReactNode;
  className?: string;
}

export const FormStep: React.FC<FormStepProps> = ({
  stepId,
  children,
  className = '',
}) => {
  return (
    <div
      id={stepId}
      role="tabpanel"
      aria-labelledby={`${stepId}-tab`}
      className={`space-y-6 animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
};
