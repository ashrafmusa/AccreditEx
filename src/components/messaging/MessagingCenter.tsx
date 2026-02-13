import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import {
  CheckIcon,
  TrashIcon,
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckBadgeIcon,
  BellIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  PaperClipIcon,
  ChatBubbleLeftEllipsisIcon,
  MagnifyingGlassIcon,
} from "@/components/icons";
import UserAvatar from "@/components/common/UserAvatar";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ReadReceipt from "./ReadReceipt";
import UserPresence from "./UserPresence";
import ConversationActionsPanel from "./ConversationActionsPanel";
import MessageSearch from "./MessageSearch";
import PrivacyControlsPanel from "./PrivacyControlsPanel";
import { UserRole } from "@/types";

interface MessagingCenterProps {
  recipientId?: string;
  onClose?: () => void;
  maxHeight?: string;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({
  recipientId,
  onClose,
  maxHeight = "600px",
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser, users } = useUserStore();
  const {
    messages,
    conversations,
    unreadCount,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    getConversationMessages,
    blockUser,
    isUserBlocked,
    pinConversation,
    isConversationPinned,
    muteConversation,
    isConversationMuted,
    archiveConversation,
    isConversationArchived,
    setTyping,
    getTypingUsers,
    addReaction,
    removeReaction,
  } = useMessaging({ autoSubscribe: true });

  // State management
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(
    recipientId
      ? `conv_${[currentUser?.id, recipientId].sort().join("_")}`
      : null,
  );
  const [messageInput, setMessageInput] = useState("");
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(
    recipientId || null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [view, setView] = useState<"conversations" | "search" | "privacy">(
    "conversations",
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Load conversation messages when selected
  useEffect(() => {
    if (selectedConversation) {
      const msgs = getConversationMessages(selectedConversation, 50, 0);
      setConversationMessages(msgs);
      markConversationAsRead(selectedConversation);
    }
  }, [selectedConversation, getConversationMessages, markConversationAsRead]);

  // Typing indicator with debounce
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
    if (selectedConversation) {
      setTyping(selectedConversation, true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(selectedConversation, false);
      }, 3000);
    }
  };

  // Handle Enter to send (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get recipient user
  const getRecipient = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return null;
    const recipId = conv.participantIds.find(
      (id: string) => id !== currentUser?.id,
    );
    return users.find((u) => u.id === recipId);
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation || !currentUser) {
      toast.warning(t("selectConversation"));
      return;
    }

    // If conversation not found (new conversation), extract recipient from conversation id
    let recipId: string | undefined;
    const conv = conversations.find((c) => c.id === selectedConversation);

    if (conv) {
      // Existing conversation
      recipId = conv.participantIds.find((id: string) => id !== currentUser.id);
    } else {
      // New conversation: extract user id from conversation id
      const participants = selectedConversation.replace("conv_", "").split("_");
      recipId = participants.find((id: string) => id !== currentUser.id);
    }

    if (!recipId) {
      toast.error(t("userNotFound"));
      return;
    }

