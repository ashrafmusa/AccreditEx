import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import {
  LogoIcon,
  ChartPieIcon,
  FolderIcon,
  UsersIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@/components/icons";

export interface OnboardingModalProps {
  /**
   * Controls the visibility of the modal
   */
  isOpen: boolean;

  /**
   * Callback when the onboarding is completed or closed
   */
  onComplete: () => void;

  /**
   * Optional: Start from a specific step (0-indexed)
   */
  initialStep?: number;

  /**
   * Optional: Show close button in modal header
   */
  allowDismiss?: boolean;
}

interface OnboardingStep {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * OnboardingModal - Interactive walkthrough for new users
 *
 * Features:
 * - Multi-step onboarding flow
 * - Smooth animations between steps
 * - Progress indicators
 * - Keyboard navigation
 * - Responsive design
 * - Dark mode support
 * - Accessibility compliant
 *
 * @example
 * ```tsx
 * const [showOnboarding, setShowOnboarding] = useState(true);
 *
 * <OnboardingModal
 *   isOpen={showOnboarding}
 *   onComplete={() => setShowOnboarding(false)}
 *   allowDismiss={true}
 * />
 * ```
 */
export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialStep = 0,
  allowDismiss = false,
}) => {
  const { t, dir } = useTranslation();

  const steps: OnboardingStep[] = [
    {
      icon: LogoIcon,
      titleKey: "welcomeToAccreditEx",
      descriptionKey: "onboardingWelcomeMessage",
    },
    {
      icon: ChartPieIcon,
      titleKey: "onboardingDashboardTitle",
      descriptionKey: "onboardingDashboardMessage",
    },
    {
      icon: FolderIcon,
      titleKey: "onboardingProjectsTitle",
      descriptionKey: "onboardingProjectsMessage",
    },
    {
      icon: ShieldCheckIcon,
      titleKey: "onboardingAccreditationTitle",
      descriptionKey: "onboardingAccreditationMessage",
    },
    {
      icon: UsersIcon,
      titleKey: "onboardingUsersTitle",
      descriptionKey: "onboardingUsersMessage",
    },
    {
      icon: SparklesIcon,
      titleKey: "onboardingAiTitle",
      descriptionKey: "onboardingAiMessage",
    },
  ];

  // Clamp initialStep to valid range to prevent out-of-bounds errors
  const clampedInitialStep = Math.max(
    0,
    Math.min(initialStep, steps.length - 1),
  );
  const [currentStep, setCurrentStep] = useState(clampedInitialStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const CurrentIcon = steps[currentStep].icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleClose = () => {
    if (allowDismiss) {
      onComplete();
    }
  };

  const footer = (
    <div className="flex items-center justify-between w-full gap-4">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {steps.map((_, index) => (
          <button
            key={`step-${index}`}
            onClick={() => handleStepClick(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentStep
                ? "bg-brand-primary scale-125 ring-2 ring-brand-primary ring-opacity-30"
                : index < currentStep
                  ? "bg-brand-primary opacity-50 hover:opacity-75"
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
            aria-label={`${t("goToStep")} ${index + 1}`}
            aria-current={index === currentStep ? "step" : undefined}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePrevious}
          disabled={isFirstStep}
          variant="ghost"
          size="sm"
          aria-label={t("previousStep")}
        >
          {dir === "ltr" ? (
            <>
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              {t("previous")}
            </>
          ) : (
            <>
              {t("previous")}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>

        <Button
          onClick={handleNext}
          variant={isLastStep ? "primary" : "primary"}
          size="sm"
          aria-label={isLastStep ? t("finishOnboarding") : t("nextStep")}
        >
          {isLastStep ? (
            <>
              <CheckIcon className="w-4 h-4 mr-1" />
              {t("getStarted")}
            </>
          ) : dir === "ltr" ? (
            <>
              {t("next")}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              {t("next")}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("gettingStarted")}
      footer={footer}
      size="lg"
    >
      <div className="py-4">
        {/* Step content with animation */}
        <div
          key={currentStep}
          className="animate-[fadeInUp_0.3s_ease-out] text-center"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20">
              <CurrentIcon className="w-12 h-12 text-brand-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
            {t(steps[currentStep].titleKey)}
          </h2>

          {/* Description */}
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary max-w-md mx-auto leading-relaxed">
            {t(steps[currentStep].descriptionKey)}
          </p>

          {/* Progress indicator text */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("step")} {currentStep + 1} {t("of")} {steps.length}
            </p>
          </div>

          {/* Optional custom action button */}
          {steps[currentStep].action && (
            <div className="mt-4">
              <Button
                onClick={steps[currentStep].action!.onClick}
                variant="outline"
                size="sm"
              >
                {steps[currentStep].action!.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingModal;
