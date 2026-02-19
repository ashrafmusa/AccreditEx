import React, { useMemo, useState, useCallback } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import {
  CAPAssessment,
  CAPAssessmentMethod,
  CAPTestingPhase,
  CAPAssessmentStatus,
  CAP_METHOD_LABELS,
  CAP_PHASE_LABELS,
  CAP_LAB_DISCIPLINES,
  UserRole,
} from "@/types";
import { Button, EmptyState } from "@/components/ui";
import { PlusIcon, CheckCircleIcon } from "@/components/icons";

const RESULT_COLORS = {
  competent:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  needs_improvement:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  not_competent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<CAPAssessmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function computeStatus(a: CAPAssessment): CAPAssessmentStatus {
  if (a.status === "completed") return "completed";
  if (a.status === "in_progress") return "in_progress";
  if (new Date(a.scheduledDate) < new Date() && a.status !== "completed")
    return "overdue";
  return "scheduled";
}

const EMPTY_FORM: Omit<CAPAssessment, "id" | "createdAt"> = {
  userId: "",
  assessorId: "",
  competencyId: "",
  method: "direct_observation",
  testingPhase: "analytical",
  labDiscipline: "",
  scheduledDate: "",
  status: "scheduled",
};

type TabView = "dashboard" | "schedule" | "form";

const CAPAssessmentTab: React.FC = () => {
  const { currentUser, users, updateUser } = useUserStore();
  const { competencies } = useAppStore();
  const isAdmin = currentUser?.role === UserRole.Admin;

  const [view, setView] = useState<TabView>("dashboard");
  const [assessments, setAssessments] = useState<CAPAssessment[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");

  // All assessments across users (stored on user records conceptually — using local state for now)
  const enrichedAssessments = useMemo(
    () =>
      assessments.map((a) => ({
        ...a,
        computedStatus: computeStatus(a),
        userName: users.find((u) => u.id === a.userId)?.name ?? "Unknown",
        assessorName:
          users.find((u) => u.id === a.assessorId)?.name ?? "Unknown",
        competencyName:
          competencies.find((c) => c.id === a.competencyId)?.name?.en ??
          a.competencyId,
      })),
    [assessments, users, competencies],
  );

  const filteredAssessments = useMemo(() => {
    let list = enrichedAssessments;
    if (filterMethod !== "all")
      list = list.filter((a) => a.method === filterMethod);
    if (filterPhase !== "all")
      list = list.filter((a) => a.testingPhase === filterPhase);
    if (!isAdmin)
      list = list.filter(
        (a) => a.userId === currentUser?.id || a.assessorId === currentUser?.id,
      );
    return list.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  }, [enrichedAssessments, filterMethod, filterPhase, isAdmin, currentUser]);

  // Stats
  const stats = useMemo(() => {
    const total = enrichedAssessments.length;
    const completed = enrichedAssessments.filter(
      (a) => a.computedStatus === "completed",
    ).length;
    const overdue = enrichedAssessments.filter(
      (a) => a.computedStatus === "overdue",
    ).length;
    const methodCoverage = new Set(
      enrichedAssessments
        .filter((a) => a.computedStatus === "completed")
        .map((a) => a.method),
    ).size;
    return { total, completed, overdue, methodCoverage };
  }, [enrichedAssessments]);

  const handleSave = useCallback(() => {
    if (!form.userId || !form.competencyId || !form.scheduledDate) return;
    const now = new Date().toISOString();
    if (editingId) {
      setAssessments((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)),
      );
    } else {
      const newA: CAPAssessment = {
        ...form,
        id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        createdAt: now,
      };
      setAssessments((prev) => [...prev, newA]);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setView("schedule");
  }, [form, editingId]);

  const handleComplete = useCallback(
    (id: string, score: number, result: CAPAssessment["result"]) => {
      setAssessments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "completed" as const,
                completedDate: new Date().toISOString(),
                score,
                result,
              }
            : a,
        ),
      );
    },
    [],
  );

  const handleEdit = useCallback((a: CAPAssessment) => {
    setForm(a);
    setEditingId(a.id);
    setView("form");
  }, []);

  const inputCls =
    "text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary w-full";
  const labUsers = users.filter((u) => u.isActive !== false);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            CAP Competency Assessment
          </h3>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            College of American Pathologists — 6-method competency assessment
            tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "dashboard" ? "primary" : "ghost"}
            onClick={() => setView("dashboard")}
            className="text-xs"
          >
            Dashboard
          </Button>
          <Button
            variant={view === "schedule" ? "primary" : "ghost"}
            onClick={() => setView("schedule")}
            className="text-xs"
          >
            Assessments
          </Button>
          {isAdmin && (
            <Button
              variant={view === "form" ? "primary" : "ghost"}
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setView("form");
              }}
              className="text-xs flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" /> New
            </Button>
          )}
        </div>
      </div>

      {/* ── Dashboard ── */}
      {view === "dashboard" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-brand-primary-600 dark:text-brand-primary-400">
                {stats.total}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Total Assessments
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Completed
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.overdue}
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Overdue
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.methodCoverage}/6
              </div>
              <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Methods Used
              </div>
            </div>
          </div>

          {/* 6-Method Coverage Grid */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              CAP 6-Method Coverage
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                Object.entries(CAP_METHOD_LABELS) as [
                  CAPAssessmentMethod,
                  string,
                ][]
              ).map(([method, label]) => {
                const count = enrichedAssessments.filter(
                  (a) =>
                    a.method === method && a.computedStatus === "completed",
                ).length;
                const hasAny = count > 0;
                return (
                  <div
                    key={method}
                    className={`rounded-lg p-3 border ${hasAny ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10" : "border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`h-3 w-3 rounded-full ${hasAny ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      />
                      <span className="text-xs font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                        {label}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {count}
                    </div>
                    <div className="text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      completed assessments
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testing Phase Summary */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              Testing Phase Distribution
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(
                Object.entries(CAP_PHASE_LABELS) as [CAPTestingPhase, string][]
              ).map(([phase, label]) => {
                const count = enrichedAssessments.filter(
                  (a) => a.testingPhase === phase,
                ).length;
                const completed = enrichedAssessments.filter(
                  (a) =>
                    a.testingPhase === phase &&
                    a.computedStatus === "completed",
                ).length;
                return (
                  <div
                    key={phase}
                    className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-3"
                  >
                    <div className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {label}
                    </div>
                    <div className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {completed}/{count}
                    </div>
                    <div className="text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      completed / total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Assessments List ── */}
      {view === "schedule" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className={`${inputCls} w-auto`}
            >
              <option value="all">All Methods</option>
              {Object.entries(CAP_METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className={`${inputCls} w-auto`}
            >
              <option value="all">All Phases</option>
              {Object.entries(CAP_PHASE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {filteredAssessments.length === 0 ? (
            <EmptyState
              title="No Assessments"
              description="Schedule a CAP competency assessment to get started."
              icon={<CheckCircleIcon className="h-10 w-10 text-gray-400" />}
            />
          ) : (
            <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Staff
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Competency
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Method
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Phase
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Date
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Status
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Result
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
                  {filteredAssessments.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                        {a.userName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {a.competencyName}
                        {a.labDiscipline && (
                          <span className="ml-1 text-xs text-brand-text-secondary">
                            ({a.labDiscipline})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {CAP_METHOD_LABELS[a.method]}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {CAP_PHASE_LABELS[a.testingPhase]}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {a.scheduledDate}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.computedStatus]}`}
                        >
                          {a.computedStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {a.result ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RESULT_COLORS[a.result]}`}
                          >
                            {a.result.replace("_", " ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        {a.computedStatus !== "completed" && isAdmin && (
                          <button
                            onClick={() => handleComplete(a.id, 4, "competent")}
                            className="text-green-600 dark:text-green-400 hover:underline text-xs"
                          >
                            Complete
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(a)}
                            className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── New / Edit Form ── */}
      {view === "form" && isAdmin && (
        <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt rounded-lg p-4 space-y-4 max-w-2xl">
          <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {editingId ? "Edit Assessment" : "Schedule New Assessment"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Staff */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Staff Member *
              </label>
              <select
                value={form.userId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, userId: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select...</option>
                {labUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessor */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Assessor *
              </label>
              <select
                value={form.assessorId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assessorId: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select...</option>
                {labUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Competency */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Competency *
              </label>
              <select
                value={form.competencyId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, competencyId: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select...</option>
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name?.en ?? c.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Lab Discipline */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Lab Discipline
              </label>
              <select
                value={form.labDiscipline ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, labDiscipline: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select...</option>
                {CAP_LAB_DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Method */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Assessment Method *
              </label>
              <select
                value={form.method}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    method: e.target.value as CAPAssessmentMethod,
                  }))
                }
                className={inputCls}
              >
                {Object.entries(CAP_METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Testing Phase */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Testing Phase *
              </label>
              <select
                value={form.testingPhase}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    testingPhase: e.target.value as CAPTestingPhase,
                  }))
                }
                className={inputCls}
              >
                {Object.entries(CAP_PHASE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, scheduledDate: e.target.value }))
                }
                className={inputCls}
              />
            </div>

            {/* Score & Result (edit mode / completion) */}
            {editingId && (
              <>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                    Score (1-5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.score ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        score: +e.target.value || undefined,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                    Result
                  </label>
                  <select
                    value={form.result ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        result: (e.target.value ||
                          undefined) as CAPAssessment["result"],
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="">Pending</option>
                    <option value="competent">Competent</option>
                    <option value="needs_improvement">Needs Improvement</option>
                    <option value="not_competent">Not Competent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as CAPAssessmentStatus,
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Findings */}
          <div>
            <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
              Findings / Notes
            </label>
            <textarea
              value={form.findings ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, findings: e.target.value }))
              }
              rows={3}
              className={inputCls}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={
                !form.userId || !form.competencyId || !form.scheduledDate
              }
            >
              {editingId ? "Update" : "Schedule Assessment"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setView("schedule");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CAPAssessmentTab;
