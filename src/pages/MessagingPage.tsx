import React, { useState } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import {
  DocumentTextIcon,
  CheckIcon,
  TrashIcon,
  SparklesIcon,
  PhotoIcon,
} from "@/components/icons";
import MessagingCenter from "@/components/messaging/MessagingCenter";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsAlert from "@/components/settings/SettingsAlert";
import { Button } from "@/components/ui";

interface MessagingPageProps {
  setNavigation?: (state: any) => void;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser, users } = useUserStore();
  const {
    messages,
    conversations,
    unreadCount,
    stats,
    searchMessages,
    blockUser,
    isUserBlocked,
  } = useMessaging({ autoSubscribe: true });

  const [view, setView] = useState<"conversations" | "statistics" | "privacy">(
    "conversations"
  );
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Get blocked users
  const getBlockedUsersList = () => {
    if (!currentUser) return [];
    const blockListKey = `blocked_${currentUser.id}`;
    const blocked = JSON.parse(localStorage.getItem(blockListKey) || "[]");
    return blocked
      .map((id: string) => users.find((u) => u.id === id))
      .filter(Boolean);
  };

  const handleBlockUser = (userId: string) => {
    blockUser(userId);
    setBlockedUsers([...blockedUsers, userId]);
    toast.success("User blocked");
  };

  const handleUnblockUser = (userId: string) => {
    const blockListKey = `blocked_${currentUser?.id}`;
    const blocked = JSON.parse(
      localStorage.getItem(blockListKey) || "[]"
    ).filter((id: string) => id !== userId);
    localStorage.setItem(blockListKey, JSON.stringify(blocked));
    setBlockedUsers(blocked);
    toast.success("User unblocked");
  };

  const blockedUsersList = getBlockedUsersList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-8 h-8 text-brand-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("messages") || "Messages"}
          </h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {unreadCount} {t("unread") || "Unread"}
            </span>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-brand-border">
        <Button
          onClick={() => setView("conversations")}
          variant={view === "conversations" ? "primary" : "ghost"}
          className="border-b-2"
        >
          {t("conversations") || "Conversations"} ({conversations.length})
        </Button>
        <Button
          onClick={() => setView("statistics")}
          variant={view === "statistics" ? "primary" : "ghost"}
          className="border-b-2"
        >
          {t("statistics") || "Statistics"}
        </Button>
        <Button
          onClick={() => setView("privacy")}
          variant={view === "privacy" ? "primary" : "ghost"}
          className="border-b-2"
        >
          {t("privacy") || "Privacy"}
        </Button>
      </div>

      {/* Conversations View */}
      {view === "conversations" && (
        <div className="space-y-4">
          <SettingsCard
            title={t("directMessages") || "Direct Messages"}
            description="Communicate with team members"
          >
            <MessagingCenter maxHeight="700px" />
          </SettingsCard>
        </div>
      )}

      {/* Statistics View */}
      {view === "statistics" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Messages */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {stats.totalMessages}
                </p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </div>

          {/* Sent Messages */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">
                  Sent
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {stats.sentMessages}
                </p>
              </div>
              <CheckIcon className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </div>

          {/* Received Messages */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-700/30 rounded-lg p-4 border border-rose-200 dark:border-pink-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">
                  Received
                </p>
                <p className="text-2xl font-bold text-pink-900 dark:text-rose-100 mt-1">
                  {stats.receivedMessages}
                </p>
              </div>
              <SparklesIcon className="w-8 h-8 text-rose-400 opacity-50" />
            </div>
          </div>

          {/* Unread */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">
                  Unread
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {stats.unreadCount}
                </p>
              </div>
              <TrashIcon className="w-8 h-8 text-amber-400 opacity-50" />
            </div>
          </div>

           {/* Conversations */}
           <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                   Active Conversations
                 </p>
                 <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                   {stats.conversationCount}
                 </p>
               </div>
               <DocumentTextIcon className="w-8 h-8 text-blue-400 opacity-50" />
             </div>
           </div>

          {/* Unread Conversations */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">
                  Unread Chats
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                  {stats.unreadConversationCount}
                </p>
              </div>
              <SparklesIcon className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Privacy View */}
      {view === "privacy" && (
        <div className="space-y-4">
          <SettingsAlert
            type="info"
            title="Messaging Privacy"
            message="Block users to prevent them from messaging you. Blocked users won't see your profile or be able to send you messages."
          />

          <SettingsCard
            title={t("blockedUsers") || "Blocked Users"}
            description="Manage blocked users"
          >
            {blockedUsersList.length > 0 ? (
              <div className="space-y-2">
                {blockedUsersList.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblockUser(user.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      {t("unblock") || "Unblock"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t("noBlockedUsers") || "No blocked users"}
              </p>
            )}
          </SettingsCard>

          <SettingsCard
            title={t("blockNewUser") || "Block a User"}
            description="Select a user to block"
          >
            <div className="space-y-2">
              {users
                .filter(
                  (u) =>
                    u.id !== currentUser?.id &&
                    !blockedUsersList.find((b: any) => b.id === u.id)
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBlockUser(user.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      {t("block") || "Block"}
                    </button>
                  </div>
                ))}
            </div>
          </SettingsCard>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
