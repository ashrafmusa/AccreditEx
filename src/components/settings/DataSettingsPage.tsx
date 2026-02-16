import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  exportAllFirestoreData,
  importAllFirestoreData,
} from "@/services/firestoreDataService";
import { useToast } from "@/hooks/useToast";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useSettingsAudit } from "@/hooks/useSettingsAudit";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import DataActionButton from "./DataActionButton";
import { CheckIcon } from "@/components/icons";
import { SettingsPanel } from "./index";

const DataSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { isAdmin, AdminOnly } = useAdminGuard();
  const { auditLog } = useSettingsAudit();
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = async () => {
    try {
      await auditLog("data", "export", null, "full-export", "export");
      const jsonData = await exportAllFirestoreData();
      const blob = new Blob([JSON.stringify(jsonData)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accreditex-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("dataExported"));
    } catch (error) {
      toast.error(t("exportFailed"));
    }
  };

  const handleImport = async (file: File) => {
    if (file) {
      const text = await file.text();
      try {
        await auditLog("data", "import", null, "full-import", "import");
        await importAllFirestoreData(JSON.parse(text));
        toast.success(t("dataImported"));
        // Force a reload to reflect imported data across the app
        window.location.reload();
      } catch (error) {
        console.error("Data import failed:", error);
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`${t("importFailed")} ${msg}`);
      }
    }
  };

  const handleReset = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    if (resetConfirmText !== "RESET") {
      toast.error(t("typeResetToConfirm") || "Please type RESET to confirm");
      return;
    }
    if (window.confirm(t("areYouSureReset"))) {
      await auditLog("data", "reset", "all-data", null, "delete");
      // Reset would require clearing all collections
      toast.info(t("resetInProgress"));
      setShowResetConfirm(false);
      setResetConfirmText("");
      window.location.reload();
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
    setResetConfirmText("");
  };

  return (
    <AdminOnly>
      <div className="space-y-6">
        <SettingsCard
          title={t("dataManagement")}
          description={t("dataManagementDescription")}
        >
          <DataActionButton
            title={t("exportData")}
            description={t("exportDataDescription")}
            buttonText={t("export")}
            onAction={handleExport}
          />
          <DataActionButton
            title={t("importData")}
            description={t("importDataDescription")}
            buttonText={t("import")}
            onFileAction={handleImport}
            isFileInput
          />
        </SettingsCard>
        <SettingsCard
          title={t("resetApplication")}
          description={t("resetApplicationDescription")}
        >
          <DataActionButton
            title={t("resetData")}
            description={t("resetDataWarning")}
            buttonText={t("reset")}
            onAction={handleReset}
            isDestructive
          />
          {showResetConfirm && (
            <div className="mt-4 p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-700 space-y-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {t("typeResetToConfirm") ||
                  "Type RESET to confirm data deletion:"}
              </p>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:border-red-600 dark:text-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={resetConfirmText !== "RESET"}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("confirmReset") || "Confirm Reset"}
                </button>
                <button
                  onClick={handleCancelReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {t("cancel") || "Cancel"}
                </button>
              </div>
            </div>
          )}
        </SettingsCard>
      </div>
    </AdminOnly>
  );
};

export default DataSettingsPage;
