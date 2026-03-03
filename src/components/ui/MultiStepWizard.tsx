/**
 * Multi-Step Wizard Component
 * Reusable wizard container for multi-step forms
 */

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useCallback } from "react";

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
  className = "",
}) => {
  const { t } = useTranslation();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

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

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex < currentStep) {
        onStepChange(stepIndex);
      }
    },
    [currentStep, onStepChange],
  );

  return (
    <div className={`space-y-0 ${className}`}>
      {/* ── Progress Header ── */}
      <div className="px-6 pt-6 pb-5 border-b border-brand-border dark:border-dark-brand-border">
        {/* Step counter + label row */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("step") || "Step"} {currentStep + 1} {t("of") || "of"}{" "}
            {steps.length}
          </p>
          <p className="text-sm font-semibold text-brand-primary">
            {steps[currentStep]?.title}
          </p>
        </div>

        {/* Thin progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-5">
          <div
            className="bg-brand-primary h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          />
        </div>

        {/* Step bubbles */}
        <nav aria-label="Progress">
          <ol className="flex items-start justify-between gap-1">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = index < currentStep;

              return (
                <li key={step.id} className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={`w-full flex flex-col items-center text-center transition-opacity ${
                      isClickable
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-default"
                    }`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {/* Circle */}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 mb-1.5 ${
                        isCompleted
                          ? "border-brand-primary bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
                          : isCurrent
                            ? "border-brand-primary bg-brand-surface dark:bg-dark-brand-surface text-brand-primary ring-4 ring-brand-primary/10"
                            : "border-gray-300 dark:border-gray-600 bg-brand-surface dark:bg-dark-brand-surface text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </span>

                    {/* Label — hidden on very small screens */}
                    <span
                      className={`hidden sm:block text-xs font-medium leading-tight truncate max-w-full px-0.5 ${
                        isCurrent
                          ? "text-brand-primary"
                          : isCompleted
                            ? "text-brand-text-primary dark:text-dark-brand-text-primary"
                            : "text-brand-text-secondary dark:text-dark-brand-text-secondary"
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.isOptional && (
                      <span className="hidden sm:block text-xs text-gray-400 mt-0.5">
                        ({t("optional") || "Optional"})
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* ── Step Content ── */}
      <div className="px-6 py-6 min-h-[420px]">{children}</div>

      {/* ── Navigation Footer ── */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border dark:border-dark-brand-border bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary rounded-b-lg">
        {/* Back */}
        <div>
          {!isFirstStep ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBack}
              disabled={!canGoBack || isSubmitting}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {t("back") || "Back"}
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t("cancel") || "Cancel"}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNext}
            disabled={!canGoNext || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-0.5 mr-2 h-4 w-4"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isLastStep
                  ? t("creating") || "Creating..."
                  : t("processing") || "Processing..."}
              </>
            ) : isLastStep ? (
              <>
                <CheckIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {t("complete") || "Complete"}
              </>
            ) : (
              <>
                {t("next") || "Next"}
                <ChevronRightIcon
                  className="h-4 w-4 ml-1.5"
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
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
  className = "",
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
