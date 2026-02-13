import React, { useState, useMemo, useEffect } from "react";
import { NavigationState, Notification } from "@/types";
import { BellIcon } from "@/components/icons";
import NotificationCenter from "@/components/common/NotificationCenter";
import { useTranslation } from "@/hooks/useTranslation";
interface NotificationButtonProps {
  notifications: Notification[];
  setNavigation: (state: NavigationState) => void;
  onMarkAsRead: (notificationId: string | "all") => void;
  navigation: NavigationState;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  notifications,
  setNavigation,
  onMarkAsRead,
  navigation,
}) => {
  const { t } = useTranslation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationButtonRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on navigation change
  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [navigation]);

  return (
    <div className="relative" ref={notificationButtonRef}>
      <button
        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        className="relative text-brand-text-secondary dark:text-dark-brand-text-secondary hover:text-brand-primary-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-haspopup="true"
        aria-expanded={isNotificationsOpen}
        aria-controls="notification-center"
        aria-label={t("notifications")}
        id="notification-button"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-brand-surface dark:ring-dark-brand-surface" />
        )}
      </button>
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        setNavigation={setNavigation}
        onMarkAsRead={onMarkAsRead}
      />
    </div>
  );
};

export default NotificationButton;
