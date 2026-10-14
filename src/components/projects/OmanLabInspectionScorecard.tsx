import React, { useEffect, useState } from "react";
import { Project } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { omanLabInspectionScore } from "@/utils/omanLabInspectionScoring";

interface OmanLabInspectionScorecardProps {
  project: Project;
  readOnly: boolean;
  onSavePilotMetrics: (
    metrics: NonNullable<Project["inspectionPilotMetrics"]>,
  ) => Promise<void>;
}

const OmanLabInspectionScorecard: React.FC<
  OmanLabInspectionScorecardProps
> = ({ project, readOnly, onSavePilotMetrics }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const score = omanLabInspectionScore(project.checklist);
  const [baselineMinutes, setBaselineMinutes] = useState("");
  const [pilotMinutes, setPilotMinutes] = useState("");
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  const savedMetrics = project.inspectionPilotMetrics;

  useEffect(() => {
    setBaselineMinutes(
      savedMetrics ? String(savedMetrics.baselineEvidenceRetrievalMinutes) : "",
    );
    setPilotMinutes(
      savedMetrics ? String(savedMetrics.pilotEvidenceRetrievalMinutes) : "",
    );
  }, [
    savedMetrics?.baselineEvidenceRetrievalMinutes,
    savedMetrics?.pilotEvidenceRetrievalMinutes,
  ]);

  const saveMetrics = async () => {
    const baseline = Number(baselineMinutes);
    const pilot = Number(pilotMinutes);
    if (
      !baselineMinutes.trim() ||
      !pilotMinutes.trim() ||
      !Number.isFinite(baseline) ||
      !Number.isFinite(pilot) ||
      baseline <= 0 ||
      pilot < 0
    ) {
      setMetricsError(t("omanLabPilotMetricsInvalid"));
      return;
    }
    setSavingMetrics(true);
    setMetricsError("");
    try {
      await onSavePilotMetrics({
        baselineEvidenceRetrievalMinutes: baseline,
        pilotEvidenceRetrievalMinutes: pilot,
      });
      toast.success(t("omanLabPilotMetricsSaved"));
    } catch (error) {
      console.error("Oman lab pilot metrics save failed:", error);
      setMetricsError(t("projectWriteFailed"));
      toast.error(t("projectWriteFailed"));
    } finally {
      setSavingMetrics(false);
    }
  };
  const retrievalImprovementPercent =
    savedMetrics && savedMetrics.baselineEvidenceRetrievalMinutes > 0
      ? Math.round(
          ((savedMetrics.baselineEvidenceRetrievalMinutes -
            savedMetrics.pilotEvidenceRetrievalMinutes) /
            savedMetrics.baselineEvidenceRetrievalMinutes) *
            100,
        )
      : null;
  const metrics = [
    {
      label: t("omanLabFullyMet"),
      value: score.fullyMet,
      style: "text-green-700 dark:text-green-300",
    },
    {
      label: t("omanLabPartiallyMet"),
      value: score.partiallyMet,
      style: "text-amber-700 dark:text-amber-300",
    },
    {
      label: t("omanLabNotMet"),
      value: score.notMet,
      style: "text-red-700 dark:text-red-300",
    },
    {
      label: t("omanLabNotApplicable"),
      value: score.notApplicable,
      style: "text-gray-700 dark:text-gray-300",
    },
  ];

  return (
    <section
      aria-labelledby="oman-lab-inspection-scorecard"
      className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
    >
      <div>
        <h2
          id="oman-lab-inspection-scorecard"
          className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary"
        >
          {t("omanLabScorecardTitle")}
        </h2>
        <p className="mt-1 text-sm text-amber-950 dark:text-amber-100">
          {t("omanLabScorecardDisclaimer")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-white p-3 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("omanLabScoredResult")}
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {score.scorePercent === null
              ? t("omanLabNoRatings")
              : `${score.scorePercent}%`}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t("omanLabPoints", {
              earned: score.earnedPoints.toFixed(1),
              maximum: score.maximumAssessedPoints,
            })}
          </p>
        </div>
        <div className="rounded-md bg-white p-3 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("omanLabAssessmentCoverage")}
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {score.coveragePercent === null
              ? t("omanLabNoRatings")
              : `${score.coveragePercent}%`}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t("omanLabAssessedCount", {
              assessed: score.assessed,
              applicable: score.applicable,
            })}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-md bg-white px-3 py-2 dark:bg-gray-900"
          >
            <dt className="text-xs text-gray-600 dark:text-gray-300">
              {metric.label}
            </dt>
            <dd className={`text-lg font-semibold ${metric.style}`}>
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-gray-800 dark:text-gray-200">
        {t("omanLabPilotReadinessMeasures", {
          unassessed: score.unassessed,
          unassigned: score.unassignedOutstanding,
          missingPlans: score.gapsWithoutActionPlan,
        })}
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200">
        {t("omanLabPilotRetrievalTarget")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          {t("omanLabBaselineRetrieval")}
          <span className="mt-1 flex items-center gap-2">
            <input
              aria-label={t("omanLabBaselineRetrieval")}
              type="number"
              min="0.1"
              step="0.1"
              value={baselineMinutes}
              disabled={readOnly || savingMetrics}
              onChange={(event) => setBaselineMinutes(event.target.value)}
              className="w-full rounded-md border border-brand-border bg-white px-3 py-2 dark:border-dark-brand-border dark:bg-gray-900"
            />
            <span>{t("omanLabMinutes")}</span>
          </span>
        </label>
        <label className="text-sm">
          {t("omanLabPilotRetrieval")}
          <span className="mt-1 flex items-center gap-2">
            <input
              aria-label={t("omanLabPilotRetrieval")}
              type="number"
              min="0"
              step="0.1"
              value={pilotMinutes}
              disabled={readOnly || savingMetrics}
              onChange={(event) => setPilotMinutes(event.target.value)}
              className="w-full rounded-md border border-brand-border bg-white px-3 py-2 dark:border-dark-brand-border dark:bg-gray-900"
            />
            <span>{t("omanLabMinutes")}</span>
          </span>
        </label>
      </div>
      {!readOnly && (
        <button
          type="button"
          disabled={savingMetrics}
          onClick={() => void saveMetrics()}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {savingMetrics
            ? t("saving")
            : t("omanLabSavePilotMetrics")}
        </button>
      )}
      {metricsError && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {metricsError}
        </p>
      )}
      {retrievalImprovementPercent !== null && (
        <p role="status" className="text-sm font-medium">
          {t("omanLabRetrievalImprovement", {
            percent: retrievalImprovementPercent,
          })}
        </p>
      )}
      <p className="text-xs text-gray-600 dark:text-gray-300">
        {t("omanLabScoreMethod")}
      </p>
    </section>
  );
};

export default OmanLabInspectionScorecard;
