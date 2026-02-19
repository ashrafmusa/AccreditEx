import React, { useMemo, useState, useCallback } from "react";
import { useUserStore } from "@/stores/useUserStore";
import {
  CECredit,
  CECreditCategory,
  CERequirement,
  CE_CATEGORY_LABELS,
  UserRole,
} from "@/types";
import { Button, EmptyState } from "@/components/ui";
import { PlusIcon, CheckCircleIcon } from "@/components/icons";

/** Default requirements — can be extended via admin settings later */
const DEFAULT_REQUIREMENTS: CERequirement[] = [
  {
    id: "req-cme",
    role: UserRole.Admin,
    category: "CME",
    requiredCredits: 50,
    cyclePeriodMonths: 24,
    description: "Medical staff biennial CME",
  },
  {
    id: "req-cne",
    role: UserRole.Admin,
    category: "CNE",
    requiredCredits: 30,
    cyclePeriodMonths: 24,
    description: "Nursing staff biennial CNE",
  },
  {
    id: "req-ceu",
    role: UserRole.Admin,
    category: "CEU",
    requiredCredits: 20,
    cyclePeriodMonths: 12,
    description: "Allied health annual CEU",
  },
];

const EMPTY_FORM: Omit<CECredit, "id"> = {
  userId: "",
  title: "",
  provider: "",
  category: "CME",
  credits: 0,
  completionDate: "",
};

type TabView = "overview" | "credits" | "form";

