import React, { useMemo } from "react";
import {
  Project,
  Risk,
  User,
  Department,
  Competency,
  UserTrainingStatus,
} from "@/types";
import { useTranslation } from "../hooks/useTranslation";
import {
  LightBulbIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "../components/icons";
import StatCard from "../components/common/StatCard";
import RootCauseAnalysis from "../components/quality-insights/RootCauseAnalysis";
import CompetencyGapReport from "../components/quality-insights/CompetencyGapReport";
import TrainingEffectivenessChart from "../components/quality-insights/TrainingEffectivenessChart";
import AIQualityBriefing from "../components/quality-insights/AIQualityBriefing";
import PDCACycleTracker from "../components/quality-insights/PDCACycleTracker";
import QualityTrendChart from "../components/quality-insights/QualityTrendChart";
import { calculatePortfolioReadiness } from "@/services/tqmReadinessService";
import { useAppStore } from "@/stores/useAppStore";
import {
  calculateAssessorPackExportMetrics,
  getAssessorPackExportAudit,
} from "@/services/assessorReportPackService";
import { calculatePredictiveAuditRisk } from "@/services/qualityOutcomeIntelligenceService";

interface QualityInsightsPageProps {
  projects: Project[];
  risks: Risk[];
  users: User[];
  departments: Department[];
  competencies: Competency[];
  userTrainingStatuses: { [userId: string]: UserTrainingStatus };
}

const QualityInsightsPage: React.FC<QualityInsightsPageProps> = (props) => {
  const { t } = useTranslation();
  const documents = useAppStore((state) => state.documents);

  const kpis = useMemo(() => {
    const pendingChecks = props.projects
      .flatMap((p) => p.capaReports)
      .filter(
        (c) =>
          c.effectivenessCheck?.required && !c.effectivenessCheck.completed,
      ).length;
    const pendingAcks = props.users
      .flatMap((u) => u.readAndAcknowledge || [])
      .filter((ack) => !ack.acknowledgedDate).length;

    // Calculate Quality Score
    const totalProjects = props.projects.length || 1;
    const completedProjects = props.projects.filter(
      (p) => p.status === "Completed",
    ).length;
    const activeProjects = props.projects.filter(
      (p) => p.status === "In Progress",
    ).length;
    const complianceRate =
      ((completedProjects + activeProjects) / totalProjects) * 100;

    // Calculate Risk Control Index
    const totalRisks = props.risks.length || 1;
    const mitigatedRisks = props.risks.filter(
      (r) => r.status === "Mitigated" || r.status === "Closed",
    ).length;
    const riskControlIndex = (mitigatedRisks / totalRisks) * 100;

    // Composite Quality Score (60% Compliance, 40% Risk)
    const qualityScore = Math.round(
      complianceRate * 0.6 + riskControlIndex * 0.4,
    );

    return {
      pendingChecks,
      pendingAcks,
      qualityScore,
      riskControlIndex: Math.round(riskControlIndex),
    };
  }, [props.projects, props.users, props.risks]);

  const readiness = useMemo(() => {
    return calculatePortfolioReadiness(props.projects, props.risks, documents);
  }, [props.projects, props.risks, documents]);

  const assessorExportMetrics = useMemo(() => {
    const auditEntries = getAssessorPackExportAudit();
    return calculateAssessorPackExportMetrics(auditEntries);
  }, [props.projects.length]);

  const openCapas = useMemo(
    () =>
      props.projects
        .flatMap((project) => project.capaReports || [])
        .filter((capa) => capa.status === "Open").length,
    [props.projects],
  );

  const predictiveAuditRisk = useMemo(
    () =>
      calculatePredictiveAuditRisk({
        readinessScore: readiness.readinessScore,
        evidenceIntegrityIndex: readiness.evidenceIntegrityIndex,
        criticalOpenFindings: readiness.criticalOpenFindings,
        openCapas,
        reviewerSignOffRatePercent:
          assessorExportMetrics.reviewerSignOffRatePercent,
      }),
    [
      readiness.readinessScore,
      readiness.evidenceIntegrityIndex,
      readiness.criticalOpenFindings,
      openCapas,
      assessorExportMetrics.reviewerSignOffRatePercent,
    ],
  );

  // Generate sparkline data based on current score (simulated history)
  const qualitySparkline = useMemo(() => {
    const data = [];
    let current = kpis.qualityScore;
    for (let i = 0; i < 7; i++) {
      data.unshift(Math.max(0, Math.min(100, current)));
      current += Math.random() * 10 - 5; // Random fluctuation
    }
    return data;
  }, [kpis.qualityScore]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <LightBulbIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {t("qualityInsightsHub")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("qualityInsightsDescription")}
          </p>
        </div>
      </div>

      {/* Strategic AI Briefing */}
      <AIQualityBriefing
        projects={props.projects}
        risks={props.risks}
        users={props.users}
        departments={props.departments}
        competencies={props.competencies}
      />

      {/* Strategic TQM Dashboard Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary border-b border-gray-200 dark:border-gray-700 pb-2">
          {t("strategicTqmDashboard") || "Strategic TQM Dashboard"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t("qualityScore") || "Quality Score"}
            value={`${kpis.qualityScore}%`}
            icon={CheckBadgeIcon}
            color="from-sky-500 to-sky-700 bg-gradient-to-br"
            trend={{ direction: "up", value: 3.2, label: t("vsLastMonth") }}
            sparklineData={qualitySparkline}
          />
          <StatCard
            title={t("pendingEffectivenessChecks")}
            value={kpis.pendingChecks}
            icon={ClipboardDocumentCheckIcon}
            color="from-amber-500 to-amber-700 bg-gradient-to-br"
            trend={{ direction: "down", value: 12, label: t("vsLastWeek") }}
          />
          <StatCard
            title={t("riskControlIndex") || "Risk Control Index"}
            value={`${kpis.riskControlIndex}`}
            icon={ExclamationTriangleIcon}
            color="from-emerald-500 to-emerald-700 bg-gradient-to-br"
            trend={{ direction: "up", value: 1.5, label: t("vsLastMonth") }}
          />
          <StatCard
            title={t("pendingAcknowledgements")}
            value={kpis.pendingAcks}
            icon={CheckCircleIcon}
            color="from-sky-500 to-sky-700 bg-gradient-to-br"
          />
        </div>

        <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("readinessScore") || "Readiness Score"}
              </p>
              <p className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {readiness.readinessScore}%
              </p>
            </div>
            <div>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("evidenceIntegrity") || "Evidence Integrity Index"}
              </p>
              <p className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {readiness.evidenceIntegrityIndex}%
              </p>
            </div>
            <div>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("capaEffectiveness") || "CAPA Effectiveness"}
              </p>
              <p className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {readiness.capaEffectivenessRate}%
              </p>
            </div>
            <div>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("criticalOpenFindings") || "Critical Open Findings"}
              </p>
              <p className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {readiness.criticalOpenFindings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                Predictive Audit-Risk Indicator
              </h3>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                Forward-looking signal based on readiness, evidence quality,
                open findings, CAPA load, and reviewer sign-off discipline.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Predicted Risk Level
              </p>
              <p className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {predictiveAuditRisk.level} ({predictiveAuditRisk.score}/100)
              </p>
            </div>
          </div>

          {predictiveAuditRisk.reasons.length > 0 && (
            <ul className="mt-3 list-disc list-inside text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary space-y-1">
              {predictiveAuditRisk.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QualityTrendChart projects={props.projects} risks={props.risks} />
          <PDCACycleTracker projects={props.projects} />
        </div>
      </div>

      {/* Operational Metrics Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary border-b border-gray-200 dark:border-gray-700 pb-2">
          {t("operationalMetrics") || "Operational Metrics"}
        </h2>

        <RootCauseAnalysis projects={props.projects} risks={props.risks} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrainingEffectivenessChart
            projects={props.projects}
            risks={props.risks}
            departments={props.departments}
            users={props.users}
            userTrainingStatuses={props.userTrainingStatuses}
          />

          <CompetencyGapReport
            departments={props.departments}
            users={props.users}
            competencies={props.competencies}
          />
        </div>
      </div>
    </div>
  );
};

export default QualityInsightsPage;
