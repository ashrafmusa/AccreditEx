/**
 * QC Dashboard Tab
 * Overview of all QC data with Levey-Jennings chart visualization and Westgard rule summary
 */
import React, { useMemo } from "react";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { Card } from "@/components/ui";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";

/**
 * Simple inline Levey-Jennings chart (SVG)
 * Plots QC values against ±1SD, ±2SD, ±3SD limits
 */
const LeveyJenningsChart: React.FC<{
  values: number[];
  mean: number;
  sd: number;
  title: string;
}> = ({ values, mean, sd, title }) => {
  if (!values.length || sd === 0) return null;

  const W = 400;
  const H = 160;
  const PAD_L = 40;
  const PAD_R = 10;
  const PAD_T = 10;
  const PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const yMin = mean - 4 * sd;
  const yMax = mean + 4 * sd;
  const yScale = (v: number) =>
    PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const xStep = values.length > 1 ? plotW / (values.length - 1) : plotW;

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

  const points = values.map((v, i) => ({
    x: PAD_L + (values.length === 1 ? plotW / 2 : i * xStep),
    y: yScale(v),
    value: v,
    zScore: (v - mean) / sd,
  }));

  return (
    <div>
      <p className="text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
        {title}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[420px] bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
      >
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
            stroke="#6366f1"
            strokeWidth={1.5}
          />
        )}
        {/* Data points */}
        {points.map((p, i) => {
          const absZ = Math.abs(p.zScore);
          const fill =
            absZ >= 3 ? "#ef4444" : absZ >= 2 ? "#f59e0b" : "#6366f1";
          return <circle key={i} cx={p.x} cy={p.y} r={3} fill={fill} />;
        })}
      </svg>
    </div>
  );
};

// Stat cards using calibration/equipment data as proxy for QC overview
const QCDashboardTab: React.FC = () => {
  const { equipment, calibrations, maintenanceLogs, reagents } =
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

  // Generate mock Levey-Jennings data per lab section using seed equipment
  const ljSections = useMemo(() => {
    const sections = [...new Set(equipment.map((e) => e.labSection))];
    return sections.slice(0, 4).map((section) => {
      // Generate synthetic control data for demo
      const mean = 100;
      const sd = 5;
      const pts = Array.from({ length: 20 }, (_, i) => {
        // mostly within 2SD, with occasional outliers
        const noise = (Math.random() - 0.5) * 2 * sd;
        const drift = i > 15 ? (i - 15) * 0.8 : 0; // simulated drift
        return mean + noise + drift;
      });
      return { section, values: pts, mean, sd };
    });
  }, [equipment]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
        QC & Compliance Dashboard
      </h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{activeEquip}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Active Equipment
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
            Calibration Overdue
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
            PM Overdue
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p
            className={`text-2xl font-bold ${passRate >= 95 ? "text-green-600" : passRate >= 80 ? "text-yellow-600" : "text-red-600"}`}
          >
            {passRate}%
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Cal Pass Rate (6mo)
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p
            className={`text-2xl font-bold ${maintComplete >= 90 ? "text-green-600" : "text-yellow-600"}`}
          >
            {maintComplete}%
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            PM Completion (6mo)
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
            Reagent Alerts
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
                  Overdue Calibrations ({calDue})
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
                      {e.name} — due {e.nextCalibrationDue}
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
                  Reagent Alerts
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
                        ? `Expired ${r.expirationDate}`
                        : `Low: ${r.quantity} ${r.unit}`}
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
          Levey-Jennings Control Charts (Demo)
        </h3>
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-4">
          Synthetic data for demonstration — connect to actual QC data via LIMS
          integration for live charts.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ljSections.map((lj) => (
            <LeveyJenningsChart
              key={lj.section}
              title={`${lj.section} — Control`}
              values={lj.values}
              mean={lj.mean}
              sd={lj.sd}
            />
          ))}
        </div>
      </Card>

      {/* Recent calibrations */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
          Recent Calibrations
        </h3>
        {recent6mo.length === 0 ? (
          <p className="text-sm text-gray-400">
            No calibration records in last 6 months
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-2 py-1.5 text-left font-medium">Equipment</th>
                <th className="px-2 py-1.5 text-left font-medium">Date</th>
                <th className="px-2 py-1.5 text-left font-medium">Result</th>
                <th className="px-2 py-1.5 text-left font-medium">By</th>
                <th className="px-2 py-1.5 text-left font-medium">Next Due</th>
              </tr>
            </thead>
            <tbody>
              {recent6mo.map((c) => (
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
      </Card>
    </div>
  );
};

export default QCDashboardTab;
