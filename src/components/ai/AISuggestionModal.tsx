import React from "react";
import ReactMarkdown from "react-markdown";
import { XMarkIcon, ClipboardDocumentListIcon } from "@/components/icons";
import { useToast } from "@/hooks/useToast";

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type?:
    | "action-plan"
    | "root-cause"
    | "improvements"
    | "risk-assessment"
    | "compliance-check";
}

const AISuggestionModal: React.FC<AISuggestionModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  type = "improvements",
}) => {
  const toast = useToast();

  if (!isOpen) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const getIcon = () => {
    switch (type) {
      case "action-plan":
        return "📋";
      case "root-cause":
        return "🔍";
      case "improvements":
        return "💡";
      case "risk-assessment":
        return "⚠️";
      case "compliance-check":
        return "✅";
      default:
        return "🤖";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Center modal */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getIcon()}</span>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-white"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-bold mt-3 mb-2 text-gray-900 dark:text-white"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg font-semibold mt-2 mb-1 text-gray-900 dark:text-white"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li
                      className="ml-4 text-gray-700 dark:text-gray-300"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      className="font-semibold text-gray-900 dark:text-white"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-400"
                      {...props}
                    />
                  ),
                  pre: ({ node, ...props }) => (
                    <pre
                      className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto mb-3"
                      {...props}
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-purple-500 pl-4 italic text-gray-700 dark:text-gray-300 my-3"
                      {...props}
                    />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-between items-center border-t dark:border-gray-700">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              Copy to Clipboard
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionModal;
