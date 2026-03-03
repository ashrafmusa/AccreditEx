/**
 * PredictiveAuditRiskPanel
 * Phase 2 B1 — AI Predictive Accreditation Scoring
 *
 * - Displays the current AI-powered predictive audit risk score
 * - AI narrative explanation from LLM
 * - Expandable "What-If Simulator" with live sliders
 */

import { SparklesIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AIPredictiveAuditRiskResult,
  PredictiveAuditRiskResult,
  aiCalculatePredictiveAuditRisk,
  calculatePredictiveAuditRisk,
} from "@/services/qualityOutcomeIntelligenceService";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────

export interface PredictiveAuditRiskPanelProps {
  readinessScore: number;
  evidenceIntegrityIndex: number;
  criticalOpenFindings: number;
  openCapas: number;
  reviewerSignOffRatePercent: number;
}

// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  Low: "text-emerald-600 dark:text-emerald-400",
  Medium: "text-amber-600 dark:text-amber-400",
  High: "text-red-600 dark:text-red-400",
};

const LEVEL_BAR: Record<string, string> = {
  Low: "bg-emerald-500",
  Medium: "bg-amber-500",
  High: "bg-red-500",
};

// ─────────────────────────────────────────────────────────────────────────────

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  isPercent?: boolean;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, isPercent = true, onChange }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
      <span>{label}</span>
      <span className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
        {value}
        {isPercent ? "%" : ""}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-primary"
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

export const PredictiveAuditRiskPanel: React.FC<
  PredictiveAuditRiskPanelProps
