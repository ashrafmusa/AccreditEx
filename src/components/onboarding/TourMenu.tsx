/**
 * Tour Menu Component
 *
 * Allows users to discover, start, and replay tours
 * - Organized by category
 * - Shows completion status and estimated duration
 * - One-click launch
 * - Shows badges earned
 */

import { useTourManager } from "@/hooks/useTourManager";
import { useTranslation } from "@/hooks/useTranslation";
import { getToursByCategory, TourCategory } from "@/utils/tourRegistry";
import React from "react";

interface TourMenuProps {
  onTourStart?: (tourId: string) => void;
}

const CATEGORY_LABELS: Record<TourCategory, string> = {
  onboarding: "🚀 Getting Started",
  feature: "✨ Features",
  "role-specific": "👤 Your Role",
  "program-specific": "📋 Your Program",
};

const CATEGORY_ICONS: Record<TourCategory, string> = {
  onboarding: "🚀",
  feature: "✨",
  "role-specific": "👤",
  "program-specific": "📋",
};

export const TourMenu: React.FC<TourMenuProps> = ({ onTourStart }) => {
  const { t } = useTranslation();
  const tourManager = useTourManager();
  const categories: TourCategory[] = [
    "onboarding",
    "role-specific",
    "program-specific",
    "feature",
  ];

  const handleStartTour = (tourId: string) => {
    tourManager.startTour(tourId);
    onTourStart?.(tourId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t("availableTours") || "Available Tours"}
        </h3>
        <p className="text-sm text-brand-text-tertiary dark:text-dark-brand-text-tertiary">
          {t("tourMenuDescription") ||
            "Guided tours to help you master AccrediTex"}
        </p>
      </div>

      {categories.map((category) => {
        const toursInCategory = getToursByCategory(category).filter((t) =>
          tourManager.getAvailableTours().some((at) => at.id === t.id),
        );

        if (toursInCategory.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider">
              {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
            </h4>
            <div className="space-y-2">
              {toursInCategory.map((tour) => {
                const isCompleted = tourManager.isTourCompleted(tour.id);
                const isActive = tourManager.activeTourId === tour.id;

                return (
                  <button
                    key={tour.id}
                    onClick={() => handleStartTour(tour.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isActive
                        ? "border-brand-primary bg-brand-primary/5 dark:border-dark-brand-primary dark:bg-dark-brand-primary/5"
                        : isCompleted
                          ? "border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10"
                          : "border-brand-background dark:border-dark-brand-background hover:border-brand-primary/50 dark:hover:border-dark-brand-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
                          {tour.name}
                          {isCompleted && (
                            <span className="inline-flex w-5 h-5 bg-green-500 rounded-full items-center justify-center text-white text-xs">
                              ✓
                            </span>
                          )}
                        </h5>
                        {tour.description && (
                          <p className="text-sm text-brand-text-tertiary dark:text-dark-brand-text-tertiary mt-1">
                            {tour.description}
                          </p>
                        )}
                      </div>
                      {tour.estimatedDuration && (
                        <span className="text-xs text-brand-text-tertiary dark:text-dark-brand-text-tertiary ml-2 whitespace-nowrap">
                          {Math.round(tour.estimatedDuration / 60)}min
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {tourManager.completedTourIds.length > 0 && (
        <div className="pt-4 border-t border-brand-background dark:border-dark-brand-background">
          <p className="text-sm text-brand-text-tertiary dark:text-dark-brand-text-tertiary">
            🎉{" "}
            {t("toursCompleted") ||
              `${tourManager.completedTourIds.length} tours completed`}
          </p>
        </div>
      )}
    </div>
  );
};

export default TourMenu;
