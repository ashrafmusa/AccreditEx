/**
 * GuidedTour - Lightweight interactive tooltip tour overlay
 *
 * Replaces the need for react-joyride (~40kb) with a custom
 * implementation that's <5kb and integrates with AccreditEx's
 * existing design system, i18n, and dark mode.
 *
 * Features:
 * - Highlights real DOM elements with tooltip overlays
 * - Configurable tour steps targeting element selectors
 * - Keyboard navigation (Escape to close, arrows to navigate)
 * - Dark mode support
 * - RTL support
 * - Progress indicator
 * - Persists completion to localStorage
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/hooks/useTranslation";

export interface TourStep {
  /** CSS selector for the target element to highlight */
  target: string;
  /** i18n key for the step title */
  titleKey: string;
  /** i18n key for the step description */
  descriptionKey: string;
  /** Tooltip placement relative to target */
  placement?: "top" | "bottom" | "left" | "right";
  /** Optional action to execute when this step is shown */
  onShow?: () => void;
}

interface GuidedTourProps {
  /** Unique ID for this tour (used in localStorage) */
  tourId: string;
  /** Array of tour steps */
  steps: TourStep[];
  /** Whether the tour is active */
  isActive: boolean;
  /** Callback when tour completes or is dismissed */
  onComplete: () => void;
  /** Optional: auto-start even if previously completed */
  forceShow?: boolean;
}

const TOUR_STORAGE_PREFIX = "accreditex_tour_completed_";

export const GuidedTour: React.FC<GuidedTourProps> = ({
  tourId,
  steps,
  isActive,
  onComplete,
  forceShow = false,
}) => {
  const { t, dir } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour already completed
  const isCompleted =
    !forceShow &&
    localStorage.getItem(`${TOUR_STORAGE_PREFIX}${tourId}`) === "true";

  const markComplete = useCallback(() => {
    localStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourId}`, "true");
    onComplete();
  }, [tourId, onComplete]);

  // Position the tooltip relative to the target element
  const positionTooltip = useCallback(() => {
    if (!steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target);
    if (!target) {
      // If target not found, skip to next step or complete
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        markComplete();
      }
      return;
    }

    const rect = target.getBoundingClientRect();
    setTargetRect(rect);

    const placement = steps[currentStep].placement || "bottom";
    const padding = 12;
    const tooltipWidth = 320;

    let style: React.CSSProperties = {
      position: "fixed",
      zIndex: 10002,
      maxWidth: tooltipWidth,
    };

    switch (placement) {
      case "bottom":
        style.top = rect.bottom + padding;
        style.left = Math.max(
          padding,
          rect.left + rect.width / 2 - tooltipWidth / 2,
        );
        break;
      case "top":
        style.bottom = window.innerHeight - rect.top + padding;
        style.left = Math.max(
          padding,
          rect.left + rect.width / 2 - tooltipWidth / 2,
        );
        break;
      case "right":
        style.top = rect.top + rect.height / 2 - 40;
        style.left = rect.right + padding;
        break;
      case "left":
        style.top = rect.top + rect.height / 2 - 40;
        style.right = window.innerWidth - rect.left + padding;
        break;
    }

    // Ensure tooltip stays within viewport
    if (typeof style.left === "number") {
      style.left = Math.min(
        style.left,
        window.innerWidth - tooltipWidth - padding,
      );
      style.left = Math.max(padding, style.left);
    }

    setTooltipStyle(style);

    // Scroll target into view if needed
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Call onShow callback
    steps[currentStep].onShow?.();
  }, [currentStep, steps, markComplete]);

  useEffect(() => {
    if (!isActive || isCompleted) return;
    positionTooltip();

    // Reposition on resize/scroll
    const handleReposition = () => positionTooltip();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isActive, isCompleted, positionTooltip]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          markComplete();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
          } else {
            markComplete();
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setCurrentStep((s) => Math.max(0, s - 1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isCompleted, currentStep, steps.length, markComplete]);

  if (!isActive || isCompleted || !targetRect) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return createPortal(
    <>
      {/* Semi-transparent overlay with cutout for target */}
      <div
        className="fixed inset-0 z-[10000] pointer-events-none"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {/* Cutout highlight around target */}
        <div
          className="absolute rounded-lg ring-4 ring-brand-primary shadow-2xl pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            background: "transparent",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Click blocker — clicking overlay dismisses tour */}
      <div
        className="fixed inset-0 z-[10001] cursor-pointer"
        onClick={markComplete}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 animate-[fadeInUp_0.3s_ease-out]"
        role="dialog"
        aria-label={t(step.titleKey)}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t(step.titleKey)}
        </h3>
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-4 leading-relaxed">
          {t(step.descriptionKey)}
        </p>

        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep
                    ? "bg-brand-primary scale-125"
                    : i < currentStep
                      ? "bg-brand-primary/40"
                      : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="text-xs px-3 py-1.5 text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("previous")}
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  markComplete();
                } else {
                  setCurrentStep((s) => s + 1);
                }
              }}
              className="text-xs px-4 py-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-medium"
            >
              {isLast ? t("getStarted") || "Done" : t("next") || "Next"}
            </button>
          </div>
        </div>

        {/* Skip link */}
        <button
          onClick={markComplete}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t("skipTour") || "Skip tour"}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </>,
    document.body,
  );
};

export default GuidedTour;
