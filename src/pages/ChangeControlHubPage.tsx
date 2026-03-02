/**
 * Change Control Hub Page
 * Main page for Change Control module
 */

import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useChangeControlStore } from "@/stores/useChangeControlStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  ChangePriority,
  ChangeRequest,
  ChangeStatus,
} from "@/types/changeControl";
import { Loader, Plus, RefreshCw } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

const ChangeRequestList = lazy(
  () => import("@/components/changeControl/ChangeRequestList"),
);
const ChangeRequestDetail = lazy(
  () => import("@/components/changeControl/ChangeRequestDetail"),
);
const ChangeMetricsCard = lazy(
  () => import("@/components/changeControl/ChangeMetricsCard"),
);

export default function ChangeControlHubPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useUserStore();
  const {
    requests,
    currentRequest,
    metrics,
    loading,
    error,
    filters,
    fetchAllRequests,
    fetchMetrics,
    setCurrentRequest,
    setFilters,
    clearError,
  } = useChangeControlStore();

  const [activeTab, setActiveTab] = useState<"overview" | "list" | "detail">(
    "overview",
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<ChangePriority | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      await fetchAllRequests();
      await fetchMetrics();
    };
    loadData();
  }, []);

  // Display error toast if error exists
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  // Apply filters when they change
  useEffect(() => {
    setFilters({
      status: (statusFilter as ChangeStatus) || undefined,
      priority: (priorityFilter as ChangePriority) || undefined,
      search: searchTerm,
    });
  }, [statusFilter, priorityFilter, searchTerm]);

  // Re-fetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAllRequests();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleRefresh = async () => {
    await fetchAllRequests();
    await fetchMetrics();
    toast.success(t("refreshed") || "Refreshed");
  };

  const handleSelectRequest = (request: ChangeRequest) => {
    setCurrentRequest(request);
    setActiveTab("detail");
  };

  const handleCloseDetail = () => {
    setCurrentRequest(null);
    setActiveTab("list");
  };

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await fetchAllRequests();
    await fetchMetrics();
    toast.success(
      t("changeRequestCreated") || "Change request created successfully",
    );
  };

  return (
    <div className="flex flex-col h-screen bg-brand-background dark:bg-dark-brand-background">
      {/* Header */}
      <div className="bg-brand-primary dark:bg-dark-brand-primary text-white p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{t("changeControlManagement")}</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white/20 hover:bg-white/30 border border-white text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} />
              {t("refresh")}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setActiveTab("list");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white text-brand-primary hover:bg-gray-100"
            >
              <Plus size={16} />
              {t("addChangeRequest")}
            </button>
          </div>
        </div>
        <p className="text-white/80">{t("changeControlDescription")}</p>
      </div>

      {/* Loading */}
      {loading && requests.length === 0 && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        </div>
      )}

      {/* Content */}
      {!loading || requests.length > 0 ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="border-b border-brand-border dark:border-dark-brand-border">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === "overview"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-brand-text-secondary"
                }`}
              >
                {t("overview")}
              </button>
              <button
                onClick={() => {
                  setActiveTab("list");
                  setShowCreateForm(false);
                }}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === "list"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-brand-text-secondary"
                }`}
              >
                {t("changeRequests")} ({requests.length})
              </button>
              {currentRequest && (
                <button
                  onClick={() => setActiveTab("detail")}
                  className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === "detail"
                      ? "border-brand-primary text-brand-primary"
                      : "border-transparent text-brand-text-secondary"
                  }`}
                >
                  {currentRequest.title}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "overview" && (
              <div className="p-6">
                <Suspense
                  fallback={<Loader className="animate-spin h-8 w-8" />}
                >
                  <ChangeMetricsCard metrics={metrics} />
                </Suspense>
              </div>
            )}

            {activeTab === "list" && (
              <Suspense fallback={<Loader className="animate-spin h-8 w-8" />}>
                <ChangeRequestList
                  requests={requests}
                  filters={{
                    status: (statusFilter as ChangeStatus) || undefined,
                    priority: (priorityFilter as ChangePriority) || undefined,
                    search: searchTerm,
                  }}
                  onSetStatusFilter={setStatusFilter}
                  onSetPriorityFilter={setPriorityFilter}
                  onSetSearchTerm={setSearchTerm}
                  onSelectRequest={handleSelectRequest}
                  onCreateSuccess={handleCreateSuccess}
                  showCreateForm={showCreateForm}
                  onCreateFormToggle={() => setShowCreateForm(!showCreateForm)}
                  loading={loading}
                />
              </Suspense>
            )}

            {activeTab === "detail" && currentRequest && (
              <Suspense fallback={<Loader className="animate-spin h-8 w-8" />}>
                <ChangeRequestDetail
                  request={currentRequest}
                  onClose={handleCloseDetail}
                  onUpdate={async () => {
                    await fetchAllRequests();
                    await fetchMetrics();
                  }}
                />
              </Suspense>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
