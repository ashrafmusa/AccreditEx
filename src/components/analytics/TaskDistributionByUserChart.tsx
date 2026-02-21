// This file was created by the AI to create a new Task Distribution by User chart.

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
import {
  ChecklistItem,
  User,
  ComplianceStatus,
  NavigationState,
} from "@/types";
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
  users: User[];
  setNavigation: (state: NavigationState) => void;
}

const TaskDistributionByUserChart: React.FC<Props> = ({
  checklistItems,
  users,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const data = useMemo(() => {
    const openTasks = checklistItems.filter(
      (item) =>
        item.status !== ComplianceStatus.Compliant &&
        item.status !== ComplianceStatus.NotApplicable &&
        item.assignedTo,
    );

    const userTaskCounts = openTasks.reduce(
      (acc, item) => {
        if (item.assignedTo) {
          acc[item.assignedTo] = (acc[item.assignedTo] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return (
      Object.entries(userTaskCounts)
        .map(([userId, count]) => {
          const user = users.find((u) => u.id === userId);
          return {
            userId,
            name: user ? user.name : "Unknown User",
            count,
          };
        })
        // FIX: Ensure count properties are treated as numbers for the arithmetic sort operation.
        .sort((a, b) => Number(b.count) - Number(a.count))
        .slice(0, 10)
    ); // Show top 10 users with most tasks
  }, [checklistItems, users]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const userId = data.activePayload[0].payload.userId;
      setNavigation({ view: "userProfile", userId });
    }
  };

  const ct = getChartTheme(theme);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">
        {t("taskDistributionByUser")}
      </h3>
      {data.length > 0 ? (
        <div className="flex-grow min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              onClick={handleBarClick}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={ct.gridStroke}
                horizontal={false}
              />
              <XAxis type="number" allowDecimals={false} tick={ct.tickStyle} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ ...ct.tickStyle, textAnchor: "end" }}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: ct.cursorFill }}
              />
              <Bar
                dataKey="count"
                name={t("taskCount")}
                fill={CHART_COLORS.warning}
                barSize={20}
                radius={[0, 4, 4, 0]}
                style={{ cursor: "pointer" }}
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

export default TaskDistributionByUserChart;
