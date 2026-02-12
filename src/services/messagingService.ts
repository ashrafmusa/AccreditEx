import { Message, Conversation } from '@/types';

export type MessageStatus = 'sent' | 'read' | 'deleted';

export interface EnhancedMessage extends Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  conversationId: string;
  attachments?: string[];
  mentions?: string[];
  reactions?: { [key: string]: string[] };
}

export interface MessageFilter {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  status?: MessageStatus;
  startDate?: Date;
  endDate?: Date;
}

interface ConversationMetadata {
  id: string;
  participantIds: [string, string];
  lastMessageAt: Date;
  unreadCount: number;
  lastMessage?: EnhancedMessage;
}

class MessagingService {
  private messageQueue: EnhancedMessage[] = [];
  private conversations: Map<string, ConversationMetadata> = new Map();
  private listeners: ((messages: EnhancedMessage[]) => void)[] = [];
  private conversationListeners: ((conversations: ConversationMetadata[]) => void)[] = [];
  private readonly MAX_MESSAGES = 1000;
  private readonly MESSAGE_EXPIRY_DAYS = 365;

  // Conversation states
  private pinnedConversations: Set<string> = new Set();
  private mutedConversations: Set<string> = new Set();
  private archivedConversations: Set<string> = new Set();

  // Typing indicators
  private typingUsers: Map<string, Date> = new Map();

