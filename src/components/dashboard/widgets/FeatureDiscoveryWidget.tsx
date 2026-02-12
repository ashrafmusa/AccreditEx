import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  SparklesIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  AcademicCapIcon,
} from "@/components/icons";
import { DashboardWidget } from "./DashboardWidget";
import type { NavigationState } from "@/types";

interface Feature {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  navigation: () => void;
  category: "ai" | "quality" | "insights";
}

interface FeatureDiscoveryWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

export const FeatureDiscoveryWidget: React.FC<FeatureDiscoveryWidgetProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem("feature-discovery-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Feature database
  const allFeatures: Feature[] = useMemo(
    () => [
      {
        id: "ai-document-generator",
        titleKey: "aiDocumentGenerator",
        descriptionKey: "aiDocumentGeneratorDesc",
        icon: DocumentTextIcon,
        gradient: "from-purple-500 to-indigo-600",
        navigation: () => setNavigation({ view: "documentControl" }),
        category: "ai",
      },
      {
        id: "mock-survey",
        titleKey: "mockSurveyFeature",
        descriptionKey: "mockSurveyFeatureDesc",
        icon: AcademicCapIcon,
        gradient: "from-blue-500 to-cyan-600",
        navigation: () => setNavigation({ view: "mockSurvey" }),
        category: "quality",
      },
      {
        id: "quality-insights",
        titleKey: "qualityInsightsFeature",
        descriptionKey: "qualityInsightsFeatureDesc",
        icon: ChartBarIcon,
        gradient: "from-teal-500 to-green-600",
        navigation: () => setNavigation({ view: "qualityInsights" }),
        category: "insights",
      },
      {
        id: "ai-recommendations",
        titleKey: "aiRecommendations",
        descriptionKey: "aiRecommendationsDesc",
        icon: LightBulbIcon,
        gradient: "from-amber-500 to-orange-600",
        navigation: () =>
          setNavigation({
            view: "qualityInsights",
          }),
        category: "ai",
      },
    ],
    [setNavigation],
  );

  // Weekly rotation logic - get current week number
  const currentWeekFeatures = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
        7,
    );

    // Rotate features based on week number
    const rotationIndex = weekNumber % allFeatures.length;
    const rotated = [
      ...allFeatures.slice(rotationIndex),
      ...allFeatures.slice(0, rotationIndex),
    ];

    // Return top 3 features
    return rotated.slice(0, 3);
  }, [allFeatures]);

  const handleDismiss = () => {
    localStorage.setItem("feature-discovery-dismissed", "true");
    setIsDismissed(true);
  };

  const handleFeatureClick = (feature: Feature) => {
    // Track feature click for analytics
    console.log("[Feature Discovery] Feature clicked:", feature.id);

    // Navigate to feature
    feature.navigation();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <DashboardWidget
      title={t("discoverHiddenFeatures")}
      description={t("discoverHiddenFeaturesDesc")}
      icon={SparklesIcon}
      isDismissible={true}
      onDismiss={handleDismiss}
      className="mb-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentWeekFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={() => handleFeatureClick(feature)}
            className={`flex flex-col items-start p-4 rounded-xl bg-gradient-to-br ${feature.gradient} text-white hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl group`}
          >
            <feature.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-base mb-1">
              {t(feature.titleKey)}
            </h4>
            <p className="text-sm text-white/90 line-clamp-2">
              {t(feature.descriptionKey)}
            </p>
            <span className="mt-3 text-xs font-medium opacity-90">
              {t("learnMore")} →
            </span>
          </button>
        ))}
      </div>

      {/* Pro tip footer */}
      <div className="mt-4 pt-4 border-t border-brand-border dark:border-dark-brand-border">
        <p className="text-xs text-brand-muted dark:text-dark-brand-muted">
          💡 {t("proTip")}: {t("featuresRotateWeekly")}
        </p>
      </div>
    </DashboardWidget>
  );
};
