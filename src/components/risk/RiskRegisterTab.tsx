import { EmptyState, TableContainer } from "@/components/ui";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { useConfirmStore } from "@/stores/useConfirmStore";
import React, { useMemo, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../stores/useAppStore";
import { useUserStore } from "../../stores/useUserStore";
import { Risk } from "../../types";
import { getRiskLevel } from "../../utils/riskUtils";
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../icons";
import RiskMatrix from "./RiskMatrix";
import RiskModal from "./RiskModal";

const RiskRegisterTab: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { risks, addRisk, updateRisk, deleteRisk, trainingPrograms } =
    useAppStore();
  const { users } = useUserStore();
  const { can } = usePermission();
  const canCreate = can(Action.Create, Resource.Risk);
  const canUpdate = can(Action.Update, Resource.Risk);
  const canDelete = can(Action.Delete, Resource.Risk);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSave = async (riskData: Risk | Omit<Risk, "id">) => {
    try {
      if ("id" in riskData) {
        await updateRisk(riskData);
        showToast(
          t("riskUpdatedSuccessfully") || "Risk updated successfully",
          "success",
        );
      } else {
        await addRisk(riskData);
        showToast(
          t("riskCreatedSuccessfully") || "Risk created successfully",
          "success",
        );
      }
      setIsModalOpen(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToSaveRisk") || "Failed to save risk";
      showToast(errorMsg, "error");
      console.error("Risk save failed:", error);
    }
  };

  const handleDelete = async (riskId: string) => {
    const risk = risks.find((r) => r.id === riskId);
    const riskTitle = risk?.title || "Risk";

    if (
      !(await useConfirmStore
        .getState()
        .confirm(
          `${
            t("areYouSureDeleteRisk") ||
            "Are you sure you want to delete this risk?"
          } "${riskTitle}"?`,
          t("deleteRisk") || "Delete Risk",
          t("delete") || "Delete",
        ))
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRisk(riskId);
      showToast(
        t("riskDeletedSuccessfully") || "Risk deleted successfully",
        "success",
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToDeleteRisk") || "Failed to delete risk";
      showToast(errorMsg, "error");
      console.error("Risk delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedRisks = useMemo(
    () =>
      [...risks].sort(
        (a, b) => b.likelihood * b.impact - a.likelihood * a.impact,
      ),
    [risks],
  );

  const filteredRisks = useMemo(
    () =>
      sortedRisks.filter((r) => {
        const matchesSearch =
          !searchTerm ||
          r.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [sortedRisks, searchTerm, statusFilter],
  );

  const levelCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    risks.forEach((r) => {
      const lvl = getRiskLevel(r.likelihood * r.impact);
      (counts as Record<string, number>)[lvl.key] =
        ((counts as Record<string, number>)[lvl.key] || 0) + 1;
    });
    return counts;
  }, [risks]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            key: "critical",
            label: t("critical") || "Critical",
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-800 dark:text-red-300",
            count: levelCounts.critical,
          },
          {
            key: "high",
            label: t("high") || "High",
            bg: "bg-orange-100 dark:bg-orange-900/30",
            text: "text-orange-800 dark:text-orange-300",
            count: levelCounts.high,
          },
          {
            key: "medium",
            label: t("medium") || "Medium",
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
            text: "text-yellow-800 dark:text-yellow-300",
            count: levelCounts.medium,
          },
          {
            key: "low",
            label: t("low") || "Low",
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-800 dark:text-green-300",
            count: levelCounts.low,
          },
        ].map((card) => (
          <div
            key={card.key}
            className={`${card.bg} rounded-xl p-4 flex flex-col items-center cursor-pointer border-2 transition-all ${statusFilter === card.key ? "border-brand-primary" : "border-transparent"}`}
            onClick={() =>
              setStatusFilter(statusFilter === card.key ? "all" : card.key)
            }
          >
            <span className={`text-3xl font-bold ${card.text}`}>
              {card.count}
            </span>
            <span className={`text-xs font-semibold mt-1 ${card.text}`}>
              {card.label}
            </span>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          placeholder={t("search") || "Search risks…"}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-0 border border-brand-border dark:border-dark-brand-border rounded-lg px-3 py-2 text-sm bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-brand-border dark:border-dark-brand-border rounded-lg px-3 py-2 text-sm bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <option value="all">{t("allStatuses") || "All Statuses"}</option>
          <option value="Open">{t("open") || "Open"}</option>
          <option value="Mitigated">{t("mitigated") || "Mitigated"}</option>
          <option value="Closed">{t("closed") || "Closed"}</option>
        </select>
        {canCreate && (
          <button
            onClick={() => {
              setEditingRisk(null);
              setIsModalOpen(true);
            }}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center font-semibold text-sm whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("addNewRisk")}
          </button>
        )}
      </div>

      <RiskMatrix risks={risks} />

      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border overflow-hidden">
        <TableContainer>
          <table className="min-w-full divide-y divide-brand-border dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("riskTitle")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("riskScore")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("owner")}
                </th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wide">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border dark:divide-dark-brand-border">
              {filteredRisks.map((risk) => {
                const owner = users.find((u) => u.id === risk.ownerId);
                const score = risk.impact * risk.likelihood;
                const level = getRiskLevel(score);
                const statusBadge =
                  risk.status === "Open"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    : risk.status === "Mitigated"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
                return (
                  <tr
                    key={risk.id}
                    className="hover:bg-brand-background dark:hover:bg-dark-brand-background transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                      {risk.title}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge}`}
                      >
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${level.badgeBg} ${level.badgeText}`}
                      >
                        {score} — {level.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {owner?.name || t("unassigned")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {canUpdate && (
                          <button
                            disabled={isDeleting}
                            onClick={() => {
                              setEditingRisk(risk);
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:text-brand-primary disabled:opacity-50"
                            aria-label={t("editRisk")}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDelete(risk.id)}
                            className="p-1 hover:text-red-600 disabled:opacity-50"
                            aria-label={t("deleteRisk")}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableContainer>
        {filteredRisks.length === 0 && (
          <EmptyState
            icon={ExclamationTriangleIcon}
            title={
              risks.length === 0
                ? t("noRisks") || "No risks recorded"
                : t("noResultsFound") || "No results match your filters"
            }
            message=""
          />
        )}
      </div>
      {isModalOpen && (
        <RiskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          existingRisk={editingRisk}
          users={users}
          trainingPrograms={trainingPrograms}
        />
      )}
    </div>
  );
};

export default RiskRegisterTab;
