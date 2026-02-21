import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Project } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import {
  CHART_COLORS,
  getChartTheme,
  ChartTooltip,
  AreaGradientDef,
  CHART_ANIMATION,
} from "@/utils/chartTheme";

interface Props {
  projects: Project[];
}

const ComplianceOverTimeChart: React.FC<Props> = ({ projects }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const data = useMemo(() => {
    const timeData = projects.reduce(
      (acc: Record<string, { sum: number; count: number }>, project) => {
        const month = new Date(project.startDate).toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        if (!acc[month]) acc[month] = { sum: 0, count: 0 };
        acc[month].sum += project.progress;
        acc[month].count += 1;
        return acc;
      },
      {},
    );

    return Object.entries(timeData)
      .map(([month, data]) => ({
        month,
        compliance: Math.round((data as any).sum / (data as any).count),
      }))
      .sort(
        (a, b) =>
          new Date(`1 ${a.month}`).getTime() -
          new Date(`1 ${b.month}`).getTime(),
      );
  }, [projects]);

  const ct = getChartTheme(theme);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">
        {t("complianceOverTime")}
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <AreaGradientDef
                id="colorCompliance"
                color={CHART_COLORS.primary}
              />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.gridStroke} />
            <XAxis dataKey="month" tick={ct.tickStyle} />
            <YAxis tick={ct.tickStyle} unit="%" />
            <Tooltip content={<ChartTooltip formatValue={(v) => `${v}%`} />} />
            <Legend wrapperStyle={ct.legendStyle} />
            <Area
              type="monotone"
              dataKey="compliance"
              name={t("complianceRate")}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompliance)"
              dot={{ r: 4, fill: CHART_COLORS.primary }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: CHART_COLORS.primary,
                stroke: "#fff",
              }}
              animationDuration={CHART_ANIMATION.duration}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("noDataAvailable")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplianceOverTimeChart;
