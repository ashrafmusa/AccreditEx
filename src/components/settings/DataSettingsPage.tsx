import React from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { exportAllFirestoreData, importAllFirestoreData } from "@/services/firestoreDataService";
import { useToast } from "@/hooks/useToast";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import DataActionButton from "./DataActionButton";
import { CheckIcon } from "@/components/icons";
import { SettingsPanel } from './index';

const DataSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const handleExport = async () => {
    try {
      const jsonData = await exportAllFirestoreData();
      const blob = new Blob([JSON.stringify(jsonData)], { type: "application/json" });
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
        await importAllFirestoreData(JSON.parse(text));
        toast.success(t("dataImported"));
        // Force a reload to reflect imported data across the app
        window.location.reload();
      } catch (error) {
        toast.error(t("importFailed"));
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm(t("areYouSureReset"))) {
      // Reset would require clearing all collections
      toast.info(t("resetInProgress"));
      window.location.reload();
    }
  };

  return (
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
      </SettingsCard>
    </div>
  );
};

export default DataSettingsPage;