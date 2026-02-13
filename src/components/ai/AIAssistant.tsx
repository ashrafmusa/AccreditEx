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
import DOMPurify from "dompurify";
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
import { useTranslation } from "@/hooks/useTranslation";

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
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { t } = useTranslation();

  // Simple markdown-like formatting
  const formatMessage = (text: string) => {
    return (
      text
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
        .replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>')
        // Headers: ## text or === underline
        .replace(
          /^##\s+(.+)$/gm,
          '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>',
        )
        .replace(
          /^(.+)\n=+$/gm,
          '<h2 class="text-xl font-bold mt-4 mb-3">$1</h2>',
        )
        .replace(
          /^(.+)\n-+$/gm,
          '<h3 class="text-lg font-semibold mt-3 mb-2">$1</h3>',
        )
        // Lists: - item or * item
        .replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
        // Code blocks: `code`
        .replace(
          /`(.+?)`/g,
          '<code class="bg-gray-100 dark:bg-slate-600 px-1 py-0.5 rounded text-sm">$1</code>',
        )
        // Line breaks
        .replace(/\n\n/g, "<br/><br/>")
    );
  };

  // Check AI agent health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await aiAgentService.healthCheck();
      setIsHealthy(healthy);
      // Don't show toast on mount, only when user tries to interact
    };
    checkHealth();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!isHealthy) {
      toast.error("AI Assistant is currently offline. Please try again later.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("🤖 Sending message to AI:", input);
      const response: ChatResponse = await aiAgentService.chat(input);
      console.log("✅ AI response received:", response);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("❌ AI chat error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`AI error: ${errorMsg}`);

      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "I'm currently unable to respond. The AI service may be temporarily unavailable. Please try again in a few moments.",
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
        className={`fixed bottom-4 md:bottom-6 ${positionClasses} z-[9999] bg-gradient-to-br from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-sky-500/50 group relative cursor-pointer`}
        style={{ touchAction: "manipulation" }}
        aria-label={t("openAiAssistant")}
        title={t("chatWithAiAssistant")}
      >
        <ChatBubbleBottomCenterTextIcon className="w-6 h-6 drop-shadow-lg" />
        {/* Pulse animation ring - only when healthy */}
        {isHealthy && (
          <span className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-20 pointer-events-none"></span>
        )}
        {/* Badge indicator */}
        <span
          className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white rounded-full pointer-events-none ${
            isHealthy ? "bg-green-400" : "bg-yellow-400"
          }`}
        ></span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 md:bottom-6 ${positionClasses} z-[9999] w-96 max-w-[calc(100vw-2rem)] ${
        isMinimized ? "h-14" : "h-[600px] max-h-[calc(100vh-2rem)]"
      } bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300 backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-t-2xl cursor-move">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
            </div>
            {isHealthy && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-white/80">
              {isHealthy ? "Online" : "Offline"}
            </p>
          </div>
          {!isHealthy && (
            <ExclamationCircleIcon className="w-5 h-5 text-yellow-300" />
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            ) : (
              <MinusIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200"
            aria-label={t("closeDialog")}
            title={t("closeDialog")}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center">
                  {isHealthy ? (
                    <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                  ) : (
                    <ExclamationCircleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  {isHealthy
                    ? "How can I help you today?"
                    : "AI Assistant Temporarily Unavailable"}
                </p>
                <p className="text-sm mt-3 text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  {isHealthy
                    ? "I can assist with compliance questions, risk assessment, training recommendations, and OHAS standards."
                    : "The AI service is currently offline. Please check back later or contact support if this persists."}
                </p>
                {isHealthy && (
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() =>
                        setInput("What are the key OHAS standards?")
                      }
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full hover:border-sky-400 dark:hover:border-sky-500 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      OHAS Standards
                    </button>
                    <button
                      onClick={() => setInput("Help me with risk assessment")}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full hover:border-sky-400 dark:hover:border-sky-500 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Risk Assessment
                    </button>
                    <button
                      onClick={() => setInput("Show compliance checklist")}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full hover:border-sky-400 dark:hover:border-sky-500 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Compliance Checklist
                    </button>
                  </div>
                )}
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
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-sky-600 to-cyan-600 text-white"
                      : "bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600"
                  }`}
                >
                  <div
                    className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        message.role === "assistant"
                          ? formatMessage(message.content)
                          : message.content,
                      ),
                    }}
                  />
                  <span className="text-xs opacity-70 mt-1.5 block">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl p-4 shadow-sm">
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            {messages.length > 0 && (
              <button
                onClick={resetConversation}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 mb-3 flex items-center gap-1 transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset conversation
              </button>
            )}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isHealthy
                      ? "Ask me anything..."
                      : "AI Assistant unavailable"
                  }
                  disabled={isLoading || !isHealthy}
                  className="w-full resize-none border border-gray-300 dark:border-slate-600 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  rows={2}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !isHealthy}
                className="bg-gradient-to-br from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl px-4 transition-all duration-200 shadow-lg hover:shadow-sky-500/50 disabled:shadow-none flex items-center justify-center"
                aria-label={t("sendMessage")}
                title={t("sendMessage")}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded">
                  Enter
                </kbd>{" "}
                to send •{" "}
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded">
                  Shift+Enter
                </kbd>{" "}
                for new line
              </p>
              {isHealthy && (
                <span className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Connected
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
