import SurveyRiskPredictor from "@/components/quality-insights/SurveyRiskPredictor";
import {
  calculateAssessorPackExportMetrics,
  getAssessorPackExportAudit,
  type AssessorPackExportMetrics,
} from "@/services/assessorReportPackService";
import {
  calculatePredictiveAuditRisk,
  calculateQualityTrendMetrics,
  getRecentMonthlyQualityOutcomeSnapshots,
  recordMonthlyQualityOutcomeSnapshot,
  type MonthlyQualityOutcomeSnapshot,
} from "@/services/qualityOutcomeIntelligenceService";
import { calculatePortfolioReadiness } from "@/services/tqmReadinessService";
import { useAppStore } from "@/stores/useAppStore";
import {
  Competency,
  Department,
  Project,
  Risk,
  User,
  UserTrainingStatus,
} from "@/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import StatCard from "../components/common/StatCard";
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from "../components/icons";
import AIQualityBriefing from "../components/quality-insights/AIQualityBriefing";
import CompetencyGapReport from "../components/quality-insights/CompetencyGapReport";
import PDCACycleTracker from "../components/quality-insights/PDCACycleTracker";
import QualityTrendChart from "../components/quality-insights/QualityTrendChart";
import RootCauseAnalysis from "../components/quality-insights/RootCauseAnalysis";
import TrainingEffectivenessChart from "../components/quality-insights/TrainingEffectivenessChart";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useTenantStore } from "@/stores/useTenantStore";

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
  const toast = useToast();
  const organizationId = useTenantStore((state) => state.organizationId);
  const documents = useAppStore((state) => state.documents);
  const [assessorExportMetrics, setAssessorExportMetrics] =
    useState<AssessorPackExportMetrics>({
      totalExports: 0,
      exportsLast30Days: 0,
      reviewerSignOffRatePercent: 0,
    });
  const [qualitySnapshots, setQualitySnapshots] = useState<
    MonthlyQualityOutcomeSnapshot[]
  >([]);
  const [qualitySnapshotsOrganizationId, setQualitySnapshotsOrganizationId] =
    useState<string | null>(null);
  const [qualityHistoryError, setQualityHistoryError] = useState(false);
  const assessorAuditErrorToast = useRef(toast.error);
  const qualityHistoryErrorToast = useRef(toast.error);
  const translateRef = useRef(t);
  assessorAuditErrorToast.current = toast.error;
  qualityHistoryErrorToast.current = toast.error;
  translateRef.current = t;

  useEffect(() => {
    let active = true;
    void getAssessorPackExportAudit()
      .then((entries) => {
        if (active) {
          setAssessorExportMetrics(calculateAssessorPackExportMetrics(entries));
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load assessor export metrics:", error);
        if (active) {
          assessorAuditErrorToast.current(
            translateRef.current("assessorExportAuditLoadFailed"),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const qualityTrendMetrics = useMemo(
    () => calculateQualityTrendMetrics(props.projects, props.risks),
    [props.projects, props.risks],
  );

  const readiness = useMemo(() => {
    return calculatePortfolioReadiness(props.projects, props.risks, documents);
  }, [props.projects, props.risks, documents]);

  useEffect(() => {
    try {
      recordMonthlyQualityOutcomeSnapshot({
        organizationId,
        readinessScore: readiness.readinessScore,
        assessorExportsLast30Days: assessorExportMetrics.exportsLast30Days,
        reviewerSignOffRatePercent:
          assessorExportMetrics.reviewerSignOffRatePercent,
        criticalOpenFindings: readiness.criticalOpenFindings,
        ...qualityTrendMetrics,
      });
      setQualitySnapshots(
        getRecentMonthlyQualityOutcomeSnapshots(6, organizationId),
      );
      setQualitySnapshotsOrganizationId(organizationId?.trim() || "legacy");
      setQualityHistoryError(false);
    } catch (error) {
      console.error("Failed to update quality outcome history:", error);
      setQualitySnapshots([]);
      setQualitySnapshotsOrganizationId(organizationId?.trim() || "legacy");
      setQualityHistoryError(true);
      qualityHistoryErrorToast.current(
        translateRef.current("qualityTrendSaveFailed"),
      );
    }
  }, [
    organizationId,
    readiness.readinessScore,
    readiness.criticalOpenFindings,
    assessorExportMetrics.exportsLast30Days,
    assessorExportMetrics.reviewerSignOffRatePercent,
    qualityTrendMetrics,
  ]);

  const visibleQualitySnapshots =
    qualitySnapshotsOrganizationId === (organizationId?.trim() || "legacy")
      ? qualitySnapshots
      : [];

  const kpis = useMemo(() => {
    const pendingChecks = props.projects
      .flatMap((p) => p.capaReports || [])
      .filter(
        (c) =>
          c.effectivenessCheck?.required && !c.effectivenessCheck.completed,
      ).length;
    const pendingAcks = props.users
      .flatMap((u) => (u as any).readAndAcknowledge || [])
      .filter((ack: any) => !ack.acknowledgedDate).length;

    return {
      pendingChecks,
      pendingAcks,
      qualityScore: qualityTrendMetrics.qualityScore,
      riskControlIndex: qualityTrendMetrics.riskControlIndex,
    };
  }, [props.projects, props.users, qualityTrendMetrics]);

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

  const qualitySparkline = useMemo(() => {
    return visibleQualitySnapshots.flatMap((snapshot) =>
      typeof snapshot.qualityScore === "number" ? [snapshot.qualityScore] : [],
    );
  }, [visibleQualitySnapshots]);

  const previousMonthDate = new Date();
  previousMonthDate.setDate(1);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(
    previousMonthDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  const previousMonthSnapshot = visibleQualitySnapshots.find(
    (snapshot) => snapshot.monthKey === previousMonthKey,
  );
  const qualityScoreTrend =
    typeof previousMonthSnapshot?.qualityScore === "number"
      ? {
          direction:
            kpis.qualityScore > previousMonthSnapshot.qualityScore
              ? ("up" as const)
              : kpis.qualityScore < previousMonthSnapshot.qualityScore
                ? ("down" as const)
                : ("neutral" as const),
          value: Math.abs(kpis.qualityScore - previousMonthSnapshot.qualityScore),
          label: t("vsLastMonth"),
        }
      : undefined;
  const riskControlTrend =
    typeof previousMonthSnapshot?.riskControlIndex === "number"
      ? {
          direction:
            kpis.riskControlIndex > previousMonthSnapshot.riskControlIndex
              ? ("up" as const)
              : kpis.riskControlIndex < previousMonthSnapshot.riskControlIndex
                ? ("down" as const)
                : ("neutral" as const),
          value: Math.abs(
            kpis.riskControlIndex - previousMonthSnapshot.riskControlIndex,
          ),
          label: t("vsLastMonth"),
        }
      : undefined;

  return (
    <div className="space-y-6">
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
            color="from-sky-500 to-sky-700 bg-linear-to-br"
            trend={qualityScoreTrend}
            sparklineData={qualitySparkline}
          />
          <StatCard
            title={t("pendingEffectivenessChecks")}
            value={kpis.pendingChecks}
            icon={ClipboardDocumentCheckIcon}
            color="from-amber-500 to-amber-700 bg-linear-to-br"
          />
          <StatCard
            title={t("riskControlIndex") || "Risk Control Index"}
            value={`${kpis.riskControlIndex}`}
            icon={ExclamationTriangleIcon}
            color="from-emerald-500 to-emerald-700 bg-linear-to-br"
            trend={riskControlTrend}
          />
          <StatCard
            title={t("pendingAcknowledgements")}
            value={kpis.pendingAcks}
            icon={CheckCircleIcon}
            color="from-sky-500 to-sky-700 bg-linear-to-br"
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

        <SurveyRiskPredictor
          readinessScore={readiness.readinessScore}
          evidenceIntegrityIndex={readiness.evidenceIntegrityIndex}
          criticalOpenFindings={readiness.criticalOpenFindings}
          openCapas={openCapas}
          reviewerSignOffRatePercent={
            assessorExportMetrics.reviewerSignOffRatePercent
          }
          initial={predictiveAuditRisk}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QualityTrendChart
            snapshots={visibleQualitySnapshots}
            historyError={qualityHistoryError}
          />
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
