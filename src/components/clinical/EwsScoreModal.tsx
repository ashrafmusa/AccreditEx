/**
 * EwsScoreModal.tsx
 *
 * Interactive NEWS2 (National Early Warning Score 2) calculator modal.
 * Satisfies SMCS.87 — deteriorating patient early warning requirements.
 *
 * Scoring follows the Royal College of Physicians NEWS2 (2017) specification.
 */

import { XMarkIcon } from "@/components/icons";
import React, { useMemo, useState } from "react";

// ── NEWS2 scoring tables ──────────────────────────────────────────────────────

function scoreRR(rr: number): number {
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}

function scoreSpO2Scale1(spo2: number): number {
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}

function scoreSpO2Scale2(spo2: number, onO2: boolean): number {
  // Scale 2 for hypercapnic respiratory failure patients
  if (spo2 <= 83) return 3;
  if (spo2 <= 85) return 2;
  if (spo2 <= 87) return 1;
  if (spo2 >= 93 && onO2) return 3;
  if (spo2 >= 95 && onO2) return 3;
  if (spo2 <= 92 && !onO2) return 0;
  if (spo2 <= 94 && !onO2) return 0;
  return 0;
}

function scoreSBP(sbp: number): number {
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3;
}

function scoreHR(hr: number): number {
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}

function scoreTemp(temp: number): number {
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2;
}

function scoreAvpu(avpu: string): number {
  if (avpu === "Alert") return 0;
  return 3;
}

