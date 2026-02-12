import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@/components/icons";

export interface TutorialStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  targetSelector?: string;
  highlight?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
}

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip?: () => void;
  enabled?: boolean;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  steps,
  onComplete,
  onSkip,
  enabled = true,
}) => {
  const { t, dir } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(enabled);
  const [targetPosition, setTargetPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];

    if (step.targetSelector) {
      const targetElement = document.querySelector(step.targetSelector);

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });

        // Scroll to target element
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetPosition(null);
    }
  }, [currentStep, isActive, steps]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    setIsActive(false);
    onComplete();
  };

  const skipTutorial = () => {
    setIsActive(false);
    if (onSkip) {
      onSkip();
    }
  };

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={skipTutorial}
      >
        {targetPosition && (
          <div
            className="absolute rounded-lg border-2 border-brand-primary shadow-2xl"
            style={{
              top: targetPosition.top,
              left: targetPosition.left,
              width: targetPosition.width,
              height: targetPosition.height,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              zIndex: 1001,
            }}
          />
        )}
      </div>

      {/* Tutorial Card */}
      <div
        className="absolute z-[1002] bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md"
        style={{
          top: targetPosition
            ? targetPosition.top + targetPosition.height + 16
            : "50%",
          left: targetPosition ? targetPosition.left : "50%",
          transform: targetPosition ? "none" : "translate(-50%, -50%)",
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t(currentStepData.titleKey)}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {currentStep + 1} / {steps.length}
            </p>
          </div>
          <button
            onClick={skipTutorial}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {t(currentStepData.descriptionKey)}
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={previousStep}
            disabled={currentStep === 0}
            variant="ghost"
            size="sm"
          >
            {dir === "ltr" ? (
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 mr-1" />
            )}
            {t("previous")}
          </Button>

          <Button onClick={nextStep} className="flex-1">
            {currentStep === steps.length - 1 ? t("finish") : t("next")}
            {dir === "ltr" && currentStep < steps.length - 1 && (
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            )}
            {dir === "rtl" && currentStep < steps.length - 1 && (
              <ChevronLeftIcon className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTutorial;