  /**
   * Generate conversation ID from two user IDs
   */
  private generateConversationId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `conv_${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Send a message
   */
  public async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    options: {
      attachments?: string[];
      mentions?: string[];
    } = {}
  ): Promise<EnhancedMessage> {
    const conversationId = this.generateConversationId(senderId, recipientId);

    const message: EnhancedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      recipientId,
      content,
      timestamp: new Date(),
      status: 'sent',
      conversationId,
      attachments: options.attachments,
      mentions: options.mentions,
    };

    // Add to queue
    this.messageQueue.unshift(message);

    // Maintain max size
    if (this.messageQueue.length > this.MAX_MESSAGES) {
      this.messageQueue.pop();
    }

    // Update conversation metadata
    this.updateConversationMetadata(conversationId, senderId, recipientId, message);

    // Notify listeners
    this.notifyListeners();
    this.notifyConversationListeners();

    return message;
  }

  /**
   * Get messages in a conversation
   */
  public getConversationMessages(
    conversationId: string,
    options: { limit?: number; offset?: number } = {}
  ): EnhancedMessage[] {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    return this.messageQueue
      .filter(msg => msg.conversationId === conversationId && msg.status !== 'deleted')
      .slice(offset, offset + limit);
  }

  /**
   * Get all conversations for a user
   */
  public getUserConversations(userId: string): ConversationMetadata[] {
    return Array.from(this.conversations.values())
      .filter(conv => conv.participantIds.includes(userId))
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  /**
   * Get conversation details
   */
  public getConversation(conversationId: string): ConversationMetadata | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Mark message as read
   */
  public markMessageAsRead(messageId: string): boolean {
    const messageIndex = this.messageQueue.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;

    this.messageQueue[messageIndex].status = 'read';
    this.notifyListeners();
    return true;
  }

  /**
   * Mark all messages in conversation as read
   */
  public markConversationAsRead(conversationId: string, userId: string): number {
    let count = 0;
    this.messageQueue.forEach(msg => {
      if (
        msg.conversationId === conversationId &&
        msg.recipientId === userId &&
        msg.status !== 'read'
      ) {
        msg.status = 'read';
        count++;
      }
    });

    if (count > 0) {
      this.updateConversationUnreadCount(conversationId, userId);
      this.notifyListeners();
      this.notifyConversationListeners();
    }

    return count;
  }

  /**
   * Delete a message
   */
  public deleteMessage(messageId: string): boolean {
    const messageIndex = this.messageQueue.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;

    this.messageQueue[messageIndex].status = 'deleted';
    this.notifyListeners();
    return true;
  }

  /**
   * Get unread message count for user
   */
  public getUnreadCount(userId: string): number {
    return this.messageQueue.filter(
      msg => msg.recipientId === userId && msg.status === 'sent'
    ).length;
  }

  /**
   * Get unread count by conversation
   */
  public getConversationUnreadCount(conversationId: string, userId: string): number {
    return this.messageQueue.filter(
      msg =>
        msg.conversationId === conversationId &&
        msg.recipientId === userId &&
        msg.status === 'sent'
    ).length;
  }

  /**
   * Search messages
   */
   public searchMessages(
     userId: string,
     searchTerm: string,
     options: { conversationId?: string; limit?: number; includeAttachments?: boolean; includeMentions?: boolean; includeReactions?: boolean } = {}
   ): EnhancedMessage[] {
     const limit = options.limit || 100;
     const lowerTerm = searchTerm.toLowerCase();

     return this.messageQueue
       .filter(msg => {
         const isInvolvedUser =
           msg.senderId === userId || msg.recipientId === userId;
         const matchesConversation = !options.conversationId ||
           msg.conversationId === options.conversationId;
         const matchesContent = msg.content.toLowerCase().includes(lowerTerm);
         const matchesMentions = options.includeMentions && msg.mentions ? 
           msg.mentions.some(m => m.toLowerCase().includes(lowerTerm)) : false;
         const matchesAttachments = options.includeAttachments && msg.attachments ? 
           msg.attachments.some(att => att.toLowerCase().includes(lowerTerm)) : false;
         const matchesReactions = options.includeReactions && msg.reactions ? 
           Object.keys(msg.reactions).some(reaction => reaction.toLowerCase().includes(lowerTerm)) : false;

         const matchesSearch = matchesContent || matchesMentions || matchesAttachments || matchesReactions;

         return isInvolvedUser && matchesConversation && matchesSearch && msg.status !== 'deleted';
       })
       .slice(0, limit);
   }

  /**
   * Get messages with filter
   */
  public getFilteredMessages(
    userId: string,
    filter: MessageFilter,
    options: { limit?: number; offset?: number } = {}
  ): EnhancedMessage[] {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let filtered = this.messageQueue.filter(msg => {
      const isInvolvedUser = msg.senderId === userId || msg.recipientId === userId;

      const matchesConversation = !filter.conversationId ||
        msg.conversationId === filter.conversationId;
      const matchesSender = !filter.senderId || msg.senderId === filter.senderId;
      const matchesRecipient = !filter.recipientId || msg.recipientId === filter.recipientId;
      const matchesStatus = !filter.status || msg.status === filter.status;
      const matchesDateRange =
        (!filter.startDate || msg.timestamp >= filter.startDate) &&
        (!filter.endDate || msg.timestamp <= filter.endDate);

      return (
        isInvolvedUser &&
        matchesConversation &&
        matchesSender &&
        matchesRecipient &&
        matchesStatus &&
        matchesDateRange
      );
    });

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get recent messages (last 24 hours)
   */
  public getRecentMessages(userId: string, hoursBack: number = 24): EnhancedMessage[] {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return this.messageQueue.filter(
      msg =>
        (msg.senderId === userId || msg.recipientId === userId) &&
        msg.timestamp >= cutoffTime &&
        msg.status !== 'deleted'
    );
  }

  /**
   * Get user's direct conversations
   */
  public getUserDirectMessages(userId: string): ConversationMetadata[] {
    return this.getUserConversations(userId);
  }

  /**
   * Check if user has unread messages
   */
  public hasUnreadMessages(userId: string): boolean {
    return this.getUnreadCount(userId) > 0;
  }

  /**
   * Get unread conversations
   */
  public getUnreadConversations(userId: string): ConversationMetadata[] {
    return this.getUserConversations(userId).filter(conv => {
      const unread = this.messageQueue.filter(
        msg =>
          msg.conversationId === conv.id &&
          msg.recipientId === userId &&
          msg.status === 'sent'
      ).length;
      return unread > 0;
    });
  }

  /**
   * Clear conversation
   */
  public clearConversation(conversationId: string): number {
    const countBefore = this.messageQueue.filter(
      msg => msg.conversationId === conversationId && msg.status !== 'deleted'
    ).length;

    this.messageQueue.forEach(msg => {
      if (msg.conversationId === conversationId) {
        msg.status = 'deleted';
      }
    });

    this.notifyListeners();
    return countBefore;
  }

  /**
   * Block user (prevent receiving messages)
   */
  public blockUser(userId: string, blockedUserId: string): string {
    // Store in user preferences (would be in user's settings in real app)
    const blockListKey = `blocked_${userId}`;
    const currentList = JSON.parse(localStorage.getItem(blockListKey) || '[]');
    if (!currentList.includes(blockedUserId)) {
      currentList.push(blockedUserId);
      localStorage.setItem(blockListKey, JSON.stringify(currentList));
    }
    return blockedUserId;
  }

  /**
   * Check if user is blocked
   */
  public isUserBlocked(userId: string, potentialBlockerId: string): boolean {
    const blockListKey = `blocked_${potentialBlockerId}`;
    const blockedList = JSON.parse(localStorage.getItem(blockListKey) || '[]');
    return blockedList.includes(userId);
  }

  /**
   * Pin/Unpin conversation
   */
  public pinConversation(conversationId: string, pinned: boolean): void {
    if (pinned) {
      this.pinnedConversations.add(conversationId);
    } else {
      this.pinnedConversations.delete(conversationId);
    }
    this.notifyConversationListeners();
  }

  /**
   * Check if conversation is pinned
   */
  public isConversationPinned(conversationId: string): boolean {
    return this.pinnedConversations.has(conversationId);
  }

  /**
   * Mute/Unmute conversation
   */
  public muteConversation(conversationId: string, muted: boolean): void {
    if (muted) {
      this.mutedConversations.add(conversationId);
    } else {
      this.mutedConversations.delete(conversationId);
    }
    this.notifyConversationListeners();
  }

  /**
   * Check if conversation is muted
   */
  public isConversationMuted(conversationId: string): boolean {
    return this.mutedConversations.has(conversationId);
  }

  /**
   * Archive/Unarchive conversation
   */
  public archiveConversation(conversationId: string, archived: boolean): void {
    if (archived) {
      this.archivedConversations.add(conversationId);
    } else {
      this.archivedConversations.delete(conversationId);
    }
    this.notifyConversationListeners();
  }

  /**
   * Check if conversation is archived
   */
  public isConversationArchived(conversationId: string): boolean {
    return this.archivedConversations.has(conversationId);
  }

  /**
   * Set typing indicator
   */
  public setTyping(conversationId: string, userId: string, isTyping: boolean): void {
    if (isTyping) {
      this.typingUsers.set(`${conversationId}_${userId}`, new Date());
    } else {
      this.typingUsers.delete(`${conversationId}_${userId}`);
    }
    this.notifyListeners();
  }

  /**
   * Get typing users in conversation
   */
  public getTypingUsers(conversationId: string): string[] {
    const now = new Date();
    const typingUsers: string[] = [];

    for (const [key, timestamp] of this.typingUsers.entries()) {
      const [convId, userId] = key.split('_');
      if (convId === conversationId && now.getTime() - timestamp.getTime() < 3000) {
        typingUsers.push(userId);
      } else if (now.getTime() - timestamp.getTime() >= 3000) {
        this.typingUsers.delete(key);
      }
    }

    return typingUsers;
  }

  /**
   * Add reaction to message
   */
  public addReaction(messageId: string, userId: string, reaction: string): void {
    const message = this.messageQueue.find(msg => msg.id === messageId);
    if (message) {
      if (!message.reactions) {
        message.reactions = {};
      }
      if (!message.reactions[reaction]) {
        message.reactions[reaction] = [];
      }
      if (!message.reactions[reaction].includes(userId)) {
        message.reactions[reaction].push(userId);
      }
      this.notifyListeners();
    }
  }

  /**
   * Remove reaction from message
   */
  public removeReaction(messageId: string, userId: string, reaction: string): void {
    const message = this.messageQueue.find(msg => msg.id === messageId);
    if (message && message.reactions && message.reactions[reaction]) {
      message.reactions[reaction] = message.reactions[reaction].filter(id => id !== userId);
      if (message.reactions[reaction].length === 0) {
        delete message.reactions[reaction];
      }
      this.notifyListeners();
    }
  }

  /**
   * Export messages
   */
  public exportMessages(conversationId: string): string {
    const messages = this.getConversationMessages(conversationId);
    return JSON.stringify(messages, null, 2);
  }

  /**
   * Subscribe to message updates
   */
  public subscribe(listener: (messages: EnhancedMessage[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to conversation updates
   */
  public subscribeToConversations(
    listener: (conversations: ConversationMetadata[]) => void
  ): () => void {
    this.conversationListeners.push(listener);
    return () => {
      this.conversationListeners = this.conversationListeners.filter(l => l !== listener);
    };
  }

  /**
   * Private helper: Update conversation metadata
   */
  private updateConversationMetadata(
    conversationId: string,
    senderId: string,
    recipientId: string,
    lastMessage: EnhancedMessage
  ): void {
    const existing = this.conversations.get(conversationId);

    if (existing) {
      existing.lastMessageAt = lastMessage.timestamp;
      existing.lastMessage = lastMessage;
      if (lastMessage.recipientId === recipientId) {
        existing.unreadCount++;
      }
    } else {
      this.conversations.set(conversationId, {
        id: conversationId,
        participantIds: [senderId, recipientId],
        lastMessageAt: lastMessage.timestamp,
        lastMessage,
        unreadCount: 1,
      });
    }
  }

  /**
   * Private helper: Update unread count
   */
  private updateConversationUnreadCount(conversationId: string, userId: string): void {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.unreadCount = this.getConversationUnreadCount(conversationId, userId);
    }
  }

  /**
   * Private helper: Notify message listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.messageQueue]));
  }

  /**
   * Private helper: Notify conversation listeners
   */
  private notifyConversationListeners(): void {
    const allConversations = Array.from(this.conversations.values());
    this.conversationListeners.forEach(listener => listener(allConversations));
  }

  /**
   * Get statistics
   */
  public getStatistics(userId: string) {
    const userMessages = this.messageQueue.filter(
      msg => msg.senderId === userId || msg.recipientId === userId
    );

    return {
      totalMessages: userMessages.length,
      sentMessages: userMessages.filter(msg => msg.senderId === userId).length,
      receivedMessages: userMessages.filter(msg => msg.recipientId === userId).length,
      unreadCount: this.getUnreadCount(userId),
      conversationCount: this.getUserConversations(userId).length,
      unreadConversationCount: this.getUnreadConversations(userId).length,
      blockedUserCount: JSON.parse(localStorage.getItem(`blocked_${userId}`) || '[]')
        .length,
    };
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
