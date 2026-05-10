/**
 * ReadinessCountdownWidget
 *
 * Dashboard widget that shows days remaining until the nearest active
 * project end date (treated as survey/audit date), plus AI-prioritized
 * top checklist gaps to close before the survey.
 */

import { useTranslation } from "@/hooks/useTranslation";
import { calculatePortfolioReadiness } from "@/services/tqmReadinessService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { ChecklistItem, ComplianceStatus, NavigationState } from "@/types";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

interface Props {
  setNavigation: (state: NavigationState) => void;
}

const CountdownRing: React.FC<{
  daysLeft: number;
  totalDays: number;
}> = ({ daysLeft, totalDays }) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const safeTotalDays = Math.max(totalDays, 1);
  const fraction = Math.max(0, Math.min(1, daysLeft / safeTotalDays));
  const offset = circumference - fraction * circumference;

  const color =
    daysLeft <= 30 ? "#ef4444" : daysLeft <= 90 ? "#f59e0b" : "#10b981";

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 shrink-0">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 0.8s ease",
        }}
      />
      <text
        x="50"
        y="44"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="700"
        fill={color}
      >
        {daysLeft > 999 ? "999+" : daysLeft}
      </text>
      <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#94a3b8">
        days
      </text>
    </svg>
  );
};

const ReadinessCountdownWidget: React.FC<Props> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { documents } = useAppStore();

  const countdownData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the nearest future end date across active projects
    const activeProjects = projects.filter(
      (p) => p.status === "In Progress" && p.endDate,
    );

    let nearestProject: (typeof activeProjects)[0] | null = null;
    let daysLeft = Infinity;

    for (const p of activeProjects) {
      const end = new Date(p.endDate!);
      end.setHours(0, 0, 0, 0);
      const diff = Math.ceil(
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff >= 0 && diff < daysLeft) {
        daysLeft = diff;
        nearestProject = p;
      }
    }

    // Total project duration in days (for ring fill ratio)
    let totalDays = 365;
    if (nearestProject?.startDate && nearestProject?.endDate) {
      const start = new Date(nearestProject.startDate);
      const end = new Date(nearestProject.endDate);
      totalDays = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }

    // Top 3 non-compliant checklist items across all in-progress projects
    const nonCompliant: Array<ChecklistItem & { projectName: string }> = [];
    for (const p of activeProjects) {
      for (const item of p.checklist ?? []) {
        if (
          item.status !== ComplianceStatus.Compliant &&
          item.status !== ComplianceStatus.NotApplicable
        ) {
          nonCompliant.push({ ...item, projectName: p.name });
        }
      }
    }

    // Sort: NonCompliant before PartiallyCompliant, then by checklist order
    nonCompliant.sort((a, b) => {
      const rank = (s: ComplianceStatus) =>
        s === ComplianceStatus.NonCompliant ? 0 : 1;
      return rank(a.status) - rank(b.status);
    });

    return {
      daysLeft: daysLeft === Infinity ? 0 : daysLeft,
      totalDays,
      nearestProject,
      topGaps: nonCompliant.slice(0, 3),
      noSurveyPlanned: !nearestProject,
    };
  }, [projects]);

  const readiness = useMemo(
    () => calculatePortfolioReadiness(projects, [], documents),
    [projects, documents],
  );

  if (countdownData.noSurveyPlanned) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-brand-surface dark:bg-dark-brand-surface p-5 shadow-sm">
        <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          Accreditation Countdown
        </p>
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          No active survey scheduled. Set an end date on an in-progress project
          to activate the countdown.
        </p>
        <button
          onClick={() => setNavigation({ view: "projects" })}
          className="mt-3 text-xs text-brand-primary hover:underline"
        >
          Go to Projects →
        </button>
      </div>
    );
  }

  const urgencyColor =
    countdownData.daysLeft <= 30
      ? "text-red-600 dark:text-red-400"
      : countdownData.daysLeft <= 90
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-brand-surface dark:bg-dark-brand-surface p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            Accreditation Countdown
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary truncate max-w-[200px]">
            {countdownData.nearestProject?.name}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            countdownData.daysLeft <= 30
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              : countdownData.daysLeft <= 90
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {countdownData.daysLeft <= 30
            ? "Urgent"
            : countdownData.daysLeft <= 90
              ? "Approaching"
              : "On Track"}
        </span>
      </div>

      {/* Ring + readiness */}
      <div className="flex items-center gap-4 mb-4">
        <CountdownRing
          daysLeft={countdownData.daysLeft}
          totalDays={countdownData.totalDays}
        />
        <div>
          <p className={`text-2xl font-bold ${urgencyColor}`}>
            {countdownData.daysLeft} days
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            until survey date
          </p>
          <div className="mt-2">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Readiness
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-1.5 bg-brand-primary rounded-full transition-all"
                  style={{ width: `${readiness.readinessScore}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {readiness.readinessScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 gaps */}
      {countdownData.topGaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-2">
            Priority Gaps to Close
          </p>
          <ul className="space-y-1.5">
            {countdownData.topGaps.map((gap, i) => (
              <li
                key={gap.id ?? i}
                className="flex items-start gap-2 text-xs text-brand-text-primary dark:text-dark-brand-text-primary"
              >
                <span
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    gap.status === ComplianceStatus.NonCompliant
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="line-clamp-2">
                  {gap.requirement || gap.item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() =>
          setNavigation({
            view: "projectDetail",
            projectId: countdownData.nearestProject?.id,
          })
        }
        className="mt-4 text-xs text-brand-primary hover:underline"
      >
        View Project →
      </button>
    </motion.div>
  );
};

export default ReadinessCountdownWidget;
