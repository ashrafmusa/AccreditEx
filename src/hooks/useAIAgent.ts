/**
 * useAIAgent hook
 * Provides AI chat capabilities via the canonical aiAgentService.
 * 
 * This hook consolidates AI communication through a single service layer
 * instead of making independent fetch calls. Supports streaming responses.
 */

import { useState, useCallback } from 'react';
import { aiAgentService } from '@/services/aiAgentService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIAgentContext {
  user_id?: string;
  route?: string;
  page_title?: string;
  user_role?: string;
  timestamp?: string;
}

export function useAIAgent() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    _context?: AIAgentContext
  ) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      // Use the canonical aiAgentService (handles auth, streaming, context enrichment)
      const response = await aiAgentService.chat(message, true);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response || '',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  return {
    chatHistory,
    isLoading,
    error,
    sendMessage,
    clearHistory
  };
}
