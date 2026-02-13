import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CheckBadgeIcon,
  BellIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from "@/components/icons";

interface ConversationActionsPanelProps {
  conversationId: string;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  onPin: (pinned: boolean) => void;
  onMute: (muted: boolean) => void;
  onArchive: (archived: boolean) => void;
  onDelete: () => void;
  size?: "sm" | "md";
}

const ConversationActionsPanel: React.FC<ConversationActionsPanelProps> = ({
  isPinned,
  isMuted,
  isArchived,
  onPin,
  onMute,
  onArchive,
  onDelete,
  size = "md",
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const buttonSize = size === "sm" ? "p-1.5" : "p-2";

  // Close dropdown on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`${buttonSize} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors`}
        title={t("conversationActionsMenu")}
      >
        <svg
          className={`${iconSize}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2m0 7a1 1 0 110-2 1 1 0 010 2m0 7a1 1 0 110-2 1 1 0 010 2"
          />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <button
            onClick={() => {
              onPin(!isPinned);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <CheckBadgeIcon
              className={`${size === "sm" ? "w-4 h-4" : "w-4 h-4"} ${isPinned ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
            <span>
              {isPinned ? t("unpinConversation") : t("pinConversation")}
            </span>
          </button>

          <button
            onClick={() => {
              onMute(!isMuted);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <BellIcon className="w-4 h-4" />
            <span>
              {isMuted ? t("unmuteConversation") : t("muteConversation")}
            </span>
          </button>

          <button
            onClick={() => {
              onArchive(!isArchived);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
            <span>
              {isArchived
                ? t("unarchiveConversation")
                : t("archiveConversation")}
            </span>
          </button>

          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            <span>{t("deleteConversation")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export { ConversationActionsPanel };
export default ConversationActionsPanel;
