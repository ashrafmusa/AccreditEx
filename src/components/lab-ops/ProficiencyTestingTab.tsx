/**
 * Proficiency Testing Tab
 * PT Schemes, CAP tracking, cycle tracker, SDI trends, pass/fail analysis
 */
import {
  BeakerIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  PlusIcon,
  SearchIcon,
  XCircleIcon,
} from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type { ProficiencyTest, PTStatus } from "@/types/labOps";
import { PT_STATUS_LABELS } from "@/types/labOps";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PtView = "overview" | "schemes" | "cycleTracker" | "allTests";

// ── Helpers ──────────────────────────────────────────────

const STATUS_COLOR: Record<PTStatus, string> = {
  enrolled: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  sample_received:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  testing:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted:
    "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary",
  reviewed:
    "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary",
  acceptable:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  unacceptable: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const PT_SCHEMES = [
  {
    id: "CAP",
    name: "CAP Surveys",
    provider: "College of American Pathologists",
    type: "International",
    color: "blue",
    programs: [
      "Chemistry",
      "Hematology",
      "Microbiology",
      "Coagulation",
      "Urinalysis",
    ],
    cycles: "2–3 per year",
    frequency: "Every 6 months",
    description:
      "Gold-standard PT program accepted globally. Required for CAP accreditation. Covers 95+ analytes across all lab disciplines.",
    website: "cap.org",
  },
  {
    id: "EQAS",
    name: "EQAS / AABB",
    provider: "External Quality Assessment Scheme",
    type: "Regional",
    color: "emerald",
    programs: ["Transfusion Medicine", "Coagulation", "Blood Bank"],
    cycles: "4 per year",
    frequency: "Quarterly",
    description:
      "Specialized for blood bank and transfusion medicine. Widely accepted by MOH and Joint Commission International.",
    website: "aabb.org",
  },
  {
    id: "UK-NEQAS",
    name: "UK NEQAS",
    provider: "UK National External Quality Assessment Service",
    type: "International",
    color: "amber",
    programs: [
      "Clinical Chemistry",
      "Haematology",
      "Microbiology",
      "Immunology",
    ],
    cycles: "12 per year",
    frequency: "Monthly",
    description:
      "UK-based EQA scheme with monthly challenges. Widely used in Middle East for Oman OHAS compliance.",
    website: "ukneqas.org.uk",
  },
  {
    id: "RIQAS",
    name: "RIQAS",
    provider: "Randox International Quality Assessment Scheme",
    type: "International",
    color: "rose",
    programs: ["Chemistry", "Lipids", "Drugs of Abuse", "Tumor Markers"],
    cycles: "26 per year",
    frequency: "Bi-weekly",
    description:
      "High-frequency EQA with bi-weekly samples. Web-based reporting with SDI and bias calculations.",
    website: "randox.com",
  },
  {
    id: "LOCAL",
    name: "MOH / National EQA",
    provider: "Ministry of Health Oman",
    type: "Local",
    color: "teal",
    programs: ["Clinical Chemistry", "Haematology", "Microbiology"],
    cycles: "2 per year",
    frequency: "Semi-annual",
    description:
      "Mandatory MOH Oman national PT scheme. Required for laboratory license renewal and OHAS accreditation.",
    website: "moh.gov.om",
  },
];

const SCHEME_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-300",
      dot: "bg-blue-500",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-900/20",
      text: "text-rose-700 dark:text-rose-300",
      dot: "bg-rose-500",
    },
    teal: {
      bg: "bg-teal-50 dark:bg-teal-900/20",
      text: "text-teal-700 dark:text-teal-300",
      dot: "bg-teal-500",
    },
  };

// ── Overview panel ────────────────────────────────────────

