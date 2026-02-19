import React, { useMemo, useState } from "react";
import { IncidentReport } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../stores/useAppStore";
import { SparklesIcon } from "../../components/icons";
import { aiAgentService } from "../../services/aiAgentService";
import AISuggestionModal from "../../components/ai/AISuggestionModal";

type TimeRange = "3m" | "6m" | "12m" | "all";

const INCIDENT_COLORS: Record<string, string> = {
  "Patient Safety": "#ef4444",
  "Staff Injury": "#f97316",
  "Facility Issue": "#8b5cf6",
  "Medication Error": "#ec4899",
  "Near-Miss": "#f59e0b",
  "Specimen Error": "#0ea5e9",
  "Equipment Malfunction": "#64748b",
  "Result Reporting Error": "#a855f7",
  "Biosafety Exposure": "#dc2626",
  "Proficiency Testing Failure": "#059669",
  Other: "#6b7280",
};

const SEVERITY_COLORS: Record<string, string> = {
  Minor: "#22c55e",
  Moderate: "#f59e0b",
  Severe: "#ef4444",
  "Sentinel Event": "#7c2d12",
};

const IncidentTrendingTab: React.FC = () => {
  const { t } = useTranslation();
  const { incidentReports } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");
  const [viewMode, setViewMode] = useState<"type" | "severity">("type");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");

  // Filter by time range
  const filteredReports = useMemo(() => {
    if (timeRange === "all") return incidentReports;
    const now = new Date();
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
    return incidentReports.filter((r) => new Date(r.incidentDate) >= cutoff);
  }, [incidentReports, timeRange]);

  // Group by month
  const monthlyData = useMemo(() => {
    const months: Record<
      string,
      {
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        total: number;
      }
    > = {};

    filteredReports.forEach((report) => {
      const date = new Date(report.incidentDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!months[key]) {
        months[key] = { byType: {}, bySeverity: {}, total: 0 };
      }
      months[key].byType[report.type] =
        (months[key].byType[report.type] || 0) + 1;
      months[key].bySeverity[report.severity] =
        (months[key].bySeverity[report.severity] || 0) + 1;
      months[key].total += 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }, [filteredReports]);

  // Summary stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    filteredReports.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    return { byType, bySeverity, byStatus, total: filteredReports.length };
  }, [filteredReports]);

  // Find max value for chart scaling
  const maxMonthlyTotal = useMemo(() => {
    return Math.max(1, ...monthlyData.map((m) => m.total));
  }, [monthlyData]);

  const categories =
    viewMode === "type"
      ? Object.keys(INCIDENT_COLORS)
      : Object.keys(SEVERITY_COLORS);
  const colors = viewMode === "type" ? INCIDENT_COLORS : SEVERITY_COLORS;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const currentBreakdown =
        viewMode === "type" ? stats.byType : stats.bySeverity;
      const typeSummary = Object.entries(currentBreakdown)
        .map(([cat, count]) => `${cat}: ${count}`)
        .join(", ");
      const trendSummary = monthlyData
        .slice(-6)
        .map((m) => `${formatMonth(m.month)}: ${m.total} incidents`)
        .join(", ");

      const statusSummary = Object.entries(stats.byStatus)
        .map(([status, count]) => `${status}: ${count}`)
        .join(", ");

      const prompt = `You are a healthcare risk management AI specialist. Analyze the following incident trending data and provide actionable insights:

**Time Period:** ${timeRange === "all" ? "All time" : `Last ${timeRange}`}
**Total Incidents:** ${stats.total}
**By Status:** ${statusSummary}

**Breakdown by ${viewMode}:** ${typeSummary}

**Monthly Trend (recent 6 months):** ${trendSummary}

Provide a structured analysis with:
1. **Trend Analysis** — Are incidents increasing, decreasing, or stable? Any seasonal patterns?
2. **Risk Hotspots** — Which categories or departments need immediate attention?
3. **Near-Miss Insights** — What do near-miss patterns tell us about systemic risks?
4. **Sentinel Event Prevention** — Recommendations to prevent future sentinel events
5. **CAPA Recommendations** — Specific corrective and preventive actions to implement
6. **Benchmarking** — How these numbers compare to typical healthcare facility benchmarks

Format your response in clear Markdown with headers and bullet points.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI trend analysis failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          {(["3m", "6m", "12m", "all"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {range === "all"
                ? t("allTime")
                : range === "3m"
                  ? "3M"
                  : range === "6m"
                    ? "6M"
                    : "12M"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("type")}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              viewMode === "type"
                ? "bg-brand-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {t("byType")}
          </button>
          <button
            onClick={() => setViewMode("severity")}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              viewMode === "severity"
                ? "bg-brand-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {t("bySeverity")}
          </button>
          <button
            onClick={handleAIAnalyze}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40 disabled:opacity-50"
          >
            <SparklesIcon
              className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`}
            />
            {aiLoading ? "Analyzing..." : "AI Analyze"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border border-gray-200 dark:border-dark-brand-border">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("totalIncidents")}
          </p>
          <p className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {stats.total}
          </p>
        </div>
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border border-gray-200 dark:border-dark-brand-border">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("openIncidents")}
          </p>
          <p className="text-2xl font-bold text-red-600">
            {stats.byStatus["Open"] || 0}
          </p>
        </div>
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border border-gray-200 dark:border-dark-brand-border">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("nearMissEvents")}
          </p>
          <p className="text-2xl font-bold text-amber-600">
            {stats.byType["Near-Miss"] || 0}
          </p>
        </div>
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border border-gray-200 dark:border-dark-brand-border">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("sentinelEvents")}
          </p>
          <p className="text-2xl font-bold text-rose-800">
            {stats.bySeverity["Sentinel Event"] || 0}
          </p>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border border-gray-200 dark:border-dark-brand-border">
        <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("monthlyTrend")}
        </h3>

        {monthlyData.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t("noIncidents")}
          </p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-48 px-2">
              {monthlyData.map((month) => {
                const data =
                  viewMode === "type" ? month.byType : month.bySeverity;
                return (
                  <div
                    key={month.month}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      {formatMonth(month.month)}: {month.total}{" "}
                      {t("totalIncidents").toLowerCase()}
                    </div>
                    {/* Stacked bars */}
                    <div
                      className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden"
                      style={{
                        height: `${(month.total / maxMonthlyTotal) * 100}%`,
                        minHeight: month.total > 0 ? "4px" : "0",
                      }}
                    >
                      {categories.map((cat) => {
                        const count = data[cat] || 0;
                        if (count === 0) return null;
                        return (
                          <div
                            key={cat}
                            style={{
                              backgroundColor: colors[cat],
                              height: `${(count / month.total) * 100}%`,
                              minHeight: "2px",
                            }}
                            title={`${cat}: ${count}`}
                          />
                        );
                      })}
                    </div>
                    {/* Month label */}
                    <span className="text-[10px] text-gray-400 mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                      {formatMonth(month.month)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t dark:border-dark-brand-border">
              {categories.map((cat) => {
                const count =
                  viewMode === "type"
                    ? stats.byType[cat] || 0
                    : stats.bySeverity[cat] || 0;
                if (count === 0 && viewMode === "type") return null;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[cat] }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {cat} ({count})
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg border border-gray-200 dark:border-dark-brand-border overflow-hidden">
        <div className="p-4 border-b dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("incidentBreakdown")}
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                {viewMode === "type" ? t("incidentType") : t("severity")}
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                {t("count")}
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                {t("percentage")}
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                {t("distribution")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
            {categories.map((cat) => {
              const count =
                viewMode === "type"
                  ? stats.byType[cat] || 0
                  : stats.bySeverity[cat] || 0;
              const pct =
                stats.total > 0
                  ? ((count / stats.total) * 100).toFixed(1)
                  : "0.0";
              return (
                <tr
                  key={cat}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-3 text-sm font-medium flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: colors[cat] }}
                    />
                    {cat}
                  </td>
                  <td className="px-6 py-3 text-sm">{count}</td>
                  <td className="px-6 py-3 text-sm">{pct}%</td>
                  <td className="px-6 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-[200px]">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: colors[cat],
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Incident Trend Analysis"
        content={aiModalContent}
        type="risk-assessment"
      />
    </div>
  );
};

export default IncidentTrendingTab;
