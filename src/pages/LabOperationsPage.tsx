/**
 * Lab Operations Hub Page
 * Equipment management, maintenance, reagent tracking, QC dashboard, proficiency testing
 */
import {
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckBadgeIcon,
  ClockIcon,
  CogIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useToast } from "@/hooks/useToast";
import type { LabOpsTab } from "@/types/labOps";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { LabOpsImportPreview } from "@/services/labOpsImportService";

const EquipmentTab = lazy(() => import("@/components/lab-ops/EquipmentTab"));
const MaintenanceTab = lazy(
  () => import("@/components/lab-ops/MaintenanceTab"),
);
const ReagentTab = lazy(() => import("@/components/lab-ops/ReagentTab"));
const QCDashboardTab = lazy(
  () => import("@/components/lab-ops/QCDashboardTab"),
);
const ProficiencyTestingTab = lazy(
  () => import("@/components/lab-ops/ProficiencyTestingTab"),
);
const QualityManagementTab = lazy(
  () => import("@/components/lab-ops/QualityManagementTab"),
);
const IQCWestgardTab = lazy(
  () => import("@/components/lab-ops/IQCWestgardTab"),
);
const CompetencyMatrixTab = lazy(
  () => import("@/components/lab-ops/CompetencyMatrixTab"),
);

const tabs: {
  key: LabOpsTab;
  labelKey: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  { key: "equipment", labelKey: "tabEquipment", icon: CogIcon },
  { key: "maintenance", labelKey: "tabMaintenance", icon: ClockIcon },
  { key: "reagents", labelKey: "tabReagents", icon: BeakerIcon },
  { key: "qcDashboard", labelKey: "tabQCDashboard", icon: ChartBarIcon },
  {
    key: "proficiency",
    labelKey: "tabProficiencyTesting",
    icon: CheckBadgeIcon,
  },
  {
    key: "qualityManagement",
    labelKey: "tabQualityManagement",
    icon: ShieldCheckIcon,
  },
  {
    key: "iqcWestgard",
    labelKey: "tabIQCWestgard",
    icon: ChartPieIcon,
  },
  {
    key: "competencyMatrix",
    labelKey: "tabCompetencyMatrix",
    icon: UserGroupIcon,
  },
];

const LabOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabOpsTab>("equipment");
  const { t } = useTranslation();
  const toast = useToast();
  const { isAdmin } = useAdminGuard();
  const syncStatus = useLabOpsStore((state) => state.syncStatus);
  const syncError = useLabOpsStore((state) => state.syncError);
  const lastSyncedAt = useLabOpsStore((state) => state.lastSyncedAt);
  const retrySyncNow = useLabOpsStore((state) => state.retrySyncNow);
  const organizationId = useTenantStore((state) => state.organizationId);
  const loadedOrganizationId = useLabOpsStore((state) => state.loadedOrganizationId);
  const hasLoaded = useLabOpsStore((state) => state.hasLoadedFromFirestore);
  const recordMode = useLabOpsStore((state) => state.recordMode);
  const resetOrganizationData = useLabOpsStore((state) => state.resetOrganizationData);
  const importOrganizationData = useLabOpsStore((state) => state.importOrganizationData);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importPreview, setImportPreview] = useState<LabOpsImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingData, setImportingData] = useState(false);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  useEffect(() => {
    const state = useLabOpsStore.getState();
    if (!state.hasLoadedFromFirestore || state.loadedOrganizationId !== organizationId) {
      void state.loadFromFirestore();
    }
  }, [organizationId]);

  const syncBadgeClass =
    syncStatus === "saving"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : syncStatus === "synced"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        : syncStatus === "error"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const syncLabel =
    syncStatus === "saving"
      ? t("saving") || "Saving"
      : syncStatus === "synced"
        ? t("synced") || "Synced"
        : syncStatus === "error"
          ? t("syncFailed") || "Sync failed"
          : t("idle") || "Idle";

  const handleDownloadResetBackup = async () => {
    try {
      await useLabOpsStore.getState().flushPendingSaves();
      const state = useLabOpsStore.getState();
      if (state.syncStatus === "error" || !state.hasLoadedFromFirestore
        || state.loadedOrganizationId !== organizationId) {
        throw new Error(state.syncError || "Load and synchronize this organization's Lab Operations data before backing it up");
      }
      const data = {
        equipment: state.equipment,
        calibrations: state.calibrations,
        maintenanceLogs: state.maintenanceLogs,
        reagents: state.reagents,
        reagentUsageLogs: state.reagentUsageLogs,
        proficiencyTests: state.proficiencyTests,
        qualityEvents: state.qualityEvents,
        capaRecords: state.capaRecords,
        qualityRisks: state.qualityRisks,
        competencyRecords: state.competencyRecords,
        iqcAnalytes: state.iqcAnalytes,
        iqcResults: state.iqcResults,
      };
      const backup = {
        format: "accreditex-lab-operations-backup",
        version: 1,
        organizationId,
        exportedAt: new Date().toISOString(),
        data,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lab-operations-${organizationId}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setBackupDownloaded(true);
    } catch (error) {
      console.error("Failed to create Lab Operations backup:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsBackupFailed"));
    }
  };

  const handleResetOrganizationData = async () => {
    if (!organizationId || resetConfirmation !== organizationId || !backupDownloaded) return;
    setResettingData(true);
    try {
      await resetOrganizationData(organizationId);
      toast.success(t("labOpsResetSuccess"));
      setShowResetPanel(false);
      setResetConfirmation("");
      setBackupDownloaded(false);
    } catch (error) {
      console.error("Failed to reset Lab Operations data:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsResetFailed"));
    } finally {
      setResettingData(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const { createLabOpsExcelTemplate } = await import("@/services/labOpsImportService");
      const template = createLabOpsExcelTemplate();
      const url = URL.createObjectURL(new Blob([template], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "accreditex-lab-operations-import-template.xlsx";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("Failed to create Lab Operations import template:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsImportFailed"));
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setImportError(null);
    setImportPreview(null);
    try {
      if (recordMode) {
        throw new Error(t("labOpsImportRecordModeBlocked"));
      }
      if (!hasLoaded || loadedOrganizationId !== organizationId) {
        throw new Error(t("labOpsLoadingRequired"));
      }
      const { parseLabOpsImportFile } = await import("@/services/labOpsImportService");
      setImportPreview(await parseLabOpsImportFile(file, organizationId || ""));
    } catch (error) {
      console.error("Failed to preview Lab Operations import:", error);
      setImportError(error instanceof Error ? error.message : t("labOpsImportFailed"));
    }
  };

  const handleConfirmImport = async () => {
    if (!organizationId || !importPreview || importingData) return;
    setImportingData(true);
    try {
      const result = await importOrganizationData(organizationId, importPreview.data);
      toast.success(t("labOpsImportSuccess", result));
      setImportPreview(null);
      setShowImportPanel(false);
      if (importFileRef.current) importFileRef.current.value = "";
    } catch (error) {
      console.error("Failed to import Lab Operations data:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsImportFailed"));
    } finally {
      setImportingData(false);
    }
  };

  return (
    <div className="space-y-6">
      {(resettingData || importingData) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-lg bg-white px-4 py-3 text-sm font-medium shadow-lg dark:bg-gray-800">
            {resettingData ? t("labOpsResetting") : t("labOpsImporting")}
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <CogIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {t("labOperations")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("labOpsSubtitle")}
          </p>
        </div>
        <div className="ltr:ml-auto rtl:mr-auto flex items-center">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${syncBadgeClass}`}
          >
            {syncLabel}
          </span>
        </div>
      </div>

      {syncStatus === "error" && syncError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>{recordMode ? t("labOpsRecordSyncFailed") : syncError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void retrySyncNow();
            }}
          >
            {t("retry") || "Retry"}
          </Button>
        </div>
      )}

      {syncStatus === "synced" && lastSyncedAt && (
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {`${t("lastSynced") || "Last synced"}: ${new Date(lastSyncedAt).toLocaleString()}`}
        </p>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-brand-primary/30 p-4">
          {!showImportPanel ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!hasLoaded || loadedOrganizationId !== organizationId || syncStatus === "saving"}
              onClick={() => {
                setImportError(null);
                setImportPreview(null);
                setShowImportPanel(true);
              }}
            >
              {t("labOpsImportOpen")}
            </Button>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold">{t("labOpsImportTitle")}</h2>
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {recordMode ? t("labOpsImportRecordModeBlocked") : t("labOpsImportHelp")}
              </p>
              {!recordMode && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDownloadImportTemplate()}
                      disabled={importingData}
                    >
                      {t("labOpsImportDownloadTemplate")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => importFileRef.current?.click()}
                      disabled={!hasLoaded || loadedOrganizationId !== organizationId || importingData}
                    >
                      {t("labOpsImportChooseFile")}
                    </Button>
                    <input
                      ref={importFileRef}
                      type="file"
                      accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(event) => void handleImportFile(event)}
                    />
                  </div>
                  {importError && (
                    <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                      {importError}
                    </p>
                  )}
                  {importPreview && (
                    <div className="space-y-3 rounded-md bg-brand-background p-3 dark:bg-dark-brand-background">
                      <p className="text-sm font-medium">
                        {t("labOpsImportPreview", { rowCount: importPreview.rowCount })}
                      </p>
                      <ul className="grid gap-1 text-sm sm:grid-cols-2">
                        {Object.entries(importPreview.data).filter(([, records]) => records.length > 0).map(([key, records]) => (
                          <li key={key}>
                            {t(`labOpsImportGroup_${key}`)}: {records.length}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {t("labOpsImportAddOnly")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={importingData || syncStatus === "saving"}
                          onClick={() => void handleConfirmImport()}
                        >
                          {importingData ? t("labOpsImporting") : t("labOpsImportConfirm")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={importingData}
                          onClick={() => {
                            setShowImportPanel(false);
                            setImportPreview(null);
                            setImportError(null);
                            if (importFileRef.current) importFileRef.current.value = "";
                          }}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {!importPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={importingData}
                      onClick={() => setShowImportPanel(false)}
                    >
                      {t("cancel")}
                    </Button>
                  )}
                </>
              )}
              {recordMode && (
                <Button variant="ghost" size="sm" onClick={() => setShowImportPanel(false)}>
                  {t("cancel")}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 p-4">
          {!showResetPanel ? (
            <Button
              variant="danger"
              size="sm"
              disabled={!hasLoaded || loadedOrganizationId !== organizationId || syncStatus === "saving"}
              onClick={() => {
                setBackupDownloaded(false);
                setResetConfirmation("");
                setShowResetPanel(true);
              }}
            >
              {t("labOpsResetOpen")}
            </Button>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold text-red-700 dark:text-red-300">
                {t("labOpsResetTitle")}
              </h2>
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {recordMode
                  ? t("labOpsResetRecordModeBlocked")
                  : t("labOpsResetWarning")}
              </p>
              {!recordMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasLoaded || loadedOrganizationId !== organizationId || syncStatus === "saving" || resettingData}
                    onClick={() => void handleDownloadResetBackup()}
                  >
                    {t("labOpsDownloadBackup")}
                  </Button>
                  {backupDownloaded && (
                    <div className="space-y-2">
                      <label
                        htmlFor="lab-ops-reset-confirmation"
                        className="block text-sm font-medium"
                      >
                        {t("labOpsResetTypeOrgId", { organizationId })}
                      </label>
                      <input
                        id="lab-ops-reset-confirmation"
                        value={resetConfirmation}
                        onChange={(event) => setResetConfirmation(event.target.value)}
                        autoComplete="off"
                        className="w-full max-w-md rounded border border-red-300 px-3 py-2 text-sm dark:border-red-700 dark:bg-gray-800"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={!backupDownloaded || resetConfirmation !== organizationId || resettingData}
                      onClick={() => void handleResetOrganizationData()}
                    >
                      {resettingData ? t("labOpsResetting") : t("labOpsResetConfirm")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resettingData}
                      onClick={() => {
                        setShowResetPanel(false);
                        setResetConfirmation("");
                        setBackupDownloaded(false);
                      }}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </Button>
          );
        })}
      </div>

      {/* Tab content */}
      {!hasLoaded || loadedOrganizationId !== organizationId ? (
        <p role="status">{t("labOpsLoadingRequired")}</p>
      ) : <Suspense
        fallback={
          <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        }
      >
        {activeTab === "equipment" && <EquipmentTab />}
        {activeTab === "maintenance" && <MaintenanceTab />}
        {activeTab === "reagents" && <ReagentTab />}
        {activeTab === "qcDashboard" && <QCDashboardTab />}
        {activeTab === "proficiency" && <ProficiencyTestingTab />}
        {activeTab === "qualityManagement" && <QualityManagementTab />}
        {activeTab === "iqcWestgard" && <IQCWestgardTab />}
        {activeTab === "competencyMatrix" && <CompetencyMatrixTab />}
      </Suspense>}
    </div>
  );
};

export default LabOperationsPage;
