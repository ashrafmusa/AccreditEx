/**
 * Multi-Facility Analytics Dashboard
 * Cross-facility compliance overview and benchmarking for corporate/group organizations.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import { useTenantStore } from "@/stores/useTenantStore";
import {
  getOrganizationFacilityReport,
  type OrganizationFacilityReport,
  type FacilityMetrics,
} from "@/services/multiFacilityService";
import { getChartTheme, CHART_COLORS } from "@/utils/chartTheme.tsx";
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
} from "@/components/icons";

// ── Helpers ────────────────────────────────────────────────────────────────

function complianceColor(rate: number): string {
  if (rate >= 80) return CHART_COLORS.success;
  if (rate >= 60) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
}

function complianceBadge(rate: number) {
  if (rate >= 80)
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (rate >= 60)
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

// ── Summary Card ───────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  value,
  sub,
  color = "text-brand-primary",
}) => (
  <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-5 flex items-start gap-4">
    <div
      className={`rounded-lg p-2.5 bg-brand-primary/10 dark:bg-brand-primary/20 ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
        {label}
      </p>
      <p className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ── Custom Tooltip ─────────────────────────────────────────────────────────

const ComplianceTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
        {label}
      </p>
      <p className="text-brand-primary font-semibold">
        {payload[0].value}% compliance
      </p>
    </div>
  );
};

// ── Seed / Demo Data for preview when no Firestore branches exist ───────────

const DEMO_METRICS: FacilityMetrics[] = [
  {
    branchId: "demo-1",
    branchName: "Main Hospital",
    location: "Riyadh, Central",
    activeProjects: 5,
    totalChecklistItems: 120,
    compliantItems: 102,
    partialItems: 12,
    nonCompliantItems: 6,
    complianceRate: 85,
    openFindings: 18,
    lastUpdated: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    branchId: "demo-2",
    branchName: "East Wing Clinic",
    location: "Riyadh, East",
    activeProjects: 3,
    totalChecklistItems: 80,
    compliantItems: 56,
    partialItems: 16,
    nonCompliantItems: 8,
    complianceRate: 70,
    openFindings: 24,
    lastUpdated: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    branchId: "demo-3",
    branchName: "North Lab Center",
    location: "Riyadh, North",
    activeProjects: 4,
    totalChecklistItems: 95,
    compliantItems: 88,
    partialItems: 5,
    nonCompliantItems: 2,
    complianceRate: 93,
    openFindings: 7,
    lastUpdated: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    branchId: "demo-4",
    branchName: "South Polyclinic",
    location: "Riyadh, South",
    activeProjects: 2,
    totalChecklistItems: 60,
    compliantItems: 36,
    partialItems: 14,
    nonCompliantItems: 10,
    complianceRate: 60,
    openFindings: 24,
    lastUpdated: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

// ── Main Page ──────────────────────────────────────────────────────────────

const MultiFacilityDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentOrganization, organizationId } = useTenantStore();

  const [report, setReport] = useState<OrganizationFacilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"compliance" | "name">("compliance");
  const [isDemo, setIsDemo] = useState(false);

  // Load data
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!organizationId) {
        // No org → show demo data
        setIsDemo(true);
        setReport({
          organizationId: "demo",
          organizationName: "Demo Organization",
          branches: [],
          facilityMetrics: DEMO_METRICS,
          averageCompliance: Math.round(
            DEMO_METRICS.reduce((s, m) => s + m.complianceRate, 0) /
              DEMO_METRICS.length,
          ),
          topPerformerName: "North Lab Center",
          needsAttentionName: "South Polyclinic",
          totalOpenFindings: DEMO_METRICS.reduce(
            (s, m) => s + m.openFindings,
            0,
          ),
          generatedAt: new Date().toISOString(),
        });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const r = await getOrganizationFacilityReport(
          organizationId,
          currentOrganization?.name ?? "Organization",
        );
        if (!cancelled) {
          if (r.facilityMetrics.length === 0) {
            // No branches in Firestore — show demo data with notice
            setIsDemo(true);
            setReport({
              ...r,
              facilityMetrics: DEMO_METRICS,
              averageCompliance: Math.round(
                DEMO_METRICS.reduce((s, m) => s + m.complianceRate, 0) /
                  DEMO_METRICS.length,
              ),
              topPerformerName: "North Lab Center",
              needsAttentionName: "South Polyclinic",
              totalOpenFindings: DEMO_METRICS.reduce(
                (s, m) => s + m.openFindings,
                0,
              ),
            });
          } else {
            setIsDemo(false);
            setReport(r);
          }
        }
      } catch {
        if (!cancelled) setError(t("multiFacilityError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, currentOrganization?.name, t]);

  const ct = getChartTheme(theme);

  const sortedMetrics = useMemo(() => {
    if (!report) return [];
    return [...report.facilityMetrics].sort((a, b) =>
      sortKey === "compliance"
        ? b.complianceRate - a.complianceRate
        : a.branchName.localeCompare(b.branchName),
    );
  }, [report, sortKey]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 p-2.5">
            <BuildingOffice2Icon className="h-7 w-7 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("multiFacilityDashboard")}
            </h1>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              {t("multiFacilitySubtitle")}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) =>
              setSortKey(e.target.value as "compliance" | "name")
            }
            className="text-sm border border-brand-border dark:border-dark-brand-border rounded-lg px-3 py-1.5 bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="compliance">{t("mfSortByCompliance")}</option>
            <option value="name">{t("mfSortByName")}</option>
          </select>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && !loading && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Demo data — </span>
            {t("multiFacilityNoBranchesHint")}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-24 rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      )}

      {report && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<BuildingOffice2Icon className="h-5 w-5" />}
              label={t("mfFacilities")}
              value={report.facilityMetrics.length}
              sub={
                currentOrganization?.name ??
                report.organizationName
              }
            />
            <SummaryCard
              icon={<ChartBarIcon className="h-5 w-5" />}
              label={t("mfAvgCompliance")}
              value={`${report.averageCompliance}%`}
              sub={t("mfBenchmarkLine")}
              color={
                report.averageCompliance >= 80
                  ? "text-green-600"
                  : report.averageCompliance >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
              }
            />
            <SummaryCard
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              label={t("mfOpenFindings")}
              value={report.totalOpenFindings}
              color="text-amber-600"
            />
            <SummaryCard
              icon={<MapPinIcon className="h-5 w-5" />}
              label={t("mfTopPerformer")}
              value={report.topPerformerName ?? "—"}
              sub={
                report.needsAttentionName
                  ? `${t("mfNeedsAttention")}: ${report.needsAttentionName}`
                  : undefined
              }
              color="text-green-600"
            />
          </div>

          {/* Compliance Bar Chart */}
          <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
              {t("mfComplianceByFacility")}
            </h2>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedMetrics.map((m) => ({
                    name:
                      m.branchName.length > 16
                        ? m.branchName.slice(0, 14) + "…"
                        : m.branchName,
                    fullName: m.branchName,
                    rate: m.complianceRate,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
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
                    width={42}
                  />
                  <Tooltip content={<ComplianceTooltip />} />
                  <ReferenceLine
                    y={report.averageCompliance}
                    stroke={CHART_COLORS.info}
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg ${report.averageCompliance}%`,
                      fill: CHART_COLORS.info,
                      fontSize: 11,
                      position: "insideTopRight",
                    }}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {sortedMetrics.map((m) => (
                      <Cell
                        key={m.branchId}
                        fill={complianceColor(m.complianceRate)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Facility Table */}
          <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border dark:border-dark-brand-border">
              <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("mfFacilityName")} — {t("mfStatusBreakdown")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-brand-border dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background">
                    <th className="px-6 py-3 font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("mfFacilityName")}
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary hidden sm:table-cell">
                      {t("mfLocation")}
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("mfActiveProjects")}
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("mfComplianceRate")}
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("mfOpenFindings")}
                    </th>
                    <th className="px-4 py-3 font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary hidden md:table-cell">
                      {t("mfLastUpdated")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.map((m, idx) => (
                    <tr
                      key={m.branchId}
                      className={`border-b border-brand-border dark:border-dark-brand-border last:border-0 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-colors ${
                        idx % 2 === 0
                          ? ""
                          : "bg-brand-background/50 dark:bg-dark-brand-background/50"
                      }`}
                    >
                      <td className="px-6 py-3 font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                        {m.branchName}
                      </td>
                      <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary hidden sm:table-cell">
                        {m.location || "—"}
                      </td>
                      <td className="px-4 py-3 text-brand-text-primary dark:text-dark-brand-text-primary">
                        {m.activeProjects}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${m.complianceRate}%`,
                                backgroundColor: complianceColor(
                                  m.complianceRate,
                                ),
                              }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${complianceBadge(m.complianceRate)}`}
                          >
                            {m.complianceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${m.openFindings > 20 ? "text-red-600 dark:text-red-400" : m.openFindings > 10 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
                        >
                          {m.openFindings}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary text-xs hidden md:table-cell">
                        {m.lastUpdated
                          ? new Date(m.lastUpdated).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {sortedMetrics.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary"
                      >
                        {t("mfNoData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance breakdown legend */}
          <div className="flex flex-wrap gap-4 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
              {t("mfCompliant")} (≥80%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />
              {t("mfPartial")} (60–79%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
              {t("mfNonCompliant")} (&lt;60%)
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MultiFacilityDashboardPage;
