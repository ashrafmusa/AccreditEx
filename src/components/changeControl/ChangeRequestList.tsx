/**
 * Change Request List Component
 * Displays filterable list of change requests with search and filter options
 */

import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useChangeControlStore } from "@/stores/useChangeControlStore";
import {
  ChangePriority,
  ChangeRequest,
  ChangeStatus,
} from "@/types/changeControl";
import { Filter, Loader, Search } from "lucide-react";
import { useState } from "react";
import ChangeRequestCard from "./ChangeRequestCard";
import ChangeRequestForm from "./ChangeRequestForm";

interface ChangeRequestListProps {
  requests: ChangeRequest[];
  filters?: {
    status?: ChangeStatus;
    priority?: ChangePriority;
    search?: string;
  };
  onSetStatusFilter: (status: string) => void;
  onSetPriorityFilter: (priority: ChangePriority | "") => void;
  onSetSearchTerm: (term: string) => void;
  onSelectRequest: (request: ChangeRequest) => void;
  onCreateSuccess: () => void;
  showCreateForm: boolean;
  onCreateFormToggle: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS: ChangeStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "implemented",
  "rejected",
  "cancelled",
];

const PRIORITY_OPTIONS: ChangePriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export default function ChangeRequestList({
  requests,
  filters = {},
  onSetStatusFilter,
  onSetPriorityFilter,
  onSetSearchTerm,
  onSelectRequest,
  onCreateSuccess,
  showCreateForm,
  onCreateFormToggle,
  loading = false,
}: ChangeRequestListProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { error, clearError } = useChangeControlStore();
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");

  // Filter requests based on applied filters
  const filteredRequests = requests.filter((req) => {
    if (filters.status && req.status !== filters.status) return false;
    if (filters.priority && req.priority !== filters.priority) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        req.title.toLowerCase().includes(searchLower) ||
        req.description.toLowerCase().includes(searchLower) ||
        (req.tags &&
          req.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    }
    return true;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.dateRequested).getTime() -
        new Date(a.dateRequested).getTime()
      );
    } else {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
    }
  });

  const getStatusColor = (status: ChangeStatus) => {
    const colors: Record<ChangeStatus, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      implemented: "bg-brand-primary/10 text-brand-primary",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: ChangePriority) => {
    const colors: Record<ChangePriority, string> = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[priority];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Create Form */}
      {showCreateForm && (
        <div className="border-b border-brand-border dark:border-dark-brand-border p-6 bg-brand-background/50 dark:bg-dark-brand-background/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("newChangeRequest")}
            </h2>
            <button
              onClick={onCreateFormToggle}
              className="text-sm text-brand-text-secondary hover:text-brand-text-primary"
            >
              ✕ {t("cancel")}
            </button>
          </div>
          <ChangeRequestForm
            onSuccess={onCreateSuccess}
            onCancel={onCreateFormToggle}
          />
        </div>
      )}

      {/* Filters */}
      <div className="border-b border-brand-border dark:border-dark-brand-border p-4 bg-white dark:bg-dark-brand-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Filter size={18} className="text-brand-text-secondary" />
            <span className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("filters")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3 text-brand-text-secondary"
              />
              <input
                type="text"
                placeholder={t("searchChangeRequests") || "Search..."}
                onChange={(e) => onSetSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-brand-border text-sm placeholder-brand-text-secondary bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              onChange={(e) => onSetStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-brand-border text-sm bg-white"
            >
              <option value="">{t("allStatuses")}</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`) || status}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              onChange={(e) =>
                onSetPriorityFilter((e.target.value as ChangePriority) || "")
              }
              className="px-3 py-2 rounded-md border border-brand-border text-sm bg-white"
            >
              <option value="">{t("allPriorities")}</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`priority.${priority}`) || priority}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "priority")}
              className="px-3 py-2 rounded-md border border-brand-border text-sm bg-white"
            >
              <option value="date">{t("sortByDate")}</option>
              <option value="priority">{t("sortByPriority")}</option>
            </select>
          </div>

          {/* Active Filters Display */}
          {(filters.status || filters.priority || filters.search) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.status && (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(filters.status)}`}
                >
                  {t(`status.${filters.status}`) || filters.status}
                </span>
              )}
              {filters.priority && (
                <span
                  className={`px-3 py-1 rounded-full text-sm bg-gray-100 ${getPriorityColor(
                    filters.priority,
                  )}`}
                >
                  {t(`priority.${filters.priority}`) || filters.priority}
                </span>
              )}
              {filters.search && (
                <span className="px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary">
                  Search: "{filters.search}"
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        {loading && sortedRequests.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <Loader className="animate-spin h-6 w-6 text-brand-primary" />
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-text-secondary">
              {requests.length === 0
                ? t("noChangeRequestsYet")
                : t("noMatchingChangeRequests")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedRequests.map((request) => (
              <ChangeRequestCard
                key={request.id}
                request={request}
                onClick={() => onSelectRequest(request)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
