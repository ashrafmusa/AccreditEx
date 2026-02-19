import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { User, UserLicense, UserRole } from "@/types";
import { Button, EmptyState } from "@/components/ui";
import { DocumentTextIcon, PlusIcon } from "@/components/icons";

type LicenseStatus = UserLicense["status"];

const STATUS_CONFIG: Record<
  LicenseStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: "Active",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  pending_renewal: {
    label: "Pending Renewal",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  expired: {
    label: "Expired",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  suspended: {
    label: "Suspended",
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  professional: "Professional",
  facility: "Facility",
  regulatory: "Regulatory",
  specialty: "Specialty",
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
          Licenses & Credentials
        </h3>
        <Button
          onClick={openAdd}
          variant="primary"
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" />
          Add License
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
                  {cfg.label}
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
            {editingLicense ? "Edit License" : "Add New License"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isAdmin && !editingLicense && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Staff Member
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
                License Name *
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
                License Number *
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
                Issuing Authority *
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
                Category
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
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Issue Date *
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
                Expiry Date *
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
                Notes
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
              Cancel
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
              {editingLicense ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* License Table */}
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12" />}
          title="No Licenses Found"
          description={
            filterStatus !== "all"
              ? "Try changing the filter above."
              : 'Click "Add License" to start tracking credentials.'
          }
        />
      ) : (
        <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {isAdmin && (
                  <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Staff
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  License
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Number
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Authority
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Category
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Expiry
                </th>
                <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Status
                </th>
                <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Actions
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
                        ? CATEGORY_LABELS[license.category] || license.category
                        : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {license.expiryDate}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <button
                        onClick={() => openEdit(user, license)}
                        className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user, license.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs"
                      >
                        Delete
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
