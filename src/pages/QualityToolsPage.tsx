/**
 * QualityToolsPage.tsx
 *
 * Dedicated Quality Aid Tools hub — a single place for clinical and
 * quality staff to access all decision-support tools.
 *
 * Tools present:
 *  - NEWS2 Early Warning Score Calculator (SMCS.87)
 *  - Burns Assessment & Parkland Formula Calculator (SMCS Burn Care Unit)
 *  - SMCS Competency Tracker (links to Training Hub)
 *  - Template Library (links to templates)
 *
 * New tools can be added here without touching any other page.
 */

import LoadingScreen from "@/components/common/LoadingScreen";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { NavigationState } from "@/types";
import React, { lazy, Suspense, useState } from "react";

const EwsScoreModal = lazy(() => import("@/components/clinical/EwsScoreModal"));
const BurnsCalculatorModal = lazy(
  () => import("@/components/clinical/BurnsCalculatorModal"),
);

// ── Tool catalogue ────────────────────────────────────────────────────────────

interface Tool {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  standardKey: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconBg: string;
  iconColor: string;
  action: "modal-ews" | "modal-burns" | "nav-training" | "nav-templates";
  badgeKey?: "clinical" | "training" | "documents";
}

const TOOLS: Tool[] = [
  {
    id: "news2",
    titleKey: "qualityToolNews2Title",
    subtitleKey: "qualityToolNews2Subtitle",
    descriptionKey: "qualityToolNews2Description",
    standardKey: "qualityToolNews2Standard",
    icon: ClipboardDocumentListIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    action: "modal-ews",
    badgeKey: "clinical",
  },
  {
    id: "burns",
    titleKey: "qualityToolBurnsTitle",
    subtitleKey: "qualityToolBurnsSubtitle",
    descriptionKey: "qualityToolBurnsDescription",
    standardKey: "qualityToolBurnsStandard",
    icon: SparklesIcon,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    action: "modal-burns",
    badgeKey: "clinical",
  },
  {
    id: "competency",
    titleKey: "qualityToolCompetencyTitle",
    subtitleKey: "qualityToolCompetencySubtitle",
    descriptionKey: "qualityToolCompetencyDescription",
    standardKey: "qualityToolCompetencyStandard",
    icon: AcademicCapIcon,
    iconBg: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    action: "nav-training",
    badgeKey: "training",
  },
  {
    id: "templates",
    titleKey: "qualityToolTemplatesTitle",
    subtitleKey: "qualityToolTemplatesSubtitle",
    descriptionKey: "qualityToolTemplatesDescription",
    standardKey: "qualityToolTemplatesStandard",
    icon: BookOpenIcon,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    action: "nav-templates",
    badgeKey: "documents",
  },
];

// ── Badge colours ─────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<"clinical" | "training" | "documents", string> = {
  clinical: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  training: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  documents:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface QualityToolsPageProps {
  setNavigation: (state: NavigationState) => void;
}

const QualityToolsPage: React.FC<QualityToolsPageProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const [showEws, setShowEws] = useState(false);
  const [showBurns, setShowBurns] = useState(false);

  const handleToolAction = (action: Tool["action"]) => {
    switch (action) {
      case "modal-ews":
        setShowEws(true);
        break;
      case "modal-burns":
        setShowBurns(true);
        break;
      case "nav-training":
        setNavigation({ view: "trainingHub" });
        break;
      case "nav-templates":
        setNavigation({ view: "templateLibrary" });
        break;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("qualityAidTools") || "Quality Aid Tools"}
            </h1>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("qualityAidToolsDescription") ||
                "Clinical decision-support tools and resources for SMCS accreditation compliance"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-2">
          {[
            { label: t("qualityAidToolsStatClinicalCalculators"), value: "2" },
            {
              label: t("qualityAidToolsStatSmcsStandardsCovered"),
              value: "9+",
            },
            {
              label: t("qualityAidToolsStatDepartmentsSupported"),
              value: "14",
            },
            { label: t("qualityAidToolsStatTemplatesAvailable"), value: "9" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-surface dark:bg-dark-brand-surface border border-gray-200 dark:border-dark-brand-border"
            >
              <span className="text-lg font-bold text-brand-primary">
                {s.value}
              </span>
              <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-dark-brand-border" />

      {/* Tools grid */}
      <div>
        <h2 className="text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-4">
          {t("qualityAidToolsAvailableTools") || "Available Tools"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isExternal =
              tool.action === "nav-training" || tool.action === "nav-templates";

            return (
              <div
                key={tool.id}
                className="group bg-brand-surface dark:bg-dark-brand-surface border border-gray-200 dark:border-dark-brand-border rounded-2xl p-5 flex flex-col gap-4 hover:border-brand-primary/40 hover:shadow-md transition-all duration-200"
              >
                {/* Card header */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tool.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                        {t(tool.titleKey)}
                      </h3>
                      {tool.badgeKey && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLE[tool.badgeKey]}`}
                        >
                          {tool.badgeKey === "clinical"
                            ? t("qualityAidToolsBadgeClinical")
                            : tool.badgeKey === "training"
                              ? t("qualityAidToolsBadgeTraining")
                              : t("qualityAidToolsBadgeDocuments")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                      {t(tool.subtitleKey)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary leading-relaxed flex-1">
                  {t(tool.descriptionKey)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-dark-brand-border">
                  <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary font-mono">
                    {t(tool.standardKey)}
                  </span>
                  <button
                    onClick={() => handleToolAction(tool.action)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                  >
                    {isExternal
                      ? t("qualityAidToolsGoToTool") || "Go to Tool ->"
                      : t("qualityAidToolsLaunchTool") || "Launch Tool"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming soon section */}
      <div>
        <h2 className="text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-4">
          {t("qualityAidToolsComingSoon") || "Coming Soon"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: t("qualityAidToolsComingSoonPaediatricTitle"),
              desc: t("qualityAidToolsComingSoonPaediatricDesc"),
              std: t("qualityAidToolsComingSoonPaediatricStd"),
            },
            {
              title: t("qualityAidToolsComingSoonSepsisTitle"),
              desc: t("qualityAidToolsComingSoonSepsisDesc"),
              std: t("qualityAidToolsComingSoonSepsisStd"),
            },
            {
              title: t("qualityAidToolsComingSoonPressureTitle"),
              desc: t("qualityAidToolsComingSoonPressureDesc"),
              std: t("qualityAidToolsComingSoonPressureStd"),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 opacity-60"
            >
              <h3 className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                {item.title}
              </h3>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                {item.desc}
              </p>
              <p className="text-xs font-mono text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
                {item.std}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showEws && (
        <Suspense fallback={<LoadingScreen />}>
          <EwsScoreModal onClose={() => setShowEws(false)} />
        </Suspense>
      )}
      {showBurns && (
        <Suspense fallback={<LoadingScreen />}>
          <BurnsCalculatorModal onClose={() => setShowBurns(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default QualityToolsPage;
