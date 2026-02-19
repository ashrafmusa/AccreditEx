/**
 * Proficiency Testing Tab
 * Track PT/EQA enrollments, results, and corrective actions
 */
import React, { useState, useMemo } from "react";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type { ProficiencyTest, PTStatus } from "@/types/labOps";
import { PT_STATUS_LABELS } from "@/types/labOps";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SearchIcon,
} from "@/components/icons";

const statusColor: Record<PTStatus, string> = {
  enrolled: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  sample_received:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  testing:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  reviewed:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  acceptable:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  unacceptable: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const ProficiencyTestingTab: React.FC = () => {
  const { proficiencyTests, addProficiencyTest, updateProficiencyTest } =
    useLabOpsStore();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PTStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<ProficiencyTest>>({
    status: "enrolled",
    acceptable: false,
    correctiveActionRequired: false,
  });

  const filtered = useMemo(() => {
    let list = proficiencyTests;
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
  }, [proficiencyTests, filterStatus, search]);

  const selected = useMemo(
    () => proficiencyTests.find((p) => p.id === selectedId),
    [proficiencyTests, selectedId],
  );

  // Summary stats
  const totalTests = proficiencyTests.length;
  const acceptable = proficiencyTests.filter(
    (p) => p.status === "acceptable",
  ).length;
  const unacceptable = proficiencyTests.filter(
    (p) => p.status === "unacceptable",
  ).length;
  const pending = proficiencyTests.filter(
    (p) => !["acceptable", "unacceptable"].includes(p.status),
  ).length;
  const acceptanceRate =
    acceptable + unacceptable > 0
      ? Math.round((acceptable / (acceptable + unacceptable)) * 100)
      : 100;

  const handleAdd = () => {
    if (!form.program || !form.analyteName || !form.labSection) return;
    const now = new Date().toISOString();
    const pt: ProficiencyTest = {
      id: `pt-${Date.now()}`,
      program: form.program || "",
      provider: form.provider || "",
      surveyId: form.surveyId || "",
      analyteName: form.analyteName || "",
      analyteCode: form.analyteCode,
      labSection: form.labSection || "",
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

  // ── Detail View ─────────

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            ← Back
          </Button>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            {selected.program}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}
          >
            {PT_STATUS_LABELS[selected.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Provider / Survey
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.provider}
            </p>
            <p className="text-xs text-gray-500">{selected.surveyId}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Analyte
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.analyteName}
            </p>
            {selected.analyteCode && (
              <p className="text-xs text-gray-500">
                Code: {selected.analyteCode}
              </p>
            )}
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Lab Section
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.labSection}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Enrollment Date
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.enrollmentDate}
            </p>
          </Card>
        </div>

        {/* Results */}
        {(selected.submittedValue !== undefined ||
          selected.peerMean !== undefined) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
              Results
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {selected.submittedValue !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Submitted
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
                    Peer Mean
                  </p>
                  <p className="text-lg font-bold dark:text-dark-brand-text-primary">
                    {selected.peerMean}
                  </p>
                </div>
              )}
              {selected.peerSD !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Peer SD
                  </p>
                  <p className="text-lg font-bold dark:text-dark-brand-text-primary">
                    {selected.peerSD}
                  </p>
                </div>
              )}
              {selected.sdIndex !== undefined && (
                <div>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    SD Index
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
                    Score
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
                  Acceptable?
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {selected.acceptable ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-red-600 font-medium">No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Corrective action */}
        {selected.correctiveActionRequired && (
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                Corrective Action Required
              </h3>
            </div>
            {selected.notes && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {selected.notes}
              </p>
            )}
          </Card>
        )}

        {/* Timeline */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3 items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Enrolled:
              </span>
              <span className="dark:text-dark-brand-text-primary">
                {selected.enrollmentDate}
              </span>
            </div>
            {selected.sampleReceivedDate && (
              <div className="flex gap-3 items-center">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Sample Received:
                </span>
                <span className="dark:text-dark-brand-text-primary">
                  {selected.sampleReceivedDate}
                </span>
              </div>
            )}
            {selected.resultSubmittedDate && (
              <div className="flex gap-3 items-center">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Submitted:
                </span>
                <span className="dark:text-dark-brand-text-primary">
                  {selected.resultSubmittedDate}
                </span>
              </div>
            )}
            {selected.reportDate && (
              <div className="flex gap-3 items-center">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${selected.acceptable ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  Report:
                </span>
                <span className="dark:text-dark-brand-text-primary">
                  {selected.reportDate}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── List View ─────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
          Proficiency Testing
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> Enroll New
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-brand-primary">{totalTests}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Total Enrollments
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p
            className={`text-2xl font-bold ${acceptanceRate >= 80 ? "text-green-600" : "text-red-600"}`}
          >
            {acceptanceRate}%
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Acceptance Rate
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Pending
          </p>
        </Card>
        <Card
          className={`p-3 text-center ${unacceptable > 0 ? "border-red-200 bg-red-50 dark:bg-red-900/20" : ""}`}
        >
          <p className="text-2xl font-bold text-red-600">{unacceptable}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Unacceptable
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PT programs…"
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PTStatus | "all")}
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          {Object.entries(PT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            New Enrollment
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Program *
              </label>
              <input
                value={form.program || ""}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                placeholder="CAP Chemistry Survey"
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Provider
              </label>
              <input
                value={form.provider || ""}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="CAP, AABB…"
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Survey ID
              </label>
              <input
                value={form.surveyId || ""}
                onChange={(e) => setForm({ ...form, surveyId: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Analyte *
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
                Lab Section *
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
                Enrollment Date
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
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Enroll
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium">Program / Analyte</th>
              <th className="px-3 py-2 font-medium">Section</th>
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">SD Index</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Status</th>
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[pt.status]}`}
                  >
                    {PT_STATUS_LABELS[pt.status]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No proficiency tests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProficiencyTestingTab;
