import HeaderActions from "@/components/common/HeaderActions";
import HeaderTitle from "@/components/common/HeaderTitle";
import NotificationButton from "@/components/common/NotificationButton";
import OrganizationSwitcher from "@/components/common/OrganizationSwitcher";
import UserMenu from "@/components/common/UserMenu";
import { Bars3Icon } from "@/components/icons";
import MessagingBell from "@/components/messaging/MessagingBell";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useTranslation } from "@/hooks/useTranslation";
import { NavigationState, Notification } from "@/types";
import React, { lazy, Suspense } from "react";

const TourLauncher = lazy(() => import("@/components/onboarding/TourLauncher"));

interface HeaderProps {
  navigation: NavigationState;
  notifications: Notification[];
  onToggleMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  setNavigation: (state: NavigationState) => void;
  onMarkAsRead: (notificationId: string | "all") => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  navigation,
  notifications,
  onToggleMobileMenu,
  onOpenCommandPalette,
  setNavigation,
  onMarkAsRead,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { isOnline, pendingCount, isSyncing, syncError, processQueue } =
    useOfflineSync();
  const isFieldAuditView = [
    "auditHub",
    "qualityRounding",
    "mockSurvey",
    "labOperations",
    "projectDetail",
  ].includes(navigation.view);

  return (
    <header className="h-16 bg-brand-surface dark:bg-dark-brand-surface border-b border-brand-border dark:border-dark-brand-border flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="sm:hidden p-2 text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={t("toggleMenu")}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <HeaderTitle navigation={navigation} />
          {/* Offline / Field-Audit Sync indicator */}
          {!isOnline && (
            <span
              className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse"
              title="Low/No Wi-Fi detected: Field-Audit Offline Mode is active. Checklists, tracers, and logs are cached locally and will sync automatically when reconnected."
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-2.38 1.07 1.07 0 000-1.19A10.036 10.036 0 0010 5.001c-1.465 0-2.862.312-4.12.88L3.28 2.22z"
                  clipRule="evenodd"
                />
                <path d="M7.905 8.967l5.128 5.128A3.001 3.001 0 017.905 8.967z" />
              </svg>
              <span>{t("offline") || "Offline Field Mode"} · Saved Locally</span>
              {pendingCount > 0 && (
                <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 text-[10px] font-bold px-1.5 py-px rounded-full ml-0.5">
                  {pendingCount}
                </span>
              )}
            </span>
          )}
          {isOnline && isSyncing && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
              <svg
                className="w-3 h-3 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t("syncing") || "Syncing..."}
            </span>
          )}
          {isOnline && !isSyncing && pendingCount > 0 && (
            <button
              type="button"
              onClick={() => processQueue()}
              className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-amber-900 dark:text-amber-300 transition-colors"
              title={
                syncError
                  ? `${t(syncError)} — Click to retry sync`
                  : "Click to sync pending offline field-audit changes now"
              }
            >
              {pendingCount} {t("pendingChanges") || "Pending Sync"}
            </button>
          )}
          {isOnline && !isSyncing && pendingCount === 0 && isFieldAuditView && (
            <span
              className="hidden md:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium px-2.5 py-0.5 rounded-full"
              title="Field-Audit Offline Cache Ready: Your checklists, tracers, and lab logs are synced in real time and protected against Wi-Fi drops."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Offline-Ready · Synced
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
        <OrganizationSwitcher />
        <HeaderActions onOpenCommandPalette={onOpenCommandPalette} />
        {/* Tour Launcher — centralized tour menu */}
        <Suspense fallback={null}>
          <TourLauncher variant="icon" size="md" />
        </Suspense>
        <MessagingBell position="left" showCount={true} />
        <NotificationButton
          notifications={notifications}
          setNavigation={setNavigation}
          onMarkAsRead={onMarkAsRead}
          navigation={navigation}
        />
        <UserMenu
          onLogout={onLogout}
          setNavigation={setNavigation}
          navigation={navigation}
        />
      </div>
    </header>
  );
};

export default Header;
