/**
 * BurnsCalculatorModal.tsx
 *
 * Interactive Burns Care assessment tool for SMCS Burn Care Unit.
 * Satisfies SMCS Burn Care Unit department standards.
 *
 * Calculates:
 * - Parkland formula: 4 ml × weight (kg) × TBSA% — fluid resuscitation
 * - Curreri formula: caloric requirements
 * - Provides Lund & Browder TBSA guide
 */

import { XMarkIcon } from "@/components/icons";
import React, { useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BurnsCalculatorModalProps {
  onClose: () => void;
}

// ── Lund & Browder reference areas (% TBSA, adult) ───────────────────────────

const LUND_BROWDER_AREAS = [
  { area: "Head (A)", adult: 9 },
  { area: "Neck", adult: 2 },
  { area: "Anterior Trunk", adult: 18 },
  { area: "Posterior Trunk", adult: 18 },
  { area: "Right Upper Arm", adult: 4 },
  { area: "Left Upper Arm", adult: 4 },
  { area: "Right Lower Arm", adult: 3 },
  { area: "Left Lower Arm", adult: 3 },
  { area: "Right Hand", adult: 2.5 },
  { area: "Left Hand", adult: 2.5 },
  { area: "Genitalia / Perineum", adult: 1 },
  { area: "Right Thigh (B)", adult: 9.5 },
  { area: "Left Thigh (B)", adult: 9.5 },
  { area: "Right Lower Leg (C)", adult: 7 },
  { area: "Left Lower Leg (C)", adult: 7 },
  { area: "Right Foot", adult: 3.5 },
  { area: "Left Foot", adult: 3.5 },
];

// ── Burn depth classification ─────────────────────────────────────────────────

const DEPTH_INFO = [
  {
    label: "Superficial (1st degree)",
    desc: "Epidermis only. Painful, erythema. No blisters.",
    notes: "NOT included in TBSA for resuscitation.",
    color:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
  },
  {
    label: "Superficial Partial (2nd degree)",
    desc: "Superficial dermis. Blisters, moist, very painful.",
    notes: "Include in TBSA.",
    color:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
  },
  {
    label: "Deep Partial (2nd degree)",
    desc: "Deep dermis. May be pale/mottled, decreased sensation.",
    notes: "Include in TBSA. Consider grafting.",
    color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
  },
  {
    label: "Full Thickness (3rd degree)",
    desc: "All skin layers. Leathery, painless, charred.",
    notes: "Include in TBSA. Grafting required.",
    color: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const BurnsCalculatorModal: React.FC<BurnsCalculatorModalProps> = ({
  onClose,
}) => {
  const [weight, setWeight] = useState<string>("");
  const [tbsa, setTbsa] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [burnTimeHours, setBurnTimeHours] = useState<string>("0");
  const [activeTab, setActiveTab] = useState<"calculator" | "lund" | "depth">(
    "calculator",
  );

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const t = parseFloat(tbsa);
    const a = parseFloat(age);

    if (isNaN(w) || isNaN(t) || w <= 0 || t <= 0) return null;

    // Parkland: 4 ml × kg × %TBSA total in 24h (Lactated Ringer's)
    const total24h = 4 * w * t;
    const first8h = total24h / 2;
    const next16h = total24h / 2;

    // Elapsed time since burn
    const elapsed = parseFloat(burnTimeHours) || 0;
    const remainingFirst8h = Math.max(0, 8 - elapsed);
    const rateFirst8h = remainingFirst8h > 0 ? first8h / remainingFirst8h : 0;
    const rateNext16h = next16h / 16;

    // Urine output target
    const uoMin = (w * 0.5).toFixed(1);
    const uoMax = (w * 1.0).toFixed(1);

    // Curreri formula (caloric requirement): adults
    // 25 kcal × kg + 40 kcal × %TBSA
    const curreri = !isNaN(a) && a >= 18 ? 25 * w + 40 * t : null;

    // Colloid (second 24h): 0.3–0.5 ml × kg × %TBSA
    const colloidLow = (0.3 * w * t).toFixed(0);
    const colloidHigh = (0.5 * w * t).toFixed(0);

    // Severity classification
    let severity = "";
    if (t >= 25) severity = "Major/Critical";
    else if (t >= 15) severity = "Major";
    else if (t >= 10) severity = "Moderate";
    else severity = "Minor";

    return {
      total24h: total24h.toFixed(0),
      first8h: first8h.toFixed(0),
      next16h: next16h.toFixed(0),
      rateFirst8h: rateFirst8h.toFixed(0),
      rateNext16h: rateNext16h.toFixed(0),
      uoMin,
      uoMax,
      curreri: curreri?.toFixed(0),
      colloidLow,
      colloidHigh,
      severity,
    };
  }, [weight, tbsa, burnTimeHours, age]);

  const tabs = [
    { id: "calculator" as const, label: "Parkland Formula" },
    { id: "lund" as const, label: "Lund & Browder" },
    { id: "depth" as const, label: "Burn Depth Guide" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-brand-background dark:bg-dark-brand-background rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-brand-border">
          <div>
            <h2 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              Burns Assessment & Fluid Calculator
            </h2>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              Parkland Formula · Lund & Browder · SMCS Burn Care Unit
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-brand-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-brand-primary border-b-2 border-brand-primary"
                  : "text-brand-text-secondary dark:text-dark-brand-text-secondary hover:text-brand-text-primary dark:hover:text-dark-brand-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Calculator Tab ── */}
          {activeTab === "calculator" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "weight",
                    label: "Patient Weight",
                    unit: "kg",
                    value: weight,
                    set: setWeight,
                    placeholder: "e.g. 70",
                  },
                  {
                    id: "tbsa",
                    label: "TBSA Burned (2nd & 3rd degree only)",
                    unit: "%",
                    value: tbsa,
                    set: setTbsa,
                    placeholder: "e.g. 25",
                  },
                  {
                    id: "age",
                    label: "Patient Age (for Curreri)",
                    unit: "years",
                    value: age,
                    set: setAge,
                    placeholder: "e.g. 35",
                  },
                  {
                    id: "elapsed",
                    label: "Hours elapsed since burn",
                    unit: "hrs",
                    value: burnTimeHours,
                    set: setBurnTimeHours,
                    placeholder: "0",
                  },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                      {f.label}{" "}
                      <span className="text-gray-400">({f.unit})</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>

              {result ? (
                <div className="space-y-4">
                  {/* Severity badge */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-dark-brand-surface rounded-lg">
                    <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Burn severity:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        result.severity === "Major/Critical"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : result.severity === "Major"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : result.severity === "Moderate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {result.severity} — {tbsa}% TBSA
                    </span>
                  </div>

                  {/* First 24h */}
                  <div className="rounded-xl border border-gray-200 dark:border-dark-brand-border overflow-hidden">
                    <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 font-semibold text-sm text-orange-800 dark:text-orange-300">
                      Resuscitation — First 24 Hours (Lactated Ringer's /
                      Hartmann's)
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-dark-brand-border">
                      {[
                        {
                          label: "Total Volume (24h)",
                          value: `${result.total24h} ml`,
                          sub: `4 × ${weight} kg × ${tbsa}%`,
                        },
                        {
                          label: "First 8 hours",
                          value: `${result.first8h} ml`,
                          sub: `Rate: ${result.rateFirst8h} ml/hr (remaining time from burn)`,
                        },
                        {
                          label: "Next 16 hours",
                          value: `${result.next16h} ml`,
                          sub: `Rate: ${result.rateNext16h} ml/hr`,
                        },
                        {
                          label: "Target Urine Output",
                          value: `${result.uoMin}–${result.uoMax} ml/hr`,
                          sub: "0.5–1 ml/kg/hr (adjust fluids to maintain)",
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between items-center px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                              {row.label}
                            </div>
                            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                              {row.sub}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-brand-primary">
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Second 24h */}
                  <div className="rounded-xl border border-gray-200 dark:border-dark-brand-border overflow-hidden">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 font-semibold text-sm text-blue-800 dark:text-blue-300">
                      Second 24 Hours (Colloid + Dextrose)
                    </div>
                    <div className="px-4 py-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                      Colloid (5% albumin): {result.colloidLow}–
                      {result.colloidHigh} ml + 5% Dextrose to maintain urine
                      output. Adjust based on clinical response.
                    </div>
                  </div>

                  {/* Nutrition */}
                  {result.curreri && (
                    <div className="rounded-xl border border-gray-200 dark:border-dark-brand-border overflow-hidden">
                      <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2.5 font-semibold text-sm text-green-800 dark:text-green-300">
                        Nutritional Target (Curreri Formula)
                      </div>
                      <div className="px-4 py-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                        Estimated caloric requirement:{" "}
                        <strong>{result.curreri} kcal/day</strong>
                        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                          Formula: 25 kcal × {weight} kg + 40 × {tbsa}% TBSA.
                          Consult dietitian for detailed plan.
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    ⚠️ These are starting targets only. Adjust fluid rate based
                    on urine output, haemodynamic response, and senior clinician
                    review. This tool does not replace clinical judgement.
                  </p>
                </div>
              ) : (
                <p className="text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary py-6">
                  Enter patient weight and TBSA% to calculate resuscitation
                  volumes.
                </p>
              )}
            </div>
          )}

          {/* ── Lund & Browder Tab ── */}
          {activeTab === "lund" && (
            <div className="space-y-3">
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Standard Lund & Browder body area percentages (adult). Use this
                as a reference when estimating TBSA for the calculator.
                <strong> Do not include superficial (1st degree) burns.</strong>
              </p>
              <div className="rounded-lg border border-gray-200 dark:border-dark-brand-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-dark-brand-surface">
                    <tr>
                      <th className="px-3 py-2 text-left text-brand-text-secondary dark:text-dark-brand-text-secondary font-medium">
                        Body Area
                      </th>
                      <th className="px-3 py-2 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary font-medium">
                        Adult % TBSA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-brand-border">
                    {LUND_BROWDER_AREAS.map((row) => (
                      <tr
                        key={row.area}
                        className="hover:bg-gray-50 dark:hover:bg-dark-brand-surface"
                      >
                        <td className="px-3 py-2 text-brand-text-primary dark:text-dark-brand-text-primary">
                          {row.area}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                          {row.adult}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-dark-brand-surface font-bold">
                      <td className="px-3 py-2 text-brand-text-primary dark:text-dark-brand-text-primary">
                        TOTAL
                      </td>
                      <td className="px-3 py-2 text-center text-brand-text-primary dark:text-dark-brand-text-primary">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Note: Areas A, B, C vary with age in paediatric patients. Use
                age-adjusted charts for patients under 15 years.
              </p>
            </div>
          )}

          {/* ── Depth Guide Tab ── */}
          {activeTab === "depth" && (
            <div className="space-y-3">
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Burn depth classification guide for SMCS Burns Care Unit
                assessment documentation.
              </p>
              {DEPTH_INFO.map((d) => (
                <div
                  key={d.label}
                  className={`rounded-lg p-4 ${d.color} border border-current/20`}
                >
                  <div className="font-semibold text-sm">{d.label}</div>
                  <div className="text-xs mt-1">{d.desc}</div>
                  <div className="text-xs mt-1 font-medium">{d.notes}</div>
                </div>
              ))}
            </div>
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

export default BurnsCalculatorModal;
