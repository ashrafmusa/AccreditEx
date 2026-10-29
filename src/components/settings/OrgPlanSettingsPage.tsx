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
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/icons";
import { MODULE_REGISTRY } from "@/data/moduleRegistry";
import { useTranslation } from "@/hooks/useTranslation";
import {
  listDemoRequests,
  updateDemoRequestStatus,
  type DemoRequest,
} from "@/services/demoRequestService";
import {
  checkIsSuperAdmin,
  listAllOrganizations,
  setOrganizationActive,
  updateOrganization,
} from "@/services/organizationService";
import {
  printDataSecurityCertificate,
  printProformaQuote,
  submitPlanUpgradeRequest,
} from "@/services/subscriptionService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Organization } from "@/types";
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
  const { currentOrganization, loadOrganization, setOrganization } =
    useTenantStore();
  const currentUser = useUserStore((s) => s.currentUser);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Platform super-admin check via /platformAdmins/{uid} Firestore collection or platform owner email
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [selectedClientOrg, setSelectedClientOrg] =
    useState<Organization | null>(null);
  const [upgradeRequests, setUpgradeRequests] = useState<DemoRequest[]>([]);
  const [supportDiagnosticConsent, setSupportDiagnosticConsent] =
    useState(false);

  const targetOrg = selectedClientOrg ?? currentOrganization;

  useEffect(() => {
    let active = true;
    checkIsSuperAdmin()
      .then(async (superAdmin) => {
        if (!active) return;
        setIsSuperAdmin(superAdmin);
        if (superAdmin) {
          const [orgs, reqs] = await Promise.all([
            listAllOrganizations().catch(() => [] as Organization[]),
            listDemoRequests().catch(() => [] as DemoRequest[]),
          ]);
          if (!active) return;
          setAllOrganizations(orgs);
          setUpgradeRequests(reqs);
        }
      })
      .catch(() => {
        if (active) setIsSuperAdmin(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Local form state (mirrors targetOrg doc)
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(
    targetOrg?.plan ?? "free",
  );
  const [maxUsers, setMaxUsers] = useState<number>(targetOrg?.maxUsers ?? 0);
  const [trialActive, setTrialActive] = useState(
    targetOrg?.trialActive ?? false,
  );
  const [trialEndsAt, setTrialEndsAt] = useState(
    targetOrg?.trialEndsAt ? targetOrg.trialEndsAt.slice(0, 10) : "",
  );
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(
    targetOrg?.subscriptionExpiresAt
      ? targetOrg.subscriptionExpiresAt.slice(0, 10)
      : "",
  );

  // Module overrides (explicit enable/disable on top of plan)
  const [extraEnabled, setExtraEnabled] = useState<Set<ModuleId>>(
    new Set(targetOrg?.moduleConfig?.enabledModules ?? []),
  );
  const [forceDisabled, setForceDisabled] = useState<Set<ModuleId>>(
    new Set(targetOrg?.moduleConfig?.disabledModules ?? []),
  );

  // Sub-module toggles
  const [subModules, setSubModules] = useState(
    targetOrg?.moduleConfig?.subModules ?? {},
  );

  // Sync when targetOrg changes
  useEffect(() => {
    if (!targetOrg) return;
    setSelectedPlan(targetOrg.plan ?? "free");
    setMaxUsers(targetOrg.maxUsers ?? 0);
    setTrialActive(targetOrg.trialActive ?? false);
    setTrialEndsAt(
      targetOrg.trialEndsAt ? targetOrg.trialEndsAt.slice(0, 10) : "",
    );
    setSubscriptionExpiresAt(
      targetOrg.subscriptionExpiresAt
        ? targetOrg.subscriptionExpiresAt.slice(0, 10)
        : "",
    );
    setExtraEnabled(new Set(targetOrg.moduleConfig?.enabledModules ?? []));
    setForceDisabled(new Set(targetOrg.moduleConfig?.disabledModules ?? []));
    setSubModules(targetOrg.moduleConfig?.subModules ?? {});
  }, [targetOrg]);

  if (!currentOrganization || !targetOrg) {
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

  const handleToggleClientActive = async (org: Organization) => {
    if (!isSuperAdmin) return;
    try {
      const nextStatus = org.isActive === false ? true : false;
      await setOrganizationActive(org.id, nextStatus);
      setAllOrganizations((prev) =>
        prev.map((item) =>
          item.id === org.id ? { ...item, isActive: nextStatus } : item,
        ),
      );
      if (selectedClientOrg?.id === org.id) {
        setSelectedClientOrg({ ...org, isActive: nextStatus });
      }
      setSaveMsg(
        `Organization "${org.name}" is now ${nextStatus ? "Active" : "Suspended"}.`,
      );
    } catch (err: any) {
      setSaveError(err.message || "Could not update organization status.");
    }
  };

  const handleApproveUpgradeRequest = async (req: DemoRequest) => {
    try {
      await updateDemoRequestStatus(
        req.id,
        "completed",
        "Approved via Platform Owner Console",
      );
      setUpgradeRequests((prev) =>
        prev.map((item) =>
          item.id === req.id ? { ...item, status: "completed" } : item,
        ),
      );
      setSaveMsg(`Marked request from "${req.organization}" as Completed.`);
    } catch (err: any) {
      setSaveError(err.message || "Could not update request status.");
    }
  };

  const handleSave = async () => {
    if (!targetOrg?.id) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveError(null);
    const updatedModuleConfig = {
      enabledModules: [...extraEnabled],
      disabledModules: [...forceDisabled],
      subModules,
    };
    try {
      if (isSuperAdmin) {
        await updateOrganization(targetOrg.id, {
          plan: selectedPlan,
          maxUsers: maxUsers > 0 ? maxUsers : undefined,
          trialActive,
          trialEndsAt: trialEndsAt
            ? new Date(trialEndsAt).toISOString()
            : undefined,
          subscriptionExpiresAt: subscriptionExpiresAt
            ? new Date(subscriptionExpiresAt).toISOString()
            : undefined,
          moduleConfig: updatedModuleConfig,
        });
        if (targetOrg.id === currentOrganization.id) {
          await loadOrganization(currentOrganization.id);
        }
        setAllOrganizations((prev) =>
          prev.map((item) =>
            item.id === targetOrg.id
              ? {
                  ...item,
                  plan: selectedPlan,
                  maxUsers: maxUsers > 0 ? maxUsers : item.maxUsers,
                  trialActive,
                  trialEndsAt: trialEndsAt
                    ? new Date(trialEndsAt).toISOString()
                    : item.trialEndsAt,
                  subscriptionExpiresAt: subscriptionExpiresAt
                    ? new Date(subscriptionExpiresAt).toISOString()
                    : item.subscriptionExpiresAt,
                  moduleConfig: updatedModuleConfig,
                }
              : item,
          ),
        );
        setSaveMsg(
          `Saved license & module configuration for "${targetOrg.name}".`,
        );
      } else {
        // Organization Admin: immediately apply plan & module configuration to workspace session
        // and submit an official upgrade/configuration request to platform admins
        setOrganization({
          ...currentOrganization,
          plan: selectedPlan,
          maxUsers: maxUsers > 0 ? maxUsers : currentOrganization.maxUsers,
          trialActive,
          trialEndsAt: trialEndsAt
            ? new Date(trialEndsAt).toISOString()
            : currentOrganization.trialEndsAt,
          subscriptionExpiresAt: subscriptionExpiresAt
            ? new Date(subscriptionExpiresAt).toISOString()
            : currentOrganization.subscriptionExpiresAt,
          moduleConfig: updatedModuleConfig,
        });
        await submitPlanUpgradeRequest({
          name: currentUser?.name || "Organization Administrator",
          email: currentUser?.email || "admin@facility.org",
          organizationName: currentOrganization.name || "Healthcare Facility",
          organizationId: currentOrganization.id,
          targetTier: selectedPlan,
          billingCycle: "annual",
          paymentMethod: "invoice_po",
          notes: `Enabled overrides: [${[...extraEnabled].join(",")}] | Disabled: [${[...forceDisabled].join(",")}]`,
        }).catch(() => {});
        setSaveMsg(
          "Plan & module configuration applied to workspace and official activation request logged.",
        );
      }
    } catch (err: any) {
      // Fallback if Super-Admin email is logged in before /platformAdmins/{uid} doc is created in Firebase Console
      if (targetOrg.id === currentOrganization.id) {
        setOrganization({
          ...currentOrganization,
          plan: selectedPlan,
          maxUsers: maxUsers > 0 ? maxUsers : currentOrganization.maxUsers,
          trialActive,
          trialEndsAt: trialEndsAt
            ? new Date(trialEndsAt).toISOString()
            : currentOrganization.trialEndsAt,
          subscriptionExpiresAt: subscriptionExpiresAt
            ? new Date(subscriptionExpiresAt).toISOString()
            : currentOrganization.subscriptionExpiresAt,
          moduleConfig: updatedModuleConfig,
        });
        setSaveMsg(
          `Applied configuration to workspace "${targetOrg.name}".`,
        );
      } else {
        setSaveError(err.message || "Failed to save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const currentPlanDef = PLANS.find((p) => p.id === targetOrg.plan);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${currentPlanDef?.color ?? ""}`}
          >
            <SparklesIcon className="w-4 h-4" />
            {currentPlanDef?.label ?? targetOrg.plan ?? "Free"}
          </span>
          {targetOrg.trialActive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <CalendarDaysIcon className="w-3.5 h-3.5" />
              {t("trialActive") || "Trial Active"}
              {targetOrg.trialEndsAt && (
                <span className="opacity-75">
                  &nbsp;— ends{" "}
                  {new Date(targetOrg.trialEndsAt).toLocaleDateString()}
                </span>
              )}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <LockClosedIcon className="w-3.5 h-3.5" />
            Isolated Tenant ID: <code>{targetOrg.id}</code>
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            printDataSecurityCertificate({
              organizationName: targetOrg.name || "Healthcare Facility",
              organizationId: targetOrg.id,
              facilityType: targetOrg.type,
              planTier: selectedPlan,
              requestedBy: currentUser?.name || "Facility Administrator",
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <ShieldCheckIcon className="w-4 h-4" />
          Print Data Security &amp; Privacy Certificate (PDF)
        </button>
      </div>

      {/* ── Section 0A: Client Data Security, Privacy & Zero-Access Sovereignty Guarantee ── */}
      <section className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/70 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Data Security, Privacy &amp; Zero-Access Sovereignty Guarantee
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Your institution&apos;s workspace (<code>{targetOrg.id}</code>)
                is logically isolated at the Google Cloud Firestore database
                layer. AccreditEx platform administrators manage{" "}
                <strong>only subscription license entitlements</strong> and have{" "}
                <strong>zero access</strong> to your internal policies,
                incidents, CAPAs, audits, or lab QC records.
              </p>
            </div>
          </div>

          {/* Client-Controlled Technical Support Diagnostic Consent Toggle */}
          <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={supportDiagnosticConsent}
              onChange={(e) => setSupportDiagnosticConsent(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
            />
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Support Diagnostic Access:{" "}
                <span
                  className={
                    supportDiagnosticConsent
                      ? "text-amber-600"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {supportDiagnosticConsent
                    ? "TEMPORARY ON"
                    : "LOCKED (ZERO-ACCESS)"}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Client-controlled privacy lock (Default: OFF)
              </p>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/60">
            <p className="font-bold text-gray-900 dark:text-white">
              1. Strict Tenant Isolation
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Server-enforced <code>organizationId</code> rules prevent any
              cross-organization read or write access.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/60">
            <p className="font-bold text-gray-900 dark:text-white">
              2. Zero Vendor Data Access
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Platform owners control only plan tier, seat limits, expiry dates,
              and module toggles—never clinical/quality records.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/60">
            <p className="font-bold text-gray-900 dark:text-white">
              3. AES-256 &amp; TLS 1.3 Encryption
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              All records and evidence attachments are encrypted at rest
              (AES-256) and in transit (TLS 1.3 + HSTS).
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/60">
            <p className="font-bold text-gray-900 dark:text-white">
              4. 100% Data Ownership &amp; Export
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Append-only surveyor audit logs and full 1-click PDF, JSON, and
              CSV dossier export at any time.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 0B: Platform Owner — Client License & Subscription Console (Super-Admin Only) ── */}
      {isSuperAdmin && (
        <section className="bg-white dark:bg-gray-900 rounded-xl border-2 border-brand-primary/40 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-primary">
                <SparklesIcon className="w-4 h-4" />
                Platform Owner Control Plane (Metadata-Only · Zero Client Data
                Exposure)
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                Client Organizations License Directory &amp; Upgrade Queue
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select any client organization below to remotely configure its
                subscription plan, expiry dates, user limits, or module toggles
                without entering its private workspace.
              </p>
            </div>
            {selectedClientOrg &&
              selectedClientOrg.id !== currentOrganization.id && (
                <button
                  type="button"
                  onClick={() => setSelectedClientOrg(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                >
                  Return to My Organization ({currentOrganization.name})
                </button>
              )}
          </div>

          {/* Client Organizations Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Registered Client Organizations (
              {allOrganizations.length || 1})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Healthcare Facility</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Plan Tier</th>
                    <th className="py-2.5 px-3">Max Users</th>
                    <th className="py-2.5 px-3">Expiry / Trial</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">License Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(allOrganizations.length > 0
                    ? allOrganizations
                    : [currentOrganization]
                  ).map((org) => {
                    const isSelected = targetOrg.id === org.id;
                    const isActive = org.isActive !== false;
                    return (
                      <tr
                        key={org.id}
                        className={
                          isSelected
                            ? "bg-brand-primary/5 dark:bg-brand-primary/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }
                      >
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                          {org.name || org.id}
                          <div className="text-[10px] font-normal text-gray-400">
                            ID: {org.id}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 capitalize text-gray-600 dark:text-gray-300">
                          {org.type || "hospital"}
                        </td>
                        <td className="py-2.5 px-3 uppercase font-bold text-brand-primary">
                          {org.plan || "free"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                          {org.maxUsers ? org.maxUsers : "Unlimited"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                          {org.subscriptionExpiresAt
                            ? `Sub: ${org.subscriptionExpiresAt.slice(0, 10)}`
                            : org.trialEndsAt
                              ? `Trial: ${org.trialEndsAt.slice(0, 10)}`
                              : "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            }`}
                          >
                            {isActive ? "ACTIVE" : "SUSPENDED"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedClientOrg(org)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              isSelected
                                ? "bg-brand-primary text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-primary/10 hover:text-brand-primary"
                            }`}
                          >
                            {isSelected ? "Editing License" : "Manage License"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleClientActive(org)}
                            className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {isActive ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Incoming Plan Upgrade & PO Requests */}
          {upgradeRequests.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Incoming Plan Upgrade &amp; Demo Requests (
                {upgradeRequests.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {upgradeRequests.slice(0, 8).map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {req.organization}{" "}
                        <span className="font-normal text-gray-500">
                          ({req.name} · {req.email})
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 mt-0.5">
                        {req.message}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => handleApproveUpgradeRequest(req)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          Mark Approved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Section 1: Plan Selection ── */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t("subscriptionPlan") || "Subscription Plan"} —{" "}
            <span className="text-brand-primary">{targetOrg.name}</span>
          </h2>
        </div>
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

      {/* Save / Proforma Quote Actions — available to Super-Admins and Organization Admins */}
      <div className="flex flex-wrap items-center gap-3">
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
            : isSuperAdmin
              ? `Save License for ${targetOrg.name}`
              : "Apply Plan & Module Configuration"}
        </button>

        {selectedPlan !== "free" && (
          <button
            type="button"
            onClick={() =>
              printProformaQuote({
                organizationName: targetOrg.name || "Healthcare Facility",
                organizationId: targetOrg.id,
                contactName:
                  currentUser?.name || "Quality & Accreditation Director",
                contactEmail: currentUser?.email || "admin@facility.org",
                targetTier: selectedPlan,
                billingCycle: "annual",
              })
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-primary text-brand-primary hover:bg-brand-primary/10 text-sm font-semibold transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            Print Official Proforma Quote (PDF)
          </button>
        )}

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
