import React, { FC } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CircleStackIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@/components/icons";

interface TrendData {
  value: number;
  label: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  color?: string;
  isLiveLinkable?: boolean;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number;
    label?: string;
  };
  sparklineData?: number[];
  subtitle?: string;
  onClick?: () => void;
}

const Sparkline: FC<{ data: number[]; color?: string }> = ({
  data,
  color = "#0ea5e9",
}) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="w-full h-8 opacity-60"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const TrendIndicator: FC<{
  direction: "up" | "down" | "neutral";
  value: number;
  label?: string;
}> = ({ direction, value, label }) => {
  const { t } = useTranslation();

  const colors = {
    up: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    down: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    neutral: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20",
  };

  const Icon =
    direction === "up"
      ? ChevronUpIcon
      : direction === "down"
        ? ChevronDownIcon
        : null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[direction]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{value}%</span>
      {label && <span className="opacity-70">{label}</span>}
    </div>
  );
};

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  isLiveLinkable,
  trend,
  sparklineData,
  subtitle,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className={`bg-brand-surface dark:bg-dark-brand-surface p-5 rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1 relative group overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Background gradient effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color || "bg-brand-primary"}`}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm font-semibold mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary transition-all">
                {value}
              </p>
              {trend && (
                <TrendIndicator
                  direction={trend.direction}
                  value={trend.value}
                  label={trend.label}
                />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={`text-white p-3 rounded-lg ${color || "bg-brand-primary"} shadow-md group-hover:scale-110 transition-transform`}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3">
            <Sparkline
              data={sparklineData}
              color={
                color?.includes("blue")
                  ? "#3b82f6"
                  : color?.includes("emerald")
                    ? "#10b981"
                    : color?.includes("red")
                      ? "#ef4444"
                      : color?.includes("orange")
                        ? "#f97316"
                        : color?.includes("sky")
                          ? "#0ea5e9"
                          : color?.includes("amber")
                            ? "#f59e0b"
                            : "#0ea5e9"
              }
            />
          </div>
        )}
      </div>

      {isLiveLinkable && (
        <div
          className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity z-20"
          title={t("liveDataTooltip")}
        >
          <div className="relative">
            <CircleStackIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(StatCard);
