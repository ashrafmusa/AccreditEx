import React from "react";
import { useAIChatStore } from "@/stores/useAIChatStore";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function AIChatButton() {
  const { toggleChat, openChat, isOpen } = useAIChatStore();

  if (isOpen) return null;

  return (
    <button
      onClick={openChat}
      className="fixed bottom-6 right-6 w-14 h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
      aria-label="Open AI Assistant"
      title="Ask AI Assistant"
    >
      <SparklesIcon className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-300"></span>
      </span>
    </button>
  );
}
