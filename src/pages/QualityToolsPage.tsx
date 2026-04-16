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
import { NavigationState } from "@/types";
import React, { lazy, Suspense, useState } from "react";

const EwsScoreModal = lazy(() => import("@/components/clinical/EwsScoreModal"));
const BurnsCalculatorModal = lazy(
  () => import("@/components/clinical/BurnsCalculatorModal"),
);

// ── Tool catalogue ────────────────────────────────────────────────────────────

interface Tool {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  standard: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconBg: string;
  iconColor: string;
  action: "modal-ews" | "modal-burns" | "nav-training" | "nav-templates";
  badge?: string;
}

const TOOLS: Tool[] = [
  {
    id: "news2",
    title: "NEWS2 Early Warning Score",
    subtitle: "Deteriorating Patient Detection",
    description:
      "Calculate the National Early Warning Score 2 using all 7 vital signs. Provides a risk band (Low / Medium / High) with escalation guidance aligned to the Royal College of Physicians 2017 specification.",
    standard: "SMCS.87",
    icon: ClipboardDocumentListIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    action: "modal-ews",
    badge: "Clinical",
  },
  {
    id: "burns",
    title: "Burns Assessment & Fluid Calculator",
    subtitle: "Parkland Formula · Lund & Browder",
    description:
      "Calculate Parkland fluid resuscitation volumes (total 24h, first 8h rate, next 16h rate, urine output targets). Includes Curreri caloric requirements, Lund & Browder TBSA reference, and burn depth classification guide.",
    standard: "SMCS Burn Care Unit",
    icon: SparklesIcon,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    action: "modal-burns",
    badge: "Clinical",
  },
  {
    id: "competency",
    title: "SMCS Competency Tracker",
    subtitle: "14 SMCS Department Competency Records",
    description:
      "Track annual clinical competency assessments for all SMCS departments. Add, edit, and export staff competency records with status badges (Competent / Due / Overdue). Covers SMCS standards .55, .67, .82, .96, .104, and .116.",
    standard: "SMCS.55 · .67 · .82 · .96 · .104 · .116",
    icon: AcademicCapIcon,
    iconBg: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    action: "nav-training",
    badge: "Training",
  },
  {
    id: "templates",
    title: "SMCS Template Library",
    subtitle: "9 OHAS-tagged SMCS Templates",
    description:
      "Access accreditation-ready SMCS templates including WHO Surgical Safety Checklist, ED Triage, Informed Consent Register, NEWS2 Observation Log, Medication Reconciliation, Post-Op Monitoring, NICU Vitals Chart, and Burns Assessment Form.",
    standard: "OHAS (Oman) · All SMCS Departments",
    icon: BookOpenIcon,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    action: "nav-templates",
    badge: "Documents",
  },
];

// ── Badge colours ─────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<string, string> = {
  Clinical: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Training: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  Documents:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface QualityToolsPageProps {
  setNavigation: (state: NavigationState) => void;
}

const QualityToolsPage: React.FC<QualityToolsPageProps> = ({
  setNavigation,
}) => {
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
              Quality Aid Tools
            </h1>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Clinical decision-support tools and resources for SMCS
              accreditation compliance
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-2">
          {[
            { label: "Clinical Calculators", value: "2" },
            { label: "SMCS Standards Covered", value: "9+" },
            { label: "Departments Supported", value: "14" },
            { label: "Templates Available", value: "9" },
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
          Available Tools
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
                        {tool.title}
                      </h3>
                      {tool.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLE[tool.badge]}`}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                      {tool.subtitle}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary leading-relaxed flex-1">
                  {tool.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-dark-brand-border">
                  <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary font-mono">
                    {tool.standard}
                  </span>
                  <button
                    onClick={() => handleToolAction(tool.action)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                  >
                    {isExternal ? "Go to Tool →" : "Launch Tool"}
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
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Paediatric Resuscitation Calculator",
              desc: "Weight-based drug dosing, fluid resuscitation, and equipment sizing for paediatric emergencies.",
              std: "SMCS ED · PICU",
            },
            {
              title: "Sepsis Bundle Checklist",
              desc: "SEPSIS-3 criteria evaluation and hour-1 bundle tracker with documentation support.",
              std: "SMCS.87 · ICU · ED",
            },
            {
              title: "Pressure Injury Risk Score",
              desc: "Braden Scale assessment tool with automated care planning recommendations.",
              std: "SMCS Nursing",
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
