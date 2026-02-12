import React, { useMemo } from "react";
import { Project, ComplianceStatus } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@/components/icons";

interface ProgressIndicatorProps {
  project: Project;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  project,
  className = "",
}) => {
  const { t } = useTranslation();

  const progress = useMemo(() => {
    const totalItems = project.checklist.length;
    if (totalItems === 0) {
      return {
        percentage: 0,
        compliant: 0,
        nonCompliant: 0,
        notApplicable: 0,
        partiallyCompliant: 0,
        total: 0,
      };
    }

    const compliant = project.checklist.filter(
      (item) => item.status === ComplianceStatus.Compliant,
    ).length;
    const nonCompliant = project.checklist.filter(
      (item) => item.status === ComplianceStatus.NonCompliant,
    ).length;
    const notApplicable = project.checklist.filter(
      (item) => item.status === ComplianceStatus.NotApplicable,
    ).length;
    const partiallyCompliant = project.checklist.filter(
      (item) => item.status === ComplianceStatus.PartiallyCompliant,
    ).length;

    const applicableItems = totalItems - notApplicable;
    const completedItems = compliant + partiallyCompliant;
    const percentage =
      applicableItems > 0
        ? Math.round((completedItems / applicableItems) * 100)
        : 0;

    return {
      percentage,
      compliant,
      nonCompliant,
      notApplicable,
      partiallyCompliant,
      total: totalItems,
    };
  }, [project.checklist]);

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage < 30) return <ExclamationTriangleIcon className="w-5 h-5" />;
    if (percentage < 70) return <ClockIcon className="w-5 h-5" />;
    return <CheckCircleIcon className="w-5 h-5" />;
  };

  return (
    <div
      className={`bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border ${className}`}
    >
      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("overallProgress")}
            </h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(progress.percentage)}
              <span className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {progress.percentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progress.percentage)}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {t("completed")}{" "}
              {progress.compliant + progress.partiallyCompliant} of{" "}
              {progress.total - progress.notApplicable}
            </span>
            {project.endDate && (
              <span>
                {t("dueDate")}: {new Date(project.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {progress.compliant}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t("compliant")}
            </div>
          </div>

          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {progress.partiallyCompliant}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t("partiallyCompliant")}
            </div>
          </div>

          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {progress.nonCompliant}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t("nonCompliant")}
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.notApplicable}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t("notApplicable")}
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="border-t dark:border-dark-brand-border pt-4">
          <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
            {t("progressTimeline")}
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("projectStart")}
              </span>
              <span className="text-sm font-medium">
                {new Date(project.startDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("currentProgress")}
              </span>
              <span className="text-sm font-medium">
                {progress.percentage}%
              </span>
            </div>

            {project.endDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("projectEnd")}
                </span>
                <span className="text-sm font-medium">
                  {new Date(project.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
