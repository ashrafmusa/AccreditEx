/**
 * ClinicDashboard — AccrediTex
 *
 * Org-type-aware dashboard for clinic/PHC customers.
 * Surfaces PHC-specific accreditation quick-access, key compliance metrics,
 * staff readiness, and appointment-cycle compliance in a focused layout.
 */

import StatCard from "@/components/common/StatCard";
import { useTheme } from "@/components/common/ThemeProvider";
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState, ProjectStatus } from "@/types";
import { CHART_COLORS, getChartTheme } from "@/utils/chartTheme";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── PHC Accreditation programs (most common for clinics) ──────────────────

const PHC_PROGRAMS = [
  {
    id: "cbahi-phc",
    name: "CBAHI — PHC Standards",
    shortName: "CBAHI",
    color: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-400",
    badgeColor:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
    description:
      "Saudi Central Board for Accreditation of Healthcare Institutions",
    domains: [
      "Patient Safety",
      "Clinical Care",
      "Infection Control",
      "Medication Management",
    ],
  },
  {
    id: "jci-ambulatory",
    name: "JCI — Ambulatory Care",
    shortName: "JCI Ambulatory",
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-400",
    badgeColor:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    description: "Joint Commission International — Ambulatory Care Standards",
    domains: [
      "Access & Continuity",
      "Patient Rights",
      "Assessment",
      "Care of Patients",
    ],
  },
  {
    id: "iso9001",
    name: "ISO 9001:2015",
    shortName: "ISO 9001",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    badgeColor:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    description: "Quality Management Systems — Requirements",
    domains: ["Context", "Leadership", "Planning", "Support", "Operation"],
  },
  {
    id: "haad",
    name: "HAAD / DOH",
    shortName: "HAAD",
    color: "bg-purple-500",
    textColor: "text-purple-700 dark:text-purple-400",
    badgeColor:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    description: "Abu Dhabi Department of Health Standards",
    domains: ["Clinical Governance", "Patient Safety", "Quality Improvement"],
  },
] as const;

// ── PHC Quick Actions ─────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  labelKey: string;
  icon: React.ElementType;
  nav: NavigationState;
  color: string;
}

const PHC_QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Standards",
    labelKey: "clinicQuickStandards",
    icon: ShieldCheckIcon,
    nav: { view: "accreditationHub" },
    color: "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20",
  },
  {
    label: "Documents",
    labelKey: "clinicQuickDocuments",
    icon: DocumentTextIcon,
    nav: { view: "documentControl" },
    color:
      "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40",
  },
  {
    label: "Audits",
    labelKey: "clinicQuickAudits",
    icon: ClipboardDocumentCheckIcon,
    nav: { view: "auditHub" },
    color:
      "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40",
  },
  {
    label: "Risk Management",
    labelKey: "clinicQuickRisk",
    icon: ExclamationTriangleIcon,
    nav: { view: "riskHub" },
    color:
      "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40",
  },
  {
    label: "Training",
    labelKey: "clinicQuickTraining",
    icon: AcademicCapIcon,
    nav: { view: "trainingHub" },
    color:
      "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40",
  },
  {
    label: "Schedule Rounding",
    labelKey: "clinicQuickRounding",
    icon: ClipboardDocumentListIcon,
    nav: { view: "qualityRounding" },
    color:
      "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/40",
  },
];

// ── Compliance bar tooltip ────────────────────────────────────────────────

