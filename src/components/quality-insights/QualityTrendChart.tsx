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
import type { MonthlyQualityOutcomeSnapshot } from "@/services/qualityOutcomeIntelligenceService";
import {
  getChartTheme,
  ChartTooltip,
  CHART_ANIMATION,
  CHART_COLORS,
  AreaGradientDef,
} from "@/utils/chartTheme";

interface QualityTrendChartProps {
  snapshots: MonthlyQualityOutcomeSnapshot[];
  historyError: boolean;
}

const QualityTrendChart: React.FC<QualityTrendChartProps> = ({
  snapshots,
  historyError,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const data = useMemo(() => {
    return snapshots.flatMap((snapshot) => {
      if (
        typeof snapshot.qualityScore !== "number" ||
        typeof snapshot.complianceRate !== "number"
      ) {
        return [];
      }
      const date = new Date(`${snapshot.monthKey}-01T12:00:00`);
      return [
        {
          month: date.toLocaleDateString(undefined, {
            month: "short",
            year: "2-digit",
          }),
          score: snapshot.qualityScore,
          compliance: snapshot.complianceRate,
        },
      ];
    });
  }, [snapshots]);

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

      {historyError ? (
        <p className="py-12 text-center text-sm text-red-600 dark:text-red-400">
          {t("qualityTrendSaveFailed")}
        </p>
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("qualityTrendNoHistory")}
        </p>
      ) : (
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
      )}
    </div>
  );
};

export default QualityTrendChart;
