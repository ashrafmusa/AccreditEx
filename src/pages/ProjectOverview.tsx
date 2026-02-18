import React, { useState } from "react";
import { Project, User, ComplianceStatus, UserRole } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import StatCard from "@/components/common/StatCard";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { useUserStore } from "@/stores/useUserStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAppStore } from "@/stores/useAppStore";
import { aiAgentService } from "@/services/aiAgentService";
import { useToast } from "@/hooks/useToast";
import ReactMarkdown from "react-markdown";

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  const { t, lang } = useTranslation();
  const { users, currentUser } = useUserStore();
  const { updateProject } = useProjectStore();
  const toast = useToast();
  const [isBriefing, setIsBriefing] = useState(false);
  const [briefingContent, setBriefingContent] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const canManageTeam =
    currentUser?.role === UserRole.Admin ||
    currentUser?.id === project.projectLead?.id;

  // Resolve departments (both legacy single and new multi)
  const { departments } = useAppStore();
  const projectDepartment = project.departmentId
    ? departments.find((d) => d.id === project.departmentId)
    : null;
  const projectDepartments = (project.departmentIds || [])
    .map((id) => departments.find((d) => d.id === id))
    .filter(Boolean);

  const stats = React.useMemo(() => {
    const total = project.checklist.length;
    const compliant = project.checklist.filter(
      (i) => i.status === ComplianceStatus.Compliant,
    ).length;
    const nonCompliant = project.checklist.filter(
      (i) => i.status === ComplianceStatus.NonCompliant,
    ).length;
    const openCapa = (project.capaReports || []).filter(
      (c) => c.status === "Open",
    ).length;
    return { total, compliant, nonCompliant, openCapa };
  }, [project]);

  const handleAIBriefing = async () => {
    if (isBriefing) return;
    setIsBriefing(true);
    try {
      const partial = project.checklist.filter(
        (i) => i.status === ComplianceStatus.PartiallyCompliant,
      ).length;
      const notStarted = project.checklist.filter(
        (i) => i.status === ComplianceStatus.NotStarted,
      ).length;
      const designControls = project.designControls || [];
      const pdcaCycles = project.pdcaCycles || [];
      const surveys = project.mockSurveys || [];

      const prompt = `You are a healthcare accreditation project advisor. Provide a brief executive health briefing for this project.

## Project: ${project.name}
## Status: ${project.status}
## Checklist: ${stats.total} items — ${stats.compliant} Compliant, ${stats.nonCompliant} Non-Compliant, ${partial} Partial, ${notStarted} Not Started
## Open CAPAs: ${stats.openCapa}
## Design Controls: ${designControls.length} items
## PDCA Cycles: ${pdcaCycles.length}
## Mock Surveys: ${surveys.length}

Provide a concise briefing with:
1. **Overall Health** — one-line summary (Green/Yellow/Red)
2. **Key Strengths** — what's going well (2-3 bullets)
3. **Attention Areas** — risks or gaps to address now (2-3 bullets)
4. **Next Steps** — recommended immediate actions (2-3 bullets)

Keep it brief and actionable. Use healthcare accreditation context.`;

      const response = await aiAgentService.chat(prompt, true);
      setBriefingContent(response.response);
    } catch (error) {
      console.error("AI briefing error:", error);
      toast.error("Failed to generate AI health briefing.");
    } finally {
      setIsBriefing(false);
    }
  };

  // Build team from explicit teamMembers field + projectLead + checklist assignees
  const teamMemberIds = new Set<string>(project.teamMembers || []);
  if (project.projectLead?.id) {
    teamMemberIds.add(project.projectLead.id);
  }
  // Also include anyone assigned to checklist items (backward compat)
  project.checklist.forEach((item) => {
    if (item.assignedTo) teamMemberIds.add(item.assignedTo);
  });
  const teamMembers = Array.from(teamMemberIds)
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => !!u);

  const handleAddTeamMember = async (userId: string) => {
    const currentMembers = project.teamMembers || [];
    if (currentMembers.includes(userId)) {
      toast.info("User is already a team member.");
      return;
    }
    try {
      await updateProject({
        ...project,
        teamMembers: [...currentMembers, userId],
      });
      toast.success("Team member added.");
      setShowAddMember(false);
    } catch {
      toast.error("Failed to add team member.");
    }
  };

  const handleRemoveTeamMember = async (userId: string) => {
    if (userId === project.projectLead?.id) {
      toast.error("Cannot remove the project lead from the team.");
      return;
    }
    const currentMembers = project.teamMembers || [];
    try {
      await updateProject({
        ...project,
        teamMembers: currentMembers.filter((id) => id !== userId),
      });
      toast.success("Team member removed.");
    } catch {
      toast.error("Failed to remove team member.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Department Badges */}
      {(projectDepartment || projectDepartments.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {projectDepartment &&
            !projectDepartments.some((d) => d?.id === projectDepartment.id) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                🏢 {projectDepartment.name.en || projectDepartment.name.ar}
              </span>
            )}
          {projectDepartments.map(
            (d) =>
              d && (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                >
                  🏢 {d.name.en || d.name.ar}
                </span>
              ),
          )}
        </div>
      )}

      {/* Per-Department Compliance Breakdown (collapsible) */}
      {project.checklist.some((i) => i.departmentId) &&
        departments.length > 0 && (
          <details className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border group">
            <summary className="p-4 cursor-pointer select-none flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              <span className="flex items-center gap-2">
                🏢 Department Compliance Overview
              </span>
              <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400 group-open:hidden">
                {(() => {
                  const deptCount = new Set(
                    project.checklist
                      .map((i) => i.departmentId)
                      .filter(Boolean),
                  ).size;
                  return `${deptCount} departments`;
                })()}
              </span>
            </summary>
            <div className="px-4 pb-4 space-y-2">
              {(() => {
                const deptMap = new Map<
                  string,
                  { total: number; compliant: number }
                >();
                for (const item of project.checklist) {
                  if (!item.departmentId) continue;
                  if (!deptMap.has(item.departmentId))
                    deptMap.set(item.departmentId, { total: 0, compliant: 0 });
                  const d = deptMap.get(item.departmentId)!;
                  d.total++;
                  if (item.status === ComplianceStatus.Compliant) d.compliant++;
                }
                return Array.from(deptMap.entries()).map(([deptId, s]) => {
                  const dept = departments.find((d) => d.id === deptId);
                  const pct =
                    s.total > 0 ? Math.round((s.compliant / s.total) * 100) : 0;
                  return (
                    <div key={deptId} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-900 dark:text-white w-36 truncate">
                        {dept ? dept.name.en || dept.name.ar : deptId}
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold w-10 text-right ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}
                      >
                        {pct}%
                      </span>
                      <span className="text-[10px] text-gray-500 w-14 text-right">
                        {s.compliant}/{s.total}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </details>
        )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t("compliant")}
          value={`${stats.compliant} / ${stats.total}`}
          icon={CheckCircleIcon}
          color="from-green-500 to-green-700"
        />
        <StatCard
          title={t("nonCompliant")}
          value={stats.nonCompliant}
          icon={ExclamationTriangleIcon}
          color="from-red-500 to-red-700"
        />
        <StatCard
          title={t("openCapaReports")}
          value={stats.openCapa}
          icon={ClockIcon}
          color="from-yellow-500 to-yellow-700"
        />
      </div>

      {/* AI Health Briefing */}
      <div className="bg-gradient-to-r from-rose-50 to-cyan-50 dark:from-rose-900/10 dark:to-cyan-900/10 p-6 rounded-lg shadow-sm border border-cyan-200 dark:border-cyan-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 AI Project Health Briefing
          </h3>
          <button
            onClick={handleAIBriefing}
            disabled={isBriefing}
            className="bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-rose-700 hover:to-cyan-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isBriefing ? (
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
            ) : briefingContent ? (
              <>🔄 Refresh Briefing</>
            ) : (
              <>🤖 Generate Briefing</>
            )}
          </button>
        </div>
        {briefingContent ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{briefingContent}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click "Generate Briefing" for an AI-powered executive summary of
            your project health, risks, and recommended next steps.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t("teamMembers")}</h3>
            {canManageTeam && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-brand-primary"
                title="Add team member"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Add Member Dropdown */}
          {showAddMember && canManageTeam && (
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Add Team Member
              </div>
              <div className="max-h-40 overflow-y-auto">
                {users
                  .filter(
                    (u) => !teamMemberIds.has(u.id) && u.isActive !== false,
                  )
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAddTeamMember(u.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {u.role}
                          {u.department ? ` • ${u.department}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                {users.filter(
                  (u) => !teamMemberIds.has(u.id) && u.isActive !== false,
                ).length === 0 && (
                  <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    All users are already on the team.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {teamMembers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="grow min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.id === project.projectLead?.id
                      ? t("projectLead")
                      : user.role}
                  </p>
                </div>
                {canManageTeam && user.id !== project.projectLead?.id && (
                  <button
                    onClick={() => handleRemoveTeamMember(user.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-red-500"
                    title="Remove from team"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No team members assigned yet.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold mb-4">{t("auditLog")}</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(project.activityLog || []).slice(0, 10).map((log) => (
              <div key={log.id} className="text-sm">
                <p className="font-semibold">
                  {log.action[lang]}{" "}
                  <span className="font-normal text-gray-500">
                    by {log.user}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
