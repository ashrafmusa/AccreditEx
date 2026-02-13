import React, { useState } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useTranslation } from "@/hooks/useTranslation";
import { ChatBubbleLeftEllipsisIcon } from "@/components/icons";
import MessagingCenter from "./MessagingCenter";

interface MessagingBellProps {
  showCount?: boolean;
  position?: "left" | "right";
}

const MessagingBell: React.FC<MessagingBellProps> = ({
  showCount = true,
  position = "right",
}) => {
  const { t } = useTranslation();
  const { unreadCount, hasUnreadMessages } = useMessaging({
    autoSubscribe: true,
  });
  const [isOpen, setIsOpen] = useState(false);

  const displayCount = Math.min(unreadCount, 99);
  const hasUnread = hasUnreadMessages();

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
          hasUnread ? "text-brand-primary" : ""
        }`}
        title={t("messages")}
        aria-label={t("messages")}
      >
        <ChatBubbleLeftEllipsisIcon
          className={`w-6 h-6 ${hasUnread ? "text-brand-primary" : ""}`}
        />

        {/* Unread Badge */}
        {showCount && unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {displayCount}
            {unreadCount > 99 ? "+" : ""}
          </span>
        )}

        {/* Unread Indicator Pulse */}
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover Content */}
          <div
            className={`absolute top-full ${
              position === "right" ? "right-0" : "left-0"
            } mt-2 z-40 w-[90vw] sm:w-105 max-w-105 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            <MessagingCenter
              onClose={() => setIsOpen(false)}
              maxHeight="520px"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MessagingBell;
