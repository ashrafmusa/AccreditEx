import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { provisionFacilityWorkspace } from "@/services/facilityProvisioningService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState } from "@/types";
import {
  AuditReadinessCheck,
  evaluateAuditReadiness,
  exportExecutiveReadinessReportCsv,
} from "@/utils/auditReadinessScanner";
import React, { useMemo, useState } from "react";

interface AuditReadinessScannerWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

const STATUS_STYLES: Record<
  AuditReadinessCheck["status"],
  {
    badge: string;
    border: string;
    bar: string;
    labelEn: string;
    labelAr: string;
  }
> = {
  pass: {
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/50",
    bar: "bg-emerald-500",
    labelEn: "Audit Ready",
    labelAr: "جاهز للتدقيق",
  },
  warning: {
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
    bar: "bg-amber-500",
    labelEn: "Attention Needed",
    labelAr: "يتطلب انتباه",
  },
  critical: {
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/50",
    bar: "bg-rose-500",
    labelEn: "Audit Risk",
    labelAr: "خطر عدم مطابقة",
  },
};

const AuditReadinessScannerWidget: React.FC<
  AuditReadinessScannerWidgetProps
> = ({ setNavigation }) => {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const { projects } = useProjectStore();
  const {
    documents = [],
    risks = [],
    auditPlans = [],
    departments = [],
    trainingPrograms = [],
  } = useAppStore();
  const { currentOrganization } = useTenantStore();
  const { currentUser } = useUserStore();

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const report = useMemo(
    () =>
      evaluateAuditReadiness({
        projects,
        documents,
        risks,
        auditPlans,
        departments,
        trainingPrograms,
      }),
    [projects, documents, risks, auditPlans, departments, trainingPrograms],
  );

  const isEmptyWorkspace =
    projects.length === 0 && departments.length === 0 && documents.length === 0;

  const handleQuickProvision = async () => {
    if (!currentUser || isProvisioning) return;
    setIsProvisioning(true);
    setProvisionSuccess(null);
    try {
      const program =
        currentUser.profile?.accreditationProgram ||
        (currentOrganization?.settings?.accreditationProgram as string) ||
        "cbahi";
      const orgType =
        currentOrganization?.type ||
        currentUser.profile?.organizationType ||
        "hospital";
      const orgSize =
        currentUser.profile?.organizationSize ||
        (currentOrganization?.settings?.organizationSize as
          | "small"
          | "medium"
          | "enterprise") ||
        "medium";

      const res = await provisionFacilityWorkspace({
        user: currentUser,
        program,
        organizationName:
          currentOrganization?.name ||
          currentUser.profile?.organizationName ||
          "Healthcare Facility",
        organizationType: orgType,
        organizationSize: orgSize,
        autoProvisionStarterPack: true,
      });

      setProvisionSuccess(
        isAr
          ? `تم تهيئة ${res.departmentsCreated} أقسام و${res.documentsCreated} سياسات ومشروع جاهزية أساسي بنجاح.`
          : `Provisioned ${res.departmentsCreated} departments, ${res.documentsCreated} starter policies, and 1 baseline project.`,
      );
    } catch (err) {
      console.error("Failed to quick-provision starter blueprint:", err);
    } finally {
      setIsProvisioning(false);
    }
  };

  const tierBadge =
    report.tier === "survey_ready"
      ? {
          text: isAr ? "جاهز لزيارة الاعتماد" : "Survey Ready",
          className:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
        }
      : report.tier === "attention_needed"
        ? {
            text: isAr ? "يتطلب استكمال بعض الأدلة" : "Attention Needed",
            className:
              "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700",
          }
        : {
            text: isAr ? "فجوات حرجة قبل التدقيق" : "High Audit Risk",
            className:
              "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700",
          };

  return (
    <section
      aria-label={
        isAr
          ? "فاحص الجاهزية للتدقيق وكشف فجوات الاعتماد"
          : "Pre-Survey Audit-Readiness & Blind-Spot Scanner"
      }
      data-testid="audit-readiness-scanner"
      className="rounded-2xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface shadow-sm p-5 space-y-5"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {isAr
                  ? "فاحص الجاهزية للتدقيق وكشف فجوات الاعتماد"
                  : "Pre-Survey Audit-Readiness & Blind-Spot Scanner"}
              </h2>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${tierBadge.className}`}
              >
                {tierBadge.text} ({report.overallScore}%)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              {isAr
                ? "فحص تلقائي لـ 6 محاور أساسية يركز عليها المقيمون (تكامل الأدلة، صلاحية السياسات، إغلاق الإجراءات التصحيحية، وسجل المخاطر)."
                : "Automated 6-point inspection detecting unverified compliance items, expired policies, overdue CAPAs, and survey blind spots."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isEmptyWorkspace && (
            <button
              type="button"
              onClick={handleQuickProvision}
              disabled={isProvisioning}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-60 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              {isProvisioning
                ? isAr
                  ? "جاري تهيئة المنشأة..."
                  : "Provisioning Blueprint..."
                : isAr
                  ? "تهيئة الحزمة التأسيسية للمنشأة"
                  : "Provision Starter Facility Blueprint"}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              exportExecutiveReadinessReportCsv(
                report,
                currentOrganization?.name ||
                  currentUser?.profile?.organizationName ||
                  "Healthcare Facility",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-brand-text-primary dark:text-dark-brand-text-primary px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-brand-primary" />
            {isAr
              ? "تصدير تقرير الجاهزية (CSV)"
              : "Export Executive Readiness Report"}
          </button>
        </div>
      </div>

      {provisionSuccess && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{provisionSuccess}</span>
        </div>
      )}

      {/* Key Blind-Spot Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 p-3">
          <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {isAr
              ? "معايير مطابقة بدون دليل"
              : "Compliant Without Evidence"}
          </div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              report.unverifiedCompliantItems > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {report.unverifiedCompliantItems}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 p-3">
          <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {isAr ? "وثائق متجاوزة للمراجعة" : "Expired / Overdue Policies"}
          </div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              report.expiredDocuments > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {report.expiredDocuments}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 p-3">
          <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {isAr ? "إجراءات تصحيحية متأخرة" : "Overdue CAPA Actions"}
          </div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              report.overdueCapas > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {report.overdueCapas}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 p-3">
          <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {isAr ? "مخاطر حرجة مفتوحة" : "Open High/Critical Risks"}
          </div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              report.openHighRisks > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {report.openHighRisks}
          </div>
        </div>
      </div>

      {/* 6 Audit-Readiness Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {report.checks.map((check) => {
          const style = STATUS_STYLES[check.status];
          const blindSpot = isAr ? check.blindSpotAr : check.blindSpotEn;
          return (
            <div
              key={check.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between bg-white dark:bg-gray-900/40 ${style.border}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {isAr ? check.titleAr : check.titleEn}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}
                  >
                    {check.score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                    style={{ width: `${Math.min(100, Math.max(5, check.score))}%` }}
                  />
                </div>

                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {isAr ? check.summaryAr : check.summaryEn}
                </p>

                {blindSpot && (
                  <div className="rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 px-2.5 py-1.5 flex items-start gap-1.5">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200 leading-tight">
                      {blindSpot}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {check.metricBadge}
                </span>
                <button
                  type="button"
                  onClick={() => setNavigation(check.navigation)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                >
                  <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                  {isAr ? check.actionLabelAr : check.actionLabelEn}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AuditReadinessScannerWidget;
