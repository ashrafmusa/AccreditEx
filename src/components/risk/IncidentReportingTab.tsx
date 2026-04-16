import { TableContainer } from "@/components/ui";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { useConfirmStore } from "@/stores/useConfirmStore";
import React, { useMemo, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../stores/useAppStore";
import { useUserStore } from "../../stores/useUserStore";
import { IncidentReport } from "../../types";
import EmptyState from "../common/EmptyState";
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../icons";
import IncidentModal from "./IncidentModal";

const IncidentReportingTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    incidentReports,
    addIncidentReport,
    updateIncidentReport,
    deleteIncidentReport,
  } = useAppStore();
  const { currentUser } = useUserStore();
  const { can } = usePermission();
  const canCreate = can(Action.Create, Resource.Risk);
  const canUpdate = can(Action.Update, Resource.Risk);
  const canDelete = can(Action.Delete, Resource.Risk);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(
    null,
  );

  const handleSave = async (
    reportData: IncidentReport | Omit<IncidentReport, "id">,
  ) => {
    try {
      if ("id" in reportData) {
        await updateIncidentReport(reportData);
      } else {
        await addIncidentReport({
          ...reportData,
          reportedBy: currentUser?.name ?? "Unknown",
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save incident report:", error);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (
      await useConfirmStore
        .getState()
        .confirm(
          t("areYouSureDeleteIncident"),
          t("deleteIncident") || "Delete Incident",
          t("delete") || "Delete",
        )
    ) {
      try {
        await deleteIncidentReport(reportId);
      } catch (error) {
        console.error("Failed to delete incident report:", error);
      }
    }
  };

  const sortedReports = useMemo(
    () =>
      [...incidentReports].sort(
        (a, b) =>
          new Date(b.incidentDate).getTime() -
          new Date(a.incidentDate).getTime(),
      ),
    [incidentReports],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canCreate && (
          <button
            onClick={() => {
              setEditingReport(null);
              setIsModalOpen(true);
            }}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center font-semibold text-sm"
          >
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("reportNewIncident")}
          </button>
        )}
      </div>

      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
        <TableContainer>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("incidentDate")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("incidentType")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("severity")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wide">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wide">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
              {sortedReports.map((report) => {
                const typeColorClass =
                  report.type === "Near-Miss"
                    ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full text-xs font-semibold inline-block"
                    : "";
                return (
                  <tr key={report.id}>
                    <td className="px-6 py-4">
                      {new Date(report.incidentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span className={typeColorClass}>{report.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{report.severity}</td>
                    <td className="px-6 py-4 text-sm">{report.status}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => {
                              setEditingReport(report);
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:text-brand-primary"
                            aria-label={t("editIncident")}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-1 hover:text-red-600"
                            aria-label={t("deleteIncident")}
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
        {sortedReports.length === 0 && (
          <EmptyState
            icon={ExclamationTriangleIcon}
            title={t("noIncidents")}
            message=""
          />
        )}
      </div>

      {isModalOpen && (
        <IncidentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          existingReport={editingReport}
        />
      )}
    </div>
  );
};

export default IncidentReportingTab;
