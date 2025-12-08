import React, { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useUserStore } from '@/stores/useUserStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import {
  CheckIcon,
  TrashIcon,
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckBadgeIcon,
  BellIcon,
  ArchiveBoxIcon,
} from '@/components/icons';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ReadReceipt from './ReadReceipt';
import UserPresence from './UserPresence';
import ConversationActionsPanel from './ConversationActionsPanel';
import MessageSearch from './MessageSearch';
import PrivacyControlsPanel from './PrivacyControlsPanel';

interface MessagingCenterProps {
  recipientId?: string;
  onClose?: () => void;
  maxHeight?: string;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({
  recipientId,
  onClose,
  maxHeight = '600px',
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
  } = useMessaging({ autoSubscribe: true });

  // State management
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    recipientId ? `conv_${[currentUser?.id, recipientId].sort().join('_')}` : null
  );
  const [messageInput, setMessageInput] = useState('');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(recipientId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [view, setView] = useState<'conversations' | 'search' | 'privacy'>('conversations');
  const [pinnedConversations, setPinnedConversations] = useState<string[]>([]);
  const [mutedConversations, setMutedConversations] = useState<string[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Simulate typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.trim()) {
      const typingTimeout = setTimeout(() => {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(currentUser?.id || '');
          return updated;
        });
      }, 3000);
      return () => clearTimeout(typingTimeout);
    }
  };

  // Get recipient user
  const getRecipient = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return null;
    const recipId = conv.participantIds.find((id: string) => id !== currentUser?.id);
    return users.find(u => u.id === recipId);
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation || !currentUser) {
      toast.warning(t('selectConversation'));
      return;
    }

    const conv = conversations.find(c => c.id === selectedConversation);
    if (!conv) {
      toast.error(t('conversationNotFound'));
      return;
    }

    const recipId = conv.participantIds.find((id: string) => id !== currentUser.id);
    if (!recipId) {
      toast.error(t('userNotFound'));
      return;
    }

    const message = await sendMessage(recipId, messageInput.trim());
    if (message) {
      setMessageInput('');
      toast.success(t('messageSent'));
      setConversationMessages([...conversationMessages, message]);
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(currentUser?.id || '');
        return updated;
      });
    } else {
      toast.error(t('failedToSendMessage'));
    }
  };

  // Handle new conversation
  const handleStartConversation = (userId: string) => {
    const convId = `conv_${[currentUser?.id, userId].sort().join('_')}`;
    setSelectedConversation(convId);
    setSelectedUser(userId);
    const msgs = getConversationMessages(convId, 50, 0);
    setConversationMessages(msgs);
    setView('conversations');
  };

  // Handle pin/unpin conversation
  const handlePinConversation = (convId: string, pinned: boolean) => {
    if (pinned) {
      setPinnedConversations(prev => [...prev, convId]);
    } else {
      setPinnedConversations(prev => prev.filter(id => id !== convId));
    }
    toast.success(pinned ? t('conversationPinned') : t('conversationUnpinned'));
  };

  // Handle mute/unmute conversation
  const handleMuteConversation = (convId: string, muted: boolean) => {
    if (muted) {
      setMutedConversations(prev => [...prev, convId]);
    } else {
      setMutedConversations(prev => prev.filter(id => id !== convId));
    }
    toast.success(muted ? t('conversationMuted') : t('conversationUnmuted'));
  };

  // Handle archive/unarchive conversation
  const handleArchiveConversation = (convId: string, archived: boolean) => {
    if (archived) {
      setArchivedConversations(prev => [...prev, convId]);
    } else {
      setArchivedConversations(prev => prev.filter(id => id !== convId));
    }
    toast.success(archived ? t('conversationArchived') : t('conversationUnarchived'));
  };

  // Handle delete conversation
  const handleDeleteConversation = () => {
    if (selectedConversation) {
      setConversationMessages([]);
      setSelectedConversation(null);
      setView('conversations');
      toast.success(t('conversationDeleted'));
    }
  };

  // Handle block user
  const handleBlockUser = (userId: string) => {
    blockUser(userId);
    toast.success(t('userBlocked'));
  };

  // Filter conversations by search
  const filteredConversations = conversations
    .filter(conv => !archivedConversations.includes(conv.id))
    .filter(conv => {
      if (!searchTerm.trim()) return true;
      const recipient = getRecipient(conv.id);
      return (
        recipient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient?.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Pinned conversations first
      const aPinned = pinnedConversations.includes(a.id) ? 0 : 1;
      const bPinned = pinnedConversations.includes(b.id) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      // Then by last message time
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

  // Filter users for new conversation
  const availableUsers = users.filter(
    u =>
      u.id !== currentUser?.id &&
      !conversations.some(
        c =>
          c.participantIds.includes(u.id) && c.participantIds.includes(currentUser?.id || '')
      ) &&
      (searchTerm.trim() === '' ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('loading')}...
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full bg-white dark:bg-dark-brand-surface rounded-lg shadow-lg border border-gray-200 dark:border-dark-brand-border overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-dark-brand-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-brand-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('messages')}
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-dark-brand-border">
            <button
              onClick={() => setView('conversations')}
              className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-colors ${
                view === 'conversations'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('chats')}
            </button>
            <button
              onClick={() => setView('search')}
              className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-colors ${
                view === 'search'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('search')}
            </button>
            <button
              onClick={() => setView('privacy')}
              className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-colors ${
                view === 'privacy'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('privacy')}
            </button>
          </div>
        </div>

        {/* Conversations/Search/Privacy View */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
          {view === 'conversations' && (
            <>
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200 dark:border-dark-brand-border">
                <input
                  type="text"
                  placeholder={t('searchConversations')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Conversations List */}
              {filteredConversations.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-dark-brand-border">
                  {filteredConversations.map(conv => {
                    const recipient = getRecipient(conv.id);
                    const isSelected = selectedConversation === conv.id;
                    const unreadCnt = conv.unreadCount || 0;
                    const isPinned = pinnedConversations.includes(conv.id);
                    const isMuted = mutedConversations.includes(conv.id);

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleStartConversation(recipient?.id || '')}
                        className={`w-full text-left p-3 transition-all border-l-4 group ${
                          isSelected
                            ? 'bg-brand-primary/10 border-brand-primary'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {recipient?.name}
                            </h3>
                            {isPinned && <CheckBadgeIcon className="w-3 h-3 text-yellow-400" />}
                            {isMuted && <BellIcon className="w-3 h-3 text-gray-400" />}
                          </div>
                          {unreadCnt > 0 && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold ml-2">
                              {unreadCnt}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {recipient?.jobTitle}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-1">
                          {conv.lastMessage?.content || t('noMessages')}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {conv.lastMessageAt &&
                              new Date(conv.lastMessageAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </p>
                          {isSelected && (
                            <ConversationActionsPanel
                              conversationId={conv.id}
                              isPinned={isPinned}
                              isMuted={isMuted}
                              isArchived={archivedConversations.includes(conv.id)}
                              onPin={(p) => handlePinConversation(conv.id, p)}
                              onMute={(m) => handleMuteConversation(conv.id, m)}
                              onArchive={(a) => handleArchiveConversation(conv.id, a)}
                              onDelete={handleDeleteConversation}
                              size="sm"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm mb-4">
                    {t('noConversations')}
                  </p>
                  <div className="space-y-2">
                    {availableUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleStartConversation(user.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {t('noMessages')}
                </div>
              )}
            </>
          )}

          {view === 'search' && (
            <div className="p-4">
              <MessageSearch
                onSearch={(query, filters) => {
                  toast.info(`${t('searching')}: ${query}`);
                }}
                onClear={() => {
                  setSearchTerm('');
                }}
              />
            </div>
          )}

          {view === 'privacy' && selectedUser && (
            <div className="p-4">
              <PrivacyControlsPanel
                isUserBlocked={isUserBlocked(selectedUser)}
                onBlock={() => handleBlockUser(selectedUser)}
                onUnblock={() => toast.success(t('userUnblocked'))}
                onReport={() => toast.success(t('userReported'))}
                userName={getRecipient(selectedConversation || '')?.name || 'User'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Recipient Info */}
          {(() => {
            const recipient = getRecipient(selectedConversation);
            return (
              <div className="p-4 border-b border-gray-200 dark:border-dark-brand-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {recipient?.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {recipient?.jobTitle}
                    </p>
                  </div>
                  <UserPresence isOnline={true} showLabel={true} />
                </div>
              </div>
            );
          })()}

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ maxHeight: `calc(${maxHeight} - 220px)` }}
          >
            {conversationMessages.length > 0 ? (
              conversationMessages.map((msg, idx) => {
                const isOwn = msg.senderId === currentUser.id;
                const sender = users.find(u => u.id === msg.senderId);
                const showName = !isOwn && conversationMessages[idx - 1]?.senderId !== msg.senderId;

                return (
                  <MessageBubble
                    key={msg.id}
                    content={msg.content}
                    sender={{
                      id: sender?.id || '',
                      name: sender?.name || 'Unknown',
                      avatarUrl: sender?.avatarUrl,
                    }}
                    isOwn={isOwn}
                    timestamp={msg.timestamp}
                    status={msg.status || 'read'}
                    onDelete={() => deleteMessage(msg.id)}
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
                  <SparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('startConversation')}</p>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <TypingIndicator
                userName={
                  Array.from(typingUsers)
                    .map(id => users.find(u => u.id === id)?.name)
                    .join(', ') || 'Someone'
                }
                show={true}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-surface space-y-3"
          >
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('attachFile')}
              >
                <DocumentTextIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={t('messageInput')}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="p-2.5 bg-brand-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                title={t('sendMessage')}
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
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">{t('selectConversation')}</p>
          </div>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default MessagingCenter;
