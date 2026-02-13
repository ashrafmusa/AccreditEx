import React, { useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { TrashIcon, DocumentTextIcon, CheckIcon } from "@/components/icons";
import UserAvatar from "../common/UserAvatar";
import { User } from "@/types";

interface MessageBubbleProps {
  content: string;
  sender: User;
  isOwn: boolean;
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
  onDelete?: () => void;
  onReply?: () => void;
  attachments?: string[];
  mentions?: string[];
  showAvatar?: boolean;
  showName?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  sender,
  isOwn,
  timestamp,
  status = "read",
  onDelete,
  onReply,
  attachments = [],
  mentions = [],
  showAvatar = true,
  showName = false,
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Touch-friendly: toggle actions on long press or tap
  const longPressRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  // Dismiss actions on click outside
  const handleActionDismiss = useCallback(() => {
    setShowActions(false);
  }, []);

  const actionsVisible = hovered || showActions;

  const getStatusColor = () => {
    switch (status) {
      case "sent":
        return "text-gray-400 dark:text-gray-600";
      case "delivered":
        return "text-blue-500 dark:text-blue-400";
      case "read":
        return "text-green-500 dark:text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const renderStatusIcon = () => {
    if (status === "read") {
      return (
        <div className="flex">
          <CheckIcon className="w-3 h-3" />
          <CheckIcon className="w-3 h-3 -ml-1.5" />
        </div>
      );
    }
    return <CheckIcon className="w-3 h-3" />;
  };

  return (
    <div
      className={`flex gap-2.5 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"} group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowActions(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div className="shrink-0 self-end">
          <UserAvatar
            user={sender}
            size="sm"
            ariaLabel={`${sender.name} avatar`}
          />
        </div>
      ) : (
        /* Spacer for alignment when avatar is hidden */
        <div className="w-8 shrink-0" />
      )}

      {/* Message Content */}
      <div
        className={`flex flex-col gap-0.5 max-w-[70%] md:max-w-xs ${isOwn ? "items-end" : "items-start"}`}
      >
        {showName && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 mb-0.5">
            {sender.name}
          </p>
        )}

        <div className="relative">
          <div
            className={`px-4 py-2.5 transition-all ${
              isOwn
                ? "bg-brand-primary text-white rounded-2xl rounded-br-md shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700"
            }`}
          >
            {mentions.length > 0 && (
              <div className="text-xs mb-1 opacity-75">
                {mentions.map((mention) => (
                  <span key={mention} className="font-semibold">
                    @{mention}{" "}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
              {content}
            </p>

            {attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-current/10 space-y-1">
                {attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs underline opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    {attachment.split("/").pop()}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Actions — visible on hover (desktop) or long-press (mobile) */}
          {actionsVisible && (onReply || onDelete) && (
            <>
              {/* Dismiss overlay for mobile */}
              {showActions && (
                <div
                  className="fixed inset-0 z-10 md:hidden"
                  onClick={handleActionDismiss}
                />
              )}
              <div
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-0.5 bg-white dark:bg-gray-800 shadow-lg rounded-full px-1 py-0.5 border border-gray-200 dark:border-gray-600 ${
                  isOwn
                    ? "-left-2 -translate-x-full"
                    : "-right-2 translate-x-full"
                }`}
              >
                {onReply && (
                  <button
                    onClick={() => {
                      onReply();
                      setShowActions(false);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title={t("reply")}
                    aria-label={t("reply")}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l-6-6"
                      />
                    </svg>
                  </button>
                )}
                {onDelete && isOwn && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowActions(false);
                    }}
                    className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title={t("delete")}
                    aria-label={t("delete")}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Timestamp and Status */}
        <div
          className={`flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 px-2 ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isOwn && (
            <div className={getStatusColor()}>{renderStatusIcon()}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export { MessageBubble };
export default MessageBubble;
