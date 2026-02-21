import React, { useRef, useEffect, useMemo } from "react";
import { useAIChatStore } from "@/stores/useAIChatStore";
import { useTranslation } from "@/hooks/useTranslation";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function AIChatPanel() {
  const { t } = useTranslation();
  const {
    messages,
    isOpen,
    isLoading,
    error,
    isServiceAvailable,
    sendMessage,
    toggleChat,
    clearChat,
    setError,
  } = useAIChatStore();

  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const suggestedQuestions = [
    t("aiSampleQuestion1") ||
      "What are the key requirements for JCI accreditation?",
    t("aiSampleQuestion2") || "How do I prepare for a mock survey?",
    t("aiSampleQuestion3") ||
      "What evidence do I need for patient safety standards?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-sky-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("aiAssistant") || "AI Assistant"}
          </h3>
          {!isServiceAvailable && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={t("clearChat") || "Clear Chat"}
          >
            <ArrowPathIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={toggleChat}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Service Unavailable Warning */}
      {!isServiceAvailable && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold">AI Service Unavailable</p>
              <p className="mt-1">
                The AI assistant is temporarily offline. Please try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-sky-400" />
            <p className="text-sm font-medium mb-2">
              {t("aiWelcomeMessage") || "Welcome! How can I help you today?"}
            </p>
            <div className="mt-6 space-y-3 text-xs text-left">
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {t("tryAsking") || "Try asking"}:
              </p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(question);
                  }}
                  className="block w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="text-gray-700 dark:text-gray-300">{question}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-sky-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.role === "assistant" ? (
                  <span
                    className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        marked.parse(msg.content, { async: false }) as string,
                      ),
                    }}
                  />
                ) : (
                  msg.content
                )}
              </p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === "user"
                    ? "text-sky-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-2 font-medium"
            >
              {t("dismiss") || "Dismiss"}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("typeYourQuestion") || "Type your question..."}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white text-sm"
            disabled={isLoading || !isServiceAvailable}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isServiceAvailable}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            title={t("send") || "Send"}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
