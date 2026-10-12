/**
 * QC Dashboard Tab
 * Overview of all QC data with Levey-Jennings chart visualization and Westgard rule summary
 */
import React, { useMemo, useState } from "react";
import LabLogPager from "./LabLogPager";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { Card } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import type { IQCAnalyte, IQCResult } from "@/types/labOps";

const MAX_QC_CHART_POINTS = 50;

/**
 * Levey-Jennings chart plotting saved measurements against the analyte's
 * configured target mean and standard deviation.
 */
const LeveyJenningsChart: React.FC<{
  analyte: IQCAnalyte;
  results: IQCResult[];
  title: string;
  chartLabel: string;
}> = ({ analyte, results, title, chartLabel }) => {
  const { targetMean: mean, targetSD: sd } = analyte;
  if (results.length < 2 || !Number.isFinite(sd) || sd <= 0) return null;

  const W = 400;
  const H = 160;
  const PAD_L = 40;
  const PAD_R = 10;
  const PAD_T = 10;
  const PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const zScores = results.map(
    (result) => (result.measuredValue - mean) / sd,
  );
  const extent = Math.max(4, ...zScores.map((zScore) => Math.abs(zScore) + 0.5));
  const yMin = mean - extent * sd;
  const yMax = mean + extent * sd;
  const yScale = (v: number) =>
    PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const xStep = plotW / (results.length - 1);

  const sdLines = [-3, -2, -1, 0, 1, 2, 3].map((n) => ({
    y: yScale(mean + n * sd),
    label: n === 0 ? `μ` : `${n > 0 ? "+" : ""}${n}SD`,
    color:
      Math.abs(n) === 3
        ? "#ef4444"
        : Math.abs(n) === 2
          ? "#f59e0b"
          : Math.abs(n) === 1
            ? "#3b82f6"
            : "#111",
    dash: Math.abs(n) >= 2 ? "4,3" : n === 0 ? "0" : "2,2",
  }));

  const points = results.map((result, i) => ({
    result,
    x: PAD_L + i * xStep,
    y: yScale(result.measuredValue),
    zScore: zScores[i],
  }));

  return (
    <div>
      <p className="text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
        {title}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[420px] bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
        role="img"
        aria-label={`${title} ${chartLabel}`}
      >
        <title>{`${title} ${chartLabel}`}</title>
        {/* SD reference lines */}
        {sdLines.map((line) => (
          <g key={line.label}>
            <line
              x1={PAD_L}
              y1={line.y}
              x2={W - PAD_R}
              y2={line.y}
              stroke={line.color}
              strokeWidth={line.label === "μ" ? 1.5 : 0.8}
              strokeDasharray={line.dash}
              opacity={0.6}
            />
            <text
              x={PAD_L - 3}
              y={line.y + 3}
              textAnchor="end"
              fontSize={8}
              fill={line.color}
            >
              {line.label}
            </text>
          </g>
        ))}
        {/* Data line */}
        {points.length > 1 && (
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#2563eb"
            strokeWidth={1.5}
          />
        )}
        {/* Data points */}
        {points.map((p, i) => {
          const absZ = Math.abs(p.zScore);
          const fill = p.result.rejected || absZ >= 3
            ? "#ef4444"
            : p.result.violatedRules.length > 0 || absZ >= 2
              ? "#f59e0b"
              : "#2563eb";
          return (
            <circle key={p.result.id} cx={p.x} cy={p.y} r={3} fill={fill}>
              <title>
                {`${p.result.measuredAt}: ${p.result.measuredValue} ${analyte.unit} (${p.zScore.toFixed(2)} SD)`}
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};

const QCDashboardTab: React.FC = () => {
  const [calibrationLimit, setCalibrationLimit] = useState(25);
  const { t } = useTranslation();
  const { equipment, calibrations, maintenanceLogs, reagents, iqcAnalytes, iqcResults } =
    useLabOpsStore();

  const today = new Date().toISOString().split("T")[0];

  // Overall equipment health
  const activeEquip = equipment.filter((e) => e.status === "active").length;
  const calDue = equipment.filter(
    (e) =>
      e.nextCalibrationDue &&
      e.nextCalibrationDue < today &&
      e.status !== "decommissioned",
  ).length;
  const pmDue = equipment.filter(
    (e) =>
      e.nextMaintenanceDue &&
      e.nextMaintenanceDue < today &&
      e.status !== "decommissioned",
  ).length;

  // Reagent alerts
  const lowStock = reagents.filter((r) => r.status === "low_stock").length;
  const expired = reagents.filter((r) => r.status === "expired").length;

  // Calibration pass rate
  const recent6mo = calibrations.filter((c) => {
    const d = new Date(c.calibrationDate);
    return d >= new Date(Date.now() - 180 * 86400000);
  });
  const passRate =
    recent6mo.length > 0
      ? Math.round(
          (recent6mo.filter((c) => c.result !== "fail").length /
            recent6mo.length) *
            100,
        )
      : 100;

  // Maintenance completion rate (last 6 months)
  const recentMaint = maintenanceLogs.filter((m) => {
    const d = new Date(m.scheduledDate);
    return d >= new Date(Date.now() - 180 * 86400000);
  });
  const maintComplete =
    recentMaint.length > 0
      ? Math.round(
          (recentMaint.filter((m) => m.status === "completed").length /
            recentMaint.length) *
            100,
        )
      : 100;

  const iqcCharts = useMemo(
    () => iqcAnalytes
      .filter((analyte) => analyte.active)
      .map((analyte) => ({
        analyte,
        results: iqcResults
          .filter((result) =>
            result.analyteId === analyte.id && result.level === analyte.level)
          .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
          .slice(-MAX_QC_CHART_POINTS),
      })),
    [iqcAnalytes, iqcResults],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
        {t("qcDashboardTitle")}
      </h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{activeEquip}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("activeEquipment")}
          </p>
        </Card>
        <Card
          className={`p-3 text-center ${calDue > 0 ? "border-red-300 bg-red-50 dark:bg-red-900/20" : ""}`}
        >
          <p
            className={`text-2xl font-bold ${calDue > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {calDue}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("calibrationOverdue")}
          </p>
        </Card>
        <Card
          className={`p-3 text-center ${pmDue > 0 ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20" : ""}`}
        >
          <p
            className={`text-2xl font-bold ${pmDue > 0 ? "text-orange-600" : "text-green-600"}`}
          >
            {pmDue}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("pmOverdue")}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p
            className={`text-2xl font-bold ${passRate >= 95 ? "text-green-600" : passRate >= 80 ? "text-yellow-600" : "text-red-600"}`}
          >
            {passRate}%
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("calPassRate6mo")}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p
            className={`text-2xl font-bold ${maintComplete >= 90 ? "text-green-600" : "text-yellow-600"}`}
          >
            {maintComplete}%
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("pmCompletion6mo")}
          </p>
        </Card>
        <Card
          className={`p-3 text-center ${lowStock + expired > 0 ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
        >
          <p
            className={`text-2xl font-bold ${lowStock + expired > 0 ? "text-yellow-600" : "text-green-600"}`}
          >
            {lowStock + expired}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("reagentAlerts")}
          </p>
        </Card>
      </div>

      {/* Alert panels */}
      {(calDue > 0 || pmDue > 0 || lowStock > 0 || expired > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {calDue > 0 && (
            <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-red-700 dark:text-red-400">
                  {t("overdueCalibrations")} ({calDue})
                </h3>
              </div>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                {equipment
                  .filter(
                    (e) =>
                      e.nextCalibrationDue &&
                      e.nextCalibrationDue < today &&
                      e.status !== "decommissioned",
                  )
                  .map((e) => (
                    <li key={e.id}>
                      {e.name} — {t("due")} {e.nextCalibrationDue}
                    </li>
                  ))}
              </ul>
            </Card>
          )}
          {(lowStock > 0 || expired > 0) && (
            <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
                  {t("reagentAlerts")}
                </h3>
              </div>
              <ul className="text-sm space-y-1">
                {reagents
                  .filter(
                    (r) => r.status === "low_stock" || r.status === "expired",
                  )
                  .map((r) => (
                    <li
                      key={r.id}
                      className={
                        r.status === "expired"
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }
                    >
                      {r.name} —{" "}
                      {r.status === "expired"
                        ? `${t("expired")} ${r.expirationDate}`
                        : `${t("lowLabel")} ${r.quantity} ${r.unit}`}
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Levey-Jennings charts */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
          {t("leveyJenningsTitle")}
        </h3>
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-4">
          {t("leveyJenningsDesc")}
        </p>
        {iqcCharts.length === 0 ? (
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("iqcNoActiveAnalytesHint")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {iqcCharts.map(({ analyte, results }) => {
              const title = `${analyte.analyteName} — ${t("controlLevel")} ${analyte.level}`;
              const invalidTarget = !Number.isFinite(analyte.targetSD) || analyte.targetSD <= 0;
              return (
                <div key={analyte.id}>
                  {results.length >= 2 && !invalidTarget ? (
                    <LeveyJenningsChart
                      analyte={analyte}
                      results={results}
                      title={title}
                      chartLabel={t("iqcLeveyJennings")}
                    />
                  ) : (
                    <div>
                      <p className="text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                        {title}
                      </p>
                      <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {invalidTarget ? t("qcInvalidTargetSD") : t("iqcNoChartData")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent calibrations */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
          {t("recentCalibrations")}
        </h3>
        {recent6mo.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noCalibrations6mo")}</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-2 py-1.5 text-left font-medium">
                  {t("thEquipment")}
                </th>
                <th className="px-2 py-1.5 text-left font-medium">
                  {t("thDate")}
                </th>
                <th className="px-2 py-1.5 text-left font-medium">
                  {t("thResult")}
                </th>
                <th className="px-2 py-1.5 text-left font-medium">
                  {t("thBy")}
                </th>
                <th className="px-2 py-1.5 text-left font-medium">
                  {t("thNextDue")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recent6mo.slice(0, calibrationLimit).map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="px-2 py-1.5 dark:text-dark-brand-text-primary">
                    {c.equipmentName}
                  </td>
                  <td className="px-2 py-1.5">{c.calibrationDate}</td>
                  <td
                    className={`px-2 py-1.5 font-medium ${c.result === "pass" ? "text-green-600" : c.result === "fail" ? "text-red-600" : "text-yellow-600"}`}
                  >
                    <div className="flex items-center gap-1">
                      {c.result === "pass" ? (
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                      ) : c.result === "fail" ? (
                        <XCircleIcon className="h-3.5 w-3.5" />
                      ) : (
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                      )}
                      {c.result.charAt(0).toUpperCase() + c.result.slice(1)}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">{c.calibratedBy}</td>
                  <td className="px-2 py-1.5">{c.nextDueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <LabLogPager visible={calibrationLimit} total={recent6mo.length} onMore={() => setCalibrationLimit((n) => n + 25)} />
      </Card>
    </div>
  );
};

export default QCDashboardTab;