    const message = await sendMessage(recipId, messageInput.trim());
    if (message) {
      setMessageInput("");
      toast.success(t("messageSent"));
      setConversationMessages([...conversationMessages, message]);
      if (selectedConversation) {
        setTyping(selectedConversation, false);
      }
    } else {
      toast.error(t("failedToSendMessage"));
    }
  };

  // Handle new conversation
  const handleStartConversation = (userId: string) => {
    const convId = `conv_${[currentUser?.id, userId].sort().join("_")}`;
    setSelectedConversation(convId);
    setSelectedUser(userId);
    setShowCompose(false);
    setComposeSearch("");

    // On mobile, hide sidebar when a conversation is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }

    // Check if conversation exists, if not, prepare to create it
    const existingConv = conversations.find((c) => c.id === convId);
    if (!existingConv) {
      // The conversation will be created by the messaging service when the first message is sent
    }

    const msgs = getConversationMessages(convId, 50, 0);
    setConversationMessages(msgs);
    setView("conversations");
  };

  // Handle back to sidebar on mobile
  const handleBackToList = () => {
    setShowSidebar(true);
    setSelectedConversation(null);
  };

  // Date separator helper
  const getDateLabel = (date: Date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / 86400000);
    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("yesterday");
    return msgDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Check if we should show a date separator before this message
  const shouldShowDateSeparator = (
    msg: any,
    prevMsg: any | undefined,
  ): boolean => {
    if (!prevMsg) return true;
    const date1 = new Date(msg.timestamp).toDateString();
    const date2 = new Date(prevMsg.timestamp).toDateString();
    return date1 !== date2;
  };

  // Compose search filter
  const composeUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (composeSearch.trim() === "" ||
        u.name.toLowerCase().includes(composeSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(composeSearch.toLowerCase())),
  );

  // Handle pin/unpin conversation
  const handlePinConversation = (convId: string, pinned: boolean) => {
    pinConversation(convId, pinned);
    toast.success(pinned ? t("conversationPinned") : t("conversationUnpinned"));
  };

  // Handle mute/unmute conversation
  const handleMuteConversation = (convId: string, muted: boolean) => {
    muteConversation(convId, muted);
    toast.success(muted ? t("conversationMuted") : t("conversationUnmuted"));
  };

  // Handle archive/unarchive conversation
  const handleArchiveConversation = (convId: string, archived: boolean) => {
    archiveConversation(convId, archived);
    toast.success(
      archived ? t("conversationArchived") : t("conversationUnarchived"),
    );
  };

  // Handle delete conversation
  const handleDeleteConversation = () => {
    if (selectedConversation) {
      setConversationMessages([]);
      setSelectedConversation(null);
      setView("conversations");
      toast.success(t("conversationDeleted"));
    }
  };

  // Handle block user
  const handleBlockUser = (userId: string) => {
    blockUser(userId);
    toast.success(t("userBlocked"));
  };

  // Filter conversations by search
  const filteredConversations = conversations
    .filter((conv) => !isConversationArchived(conv.id))
    .filter((conv) => {
      if (!searchTerm.trim()) return true;
      const recipient = getRecipient(conv.id);
      return (
        recipient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient?.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Pinned conversations first
      const aPinned = isConversationPinned(a.id) ? 0 : 1;
      const bPinned = isConversationPinned(b.id) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      // Then by last message time
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });

  // Filter users for new conversation
  const availableUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      !conversations.some(
        (c) =>
          c.participantIds.includes(u.id) &&
          c.participantIds.includes(currentUser?.id || ""),
      ) &&
      (searchTerm.trim() === "" ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t("loading")}...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-dark-brand-surface rounded-xl shadow-lg border border-gray-200 dark:border-dark-brand-border overflow-hidden relative">
      {/* Conversations Sidebar */}
      <div
        className={`${
          showSidebar ? "flex" : "hidden md:flex"
        } w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-dark-brand-border flex-col overflow-hidden shrink-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-brand-border space-y-3 bg-linear-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-dark-brand-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("messages")}
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            {/* Compose Button */}
            <button
              onClick={() => setShowCompose(!showCompose)}
              className="p-2 bg-brand-primary text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              aria-label={t("compose")}
              title={t("compose")}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>

          {/* Compose New Chat (expandable) */}
          {showCompose && (
            <div className="space-y-2 p-3 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-lg border border-brand-primary/20">
              <input
                type="text"
                placeholder={t("searchUsersPlaceholder")}
                value={composeSearch}
                onChange={(e) => setComposeSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary"
                autoFocus
              />
              <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
                {composeUsers.length > 0 ? (
                  composeUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.jobTitle || user.email}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">
                    {t("noResultsFound")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* View Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView("conversations")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "conversations"
                  ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t("chats")}
            </button>
            <button
              onClick={() => setView("search")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "search"
                  ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t("search")}
            </button>
            <button
              onClick={() => setView("privacy")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "privacy"
                  ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {t("privacy")}
            </button>
          </div>
        </div>

        {/* Conversations/Search/Privacy View */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {view === "conversations" && (
            <>
              {/* Search Input */}
              <div className="p-3 border-b border-gray-100 dark:border-dark-brand-border">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("searchConversations")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-gray-700 transition-all"
                  />
                </div>
              </div>

              {/* Conversations List */}
              {filteredConversations.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-dark-brand-border">
                  {filteredConversations.map((conv) => {
                    const recipient = getRecipient(conv.id);
                    const isSelected = selectedConversation === conv.id;
                    const unreadCnt = conv.unreadCount || 0;
                    const isPinned = isConversationPinned(conv.id);
                    const isMuted = isConversationMuted(conv.id);

                    return (
                      <button
                        key={conv.id}
                        onClick={() =>
                          handleStartConversation(recipient?.id || "")
                        }
                        className={`w-full text-left p-3 transition-all group relative ${
                          isSelected
                            ? "bg-brand-primary/8 dark:bg-brand-primary/15"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        {/* Selected indicator bar */}
                        {isSelected && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-primary rounded-r-full" />
                        )}

                        <div className="flex items-start gap-3">
                          {/* Avatar with online indicator */}
                          <div className="relative shrink-0">
                            <UserAvatar
                              user={
                                recipient
                                  ? {
                                      id: recipient.id,
                                      name: recipient.name,
                                      email: recipient.email,
                                      role: recipient.role,
                                      avatarUrl: recipient.avatarUrl,
                                    }
                                  : null
                              }
                              size="md"
                              showStatus={false}
                            />
                            {/* Online dot */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-brand-surface rounded-full" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3
                                  className={`font-semibold truncate ${
                                    unreadCnt > 0
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {recipient?.name}
                                </h3>
                                {isPinned && (
                                  <CheckBadgeIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                )}
                                {isMuted && (
                                  <BellIcon className="w-3 h-3 text-gray-400 shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                                {conv.lastMessageAt &&
                                  new Date(
                                    conv.lastMessageAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {recipient?.jobTitle}
                            </p>
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm truncate ${
                                  unreadCnt > 0
                                    ? "text-gray-800 dark:text-gray-200 font-medium"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {conv.lastMessage?.content || t("noMessages")}
                              </p>
                              {unreadCnt > 0 && (
                                <span className="bg-brand-primary text-white min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ml-2">
                                  {unreadCnt}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions (visible on hover or selected) */}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <ConversationActionsPanel
                              conversationId={conv.id}
                              isPinned={isPinned}
                              isMuted={isMuted}
                              isArchived={isConversationArchived(conv.id)}
                              onPin={(p) => handlePinConversation(conv.id, p)}
                              onMute={(m) => handleMuteConversation(conv.id, m)}
                              onArchive={(a) =>
                                handleArchiveConversation(conv.id, a)
                              }
                              onDelete={handleDeleteConversation}
                              size="sm"
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="p-6 text-center">
                  <ChatBubbleLeftEllipsisIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t("noConversations")}
                  </p>
                  <div className="space-y-1">
                    {availableUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleStartConversation(user.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <UserAvatar user={user} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.jobTitle || user.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("noMessages")}
                  </p>
                </div>
              )}
            </>
          )}

          {view === "search" && (
            <div className="p-4">
              <MessageSearch
                onSearch={(query, filters) => {
                  toast.info(`${t("searching")}: ${query}`);
                }}
                onClear={() => {
                  setSearchTerm("");
                }}
              />
            </div>
          )}

          {view === "privacy" && selectedUser && (
            <div className="p-4">
              <PrivacyControlsPanel
                isUserBlocked={isUserBlocked(selectedUser)}
                onBlock={() => handleBlockUser(selectedUser)}
                onUnblock={() => toast.success(t("userUnblocked"))}
                onReport={() => toast.success(t("userReported"))}
                userName={
                  getRecipient(selectedConversation || "")?.name || "User"
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      {selectedConversation ? (
        <div
          className={`${
            showSidebar ? "hidden md:flex" : "flex"
          } flex-1 flex-col overflow-hidden`}
        >
          {/* Header with Recipient Info */}
          {(() => {
            const recipient = getRecipient(selectedConversation);
            return (
              <div className="p-3 md:p-4 border-b border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-surface">
                <div className="flex items-center gap-3">
                  {/* Back button (mobile only) */}
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label={t("back")}
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <UserAvatar
                    user={
                      recipient
                        ? {
                            id: recipient.id,
                            name: recipient.name,
                            email: recipient.email,
                            role: recipient.role,
                            avatarUrl: recipient.avatarUrl,
                          }
                        : null
                    }
                    size="md"
                    showStatus={true}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {recipient?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <UserPresence
                        isOnline={true}
                        showLabel={true}
                        size="sm"
                      />
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {recipient?.jobTitle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin bg-gray-50/50 dark:bg-gray-900/20">
            {conversationMessages.length > 0 ? (
              conversationMessages.map((msg, idx) => {
                const isOwn = msg.senderId === currentUser.id;
                const sender = users.find((u) => u.id === msg.senderId);
                const showName =
                  !isOwn &&
                  conversationMessages[idx - 1]?.senderId !== msg.senderId;
                const prevMsg =
                  idx > 0 ? conversationMessages[idx - 1] : undefined;
                const showDate = shouldShowDateSeparator(msg, prevMsg);

                return (
                  <React.Fragment key={msg.id}>
                    {/* Date Separator */}
                    {showDate && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/20 px-3 py-1 rounded-full">
                          {getDateLabel(msg.timestamp)}
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      </div>
                    )}

                    <MessageBubble
                      content={msg.content}
                      sender={{
                        id: sender?.id || "",
                        name: sender?.name || "Unknown",
                        email: sender?.email || "",
                        role: sender?.role || UserRole.TeamMember,
                        avatarUrl: sender?.avatarUrl,
                      }}
                      isOwn={isOwn}
                      timestamp={msg.timestamp}
                      status={msg.status || "read"}
                      onDelete={() => deleteMessage(msg.id)}
                      attachments={msg.attachments}
                      mentions={msg.mentions}
                      showAvatar={!isOwn}
                      showName={showName}
                    />
                  </React.Fragment>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftEllipsisIcon className="w-10 h-10 text-brand-primary/50" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {t("startConversation")}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t("noMessagesInConversation")}
                  </p>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {selectedConversation &&
              getTypingUsers(selectedConversation).filter(
                (id) => id !== currentUser?.id,
              ).length > 0 && (
                <TypingIndicator
                  userName={
                    getTypingUsers(selectedConversation)
                      .filter((id) => id !== currentUser?.id)
                      .map((id) => users.find((u) => u.id === id)?.name)
                      .join(", ") || "Someone"
                  }
                  show={true}
                />
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 md:p-4 border-t border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-surface"
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                title={t("attachFile")}
                aria-label={t("attachFile")}
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t("typeMessage")}
                  rows={1}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all resize-none overflow-hidden"
                  style={{ minHeight: "42px", maxHeight: "120px" }}
                />
              </div>
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2.5 bg-brand-primary text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md shrink-0"
                title={t("sendMessage")}
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
            </div>
          </form>
        </div>
      ) : (
        <div
          className={`${
            showSidebar ? "hidden md:flex" : "flex"
          } flex-1 items-center justify-center`}
        >
          <div className="text-center p-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t("selectConversation")}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("startMessaging")}
            </p>
          </div>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
          aria-label={t("close")}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MessagingCenter;