const CECreditsTab: React.FC = () => {
  const { currentUser, users } = useUserStore();
  const isAdmin = currentUser?.role === UserRole.Admin;

  const [view, setView] = useState<TabView>("overview");
  const [credits, setCredits] = useState<CECredit[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  const activeUsers = users.filter((u) => u.isActive !== false);

  // Enriched credits
  const enrichedCredits = useMemo(
    () =>
      credits.map((c) => ({
        ...c,
        userName: users.find((u) => u.id === c.userId)?.name ?? "Unknown",
        isExpired: c.expiryDate ? new Date(c.expiryDate) < new Date() : false,
      })),
    [credits, users],
  );

  const filteredCredits = useMemo(() => {
    let list = enrichedCredits;
    if (filterCategory !== "all")
      list = list.filter((c) => c.category === filterCategory);
    if (filterUser !== "all")
      list = list.filter((c) => c.userId === filterUser);
    else if (!isAdmin) list = list.filter((c) => c.userId === currentUser?.id);
    return list.sort((a, b) =>
      b.completionDate.localeCompare(a.completionDate),
    );
  }, [enrichedCredits, filterCategory, filterUser, isAdmin, currentUser]);

  // Per-user credit totals by category (last 24 months)
  const userSummaries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const map = new Map<
      string,
      {
        userId: string;
        name: string;
        totals: Record<string, number>;
        total: number;
      }
    >();
    for (const c of credits) {
      if (new Date(c.completionDate) < cutoff) continue;
      if (!map.has(c.userId)) {
        map.set(c.userId, {
          userId: c.userId,
          name: users.find((u) => u.id === c.userId)?.name ?? "Unknown",
          totals: {},
          total: 0,
        });
      }
      const entry = map.get(c.userId)!;
      entry.totals[c.category] = (entry.totals[c.category] ?? 0) + c.credits;
      entry.total += c.credits;
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [credits, users]);

  // Global stats
  const stats = useMemo(() => {
    const totalCredits = credits.reduce((s, c) => s + c.credits, 0);
    const uniqueUsers = new Set(credits.map((c) => c.userId)).size;
    const verified = credits.filter((c) => c.verifiedBy).length;
    const expired = enrichedCredits.filter((c) => c.isExpired).length;
    return { totalCredits, uniqueUsers, verified, expired };
  }, [credits, enrichedCredits]);

  const handleSave = useCallback(() => {
    if (
      !form.userId ||
      !form.title ||
      !form.completionDate ||
      form.credits <= 0
    )
      return;
    if (editingId) {
      setCredits((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)),
      );
    } else {
      const newC: CECredit = {
        ...form,
        id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      };
      setCredits((prev) => [...prev, newC]);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setView("credits");
  }, [form, editingId]);

  const handleEdit = useCallback((c: CECredit) => {
    setForm(c);
    setEditingId(c.id);
    setView("form");
  }, []);

  const handleVerify = useCallback(
    (id: string) => {
      setCredits((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                verifiedBy: currentUser?.name,
                verifiedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
    },
    [currentUser],
  );

  const handleDelete = useCallback((id: string) => {
    setCredits((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const inputCls =
    "text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary w-full";

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            CE Credit Management
          </h3>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Track continuing education credits, verify certificates, and monitor
            compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "overview" ? "primary" : "ghost"}
            onClick={() => setView("overview")}
            className="text-xs"
          >
            Overview
          </Button>
          <Button
            variant={view === "credits" ? "primary" : "ghost"}
            onClick={() => setView("credits")}
            className="text-xs"
          >
            Credits
          </Button>
          <Button
            variant={view === "form" ? "primary" : "ghost"}
            onClick={() => {
              setForm({ ...EMPTY_FORM, userId: currentUser?.id ?? "" });
              setEditingId(null);
              setView("form");
            }}
            className="text-xs flex items-center gap-1"
          >
            <PlusIcon className="h-3 w-3" /> Log Credit
          </Button>
        </div>
      </div>

      {/* ── Overview ── */}
      {view === "overview" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">
                {stats.totalCredits}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Total Credits Logged
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.verified}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Verified
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.uniqueUsers}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Staff with Credits
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.expired}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Expired Credits
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              Credits by Category
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                Object.entries(CE_CATEGORY_LABELS) as [
                  CECreditCategory,
                  string,
                ][]
              ).map(([cat, label]) => {
                const catCredits = credits.filter((c) => c.category === cat);
                const total = catCredits.reduce((s, c) => s + c.credits, 0);
                return (
                  <div
                    key={cat}
                    className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-3"
                  >
                    <div className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {label}
                    </div>
                    <div className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {total}
                    </div>
                    <div className="text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {catCredits.length} entries
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-User Summary */}
          {isAdmin && userSummaries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                Staff Credit Summary (24 months)
              </h4>
              <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        Staff
                      </th>
                      {(
                        Object.entries(CE_CATEGORY_LABELS) as [
                          CECreditCategory,
                          string,
                        ][]
                      ).map(([cat, label]) => (
                        <th
                          key={cat}
                          className="px-2 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary text-xs"
                        >
                          {cat}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
                    {userSummaries.map((s) => (
                      <tr
                        key={s.userId}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                          {s.name}
                        </td>
                        {(
                          Object.keys(CE_CATEGORY_LABELS) as CECreditCategory[]
                        ).map((cat) => (
                          <td
                            key={cat}
                            className="px-2 py-2 text-center text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary"
                          >
                            {s.totals[cat] ?? 0}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                          {s.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Credits List ── */}
      {view === "credits" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`${inputCls} w-auto`}
            >
              <option value="all">All Categories</option>
              {Object.entries(CE_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className={`${inputCls} w-auto`}
              >
                <option value="all">All Staff</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredCredits.length === 0 ? (
            <EmptyState
              title="No CE Credits"
              description="Log a continuing education credit to start tracking."
              icon={<CheckCircleIcon className="h-10 w-10 text-gray-400" />}
            />
          ) : (
            <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Title
                    </th>
                    {isAdmin && (
                      <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        Staff
                      </th>
                    )}
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Provider
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Category
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Credits
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Date
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Verified
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
                  {filteredCredits.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 ${c.isExpired ? "opacity-60" : ""}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                        {c.title}
                        {c.isExpired && (
                          <span className="ml-1 text-xs text-red-500">
                            (expired)
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {c.userName}
                        </td>
                      )}
                      <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {c.provider}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                        {c.credits}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {c.completionDate}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {c.verifiedBy ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            ✓ {c.verifiedBy}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        {!c.verifiedBy && isAdmin && (
                          <button
                            onClick={() => handleVerify(c.id)}
                            className="text-green-600 dark:text-green-400 hover:underline text-xs"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Log / Edit Form ── */}
      {view === "form" && (
        <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-4 space-y-4 max-w-2xl">
          <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {editingId ? "Edit CE Credit" : "Log CE Credit"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Staff Member *
              </label>
              <select
                value={form.userId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, userId: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select...</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Activity Title *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. Advanced Cardiac Life Support"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Provider *
              </label>
              <input
                value={form.provider}
                onChange={(e) =>
                  setForm((p) => ({ ...p, provider: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. AMA, ANCC"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    category: e.target.value as CECreditCategory,
                  }))
                }
                className={inputCls}
              >
                {Object.entries(CE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Credits *
              </label>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={form.credits || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, credits: +e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Completion Date *
              </label>
              <input
                type="date"
                value={form.completionDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, completionDate: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expiryDate: e.target.value || undefined,
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Accreditation #
              </label>
              <input
                value={form.accreditationNumber ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    accreditationNumber: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
              Notes
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              className={inputCls}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                !form.userId ||
                !form.title ||
                !form.completionDate ||
                form.credits <= 0
              }
            >
              {editingId ? "Update" : "Log Credit"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setView("credits");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CECreditsTab;
