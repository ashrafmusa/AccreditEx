import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/useToast";
import {
  MagnifyingGlassIcon as SearchIcon,
  PaperClipIcon as PaperclipIcon,
  SparklesIcon as SmileIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@/components/icons";
import UserAvatar from "@/components/common/UserAvatar";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import UserPresence from "./UserPresence";
import { Message } from "@/types";
import { messagingService } from "@/services/messagingService";
import { UserRole } from "@/types";

interface TeamChatProps {
  channelId?: string;
  channelName?: string;
  maxHeight?: string;
  onClose?: () => void;
}

const TeamChat: React.FC<TeamChatProps> = ({
  channelId = "general",
  channelName = "General",
  maxHeight = "600px",
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentUser, users } = useUserStore();
  const toast = useToast();

  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMembers, setShowMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const channelMessages = messagingService.getConversationMessages(channelId);
    setMessages(channelMessages);
  }, [channelId]);

  // Subscribe to message updates
  useEffect(() => {
    const unsubscribe = messagingService.subscribe((allMessages) => {
      const channelMessages = allMessages.filter(
        (msg) => msg.conversationId === channelId,
      );
      setMessages(channelMessages);
    });

    return unsubscribe;
  }, [channelId]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (e.target.value.trim()) {
      const typingTimeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(currentUser?.id || "");
          return updated;
        });
      }, 3000);
      return () => clearTimeout(typingTimeout);
    }
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !currentUser) {
      toast.warning(t("typeMessage"));
      return;
    }

    try {
      const message = await messagingService.sendMessage(
        currentUser.id,
        channelId, // Using channelId as recipientId for team chat
        messageInput.trim(),
        {
          attachments: [],
          mentions: [],
        },
      );

      if (message) {
        setMessageInput("");
        toast.success(t("messageSent"));
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(currentUser.id);
          return updated;
        });
      } else {
        toast.error(t("failedToSendMessage"));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(t("failedToSendMessage"));
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const success = messagingService.deleteMessage(messageId);
      if (success) {
        toast.success(t("messageDeleted"));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error(t("failedToDeleteMessage"));
    }
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return (
      users.find((user) => user.id === userId) || {
        id: userId,
        name: "Unknown User",
        role: UserRole.TeamMember,
        email: "unknown@example.com",
      }
    );
  };

  // Filter messages by search
  const filteredMessages =
    searchTerm.trim() === ""
      ? messages
      : messages.filter((msg) =>
          msg.content.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  return (
    <div className="flex h-full bg-white dark:bg-dark-brand-surface rounded-lg shadow-lg border border-gray-200 dark:border-dark-brand-border overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 border-r border-gray-200 dark:border-dark-brand-border flex flex-col items-center py-4 gap-6">
        {/* Channel Icon */}
        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center">
          <UsersIcon className="w-6 h-6" />
        </div>

        {/* Channel List (placeholder) */}
        <div className="flex flex-col gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <UsersIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {channelName}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {users.length} {t("members")}
                </span>
                <UserPresence isOnline={true} showLabel={true} />
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={t("close")}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-brand-border">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchMessages")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ maxHeight: `calc(${maxHeight} - 200px)` }}
        >
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg, idx) => {
              const isOwn = msg.senderId === currentUser?.id;
              const sender = getUserById(msg.senderId);
              const showName =
                !isOwn && filteredMessages[idx - 1]?.senderId !== msg.senderId;

              return (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  sender={sender}
                  isOwn={!!isOwn}
                  timestamp={msg.timestamp}
                  status={
                    (msg.status as "sent" | "read" | "delivered") || "read"
                  }
                  onDelete={() => handleDeleteMessage(msg.id)}
                  attachments={msg.attachments}
                  mentions={msg.mentions}
                  showAvatar={!isOwn}
                  showName={showName}
                />
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t("startConversation")}</p>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <TypingIndicator
              userName={
                Array.from(typingUsers)
                  .map((id) => getUserById(id).name)
                  .join(", ") || "Someone"
              }
              show={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-brand-border">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <SmileIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder={t("typeMessage")}
              value={messageInput}
              onChange={handleInputChange}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              aria-label={t("sendMessage")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-64 border-l border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-surface">
          <div className="p-4 border-b border-gray-200 dark:border-dark-brand-border">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("channelMembers")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {users.length} {t("members")}
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-[calc(100%-80px)] overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <UserAvatar user={user} size="sm" showStatus={true} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.jobTitle || user.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat;
