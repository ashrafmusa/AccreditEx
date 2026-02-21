import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChecklistItem, ComplianceStatus } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import {
  CHART_COLORS,
  getChartTheme,
  ChartTooltip,
  CHART_ANIMATION,
} from "@/utils/chartTheme";

interface Props {
  checklistItems: ChecklistItem[];
}

const ProblematicStandardsChart: React.FC<Props> = ({ checklistItems }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const data = useMemo(() => {
    const failureCounts = checklistItems
      .filter(
        (item) =>
          item.status === ComplianceStatus.NonCompliant ||
          item.status === ComplianceStatus.PartiallyCompliant,
      )
      .reduce((acc: Record<string, number>, item) => {
        acc[item.standardId] = (acc[item.standardId] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(failureCounts)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 7)
      .map(([standard, count]) => ({ standard, count }))
      .reverse(); // For horizontal bar chart, reverse to show highest on top
  }, [checklistItems]);

  const ct = getChartTheme(theme);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">
        {t("topProblematicStandardsChart")}
      </h3>
      {data.length > 0 ? (
        <div className="flex-grow min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ct.gridStroke}
                horizontal={false}
              />
              <XAxis type="number" allowDecimals={false} tick={ct.tickStyle} />
              <YAxis
                type="category"
                dataKey="standard"
                width={80}
                tick={ct.tickStyle}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: ct.cursorFill }}
              />
              <Bar
                dataKey="count"
                name={t("failureCount")}
                fill={CHART_COLORS.danger}
                barSize={20}
                radius={[0, 4, 4, 0]}
                animationDuration={CHART_ANIMATION.duration}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-grow">
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("noDataAvailable")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProblematicStandardsChart;