> = ({
  readinessScore,
  evidenceIntegrityIndex,
  criticalOpenFindings,
  openCapas,
  reviewerSignOffRatePercent,
}) => {
  const { t } = useTranslation();

  // Live AI result for current metrics
  const [aiResult, setAiResult] = useState<AIPredictiveAuditRiskResult | null>(
    null,
  );
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const aiLoadedRef = useRef(false);

  // What-if simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simReadiness, setSimReadiness] = useState(readinessScore);
  const [simEvidence, setSimEvidence] = useState(evidenceIntegrityIndex);
  const [simFindings, setSimFindings] = useState(criticalOpenFindings);
  const [simCapas, setSimCapas] = useState(openCapas);
  const [simSignOff, setSimSignOff] = useState(reviewerSignOffRatePercent);

  // Sync sim sliders when real props change
  useEffect(() => {
    setSimReadiness(readinessScore);
    setSimEvidence(evidenceIntegrityIndex);
    setSimFindings(criticalOpenFindings);
    setSimCapas(openCapas);
    setSimSignOff(reviewerSignOffRatePercent);
  }, [
    readinessScore,
    evidenceIntegrityIndex,
    criticalOpenFindings,
    openCapas,
    reviewerSignOffRatePercent,
  ]);

  // Rule-based result for what-if (instant, no API)
  const simResult: PredictiveAuditRiskResult = calculatePredictiveAuditRisk({
    readinessScore: simReadiness,
    evidenceIntegrityIndex: simEvidence,
    criticalOpenFindings: simFindings,
    openCapas: simCapas,
    reviewerSignOffRatePercent: simSignOff,
  });

  // Current (real) rule-based result used before AI loads
  const currentRuleBased: PredictiveAuditRiskResult =
    calculatePredictiveAuditRisk({
      readinessScore,
      evidenceIntegrityIndex,
      criticalOpenFindings,
      openCapas,
      reviewerSignOffRatePercent,
    });

  const displayResult: PredictiveAuditRiskResult = aiResult ?? currentRuleBased;

  // Fetch AI analysis on mount (once)
  const fetchAI = useCallback(async () => {
    if (aiLoadedRef.current || isLoadingAI) return;
    aiLoadedRef.current = true;
    setIsLoadingAI(true);
    try {
      const result = await aiCalculatePredictiveAuditRisk({
        readinessScore,
        evidenceIntegrityIndex,
        criticalOpenFindings,
        openCapas,
        reviewerSignOffRatePercent,
      });
      setAiResult(result);
    } finally {
      setIsLoadingAI(false);
    }
  }, [
    readinessScore,
    evidenceIntegrityIndex,
    criticalOpenFindings,
    openCapas,
    reviewerSignOffRatePercent,
  ]);

  useEffect(() => {
    fetchAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and re-fetch AI when user clicks refresh
  const handleRefreshAI = () => {
    aiLoadedRef.current = false;
    setAiResult(null);
    fetchAI();
  };

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-brand-primary" />
            <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("predictiveAuditRisk") || "Predictive Audit-Risk Indicator"}
            </h3>
            {aiResult && (
              <span className="text-xs bg-brand-primary/10 text-brand-primary rounded-full px-2 py-0.5">
                {t("aiPowered") || "AI-Powered"}
              </span>
            )}
          </div>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("predictiveAuditRiskDescription") ||
              "Forward-looking signal based on readiness, evidence quality, open findings, CAPA load, and reviewer sign-off discipline."}
          </p>
        </div>

        {/* Risk level badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("predictedRiskLevel") || "Predicted Risk Level"}
            </p>
            <p
              className={`text-xl font-bold ${LEVEL_STYLES[displayResult.level]}`}
            >
              {isLoadingAI ? "..." : displayResult.level}
              <span className="text-sm font-normal text-brand-text-secondary dark:text-dark-brand-text-secondary ml-1">
                ({isLoadingAI ? "—" : displayResult.score}/100)
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefreshAI}
            disabled={isLoadingAI}
            title={t("refreshAI") || "Refresh AI analysis"}
            className="text-xs"
          >
            {isLoadingAI ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full" />
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Risk score bar */}
      <div className="px-4 pt-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${LEVEL_BAR[displayResult.level]}`}
            style={{ width: `${displayResult.score}%` }}
          />
        </div>
      </div>

      {/* AI narrative */}
      {aiResult?.aiNarrative && (
        <div className="px-4 pt-3">
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary italic">
            „{aiResult.aiNarrative}"
          </p>
          {aiResult.confidencePercent > 0 && (
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("aiConfidence") || "AI confidence"}:{" "}
              {aiResult.confidencePercent}%
            </p>
          )}
        </div>
      )}

      {/* Risk reasons */}
      {displayResult.reasons.length > 0 && (
        <ul className="mt-3 px-4 list-disc list-inside text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary space-y-1">
          {displayResult.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {/* AI recommendations */}
      {aiResult?.recommendations && aiResult.recommendations.length > 0 && (
        <div className="px-4 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
            {t("aiRecommendations") || "AI Recommendations"}
          </p>
          <ul className="space-y-1">
            {aiResult.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary"
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What-If Simulator toggle */}
      <div className="px-4 py-3 mt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowSimulator((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
        >
          <SparklesIcon className="w-4 h-4" />
          {showSimulator
            ? t("hideWhatIfSimulator") || "Hide What-If Simulator"
            : t("openWhatIfSimulator") || "What-If Simulator"}
        </button>

        {showSimulator && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("whatIfDescription") ||
                "Adjust the sliders to simulate how metric changes would affect your predicted audit risk."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SliderRow
                label={t("readinessScore") || "Readiness Score"}
                value={simReadiness}
                min={0}
                max={100}
                onChange={setSimReadiness}
              />
              <SliderRow
                label={t("evidenceIntegrity") || "Evidence Integrity Index"}
                value={simEvidence}
                min={0}
                max={100}
                onChange={setSimEvidence}
              />
              <SliderRow
                label={t("criticalOpenFindings") || "Critical Open Findings"}
                value={simFindings}
                min={0}
                max={20}
                isPercent={false}
                onChange={setSimFindings}
              />
              <SliderRow
                label={t("openCapas") || "Open CAPAs"}
                value={simCapas}
                min={0}
                max={30}
                isPercent={false}
                onChange={setSimCapas}
              />
              <SliderRow
                label={t("reviewerSignOffRate") || "Reviewer Sign-Off Rate"}
                value={simSignOff}
                min={0}
                max={100}
                onChange={setSimSignOff}
              />
            </div>

            {/* Simulated result */}
            <div
              className={`flex items-center justify-between rounded-lg p-4 ${
                simResult.level === "Low"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                  : simResult.level === "Medium"
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div>
                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("simulatedRisk") || "Simulated Risk"}
                </p>
                <p
                  className={`text-lg font-bold ${LEVEL_STYLES[simResult.level]}`}
                >
                  {simResult.level} — {simResult.score}/100
                </p>
              </div>
              <div className="text-right">
                {simResult.score < currentRuleBased.score ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    ↓ {currentRuleBased.score - simResult.score} pts improvement
                  </span>
                ) : simResult.score > currentRuleBased.score ? (
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    ↑ {simResult.score - currentRuleBased.score} pts worse
                  </span>
                ) : (
                  <span className="text-brand-text-secondary text-sm">
                    No change
                  </span>
                )}
              </div>
            </div>

            {simResult.reasons.length > 0 && (
              <ul className="list-disc list-inside text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary space-y-0.5">
                {simResult.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => {
                setSimReadiness(readinessScore);
                setSimEvidence(evidenceIntegrityIndex);
                setSimFindings(criticalOpenFindings);
                setSimCapas(openCapas);
                setSimSignOff(reviewerSignOffRatePercent);
              }}
              className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary hover:underline"
            >
              {t("resetToCurrentValues") || "Reset to current values"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveAuditRiskPanel;
