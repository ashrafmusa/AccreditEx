import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface UserPresenceProps {
  isOnline: boolean;
  lastSeen?: Date;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const UserPresence: React.FC<UserPresenceProps> = ({
  isOnline,
  lastSeen,
  showLabel = true,
  size = "md",
}) => {
  const { t } = useTranslation();
  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const getLastSeenText = () => {
    if (!lastSeen) return "";

    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("justNow");
    if (minutes < 60)
      return t("minutesAgo").replace("{minutes}", String(minutes));
    if (hours < 24) return t("hoursAgo").replace("{hours}", String(hours));
    if (days < 7) return t("daysAgo").replace("{days}", String(days));

    return new Date(lastSeen).toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${dotSize} rounded-full ${
          isOnline
            ? "bg-green-500 dark:bg-green-400 animate-pulse"
            : "bg-gray-400 dark:bg-gray-600"
        }`}
      />
      {showLabel && (
        <span className={`${textSize} text-gray-600 dark:text-gray-400`}>
          {isOnline ? t("online") : getLastSeenText()}
        </span>
      )}
    </div>
  );
};

export { UserPresence };
export default UserPresence;
