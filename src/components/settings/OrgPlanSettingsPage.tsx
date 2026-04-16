/**
 * OrgPlanSettingsPage — AccrediTex
 *
 * Super-admin settings page for managing:
 *  1. Organization plan tier & subscription dates
 *  2. Per-module enable/disable overrides
 *  3. Trial configuration
 *
 * All Firestore writes go through organizationService (super-admin only).
 */

import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@/components/icons";
import { MODULE_REGISTRY } from "@/data/moduleRegistry";
import { useTranslation } from "@/hooks/useTranslation";
import {
  checkIsSuperAdmin,
  updateOrganization,
} from "@/services/organizationService";
import { useTenantStore } from "@/stores/useTenantStore";
import type { ModuleId, PlanTier } from "@/types/modules";
import { PLAN_MODULE_MAP } from "@/types/modules";
import React, { useEffect, useState } from "react";

// ── Plan definitions ────────────────────────────────────────

interface PlanDef {
  id: PlanTier;
  label: string;
  color: string;
  badge: string;
  description: string;
  maxUsers: number | null;
}

const PLANS: PlanDef[] = [
  {
    id: "free",
    label: "Free",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    badge: "bg-gray-200 dark:bg-gray-600",
    description: "Calendar access only. For evaluation purposes.",
    maxUsers: 3,
  },
  {
    id: "starter",
    label: "Starter",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    badge: "bg-blue-200 dark:bg-blue-800",
    description: "Core accreditation modules for small-to-medium facilities.",
    maxUsers: 20,
  },
  {
    id: "professional",
    label: "Professional",
    color:
      "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary",
    badge: "bg-brand-primary/20 dark:bg-brand-primary/30",
    description:
      "Advanced analytics, automation, and lab operations for growing organizations.",
    maxUsers: 100,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    badge: "bg-amber-200 dark:bg-amber-800",
    description:
      "Full platform access. HIS integration, unlimited users, all modules.",
    maxUsers: null,
  },
];

// Non-core modules that can be toggled
const TOGGLEABLE_MODULE_IDS = Object.keys(MODULE_REGISTRY).filter(
  (id) => MODULE_REGISTRY[id as ModuleId].tier !== "core",
) as ModuleId[];

// ── Component ───────────────────────────────────────────────

const OrgPlanSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentOrganization, loadOrganization } = useTenantStore();

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Platform super-admin check via /platformAdmins/{uid} Firestore collection
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    checkIsSuperAdmin()
      .then(setIsSuperAdmin)
      .catch(() => setIsSuperAdmin(false));
  }, []);

  // Local form state (mirrors org doc)
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(
    currentOrganization?.plan ?? "free",
  );
  const [maxUsers, setMaxUsers] = useState<number>(
    currentOrganization?.maxUsers ?? 0,
  );
  const [trialActive, setTrialActive] = useState(
    currentOrganization?.trialActive ?? false,
  );
  const [trialEndsAt, setTrialEndsAt] = useState(
    currentOrganization?.trialEndsAt
      ? currentOrganization.trialEndsAt.slice(0, 10)
      : "",
  );
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(
    currentOrganization?.subscriptionExpiresAt
      ? currentOrganization.subscriptionExpiresAt.slice(0, 10)
      : "",
  );

  // Module overrides (explicit enable/disable on top of plan)
  const [extraEnabled, setExtraEnabled] = useState<Set<ModuleId>>(
    new Set(currentOrganization?.moduleConfig?.enabledModules ?? []),
  );
  const [forceDisabled, setForceDisabled] = useState<Set<ModuleId>>(
    new Set(currentOrganization?.moduleConfig?.disabledModules ?? []),
  );

  // Sub-module toggles
  const [subModules, setSubModules] = useState(
    currentOrganization?.moduleConfig?.subModules ?? {},
  );

  // Sync when org changes
  useEffect(() => {
    if (!currentOrganization) return;
    setSelectedPlan(currentOrganization.plan ?? "free");
    setMaxUsers(currentOrganization.maxUsers ?? 0);
    setTrialActive(currentOrganization.trialActive ?? false);
    setTrialEndsAt(
      currentOrganization.trialEndsAt
        ? currentOrganization.trialEndsAt.slice(0, 10)
        : "",
    );
    setSubscriptionExpiresAt(
      currentOrganization.subscriptionExpiresAt
        ? currentOrganization.subscriptionExpiresAt.slice(0, 10)
        : "",
    );
    setExtraEnabled(
      new Set(currentOrganization.moduleConfig?.enabledModules ?? []),
    );
    setForceDisabled(
      new Set(currentOrganization.moduleConfig?.disabledModules ?? []),
    );
    setSubModules(currentOrganization.moduleConfig?.subModules ?? {});
  }, [currentOrganization]);

  if (!currentOrganization) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        {t("noOrganizationLoaded") || "No organization loaded."}
      </div>
    );
  }

  const planModules = new Set(PLAN_MODULE_MAP[selectedPlan] ?? []);

  const isModuleEffectivelyEnabled = (id: ModuleId) => {
    if (forceDisabled.has(id)) return false;
    return planModules.has(id) || extraEnabled.has(id);
  };

  const toggleModuleOverride = (id: ModuleId) => {
    const inPlan = planModules.has(id);
    const isExtraEnabled = extraEnabled.has(id);
    const isForceDisabled = forceDisabled.has(id);

    if (isForceDisabled) {
      // Was force-disabled → restore to plan default
      setForceDisabled((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else if (inPlan && !isExtraEnabled) {
      // In plan and active → force-disable it
      setForceDisabled((prev) => new Set([...prev, id]));
    } else if (!inPlan && !isExtraEnabled) {
      // Not in plan → add to extraEnabled
      setExtraEnabled((prev) => new Set([...prev, id]));
    } else if (!inPlan && isExtraEnabled) {
      // Was extra-enabled → remove
      setExtraEnabled((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else if (inPlan && isExtraEnabled) {
      // Redundant extra enable + in plan → remove extraEnabled
      setExtraEnabled((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!currentOrganization?.id) return;
    // Guard: only platform super-admins can persist org changes
    if (!isSuperAdmin) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveError(null);
    try {
      await updateOrganization(currentOrganization.id, {
        plan: selectedPlan,
        maxUsers: maxUsers > 0 ? maxUsers : undefined,
        trialActive,
        trialEndsAt: trialEndsAt
          ? new Date(trialEndsAt).toISOString()
          : undefined,
        subscriptionExpiresAt: subscriptionExpiresAt
          ? new Date(subscriptionExpiresAt).toISOString()
          : undefined,
        moduleConfig: {
          enabledModules: [...extraEnabled],
          disabledModules: [...forceDisabled],
          subModules,
        },
      });
      // Reload org into store so changes propagate immediately
      await loadOrganization(currentOrganization.id);
      setSaveMsg(t("changesSaved") || "Changes saved successfully.");
    } catch (err: any) {
      setSaveError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentPlanDef = PLANS.find((p) => p.id === currentOrganization.plan);

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("orgPlanSettings") || "Organization Plan & Modules"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("orgPlanSettingsDesc") ||
            "Manage subscription plan, trial dates, user limits, and per-module feature access for this organization."}
        </p>
      </div>

      {/* Current plan status badge */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${currentPlanDef?.color ?? ""}`}
        >
          <SparklesIcon className="w-4 h-4" />
          {currentPlanDef?.label ?? currentOrganization.plan ?? "Free"}
        </span>
        {currentOrganization.trialActive && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <CalendarDaysIcon className="w-3.5 h-3.5" />
            {t("trialActive") || "Trial Active"}
            {currentOrganization.trialEndsAt && (
              <span className="opacity-75">
                &nbsp;— ends{" "}
                {new Date(currentOrganization.trialEndsAt).toLocaleDateString()}
              </span>
            )}
          </span>
        )}
      </div>

      {/* ── Section 1: Plan Selection ── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {t("subscriptionPlan") || "Subscription Plan"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t("subscriptionPlanDesc") ||
            "Changing the plan updates which modules are available. Module overrides below can further customize access."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-4 rounded-xl border-2 text-start transition-all ${
                selectedPlan === plan.id
                  ? "border-brand-primary shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {selectedPlan === plan.id && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-white" />
                </span>
              )}
              <p className="font-semibold text-gray-900 dark:text-white">
                {plan.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {plan.description}
              </p>
              <p className="text-xs font-medium mt-2 text-gray-600 dark:text-gray-300">
                {plan.maxUsers
                  ? `Up to ${plan.maxUsers} users`
                  : "Unlimited users"}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Section 2: Limits & Dates ── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {t("limitsAndDates") || "Limits & Subscription Dates"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t("limitsAndDatesDesc") ||
            "Set maximum users and subscription/trial dates. The system enforces the user limit on new user creation."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Max Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("maxUsers") || "Max Users"}
              <span className="ms-2 text-xs text-gray-400">
                (0 = unlimited)
              </span>
            </label>
            <input
              type="number"
              min={0}
              value={maxUsers}
              onChange={(e) => setMaxUsers(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          {/* Subscription Expires At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("subscriptionExpiresAt") || "Subscription Expires"}
            </label>
            <input
              type="date"
              value={subscriptionExpiresAt}
              onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          {/* Trial Active */}
          <div className="flex items-center gap-3">
            <input
              id="trialActive"
              type="checkbox"
              checked={trialActive}
              onChange={(e) => setTrialActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <label
              htmlFor="trialActive"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("trialActive") || "Trial Active"}
            </label>
          </div>

          {/* Trial Ends At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("trialEndsAt") || "Trial Ends"}
            </label>
            <input
              type="date"
              value={trialEndsAt}
              disabled={!trialActive}
              onChange={(e) => setTrialEndsAt(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-50"
            />
          </div>
        </div>
      </section>

      {/* ── Section 3: Module Overrides ── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {t("moduleOverrides") || "Module Access Overrides"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t("moduleOverridesDesc") ||
            "Customize which modules this organization can access beyond the plan defaults. Green = enabled, Gray = disabled."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOGGLEABLE_MODULE_IDS.map((id) => {
            const def = MODULE_REGISTRY[id];
            if (!def) return null;
            const isInPlan = planModules.has(id);
            const isEnabled = isModuleEffectivelyEnabled(id);
            const isExtraOn = extraEnabled.has(id) && !isInPlan;
            const isForcedOff = forceDisabled.has(id);

            return (
              <button
                key={id}
                onClick={() => toggleModuleOverride(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-start ${
                  isEnabled
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60"
                }`}
              >
                {isEnabled ? (
                  <CheckBadgeIcon className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <LockClosedIcon className="w-5 h-5 shrink-0 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {t(def.nameKey) || id}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isInPlan && !isForcedOff && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Included in {selectedPlan} plan
                      </span>
                    )}
                    {!isInPlan && isExtraOn && (
                      <span className="text-brand-primary">
                        Extra enabled (override)
                      </span>
                    )}
                    {isForcedOff && (
                      <span className="text-red-500">Force disabled</span>
                    )}
                    {!isInPlan && !isExtraOn && !isForcedOff && (
                      <span>Not in {selectedPlan} plan — click to enable</span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isEnabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {isEnabled ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Section 4: Sub-Module Toggles ── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {t("subModuleToggles") || "Sub-Module Toggles"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t("subModuleTogglesDesc") ||
            "Fine-grained control over sub-features within premium modules."}
        </p>
        <div className="space-y-4">
          {/* Lab Operations */}
          <SubSection
            title="Lab Operations"
            items={[
              {
                key: "enableQC",
                label: "Quality Control (IQC/EQC)",
                value: (subModules as any)?.labOperations?.enableQC ?? true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    labOperations: {
                      ...(prev?.labOperations ?? {}),
                      enableQC: v,
                    },
                  })),
              },
              {
                key: "enableProficiencyTesting",
                label: "Proficiency Testing",
                value:
                  (subModules as any)?.labOperations
                    ?.enableProficiencyTesting ?? true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    labOperations: {
                      ...(prev?.labOperations ?? {}),
                      enableProficiencyTesting: v,
                    },
                  })),
              },
              {
                key: "enableReagentTracking",
                label: "Reagent Tracking",
                value:
                  (subModules as any)?.labOperations?.enableReagentTracking ??
                  true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    labOperations: {
                      ...(prev?.labOperations ?? {}),
                      enableReagentTracking: v,
                    },
                  })),
              },
            ]}
          />
          {/* Audit */}
          <SubSection
            title="Audit Hub"
            items={[
              {
                key: "enableQualityRounding",
                label: "Quality Rounding",
                value:
                  (subModules as any)?.audit?.enableQualityRounding ?? true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    audit: { ...(prev?.audit ?? {}), enableQualityRounding: v },
                  })),
              },
              {
                key: "enableTracerMethodology",
                label: "Tracer Methodology",
                value:
                  (subModules as any)?.audit?.enableTracerMethodology ?? true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    audit: {
                      ...(prev?.audit ?? {}),
                      enableTracerMethodology: v,
                    },
                  })),
              },
            ]}
          />
          {/* Training */}
          <SubSection
            title="Training Hub"
            items={[
              {
                key: "enableCECredits",
                label: "CE Credits",
                value: (subModules as any)?.training?.enableCECredits ?? true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    training: { ...(prev?.training ?? {}), enableCECredits: v },
                  })),
              },
              {
                key: "enableCompetencyAssessment",
                label: "Competency Assessment",
                value:
                  (subModules as any)?.training?.enableCompetencyAssessment ??
                  true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    training: {
                      ...(prev?.training ?? {}),
                      enableCompetencyAssessment: v,
                    },
                  })),
              },
              {
                key: "enablePerformanceEval",
                label: "Performance Evaluations",
                value:
                  (subModules as any)?.training?.enablePerformanceEval ?? true,
                onChange: (v: boolean) =>
                  setSubModules((prev: any) => ({
                    ...prev,
                    training: {
                      ...(prev?.training ?? {}),
                      enablePerformanceEval: v,
                    },
                  })),
              },
            ]}
          />
        </div>
      </section>

      {/* Save / Feedback — only visible to platform super-admins */}
      {isSuperAdmin ? (
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckIcon className="w-4 h-4" />
            )}
            {saving
              ? t("saving") || "Saving…"
              : t("saveChanges") || "Save Changes"}
          </button>

          {saveMsg && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckBadgeIcon className="w-4 h-4" />
              {saveMsg}
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {saveError}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm">
          <LockClosedIcon className="w-4 h-4 shrink-0" />
          <span>
            Plan and module changes are managed by the AccrediTex platform team.
            Contact support to request a plan change.
          </span>
        </div>
      )}
    </div>
  );
};

// ── SubSection helper ─────────────────────────────────────

interface SubSectionItem {
  key: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

const SubSection: React.FC<{ title: string; items: SubSectionItem[] }> = ({
  title,
  items,
}) => (
  <div>
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {title}
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {items.map((item) => (
        <label
          key={item.key}
          className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <input
            type="checkbox"
            checked={item.value}
            onChange={(e) => item.onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {item.label}
          </span>
        </label>
      ))}
    </div>
  </div>
);

export default OrgPlanSettingsPage;
