/**
 * Lab Operations Hub Page
 * Equipment management, maintenance, reagent tracking, QC dashboard, proficiency testing
 */
import React, { lazy, Suspense, useState } from "react";
import type { LabOpsTab } from "@/types/labOps";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CogIcon,
  BeakerIcon,
  ClockIcon,
  ChartBarIcon,
  CheckBadgeIcon,
} from "@/components/icons";

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
];

const LabOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabOpsTab>("equipment");
  const { t } = useTranslation();

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
      </div>

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
      </Suspense>
    </div>
  );
};

export default LabOperationsPage;
