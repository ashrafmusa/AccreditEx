import React, { useMemo, useState, useCallback } from "react";
import { useUserStore } from "@/stores/useUserStore";
import {
  User,
  PersonnelDocument,
  PersonnelDocCategory,
  PERSONNEL_DOC_LABELS,
  UserRole,
} from "@/types";
import { useAppStore } from "@/stores/useAppStore";
import { Button, EmptyState } from "@/components/ui";
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
} from "@/components/icons";

/** Default set of required documents per employee */
const DEFAULT_REQUIRED_DOCS: PersonnelDocCategory[] = [
  "national_id",
  "medical_clearance",
  "background_check",
  "resume_cv",
  "educational_certificate",
  "employment_contract",
  "job_description",
  "emergency_contact",
  "orientation_checklist",
  "confidentiality_agreement",
];

const STATUS_CONFIG: Record<
  PersonnelDocument["status"],
  { label: string; color: string; bg: string }
> = {
  missing: {
    label: "Missing",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  uploaded: {
    label: "Uploaded",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  verified: {
    label: "Verified",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  expired: {
    label: "Expired",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
};

function getDocStatus(doc?: PersonnelDocument): PersonnelDocument["status"] {
  if (!doc) return "missing";
  if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) return "expired";
  return doc.status;
}

function computeCompleteness(user: User): {
  pct: number;
  done: number;
  total: number;
} {
  const total = DEFAULT_REQUIRED_DOCS.length;
  let done = 0;
  for (const cat of DEFAULT_REQUIRED_DOCS) {
    const doc = user.personnelDocuments?.find((d) => d.category === cat);
    const status = getDocStatus(doc);
    if (status === "uploaded" || status === "verified") done++;
  }
  return { pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
}

type ViewMode = "overview" | "detail";

const PersonnelFilesTab: React.FC = () => {
  const { currentUser, users, updateUser } = useUserStore();
  const { departments } = useAppStore();
  const isAdmin = currentUser?.role === UserRole.Admin;
  const [viewMode, setViewMode] = useState<ViewMode>(
    isAdmin ? "overview" : "detail",
  );
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id ?? "",
  );
  const [deptFilter, setDeptFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    let list = users.filter((u) => u.isActive !== false);
    if (deptFilter !== "all")
      list = list.filter((u) => u.departmentId === deptFilter);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, deptFilter]);

  const overviewStats = useMemo(() => {
    let totalDone = 0,
      totalRequired = 0,
      usersComplete = 0;
    filteredUsers.forEach((u) => {
      const { done, total, pct } = computeCompleteness(u);
      totalDone += done;
      totalRequired += total;
      if (pct === 100) usersComplete++;
    });
    return {
      avgPct:
        totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0,
      usersComplete,
      totalUsers: filteredUsers.length,
      totalMissing: totalRequired - totalDone,
    };
  }, [filteredUsers]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleUploadDoc = useCallback(
    async (userId: string, category: PersonnelDocCategory) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const docs = [...(user.personnelDocuments ?? [])];
      const idx = docs.findIndex((d) => d.category === category);
      const newDoc: PersonnelDocument = {
        id: `pd-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        category,
        name: PERSONNEL_DOC_LABELS[category],
        status: "uploaded",
        uploadedAt: new Date().toISOString(),
      };
      if (idx >= 0)
        docs[idx] = {
          ...docs[idx],
          status: "uploaded",
          uploadedAt: new Date().toISOString(),
        };
      else docs.push(newDoc);
      await updateUser({ ...user, personnelDocuments: docs });
    },
    [users, updateUser],
  );

  const handleVerifyDoc = useCallback(
    async (userId: string, category: PersonnelDocCategory) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const docs = (user.personnelDocuments ?? []).map((d) =>
        d.category === category
          ? {
              ...d,
              status: "verified" as const,
              verifiedBy: currentUser?.name,
              verifiedAt: new Date().toISOString(),
            }
          : d,
      );
      await updateUser({ ...user, personnelDocuments: docs });
    },
    [users, updateUser, currentUser],
  );

  const inputCls =
    "text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary";

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          Personnel Files
        </h3>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.en}
                  </option>
                ))}
              </select>
              <Button
                variant={viewMode === "overview" ? "primary" : "ghost"}
                onClick={() => setViewMode("overview")}
                className="text-xs"
              >
                Overview
              </Button>
            </>
          )}
          <Button
            variant={viewMode === "detail" ? "primary" : "ghost"}
            onClick={() => setViewMode("detail")}
            className="text-xs"
          >
            My Files
          </Button>
        </div>
      </div>

      {/* Summary Cards (Admin) */}
      {isAdmin && viewMode === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">
              {overviewStats.avgPct}%
            </div>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Avg File Completeness
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {overviewStats.usersComplete}
            </div>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Fully Compliant
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overviewStats.totalMissing}
            </div>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Missing Documents
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {overviewStats.totalUsers}
            </div>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Total Staff
            </div>
          </div>
        </div>
      )}

      {/* Overview Table */}
      {isAdmin && viewMode === "overview" && (
        <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Staff
                </th>
                <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Department
                </th>
                <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Completeness
                </th>
                <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Missing
                </th>
                <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
              {filteredUsers.map((user) => {
                const { pct, done, total } = computeCompleteness(user);
                const pctColor =
                  pct === 100
                    ? "text-green-600"
                    : pct >= 70
                      ? "text-yellow-600"
                      : "text-red-600";
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                      {user.name}
                      {user.jobTitle && (
                        <span className="ml-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {user.jobTitle}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {user.department || "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${pctColor}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {total - done}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setViewMode("detail");
                        }}
                        className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                      >
                        View Files
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail View — Per-User Checklist */}
      {viewMode === "detail" && (
        <div className="space-y-3">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Staff:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className={inputCls}
              >
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                onClick={() => setViewMode("overview")}
                className="text-xs ml-auto"
              >
                ← Back to Overview
              </Button>
            </div>
          )}

          {selectedUser && (
            <>
              {/* Completeness bar */}
              {(() => {
                const { pct, done, total } = computeCompleteness(selectedUser);
                return (
                  <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-4 flex items-center gap-4">
                    <div className="grow">
                      <div className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                        {selectedUser.name} — File Completeness
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">
                      {done}/{total}
                    </div>
                  </div>
                );
              })()}

              {/* Required Documents Checklist */}
              <div className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50 border border-brand-border dark:border-dark-brand-border rounded-lg">
                {DEFAULT_REQUIRED_DOCS.map((cat) => {
                  const doc = selectedUser.personnelDocuments?.find(
                    (d) => d.category === cat,
                  );
                  const status = getDocStatus(doc);
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <div
                        className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs ${status === "verified" ? "bg-green-500 text-white" : status === "uploaded" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400"}`}
                      >
                        {status === "verified" || status === "uploaded"
                          ? "✓"
                          : ""}
                      </div>
                      <div className="grow">
                        <div className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                          {PERSONNEL_DOC_LABELS[cat]}
                        </div>
                        {doc?.uploadedAt && (
                          <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                            Uploaded: {doc.uploadedAt.split("T")[0]}
                            {doc.verifiedBy &&
                              ` · Verified by ${doc.verifiedBy}`}
                          </div>
                        )}
                        {doc?.expiryDate && (
                          <div
                            className={`text-xs ${status === "expired" ? "text-red-600 dark:text-red-400" : "text-brand-text-secondary dark:text-dark-brand-text-secondary"}`}
                          >
                            Expires: {doc.expiryDate}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}
                      >
                        {cfg.label}
                      </span>
                      <div className="flex gap-1">
                        {status === "missing" && (
                          <button
                            onClick={() =>
                              handleUploadDoc(selectedUser.id, cat)
                            }
                            className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                          >
                            Upload
                          </button>
                        )}
                        {status === "uploaded" && isAdmin && (
                          <button
                            onClick={() =>
                              handleVerifyDoc(selectedUser.id, cat)
                            }
                            className="text-green-600 dark:text-green-400 hover:underline text-xs"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonnelFilesTab;
