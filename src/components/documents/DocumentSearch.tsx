import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  ClockIcon,
} from "../icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentSearchProps {
  onSearch: (query: string) => void;
  onFilter: (filters: DocumentFilters) => void;
  resultCount?: number;
  availableTags?: string[];
}

export interface DocumentFilters {
  status?: string;
  dateRange?: { start: Date; end: Date };
  author?: string;
  tags?: string[];
  category?: string;
  departmentId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEARCH_HISTORY_KEY = "accreditex_search_history";
const MAX_HISTORY = 5;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: string[]): void {
  localStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY)),
  );
}

/** Count how many individual filter values are active. */
function countActiveFilters(f: DocumentFilters): number {
  let count = 0;
  if (f.status) count++;
  if (f.category) count++;
  if (f.departmentId) count++;
  if (f.author) count++;
  if (f.tags && f.tags.length > 0) count++;
  if (f.dateRange) count++;
  return count;
}

/** Build human-readable active filter entries for the summary bar. */
function getActiveFilterEntries(
  f: DocumentFilters,
  t: (key: string) => string | undefined,
  deptLookup: (id: string) => string,
): { key: keyof DocumentFilters; label: string; value: string }[] {
  const entries: {
    key: keyof DocumentFilters;
    label: string;
    value: string;
  }[] = [];
  if (f.status)
    entries.push({
      key: "status",
      label: t("status") || "Status",
      value: f.status,
    });
  if (f.category)
    entries.push({
      key: "category",
      label: t("category") || "Category",
      value: f.category,
    });
  if (f.departmentId)
    entries.push({
      key: "departmentId",
      label: t("department") || "Department",
      value: deptLookup(f.departmentId),
    });
  if (f.author)
    entries.push({
      key: "author",
      label: t("author") || "Author",
      value: f.author,
    });
  if (f.tags && f.tags.length > 0)
    entries.push({
      key: "tags",
      label: t("tags") || "Tags",
      value: f.tags.join(", "),
    });
  if (f.dateRange) {
    const fmt = (d: Date) => d.toLocaleDateString();
    entries.push({
      key: "dateRange",
      label: t("dateRange") || "Date Range",
      value: `${fmt(f.dateRange.start)} – ${fmt(f.dateRange.end)}`,
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DocumentSearch: React.FC<DocumentSearchProps> = ({
  onSearch,
  onFilter,
  resultCount,
  availableTags = [],
}) => {
  const { t, lang } = useTranslation();
  const { departments } = useAppStore();

  // ---- State ---------------------------------------------------------------
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DocumentFilters>({});

  // Search history & suggestions
  const [searchHistory, setSearchHistory] =
    useState<string[]>(getSearchHistory);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Date range helpers
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ---- Refs ----------------------------------------------------------------
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // ---- Keyboard shortcut (Ctrl+K / Cmd+K) ----------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ---- Close suggestions on outside click -----------------------------------
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        tagSuggestionsRef.current &&
        !tagSuggestionsRef.current.contains(e.target as Node)
      ) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ---- Debounced search -----------------------------------------------------
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
        // Persist to history
        if (value.trim()) {
          setSearchHistory((prev) => {
            const next = [
              value.trim(),
              ...prev.filter((h) => h !== value.trim()),
            ].slice(0, MAX_HISTORY);
            saveSearchHistory(next);
            return next;
          });
        }
      }, DEBOUNCE_MS);
    },
    [onSearch],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ---- Handlers -------------------------------------------------------------

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    searchInputRef.current?.focus();
  };

  const selectSuggestion = (value: string) => {
    setQuery(value);
    onSearch(value);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleFilterChange = <K extends keyof DocumentFilters>(
    key: K,
    value: DocumentFilters[K],
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const removeFilter = (key: keyof DocumentFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilter(newFilters);
    // Reset date inputs when removing dateRange
    if (key === "dateRange") {
      setDateFrom("");
      setDateTo("");
    }
    if (key === "tags") {
      setTagInput("");
    }
  };

  const clearFilters = () => {
    setFilters({});
    onFilter({});
    setDateFrom("");
    setDateTo("");
    setTagInput("");
  };

  // ---- Tag helpers ----------------------------------------------------------

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const currentTags = filters.tags || [];
    if (!currentTags.includes(trimmed)) {
      handleFilterChange("tags", [...currentTags, trimmed]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const removeTag = (tag: string) => {
    const currentTags = (filters.tags || []).filter((t) => t !== tag);
    handleFilterChange(
      "tags",
      currentTags.length > 0 ? currentTags : undefined,
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const filteredTagSuggestions = useMemo(() => {
    const current = filters.tags || [];
    return availableTags
      .filter((tag) => !current.includes(tag))
      .filter((tag) => tag.toLowerCase().includes(tagInput.toLowerCase()));
  }, [availableTags, filters.tags, tagInput]);

  // ---- Date range helpers ---------------------------------------------------

  const applyDateRange = useCallback(
    (from: string, to: string) => {
      if (from && to) {
        handleFilterChange("dateRange", {
          start: new Date(from),
          end: new Date(to),
        });
      } else {
        removeFilter("dateRange");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters],
  );

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    applyDateRange(value, dateTo);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    applyDateRange(dateFrom, value);
  };

  const applyQuickDate = (days: number | "year") => {
    const end = new Date();
    let start: Date;
    if (days === "year") {
      start = new Date(end.getFullYear(), 0, 1);
    } else {
      start = new Date();
      start.setDate(start.getDate() - days);
    }
    const toISO = (d: Date) => d.toISOString().split("T")[0];
    setDateFrom(toISO(start));
    setDateTo(toISO(end));
    handleFilterChange("dateRange", { start, end });
  };

  // ---- Derived values -------------------------------------------------------

  const activeCount = countActiveFilters(filters);
  const deptLookup = useCallback(
    (id: string): string => {
      const dept = departments.find((d) => d.id === id);
      if (!dept) return id;
      return typeof dept.name === "string"
        ? dept.name
        : dept.name[lang] || dept.name.en;
    },
    [departments, lang],
  );
  const activeEntries = useMemo(
    () => getActiveFilterEntries(filters, t, deptLookup),
    [filters, t, deptLookup],
  );

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="bg-white dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border mb-6">
      {/* Row: Search + Filter toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {/* Search Bar */}
        <div className="flex-1 relative" ref={suggestionsRef}>
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => searchHistory.length > 0 && setShowSuggestions(true)}
            placeholder={t("searchDocuments") || "Search documents..."}
            className="block w-full ps-10 pe-24 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          />
          {/* Keyboard shortcut hint + Clear button */}
          <div className="absolute inset-y-0 end-0 pe-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                aria-label={t("clearSearch") || "Clear search"}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {!query && (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-300 select-none">
                {shortcutLabel}
              </kbd>
            )}
          </div>

          {/* Search history suggestions dropdown */}
          {showSuggestions && searchHistory.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg overflow-hidden">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {t("recentSearches") || "Recent Searches"}
              </div>
              {searchHistory.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-start"
                >
                  <ClockIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
            showFilters || activeCount > 0
              ? "bg-brand-primary/10 text-brand-primary border-brand-primary"
              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          }`}
        >
          <FunnelIcon className="h-5 w-5 me-2" />
          {t("filters") || "Filters"}
          {activeCount > 0 && (
            <span className="ms-2 bg-brand-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {resultCount === 1
            ? t("oneResultFound") || "1 result found"
            : `${resultCount} ${t("resultsFound") || "results found"}`}
        </p>
      )}

      {/* Active Filters Summary Bar */}
      {activeEntries.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeEntries.map((entry) => (
            <span
              key={entry.key}
              className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium px-2.5 py-1"
            >
              {entry.label}: {entry.value}
              <button
                type="button"
                onClick={() => removeFilter(entry.key)}
                className="ms-0.5 rounded-full p-0.5 hover:bg-brand-primary/20 focus:outline-none"
                aria-label={`${t("remove") || "Remove"} ${entry.label}`}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
          >
            {t("clearAll") || "Clear All"}
          </button>
        </div>
      )}

      {/* Expanded Filters — animated panel */}
      <div
        ref={filterPanelRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: showFilters ? "600px" : "0px",
          opacity: showFilters ? 1 : 0,
        }}
      >
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Row 1: Status + Category + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("status") || "Status"}
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) =>
                  handleFilterChange("status", e.target.value || undefined)
                }
                className="block w-full ps-3 pe-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t("allStatuses") || "All Statuses"}</option>
                <option value="Draft">{t("draft") || "Draft"}</option>
                <option value="Pending Review">
                  {t("pendingReview") || "Pending Review"}
                </option>
                <option value="Approved">{t("approved") || "Approved"}</option>
                <option value="Rejected">{t("rejected") || "Rejected"}</option>
                <option value="Archived">{t("archived") || "Archived"}</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("category") || "Category"}
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  handleFilterChange("category", e.target.value || undefined)
                }
                className="block w-full ps-3 pe-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">
                  {t("allCategories") || "All Categories"}
                </option>
                <option value="Quality Management">
                  {t("qualityManagement") || "Quality Management"}
                </option>
                <option value="Safety">{t("safety") || "Safety"}</option>
                <option value="Operations">
                  {t("operations") || "Operations"}
                </option>
                <option value="Human Resources">
                  {t("humanResources") || "Human Resources"}
                </option>
                <option value="Finance">{t("finance") || "Finance"}</option>
                <option value="IT">
                  {t("informationTechnology") || "Information Technology"}
                </option>
                <option value="Compliance">
                  {t("compliance") || "Compliance"}
                </option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("department") || "Department"}
              </label>
              <select
                value={filters.departmentId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "departmentId",
                    e.target.value || undefined,
                  )
                }
                className="block w-full ps-3 pe-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">
                  {t("allDepartments") || "All Departments"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {typeof dept.name === "string"
                      ? dept.name
                      : dept.name[lang] || dept.name.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Author + Tags + Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Author Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("author") || "Author"}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.author || ""}
                  onChange={(e) =>
                    handleFilterChange("author", e.target.value || undefined)
                  }
                  placeholder={t("filterByAuthor") || "Filter by author"}
                  className="focus:ring-brand-primary focus:border-brand-primary block w-full ps-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white py-2"
                />
              </div>
            </div>

            {/* Tag Input */}
            <div className="relative" ref={tagSuggestionsRef}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("tags") || "Tags"}
              </label>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus-within:ring-1 focus-within:ring-brand-primary focus-within:border-brand-primary">
                {(filters.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded bg-brand-primary/10 text-brand-primary text-xs font-medium px-2 py-0.5"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ms-0.5 rounded hover:bg-brand-primary/20 p-0.5 focus:outline-none"
                      aria-label={`${t("removeTag") || "Remove tag"} ${tag}`}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={
                    (filters.tags || []).length === 0
                      ? t("addTags") || "Add tags…"
                      : ""
                  }
                  className="flex-1 min-w-[80px] bg-transparent border-0 p-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
              {/* Tag suggestions dropdown */}
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredTagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-start"
                    >
                      <TagIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("dateRange") || "Date Range"}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 start-0 ps-2 flex items-center pointer-events-none">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="block w-full ps-8 pe-2 py-2 text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    aria-label={t("fromDate") || "From date"}
                  />
                </div>
                <span className="text-gray-400 text-xs shrink-0">–</span>
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="block w-full px-2 py-2 text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    aria-label={t("toDate") || "To date"}
                  />
                </div>
              </div>
              {/* Quick date presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(
                  [
                    { label: t("last7Days") || "Last 7 days", days: 7 },
                    { label: t("last30Days") || "Last 30 days", days: 30 },
                    { label: t("last90Days") || "Last 90 days", days: 90 },
                    {
                      label: t("thisYear") || "This year",
                      days: "year" as const,
                    },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyQuickDate(preset.days)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 me-1" />
              {t("clearFilters") || "Clear Filters"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSearch;
