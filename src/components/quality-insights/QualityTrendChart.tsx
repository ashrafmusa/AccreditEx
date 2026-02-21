import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import { Project, Risk } from "@/types";
import {
  getChartTheme,
  ChartTooltip,
  CHART_ANIMATION,
  CHART_COLORS,
  AreaGradientDef,
} from "@/utils/chartTheme";

interface QualityTrendChartProps {
  projects: Project[];
  risks: Risk[];
}

const QualityTrendChart: React.FC<QualityTrendChartProps> = ({
  projects,
  risks,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Generate trend data based on current metrics
  // In a real app, this would come from historical snapshots
  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    // Calculate current metrics
    const totalProjects = projects.length || 1;
    const completedProjects = projects.filter(
      (p) => p.status === "Completed",
    ).length;
    const activeProjects = projects.filter(
      (p) => p.status === "In Progress",
    ).length;
    const currentCompliance = Math.round(
      ((completedProjects + activeProjects) / totalProjects) * 100,
    );

    const totalRisks = risks.length || 1;
    const mitigatedRisks = risks.filter(
      (r) => r.status === "Mitigated" || r.status === "Closed",
    ).length;
    const currentRiskControl = Math.round((mitigatedRisks / totalRisks) * 100);

    const currentScore = Math.round(
      currentCompliance * 0.6 + currentRiskControl * 0.4,
    );

    // Simulate historical trend with some variance
    return months.map((month, index) => {
      // Create a slight upward trend ending at current values
      const variance = (5 - index) * 2; // Higher variance in past months
      const randomFluctuation = Math.random() * 5 - 2.5;

      return {
        month,
        score: Math.min(
          100,
          Math.max(0, Math.round(currentScore - variance + randomFluctuation)),
        ),
        compliance: Math.min(
          100,
          Math.max(
            0,
            Math.round(currentCompliance - variance + randomFluctuation),
          ),
        ),
        risk: Math.min(
          100,
          Math.max(
            0,
            Math.round(currentRiskControl - variance + randomFluctuation),
          ),
        ),
      };
    });
  }, [projects, risks]);

  const ct = getChartTheme(theme);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("strategicQualityTrends") || "Strategic Quality Trends"}
          </h3>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("qualityScoreOverTime") ||
              "Composite Quality Score over last 6 months"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS.primary }}
            ></span>
            <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("qualityScore") || "Quality Score"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS.success }}
            ></span>
            <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("compliance") || "Compliance"}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <AreaGradientDef id="colorScore" color={CHART_COLORS.primary} />
              <AreaGradientDef
                id="colorCompliance"
                color={CHART_COLORS.success}
              />
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={ct.gridStroke}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={ct.tickStyle}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={ct.tickStyle}
              unit="%"
            />
            <Tooltip
              content={<ChartTooltip formatValue={(v) => `${v}%`} />}
              cursor={{ fill: ct.cursorFill }}
            />
            <Area
              type="monotone"
              dataKey="compliance"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompliance)"
              animationDuration={CHART_ANIMATION.duration}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
              animationDuration={CHART_ANIMATION.duration}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QualityTrendChart;
