/**
 * Change Metrics Card Component
 * Displays KPIs and analytics for change control
 */

import { useTranslation } from "@/hooks/useTranslation";
import { ChangeMetrics } from "@/types/changeControl";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ChangeMetricsCardProps {
  metrics: ChangeMetrics | null;
}

export default function ChangeMetricsCard({ metrics }: ChangeMetricsCardProps) {
  const { t } = useTranslation();
  const safeMetrics: ChangeMetrics =
    metrics ?? {
      totalRequests: 0,
      draftCount: 0,
      submittedCount: 0,
      underReviewCount: 0,
      approvedCount: 0,
      implementedCount: 0,
      rejectedCount: 0,
      cancelledCount: 0,
      averageReviewTime: 0,
      averageImplementationTime: 0,
      approvalRate: 0,
      successRate: 0,
      highPriorityCount: 0,
      criticalRiskCount: 0,
    };

  const approvalRatePercentage =
    safeMetrics.approvalRate <= 1
      ? safeMetrics.approvalRate * 100
      : safeMetrics.approvalRate;
  const successRatePercentage =
    safeMetrics.successRate <= 1
      ? safeMetrics.successRate * 100
      : safeMetrics.successRate;

  const statusData = [
    {
      name: t("status.draft") || "Draft",
      value: safeMetrics.draftCount || 0,
      fill: "#6b7280",
    },
    {
      name: t("status.submitted") || "Submitted",
      value: safeMetrics.submittedCount || 0,
      fill: "#3b82f6",
    },
    {
      name: t("status.under_review") || "Under Review",
      value: safeMetrics.underReviewCount || 0,
      fill: "#fbbf24",
    },
    {
      name: t("status.approved") || "Approved",
      value: safeMetrics.approvedCount || 0,
      fill: "#10b981",
    },
    {
      name: t("status.implemented") || "Implemented",
      value: safeMetrics.implementedCount || 0,
      fill: "#14b8a6",
    },
    {
      name: t("status.rejected") || "Rejected",
      value: safeMetrics.rejectedCount || 0,
      fill: "#ef4444",
    },
  ];

  const timelineData = [
    {
      name: t("week") || "Week",
      avgReview: safeMetrics.averageReviewTime || 0,
      avgImpl: safeMetrics.averageImplementationTime || 0,
    },
  ];

  const kpiCards = [
    {
      label: t("totalChangeRequests") || "Total Requests",
      value: safeMetrics.totalRequests || 0,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: t("approvalRate") || "Approval Rate",
      value: `${Math.round(approvalRatePercentage)}%`,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      label: t("successRate") || "Success Rate",
      value: `${Math.round(successRatePercentage)}%`,
      icon: CheckCircle,
      color: "bg-brand-primary/5 text-brand-primary",
    },
    {
      label: t("criticalRiskCount") || "Critical Risks",
      value: safeMetrics.criticalRiskCount || 0,
      icon: AlertCircle,
      color: "bg-red-50 text-red-600",
    },
    {
      label: t("avgReviewTime") || "Avg Review Time (days)",
      value: (safeMetrics.averageReviewTime || 0).toFixed(1),
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: t("avgImplementationTime") || "Avg Implementation (days)",
      value: (safeMetrics.averageImplementationTime || 0).toFixed(1),
      icon: Clock,
      color: "bg-brand-primary/5 text-brand-primary",
    },
  ];

  const COLORS = [
    "#6b7280",
    "#3b82f6",
    "#fbbf24",
    "#10b981",
    "#14b8a6",
    "#ef4444",
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-lg border border-brand-border ${kpi.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{kpi.label}</p>
                  <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                </div>
                <Icon size={24} className="opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Distribution */}
      <div className="bg-white dark:bg-dark-brand-secondary p-6 rounded-lg border border-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
          {t("statusDistribution") || "Status Distribution"}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown Table */}
      <div className="bg-white dark:bg-dark-brand-secondary p-6 rounded-lg border border-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
          {t("statusBreakdown") || "Status Breakdown"}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span className="text-brand-text-secondary">
              {t("status.draft")}
            </span>
            <span className="font-semibold">{safeMetrics.draftCount || 0}</span>
          </div>
          <div className="flex justify-between p-3 bg-blue-50 rounded">
            <span className="text-brand-text-secondary">
              {t("status.submitted")}
            </span>
            <span className="font-semibold text-blue-600">
              {safeMetrics.submittedCount || 0}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-yellow-50 rounded">
            <span className="text-brand-text-secondary">
              {t("status.under_review")}
            </span>
            <span className="font-semibold text-yellow-600">
              {safeMetrics.underReviewCount || 0}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-green-50 rounded">
            <span className="text-brand-text-secondary">
              {t("status.approved")}
            </span>
            <span className="font-semibold text-green-600">
              {safeMetrics.approvedCount || 0}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-brand-primary/5 rounded">
            <span className="text-brand-text-secondary">
              {t("status.implemented")}
            </span>
            <span className="font-semibold text-brand-primary">
              {safeMetrics.implementedCount || 0}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-red-50 rounded">
            <span className="text-brand-text-secondary">
              {t("status.rejected")}
            </span>
            <span className="font-semibold text-red-600">
              {safeMetrics.rejectedCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-dark-brand-secondary p-6 rounded-lg border border-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
          {t("performanceMetrics") || "Performance Metrics"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-brand-text-secondary mb-3">
              {t("avgTimeMetrics") || "Average Time Metrics"}
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-brand-text-secondary">
                    {t("avgReviewTime") || "Review Time"}
                  </span>
                  <span className="font-semibold text-brand-text-primary">
                    {(safeMetrics.averageReviewTime || 0).toFixed(1)}{" "}
                    {t("days") || "days"}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{
                      width: `${Math.min(((safeMetrics.averageReviewTime || 0) / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-brand-text-secondary">
                    {t("avgImplementationTime") || "Implementation Time"}
                  </span>
                  <span className="font-semibold text-brand-text-primary">
                    {(safeMetrics.averageImplementationTime || 0).toFixed(1)}{" "}
                    {t("days") || "days"}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-brand-primary/70 rounded-full"
                    style={{
                      width: `${Math.min(((safeMetrics.averageImplementationTime || 0) / 20) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-brand-text-secondary mb-3">
              {t("successMetrics") || "Success Metrics"}
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-brand-text-secondary">
                    {t("approvalRate") || "Approval Rate"}
                  </span>
                  <span className="font-semibold text-brand-text-primary">
                    {Math.round(approvalRatePercentage)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(approvalRatePercentage, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-brand-text-secondary">
                    {t("successRate") || "Success Rate"}
                  </span>
                  <span className="font-semibold text-brand-text-primary">
                    {Math.round(successRatePercentage)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-brand-primary/70 rounded-full"
                    style={{ width: `${Math.min(successRatePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Alert */}
      {(safeMetrics.highPriorityCount || 0) > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-orange-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <h4 className="font-semibold text-orange-900">
                {t("highPriorityItems") || "High Priority Items"}
              </h4>
              <p className="text-sm text-orange-800 mt-1">
                {safeMetrics.highPriorityCount || 0}{" "}
                {t("highPriorityChangeRequests") ||
                  "high priority change requests"}{" "}
                require attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Risk Alert */}
      {(safeMetrics.criticalRiskCount || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <h4 className="font-semibold text-red-900">
                {t("criticalRisks") || "Critical Risks"}
              </h4>
              <p className="text-sm text-red-800 mt-1">
                {safeMetrics.criticalRiskCount || 0}{" "}
                {t("changesWithCriticalRisk") ||
                  "changes with critical risk levels"}{" "}
                need immediate mitigation
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
