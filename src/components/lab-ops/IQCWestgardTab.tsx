/**
 * IQC / Westgard Rules Engine Tab
 * Internal Quality Control with Levey-Jennings charting and automatic
 * Westgard multi-rule detection. ISO 15189 / CBAHI / CAP compliant.
 */
import React, { useMemo, useState } from "react";

import AISuggestionModal from "@/components/ai/AISuggestionModal";
import {
  ChartPieIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type { IQCAnalyte, IQCResult } from "@/types/labOps";
import {
  applyWestgardRules,
  checkCompetencyAuthorization,
  WESTGARD_REJECT_RULES,
  WESTGARD_RULE_LABELS,
} from "@/types/labOps";

// ── Levey-Jennings SVG Chart ─────────────────────────────────────────────────

interface LJProps {
  results: IQCResult[];
  mean: number;
  sd: number;
  unit: string;
  label: string;
}

const LeveyJenningsChart: React.FC<LJProps> = ({
  results,
  mean,
  sd,
  unit,
  label,
}) => {
  if (results.length < 2 || sd === 0) return null;

  const W = 560;
  const H = 200;
  const PL = 46;
  const PR = 8;
  const PT = 10;
  const PB = 22;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  const yMin = mean - 4.2 * sd;
  const yMax = mean + 4.2 * sd;
  // In SVG y increases downward; higher values map to smaller y
  const toY = (v: number) => PT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const pts = results.map((r, i) => ({
    x:
      PL +
      (results.length === 1 ? plotW / 2 : (i / (results.length - 1)) * plotW),
    y: toY(r.measuredValue),
    z: r.sdFromMean,
    rejected: r.rejected,
    warned: !r.rejected && r.violatedRules.length > 0,
    value: r.measuredValue,
    rules: r.violatedRules,
    date: r.measuredAt.slice(5, 10),
    by: r.measuredBy,
  }));

  // Colored zones: each rect needs y = top (smaller number), height > 0
  const zones = [
    {
      y: toY(mean + 4.2 * sd),
      h: toY(mean + 3 * sd) - toY(mean + 4.2 * sd),
      fill: "#fee2e2",
      op: 0.5,
    },
    {
      y: toY(mean + 3 * sd),
      h: toY(mean + 2 * sd) - toY(mean + 3 * sd),
      fill: "#fef9c3",
      op: 0.55,
    },
    {
      y: toY(mean + 2 * sd),
      h: toY(mean - 2 * sd) - toY(mean + 2 * sd),
      fill: "#f0fdf4",
      op: 0.45,
    },
    {
      y: toY(mean - 2 * sd),
      h: toY(mean - 3 * sd) - toY(mean - 2 * sd),
      fill: "#fef9c3",
      op: 0.55,
    },
    {
      y: toY(mean - 3 * sd),
      h: toY(mean - 4.2 * sd) - toY(mean - 3 * sd),
      fill: "#fee2e2",
      op: 0.5,
    },
  ];

  const refLines = [
    { v: mean + 3 * sd, lbl: "+3SD", color: "#ef4444" },
    { v: mean + 2 * sd, lbl: "+2SD", color: "#f59e0b" },
    { v: mean + sd, lbl: "+1SD", color: "#86efac" },
    { v: mean, lbl: "\u03bc", color: "#6b7280" },
    { v: mean - sd, lbl: "-1SD", color: "#86efac" },
    { v: mean - 2 * sd, lbl: "-2SD", color: "#f59e0b" },
    { v: mean - 3 * sd, lbl: "-3SD", color: "#ef4444" },
  ];

  return (
    <div className="overflow-x-auto">
      <p className="text-xs font-medium mb-1 text-brand-text-primary dark:text-dark-brand-text-primary">
        {label} &mdash; target: {mean} &plusmn; {sd} {unit}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
      >
        {zones.map((z, i) => (
          <rect
            key={i}
            x={PL}
            y={z.y}
            width={plotW}
            height={z.h}
            fill={z.fill}
            opacity={z.op}
          />
        ))}

        {refLines.map((rl) => {
          const ry = toY(rl.v);
          return (
            <g key={rl.lbl}>
              <line
                x1={PL}
                y1={ry}
                x2={W - PR}
                y2={ry}
                stroke={rl.color}
                strokeWidth={rl.lbl === "\u03bc" ? 1.5 : 0.8}
                strokeDasharray={rl.lbl === "\u03bc" ? "0" : "4,3"}
                opacity={0.8}
              />
              <text
                x={PL - 3}
                y={ry + 3}
                textAnchor="end"
                fontSize={8}
                fill={rl.color}
                opacity={0.9}
              >
                {rl.lbl}
              </text>
            </g>
          );
        })}

        {pts.map((p, i) =>
          pts.length <= 10 || i % 2 === 0 ? (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={H - 5}
              textAnchor="middle"
              fontSize={7}
              fill="#9ca3af"
            >
              {p.date}
            </text>
          ) : null,
        )}

        {pts.length > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.2}
          />
        )}

        {pts.map((p, i) => {
          const fill = p.rejected
            ? "#ef4444"
            : p.warned
              ? "#f59e0b"
              : "#22c55e";
          const r = p.rejected || p.warned ? 5 : 4;
          const tooltip = `${p.date} | ${p.value} ${unit} | z=${p.z >= 0 ? "+" : ""}${p.z.toFixed(2)} | ${p.rules.length ? p.rules.join(", ") : "In-control"} | ${p.by}`;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={r}
              fill={fill}
              stroke="white"
              strokeWidth={1.2}
            >
              <title>{tooltip}</title>
            </circle>
          );
        })}
      </svg>

      <div className="flex gap-5 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          In-control
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
          Warning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          Rejected
        </span>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const IQCWestgardTab: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    iqcAnalytes,
    iqcResults,
    competencyRecords,
    reagents,
    addIQCAnalyte,
    addIQCResult,
    updateIQCResult,
    addCAPARecord,
    addQualityEvent,
    addQualityRisk,
    updateReagent,
  } = useLabOpsStore();

  const [selectedAnalyteId, setSelectedAnalyteId] = useState<string>(
    iqcAnalytes[0]?.id ?? "",
  );
  const [showResultForm, setShowResultForm] = useState(false);
  const [showAnalyteForm, setShowAnalyteForm] = useState(false);
  const [resultForm, setResultForm] = useState({
    measuredValue: "",
    measuredBy: "",
    measuredAt: new Date().toISOString().slice(0, 16),
    reagentLot: "",
    note: "",
  });
  const [analyteForm, setAnalyteForm] = useState<Partial<IQCAnalyte>>({
    level: 1,
    active: true,
  });
  const [justLogged, setJustLogged] = useState<IQCResult | null>(null);
  const [aiModal, setAiModal] = useState<{
    open: boolean;
    title: string;
    content: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const activeAnalytes = useMemo(
    () => iqcAnalytes.filter((a) => a.active),
    [iqcAnalytes],
  );
  const selectedAnalyte = activeAnalytes.find(
    (a) => a.id === selectedAnalyteId,
  );

  const analyteResults = useMemo(() => {
    if (!selectedAnalyte) return [];
    return iqcResults
      .filter((r) => r.analyteId === selectedAnalyte.id)
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  }, [iqcResults, selectedAnalyte]);

  const chartResults = analyteResults.slice(-20);

  // KPIs
  const activeCount = iqcAnalytes.filter((a) => a.active).length;
  const todayResults = iqcResults.filter((r) => r.measuredAt.startsWith(today));
  const todayViolations = todayResults.filter(
    (r) => r.violatedRules.length > 0,
  ).length;
  const todayInControlPct =
    todayResults.length > 0
      ? Math.round(
          (todayResults.filter((r) => r.violatedRules.length === 0).length /
            todayResults.length) *
            100,
        )
      : 100;
  const totalRejected = iqcResults.filter((r) => r.rejected).length;

  const liveZ =
    resultForm.measuredValue !== "" &&
    !isNaN(parseFloat(resultForm.measuredValue)) &&
    selectedAnalyte
      ? (
          (parseFloat(resultForm.measuredValue) - selectedAnalyte.targetMean) /
          selectedAnalyte.targetSD
        ).toFixed(2)
      : null;

  const competencyGate = useMemo(() => {
    if (!selectedAnalyte) {
      return { authorized: false, status: "missing" as const };
    }
    return checkCompetencyAuthorization(
      competencyRecords,
      resultForm.measuredBy,
      selectedAnalyte.analyteCode,
      resultForm.measuredAt
        ? new Date(resultForm.measuredAt).toISOString()
        : undefined,
    );
  }, [
    competencyRecords,
    resultForm.measuredAt,
    resultForm.measuredBy,
    selectedAnalyte,
  ]);

  const handleLogResult = () => {
    const val = parseFloat(resultForm.measuredValue);
    if (!selectedAnalyte || isNaN(val) || !resultForm.measuredBy.trim()) return;
    if (!competencyGate.authorized) {
      toast.error(
        t("iqcCompetencyBlocked") ||
          "Operator is not authorized for this analyte. Update competency matrix before logging.",
      );
      return;
    }

    const z = parseFloat(
      ((val - selectedAnalyte.targetMean) / selectedAnalyte.targetSD).toFixed(
        3,
      ),
    );
    const history = [...analyteResults].reverse();
    const rules = applyWestgardRules(history, z);
    const rejected = rules.some((r) => WESTGARD_REJECT_RULES.has(r));

    const now = new Date().toISOString();
    const result: IQCResult = {
      id: `iqcr-${Date.now()}`,
      analyteId: selectedAnalyte.id,
      analyteName: selectedAnalyte.analyteName,
      analyteCode: selectedAnalyte.analyteCode,
      labSection: selectedAnalyte.labSection,
      equipmentId: selectedAnalyte.equipmentId,
      level: selectedAnalyte.level,
      measuredValue: val,
      sdFromMean: z,
      measuredAt: resultForm.measuredAt
        ? new Date(resultForm.measuredAt).toISOString()
        : now,
      measuredBy: resultForm.measuredBy.trim(),
      reagentLot: resultForm.reagentLot.trim() || undefined,
      violatedRules: rules,
      rejected,
      operatorAuthorizationStatus: competencyGate.status,
      operatorCompetencyRecordId: competencyGate.record?.id,
      note: resultForm.note.trim() || undefined,
      createdAt: now,
    };

    if (rejected && result.reagentLot) {
      const reagent = reagents.find(
        (r) =>
          r.lotNumber === result.reagentLot &&
          r.labSection.toLowerCase() === result.labSection.toLowerCase(),
      );

      if (reagent) {
        const riskId = `qr-iqc-${Date.now()}`;
        const capaId = `capa-iqc-${Date.now()}`;
        const score = Math.min(25, 4 * 5);

        addQualityRisk({
          id: riskId,
          title: `Supplier-linked IQC instability: ${result.analyteCode} lot ${result.reagentLot}`,
          hazard: "Potential reagent lot instability causing analytical drift",
          potentialHarm:
            "Delayed reporting, inaccurate patient results, and increased rerun burden",
          labSection: result.labSection,
          owner: "Quality Manager",
          likelihood: 4,
          impact: 5,
          riskScore: score,
          riskLevel: "critical",
          status: "open",
          relatedSupplierId: reagent.supplierId,
          relatedSupplierName: reagent.supplierName,
          relatedReagentLot: reagent.lotNumber,
          mitigationPlan:
            "Quarantine impacted lot, verify alternate lot performance, and complete supplier CAPA follow-up.",
          createdAt: now,
          updatedAt: now,
        });

        addCAPARecord({
          id: capaId,
          title: `CAPA: Investigate ${result.reagentLot} IQC rejection trend`,
          owner: "Section Supervisor",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          status: "open",
          actionPlan:
            "Quarantine lot, repeat QC with alternate lot, perform calibration verification, notify supplier, and document disposition decision.",
          effectivenessCriteria:
            "Three consecutive in-control runs with no reject Westgard rules and documented supplier response.",
          createdAt: now,
          updatedAt: now,
        });

        updateReagent({
          ...reagent,
          status: "quarantine",
          qualityFlag: "under_investigation",
          notes: `${reagent.notes ? `${reagent.notes} | ` : ""}Auto-flagged from IQC reject (${result.id}).`,
          updatedAt: now,
        });

        result.linkedRiskRecordId = riskId;
        result.linkedCapaId = capaId;

        toast.warning(
          t("iqcSupplierRiskTriggered") ||
            "Supplier risk signal and CAPA were auto-created. Reagent lot moved to quarantine.",
        );
      }
    }

    addIQCResult(result);
    setJustLogged(result);
    setShowResultForm(false);
    toast.success(
      t("iqcResultLoggedSuccess") || "QC result logged successfully.",
    );
    setResultForm({
      measuredValue: "",
      measuredBy: "",
      measuredAt: new Date().toISOString().slice(0, 16),
      reagentLot: "",
      note: "",
    });
  };

  const handleCreateNC = (result: IQCResult) => {
    if (!selectedAnalyte) return;
    const now = new Date().toISOString();
    const eventId = `qe-iqc-${Date.now()}`;
    const ruleStr = result.violatedRules
      .map((r) => WESTGARD_RULE_LABELS[r])
      .join(", ");

    addQualityEvent({
      id: eventId,
      eventDate: result.measuredAt.split("T")[0],
      labSection: result.labSection,
      source: "internal_qc",
      title: `Westgard violation \u2014 ${result.analyteCode} on ${selectedAnalyte.equipmentName}`,
      description: `IQC result ${result.measuredValue} ${selectedAnalyte.unit} (z=${result.sdFromMean >= 0 ? "+" : ""}${result.sdFromMean.toFixed(2)}) violated: ${ruleStr}. Reported by ${result.measuredBy}.`,
      severity: result.violatedRules.includes("1_3s") ? "critical" : "high",
      status: "open",
      immediateContainment:
        "Patient results on hold pending re-calibration and repeat QC.",
      createdAt: now,
      updatedAt: now,
    });

    const updated = { ...result, linkedQualityEventId: eventId };
    updateIQCResult(updated);
    setJustLogged(updated);
    toast.success(t("iqcNCCreated") || "NC Event Created");
  };

  const handleAnalyzeViolation = async (result: IQCResult) => {
    if (!selectedAnalyte) return;
    setAiLoading(true);
    try {
      const ruleStr = result.violatedRules
        .map((r) => WESTGARD_RULE_LABELS[r])
        .join(", ");
      const prompt =
        `You are a laboratory quality specialist expert in ISO 15189 and Westgard multi-rules.\n` +
        `Analyze the following IQC violation and provide:\n` +
        `(1) Explanation of what each violated rule means clinically\n` +
        `(2) 3-4 most likely root causes for this pattern\n` +
        `(3) Immediate corrective actions before releasing patient results\n\n` +
        `Analyte: ${result.analyteCode} (${result.analyteName})\n` +
        `Analyzer: ${selectedAnalyte.equipmentName}\n` +
        `Lab Section: ${result.labSection}\n` +
        `Measured Value: ${result.measuredValue} ${selectedAnalyte.unit}\n` +
        `Target Mean: ${selectedAnalyte.targetMean} \u00b1 ${selectedAnalyte.targetSD} ${selectedAnalyte.unit}\n` +
        `Z-score: ${result.sdFromMean >= 0 ? "+" : ""}${result.sdFromMean.toFixed(2)}\n` +
        `Rules Violated: ${ruleStr}\n` +
        `Control Level: ${result.level}\n` +
        `Reagent Lot: ${result.reagentLot ?? "Not recorded"}\n\n` +
        `Format with three sections: Rule Interpretation, Root Cause Analysis, Corrective Actions.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModal({
        open: true,
        title: `AI IQC Analysis \u2014 ${result.analyteCode} (${ruleStr})`,
        content: response.response,
      });
    } catch {
      setAiModal({
        open: true,
        title: t("iqcAiAnalyze") || "AI IQC Analysis",
        content: "AI service is temporarily unavailable. Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAnalyte = () => {
    if (
      !analyteForm.analyteName?.trim() ||
      !analyteForm.equipmentName?.trim() ||
      analyteForm.targetMean === undefined ||
      analyteForm.targetSD === undefined
    )
      return;
    const now = new Date().toISOString();
    addIQCAnalyte({
      id: `iqca-${Date.now()}`,
      analyteCode:
        analyteForm.analyteCode?.trim() ||
        analyteForm.analyteName.toUpperCase().slice(0, 8),
      analyteName: analyteForm.analyteName.trim(),
      labSection: analyteForm.labSection?.trim() || "General",
      equipmentId: analyteForm.equipmentId?.trim() || "",
      equipmentName: analyteForm.equipmentName.trim(),
      controlMaterial: analyteForm.controlMaterial?.trim() || "",
      controlLot: analyteForm.controlLot?.trim() || "",
      level: (analyteForm.level ?? 1) as 1 | 2 | 3,
      targetMean: Number(analyteForm.targetMean),
      targetSD: Number(analyteForm.targetSD),
      unit: analyteForm.unit?.trim() || "",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    setShowAnalyteForm(false);
    setAnalyteForm({ level: 1, active: true });
    toast.success(t("iqcAnalyteAddedSuccess") || "Analyte added successfully.");
  };

  const inputCls =
    "w-full px-2.5 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ChartPieIcon className="h-5 w-5 text-brand-primary" />
        <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("iqcWestgardTitle") || "IQC / Westgard Rules Engine"}
        </h2>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-center">
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {activeCount}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            {t("iqcActiveAnalytes") || "Active Analytes"}
          </p>
        </div>
        <div
          className={`rounded-xl border p-3 text-center ${
            todayViolations > 0
              ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          }`}
        >
          <p
            className={`text-2xl font-bold ${todayViolations > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {todayViolations}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            {t("iqcTodayViolations") || "Today's Violations"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-center">
          <p
            className={`text-2xl font-bold ${
              todayInControlPct >= 90 ? "text-green-600" : "text-yellow-600"
            }`}
          >
            {todayInControlPct}%
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            {t("iqcInControlToday") || "In-Control Today"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-center">
          <p
            className={`text-2xl font-bold ${
              totalRejected > 0 ? "text-orange-600" : "text-green-600"
            }`}
          >
            {totalRejected}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            {t("iqcTotalRejected") || "Total Rejected Runs"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedAnalyteId}
          onChange={(e) => {
            setSelectedAnalyteId(e.target.value);
            setJustLogged(null);
          }}
          disabled={activeAnalytes.length === 0}
          className="flex-1 min-w-60 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        >
          {activeAnalytes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.analyteCode} &mdash; {a.analyteName} L{a.level} |{" "}
              {a.equipmentName} ({a.labSection})
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowResultForm((v) => !v);
            setShowAnalyteForm(false);
          }}
          disabled={activeAnalytes.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t("iqcLogResult") || "Log QC Result"}
        </button>
        <button
          onClick={() => {
            setShowAnalyteForm((v) => !v);
            setShowResultForm(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t("iqcAddAnalyte") || "Add Analyte"}
        </button>
      </div>

      {activeAnalytes.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 p-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("iqcNoActiveAnalytesHint") ||
            "No active IQC analytes found. Add an analyte to begin logging QC runs and Westgard analysis."}
        </div>
      )}

      {/* Log result form */}
      {showResultForm && selectedAnalyte && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
          <h3 className="text-sm font-semibold mb-3 text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("iqcLogResult") || "Log QC Result"} &mdash;{" "}
            {selectedAnalyte.analyteCode} L{selectedAnalyte.level}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="number"
              step="any"
              value={resultForm.measuredValue}
              onChange={(e) =>
                setResultForm({ ...resultForm, measuredValue: e.target.value })
              }
              placeholder={`${t("iqcMeasuredValue") || "Measured value"} (${selectedAnalyte.unit}) *`}
              className={inputCls}
            />
            <input
              value={resultForm.measuredBy}
              onChange={(e) =>
                setResultForm({ ...resultForm, measuredBy: e.target.value })
              }
              placeholder={`${t("iqcMeasuredBy") || "Measured by"} *`}
              className={inputCls}
            />
            <input
              type="datetime-local"
              value={resultForm.measuredAt}
              onChange={(e) =>
                setResultForm({ ...resultForm, measuredAt: e.target.value })
              }
              className={inputCls}
            />
            <input
              value={resultForm.reagentLot}
              onChange={(e) =>
                setResultForm({ ...resultForm, reagentLot: e.target.value })
              }
              placeholder={t("iqcReagentLot") || "Reagent lot (optional)"}
              className={inputCls}
            />
          </div>
          <p
            className={`mt-2 text-xs font-medium ${
              competencyGate.authorized
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {competencyGate.authorized
              ? t("iqcCompetencyAuthorized") ||
                "Operator competency verified for selected analyte."
              : competencyGate.status === "expired"
                ? t("iqcCompetencyExpired") ||
                  "Operator competency is expired for this analyte."
                : t("iqcCompetencyMissing") ||
                  "No competency authorization found for this operator and analyte."}
          </p>
          {liveZ !== null && (
            <p
              className={`mt-2 text-sm font-medium ${
                Math.abs(parseFloat(liveZ)) >= 3
                  ? "text-red-600"
                  : Math.abs(parseFloat(liveZ)) >= 2
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              z-score preview: {parseFloat(liveZ) >= 0 ? "+" : ""}
              {liveZ} SD
            </p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowResultForm(false)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleLogResult}
              disabled={!competencyGate.authorized}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
            >
              {t("iqcSubmitResult") || "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* Add analyte form */}
      {showAnalyteForm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
          <h3 className="text-sm font-semibold mb-3 text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("iqcAddAnalyte") || "Add IQC Analyte"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              value={analyteForm.analyteName || ""}
              onChange={(e) =>
                setAnalyteForm({ ...analyteForm, analyteName: e.target.value })
              }
              placeholder={`${t("iqcAnalyteName") || "Analyte name"} *`}
              className={inputCls}
            />
            <input
              value={analyteForm.equipmentName || ""}
              onChange={(e) =>
                setAnalyteForm({
                  ...analyteForm,
                  equipmentName: e.target.value,
                })
              }
              placeholder={`${t("iqcEquipmentName") || "Analyzer name"} *`}
              className={inputCls}
            />
            <input
              value={analyteForm.labSection || ""}
              onChange={(e) =>
                setAnalyteForm({ ...analyteForm, labSection: e.target.value })
              }
              placeholder="Lab section *"
              className={inputCls}
            />
            <select
              value={String(analyteForm.level ?? 1)}
              onChange={(e) =>
                setAnalyteForm({
                  ...analyteForm,
                  level: Number(e.target.value) as 1 | 2 | 3,
                })
              }
              className={inputCls}
            >
              {[1, 2, 3].map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="any"
              value={analyteForm.targetMean ?? ""}
              onChange={(e) =>
                setAnalyteForm({
                  ...analyteForm,
                  targetMean: parseFloat(e.target.value),
                })
              }
              placeholder={`${t("iqcTargetMean") || "Target mean"} *`}
              className={inputCls}
            />
            <input
              type="number"
              step="any"
              value={analyteForm.targetSD ?? ""}
              onChange={(e) =>
                setAnalyteForm({
                  ...analyteForm,
                  targetSD: parseFloat(e.target.value),
                })
              }
              placeholder={`${t("iqcTargetSD") || "Target SD"} *`}
              className={inputCls}
            />
            <input
              value={analyteForm.unit || ""}
              onChange={(e) =>
                setAnalyteForm({ ...analyteForm, unit: e.target.value })
              }
              placeholder={t("iqcUnit") || "Unit (e.g. mg/dL)"}
              className={inputCls}
            />
            <input
              value={analyteForm.controlMaterial || ""}
              onChange={(e) =>
                setAnalyteForm({
                  ...analyteForm,
                  controlMaterial: e.target.value,
                })
              }
              placeholder={t("iqcControlMaterial") || "Control material"}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowAnalyteForm(false)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleAddAnalyte}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
            >
              {t("create") || "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Violation alert banner */}
      {justLogged && justLogged.violatedRules.length > 0 && (
        <div
          className={`rounded-xl border p-4 ${
            justLogged.rejected
              ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
              : "border-yellow-400 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
          }`}
        >
          <div className="flex flex-wrap items-start gap-3">
            <ExclamationTriangleIcon
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                justLogged.rejected ? "text-red-600" : "text-yellow-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  justLogged.rejected
                    ? "text-red-700 dark:text-red-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {justLogged.rejected
                  ? t("iqcRunRejected") || "Run REJECTED"
                  : t("iqcRunWarning") || "Run WARNING"}{" "}
                &mdash;{" "}
                {justLogged.violatedRules
                  .map((r) => WESTGARD_RULE_LABELS[r])
                  .join(", ")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {justLogged.measuredValue} {selectedAnalyte?.unit} &nbsp;|&nbsp;
                z = {justLogged.sdFromMean >= 0 ? "+" : ""}
                {justLogged.sdFromMean.toFixed(2)} SD &nbsp;|&nbsp;{" "}
                {justLogged.measuredBy}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAnalyzeViolation(justLogged)}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-sky-300 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-50 transition-colors"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                {aiLoading
                  ? t("aiAnalyzing") || "Analyzing\u2026"
                  : t("iqcAiAnalyze") || "AI Analyze"}
              </button>
              {!justLogged.linkedQualityEventId ? (
                <button
                  onClick={() => handleCreateNC(justLogged)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {t("iqcCreateNC") || "Create NC Event"}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="h-4 w-4" />
                  {t("iqcNCCreated") || "NC Event Created"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Levey-Jennings chart */}
      {selectedAnalyte && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold mb-3 text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("iqcLeveyJennings") || "Levey-Jennings Chart"} &mdash;{" "}
            {selectedAnalyte.equipmentName}
          </h3>
          {chartResults.length >= 2 ? (
            <LeveyJenningsChart
              results={chartResults}
              mean={selectedAnalyte.targetMean}
              sd={selectedAnalyte.targetSD}
              unit={selectedAnalyte.unit}
              label={`${selectedAnalyte.analyteName} Level ${selectedAnalyte.level}`}
            />
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("iqcNoChartData") ||
                "Log at least 2 results to display the chart."}
            </p>
          )}
        </div>
      )}

      {/* Recent results table */}
      {selectedAnalyte && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("iqcRecentResults") || "Recent Results"}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {analyteResults.length} {t("iqcTotalRuns") || "total runs"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-3 font-medium">
                    {t("iqcDate") || "Date"}
                  </th>
                  <th className="pb-2 pr-3 font-medium">
                    {t("iqcMeasuredValue") || "Value"}
                  </th>
                  <th className="pb-2 pr-3 font-medium">Z-score</th>
                  <th className="pb-2 pr-3 font-medium">
                    {t("iqcMeasuredBy") || "By"}
                  </th>
                  <th className="pb-2 pr-3 font-medium">
                    {t("iqcStatus") || "Status"}
                  </th>
                  <th className="pb-2 font-medium">
                    {t("iqcRules") || "Rules"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...analyteResults]
                  .reverse()
                  .slice(0, 15)
                  .map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 dark:border-gray-700/50 ${
                        r.rejected
                          ? "bg-red-50 dark:bg-red-900/10"
                          : r.violatedRules.length > 0
                            ? "bg-yellow-50 dark:bg-yellow-900/10"
                            : ""
                      }`}
                    >
                      <td className="py-1.5 pr-3 whitespace-nowrap">
                        {r.measuredAt.slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="py-1.5 pr-3 font-mono">
                        {r.measuredValue} {selectedAnalyte.unit}
                      </td>
                      <td
                        className={`py-1.5 pr-3 font-mono font-semibold ${
                          Math.abs(r.sdFromMean) >= 3
                            ? "text-red-600 dark:text-red-400"
                            : Math.abs(r.sdFromMean) >= 2
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {r.sdFromMean >= 0 ? "+" : ""}
                        {r.sdFromMean.toFixed(2)}
                      </td>
                      <td className="py-1.5 pr-3">{r.measuredBy}</td>
                      <td className="py-1.5 pr-3">
                        {r.rejected ? (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            {t("iqcRejected") || "Rejected"}
                          </span>
                        ) : r.violatedRules.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            {t("iqcWarning") || "Warning"}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {t("iqcInControl") || "In-Control"}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5">
                        <div className="flex flex-wrap gap-1">
                          {r.violatedRules.map((rule) => (
                            <span
                              key={rule}
                              className="px-1 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs"
                            >
                              {WESTGARD_RULE_LABELS[rule]}
                            </span>
                          ))}
                          {r.violatedRules.length === 0 && (
                            <span className="text-gray-400">&mdash;</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {analyteResults.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-gray-400 dark:text-gray-500"
                    >
                      {t("iqcNoResults") || "No results logged yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI suggestion modal */}
      {aiModal?.open && (
        <AISuggestionModal
          isOpen={aiModal.open}
          onClose={() => setAiModal(null)}
          title={aiModal.title}
          content={aiModal.content}
          type="risk-assessment"
        />
      )}
    </div>
  );
};

export default IQCWestgardTab;
