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
import type { LabOpsTab } from "@/types/labOps";
import React, { lazy, Suspense, useState } from "react";

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
  const syncStatus = useLabOpsStore((state) => state.syncStatus);
  const syncError = useLabOpsStore((state) => state.syncError);
  const lastSyncedAt = useLabOpsStore((state) => state.lastSyncedAt);
  const retrySyncNow = useLabOpsStore((state) => state.retrySyncNow);

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

  return (
    <div className="space-y-6">
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
          <span>{syncError}</span>
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
      <Suspense
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
      </Suspense>
    </div>
  );
};

export default LabOperationsPage;
