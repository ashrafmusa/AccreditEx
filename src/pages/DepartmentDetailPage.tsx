import React, { useMemo, useState } from "react";
import {
  Department,
  User,
  Project,
  NavigationState,
  UserRole,
  ComplianceStatus,
  Risk,
} from "../types";
import { useTranslation } from "../hooks/useTranslation";
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "../components/icons";
import StatCard from "../components/common/StatCard";
import DepartmentUserList from "../components/departments/DepartmentUserList";
import DepartmentTaskTable from "../components/departments/DepartmentTaskTable";
import { aiAgentService } from "../services/aiAgentService";
import { useToast } from "../hooks/useToast";
import ReactMarkdown from "react-markdown";

interface DepartmentDetailPageProps {
  department: Department;
  users: User[];
  projects: Project[];
  risks: Risk[];
  currentUser: User;
  setNavigation: (state: NavigationState) => void;
  onUpdateDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
}

const DepartmentDetailPage: React.FC<DepartmentDetailPageProps> = (props) => {
  const {
    department,
    users,
    projects,
    risks,
    currentUser,
    setNavigation,
    onUpdateDepartment,
    onDeleteDepartment,
  } = props;
  const { t, lang } = useTranslation();
  const toast = useToast();

  const canModify = currentUser.role === UserRole.Admin;

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const departmentData = useMemo(() => {
    const usersInDept = users.filter((u) => u.departmentId === department.id);
    const userIds = new Set(usersInDept.map((u) => u.id));
    const now = new Date();

    const tasks = projects.flatMap((p) =>
      p.checklist
        .filter((item) => item.assignedTo && userIds.has(item.assignedTo))
        .map((item) => ({ ...item, projectName: p.name })),
    );

    const applicableTasks = tasks.filter(
      (t) => t.status !== ComplianceStatus.NotApplicable,
    );
    let score = 0;
    applicableTasks.forEach((item) => {
      if (item.status === ComplianceStatus.Compliant) score += 1;
      if (item.status === ComplianceStatus.PartiallyCompliant) score += 0.5;
    });
    const compliance =
      applicableTasks.length > 0
        ? Math.round((score / applicableTasks.length) * 100)
        : 100;

    const overdueActions = applicableTasks.filter((item) => {
      if (item.status === ComplianceStatus.Compliant || !item.dueDate)
        return false;
      const due = new Date(item.dueDate);
      return !Number.isNaN(due.getTime()) && due < now;
    }).length;

    const departmentCapas = projects
      .flatMap((project) => project.capaReports || [])
      .filter((capa) => capa.assignedTo && userIds.has(capa.assignedTo));
    const openCapas = departmentCapas.filter(
      (capa) => capa.status === "Open",
    ).length;

    const deptCriticalRisks = risks.filter(
      (risk) => risk.ownerId && userIds.has(risk.ownerId) && risk.impact >= 4,
    );
    const openCriticalRisks = deptCriticalRisks.filter(
      (risk) => risk.status === "Open",
    ).length;

    const onTimeRate =
      applicableTasks.length > 0
        ? Math.round(
            ((applicableTasks.length - overdueActions) /
              applicableTasks.length) *
              100,
          )
        : 100;
    const capaControlRate =
      departmentCapas.length > 0
        ? Math.round(
            ((departmentCapas.length - openCapas) / departmentCapas.length) *
              100,
          )
        : 100;
    const criticalRiskControlRate =
      deptCriticalRisks.length > 0
        ? Math.round(
            ((deptCriticalRisks.length - openCriticalRisks) /
              deptCriticalRisks.length) *
              100,
          )
        : 100;

    const readinessScore = Math.round(
      compliance * 0.4 +
        onTimeRate * 0.25 +
        capaControlRate * 0.2 +
        criticalRiskControlRate * 0.15,
    );

    return {
      usersInDept,
      tasks,
      compliance,
      overdueActions,
      openCapas,
      openCriticalRisks,
      readinessScore,
    };
  }, [department.id, users, projects, risks]);

  // Identify projects linked to this department (direct or via team members)
  const departmentProjects = useMemo(() => {
    const userIds = new Set(
      users.filter((u) => u.departmentId === department.id).map((u) => u.id),
    );
    return projects.filter(
      (p) =>
        p.departmentId === department.id ||
        (p.departmentIds || []).includes(department.id) ||
        (p.projectLead && userIds.has(p.projectLead.id)) ||
        p.teamMembers?.some((id) => userIds.has(id)),
    );
  }, [department.id, users, projects]);

  // Standard compliance breakdown for this department
  const standardBreakdown = useMemo(() => {
    const userIds = new Set(
      users.filter((u) => u.departmentId === department.id).map((u) => u.id),
    );
    const map = new Map<
      string,
      { total: number; compliant: number; nonCompliant: number }
    >();
    for (const proj of projects) {
      for (const item of proj.checklist) {
        // Include items assigned to department users OR items with this departmentId
        const belongsToDept = (item.assignedTo && userIds.has(item.assignedTo)) || item.departmentId === department.id;
        if (!belongsToDept) continue;
        if (!item.standardId) continue;
        if (!map.has(item.standardId))
          map.set(item.standardId, { total: 0, compliant: 0, nonCompliant: 0 });
        const entry = map.get(item.standardId)!;
        entry.total++;
        if (item.status === ComplianceStatus.Compliant) entry.compliant++;
        if (item.status === ComplianceStatus.NonCompliant) entry.nonCompliant++;
      }
    }
    return Array.from(map.entries())
      .map(([id, d]) => ({ standardId: id, ...d }))
      .sort((a, b) => b.nonCompliant - a.nonCompliant)
      .slice(0, 5);
  }, [department.id, users, projects]);

  const handleAIAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const data = departmentData;
      const stdInfo = standardBreakdown
        .map(
          (s) =>
            `${s.standardId}: ${s.compliant}/${s.total} compliant, ${s.nonCompliant} non-compliant`,
        )
        .join("\n");
      const projInfo = departmentProjects
        .map((p) => `${p.name} (${p.status}, ${p.progress}% complete)`)
        .join(", ");

      const prompt = `You are a healthcare accreditation department performance advisor. Analyze this department and provide actionable insights.

## Department: ${department.name.en || department.name.ar}
## Members: ${data.usersInDept.length}
## Readiness Score: ${data.readinessScore}%
## Compliance Rate: ${data.compliance}%
## Total Tasks: ${data.tasks.length}
## Overdue Actions: ${data.overdueActions}
## Open CAPAs: ${data.openCapas}
## Open Critical Risks: ${data.openCriticalRisks}

## Linked Projects: ${projInfo || "None"}

## Standard Compliance Breakdown:
${stdInfo || "No standards data available"}

Provide a concise department performance analysis:
1. **Performance Rating** — one-line verdict (Strong/Moderate/At Risk)
2. **Strengths** — 2-3 bullets of what's working well
3. **Risk Areas** — 2-3 specific standards or tasks that need attention
4. **Recommendations** — 3-4 prioritized action items to improve readiness
5. **Resource Needs** — staffing or training suggestions based on workload

Keep it brief, specific, and actionable for a department head.`;

      const response = await aiAgentService.chat(prompt, true);
      setAiInsight(response.response);
    } catch (error) {
      console.error("AI department analysis error:", error);
      toast.error("Failed to generate AI department analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <BuildingOffice2Icon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {department.name[lang]}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("departmentDetails")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t("departmentMembers")}
          value={departmentData.usersInDept.length}
          icon={UsersIcon}
        />
        <StatCard
          title={t("tasksAssigned")}
          value={departmentData.tasks.length}
          icon={ClipboardDocumentCheckIcon}
        />
        <StatCard
          title={t("complianceRate")}
          value={`${departmentData.compliance}%`}
          icon={CheckCircleIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Department Readiness"
          value={`${departmentData.readinessScore}%`}
          icon={ShieldCheckIcon}
        />
        <StatCard
          title="Overdue Actions"
          value={departmentData.overdueActions}
          icon={ExclamationTriangleIcon}
        />
        <StatCard
          title="Open CAPA (Dept)"
          value={departmentData.openCapas}
          icon={ClipboardDocumentCheckIcon}
        />
        <StatCard
          title="Open Critical Risks"
          value={departmentData.openCriticalRisks}
          icon={ExclamationTriangleIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <DepartmentUserList users={departmentData.usersInDept} />
        </div>
        <div className="lg:col-span-2">
          <DepartmentTaskTable tasks={departmentData.tasks} users={users} />
        </div>
      </div>

      {/* AI Department Insights */}
      <div className="bg-linear-to-r from-rose-50 to-cyan-50 dark:from-rose-900/10 dark:to-cyan-900/10 p-6 rounded-lg shadow-sm border border-cyan-200 dark:border-cyan-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 AI Department Performance Analysis
          </h3>
          <button
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
            className="bg-linear-to-r from-rose-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-rose-700 hover:to-cyan-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing...
              </>
            ) : aiInsight ? (
              <>🔄 Refresh</>
            ) : (
              <>🤖 Analyze Department</>
            )}
          </button>
        </div>
        {aiInsight ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{aiInsight}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get AI-powered insights on this department's readiness, risks, and
            improvement opportunities.
          </p>
        )}
      </div>

      {/* Department Projects */}
      {departmentProjects.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-3 dark:text-white flex items-center gap-2">
            📁 Department Projects ({departmentProjects.length})
          </h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {departmentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  setNavigation({ view: "projectDetail", projectId: p.id })
                }
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.status} • {p.checklist.length} items
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-10 text-right">
                    {p.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standards Compliance Breakdown */}
      {standardBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-3 dark:text-white flex items-center gap-2">
            📋 Top Standards by Department Tasks
          </h3>
          <div className="space-y-2">
            {standardBreakdown.map((s) => {
              const rate =
                s.total > 0 ? Math.round((s.compliant / s.total) * 100) : 0;
              return (
                <div
                  key={s.standardId}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {s.standardId}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      {s.compliant}✓
                    </span>
                    {s.nonCompliant > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        {s.nonCompliant}✗
                      </span>
                    )}
                    <span className="text-slate-600 dark:text-slate-400">
                      {s.total} total
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-medium ${
                        rate >= 80
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : rate >= 50
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetailPage;
