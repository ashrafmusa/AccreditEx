/**
 * Supplier Card Component
 */

import { Supplier } from "@/types/supplier";
import { Building2, TrendingUp } from "lucide-react";

const riskColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusColors = {
  approved: "bg-green-50 border-green-200",
  conditional: "bg-blue-50 border-blue-200",
  probation: "bg-yellow-50 border-yellow-200",
  suspended: "bg-red-50 border-red-200",
  inactive: "bg-gray-50 border-gray-200",
};

interface SupplierCardProps {
  supplier: Supplier;
  onClick: () => void;
}

export default function SupplierCard({ supplier, onClick }: SupplierCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
        statusColors[supplier.status]
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Building2 size={24} className="mt-1 text-brand-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-text-primary truncate">
              {supplier.name}
            </h3>
            <p className="text-sm text-brand-text-secondary">{supplier.type}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
            riskColors[supplier.riskLevel]
          }`}
        >
          {supplier.riskLevel.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-brand-text-secondary">
          <span className="font-medium">{supplier.contactPerson}</span>
          <span>•</span>
          <span className="truncate">{supplier.email}</span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-primary" />
          <span className="font-medium">
            {t("score")}: {supplier.scorecard.overallScore}/100
          </span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between text-xs">
            <span className="text-brand-text-secondary">{t("status")}</span>
            <span className="font-medium text-brand-primary capitalize">
              {supplier.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function - in real implementation, import from language provider
function t(key: string): string {
  const keys: Record<string, string> = {
    score: "Score",
    status: "Status",
  };
  return keys[key] || key;
}
