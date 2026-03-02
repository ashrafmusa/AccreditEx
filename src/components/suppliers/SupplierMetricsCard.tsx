/**
 * Supplier Metrics Card Component
 */

import { useTranslation } from "@/hooks/useTranslation";
import { SupplierMetrics } from "@/types/supplier";
import { AlertTriangle, BarChart3, CheckCircle2, Clock } from "lucide-react";

interface SupplierMetricsCardProps {
  metrics: SupplierMetrics | null;
}

export default function SupplierMetricsCard({
  metrics,
}: SupplierMetricsCardProps) {
  const { t } = useTranslation();

  if (!metrics) {
    return <div className="text-center py-12">{t("loadingMetrics")}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-text-primary">
        {t("supplierMetrics")}
      </h2>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          t("totalSuppliers"),
          metrics.totalSuppliers.toString(),
          "text-blue-600",
          BarChart3,
        )}
        {renderMetricCard(
          t("approvedSuppliers"),
          metrics.approvedCount.toString(),
          "text-green-600",
          CheckCircle2,
        )}
        {renderMetricCard(
          t("suspendedSuppliers"),
          metrics.suspendedCount.toString(),
          "text-red-600",
          AlertTriangle,
        )}
        {renderMetricCard(
          t("probationSuppliers"),
          metrics.probationCount.toString(),
          "text-yellow-600",
          Clock,
        )}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6">
          <p className="text-sm text-brand-text-secondary mb-3">
            {t("averageRiskLevel")}
          </p>
          <div className="text-2xl font-bold text-brand-primary capitalize">
            {metrics.averageRiskLevel}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6">
          <p className="text-sm text-brand-text-secondary mb-3">
            {t("averageScorecardValue")}
          </p>
          <div className="text-2xl font-bold text-brand-primary">
            {metrics.averageScorecard.toFixed(1)}/100
          </div>
        </div>

        <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6">
          <p className="text-sm text-brand-text-secondary mb-3">
            {t("pendingAudits")}
          </p>
          <div className="text-2xl font-bold text-brand-primary">
            {metrics.pendingAuditsCount}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6">
          <p className="text-sm text-brand-text-secondary mb-3">
            {t("expiringCertifications")}
          </p>
          <div className="text-2xl font-bold text-brand-primary">
            {metrics.suppliersWithExpiringCertifications}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMetricCard(
  label: string,
  value: string,
  colorClass: string,
  Icon: any,
) {
  return (
    <div className="bg-white dark:bg-dark-brand-surface rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={24} className={colorClass} />
        </div>
        <div>
          <p className="text-sm text-brand-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-brand-text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

function t(key: string): string {
  const keys: Record<string, string> = {
    loadingMetrics: "Loading metrics...",
    supplierMetrics: "Supplier Metrics",
    totalSuppliers: "Total Suppliers",
    approvedSuppliers: "Approved",
    suspendedSuppliers: "Suspended",
    probationSuppliers: "Probation",
    averageRiskLevel: "Average Risk Level",
    averageScorecardValue: "Average Scorecard",
    pendingAudits: "Pending Audits",
    expiringCertifications: "Expiring Certs",
  };
  return keys[key] || key;
}
