import React, { useState, useEffect } from "react";
import { NavigationState } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  DownloadIcon,
} from "@/components/icons";

interface DashboardHeaderProps {
  setNavigation: (state: NavigationState) => void;
  title: string;
  greeting: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

// Helper function to format relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  setNavigation,
  title,
  greeting,
  onRefresh,
  onExport,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>(
    getRelativeTime(new Date())
  );

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastUpdated));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastUpdated(new Date());
      setRelativeTime("just now");
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="bg-gradient-to-r from-sky-50 via-white to-cyan-50 dark:from-slate-800 dark:via-dark-brand-surface dark:to-slate-800 p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-brand-text-primary dark:text-dark-brand-text-primary">
            {title.replace(
              "{name}",
              currentUser.name?.split(" ")[0] ||
                currentUser.email?.split("@")[0] ||
                "User"
            )}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {greeting}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {t("lastUpdated") || "Last updated"}: {relativeTime}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={t("refreshData") || "Refresh data"}
            className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 bg-white dark:bg-dark-brand-surface px-4 py-2.5 rounded-lg hover:bg-brand-primary-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-brand-border dark:border-dark-brand-border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />{" "}
            <span>{t("refresh") || "Refresh"}</span>
          </button>
          {onExport && (
            <button
              onClick={onExport}
              title="Export dashboard data"
              className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 bg-white dark:bg-dark-brand-surface px-4 py-2.5 rounded-lg hover:bg-brand-primary-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-brand-border dark:border-dark-brand-border shadow-sm"
            >
              <DownloadIcon className="w-5 h-5" />{" "}
              <span>{t("export") || "Export"}</span>
            </button>
          )}
          <button
            onClick={() => setNavigation({ view: "myTasks" })}
            className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 bg-white dark:bg-dark-brand-surface px-4 py-2.5 rounded-lg hover:bg-brand-primary-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-brand-border dark:border-dark-brand-border shadow-sm"
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5" />{" "}
            <span>{t("viewMyTasks")}</span>
          </button>
          <button
            onClick={() => setNavigation({ view: "createProject" })}
            className="text-sm font-semibold text-white bg-brand-primary px-4 py-2.5 rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg hover:shadow-sky-500/50"
          >
            <PlusIcon className="w-5 h-5" />{" "}
            <span>{t("createNewProject")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
