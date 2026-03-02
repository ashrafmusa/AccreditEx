import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { User, UserLicense, UserRole } from "@/types";
import { Button, EmptyState } from "@/components/ui";
import { DocumentTextIcon, PlusIcon } from "@/components/icons";

type LicenseStatus = UserLicense["status"];

const STATUS_CONFIG: Record<
  LicenseStatus,
  { labelKey: string; color: string; bg: string }
> = {
  active: {
    labelKey: "statusActive",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  pending_renewal: {
    labelKey: "statusPendingRenewal",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  expired: {
    labelKey: "statusExpired",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  suspended: {
    labelKey: "statusSuspended",
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
  },
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  professional: "catProfessional",
  facility: "catFacility",
  regulatory: "catRegulatory",
  specialty: "catSpecialty",
};

function computeStatus(license: UserLicense): LicenseStatus {
  if (license.status === "suspended") return "suspended";
  const now = new Date();
  const expiry = new Date(license.expiryDate);
  if (expiry < now) return "expired";
  const reminderDays = license.renewalReminderDays ?? 60;
  const threshold = new Date(
    now.getTime() + reminderDays * 24 * 60 * 60 * 1000,
  );
  if (expiry < threshold) return "pending_renewal";
  return "active";
}

interface LicenseFormData {
  name: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  category: UserLicense["category"];
  notes: string;
}

const EMPTY_FORM: LicenseFormData = {
  name: "",
  licenseNumber: "",
  issuingAuthority: "",
  issueDate: "",
  expiryDate: "",
  category: "professional",
  notes: "",
};

const LicensureTrackingTab: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, users, updateUser } = useUserStore();
  const isAdmin = currentUser?.role === UserRole.Admin;

  const [filterStatus, setFilterStatus] = useState<"all" | LicenseStatus>(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState<UserLicense | null>(
    null,
  );
  const [targetUserId, setTargetUserId] = useState<string>(
    currentUser?.id ?? "",
  );
  const [form, setForm] = useState<LicenseFormData>(EMPTY_FORM);

  // Collect all licenses across users (admin) or just current user
  const allLicenseRows = useMemo(() => {
    const source = isAdmin
      ? users
      : users.filter((u) => u.id === currentUser?.id);
    const rows: {
      user: User;
      license: UserLicense;
      computed: LicenseStatus;
    }[] = [];
    source.forEach((user) => {
      user.licenses?.forEach((lic) => {
        const computed = computeStatus(lic);
        rows.push({ user, license: lic, computed });
      });
    });
    // Sort: expired first, then pending, then active
    const order: Record<LicenseStatus, number> = {
      expired: 0,
      pending_renewal: 1,
      active: 2,
      suspended: 3,
    };
    rows.sort((a, b) => order[a.computed] - order[b.computed]);
    return rows;
  }, [users, currentUser, isAdmin]);

  const filteredRows = useMemo(() => {
    if (filterStatus === "all") return allLicenseRows;
    return allLicenseRows.filter((r) => r.computed === filterStatus);
  }, [allLicenseRows, filterStatus]);

  // Summary counts
  const counts = useMemo(() => {
    const c = { active: 0, pending_renewal: 0, expired: 0, suspended: 0 };
    allLicenseRows.forEach((r) => c[r.computed]++);
    return c;
  }, [allLicenseRows]);

  const openAdd = useCallback(() => {
    setEditingLicense(null);
    setForm(EMPTY_FORM);
    setTargetUserId(currentUser?.id ?? "");
    setShowForm(true);
  }, [currentUser]);

  const openEdit = useCallback((user: User, lic: UserLicense) => {
    setEditingLicense(lic);
    setTargetUserId(user.id);
    setForm({
      name: lic.name,
      licenseNumber: lic.licenseNumber,
      issuingAuthority: lic.issuingAuthority,
      issueDate: lic.issueDate,
      expiryDate: lic.expiryDate,
      category: lic.category ?? "professional",
      notes: lic.notes ?? "",
    });
    setShowForm(true);
  }, []);

  const handleSave = async () => {
    const user = users.find((u) => u.id === targetUserId);
    if (!user) return;

    const licenses = [...(user.licenses ?? [])];
    if (editingLicense) {
      const idx = licenses.findIndex((l) => l.id === editingLicense.id);
      if (idx >= 0) {
        licenses[idx] = {
          ...licenses[idx],
          ...form,
          status: computeStatus({ ...licenses[idx], ...form } as UserLicense),
        };
      }
    } else {
      const newLic: UserLicense = {
        id: `lic-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        ...form,
        status: "active",
        category: form.category ?? "professional",
      };
      newLic.status = computeStatus(newLic);
      licenses.push(newLic);
    }

    await updateUser({ ...user, licenses });
    setShowForm(false);
  };

  const handleDelete = async (user: User, licId: string) => {
    const licenses = (user.licenses ?? []).filter((l) => l.id !== licId);
    await updateUser({ ...user, licenses });
  };

  const inputCls =
    "w-full border border-brand-border dark:border-dark-brand-border rounded-lg py-2 px-3 text-sm bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary focus:ring-brand-primary-500 focus:border-brand-primary-500";

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("licensesAndCredentials")}
        </h3>
        <Button
          onClick={openAdd}
          variant="primary"
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" />
          {t("addLicense")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.entries(counts) as [LicenseStatus, number][]).map(
          ([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() =>
                  setFilterStatus(filterStatus === status ? "all" : status)
                }
                className={`${cfg.bg} rounded-lg p-3 text-center transition-all ${filterStatus === status ? "ring-2 ring-brand-primary-500" : ""}`}
              >
                <div className={`text-xl font-bold ${cfg.color}`}>{count}</div>
                <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t(cfg.labelKey)}
                </div>
              </button>
            );
          },
        )}
      </div>

      {/* Form Modal-ish */}
      {showForm && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {editingLicense ? t("editLicense") : t("addNewLicense")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isAdmin && !editingLicense && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("staffMember")}
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className={inputCls}
                >
                  {users
                    .filter((u) => u.isActive !== false)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.jobTitle || u.role}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("licenseName")} *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. RN License"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("licenseNumber")} *
              </label>
              <input
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, licenseNumber: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. RN-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("issuingAuthority")} *
              </label>
              <input
                value={form.issuingAuthority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issuingAuthority: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. State Board of Nursing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("categoryLabel")}
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as UserLicense["category"],
                  }))
                }
                className={inputCls}
              >
                {Object.entries(CATEGORY_LABEL_KEYS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {t(v)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("issueDate")} *
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issueDate: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("expiryDate")} *
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiryDate: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("notesLabel")}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className={inputCls}
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                !form.name ||
                !form.licenseNumber ||
                !form.issuingAuthority ||
                !form.issueDate ||
                !form.expiryDate
              }
            >
              {editingLicense ? t("updateBtn") : t("save")}
            </Button>
          </div>
        </div>
      )}

      {/* License Table */}
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12" />}
          title={t("noLicensesFound")}
          description={
            filterStatus !== "all"
              ? t("noLicensesFilterHint")
              : t("noLicensesAddHint")
          }
        />
      ) : (
        <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {isAdmin && (
                  <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("licStaff")}
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("licLicense")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("licNumber")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("licAuthority")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("categoryLabel")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("licExpiry")}
                </th>
                <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("licStatus")}
                </th>
                <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
              {filteredRows.map(({ user, license, computed }) => {
                const cfg = STATUS_CONFIG[computed];
                return (
                  <tr
                    key={`${user.id}-${license.id}`}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap text-brand-text-primary dark:text-dark-brand-text-primary font-medium">
                        {user.name}
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap text-brand-text-primary dark:text-dark-brand-text-primary font-medium">
                      {license.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {license.licenseNumber}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {license.issuingAuthority}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {license.category
                        ? t(CATEGORY_LABEL_KEYS[license.category]) ||
                          license.category
                        : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {license.expiryDate}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}
                      >
                        {t(cfg.labelKey)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <button
                        onClick={() => openEdit(user, license)}
                        className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                      >
                        {t("edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(user, license.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs"
                      >
                        {t("delete")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LicensureTrackingTab;
