/**
 * UpgradePrompt — AccreditEx
 *
 * Displayed when a user navigates to a module that is not
 * enabled for their organization's plan or type.
 * Provides a friendly message and upgrade CTA.
 */

import React from "react";
import type { ModuleId } from "@/types/modules";
import { MODULE_REGISTRY } from "@/data/moduleRegistry";
import { getRequiredPlan } from "@/services/moduleService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useTranslation } from "@/hooks/useTranslation";
import { LockClosedIcon, ArrowTrendingUpIcon } from "@/components/icons";

interface UpgradePromptProps {
  moduleId: ModuleId;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ moduleId }) => {
  const { t } = useTranslation();
  const currentOrg = useTenantStore((s) => s.currentOrganization);
  const moduleDef = MODULE_REGISTRY[moduleId];
  const requiredPlan = getRequiredPlan(moduleId);
  const currentPlan = currentOrg?.plan || "free";

  const planLabels: Record<string, string> = {
    free: t("planFree"),
    starter: t("planStarter"),
    professional: t("planProfessional"),
    enterprise: t("planEnterprise"),
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <LockClosedIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t("moduleNotAvailable")}
        </h2>

        {/* Module name */}
        <p className="text-lg font-medium text-brand-primary mb-4">
          {t(moduleDef?.nameKey || moduleId)}
        </p>

        {/* Explanation */}
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {t("moduleRequiresPlan").replace(
            "{{plan}}",
            planLabels[requiredPlan] || requiredPlan,
          )}
        </p>

        {/* Current plan badge */}
        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("currentPlan")}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
            {planLabels[currentPlan] || currentPlan}
          </span>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-2">
          <button
            onClick={() => {
              // Navigate to settings/billing when available
              // For now, show contact admin message
            }}
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <ArrowTrendingUpIcon className="h-5 w-5" />
            {t("upgradeNow")}
          </button>
        </div>

        {/* Admin contact hint */}
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          {t("contactAdminForUpgrade")}
        </p>
      </div>
    </div>
  );
};

export default UpgradePrompt;
