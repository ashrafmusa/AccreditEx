import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@/components/icons";

interface MessageSearchProps {
  onSearch: (query: string, filters: MessageSearchFilters) => void;
  onClear: () => void;
  isSearching?: boolean;
}

export interface MessageSearchFilters {
  query: string;
  startDate?: Date;
  endDate?: Date;
  hasAttachments?: boolean;
  isMention?: boolean;
  hasReactions?: boolean;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  onSearch,
  onClear,
  isSearching = false,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasAttachments, setHasAttachments] = useState(false);
  const [isMention, setIsMention] = useState(false);
  const [hasReactions, setHasReactions] = useState(false);

  const handleSearch = () => {
    onSearch(query, {
      query,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      hasAttachments,
      isMention,
      hasReactions,
    });
  };

  const handleClear = () => {
    setQuery("");
    setStartDate("");
    setEndDate("");
    setHasAttachments(false);
    setIsMention(false);
    setHasReactions(false);
    onClear();
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t("searchMessages")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-4 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSearching ? t("searchingMessages") : t("search")}
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="text-sm text-brand-primary hover:text-sky-700 font-medium transition-colors"
      >
        {showFilters ? "▼" : "▶"} {t("advancedFilters")}
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
              {t("filterByDate")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAttachments}
                onChange={(e) => setHasAttachments(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <DocumentTextIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("hasAttachments")}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMention}
                onChange={(e) => setIsMention(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("mentionsOnly")}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReactions}
                onChange={(e) => setHasReactions(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("hasReactions")}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMention}
                onChange={(e) => setIsMention(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("mentionsOnly")}
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {t("clearFilters")}
            </button>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
            >
              {t("send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { MessageSearch };
export default MessageSearch;
