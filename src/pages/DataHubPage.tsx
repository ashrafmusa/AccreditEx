import React, { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";
import {
  CircleStackIcon,
  ShareIcon,
  ServerStackIcon,
} from "../components/icons";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import StatCard from "@/components/common/StatCard";
import ApiStatusWidget from "@/components/data-hub/ApiStatusWidget";
import LiveDataFeed from "@/components/data-hub/LiveDataFeed";
import Collapsible from "@/components/ui/Collapsible";
import DataActionButton from "@/components/settings/DataActionButton";
// FIX: Corrected import path for firestore export
import {
  exportAllFirestoreData,
  importAllFirestoreData,
} from "@/services/firestoreDataService";
import { useToast } from "@/hooks/useToast";
import SettingsCard from "@/components/settings/SettingsCard";
import { IntegrationDashboard } from "@/components/his-integration";
import { Button } from "@/components/ui";

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto">
    <code className="font-mono text-sky-600 dark:text-sky-300">{children}</code>
  </pre>
);

const DataHubPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"data" | "his">("data");
  const projects = useProjectStore((state) => state.projects);
  const users = useUserStore((state) => state.users);
  const { documents, standards } = useAppStore();

  const handleExport = async () => {
    try {
      const jsonData = await exportAllFirestoreData();
      const blob = new Blob([JSON.stringify(jsonData)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accreditex-backup-${new Date().toISOString().split("T")[0]}.json`;
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
        window.location.reload();
      } catch (error) {
        console.error("Data import failed:", error);
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(`${t("importFailed")} ${msg}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <CircleStackIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {t("dataHub")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("dataHubDescription")}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-dark-border">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("data")}
            className={`py-3 px-1 border-b-2 font-medium transition ${
              activeTab === "data"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary"
            }`}
          >
            <div className="flex items-center space-x-2">
              <CircleStackIcon className="h-5 w-5" />
              <span>Data Management</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("his")}
            className={`py-3 px-1 border-b-2 font-medium transition ${
              activeTab === "his"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary"
            }`}
          >
            <div className="flex items-center space-x-2">
              <ServerStackIcon className="h-5 w-5" />
              <span>HIS Integration</span>
            </div>
          </button>
        </div>
      </div>

      {/* Data Management Tab */}
      {activeTab === "data" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title={t("totalProjects")} value={projects.length} />
            <StatCard title={t("totalUsers")} value={users.length} />
            <StatCard title={t("totalDocuments")} value={documents.length} />
            <StatCard title={t("totalStandards")} value={standards.length} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiStatusWidget />
            <LiveDataFeed />
          </div>

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

          <div className="space-y-4">
            <Collapsible title={t("fhirFoundation")}>
              <p className="mt-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("fhirFoundationDescription")}
              </p>
              <p className="mt-4 font-semibold text-sm">
                {t("exampleResource")}
              </p>
              <CodeBlock>
                {`{
      "resourceType": "Observation",
      "status": "final",
      "code": {
        "text": "Hand Hygiene Compliance"
      },
      "valueQuantity": {
        "value": 98,
        "unit": "%",
        "system": "http://unitsofmeasure.org"
      }
    }`}
              </CodeBlock>
            </Collapsible>

            <Collapsible title={t("apiArchitecture")}>
              <p className="mt-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("apiArchitectureDescription")}
              </p>
              <p className="mt-4 font-semibold text-sm">
                {t("exampleApiCall")}
              </p>
              <CodeBlock>
                {`POST /api/v1/fhir/Observation
    Host: api.accreditex.com
    Authorization: Bearer <YOUR_API_KEY>

    { ... (FHIR Observation Resource) }`}
              </CodeBlock>
            </Collapsible>
          </div>
        </div>
      )}

      {/* HIS Integration Tab */}
      {activeTab === "his" && <IntegrationDashboard />}
    </div>
  );
};

export default DataHubPage;