const ClinicTooltip: React.FC<{
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
        {label}
      </p>
      <p className="text-brand-primary font-semibold">
        {payload[0].value}% compliant
      </p>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

interface ClinicDashboardProps {
  setNavigation: (state: NavigationState) => void;
}

const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentOrganization } = useTenantStore();
  const projects = useProjectStore((state) => state.projects);
  const { users } = useUserStore();
  const { documents, risks } = useAppStore();

  const ct = useMemo(() => getChartTheme(theme), [theme]);

  // ── Key metrics ──────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const activeProjects = projects.filter(
      (p) =>
        p.status === ProjectStatus.InProgress ||
        p.status === ProjectStatus.NotStarted,
    ).length;

    const completedProjects = projects.filter(
      (p) => p.status === ProjectStatus.Completed,
    ).length;

    const totalItems = projects.reduce(
      (sum, p) => sum + (p.totalItems ?? 0),
      0,
    );
    const compliantItems = projects.reduce(
      (sum, p) => sum + (p.compliantItems ?? 0),
      0,
    );
    const complianceRate =
      totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;

    const openRisks = (risks ?? []).filter(
      (r) => r.status === "Open" || r.status === "In Progress",
    ).length;

    const activeUsers = users.filter((u) => u.isActive !== false).length;

    return {
      activeProjects,
      completedProjects,
      complianceRate,
      openRisks,
      activeUsers,
      totalDocuments: documents?.length ?? 0,
    };
  }, [projects, users, risks, documents]);

  // ── Per-project compliance chart data ────────────────────────────────────

  const complianceChartData = useMemo(() => {
    return projects
      .filter((p) => (p.totalItems ?? 0) > 0)
      .slice(0, 6)
      .map((p) => ({
        name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name,
        rate: p.totalItems
          ? Math.round(((p.compliantItems ?? 0) / p.totalItems) * 100)
          : 0,
      }));
  }, [projects]);

  const barColor = (rate: number) =>
    rate >= 80
      ? CHART_COLORS.success
      : rate >= 60
        ? CHART_COLORS.warning
        : CHART_COLORS.danger;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 p-2.5">
            <BuildingOffice2Icon className="h-7 w-7 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {currentOrganization?.name ?? t("clinicDashboardTitle")}
            </h1>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              {t("clinicDashboardSubtitle")}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            {t("clinicType") || "Primary Health Clinic"}
          </span>
        </div>
      </div>

      {/* ── Key Metrics ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("activeProjects") || "Active Projects"}
          value={metrics.activeProjects}
          icon={FolderIcon}
          color="text-brand-primary"
          onClick={() => setNavigation({ view: "projects" })}
        />
        <StatCard
          title={t("overallCompliance")}
          value={`${metrics.complianceRate}%`}
          icon={ChartBarIcon}
          color={
            metrics.complianceRate >= 80
              ? "text-green-600"
              : metrics.complianceRate >= 60
                ? "text-amber-600"
                : "text-red-600"
          }
          onClick={() => setNavigation({ view: "analyticsHub" })}
        />
        <StatCard
          title={t("activeUsers")}
          value={metrics.activeUsers}
          icon={UserGroupIcon}
          color="text-blue-600"
          onClick={() => setNavigation({ view: "settings" })}
        />
        <StatCard
          title={t("openCapaReports")}
          value={metrics.openRisks}
          icon={ExclamationTriangleIcon}
          color={metrics.openRisks > 5 ? "text-red-600" : "text-amber-600"}
          onClick={() => setNavigation({ view: "riskHub" })}
        />
      </div>

      {/* ── PHC Accreditation Quick-Access ──────────────────────────────── */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-brand-primary" />
          <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("phcAccreditationPrograms")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PHC_PROGRAMS.map((prog) => (
            <button
              key={prog.id}
              type="button"
              onClick={() => setNavigation({ view: "accreditationHub" })}
              className="group text-left rounded-xl border border-brand-border dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background p-4 hover:border-brand-primary/40 dark:hover:border-brand-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${prog.color}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary group-hover:text-brand-primary transition-colors truncate">
                    {prog.shortName}
                  </p>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5 leading-relaxed line-clamp-2">
                    {prog.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {prog.domains.slice(0, 2).map((d) => (
                      <span
                        key={d}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${prog.badgeColor}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Quick Actions + Compliance Chart ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDaysIcon className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("clinicQuickActions")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PHC_QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.labelKey}
                  type="button"
                  onClick={() => setNavigation(action.nav)}
                  className={`flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center transition-all duration-150 ${action.color}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">
                    {t(action.labelKey) || action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compliance by Project Chart */}
        <div className="lg:col-span-3 bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("clinicComplianceByProject")}
            </h2>
          </div>
          {complianceChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-3 text-brand-text-secondary dark:text-dark-brand-text-secondary">
              <FolderIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">{t("clinicNoProjects")}</p>
              <button
                type="button"
                onClick={() => setNavigation({ view: "createProject" })}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                {t("clinicCreateFirstProject")}
              </button>
            </div>
          ) : (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complianceChartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={ct.gridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={ct.tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={ct.tickStyle}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <Tooltip content={<ClinicTooltip />} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {complianceChartData.map((entry) => (
                      <Cell key={entry.name} fill={barColor(entry.rate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── PHC Accreditation Cycle Guide ────────────────────────────────── */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircleIcon className="h-5 w-5 text-brand-primary" />
          <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("clinicCycleGuideTitle")}
          </h2>
          <span className="ml-auto text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("clinicCycleGuideSubtitle")}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              step: 1,
              titleKey: "clinicCycleStep1",
              label: "Gap Assessment",
              icon: ClipboardDocumentCheckIcon,
              nav: { view: "projects" } as NavigationState,
              color: "border-brand-primary/40 bg-brand-primary/5",
            },
            {
              step: 2,
              titleKey: "clinicCycleStep2",
              label: "Document Policies",
              icon: DocumentTextIcon,
              nav: { view: "documentControl" } as NavigationState,
              color:
                "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10",
            },
            {
              step: 3,
              titleKey: "clinicCycleStep3",
              label: "Staff Training",
              icon: AcademicCapIcon,
              nav: { view: "trainingHub" } as NavigationState,
              color:
                "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10",
            },
            {
              step: 4,
              titleKey: "clinicCycleStep4",
              label: "Internal Audit",
              icon: ClipboardDocumentListIcon,
              nav: { view: "qualityRounding" } as NavigationState,
              color:
                "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10",
            },
            {
              step: 5,
              titleKey: "clinicCycleStep5",
              label: "Readiness Review",
              icon: ChartBarIcon,
              nav: { view: "analyticsHub" } as NavigationState,
              color:
                "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10",
            },
          ].map(({ step, titleKey, label, icon: Icon, nav, color }) => (
            <button
              key={step}
              type="button"
              onClick={() => setNavigation(nav)}
              className={`group flex items-center gap-3 rounded-xl border-2 ${color} p-3 text-left hover:opacity-80 transition-all`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">
                {step}
              </span>
              <div className="min-w-0">
                <Icon className="h-4 w-4 text-brand-text-secondary dark:text-dark-brand-text-secondary mb-0.5" />
                <p className="text-xs font-semibold text-brand-text-primary dark:text-dark-brand-text-primary leading-tight">
                  {t(titleKey) || label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
