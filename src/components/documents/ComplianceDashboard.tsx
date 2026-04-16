import {
  ChevronDownIcon as ArrowDownIcon,
  ChevronUpIcon as ArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { ComplianceMetrics, TrendData } from "@/types/audit";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ComplianceDashboardProps {
  metrics: ComplianceMetrics;
  trends: TrendData;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function ComplianceDashboard({
  metrics,
  trends,
  onRefresh,
  isLoading = false,
}: ComplianceDashboardProps) {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<
    "completeness" | "structure" | "language" | "readability"
  >("completeness");

  const getTrendIndicator = () => {
    const { trend, improvementRate } = trends.statistics;
    const isPositive = improvementRate > 0;

    return (
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isPositive ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
          <span className="text-xs font-semibold">
            {Math.abs(improvementRate).toFixed(1)}%
          </span>
        </div>
        <span className="text-xs text-gray-600 capitalize">{trend}</span>
      </div>
    );
  };

  const scoreDistributionData = [
    {
      name: "Excellent (90-100)",
      value: metrics.scoreDistribution.excellent,
      fill: "#10b981",
    },
    {
      name: "Good (70-89)",
      value: metrics.scoreDistribution.good,
      fill: "#3b82f6",
    },
    {
      name: "Fair (50-69)",
      value: metrics.scoreDistribution.fair,
      fill: "#f59e0b",
    },
    {
      name: "Poor (<50)",
      value: metrics.scoreDistribution.poor,
      fill: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  const improvementAreaData = metrics.improvementAreas.map((area) => ({
    area: area.area.charAt(0).toUpperCase() + area.area.slice(1),
    current: area.currentScore,
    target: area.targetScore,
  }));

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary">
            {t("documents.complianceDashboard") || "Compliance Dashboard"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {metrics.lastUpdated.toLocaleDateString()}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-brand-primary/80 dark:from-blue-900 dark:to-brand-primary/80 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Average Score
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {metrics.averageComplianceScore.toFixed(1)}%
              </p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
          {getTrendIndicator()}
        </div>

        {/* Documents Audited */}
        <div className="p-4 bg-gradient-to-br from-brand-primary to-brand-primary/80 dark:from-brand-primary dark:to-brand-primary/80 rounded-lg border border-brand-primary/40 dark:border-brand-primary/40">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Documents
            </p>
            <p className="text-3xl font-bold text-brand-primary dark:text-brand-primary mt-1">
              {metrics.documentCount}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Audited {metrics.auditionCount} time(s)
            </p>
          </div>
        </div>

        {/* Issues Summary */}
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-lg border border-red-200 dark:border-red-700">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Critical Issues
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
              {metrics.issueSummary.critical}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {metrics.issueSummary.warning} warnings
            </p>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Status</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                {metrics.averageComplianceScore >= 85
                  ? "Compliant"
                  : metrics.averageComplianceScore >= 70
                    ? "At Risk"
                    : "Non-compliant"}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">
            Compliance Trend
          </h2>
          {trends.dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.dataPoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) =>
                    `${typeof value === "number" ? value.toFixed(1) : value}%`
                  }
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString()
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  stroke="#3b82f6"
                  name="Overall Score"
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">
            Score Distribution
          </h2>
          {scoreDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} documents`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No distribution data available
            </div>
          )}
        </div>
      </div>

      {/* Improvement Areas */}
      <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">
          Improvement Areas
        </h2>
        {improvementAreaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={improvementAreaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Current Score" />
              <Bar dataKey="target" fill="#10b981" name="Target Score" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No improvement data available
          </div>
        )}
      </div>

      {/* Most Common Issues */}
      {metrics.mostCommonIssues.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-brand-text-primary flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            Most Common Issues
          </h2>
          <div className="space-y-3">
            {metrics.mostCommonIssues.map((issue, index) => (
              <div
                key={issue.title}
                className="p-3 bg-white dark:bg-slate-700 rounded border-l-4 border-yellow-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-brand-text-primary">
                      {issue.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Found in {issue.affectedDocuments} document(s) (
                      {issue.frequency} occurrences)
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {issue.frequency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
