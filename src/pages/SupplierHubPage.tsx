/**
 * Supplier Hub Page
 * Main page for Supplier Quality Management module
 */

import SupplierDetail from "@/components/suppliers/SupplierDetail";
import SupplierList from "@/components/suppliers/SupplierList";
import SupplierMetricsCard from "@/components/suppliers/SupplierMetricsCard";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useSupplierStore } from "@/stores/useSupplierStore";
import { useUserStore } from "@/stores/useUserStore";
import { RiskLevel, Supplier } from "@/types/supplier";
import { Loader, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function SupplierHubPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser: _currentUser } = useUserStore();
  const {
    suppliers,
    currentSupplier,
    metrics,
    loading,
    error,
    filters,
    fetchAllSuppliers,
    fetchMetrics,
    setCurrentSupplier,
    setFilters,
    clearError,
  } = useSupplierStore();

  const [activeTab, setActiveTab] = useState<"overview" | "list" | "detail">(
    "overview",
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      await fetchAllSuppliers();
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
      status: statusFilter || undefined,
      riskLevel: (riskFilter as RiskLevel) || undefined,
      search: searchTerm,
    });
  }, [statusFilter, riskFilter, searchTerm]);

  // Re-fetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAllSuppliers();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleRefresh = async () => {
    await fetchAllSuppliers();
    await fetchMetrics();
    toast.success(t("refreshed") || "Refreshed");
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setActiveTab("detail");
  };

  const handleCloseDetail = () => {
    setCurrentSupplier(null);
    setActiveTab("list");
  };

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await fetchAllSuppliers();
    await fetchMetrics();
    toast.success(t("supplierCreated") || "Supplier created successfully");
  };

  return (
    <div className="flex flex-col h-screen bg-brand-background dark:bg-dark-brand-background">
      {/* Header */}
      <div className="bg-brand-primary dark:bg-dark-brand-primary text-white p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            {t("supplierQualityManagement")}
          </h1>
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
              {t("addSupplier")}
            </button>
          </div>
        </div>
        <p className="text-white/80">{t("supplierQMDescription")}</p>
      </div>

      {/* Loading */}
      {loading && suppliers.length === 0 && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        </div>
      )}

      {/* Content */}
      {!loading || suppliers.length > 0 ? (
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
                {t("suppliers")} ({suppliers.length})
              </button>
              {currentSupplier && (
                <button
                  onClick={() => setActiveTab("detail")}
                  className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === "detail"
                      ? "border-brand-primary text-brand-primary"
                      : "border-transparent text-brand-text-secondary"
                  }`}
                >
                  {currentSupplier.name}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "overview" && (
              <div className="p-6">
                <SupplierMetricsCard metrics={metrics} />
              </div>
            )}

            {activeTab === "list" && (
              <SupplierList
                suppliers={suppliers}
                filters={{
                  status: statusFilter,
                  riskLevel: riskFilter,
                  search: searchTerm,
                }}
                onFiltersChange={{ statusFilter, riskFilter, searchTerm }}
                onSetStatusFilter={setStatusFilter}
                onSetRiskFilter={setRiskFilter}
                onSetSearchTerm={setSearchTerm}
                onSelectSupplier={handleSelectSupplier}
                onCreateSuccess={handleCreateSuccess}
                showCreateForm={showCreateForm}
                onCreateFormToggle={() => setShowCreateForm(!showCreateForm)}
                loading={loading}
              />
            )}

            {activeTab === "detail" && currentSupplier && (
              <SupplierDetail
                supplier={currentSupplier}
                onClose={handleCloseDetail}
                onUpdate={async () => {
                  await fetchAllSuppliers();
                  await fetchMetrics();
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
