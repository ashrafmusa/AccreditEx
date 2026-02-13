/**
 * AI Assistant Demo Component
 *
 * Demonstrates the enhanced AI capabilities for form/document provision and smart assistance.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import React, { useState } from "react";
import DOMPurify from "dompurify";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { SparklesIcon, DocumentIcon, SearchIcon } from "../icons";

interface AIAssistantDemoProps {
  className?: string;
}

const AIAssistantDemo: React.FC<AIAssistantDemoProps> = ({
  className = "",
}) => {
  const {
    getForm,
    search,
    generateDocument,
    askAssistant,
    quickActions,
    getAvailableContent,
    isLoading,
    error,
    clearError,
  } = useAIAssistant();

  const [activeTab, setActiveTab] = useState<
    "forms" | "search" | "generate" | "chat"
  >("forms");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "ai"; message: string }>
  >([]);

  const handleGetForm = async (formType?: string) => {
    try {
      clearError();
      const type = formType || userInput || "incident report";
      const formResult = await getForm(type);
      setResult(formResult);
    } catch (err) {
      console.error("Error getting form:", err);
    }
  };

  const handleSearch = async () => {
    try {
      clearError();
      const searchResult = await search(userInput || "safety");
      setResult(searchResult);
    } catch (err) {
      console.error("Error searching:", err);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      clearError();
      const docResult = await generateDocument(userInput || "incident report", {
        department: "Safety",
        urgency: "high",
        context: "Demo generation",
      });
      setResult(docResult);
    } catch (err) {
      console.error("Error generating document:", err);
    }
  };

  const handleChat = async () => {
    if (!userInput.trim()) return;

    try {
      clearError();
      setChatHistory((prev) => [...prev, { role: "user", message: userInput }]);

      const response = await askAssistant(userInput);
      setChatHistory((prev) => [...prev, { role: "ai", message: response }]);
      setUserInput("");
    } catch (err) {
      console.error("Error in chat:", err);
    }
  };

  const { templates, forms } = getAvailableContent();

  const QuickActionButtons = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      <button
        onClick={() => quickActions.getIncidentForm().then(setResult)}
        className="p-2 bg-red-100 hover:bg-red-200 rounded text-red-800 text-sm"
        disabled={isLoading}
      >
        📋 Incident Report
      </button>
      <button
        onClick={() => quickActions.getSafetyChecklist().then(setResult)}
        className="p-2 bg-green-100 hover:bg-green-200 rounded text-green-800 text-sm"
        disabled={isLoading}
      >
        ✅ Safety Checklist
      </button>
      <button
        onClick={() => quickActions.getPolicyTemplate().then(setResult)}
        className="p-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 text-sm"
        disabled={isLoading}
      >
        📜 Policy Template
      </button>
      <button
        onClick={() => quickActions.getRiskAssessment().then(setResult)}
        className="p-2 bg-orange-100 hover:bg-orange-200 rounded text-orange-800 text-sm"
        disabled={isLoading}
      >
        ⚠️ Risk Assessment
      </button>
    </div>
  );

  return (
    <div
      className={`ai-assistant-demo bg-white rounded-lg shadow-lg p-6 ${className}`}
    >
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-rose-600" />
          AI Assistant - Smart Form & Document Provider
        </h2>
        <p className="text-gray-600 mt-2">
          Request any form, template, or document. The AI has full app awareness
          and can provide instant assistance.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        {[
          { key: "forms", label: "Get Forms", icon: "📋" },
          { key: "search", label: "Smart Search", icon: "🔍" },
          { key: "generate", label: "Generate Document", icon: "📄" },
          { key: "chat", label: "Chat Assistant", icon: "💬" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === tab.key
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "forms" && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Request Any Form or Template
            </h3>
            <QuickActionButtons />
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'incident report', 'safety checklist', 'training manual'..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                onKeyPress={(e) => e.key === "Enter" && handleGetForm()}
                disabled={isLoading}
              />
              <button
                onClick={() => handleGetForm()}
                disabled={isLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-pink-600 disabled:opacity-50"
              >
                {isLoading ? "..." : "Get Form"}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Available: {templates.length} templates, {forms.length} forms
            </p>
          </div>
        )}

        {activeTab === "search" && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Smart Search with AI Suggestions
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'safety procedures', 'quality forms', 'training materials'..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "generate" && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Generate Custom Document
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'incident report for chemical spill', 'policy for remote work'..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) =>
                  e.key === "Enter" && handleGenerateDocument()
                }
                disabled={isLoading}
              />
              <button
                onClick={handleGenerateDocument}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <DocumentIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Chat with AI Assistant
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
              {chatHistory.length === 0 ? (
                <p className="text-gray-500 italic">
                  Ask me anything! I have full access to all app features,
                  forms, templates, and data.
                </p>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-3 ${
                      msg.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-rose-600 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {msg.role === "user" ? "You" : "🤖 AI Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me anything about forms, documents, workflows, or app features..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                onKeyPress={(e) => e.key === "Enter" && handleChat()}
                disabled={isLoading}
              />
              <button
                onClick={handleChat}
                disabled={isLoading || !userInput.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-pink-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">Result</h3>

          {/* Form/Template Result */}
          {result.content && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="font-medium text-blue-800">
                  {result.metadata?.name} ({result.type})
                </h4>
                <p className="text-blue-600 text-sm mt-1">
                  {result.metadata?.description}
                </p>
                {result.instructions && (
                  <p className="text-blue-700 text-sm mt-2 italic">
                    💡 {result.instructions}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 border rounded-md p-4 max-h-96 overflow-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(result.content),
                  }}
                />
              </div>
            </div>
          )}

          {/* Search Result */}
          {result.ai_suggestions && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  AI Suggestions
                </h4>
                <div className="text-green-700 whitespace-pre-wrap">
                  {result.ai_suggestions}
                </div>
              </div>

              {result.best_matches?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Best Matches
                  </h4>
                  <div className="grid gap-2">
                    {result.best_matches.map((match: any, idx: number) => (
                      <div key={idx} className="bg-white border rounded p-3">
                        <div className="font-medium">{match.name}</div>
                        <div className="text-sm text-gray-600">
                          {match.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Category: {match.category} | Tags:{" "}
                          {match.tags?.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generated Document */}
          {result.suggestions && (
            <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-4">
              <p className="text-pink-600">{result.suggestions}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 flex items-center justify-center p-4">
          <SparklesIcon className="w-6 h-6 text-rose-600 animate-spin mr-2" />
          <span className="text-rose-600">AI is working...</span>
        </div>
      )}
    </div>
  );
};

export default AIAssistantDemo;
