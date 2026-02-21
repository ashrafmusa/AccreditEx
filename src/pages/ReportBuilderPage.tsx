/**
 * Report Builder Page
 *
 * Full-featured custom report designer with:
 *  - Saved reports list & template gallery
 *  - Section-based visual builder (Add Section → Add Block → Configure)
 *  - Live preview with real data from stores
 *  - PDF export (jsPDF), CSV download
 *  - Firestore persistence
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Modal, Input, TextArea, EmptyState } from "@/components/ui";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  ChartBarIcon,
  TableIcon,
  ClockIcon,
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
} from "@/components/icons";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import { useReportBuilderStore } from "@/stores/useReportBuilderStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  ReportDefinition,
  ReportSection,
  ReportBlock,
  ReportBlockType,
  ReportDataSource,
  AggregationType,
  ReportChartType,
  REPORT_TEMPLATES,
  DATA_SOURCE_LABELS,
  DATA_SOURCE_FIELDS,
  AGGREGATION_LABELS,
  CHART_TYPE_LABELS,
  BLOCK_TYPE_LABELS,
  REPORT_CATEGORY_LABELS,
  MetricBlockConfig,
  ChartBlockConfig,
  TableBlockConfig,
  TextBlockConfig,
  HeaderBlockConfig,
} from "@/types/reportBuilder";
import {
  resolveMetric,
  resolveChart,
  resolveTable,
  formatMetricValue,
  exportReportToPDF,
  downloadPDFBlob,
  exportReportToCSV,
} from "@/services/reportDataEngine";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "@/components/common/ThemeProvider";
import {
  CHART_COLORS as THEME_COLORS,
  getChartTheme,
  ChartTooltip as SharedChartTooltip,
  CHART_ANIMATION,
} from "@/utils/chartTheme";

// ── Tab type ─────────────────────────────────────────────────
type ReportTab = "reports" | "templates" | "builder";

// ── Chart Colors ─────────────────────────────────────────────
const CHART_COLORS = THEME_COLORS.palette;

// ── Status badge ─────────────────────────────────────────────
const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  published:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const;

const CATEGORY_COLORS = {
  compliance:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  quality:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  safety: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  training:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  audit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  operational:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  custom: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
} as const;

// ── Stat Card ────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className={`rounded-xl border p-4 ${color} flex items-center gap-3`}>
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  </div>
);

// ── Block Type Icon ──────────────────────────────────────────
function blockIcon(type: ReportBlockType) {
  switch (type) {
    case "header":
      return <DocumentTextIcon className="h-4 w-4" />;
    case "text":
      return <DocumentTextIcon className="h-4 w-4" />;
    case "metric":
      return <ChartBarIcon className="h-4 w-4" />;
    case "chart":
      return <ChartBarIcon className="h-4 w-4" />;
    case "table":
      return <TableIcon className="h-4 w-4" />;
    case "divider":
      return <XMarkIcon className="h-4 w-4" />;
    default:
      return <Squares2X2Icon className="h-4 w-4" />;
  }
}

// ── Custom Tooltip ───────────────────────────────────────────
const ChartTooltip = SharedChartTooltip;

// ── Live Chart Component ─────────────────────────────────────
const LiveChart: React.FC<{ config: ChartBlockConfig }> = ({ config }) => {
  const { theme } = useTheme();
  const ct = getChartTheme(theme);
  const data = useMemo(() => resolveChart(config), [config]);
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <ChartBarIcon className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const chartHeight = 280;

  switch (config.chartType) {
    case "bar":
      return (
        <div className="pt-1">
          {config.title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 px-2">
              {config.title}
            </p>
          )}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 5, left: 8 }}
            >
              <defs>
                {CHART_COLORS.map((color, i) => (
                  <linearGradient
                    key={`bg-${i}`}
                    id={`barGrad${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ct.gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={{ stroke: ct.gridStroke }}
              />
              <YAxis
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: ct.cursorFill }}
              />
              {config.showLegend && (
                <Legend wrapperStyle={{ fontSize: 11, ...ct.legendStyle }} />
              )}
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                animationDuration={CHART_ANIMATION.duration}
                maxBarSize={50}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={`url(#barGrad${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    case "line":
      return (
        <div className="pt-1">
          {config.title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 px-2">
              {config.title}
            </p>
          )}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 5, left: 8 }}
            >
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ct.gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={{ stroke: ct.gridStroke }}
              />
              <YAxis
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {config.showLegend && (
                <Legend wrapperStyle={{ fontSize: 11, ...ct.legendStyle }} />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                dot={{
                  fill: CHART_COLORS[0],
                  strokeWidth: 2,
                  r: 4,
                  stroke: ct.pieStroke,
                }}
                activeDot={{
                  r: 6,
                  fill: CHART_COLORS[0],
                  stroke: ct.pieStroke,
                  strokeWidth: 2,
                }}
                animationDuration={CHART_ANIMATION.duration}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    case "area":
      return (
        <div className="pt-1">
          {config.title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 px-2">
              {config.title}
            </p>
          )}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 5, left: 8 }}
            >
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ct.gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={{ stroke: ct.gridStroke }}
              />
              <YAxis
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {config.showLegend && (
                <Legend wrapperStyle={{ fontSize: 11, ...ct.legendStyle }} />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                fill="url(#areaFill)"
                dot={{
                  fill: CHART_COLORS[0],
                  strokeWidth: 2,
                  r: 3,
                  stroke: ct.pieStroke,
                }}
                animationDuration={CHART_ANIMATION.duration}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    case "pie":
      return (
        <div className="pt-1">
          {config.title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 px-2">
              {config.title}
            </p>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={35}
                paddingAngle={2}
                animationDuration={CHART_ANIMATION.duration}
                label={({ percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    stroke={ct.pieStroke}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, ...ct.legendStyle }}
                formatter={(value: string) => (
                  <span className="text-gray-700 dark:text-gray-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    default:
      return (
        <div className="pt-1">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 5, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ct.gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, ...ct.tickStyle }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="value"
                fill={CHART_COLORS[0]}
                radius={[6, 6, 0, 0]}
                animationDuration={CHART_ANIMATION.duration}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
  }
};

// ── Live Table Component ─────────────────────────────────────
const LiveTable: React.FC<{ config: TableBlockConfig }> = ({ config }) => {
  const { headers, rows } = useMemo(() => resolveTable(config), [config]);
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        No data available
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-indigo-50 dark:bg-indigo-900/20">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300 capitalize"
              >
                {h.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-800/50"
              }
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[180px]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Live Metric Component ────────────────────────────────────
const LiveMetric: React.FC<{ config: MetricBlockConfig }> = ({ config }) => {
  const value = useMemo(() => resolveMetric(config), [config]);
  const formatted = formatMetricValue(value, config.format);
  const accentColor = config.color || "#4F46E5";
  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div
        className="w-1.5 h-10 rounded-full shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      <div>
        <p className="text-2xl font-bold" style={{ color: accentColor }}>
          {formatted}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
          {config.label}
        </p>
      </div>
    </div>
  );
};

// ── Block Preview ────────────────────────────────────────────
const BlockPreview: React.FC<{
  block: ReportBlock;
  onRemove: () => void;
  onEdit: () => void;
}> = ({ block, onRemove, onEdit }) => {
  const widthClass =
    block.width === "half"
      ? "w-full md:w-[calc(50%-0.5rem)]"
      : block.width === "third"
        ? "w-full md:w-[calc(33.333%-0.5rem)]"
        : block.width === "quarter"
          ? "w-full md:w-[calc(25%-0.5rem)]"
          : "w-full";

  const renderContent = () => {
    switch (block.type) {
      case "header": {
        const cfg = block.config as HeaderBlockConfig;
        const Tag = cfg.level === 1 ? "h2" : cfg.level === 2 ? "h3" : "h4";
        const sizeClass =
          cfg.level === 1
            ? "text-xl font-bold"
            : cfg.level === 2
              ? "text-lg font-semibold"
              : "text-base font-medium";
        return (
          <div>
            <Tag className={`${sizeClass} text-gray-900 dark:text-white`}>
              {cfg.title || "Untitled"}
            </Tag>
            {cfg.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {cfg.subtitle}
              </p>
            )}
          </div>
        );
      }
      case "text": {
        const cfg = block.config as TextBlockConfig;
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {cfg.content || "Enter text..."}
          </p>
        );
      }
      case "metric": {
        return <LiveMetric config={block.config as MetricBlockConfig} />;
      }
      case "chart": {
        return <LiveChart config={block.config as ChartBlockConfig} />;
      }
      case "table": {
        return <LiveTable config={block.config as TableBlockConfig} />;
      }
      case "divider": {
        return <hr className="border-gray-200 dark:border-gray-700 my-2" />;
      }
      default:
        return null;
    }
  };

  return (
    <div className={`${widthClass} group relative`}>
      <div className="border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Block toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800/60 border-b dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            {blockIcon(block.type)}
            <span className="font-medium">{BLOCK_TYPE_LABELS[block.type]}</span>
            <span className="text-gray-400">· {block.width}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {/* Block content */}
        <div className="p-3">{renderContent()}</div>
      </div>
    </div>
  );
};

