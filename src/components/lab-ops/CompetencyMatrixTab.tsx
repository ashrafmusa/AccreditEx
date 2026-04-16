/**
 * Competency Matrix Tab
 * Tracks operator authorization per analyte to enforce IQC release safety gates.
 */
import React, { useMemo, useState } from "react";

import { PlusIcon, UserGroupIcon } from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type { CompetencyRecord, CompetencyStatus } from "@/types/labOps";
import { COMPETENCY_STATUS_LABELS } from "@/types/labOps";

const statusClass: Record<CompetencyStatus, string> = {
  authorized:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  expired:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  revoked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const CompetencyMatrixTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    competencyRecords,
    addCompetencyRecord,
    updateCompetencyRecord,
    removeCompetencyRecord,
  } = useLabOpsStore();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<CompetencyRecord>>({
    status: "authorized",
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return competencyRecords;
    const q = search.toLowerCase();
    return competencyRecords.filter(
      (r) =>
        r.staffName.toLowerCase().includes(q) ||
        r.analyteCode.toLowerCase().includes(q) ||
        r.analyteName.toLowerCase().includes(q) ||
        r.labSection.toLowerCase().includes(q),
    );
  }, [competencyRecords, search]);

  const today = new Date().toISOString().slice(0, 10);
  const activeAuthorizations = competencyRecords.filter(
    (r) => r.status === "authorized" && r.authorizedUntil >= today,
  ).length;
  const expiredCount = competencyRecords.filter(
    (r) => r.status !== "authorized" || r.authorizedUntil < today,
  ).length;

  const handleCreate = () => {
    if (
      !form.staffName?.trim() ||
      !form.analyteCode?.trim() ||
      !form.analyteName?.trim() ||
      !form.labSection?.trim() ||
      !form.assessor?.trim() ||
      !form.authorizedUntil ||
      !form.lastAssessedDate
    ) {
      return;
    }

    const now = new Date().toISOString();
    addCompetencyRecord({
      id: `comp-${Date.now()}`,
      staffName: form.staffName.trim(),
      staffId: form.staffId?.trim() || undefined,
      analyteCode: form.analyteCode.trim(),
      analyteName: form.analyteName.trim(),
      labSection: form.labSection.trim(),
      level: form.level,
      status: (form.status as CompetencyStatus) || "authorized",
      authorizedUntil: form.authorizedUntil,
      lastAssessedDate: form.lastAssessedDate,
      assessor: form.assessor.trim(),
      notes: form.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    setForm({ status: "authorized" });
    setShowForm(false);
  };

  const markExpired = (record: CompetencyRecord) => {
    updateCompetencyRecord({
      ...record,
      status: "expired",
      updatedAt: new Date().toISOString(),
    });
  };

  const blockGlobalShortcutsWhileTyping = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable;

    if (
      isEditable &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key.length === 1
    ) {
      event.stopPropagation();
    }
  };

  return (
    <div
      className="space-y-4"
      onKeyDownCapture={blockGlobalShortcutsWhileTyping}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("competencyMatrixTitle") || "Competency Matrix"}
          </h2>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" />
          {t("competencyAddRecord") || "Add Record"}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {competencyRecords.length}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("competencyTotalRecords") || "Total Records"}
          </p>
        </Card>
        <Card className="p-3 text-center border-green-200 dark:border-green-800">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {activeAuthorizations}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("competencyAuthorized") || "Authorized"}
          </p>
        </Card>
        <Card className="p-3 text-center border-yellow-200 dark:border-yellow-800">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {expiredCount}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("competencyExpired") || "Expired / Non-compliant"}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-brand-primary">
            {new Set(competencyRecords.map((r) => r.staffName)).size}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("competencyOperators") || "Operators"}
          </p>
        </Card>
      </div>

      <Card className="p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            t("competencySearch") ||
            "Search by operator, analyte, code, section"
          }
          className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </Card>

      {showForm && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <input
              value={form.staffName || ""}
              onChange={(e) => setForm({ ...form, staffName: e.target.value })}
              placeholder={`${t("competencyStaffName") || "Staff name"} *`}
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={form.analyteCode || ""}
              onChange={(e) =>
                setForm({ ...form, analyteCode: e.target.value.toUpperCase() })
              }
              placeholder={`${t("competencyAnalyteCode") || "Analyte code"} *`}
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={form.analyteName || ""}
              onChange={(e) =>
                setForm({ ...form, analyteName: e.target.value })
              }
              placeholder={`${t("competencyAnalyteName") || "Analyte name"} *`}
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={form.labSection || ""}
              onChange={(e) => setForm({ ...form, labSection: e.target.value })}
              placeholder={`${t("labSection") || "Lab section"} *`}
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="date"
              value={form.lastAssessedDate || ""}
              onChange={(e) =>
                setForm({ ...form, lastAssessedDate: e.target.value })
              }
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="date"
              value={form.authorizedUntil || ""}
              onChange={(e) =>
                setForm({ ...form, authorizedUntil: e.target.value })
              }
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={form.assessor || ""}
              onChange={(e) => setForm({ ...form, assessor: e.target.value })}
              placeholder={`${t("competencyAssessor") || "Assessor"} *`}
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <select
              value={form.status || "authorized"}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as CompetencyStatus })
              }
              className="w-full px-2.5 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Object.entries(COMPETENCY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              {t("create") || "Create"}
            </Button>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/40 text-left">
              <th className="px-3 py-2 font-medium">
                {t("competencyStaffName") || "Staff"}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("competencyAnalyteCode") || "Analyte"}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("labSection") || "Section"}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("competencyAssessor") || "Assessor"}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("competencyValidUntil") || "Valid Until"}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("thStatus") || "Status"}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("thActions") || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-t border-gray-100 dark:border-gray-700"
              >
                <td className="px-3 py-2">
                  <p className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {r.staffName}
                  </p>
                  {r.staffId && (
                    <p className="text-xs text-gray-500">{r.staffId}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <p className="font-mono text-xs">{r.analyteCode}</p>
                  <p className="text-xs text-gray-500">{r.analyteName}</p>
                </td>
                <td className="px-3 py-2 text-xs">{r.labSection}</td>
                <td className="px-3 py-2 text-xs">{r.assessor}</td>
                <td className="px-3 py-2 text-xs">{r.authorizedUntil}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${statusClass[r.status]}`}
                  >
                    {COMPETENCY_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {r.status === "authorized" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markExpired(r)}
                      >
                        {t("competencyMarkExpired") || "Mark Expired"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompetencyRecord(r.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t("delete") || "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {t("competencyNoRecords") || "No competency records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompetencyMatrixTab;
