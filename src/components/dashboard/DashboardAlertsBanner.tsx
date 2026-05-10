import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { NavigationState } from "@/types";
import React, { useState } from "react";

interface Alert {
  id: string;
  level: "critical" | "warning" | "info" | "success";
  message: string;
  action?: { label: string; navigation: NavigationState };
}

interface DashboardAlertsBannerProps {
  openCapaCount: number;
  documentsReviewOverdue: number;
  riskExposure: number;
  upcomingDeadlinesCount: number;
  setNavigation: (state: NavigationState) => void;
}

const DashboardAlertsBanner: React.FC<DashboardAlertsBannerProps> = ({
  openCapaCount,
  documentsReviewOverdue,
  riskExposure,
  upcomingDeadlinesCount,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const allAlerts: Alert[] = [];

  if (openCapaCount > 0) {
    allAlerts.push({
      id: "capa",
      level: "critical",
      message:
        t("alertOpenCapa", { count: openCapaCount }) ||
        `${openCapaCount} open CAPA report${openCapaCount > 1 ? "s" : ""} require attention`,
      action: {
        label: t("viewCapas") || "View CAPAs",
        navigation: { view: "projects", filter: "openCapa" },
      },
    });
  }

  if (documentsReviewOverdue > 0) {
    allAlerts.push({
      id: "docs",
      level: "warning",
      message:
        t("alertDocsOverdue", { count: documentsReviewOverdue }) ||
        `${documentsReviewOverdue} document${documentsReviewOverdue > 1 ? "s" : ""} overdue for review`,
      action: {
        label: t("reviewNow") || "Review Now",
        navigation: { view: "documentControl", filter: "overdue" },
      },
    });
  }

  if (riskExposure > 60) {
    allAlerts.push({
      id: "risk",
      level: "warning",
      message:
        t("alertHighRisk", { value: riskExposure }) ||
        `Risk exposure is elevated at ${riskExposure}%`,
      action: {
        label: t("viewRisks") || "View Risks",
        navigation: { view: "riskHub" },
      },
    });
  }

  if (upcomingDeadlinesCount > 0) {
    allAlerts.push({
      id: "deadlines",
      level: "info",
      message:
        t("alertUpcomingDeadlines", { count: upcomingDeadlinesCount }) ||
        `${upcomingDeadlinesCount} deadline${upcomingDeadlinesCount > 1 ? "s" : ""} approaching in the next 30 days`,
      action: {
        label: t("viewCalendar") || "View Calendar",
        navigation: { view: "calendar" },
      },
    });
  }

  const visibleAlerts = allAlerts.filter((a) => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0 && allAlerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
        <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {t("allSystemsNormal") ||
            "All systems normal — no critical items require attention"}
        </p>
      </div>
    );
  }

  if (visibleAlerts.length === 0) return null;

  const levelConfig = {
    critical: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: ShieldCheckIcon,
      iconColor: "text-red-500",
      textColor: "text-red-700 dark:text-red-300",
      btnColor:
        "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      icon: ExclamationTriangleIcon,
      iconColor: "text-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
      btnColor:
        "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-600",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: ExclamationTriangleIcon,
      iconColor: "text-blue-500",
      textColor: "text-blue-700 dark:text-blue-300",
      btnColor:
        "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600",
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: CheckCircleIcon,
      iconColor: "text-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-300",
      btnColor:
        "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600",
    },
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const cfg = levelConfig[alert.level];
        const Icon = cfg.icon;
        return (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${cfg.iconColor}`} />
            <p className={`flex-1 text-sm font-medium ${cfg.textColor}`}>
              {alert.message}
            </p>
            {alert.action && (
              <button
                onClick={() => setNavigation(alert.action!.navigation)}
                className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${cfg.btnColor}`}
              >
                {alert.action.label}
              </button>
            )}
            <button
              onClick={() => setDismissed((prev) => [...prev, alert.id])}
              className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className={`w-4 h-4 ${cfg.iconColor}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardAlertsBanner;
