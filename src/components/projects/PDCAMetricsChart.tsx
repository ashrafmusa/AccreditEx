import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ImprovementMetrics } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import {
  CHART_COLORS,
  getChartTheme,
  ChartTooltip,
  CHART_ANIMATION,
} from "@/utils/chartTheme";

interface PDCAMetricsChartProps {
  metrics: ImprovementMetrics;
  title?: string;
}

const PDCAMetricsChart: React.FC<PDCAMetricsChartProps> = ({
  metrics,
  title,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const ct = getChartTheme(theme);

  // Transform data for chart
  // We want to group by metric name
  const data = metrics.baseline.map((baseMetric, index) => {
    const targetMetric = metrics.target.find(
      (m) => m.metric === baseMetric.metric,
    );
    const actualMetric = metrics.actual?.find(
      (m) => m.metric === baseMetric.metric,
    );

    return {
      name: baseMetric.metric,
      Baseline: baseMetric.value,
      Target: targetMetric?.value || 0,
      Actual: actualMetric?.value || 0,
      unit: baseMetric.unit,
    };
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
          {t("noMetricsDefined") || "No metrics defined"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">
          {title}
        </h3>
      )}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={ct.gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={ct.tickStyle}
              tickLine={false}
              axisLine={{ stroke: ct.gridStroke }}
            />
            <YAxis
              tick={ct.tickStyle}
              tickLine={false}
              axisLine={{ stroke: ct.gridStroke }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: ct.cursorFill }}
            />
            <Legend wrapperStyle={{ ...ct.legendStyle, paddingTop: "20px" }} />
            <Bar
              dataKey="Baseline"
              fill={CHART_COLORS.baseline}
              radius={[4, 4, 0, 0]}
              name={t("baseline") || "Baseline"}
              animationDuration={CHART_ANIMATION.duration}
            />
            <Bar
              dataKey="Target"
              fill={CHART_COLORS.info}
              radius={[4, 4, 0, 0]}
              name={t("target") || "Target"}
              animationDuration={CHART_ANIMATION.duration}
            />
            <Bar
              dataKey="Actual"
              fill={CHART_COLORS.success}
              radius={[4, 4, 0, 0]}
              name={t("actual") || "Actual"}
              animationDuration={CHART_ANIMATION.duration}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PDCAMetricsChart;
