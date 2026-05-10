import React, { lazy, Suspense, useState } from "react";
import { ExclamationTriangleIcon } from "../components/icons";
import CapaReportsTab from "../components/risk/CapaReportsTab";
import RiskRegisterTab from "../components/risk/RiskRegisterTab";
import { useTranslation } from "../hooks/useTranslation";
// FIX: Corrected import path for IncidentReportingTab
import LoadingScreen from "@/components/common/LoadingScreen";
import { Button } from "@/components/ui";
import EffectivenessChecksTab from "../components/risk/EffectivenessChecksTab";
import IncidentReportingTab from "../components/risk/IncidentReportingTab";
import IncidentTrendingTab from "../components/risk/IncidentTrendingTab";
import type { ClassificationResult } from "../components/risk/PatientSafetyEventClassifier";
import PatientSafetyEventClassifier from "../components/risk/PatientSafetyEventClassifier";
import PredictiveCAPAGenerator from "../components/risk/PredictiveCAPAGenerator";
import { useProjectStore } from "../stores/useProjectStore";

const RCAToolTab = lazy(() => import("../components/risk/RCAToolTab"));

type RiskHubTab =
  | "register"
  | "capa"
  | "incidents"
  | "trending"
  | "checks"
  | "rca"
  | "aiTools";

const RiskHubPage: React.FC<{ setNavigation: (state: any) => void }> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<RiskHubTab>("register");
  const { updateCapa } = useProjectStore();
  const projects = useProjectStore((state) => state.projects);

  // AI Tools state: pass classifier output to CAPA generator
  const [classifierDescription, setClassifierDescription] = useState<
    string | undefined
  >();
  const [classifierResult, setClassifierResult] = useState<
    ClassificationResult | undefined
  >();

  const handleClassified = (
    description: string,
    result: ClassificationResult,
  ) => {
    setClassifierDescription(description);
    setClassifierResult(result);
    setActiveTab("aiTools");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <ExclamationTriangleIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {t("riskHubTitle")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("riskHubDescription")}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-brand-border">
        <nav
          className="-mb-px flex space-x-4 rtl:space-x-reverse"
          aria-label="Tabs"
        >
          <Button
            onClick={() => setActiveTab("register")}
            variant={activeTab === "register" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            {" "}
            {t("riskRegister")}
          </Button>
          <Button
            onClick={() => setActiveTab("capa")}
            variant={activeTab === "capa" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            {t("capaReports")}
          </Button>
          <Button
            onClick={() => setActiveTab("incidents")}
            variant={activeTab === "incidents" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            {t("incidentReporting")}
          </Button>
          <Button
            onClick={() => setActiveTab("trending")}
            variant={activeTab === "trending" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            {t("incidentTrending")}
          </Button>
          <Button
            onClick={() => setActiveTab("checks")}
            variant={activeTab === "checks" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            {t("effectivenessChecks")}
          </Button>
          <Button
            onClick={() => setActiveTab("rca")}
            variant={activeTab === "rca" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            {t("rcaToolTitle")}
          </Button>
          <Button
            onClick={() => setActiveTab("aiTools")}
            variant={activeTab === "aiTools" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2"
          >
            ✨ {t("aiToolsTab") || "AI Tools"}
          </Button>
        </nav>
      </div>

      <div>
        {activeTab === "register" && <RiskRegisterTab />}
        {activeTab === "capa" && <CapaReportsTab />}
        {activeTab === "incidents" && <IncidentReportingTab />}
        {activeTab === "trending" && <IncidentTrendingTab />}
        {activeTab === "checks" && (
          <EffectivenessChecksTab
            projects={projects}
            onUpdateCapa={updateCapa}
          />
        )}
        {activeTab === "rca" && (
          <Suspense fallback={<LoadingScreen />}>
            <RCAToolTab />
          </Suspense>
        )}
        {activeTab === "aiTools" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Column 1: Classifier */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-card p-5">
              <PatientSafetyEventClassifier onClassified={handleClassified} />
            </div>
            {/* Column 2: CAPA Generator */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-brand-border bg-white dark:bg-dark-brand-card p-5">
              <PredictiveCAPAGenerator
                prefillDescription={classifierDescription}
                prefillClassification={classifierResult}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskHubPage;