function getRiskBand(
  score: number,
  hasScore3: boolean,
): {
  label: string;
  color: string;
  bg: string;
  action: string;
} {
  if (score >= 7)
    return {
      label: "HIGH — Clinical Emergency",
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      action:
        "Continuous monitoring. Urgent review by senior clinician. Consider HDU/ICU transfer.",
    };
  if (score >= 5 || hasScore3)
    return {
      label: "MEDIUM — Urgent Review",
      color: "text-orange-700 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      action:
        "30-minute monitoring. Urgent review by doctor or senior nurse. Escalation protocol.",
    };
  if (score >= 1)
    return {
      label: "LOW — Increased Monitoring",
      color: "text-yellow-700 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      action:
        "4–6 hourly observations. Ward nurse review. Inform responsible clinician.",
    };
  return {
    label: "LOW — Routine Monitoring",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    action:
      "Minimum 12-hourly observations. Standard ward care. Continue regular assessment.",
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface EwsScoreModalProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const EwsScoreModal: React.FC<EwsScoreModalProps> = ({ onClose }) => {
  const [rr, setRr] = useState<string>("");
  const [spo2, setSpo2] = useState<string>("");
  const [useScale2, setUseScale2] = useState(false);
  const [onO2, setOnO2] = useState(false);
  const [sbp, setSbp] = useState<string>("");
  const [hr, setHr] = useState<string>("");
  const [temp, setTemp] = useState<string>("");
  const [avpu, setAvpu] = useState<"Alert" | "C" | "V" | "P" | "U">("Alert");

  const result = useMemo(() => {
    const rrN = parseFloat(rr);
    const spo2N = parseFloat(spo2);
    const sbpN = parseFloat(sbp);
    const hrN = parseFloat(hr);
    const tempN = parseFloat(temp);

    if (isNaN(rrN) || isNaN(spo2N) || isNaN(sbpN) || isNaN(hrN) || isNaN(tempN))
      return null;

    const sRR = scoreRR(rrN);
    const sSPO2 = useScale2
      ? scoreSpO2Scale2(spo2N, onO2)
      : scoreSpO2Scale1(spo2N);
    const sO2 = onO2 ? 2 : 0;
    const sSBP = scoreSBP(sbpN);
    const sHR = scoreHR(hrN);
    const sTemp = scoreTemp(tempN);
    const sAvpu = scoreAvpu(avpu);

    const total = sRR + sSPO2 + sO2 + sSBP + sHR + sTemp + sAvpu;
    const hasScore3 = [sRR, sSPO2, sSBP, sHR, sTemp, sAvpu].some(
      (s) => s === 3,
    );

    return {
      total,
      hasScore3,
      breakdown: [
        { label: "Respiratory Rate", value: rrN, score: sRR, unit: "bpm" },
        { label: "SpO₂", value: spo2N, score: sSPO2, unit: "%" },
        {
          label: "Supplemental O₂",
          value: onO2 ? "Yes" : "No",
          score: sO2,
          unit: "",
        },
        { label: "Systolic BP", value: sbpN, score: sSBP, unit: "mmHg" },
        { label: "Heart Rate", value: hrN, score: sHR, unit: "bpm" },
        { label: "Temperature", value: tempN, score: sTemp, unit: "°C" },
        {
          label: "Consciousness (AVPU)",
          value: avpu === "Alert" ? "Alert" : "Not Alert",
          score: sAvpu,
          unit: "",
        },
      ],
      risk: getRiskBand(total, hasScore3),
    };
  }, [rr, spo2, useScale2, onO2, sbp, hr, temp, avpu]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-brand-background dark:bg-dark-brand-background rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-brand-border">
          <div>
            <h2 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              NEWS2 Early Warning Score Calculator
            </h2>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              Royal College of Physicians NEWS2 (2017) · SMCS.87 compliance
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Scale toggle */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <input
              id="scale2"
              type="checkbox"
              checked={useScale2}
              onChange={(e) => setUseScale2(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="scale2"
              className="text-sm text-blue-800 dark:text-blue-300"
            >
              Use SpO₂ Scale 2 (for patients with hypercapnic respiratory
              failure / target SpO₂ 88–92%)
            </label>
          </div>

          {/* Input grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: "rr",
                label: "Respiratory Rate",
                unit: "breaths/min",
                value: rr,
                set: setRr,
                placeholder: "e.g. 18",
              },
              {
                id: "spo2",
                label: "SpO₂",
                unit: "%",
                value: spo2,
                set: setSpo2,
                placeholder: "e.g. 97",
              },
              {
                id: "sbp",
                label: "Systolic Blood Pressure",
                unit: "mmHg",
                value: sbp,
                set: setSbp,
                placeholder: "e.g. 120",
              },
              {
                id: "hr",
                label: "Heart Rate",
                unit: "bpm",
                value: hr,
                set: setHr,
                placeholder: "e.g. 80",
              },
              {
                id: "temp",
                label: "Temperature",
                unit: "°C",
                value: temp,
                set: setTemp,
                placeholder: "e.g. 37.2",
              },
            ].map((f) => (
              <div key={f.id}>
                <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                  {f.label} <span className="text-gray-400">({f.unit})</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Consciousness (AVPU)
              </label>
              <select
                value={avpu}
                onChange={(e) => setAvpu(e.target.value as typeof avpu)}
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              >
                <option value="Alert">Alert</option>
                <option value="C">Confusion (new)</option>
                <option value="V">Voice</option>
                <option value="P">Pain</option>
                <option value="U">Unresponsive</option>
              </select>
            </div>
          </div>

          {/* Supplemental O2 */}
          <div className="flex items-center gap-3">
            <input
              id="o2"
              type="checkbox"
              checked={onO2}
              onChange={(e) => setOnO2(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="o2"
              className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary"
            >
              Patient on supplemental oxygen (+2 points)
            </label>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Score + risk band */}
              <div
                className={`rounded-xl p-4 ${result.risk.bg} border border-current/20 text-center`}
              >
                <div className={`text-5xl font-bold ${result.risk.color} mb-1`}>
                  {result.total}
                </div>
                <div className={`text-sm font-semibold ${result.risk.color}`}>
                  {result.risk.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {result.risk.action}
                </div>
              </div>

              {/* Breakdown */}
              <div className="rounded-lg border border-gray-200 dark:border-dark-brand-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-dark-brand-surface">
                    <tr>
                      <th className="px-3 py-2 text-left text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        Parameter
                      </th>
                      <th className="px-3 py-2 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        Value
                      </th>
                      <th className="px-3 py-2 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-brand-border">
                    {result.breakdown.map((row) => (
                      <tr
                        key={row.label}
                        className={
                          row.score >= 3
                            ? "bg-red-50 dark:bg-red-900/10"
                            : row.score >= 2
                              ? "bg-orange-50 dark:bg-orange-900/10"
                              : ""
                        }
                      >
                        <td className="px-3 py-2 text-brand-text-primary dark:text-dark-brand-text-primary">
                          {row.label}
                        </td>
                        <td className="px-3 py-2 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {row.value}
                          {row.unit ? ` ${row.unit}` : ""}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                          {row.score}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-dark-brand-surface font-bold">
                      <td className="px-3 py-2 text-brand-text-primary dark:text-dark-brand-text-primary">
                        TOTAL
                      </td>
                      <td />
                      <td className="px-3 py-2 text-center text-brand-text-primary dark:text-dark-brand-text-primary">
                        {result.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!result && (
            <p className="text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary py-4">
              Enter all vital signs above to calculate the NEWS2 score.
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-dark-brand-border text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-dark-brand-surface transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EwsScoreModal;
