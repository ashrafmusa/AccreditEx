import { useState, useCallback } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIAgentContext {
  route?: string;
  page_title?: string;
  user_role?: string;
  timestamp?: string;
}

const API_BASE_URL = 'https://accreditex.onrender.com';

export function useAIAgent() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string>(`thread_${Date.now()}`);

  const sendMessage = useCallback(async (
    message: string,
    context?: AIAgentContext
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
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          thread_id: threadId,
          context: context || {}
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          
          // Update the assistant message in real-time
          setChatHistory(prev => {
            const newHistory = [...prev];
            const lastMessage = newHistory[newHistory.length - 1];
            
            if (lastMessage?.role === 'assistant') {
              // Update existing assistant message
              newHistory[newHistory.length - 1] = {
                ...lastMessage,
                content: assistantMessage
              };
            } else {
              // Add new assistant message
              newHistory.push({
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date()
              });
            }
            
            return newHistory;
          });
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setThreadId(`thread_${Date.now()}`);
  }, []);

  return {
    chatHistory,
    isLoading,
    error,
    sendMessage,
    clearHistory
  };
}
