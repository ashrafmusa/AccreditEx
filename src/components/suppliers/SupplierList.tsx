/**
 * Supplier List Component
 */

import { useTranslation } from "@/hooks/useTranslation";
import { RiskLevel, Supplier } from "@/types/supplier";
import { Search } from "lucide-react";
import SupplierCard from "./SupplierCard";
import SupplierForm from "./SupplierForm";

interface SupplierListProps {
  suppliers: Supplier[];
  filters: { status?: string; riskLevel?: RiskLevel | ""; search?: string };
  onFiltersChange: {
    statusFilter: string;
    riskFilter: RiskLevel | "";
    searchTerm: string;
  };
  onSetStatusFilter: (status: string) => void;
  onSetRiskFilter: (risk: RiskLevel | "") => void;
  onSetSearchTerm: (term: string) => void;
  onSelectSupplier: (supplier: Supplier) => void;
  onCreateSuccess: () => Promise<void>;
  showCreateForm: boolean;
  onCreateFormToggle: () => void;
  loading: boolean;
}

export default function SupplierList({
  suppliers,
  filters,
  onSetStatusFilter,
  onSetRiskFilter,
  onSetSearchTerm,
  onSelectSupplier,
  onCreateSuccess,
  showCreateForm,
  onCreateFormToggle,
  loading,
}: SupplierListProps) {
  const { t } = useTranslation();

  const filteredSuppliers = suppliers.filter((s) => {
    if (filters.status && s.status !== filters.status) return false;
    if (filters.riskLevel && s.riskLevel !== filters.riskLevel) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        s.name.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        s.contactPerson.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-4 shadow-sm">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t("search")}
              value={filters.search || ""}
              onChange={(e) => onSetSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-white dark:bg-dark-brand-background text-brand-text-primary"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                {t("status")}
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => onSetStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-white dark:bg-dark-brand-background text-brand-text-primary"
              >
                <option value="">{t("all")}</option>
                <option value="approved">{t("approved")}</option>
                <option value="conditional">{t("conditional")}</option>
                <option value="probation">{t("probation")}</option>
                <option value="suspended">{t("suspended")}</option>
                <option value="inactive">{t("inactive")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                {t("riskLevel")}
              </label>
              <select
                value={filters.riskLevel || ""}
                onChange={(e) =>
                  onSetRiskFilter((e.target.value as RiskLevel) || "")
                }
                className="w-full px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-white dark:bg-dark-brand-background text-brand-text-primary"
              >
                <option value="">{t("all")}</option>
                <option value="low">{t("low")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="high">{t("high")}</option>
                <option value="critical">{t("critical")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <SupplierForm
          onSuccess={onCreateSuccess}
          onCancel={onCreateFormToggle}
        />
      )}

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onClick={() => onSelectSupplier(supplier)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-brand-text-secondary">{t("noSuppliers")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
