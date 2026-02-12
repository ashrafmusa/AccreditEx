import { useEffect, useState, useCallback } from 'react';
import { messagingService, EnhancedMessage, MessageFilter, MessageStatus } from '@/services/messagingService';
import { useUserStore } from '@/stores/useUserStore';

export interface UseMessagingOptions {
  autoSubscribe?: boolean;
  conversationId?: string;
}

export interface MessagingStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  unreadCount: number;
  conversationCount: number;
  unreadConversationCount: number;
  blockedUserCount: number;
}

export const useMessaging = (options: UseMessagingOptions = {}) => {
  const { currentUser } = useUserStore();
  const { autoSubscribe = true, conversationId } = options;

  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MessagingStats | null>(null);

  // Subscribe to message updates
  useEffect(() => {
    if (!autoSubscribe || !currentUser) return;

    const unsubscribe = messagingService.subscribe(allMessages => {
      if (conversationId) {
        const filtered = messagingService.getConversationMessages(conversationId);
        setMessages(filtered);
      } else {
        setMessages(allMessages);
      }
      setUnreadCount(messagingService.getUnreadCount(currentUser.id));
      setStats(messagingService.getStatistics(currentUser.id));
    });

    return unsubscribe;
  }, [autoSubscribe, currentUser, conversationId]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!autoSubscribe || !currentUser) return;

    const unsubscribe = messagingService.subscribeToConversations(allConversations => {
      setConversations(allConversations);
    });

    return unsubscribe;
  }, [autoSubscribe, currentUser]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (recipientId: string, content: string, attachments?: string[], mentions?: string[]) => {
      if (!currentUser) {
        console.error('No current user for messaging');
        return null;
      }

      try {
        const message = await messagingService.sendMessage(
          currentUser.id,
          recipientId,
          content,
          { attachments, mentions }
        );
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
        return null;
      }
    },
    [currentUser]
  );

  /**
   * Get conversation messages
   */
  const getConversationMessages = useCallback(
    (convId: string, limit = 50, offset = 0) => {
      return messagingService.getConversationMessages(convId, { limit, offset });
    },
    []
  );

  /**
   * Get all conversations for current user
   */
  const getConversations = useCallback(() => {
    if (!currentUser) return [];
    return messagingService.getUserConversations(currentUser.id);
  }, [currentUser]);

  /**
   * Get unread conversations
   */
  const getUnreadConversations = useCallback(() => {
    if (!currentUser) return [];
    return messagingService.getUnreadConversations(currentUser.id);
  }, [currentUser]);

  /**
   * Mark message as read
   */
  const markAsRead = useCallback((messageId: string) => {
    return messagingService.markMessageAsRead(messageId);
  }, []);

  /**
   * Mark conversation as read
   */
  const markConversationAsRead = useCallback(
    (convId: string) => {
      if (!currentUser) return 0;
      const count = messagingService.markConversationAsRead(convId, currentUser.id);
      setUnreadCount(messagingService.getUnreadCount(currentUser.id));
      return count;
    },
    [currentUser]
  );

  /**
   * Delete a message
   */
  const deleteMessage = useCallback((messageId: string) => {
    return messagingService.deleteMessage(messageId);
  }, []);

  /**
   * Clear entire conversation
   */
  const clearConversation = useCallback((convId: string) => {
    return messagingService.clearConversation(convId);
  }, []);

  /**
   * Search messages
   */
  const searchMessages = useCallback(
    (searchTerm: string, convId?: string, limit = 100, options?: { includeAttachments?: boolean; includeMentions?: boolean; includeReactions?: boolean }) => {
      if (!currentUser) return [];
      return messagingService.searchMessages(currentUser.id, searchTerm, {
        conversationId: convId,
        limit,
        includeAttachments: options?.includeAttachments,
        includeMentions: options?.includeMentions,
        includeReactions: options?.includeReactions,
      });
    },
    [currentUser]
  );

  /**
   * Get filtered messages
   */
  const getFilteredMessages = useCallback(
    (filter: MessageFilter, limit = 50, offset = 0) => {
      if (!currentUser) return [];
      return messagingService.getFilteredMessages(currentUser.id, filter, { limit, offset });
    },
    [currentUser]
  );

  /**
   * Get recent messages
   */
  const getRecentMessages = useCallback(
    (hoursBack = 24) => {
      if (!currentUser) return [];
      return messagingService.getRecentMessages(currentUser.id, hoursBack);
    },
    [currentUser]
  );

  /**
   * Block a user
   */
  const blockUser = useCallback(
    (blockedUserId: string) => {
      if (!currentUser) return null;
      return messagingService.blockUser(currentUser.id, blockedUserId);
    },
    [currentUser]
  );

  /**
   * Check if user is blocked
   */
  const isUserBlocked = useCallback(
    (userId: string) => {
      if (!currentUser) return false;
      return messagingService.isUserBlocked(userId, currentUser.id);
    },
    [currentUser]
  );

  /**
   * Export messages
   */
  const exportMessages = useCallback((convId: string) => {
    return messagingService.exportMessages(convId);
  }, []);

  /**
   * Get conversation unread count
   */
  const getConversationUnreadCount = useCallback(
    (convId: string) => {
      if (!currentUser) return 0;
      return messagingService.getConversationUnreadCount(convId, currentUser.id);
    },
    [currentUser]
  );

  /**
   * Check for unread messages
   */
  const hasUnreadMessages = useCallback(() => {
    if (!currentUser) return false;
    return messagingService.hasUnreadMessages(currentUser.id);
  }, [currentUser]);

  /**
   * Pin/Unpin conversation
   */
  const pinConversation = useCallback(
    (conversationId: string, pinned: boolean) => {
      messagingService.pinConversation(conversationId, pinned);
    },
    []
  );

  /**
   * Check if conversation is pinned
   */
  const isConversationPinned = useCallback(
    (conversationId: string) => {
      return messagingService.isConversationPinned(conversationId);
    },
    []
  );

  /**
   * Mute/Unmute conversation
   */
  const muteConversation = useCallback(
    (conversationId: string, muted: boolean) => {
      messagingService.muteConversation(conversationId, muted);
    },
    []
  );

  /**
   * Check if conversation is muted
   */
  const isConversationMuted = useCallback(
    (conversationId: string) => {
      return messagingService.isConversationMuted(conversationId);
    },
    []
  );

  /**
   * Archive/Unarchive conversation
   */
  const archiveConversation = useCallback(
    (conversationId: string, archived: boolean) => {
      messagingService.archiveConversation(conversationId, archived);
    },
    []
  );

  /**
   * Check if conversation is archived
   */
  const isConversationArchived = useCallback(
    (conversationId: string) => {
      return messagingService.isConversationArchived(conversationId);
    },
    []
  );

  /**
   * Set typing indicator
   */
  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!currentUser) return;
      messagingService.setTyping(conversationId, currentUser.id, isTyping);
    },
    [currentUser]
  );

  /**
   * Get typing users in conversation
   */
  const getTypingUsers = useCallback(
    (conversationId: string) => {
      return messagingService.getTypingUsers(conversationId);
    },
    []
  );

  /**
   * Add reaction to message
   */
  const addReaction = useCallback(
    (messageId: string, reaction: string) => {
      if (!currentUser) return;
      messagingService.addReaction(messageId, currentUser.id, reaction);
    },
    [currentUser]
  );

  /**
   * Remove reaction from message
   */
  const removeReaction = useCallback(
    (messageId: string, reaction: string) => {
      if (!currentUser) return;
      messagingService.removeReaction(messageId, currentUser.id, reaction);
    },
    [currentUser]
  );

  return {
    // State
    messages,
    conversations,
    unreadCount,
    loading,
    stats,

    // Message operations
    sendMessage,
    getConversationMessages,
    deleteMessage,
    markAsRead,
    searchMessages,
    getFilteredMessages,
    getRecentMessages,
    exportMessages,
    addReaction,
    removeReaction,

    // Conversation operations
    getConversations,
    getUnreadConversations,
    markConversationAsRead,
    clearConversation,
    getConversationUnreadCount,
    hasUnreadMessages,
    pinConversation,
    isConversationPinned,
    muteConversation,
    isConversationMuted,
    archiveConversation,
    isConversationArchived,
    setTyping,
    getTypingUsers,

    // User blocking
    blockUser,
    isUserBlocked,
  };
};
