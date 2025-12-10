/**
 * AI Assistant Component - AccreditEx
 *
 * Floating chat widget for interacting with the AI agent.
 * Provides context-aware assistance throughout the application.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  aiAgentService,
  ChatMessage,
  ChatResponse,
} from "@/services/aiAgentService";
import { useToast } from "@/hooks/useToast";

interface AIAssistantProps {
  defaultOpen?: boolean;
  position?: "bottom-right" | "bottom-left";
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  defaultOpen = false,
  position = "bottom-right",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Check AI agent health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await aiAgentService.healthCheck();
      setIsHealthy(healthy);
      if (!healthy) {
        toast.error("AI Assistant is currently unavailable");
      }
    };
    checkHealth();
  }, [toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isHealthy) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponse = await aiAgentService.chat(input);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Failed to get response from AI assistant");

      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    aiAgentService.resetThread();
    toast.success("Conversation reset");
  };

  const positionClasses =
    position === "bottom-right" ? "right-4 md:right-6" : "left-4 md:left-6";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 md:bottom-6 ${positionClasses} z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110`}
        aria-label="Open AI Assistant"
      >
        <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 md:bottom-6 ${positionClasses} z-50 w-96 max-w-[calc(100vw-2rem)] ${
        isMinimized ? "h-14" : "h-[600px] max-h-[calc(100vh-2rem)]"
      } bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          {!isHealthy && (
            <ExclamationCircleIcon className="w-4 h-4 text-yellow-300" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-primary-700 p-1 rounded transition-colors"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            ) : (
              <MinusIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-primary-700 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <ChatBubbleBottomCenterTextIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">How can I help you today?</p>
                <p className="text-xs mt-2">
                  I can assist with compliance, risk assessment, and training
                  recommendations.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            {messages.length > 0 && (
              <button
                onClick={resetConversation}
                className="text-xs text-gray-500 hover:text-gray-700 mb-2"
              >
                Reset conversation
              </button>
            )}
            <div className="flex space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isHealthy
                    ? "Type your message..."
                    : "AI Assistant unavailable"
                }
                disabled={isLoading || !isHealthy}
                className="flex-1 resize-none border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !isHealthy}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
};
