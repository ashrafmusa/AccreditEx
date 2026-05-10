import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { ComplianceStatus, NavigationState } from "@/types";
import React, { useMemo } from "react";

interface AuditReadinessCardProps {
  setNavigation: (state: NavigationState) => void;
  /** If provided, only consider this project's data */
  projectId?: string;
}

type ReadinessTier = "Ready" | "Partial" | "NotReady";

const TIER_CONFIG: Record<
  ReadinessTier,
  {
    label: string;
    labelKey: string;
    icon: React.FC<{ className?: string }>;
    className: string;
    barColor: string;
  }
> = {
  Ready: {
    label: "Audit Ready",
    labelKey: "auditReady",
    icon: CheckCircleIcon,
    className:
      "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
    barColor: "bg-green-500",
  },
  Partial: {
    label: "Partially Ready",
    labelKey: "auditPartiallyReady",
    icon: ExclamationTriangleIcon,
    className:
      "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20",
    barColor: "bg-amber-400",
  },
  NotReady: {
    label: "Not Ready",
    labelKey: "auditNotReady",
    icon: XCircleIcon,
    className:
      "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20",
    barColor: "bg-red-500",
  },
};

const AuditReadinessCard: React.FC<AuditReadinessCardProps> = ({
  setNavigation,
  projectId,
}) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { accreditationPrograms } = useAppStore();

  const metrics = useMemo(() => {
    const targetProjects = projectId
      ? projects.filter((p) => p.id === projectId)
      : projects;

    let totalApplicable = 0;
    let totalScore = 0;
    let nonConformities = 0;

    targetProjects.forEach((p) => {
      if (!Array.isArray(p.checklist)) return;
      const applicable = p.checklist.filter(
        (c) => c.status !== ComplianceStatus.NotApplicable,
      );
      totalApplicable += applicable.length;
      applicable.forEach((item) => {
        if (item.status === ComplianceStatus.Compliant) {
          totalScore += 1;
        } else if (item.status === ComplianceStatus.PartiallyCompliant) {
          totalScore += 0.5;
          nonConformities += 1;
        } else {
          nonConformities += 1;
        }
      });
    });

    const compliancePct =
      totalApplicable > 0
        ? Math.round((totalScore / totalApplicable) * 100)
        : 0;

    const tier: ReadinessTier =
      compliancePct >= 85
        ? "Ready"
        : compliancePct >= 65
          ? "Partial"
          : "NotReady";

    return {
      compliancePct,
      nonConformities,
      totalApplicable,
      tier,
      programCount: accreditationPrograms.length,
      projectCount: targetProjects.length,
    };
  }, [projects, accreditationPrograms, projectId]);

  const config = TIER_CONFIG[metrics.tier];
  const TierIcon = config.icon;

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${config.className} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => setNavigation({ view: "analyticsHub" })}
      role="button"
      tabIndex={0}
      aria-label={t("auditReadinessPredictor") || "Audit Readiness Predictor"}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-brand-primary" />
          <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("auditReadinessPredictor") || "Audit Readiness Predictor"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <TierIcon
            className={`h-4 w-4 ${
              metrics.tier === "Ready"
                ? "text-green-600 dark:text-green-400"
                : metrics.tier === "Partial"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          />
          <span
            className={`text-xs font-semibold ${
              metrics.tier === "Ready"
                ? "text-green-700 dark:text-green-300"
                : metrics.tier === "Partial"
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-red-700 dark:text-red-300"
            }`}
          >
            {t(config.labelKey) || config.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("complianceScore") || "Compliance Score"}
          </span>
          <span className="font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {metrics.compliancePct}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${config.barColor}`}
            style={{ width: `${Math.min(100, metrics.compliancePct)}%` }}
          />
        </div>
      </div>

      {/* Prediction details */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg py-2 px-3">
          <p
            className={`text-xl font-bold ${
              metrics.nonConformities === 0
                ? "text-green-600 dark:text-green-400"
                : metrics.nonConformities <= 5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          >
            {metrics.nonConformities}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("predictedNonConformities") || "Non-Conformities"}
          </p>
        </div>
        <div className="bg-white/60 dark:bg-slate-800/40 rounded-lg py-2 px-3">
          <p className="text-xl font-bold text-brand-primary">
            {metrics.projectCount}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("projects") || "Projects"}
          </p>
        </div>
      </div>

      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-3 text-right">
        {t("clickForDetails") || "Click for full analytics →"}
      </p>
    </div>
  );
};

export default AuditReadinessCard;
