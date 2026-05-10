/**
 * SurveyRiskPredictor
 *
 * AI-powered panel that combines rule-based metrics + LLM analysis to predict
 * the likely outcome of the next accreditation survey.
 *
 * Uses `aiCalculatePredictiveAuditRisk` from qualityOutcomeIntelligenceService
 * which already exists and has graceful fallback to rule-based results.
 */

import { ShieldCheckIcon } from "@/components/icons";
import {
  aiCalculatePredictiveAuditRisk,
  type AIPredictiveAuditRiskResult,
  type PredictiveAuditRiskResult,
} from "@/services/qualityOutcomeIntelligenceService";
import { motion } from "framer-motion";
import React, { useState } from "react";

interface Props {
  readinessScore: number;
  evidenceIntegrityIndex: number;
  criticalOpenFindings: number;
  openCapas: number;
  reviewerSignOffRatePercent: number;
  /** Rule-based result already calculated by parent — used as initial state */
  initial: PredictiveAuditRiskResult;
}

const LEVEL_CONFIG = {
  Low: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
    ring: "#10b981",
    badge:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    label: "Low Risk",
  },
  Medium: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700",
    ring: "#f59e0b",
    badge:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    label: "Medium Risk",
  },
  High: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
    ring: "#ef4444",
    badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    label: "High Risk",
  },
};

/* SVG ring — score 0-100 mapped to stroke-dashoffset */
const ScoreRing: React.FC<{ score: number; color: string }> = ({
  score,
  color,
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      {/* Track */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        className="text-gray-200 dark:text-gray-700"
      />
      {/* Progress */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 0.8s ease",
        }}
      />
      {/* Score label */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
};

const SurveyRiskPredictor: React.FC<Props> = ({
  readinessScore,
  evidenceIntegrityIndex,
  criticalOpenFindings,
  openCapas,
  reviewerSignOffRatePercent,
  initial,
}) => {
  const [result, setResult] = useState<
    PredictiveAuditRiskResult | AIPredictiveAuditRiskResult
  >(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAI = (
    r: PredictiveAuditRiskResult | AIPredictiveAuditRiskResult,
  ): r is AIPredictiveAuditRiskResult =>
    "isAIGenerated" in r && (r as AIPredictiveAuditRiskResult).isAIGenerated;

  const cfg = LEVEL_CONFIG[result.level];

  const runAIAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const aiResult = await aiCalculatePredictiveAuditRisk({
        readinessScore,
        evidenceIntegrityIndex,
        criticalOpenFindings,
        openCapas,
        reviewerSignOffRatePercent,
      });
      setResult(aiResult);
    } catch {
      setError("AI analysis unavailable. Showing rule-based assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 shadow-sm ${cfg.bg}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-brand-primary shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              AI Survey Risk Predictor
            </h3>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              Predicts your likely accreditation outcome before surveyors arrive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAI(result) && (
            <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
              AI-Powered
            </span>
          )}
          <button
            onClick={runAIAnalysis}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition disabled:opacity-60 disabled:pointer-events-none flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Analyzing…
              </>
            ) : (
              <>✦ Run AI Analysis</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {error}
        </p>
      )}

      {/* Main content */}
      <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <ScoreRing score={result.score} color={cfg.ring} />
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}
          >
            {cfg.label}
          </span>
          {isAI(result) && result.confidencePercent > 0 && (
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {result.confidencePercent}% confidence
            </p>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 space-y-3">
          {/* AI Narrative */}
          {isAI(result) && result.aiNarrative ? (
            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/40">
              <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary leading-relaxed">
                {result.aiNarrative}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/40">
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary italic">
                Click "Run AI Analysis" for a personalized risk narrative and
                tailored recommendations.
              </p>
            </div>
          )}

          {/* Risk reasons */}
          {result.reasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-1.5">
                Risk Drivers
              </p>
              <ul className="space-y-1">
                {result.reasons.map((r, i) => (
                  <li
                    key={i}
                    className={`text-sm flex items-start gap-1.5 ${cfg.color}`}
                  >
                    <span className="mt-0.5 shrink-0">▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Recommendations */}
          {isAI(result) && result.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-1.5">
                Priority Actions
              </p>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary flex items-start gap-2"
                  >
                    <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-brand-primary/15 text-brand-primary text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Input metrics row */}
      <div className="mt-4 pt-4 border-t border-white/40 dark:border-gray-700/40 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Readiness", value: `${readinessScore}%`, target: "≥85%" },
          {
            label: "Evidence Integrity",
            value: `${evidenceIntegrityIndex}%`,
            target: "≥90%",
          },
          {
            label: "Critical Findings",
            value: criticalOpenFindings,
            target: "= 0",
          },
          { label: "Open CAPAs", value: openCapas, target: "< 5" },
          {
            label: "Sign-off Rate",
            value: `${reviewerSignOffRatePercent}%`,
            target: "≥80%",
          },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary truncate">
              {m.label}
            </p>
            <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {m.value}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary opacity-60">
              target {m.target}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SurveyRiskPredictor;