// ── Block Config Modal ──────────────────────────────────────
const BlockConfigModal: React.FC<{
  block: ReportBlock | null;
  onSave: (block: ReportBlock) => void;
  onClose: () => void;
}> = ({ block, onSave, onClose }) => {
  const [editBlock, setEditBlock] = useState<ReportBlock | null>(null);

  useEffect(() => {
    setEditBlock(block ? { ...block, config: { ...block.config } } : null);
  }, [block]);

  if (!editBlock) return null;

  const updateConfig = (key: string, value: unknown) => {
    setEditBlock((prev) =>
      prev ? { ...prev, config: { ...prev.config, [key]: value } } : prev,
    );
  };

  const renderFields = () => {
    switch (editBlock.type) {
      case "header":
        return (
          <div className="space-y-3">
            <Input
              label="Title"
              value={(editBlock.config as HeaderBlockConfig).title || ""}
              onChange={(e) => updateConfig("title", e.target.value)}
            />
            <Input
              label="Subtitle"
              value={(editBlock.config as HeaderBlockConfig).subtitle || ""}
              onChange={(e) => updateConfig("subtitle", e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Level
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={(editBlock.config as HeaderBlockConfig).level || 1}
                onChange={(e) => updateConfig("level", Number(e.target.value))}
              >
                <option value={1}>H1 — Large</option>
                <option value={2}>H2 — Medium</option>
                <option value={3}>H3 — Small</option>
              </select>
            </div>
          </div>
        );

      case "text": {
        const [generating, setGenerating] = useState(false);
        const handleAIGenerateText = async () => {
          setGenerating(true);
          try {
            const prompt = `You are a healthcare accreditation report writer. Generate professional narrative content for a report text block.

**Report Context:** This is a "${block?.type}" block in a custom report.
**Current Content:** ${(editBlock.config as TextBlockConfig).content || "Empty — generate from scratch"}

Write a concise, professional paragraph suitable for a healthcare accreditation report. Include:
- Key findings or observations
- Relevant metrics context
- Actionable insights
- Professional healthcare terminology

Output ONLY the paragraph text, no markdown headers or formatting.`;
            const response = await aiAgentService.chat(prompt, false);
            const text =
              typeof response === "string" ? response : response.response || "";
            updateConfig("content", text);
          } catch (error) {
            console.error("AI text generation failed:", error);
          } finally {
            setGenerating(false);
          }
        };

        return (
          <div className="space-y-2">
            <TextArea
              label="Content"
              value={(editBlock.config as TextBlockConfig).content || ""}
              onChange={(e) => updateConfig("content", e.target.value)}
              rows={4}
            />
            <button
              type="button"
              onClick={handleAIGenerateText}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50"
            >
              {generating ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="h-3.5 w-3.5" />
              )}
              {generating ? "Generating…" : "AI Generate Content"}
            </button>
          </div>
        );
      }

      case "metric": {
        const cfg = editBlock.config as MetricBlockConfig;
        return (
          <div className="space-y-3">
            <Input
              label="Label"
              value={cfg.label || ""}
              onChange={(e) => updateConfig("label", e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Source
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.dataSource || "projects"}
                onChange={(e) => {
                  updateConfig("dataSource", e.target.value);
                  updateConfig(
                    "field",
                    DATA_SOURCE_FIELDS[
                      e.target.value as ReportDataSource
                    ]?.[0] || "",
                  );
                }}
              >
                {Object.entries(DATA_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Field
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.field || ""}
                onChange={(e) => updateConfig("field", e.target.value)}
              >
                {(DATA_SOURCE_FIELDS[cfg.dataSource] || []).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Aggregation
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.aggregation || "count"}
                onChange={(e) => updateConfig("aggregation", e.target.value)}
              >
                {Object.entries(AGGREGATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Format
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.format || "number"}
                onChange={(e) => updateConfig("format", e.target.value)}
              >
                <option value="number">Number</option>
                <option value="percentage">Percentage</option>
                <option value="currency">Currency</option>
              </select>
            </div>
          </div>
        );
      }

      case "chart": {
        const cfg = editBlock.config as ChartBlockConfig;
        return (
          <div className="space-y-3">
            <Input
              label="Chart Title"
              value={cfg.title || ""}
              onChange={(e) => updateConfig("title", e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Source
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.dataSource || "projects"}
                onChange={(e) => {
                  updateConfig("dataSource", e.target.value);
                  updateConfig(
                    "groupByField",
                    DATA_SOURCE_FIELDS[
                      e.target.value as ReportDataSource
                    ]?.[0] || "",
                  );
                }}
              >
                {Object.entries(DATA_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Group By
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.groupByField || ""}
                onChange={(e) => updateConfig("groupByField", e.target.value)}
              >
                {(DATA_SOURCE_FIELDS[cfg.dataSource] || []).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chart Type
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.chartType || "bar"}
                onChange={(e) => updateConfig("chartType", e.target.value)}
              >
                {Object.entries(CHART_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLegend"
                checked={cfg.showLegend !== false}
                onChange={(e) => updateConfig("showLegend", e.target.checked)}
                className="rounded"
              />
              <label
                htmlFor="showLegend"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Show Legend
              </label>
            </div>
          </div>
        );
      }

      case "table": {
        const cfg = editBlock.config as TableBlockConfig;
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Source
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.dataSource || "projects"}
                onChange={(e) => {
                  updateConfig("dataSource", e.target.value);
                  const fields =
                    DATA_SOURCE_FIELDS[e.target.value as ReportDataSource] ||
                    [];
                  updateConfig("columns", fields.slice(0, 5));
                }}
              >
                {Object.entries(DATA_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Columns (comma-separated)
              </label>
              <Input
                value={(cfg.columns || []).join(", ")}
                onChange={(e) =>
                  updateConfig(
                    "columns",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Available:{" "}
                {(DATA_SOURCE_FIELDS[cfg.dataSource] || []).join(", ")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Rows
              </label>
              <Input
                type="number"
                value={String(cfg.maxRows || 25)}
                onChange={(e) =>
                  updateConfig("maxRows", Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort Field
              </label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={cfg.sortField || ""}
                onChange={(e) => updateConfig("sortField", e.target.value)}
              >
                <option value="">None</option>
                {(DATA_SOURCE_FIELDS[cfg.dataSource] || []).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      }

      default:
        return (
          <p className="text-sm text-gray-500">
            No configuration needed for this block type.
          </p>
        );
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Configure ${BLOCK_TYPE_LABELS[editBlock.type]} Block`}
    >
      <div className="space-y-4">
        {renderFields()}

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Width
          </label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={editBlock.width}
            onChange={(e) =>
              setEditBlock((prev) =>
                prev
                  ? { ...prev, width: e.target.value as ReportBlock["width"] }
                  : prev,
              )
            }
          >
            <option value="full">Full Width</option>
            <option value="half">Half</option>
            <option value="third">Third</option>
            <option value="quarter">Quarter</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (editBlock) onSave(editBlock);
              onClose();
            }}
          >
            Save Block
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ── Section Builder ──────────────────────────────────────────
const SectionBuilder: React.FC<{
  section: ReportSection;
  onUpdate: (section: ReportSection) => void;
  onRemove: () => void;
}> = ({ section, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingBlock, setEditingBlock] = useState<ReportBlock | null>(null);

  const addBlock = (type: ReportBlockType) => {
    const defaultConfig = getDefaultConfig(type);
    const newBlock: ReportBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      config: defaultConfig,
      width:
        type === "metric" ? "quarter" : type === "divider" ? "full" : "full",
      order: section.blocks.length + 1,
    };
    onUpdate({
      ...section,
      blocks: [...section.blocks, newBlock],
    });
  };

  const updateBlock = (updated: ReportBlock) => {
    onUpdate({
      ...section,
      blocks: section.blocks.map((b) => (b.id === updated.id ? updated : b)),
    });
  };

  const removeBlock = (blockId: string) => {
    onUpdate({
      ...section,
      blocks: section.blocks.filter((b) => b.id !== blockId),
    });
  };

  return (
    <div className="border rounded-xl dark:border-gray-700 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            className="bg-transparent font-semibold text-sm text-gray-900 dark:text-white outline-none border-b border-transparent focus:border-indigo-500"
            placeholder="Section Title"
          />
          <span className="text-xs text-gray-400">
            ({section.blocks.length} blocks)
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Blocks */}
          <div className="flex flex-wrap gap-2">
            {section.blocks
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <BlockPreview
                  key={block.id}
                  block={block}
                  onRemove={() => removeBlock(block.id)}
                  onEdit={() => setEditingBlock(block)}
                />
              ))}
          </div>

          {/* Add block toolbar */}
          <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center mr-1">
              Add:
            </span>
            {(
              [
                "header",
                "text",
                "metric",
                "chart",
                "table",
                "divider",
              ] as ReportBlockType[]
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border
                           border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300
                           hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700
                           dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 transition-colors"
              >
                {blockIcon(type)}
                {BLOCK_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Block config modal */}
      <BlockConfigModal
        block={editingBlock}
        onSave={updateBlock}
        onClose={() => setEditingBlock(null)}
      />
    </div>
  );
};

// ── Default config factory ───────────────────────────────────
function getDefaultConfig(type: ReportBlockType): ReportBlock["config"] {
  switch (type) {
    case "header":
      return {
        title: "Section Heading",
        subtitle: "",
        level: 2,
      } as HeaderBlockConfig;
    case "text":
      return { content: "" } as TextBlockConfig;
    case "metric":
      return {
        label: "Total Count",
        dataSource: "projects" as ReportDataSource,
        field: "status",
        aggregation: "count" as AggregationType,
        format: "number",
      } as MetricBlockConfig;
    case "chart":
      return {
        title: "Chart",
        dataSource: "projects" as ReportDataSource,
        chartType: "bar" as ReportChartType,
        groupByField: "status",
        showLegend: true,
      } as ChartBlockConfig;
    case "table":
      return {
        dataSource: "projects" as ReportDataSource,
        columns: ["name", "status", "progress"],
        sortField: "",
        sortDirection: "asc" as const,
        maxRows: 25,
      } as TableBlockConfig;
    case "divider":
      return { style: "solid", thickness: 1 };
    default:
      return {};
  }
}

// ── Report Info Modal ────────────────────────────────────────
const ReportInfoModal: React.FC<{
  report: Partial<ReportDefinition>;
  onSave: (updates: Partial<ReportDefinition>) => void;
  onClose: () => void;
  isNew?: boolean;
}> = ({ report, onSave, onClose, isNew }) => {
  const [name, setName] = useState(report.name || "");
  const [description, setDescription] = useState(report.description || "");
  const [category, setCategory] = useState(report.category || "custom");
  const [orientation, setOrientation] = useState(
    report.pageOrientation || "portrait",
  );
  const [includeHeader, setIncludeHeader] = useState(
    report.includeHeader !== false,
  );
  const [includeFooter, setIncludeFooter] = useState(
    report.includeFooter !== false,
  );
  const [includePageNumbers, setIncludePageNumbers] = useState(
    report.includePageNumbers !== false,
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? "New Report" : "Report Settings"}
    >
      <div className="space-y-4">
        <Input
          label="Report Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Custom Report"
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ReportDefinition["category"])
            }
          >
            {Object.entries(REPORT_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page Orientation
          </label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={orientation}
            onChange={(e) =>
              setOrientation(e.target.value as "portrait" | "landscape")
            }
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeHeader}
              onChange={(e) => setIncludeHeader(e.target.checked)}
              className="rounded"
            />
            Header
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeFooter}
              onChange={(e) => setIncludeFooter(e.target.checked)}
              className="rounded"
            />
            Footer
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includePageNumbers}
              onChange={(e) => setIncludePageNumbers(e.target.checked)}
              className="rounded"
            />
            Page Numbers
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave({
                name,
                description,
                category,
                pageOrientation: orientation,
                includeHeader,
                includeFooter,
                includePageNumbers,
              });
              onClose();
            }}
            disabled={!name.trim()}
          >
            {isNew ? "Create Report" : "Save Settings"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// ██ MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

const ReportBuilderPage: React.FC = () => {
  const {
    reports,
    activeReport,
    loading,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
    createFromTemplate,
    setActiveReport,
    incrementGenerationCount,
  } = useReportBuilderStore();
  const currentUser = useUserStore((s) => s.currentUser);

  const [tab, setTab] = useState<ReportTab>("reports");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Stats
  const stats = useMemo(() => {
    const total = reports.length;
    const published = reports.filter((r) => r.status === "published").length;
    const drafts = reports.filter((r) => r.status === "draft").length;
    const totalGenerations = reports.reduce(
      (acc, r) => acc + (r.generationCount || 0),
      0,
    );
    return { total, published, drafts, totalGenerations };
  }, [reports]);

  // ── Create blank report ─────────────────────────────────
  const handleCreateReport = useCallback(
    async (data: Partial<ReportDefinition>) => {
      const id = await createReport({
        name: data.name || "Untitled Report",
        description: data.description || "",
        status: "draft",
        category: data.category || "custom",
        tags: [],
        sections: [
          {
            id: `s-${Date.now()}`,
            title: "Section 1",
            blocks: [],
            order: 1,
          },
        ],
        pageOrientation: data.pageOrientation || "portrait",
        pageSize: "A4",
        includeHeader: data.includeHeader !== false,
        headerTitle: data.name || "Untitled Report",
        includeFooter: data.includeFooter !== false,
        footerText: "AccreditEx — Healthcare Accreditation Management",
        includePageNumbers: data.includePageNumbers !== false,
        createdBy: currentUser?.id || "system",
        generationCount: 0,
      });
      // Open in builder
      const created = useReportBuilderStore
        .getState()
        .reports.find((r) => r.id === id);
      if (created) {
        setActiveReport(created);
        setTab("builder");
      }
    },
    [createReport, currentUser, setActiveReport],
  );

  // ── Template instantiation ──────────────────────────────
  const handleUseTemplate = useCallback(
    async (templateId: string) => {
      const id = await createFromTemplate(templateId);
      const created = useReportBuilderStore
        .getState()
        .reports.find((r) => r.id === id);
      if (created) {
        setActiveReport(created);
        setTab("builder");
      }
    },
    [createFromTemplate, setActiveReport],
  );

  // ── Section CRUD in active report ───────────────────────
  const addSection = useCallback(() => {
    if (!activeReport) return;
    const newSection: ReportSection = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Section ${activeReport.sections.length + 1}`,
      blocks: [],
      order: activeReport.sections.length + 1,
    };
    const updated = {
      ...activeReport,
      sections: [...activeReport.sections, newSection],
    };
    setActiveReport(updated);
  }, [activeReport, setActiveReport]);

  const updateSection = useCallback(
    (sectionId: string, section: ReportSection) => {
      if (!activeReport) return;
      const updated = {
        ...activeReport,
        sections: activeReport.sections.map((s) =>
          s.id === sectionId ? section : s,
        ),
      };
      setActiveReport(updated);
    },
    [activeReport, setActiveReport],
  );

  const removeSection = useCallback(
    (sectionId: string) => {
      if (!activeReport) return;
      const updated = {
        ...activeReport,
        sections: activeReport.sections.filter((s) => s.id !== sectionId),
      };
      setActiveReport(updated);
    },
    [activeReport, setActiveReport],
  );

  // ── Save ────────────────────────────────────────────────
  const saveReport = useCallback(async () => {
    if (!activeReport) return;
    await updateReport(activeReport.id, {
      name: activeReport.name,
      description: activeReport.description,
      sections: activeReport.sections,
      category: activeReport.category,
      pageOrientation: activeReport.pageOrientation,
      pageSize: activeReport.pageSize,
      includeHeader: activeReport.includeHeader,
      headerTitle: activeReport.headerTitle,
      includeFooter: activeReport.includeFooter,
      footerText: activeReport.footerText,
      includePageNumbers: activeReport.includePageNumbers,
    });
  }, [activeReport, updateReport]);

  // ── Export PDF ──────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    if (!activeReport) return;
    setExporting(true);
    try {
      const blob = await exportReportToPDF(activeReport);
      downloadPDFBlob(blob, `${activeReport.name.replace(/\s+/g, "_")}.pdf`);
      await incrementGenerationCount(activeReport.id);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  }, [activeReport, incrementGenerationCount]);

  // ── Export CSV ──────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (!activeReport) return;
    const csv = exportReportToCSV(activeReport);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport.name.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeReport]);

  // ── AI: Analyze Report ──────────────────────────────────
  const handleAIAnalyzeReport = useCallback(async () => {
    if (!activeReport) return;
    setAiLoading(true);
    try {
      const sectionSummary = activeReport.sections
        .map(
          (s, i) =>
            `Section ${i + 1} "${s.title}": ${s.blocks.length} blocks (${s.blocks.map((b) => b.type).join(", ") || "empty"})`,
        )
        .join("\n");

      const blockTypes = activeReport.sections.flatMap((s) =>
        s.blocks.map((b) => b.type),
      );
      const hasMetrics = blockTypes.includes("metric");
      const hasCharts = blockTypes.includes("chart");
      const hasTables = blockTypes.includes("table");
      const hasText = blockTypes.includes("text");

      const prompt = `You are a healthcare accreditation report quality analyst. Analyze this custom report structure and provide actionable recommendations:

**Report:** "${activeReport.name}"
**Description:** ${activeReport.description || "None"}
**Category:** ${activeReport.category}
**Status:** ${activeReport.status}
**Orientation:** ${activeReport.pageOrientation}
**Sections:** ${activeReport.sections.length}
**Total Blocks:** ${blockTypes.length}

**Section Details:**
${sectionSummary}

**Block Composition:**
- Metrics: ${hasMetrics ? "Yes" : "Missing"}
- Charts: ${hasCharts ? "Yes" : "Missing"}
- Tables: ${hasTables ? "Yes" : "Missing"}
- Narrative Text: ${hasText ? "Yes" : "Missing"}

Provide:
1. **Report Quality Score** — Rate 1-10 with explanation
2. **Missing Elements** — What should be added for a complete accreditation report
3. **Structure Improvements** — Better section ordering, grouping suggestions
4. **Data Gaps** — Key metrics or data sources that should be included
5. **Best Practices** — Healthcare accreditation report standards to follow
6. **Specific Additions** — List 3-5 concrete blocks/sections to add with types

Format in clear Markdown.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalTitle("AI Report Quality Analysis");
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI report analysis failed:", error);
    } finally {
      setAiLoading(false);
    }
  }, [activeReport]);

  // ── AI: Suggest Template ──────────────────────────────────
  const handleAISuggestTemplate = useCallback(async () => {
    setAiLoading(true);
    try {
      const reportSummary = reports
        .map(
          (r) =>
            `"${r.name}" (${r.category}, ${r.status}, ${r.sections.length} sections)`,
        )
        .join(", ");

      const prompt = `You are a healthcare accreditation reporting specialist. Based on the user's existing reports, recommend what type of report they should create next:

**Existing Reports:** ${reportSummary || "None yet"}
**Available Categories:** compliance, quality, safety, training, operational, custom

Provide:
1. **Recommended Report Type** — What report should they build next and why
2. **Suggested Structure** — Section breakdown with block types (header, text, metric, chart, table)
3. **Key Data Sources** — Which data to include (projects, documents, risks, audits, etc.)
4. **Template Blueprint** — Step-by-step guide to build this report
5. **Healthcare Standards** — Which accreditation standards this report would help satisfy

Format in clear Markdown.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalTitle("AI Report Recommendation");
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI template suggestion failed:", error);
    } finally {
      setAiLoading(false);
    }
  }, [reports]);

  // ── Tabs ────────────────────────────────────────────────
  const tabs: { key: ReportTab; label: string }[] = [
    { key: "reports", label: "My Reports" },
    { key: "templates", label: "Templates" },
    ...(activeReport
      ? [{ key: "builder" as ReportTab, label: "Builder" }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b dark:border-gray-800 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <Squares2X2Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Custom Report Builder
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Design, customize, and export professional reports
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New Report
          </Button>
          <Button
            onClick={handleAISuggestTemplate}
            variant="outline"
            disabled={aiLoading}
            className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            {aiLoading ? (
              <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <SparklesIcon className="h-4 w-4 mr-1.5" />
            )}
            AI Suggest
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total Reports"
            value={stats.total}
            icon={<Squares2X2Icon className="h-5 w-5 text-indigo-600" />}
            color="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
          />
          <StatCard
            label="Published"
            value={stats.published}
            icon={<CheckCircleIcon className="h-5 w-5 text-emerald-600" />}
            color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          />
          <StatCard
            label="Drafts"
            value={stats.drafts}
            icon={<PencilIcon className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          />
          <StatCard
            label="Total Generated"
            value={stats.totalGenerations}
            icon={<ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/60 dark:bg-gray-800/60 rounded-lg p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <ArrowPathIcon className="h-6 w-6 text-indigo-500 animate-spin" />
          </div>
        ) : tab === "reports" ? (
          /* ── Reports List ──────────────────────────────────── */
          reports.length === 0 ? (
            <EmptyState
              icon={<Squares2X2Icon className="h-12 w-12 text-indigo-300" />}
              title="No Reports Yet"
              description="Create a new report from scratch or start from a template."
              action={
                <Button onClick={() => setShowNewModal(true)}>
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Create Report
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-xl dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {report.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] || STATUS_STYLES.draft}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[report.category] || CATEGORY_COLORS.custom}`}
                      >
                        {REPORT_CATEGORY_LABELS[report.category] ||
                          report.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {report.sections.length} sections
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-t dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveReport(report);
                        setTab("builder");
                      }}
                    >
                      <PencilIcon className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateReport(report.id)}
                    >
                      <DocumentDuplicateIcon className="h-3.5 w-3.5 mr-1" />
                      Duplicate
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (window.confirm("Delete this report?"))
                          deleteReport(report.id);
                      }}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "templates" ? (
          /* ── Template Gallery ──────────────────────────────── */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {REPORT_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="border rounded-xl dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Squares2X2Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {tpl.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {tpl.description}
                </p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.custom}`}
                  >
                    {REPORT_CATEGORY_LABELS[tpl.category]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {tpl.sections.length} sections
                  </span>
                  <span className="text-xs text-gray-400">
                    {tpl.sections.reduce((acc, s) => acc + s.blocks.length, 0)}{" "}
                    blocks
                  </span>
                </div>
                <Button
                  onClick={() => handleUseTemplate(tpl.id)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  size="sm"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        ) : tab === "builder" && activeReport ? (
          /* ── Visual Builder ────────────────────────────────── */
          <div className="space-y-4">
            {/* Builder toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReport(null);
                    setTab("reports");
                  }}
                  className="text-sm text-gray-500 hover:text-indigo-600"
                >
                  ← Back
                </button>
                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                <input
                  type="text"
                  value={activeReport.name}
                  onChange={(e) =>
                    setActiveReport({ ...activeReport, name: e.target.value })
                  }
                  className="bg-transparent font-bold text-lg text-gray-900 dark:text-white outline-none border-b-2 border-transparent focus:border-indigo-500 flex-1 min-w-0"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant={showPreview ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className={showPreview ? "bg-indigo-600 text-white" : ""}
                >
                  <EyeIcon className="h-3.5 w-3.5 mr-1" />
                  {showPreview ? "Edit Mode" : "Preview"}
                </Button>
                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                >
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIAnalyzeReport}
                  disabled={aiLoading}
                  className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  {aiLoading ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                  )}
                  AI Analyze
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                  {exporting ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                  )}
                  PDF
                </Button>
                <Button size="sm" onClick={saveReport}>
                  <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            {/* ── Preview or Edit Mode ──────────────────────── */}
            {showPreview ? (
              <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-lg max-w-4xl mx-auto overflow-hidden">
                {/* Report Header */}
                {activeReport.includeHeader && (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                      {activeReport.headerTitle || activeReport.name}
                    </h2>
                    <span className="text-sm opacity-80">
                      Generated: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {activeReport.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id}>
                        {section.title && (
                          <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 mb-3 border-b dark:border-gray-700 pb-1">
                            {section.title}
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {section.blocks
                            .sort((a, b) => a.order - b.order)
                            .map((block) => {
                              const wCls =
                                block.width === "half"
                                  ? "w-full md:w-[calc(50%-0.375rem)]"
                                  : block.width === "third"
                                    ? "w-full md:w-[calc(33.333%-0.375rem)]"
                                    : block.width === "quarter"
                                      ? "w-full md:w-[calc(25%-0.375rem)]"
                                      : "w-full";
                              return (
                                <div key={block.id} className={wCls}>
                                  {block.type === "header" &&
                                    (() => {
                                      const c =
                                        block.config as HeaderBlockConfig;
                                      const Tag =
                                        c.level === 1
                                          ? "h2"
                                          : c.level === 2
                                            ? "h3"
                                            : "h4";
                                      const sz =
                                        c.level === 1
                                          ? "text-xl font-bold"
                                          : c.level === 2
                                            ? "text-lg font-semibold"
                                            : "text-base font-medium";
                                      return (
                                        <div className="py-1">
                                          <Tag
                                            className={`${sz} text-gray-900 dark:text-white`}
                                          >
                                            {c.title || "Untitled"}
                                          </Tag>
                                          {c.subtitle && (
                                            <p className="text-sm text-gray-500 mt-0.5">
                                              {c.subtitle}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  {block.type === "text" && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap py-1">
                                      {(block.config as TextBlockConfig)
                                        .content || ""}
                                    </p>
                                  )}
                                  {block.type === "metric" && (
                                    <LiveMetric
                                      config={block.config as MetricBlockConfig}
                                    />
                                  )}
                                  {block.type === "chart" && (
                                    <LiveChart
                                      config={block.config as ChartBlockConfig}
                                    />
                                  )}
                                  {block.type === "table" && (
                                    <LiveTable
                                      config={block.config as TableBlockConfig}
                                    />
                                  )}
                                  {block.type === "divider" && (
                                    <hr className="border-gray-200 dark:border-gray-700 my-3" />
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Report Footer */}
                {activeReport.includeFooter && (
                  <div className="border-t dark:border-gray-700 px-6 py-3 flex justify-between text-xs text-gray-400">
                    <span>{activeReport.footerText || "AccreditEx"}</span>
                    {activeReport.includePageNumbers && <span>Page 1</span>}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Sections */}
                {activeReport.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <SectionBuilder
                      key={section.id}
                      section={section}
                      onUpdate={(s) => updateSection(section.id, s)}
                      onRemove={() => removeSection(section.id)}
                    />
                  ))}

                {/* Add section */}
                <button
                  type="button"
                  onClick={addSection}
                  className="w-full py-4 border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-700
                             text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600
                             dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors
                             flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Section
                </button>
              </>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Squares2X2Icon className="h-12 w-12 text-gray-300" />}
            title="Select a report to edit"
            description="Choose a report from the list or create a new one."
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      {showNewModal && (
        <ReportInfoModal
          report={{}}
          isNew
          onSave={handleCreateReport}
          onClose={() => setShowNewModal(false)}
        />
      )}
      {showSettingsModal && activeReport && (
        <ReportInfoModal
          report={activeReport}
          onSave={(updates) => setActiveReport({ ...activeReport, ...updates })}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        content={aiModalContent}
        type="improvements"
      />
    </div>
  );
};

export default ReportBuilderPage;
