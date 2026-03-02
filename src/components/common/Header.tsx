import React from "react";
import { NavigationState, Notification } from "@/types";
import { Bars3Icon } from "@/components/icons";
import HeaderTitle from "@/components/common/HeaderTitle";
import HeaderActions from "@/components/common/HeaderActions";
import NotificationButton from "@/components/common/NotificationButton";
import MessagingBell from "@/components/messaging/MessagingBell";
import UserMenu from "@/components/common/UserMenu";
import { useTranslation } from "@/hooks/useTranslation";
import { useOfflineSync } from "@/hooks/useOfflineSync";

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
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();

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
          {/* Offline / Syncing indicator */}
          {!isOnline && (
            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300 animate-pulse">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-2.38 1.07 1.07 0 000-1.19A10.036 10.036 0 0010 5.001c-1.465 0-2.862.312-4.12.88L3.28 2.22z"
                  clipRule="evenodd"
                />
                <path d="M7.905 8.967l5.128 5.128A3.001 3.001 0 017.905 8.967z" />
              </svg>
              {t("offline") || "Offline"}
              {pendingCount > 0 && (
                <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 text-[10px] font-bold px-1.5 py-px rounded-full ml-0.5">
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
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
        <HeaderActions onOpenCommandPalette={onOpenCommandPalette} />
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
