/**
 * Unified Chart Theme & Reusable Components
 *
 * Single source of truth for all Recharts styling across AccreditEx.
 * Provides: color palette, tooltip, dark/light theme helpers, animation config.
 */

import React from "react";

// ─── Color Palette ───────────────────────────────────────────
// Semantic colors used across ALL charts for consistency
export const CHART_COLORS = {
  // Primary palette (ordered for pie/bar multi-series)
  palette: [
    "#4f46e5", // Indigo  — primary / brand
    "#22c55e", // Green   — success / compliant
    "#f97316", // Orange  — warning / partial
    "#ef4444", // Red     — danger / non-compliant
    "#8b5cf6", // Violet  — accent
    "#0284c7", // Sky     — info
    "#ec4899", // Pink    — highlight
    "#14b8a6", // Teal    — secondary
  ],

  // Semantic single-purpose colors
  primary: "#4f46e5",
  success: "#22c55e",
  warning: "#f97316",
  danger: "#ef4444",
  info: "#0284c7",
  muted: "#64748b",
  baseline: "#94a3b8",

  // Compliance status mapping
  compliance: {
    compliant: "#22c55e",
    partiallyCompliant: "#f97316",
    nonCompliant: "#ef4444",
    notApplicable: "#6b7280",
  },
} as const;

// ─── Theme-Aware Helpers ─────────────────────────────────────
export function getChartTheme(theme: string) {
  const isDark = theme === "dark";
  return {
    isDark,
    // Grid
    gridStroke: isDark
      ? "rgba(148, 163, 184, 0.08)"
      : "rgba(148, 163, 184, 0.2)",
    // Axis ticks
    tickStyle: {
      fill: isDark ? "#94a3b8" : "#64748b",
      fontSize: 12,
    } as const,
    // Cursor on hover
    cursorFill: isDark
      ? "rgba(148, 163, 184, 0.08)"
      : "rgba(148, 163, 184, 0.12)",
    // Center text (donut charts)
    centerTextPrimary: isDark ? "#e2e8f0" : "#0f172a",
    centerTextSecondary: isDark ? "#94a3b8" : "#64748b",
    // Legend
    legendStyle: { fontSize: 12 } as React.CSSProperties,
    // Pie cell stroke in dark mode
    pieStroke: isDark ? "#1e293b" : "#ffffff",
  };
}

// ─── Animation Config ────────────────────────────────────────
export const CHART_ANIMATION = {
  duration: 600,
  easing: "ease-out" as const,
};

// ─── Reusable Custom Tooltip ─────────────────────────────────
interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
  payload?: Record<string, unknown>;
  dataKey?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  /** Optional: format the value display (e.g., add %, $, etc.) */
  formatValue?: (value: number | string, entry: TooltipEntry) => string;
  /** Optional: extra rows to render below the main entries */
  footer?: React.ReactNode;
}

/**
 * Standardized glassmorphic tooltip used across all charts.
 * Drop-in replacement for Recharts' default tooltip.
 *
 * Usage:
 *   <Tooltip content={<ChartTooltip />} />
 *   <Tooltip content={<ChartTooltip formatValue={(v) => `${v}%`} />} />
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  formatValue,
  footer,
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-2.5 rounded-lg border border-slate-200/80 dark:border-slate-600/60 shadow-xl ring-1 ring-black/5 dark:ring-white/5 min-w-[140px]">
      {label && (
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-600/40">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const displayValue = formatValue
            ? formatValue(entry.value, entry)
            : typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value;

          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || CHART_COLORS.primary }}
              />
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {entry.name}
              </span>
              <span className="ml-auto font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
      {footer && (
        <div className="mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-600/40 text-[10px] text-slate-400 dark:text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

// ─── Gradient Helpers ────────────────────────────────────────
// Reusable gradient definitions to avoid duplication across charts
export const GradientDefs: React.FC<{
  id: string;
  color: string;
  /** 'vertical' = top-to-bottom (default), 'horizontal' = left-to-right */
  direction?: "vertical" | "horizontal";
  topOpacity?: number;
  bottomOpacity?: number;
}> = ({
  id,
  color,
  direction = "vertical",
  topOpacity = 0.4,
  bottomOpacity = 0,
}) => {
  const isHorizontal = direction === "horizontal";
  return (
    <linearGradient
      id={id}
      x1="0"
      y1="0"
      x2={isHorizontal ? "1" : "0"}
      y2={isHorizontal ? "0" : "1"}
    >
      <stop offset="5%" stopColor={color} stopOpacity={topOpacity} />
      <stop offset="95%" stopColor={color} stopOpacity={bottomOpacity} />
    </linearGradient>
  );
};

/**
 * Pre-built gradient defs for common chart colors.
 * Place inside <defs> of any recharts chart.
 */
export const BarGradientDef: React.FC<{ id?: string; color?: string }> = ({
  id = "barGradient",
  color = CHART_COLORS.primary,
}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor={color} stopOpacity={0.9} />
    <stop offset="95%" stopColor={color} stopOpacity={0.65} />
  </linearGradient>
);

export const AreaGradientDef: React.FC<{ id?: string; color?: string }> = ({
  id = "areaGradient",
  color = CHART_COLORS.primary,
}) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
    <stop offset="95%" stopColor={color} stopOpacity={0} />
  </linearGradient>
);
