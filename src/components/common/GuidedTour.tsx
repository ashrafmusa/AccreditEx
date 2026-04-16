/**
 * Guided Tour System - Onboarding & Feature Discovery
 *
 * Provides interactive step-by-step tours to help users
 * discover features and learn workflows.
 *
 * Uses data-tour attributes on elements for targeting.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { useTranslation } from "@/hooks/useTranslation";
import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "../icons";

export interface TourStep {
  /** CSS selector or data-tour attribute value (e.g., '[data-tour="create-button"]') */
  target: string;
  /** Step title */
  title: string;
  /** Step description/instructions */
  content: string;
  /** Optional: placement (default: 'bottom') */
  placement?: "top" | "bottom" | "left" | "right";
  /** Optional: action text (default: 'Got it') */
  actionLabel?: string;
}

export interface TourConfig {
  /** Unique tour ID (used for localStorage tracking) */
  id: string;
  /** Tour steps */
  steps: TourStep[];
  /** Show tour automatically on component mount */
  autoStart?: boolean;
  /** Allow dismissing the tour */
  allowDismiss?: boolean;
}

interface GuidedTourProps {
  config: TourConfig;
  enabled: boolean;
  onComplete?: () => void;
  onDismiss?: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({
  config,
  enabled,
  onComplete,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // Check if tour was completed in localStorage
  const storageKey = `tour_completed_${config.id}`;
  const isCompleted = localStorage.getItem(storageKey) === "true";

  useEffect(() => {
    if (enabled && !isCompleted && config.autoStart) {
      setIsActive(true);
    }
  }, [enabled, isCompleted, config.autoStart]);

  // Update target element position
  const updateTargetRect = useCallback(() => {
    if (!isActive || !config.steps[currentStep]) return;

    const step = config.steps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;

    if (element) {
      setTargetElement(element);
      setTargetRect(element.getBoundingClientRect());

      // Scroll element into view if not visible
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Add highlight class
      element.classList.add("tour-highlight");
    } else {
      console.warn(
        `Tour step ${currentStep}: Target "${step.target}" not found`,
      );
    }

    return () => {
      if (element) {
        element.classList.remove("tour-highlight");
      }
    };
  }, [isActive, currentStep, config.steps]);

  useEffect(() => {
    const cleanup = updateTargetRect();

    // Update on window resize/scroll
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
      if (targetElement) {
        targetElement.classList.remove("tour-highlight");
      }
      cleanup?.();
    };
  }, [updateTargetRect, targetElement]);

  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsActive(false);
    onComplete?.();
  };

  const handleDismiss = () => {
    setIsActive(false);
    onDismiss?.();
  };

  if (!isActive || !enabled || isCompleted) return null;

  const step = config.steps[currentStep];
  if (!step || !targetRect) return null;

  // Calculate tooltip position based on placement
  const getTooltipStyle = (): React.CSSProperties => {
    const placement = step.placement || "bottom";
    const offset = 16;
    const tooltipWidth = 360;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = targetRect.top - offset;
        left = targetRect.left + targetRect.width / 2;
        break;
      case "bottom":
        top = targetRect.bottom + offset;
        left = targetRect.left + targetRect.width / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - offset;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + offset;
        break;
    }

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      transform:
        placement === "left" || placement === "right"
          ? "translate(-50%, -50%)"
          : placement === "top"
            ? "translate(-50%, -100%)"
            : "translate(-50%, 0)",
      zIndex: 10000,
      width: `${tooltipWidth}px`,
    };
  };

  return (
    <>
      {/* Backdrop with spotlight effect */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{
          zIndex: 9998,
          clipPath: targetRect
            ? `polygon(
                0% 0%, 0% 100%, 100% 100%, 100% 0%,
                ${targetRect.left - 8}px ${targetRect.top - 8}px,
                ${targetRect.left - 8}px ${targetRect.bottom + 8}px,
                ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
                ${targetRect.right + 8}px ${targetRect.top - 8}px,
                ${targetRect.left - 8}px ${targetRect.top - 8}px
              )`
            : undefined,
        }}
        onClick={config.allowDismiss ? handleDismiss : undefined}
      />

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="fixed z-9999 pointer-events-none"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            border: "3px solid rgb(59, 130, 246)",
            borderRadius: "8px",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
        className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {step.title}
              </h3>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("step")} {currentStep + 1} {t("of")} {config.steps.length}
              </p>
            </div>
          </div>
          {config.allowDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t("close")}
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-4 leading-relaxed">
          {step.content}
        </p>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {config.steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentStep
                  ? "w-6 bg-blue-500"
                  : index < currentStep
                    ? "w-1.5 bg-blue-300"
                    : "w-1.5 bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {t("previous") || "Previous"}
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {currentStep === config.steps.length - 1 ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                {step.actionLabel || t("finish") || "Finish"}
              </>
            ) : (
              <>
                {step.actionLabel || t("next") || "Next"}
                <ChevronRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* CSS for highlight animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.6;
            }
          }
          
          .tour-highlight {
            position: relative;
            z-index: 9999 !important;
          }
        `}
      </style>
    </>
  );
};

export default GuidedTour;