const OverviewPanel: React.FC<{
  tests: ProficiencyTest[];
  onViewAll: () => void;
  onEnroll: () => void;
  t: (k: string) => string;
}> = ({ tests, onViewAll, onEnroll, t }) => {
  const acceptable = tests.filter((p) => p.status === "acceptable").length;
  const unacceptable = tests.filter((p) => p.status === "unacceptable").length;
  const pending = tests.filter(
    (p) => !["acceptable", "unacceptable"].includes(p.status),
  ).length;
  const caRequired = tests.filter((p) => p.correctiveActionRequired).length;
  const rate =
    acceptable + unacceptable > 0
      ? Math.round((acceptable / (acceptable + unacceptable)) * 100)
      : 100;

  const sdiData = tests
    .filter((p) => p.sdIndex !== undefined)
    .slice(-12)
    .map((p) => ({
      name: `${p.analyteName} (${p.surveyId || "—"})`,
      sdi: p.sdIndex!,
    }));

  const bySection = tests.reduce<
    Record<string, { acc: number; unacc: number }>
  >((acc, p) => {
    if (!acc[p.labSection]) acc[p.labSection] = { acc: 0, unacc: 0 };
    if (p.status === "acceptable") acc[p.labSection].acc++;
    if (p.status === "unacceptable") acc[p.labSection].unacc++;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-brand-primary">
            {tests.length}
          </p>
          <p className="text-xs mt-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("ptTotalEnrollments")}
          </p>
        </Card>
        <Card
          className={`p-4 text-center ${rate < 80 ? "border-red-300" : ""}`}
        >
          <p
            className={`text-3xl font-bold ${rate >= 80 ? "text-green-600" : "text-red-600"}`}
          >
            {rate}%
          </p>
          <p className="text-xs mt-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("ptAcceptanceRate")}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs mt-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("ptPending")}
          </p>
        </Card>
        <Card
          className={`p-4 text-center ${caRequired > 0 ? "border-red-300 bg-red-50 dark:bg-red-900/20" : ""}`}
        >
          <p className="text-3xl font-bold text-red-600">{caRequired}</p>
          <p className="text-xs mt-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("ptCARequired")}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sdiData.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-1 dark:text-dark-brand-text-primary flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-brand-primary" />
              {t("ptSDITrend")}
            </h3>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-3">
              {t("ptSDIExplain")}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={sdiData}
                margin={{ top: 4, right: 8, bottom: 44, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[-4, 4]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(2), "SDI"]}
                  labelStyle={{ fontSize: 11 }}
                />
                <ReferenceLine
                  y={2}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "+2", fontSize: 10 }}
                />
                <ReferenceLine
                  y={-2}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "−2", fontSize: 10 }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="sdi" radius={[4, 4, 0, 0]}>
                  {sdiData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={Math.abs(entry.sdi) <= 2 ? "#22c55e" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {Object.keys(bySection).length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary flex items-center gap-2">
              <BeakerIcon className="h-4 w-4 text-brand-primary" />
              {t("ptSectionBreakdown")}
            </h3>
            <div className="space-y-2">
              {Object.entries(bySection).map(([section, counts]) => {
                const total = counts.acc + counts.unacc;
                const pct =
                  total > 0 ? Math.round((counts.acc / total) * 100) : 100;
                return (
                  <div key={section}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium dark:text-dark-brand-text-primary">
                        {section}
                      </span>
                      <span
                        className={
                          pct >= 80 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${pct >= 80 ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {caRequired > 0 && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">
              {t("ptCAAlert")} ({caRequired})
            </h3>
          </div>
          <div className="space-y-1 text-sm">
            {tests
              .filter((p) => p.correctiveActionRequired)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <XCircleIcon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{p.analyteName}</span>
                  <span className="text-xs opacity-70">
                    — {p.program} / {p.labSection}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={onEnroll}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> {t("ptEnrollNew")}
        </Button>
        <Button
          variant="ghost"
          onClick={onViewAll}
          className="flex items-center gap-1.5"
        >
          <ListBulletIcon className="h-4 w-4" /> {t("ptViewAll")}
        </Button>
      </div>
    </div>
  );
};

// ── Schemes reference panel ──────────────────────────────

const SchemesPanel: React.FC<{ t: (k: string) => string }> = ({ t }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold dark:text-dark-brand-text-primary">
        {t("ptSchemesTitle")}
      </h2>
      <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
        {t("ptSchemesSubtitle")}
      </p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {PT_SCHEMES.map((scheme) => {
        const cls = SCHEME_COLORS[scheme.color];
        return (
          <Card key={scheme.id} className={`p-4 ${cls.bg}`}>
            <div className="flex items-start gap-3">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${cls.dot}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={`font-bold text-sm ${cls.text}`}>
                    {scheme.name}
                  </h3>
                  <span className="px-1.5 py-0.5 text-xs rounded bg-white/60 dark:bg-black/20 text-gray-600 dark:text-gray-300">
                    {scheme.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    ↻ {scheme.frequency}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {scheme.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {scheme.programs.map((prog) => (
                    <span
                      key={prog}
                      className="px-1.5 py-0.5 rounded text-xs bg-white/70 dark:bg-black/20 text-gray-700 dark:text-gray-300"
                    >
                      {prog}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {t("ptCycles")}: {scheme.cycles} · {scheme.website}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
      <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
        {t("ptSDILegend")}
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        {[
          {
            range: "SDI ≤ 1.5",
            color: "text-green-600",
            label: t("ptSDIExcellent"),
          },
          {
            range: "SDI 1.5–2.0",
            color: "text-amber-600",
            label: t("ptSDIWarning"),
          },
          { range: "SDI > 2.0", color: "text-red-600", label: t("ptSDIFail") },
          {
            range: "Score ≥ 80%",
            color: "text-gray-600",
            label: t("ptScorePass"),
          },
        ].map(({ range, color, label }) => (
          <div key={range}>
            <p className={`font-medium ${color}`}>{range}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ── Cycle tracker ────────────────────────────────────────

const CycleTrackerPanel: React.FC<{
  tests: ProficiencyTest[];
  t: (k: string) => string;
}> = ({ tests, t }) => {
  const [filterSection, setFilterSection] = useState<string>("all");

  const sections = useMemo(
    () => [
      "all",
      ...Array.from(new Set(tests.map((p) => p.labSection))).sort(),
    ],
    [tests],
  );

  const visible = useMemo(
    () =>
      filterSection === "all"
        ? tests
        : tests.filter((p) => p.labSection === filterSection),
    [tests, filterSection],
  );

  const cycles = useMemo(() => {
    const map = new Map<string, { label: string; tests: ProficiencyTest[] }>();
    visible.forEach((p) => {
      const key = `${p.provider || "Unknown"}  —  ${p.surveyId || "—"}`;
      if (!map.has(key)) map.set(key, { label: key, tests: [] });
      map.get(key)!.tests.push(p);
    });
    return Array.from(map.values());
  }, [visible]);

  if (tests.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>{t("ptNoCycles")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold dark:text-dark-brand-text-primary flex-1">
          {t("ptCycleTracker")}
        </h2>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          {sections.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? t("allSections") : s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {cycles.map((cycle) => {
          const acc = cycle.tests.filter(
            (p) => p.status === "acceptable",
          ).length;
          const unacc = cycle.tests.filter(
            (p) => p.status === "unacceptable",
          ).length;
          const pend = cycle.tests.filter(
            (p) => !["acceptable", "unacceptable"].includes(p.status),
          ).length;
          return (
            <Card key={cycle.label} className="p-4">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h3 className="font-semibold dark:text-dark-brand-text-primary">
                  {cycle.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  ✓ {acc} {t("acceptable")}
                </span>
                {unacc > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    ✗ {unacc} {t("unacceptable")}
                  </span>
                )}
                {pend > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    ⏳ {pend} {t("ptPending")}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {cycle.tests.map((p) => (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-lg border text-xs ${
                      p.status === "acceptable"
                        ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                        : p.status === "unacceptable"
                          ? "border-red-200 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {p.status === "acceptable" ? (
                        <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : p.status === "unacceptable" ? (
                        <XCircleIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0 inline-block" />
                      )}
                      <p className="font-medium dark:text-dark-brand-text-primary truncate">
                        {p.analyteName}
                      </p>
                    </div>
                    <p className="text-gray-500">{p.labSection}</p>
                    {p.sdIndex !== undefined && (
                      <p
                        className={
                          Math.abs(p.sdIndex) <= 2
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        SDI {p.sdIndex.toFixed(2)}
                      </p>
                    )}
                    {p.score !== undefined && (
                      <p
                        className={
                          p.score >= 80 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {p.score}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ── All tests list + detail ──────────────────────────────

const AllTestsPanel: React.FC<{
  tests: ProficiencyTest[];
  onAdd: () => void;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  form: Partial<ProficiencyTest>;
  setForm: (f: Partial<ProficiencyTest>) => void;
  onSave: () => void;
  onUpdate: (pt: ProficiencyTest) => void;
  t: (k: string) => string;
}> = ({
  tests,
  onAdd,
  showAdd,
  setShowAdd,
  form,
  setForm,
  onSave,
  onUpdate,
  t,
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PTStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = tests;
    if (filterStatus !== "all")
      list = list.filter((p) => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.program.toLowerCase().includes(q) ||
          p.analyteName.toLowerCase().includes(q) ||
          p.labSection.toLowerCase().includes(q) ||
          p.provider.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) =>
      b.enrollmentDate.localeCompare(a.enrollmentDate),
    );
  }, [tests, filterStatus, search]);

  const selected = tests.find((p) => p.id === selectedId);

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            ← {t("back")}
          </Button>
          <h2 className="text-lg font-bold dark:text-dark-brand-text-primary">
            {selected.program}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[selected.status]}`}
          >
            {PT_STATUS_LABELS[selected.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              {
                label: t("provider"),
                value: selected.provider,
                sub: selected.surveyId,
              },
              {
                label: t("ptAnalyte"),
                value: selected.analyteName,
                sub: selected.analyteCode
                  ? `Code: ${selected.analyteCode}`
                  : undefined,
              },
              { label: t("labSection"), value: selected.labSection },
              { label: t("enrollmentDate"), value: selected.enrollmentDate },
            ] as { label: string; value: string; sub?: string }[]
          ).map(({ label, value, sub }) => (
            <Card key={label} className="p-3">
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {label}
              </p>
              <p className="font-medium dark:text-dark-brand-text-primary">
                {value}
              </p>
              {sub && <p className="text-xs text-gray-500">{sub}</p>}
            </Card>
          ))}
        </div>

        {(selected.submittedValue !== undefined ||
          selected.peerMean !== undefined) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
              {t("results")}
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              {selected.submittedValue !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("submitted")}
                  </p>
                  <p className="text-lg font-bold dark:text-dark-brand-text-primary">
                    {selected.submittedValue}{" "}
                    <span className="text-xs font-normal">
                      {selected.submittedUnit}
                    </span>
                  </p>
                </div>
              )}
              {selected.peerMean !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("peerMean")}
                  </p>
                  <p className="text-lg font-bold dark:text-dark-brand-text-primary">
                    {selected.peerMean}
                  </p>
                </div>
              )}
              {selected.peerSD !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("peerSD")}
                  </p>
                  <p className="text-lg font-bold dark:text-dark-brand-text-primary">
                    {selected.peerSD}
                  </p>
                </div>
              )}
              {selected.sdIndex !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("sdIndex")}
                  </p>
                  <p
                    className={`text-lg font-bold ${Math.abs(selected.sdIndex) <= 2 ? "text-green-600" : "text-red-600"}`}
                  >
                    {selected.sdIndex.toFixed(2)}
                  </p>
                </div>
              )}
              {selected.score !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t("score")}
                  </p>
                  <p
                    className={`text-lg font-bold ${selected.score >= 80 ? "text-green-600" : "text-red-600"}`}
                  >
                    {selected.score}%
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {t("acceptableQuestion")}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {selected.acceptable ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">
                        {t("yes")}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-red-600 font-medium">
                        {t("no")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {selected.correctiveActionRequired && (
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                {t("correctiveActionRequired")}
              </h3>
            </div>
            {selected.notes && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {selected.notes}
              </p>
            )}
          </Card>
        )}

        {/* Inline result updater */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            {t("ptUpdateResult")}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("thStatus")}
              </label>
              <select
                defaultValue={selected.status}
                onChange={(e) =>
                  onUpdate({
                    ...selected,
                    status: e.target.value as PTStatus,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {Object.entries(PT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("submitted")} Value
              </label>
              <input
                type="number"
                defaultValue={selected.submittedValue}
                onBlur={(e) =>
                  onUpdate({
                    ...selected,
                    submittedValue: parseFloat(e.target.value),
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("sdIndex")}
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={selected.sdIndex}
                onBlur={(e) =>
                  onUpdate({
                    ...selected,
                    sdIndex: parseFloat(e.target.value),
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("score")} %
              </label>
              <input
                type="number"
                defaultValue={selected.score}
                onBlur={(e) => {
                  const sc = parseFloat(e.target.value);
                  onUpdate({
                    ...selected,
                    score: sc,
                    acceptable: sc >= 80,
                    status: sc >= 80 ? "acceptable" : "unacceptable",
                    correctiveActionRequired: sc < 80,
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            {t("timeline")}
          </h3>
          <div className="space-y-2 text-sm">
            {(
              [
                {
                  dot: "bg-blue-500",
                  label: t("enrolled"),
                  date: selected.enrollmentDate,
                },
                selected.sampleReceivedDate
                  ? {
                      dot: "bg-brand-primary",
                      label: t("sampleReceived"),
                      date: selected.sampleReceivedDate,
                    }
                  : null,
                selected.resultSubmittedDate
                  ? {
                      dot: "bg-brand-primary",
                      label: t("submittedTimeline"),
                      date: selected.resultSubmittedDate,
                    }
                  : null,
                selected.reportDate
                  ? {
                      dot: selected.acceptable ? "bg-green-500" : "bg-red-500",
                      label: t("report"),
                      date: selected.reportDate,
                    }
                  : null,
              ] as ({ dot: string; label: string; date: string } | null)[]
            )
              .filter(Boolean)
              .map((item) => (
                <div key={item!.label} className="flex gap-3 items-center">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${item!.dot}`}
                  />
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {item!.label}
                  </span>
                  <span className="dark:text-dark-brand-text-primary">
                    {item!.date}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold dark:text-dark-brand-text-primary">
          {t("proficiencyTesting")}
        </h2>
        <Button
          variant="primary"
          onClick={onAdd}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> {t("ptEnrollNew")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPTPrograms")}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PTStatus | "all")}
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">{t("allStatuses")}</option>
          {Object.entries(PT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {showAdd && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            {t("newEnrollment")}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("programRequired")}
              </label>
              <input
                value={form.program || ""}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                placeholder={t("capChemistrySurvey")}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("provider")}
              </label>
              <select
                value={form.provider || ""}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t("selectProvider")}</option>
                {PT_SCHEMES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="OTHER">{t("other")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("surveyId")}
              </label>
              <input
                value={form.surveyId || ""}
                onChange={(e) => setForm({ ...form, surveyId: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("analyteRequired")}
              </label>
              <input
                value={form.analyteName || ""}
                onChange={(e) =>
                  setForm({ ...form, analyteName: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("labSectionRequired")}
              </label>
              <input
                value={form.labSection || ""}
                onChange={(e) =>
                  setForm({ ...form, labSection: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("enrollmentDate")}
              </label>
              <input
                type="date"
                value={form.enrollmentDate || ""}
                onChange={(e) =>
                  setForm({ ...form, enrollmentDate: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              {t("cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={onSave}>
              {t("enroll")}
            </Button>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium">{t("thProgramAnalyte")}</th>
              <th className="px-3 py-2 font-medium">{t("thSection")}</th>
              <th className="px-3 py-2 font-medium">{t("thProvider")}</th>
              <th className="px-3 py-2 font-medium">{t("thSDIndex")}</th>
              <th className="px-3 py-2 font-medium">{t("thScore")}</th>
              <th className="px-3 py-2 font-medium">{t("thStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pt) => (
              <tr
                key={pt.id}
                onClick={() => setSelectedId(pt.id)}
                className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${pt.correctiveActionRequired ? "bg-red-50 dark:bg-red-900/10" : ""}`}
              >
                <td className="px-3 py-2.5">
                  <p className="font-medium dark:text-dark-brand-text-primary">
                    {pt.analyteName}
                  </p>
                  <p className="text-xs text-gray-500">{pt.program}</p>
                </td>
                <td className="px-3 py-2.5 text-xs">{pt.labSection}</td>
                <td className="px-3 py-2.5 text-xs">{pt.provider}</td>
                <td
                  className={`px-3 py-2.5 text-xs font-medium ${pt.sdIndex !== undefined ? (Math.abs(pt.sdIndex) <= 2 ? "text-green-600" : "text-red-600") : ""}`}
                >
                  {pt.sdIndex !== undefined ? pt.sdIndex.toFixed(2) : "—"}
                </td>
                <td
                  className={`px-3 py-2.5 text-xs font-medium ${pt.score !== undefined ? (pt.score >= 80 ? "text-green-600" : "text-red-600") : ""}`}
                >
                  {pt.score !== undefined ? `${pt.score}%` : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[pt.status]}`}
                  >
                    {PT_STATUS_LABELS[pt.status]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  {t("noProficiencyTests")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────

const ProficiencyTestingTab: React.FC = () => {
  const { t } = useTranslation();
  const { proficiencyTests, addProficiencyTest, updateProficiencyTest } =
    useLabOpsStore();

  const [view, setView] = useState<PtView>("overview");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<ProficiencyTest>>({
    status: "enrolled",
    acceptable: false,
    correctiveActionRequired: false,
  });

  const handleSave = () => {
    if (!form.program || !form.analyteName || !form.labSection) return;
    const now = new Date().toISOString();
    const pt: ProficiencyTest = {
      id: `pt-${Date.now()}`,
      program: form.program,
      provider: form.provider || "",
      surveyId: form.surveyId || "",
      analyteName: form.analyteName,
      analyteCode: form.analyteCode,
      labSection: form.labSection,
      enrollmentDate: form.enrollmentDate || now.split("T")[0],
      status: form.status || "enrolled",
      acceptable: false,
      correctiveActionRequired: false,
      createdAt: now,
      updatedAt: now,
    };
    addProficiencyTest(pt);
    setShowAdd(false);
    setForm({
      status: "enrolled",
      acceptable: false,
      correctiveActionRequired: false,
    });
  };

  const SUB_TABS: {
    key: PtView;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
  }[] = [
    { key: "overview", label: t("ptOverview"), icon: ChartBarIcon },
    { key: "schemes", label: t("ptSchemes"), icon: BeakerIcon },
    {
      key: "cycleTracker",
      label: t("ptCycleTracker"),
      icon: ClipboardDocumentCheckIcon,
    },
    { key: "allTests", label: t("ptAllTests"), icon: ListBulletIcon },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tab nav */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === key
                ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <OverviewPanel
          tests={proficiencyTests}
          onViewAll={() => setView("allTests")}
          onEnroll={() => {
            setView("allTests");
            setShowAdd(true);
          }}
          t={t}
        />
      )}
      {view === "schemes" && <SchemesPanel t={t} />}
      {view === "cycleTracker" && (
        <CycleTrackerPanel tests={proficiencyTests} t={t} />
      )}
      {view === "allTests" && (
        <AllTestsPanel
          tests={proficiencyTests}
          onAdd={() => setShowAdd(true)}
          showAdd={showAdd}
          setShowAdd={setShowAdd}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onUpdate={updateProficiencyTest}
          t={t}
        />
      )}
    </div>
  );
};


export default ProficiencyTestingTab;
