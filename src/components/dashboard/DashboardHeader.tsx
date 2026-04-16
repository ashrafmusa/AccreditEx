import {
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  DownloadIcon,
  PlusIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState } from "@/types";
import React, { useEffect, useState } from "react";

interface DashboardHeaderProps {
  setNavigation: (state: NavigationState) => void;
  title: string;
  greeting: string;
  onRefresh?: () => void;
  onExport?: () => void;
  roleShortcuts?: Array<{ label: string; navigation: NavigationState }>;
}

// Helper function to format relative time
const getRelativeTime = (date: Date, t: (key: string) => string): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("justNow");
  if (diffMins < 60) return `${diffMins} ${t("minutesAgo")}`;
  if (diffHours < 24) return `${diffHours} ${t("hoursAgo")}`;
  return `${diffDays} ${t("daysAgo")}`;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  setNavigation,
  title,
  greeting,
  onRefresh,
  onExport,
  roleShortcuts = [],
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>(
    getRelativeTime(new Date(), t),
  );

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastUpdated, t));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated, t]);

  useEffect(() => {
    if (roleShortcuts.length === 0) return;

    const handleRoleShortcutKeydown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const keyNumber = Number(e.key);
      if (Number.isNaN(keyNumber) || keyNumber < 1) return;
      const shortcut = roleShortcuts[keyNumber - 1];
      if (!shortcut) return;

      e.preventDefault();
      setNavigation(shortcut.navigation);
    };

    window.addEventListener("keydown", handleRoleShortcutKeydown);
    return () =>
      window.removeEventListener("keydown", handleRoleShortcutKeydown);
  }, [roleShortcuts, setNavigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastUpdated(new Date());
      setRelativeTime(t("justNow"));
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="bg-linear-to-r from-sky-50 via-white to-cyan-50 dark:from-slate-800 dark:via-dark-brand-surface dark:to-slate-800 p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-brand-text-primary dark:text-dark-brand-text-primary">
            {title.replace(
              "{name}",
              currentUser.name?.split(" ")[0] ||
                currentUser.email?.split("@")[0] ||
                t("userFallback"),
            )}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {greeting}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {t("lastUpdated") || "Last updated"}: {relativeTime}
          </p>
          {roleShortcuts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {roleShortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => setNavigation(shortcut.navigation)}
                  aria-label={shortcut.label}
                  aria-keyshortcuts={`Alt+${roleShortcuts.indexOf(shortcut) + 1}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full border border-brand-border dark:border-dark-brand-border text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={t("refresh") || "Refresh"}
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
              aria-label={t("export") || "Export"}
              title={t("exportDashboardData")}
              className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 bg-white dark:bg-dark-brand-surface px-4 py-2.5 rounded-lg hover:bg-brand-primary-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-brand-border dark:border-dark-brand-border shadow-sm"
            >
              <DownloadIcon className="w-5 h-5" />{" "}
              <span>{t("export") || "Export"}</span>
            </button>
          )}
          <button
            onClick={() => setNavigation({ view: "myTasks" })}
            aria-label={t("viewMyTasks")}
            className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 bg-white dark:bg-dark-brand-surface px-4 py-2.5 rounded-lg hover:bg-brand-primary-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-brand-border dark:border-dark-brand-border shadow-sm"
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5" />{" "}
            <span>{t("viewMyTasks")}</span>
          </button>
          <button
            onClick={() => setNavigation({ view: "createProject" })}
            aria-label={t("createNewProject")}
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
