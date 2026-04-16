/**
 * PlatformAdminPage — AccrediTex
 *
 * Platform-level super-admin dashboard.
 * Only visible to users with the Firebase custom claim `isSuperAdmin: true`.
 *
 * Features:
 *  - List all organizations across the platform
 *  - Change plan (Free / Starter / Professional / Enterprise)
 *  - Suspend / Activate an organization
 *  - Extend trial period
 *
 * All writes go through organizationService.ts which enforces
 * the isSuperAdmin guard both client-side (UX) and server-side
 * (Firestore security rules).
 *
 * Arabic: fully translated — all strings use i18n keys from settings namespace.
 */

import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  checkIsSuperAdmin,
  listAllOrganizations,
  setOrganizationActive,
  setOrganizationPlan,
  setOrganizationTrial,
} from "@/services/organizationService";
import { Organization } from "@/types";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";

const PLAN_OPTIONS = ["free", "starter", "professional", "enterprise"] as const;
type Plan = (typeof PLAN_OPTIONS)[number];

const PlatformAdminPage: React.FC = () => {
  const { t } = useTranslation();

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filtered, setFiltered] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Modal state for plan change
  const [planModal, setPlanModal] = useState<{
    org: Organization;
    plan: Plan;
    maxUsers: number;
  } | null>(null);

  // Modal state for trial extension
  const [trialModal, setTrialModal] = useState<{
    org: Organization;
    days: number;
  } | null>(null);

  // ─── Auth check ────────────────────────────────────────────
  useEffect(() => {
    checkIsSuperAdmin()
      .then((result) => {
        setIsSuperAdmin(result);
        if (!result) setLoading(false);
      })
      .catch(() => {
        setIsSuperAdmin(false);
        setLoading(false);
      });
  }, []);

  // ─── Load organizations ─────────────────────────────────────
  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const orgs = await listAllOrganizations();
      setOrganizations(orgs);
      setFiltered(orgs);
    } catch {
      showToast("Failed to load organizations", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) loadOrgs();
  }, [isSuperAdmin, loadOrgs]);

  // ─── Search filter ──────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? organizations.filter((o) => o.name.toLowerCase().includes(q))
        : organizations,
    );
  }, [search, organizations]);

  // ─── Toast helper ───────────────────────────────────────────
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Actions ─────────────────────────────────────────────────
  const handleToggleActive = async (org: Organization) => {
    const confirmMsg = !org.isActive
      ? undefined
      : t("confirmSuspend") ||
        "Suspend this organization? All users will lose access.";
    if (
      confirmMsg &&
      !(await useConfirmStore
        .getState()
        .confirm(
          confirmMsg,
          t("confirmAction") || "Confirm Action",
          t("confirm") || "Confirm",
        ))
    )
      return;

    try {
      await setOrganizationActive(org.id, !org.isActive);
      showToast(org.isActive ? t("orgSuspended") : t("orgActivated"));
      await loadOrgs();
    } catch {
      showToast("Failed to update organization", "error");
    }
  };

  const handlePlanSave = async () => {
    if (!planModal) return;
    try {
      await setOrganizationPlan(
        planModal.org.id,
        planModal.plan,
        planModal.maxUsers,
      );
      showToast(t("planUpdated") || "Plan updated.");
      setPlanModal(null);
      await loadOrgs();
    } catch {
      showToast("Failed to update plan", "error");
    }
  };

  const handleTrialSave = async () => {
    if (!trialModal) return;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialModal.days);
    try {
      await setOrganizationTrial(trialModal.org.id, true, trialEndsAt);
      showToast(t("trialExtended") || "Trial extended.");
      setTrialModal(null);
      await loadOrgs();
    } catch {
      showToast("Failed to extend trial", "error");
    }
  };

  // ─── Access denied ──────────────────────────────────────────
  if (isSuperAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <ShieldCheckIcon className="w-16 h-16 text-amber-500" />
        <h2 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("superAdminOnly") ||
            "This page is accessible only to AccrediTex platform super-admins."}
        </h2>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────
  if (isSuperAdmin === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
        <span className="ml-3 text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("loadingOrgs") || "Loading organizations..."}
        </span>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-5 h-5 shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <BuildingOffice2Icon className="w-7 h-7 text-brand-primary" />
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("platformAdmin") || "Platform Administration"}
          </h1>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("platformAdminDesc") ||
              "Manage all organizations, plans, and subscriptions."}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t("searchOrganizations") || "Search organizations..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-brand-text-secondary dark:text-dark-brand-text-secondary text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-start font-semibold">
                {t("orgName") || "Organization"}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t("orgType") || "Type"}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t("orgPlan") || "Plan"}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t("orgUsers") || "Users"}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t("orgStatus") || "Status"}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t("orgActions") || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary"
                >
                  {t("noOrganizations") || "No organizations found."}
                </td>
              </tr>
            ) : (
              filtered.map((org, i) => (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {org.name}
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary capitalize">
                    {org.type}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary capitalize">
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    — / {org.maxUsers ?? "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        org.isActive !== false
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {org.isActive !== false ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Suspend / Activate */}
                      <button
                        onClick={() => handleToggleActive(org)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          org.isActive !== false
                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                        }`}
                      >
                        {org.isActive !== false
                          ? t("suspendOrg") || "Suspend"
                          : t("activateOrg") || "Activate"}
                      </button>

                      {/* Change Plan */}
                      <button
                        onClick={() =>
                          setPlanModal({
                            org,
                            plan: (org.plan as Plan) ?? "free",
                            maxUsers: org.maxUsers ?? 10,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
                      >
                        {t("editPlan") || "Edit Plan"}
                      </button>

                      {/* Extend Trial */}
                      <button
                        onClick={() => setTrialModal({ org, days: 14 })}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 transition-colors"
                      >
                        {t("extendTrial") || "Extend Trial"}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Plan Change Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
          >
            <h3 className="font-bold text-lg text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("changePlan") || "Change Plan"} — {planModal.org.name}
            </h3>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                {t("subscriptionPlan") || "Plan"}
              </label>
              <select
                value={planModal.plan}
                onChange={(e) =>
                  setPlanModal({ ...planModal, plan: e.target.value as Plan })
                }
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                {t("maxUsers") || "Max Users"}
              </label>
              <input
                type="number"
                min={1}
                value={planModal.maxUsers}
                onChange={(e) =>
                  setPlanModal({
                    ...planModal,
                    maxUsers: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPlanModal(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handlePlanSave}
                className="flex-1 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
              >
                {t("save") || "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Extend Trial Modal */}
      {trialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
          >
            <h3 className="font-bold text-lg text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("extendTrial") || "Extend Trial"} — {trialModal.org.name}
            </h3>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                {t("trialDays") || "Trial Days"}
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={trialModal.days}
                onChange={(e) =>
                  setTrialModal({
                    ...trialModal,
                    days: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              <p className="mt-1 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Trial will be active for {trialModal.days} more days from today.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTrialModal(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleTrialSave}
                className="flex-1 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
              >
                {t("save") || "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminPage;
