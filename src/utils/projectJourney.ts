import { ComplianceStatus, ProjectStatus } from "@/types";
import type { Project } from "@/types";

export const PROJECT_STATUS_KEYS: Record<ProjectStatus, string> = {
  [ProjectStatus.NotStarted]: "notStarted",
  [ProjectStatus.InProgress]: "projectStatusInProgress",
  [ProjectStatus.OnHold]: "projectStatusOnHold",
  [ProjectStatus.Completed]: "completed",
  [ProjectStatus.Finalized]: "projectStatusFinalized",
  [ProjectStatus.Open]: "projectStatusOpen",
  [ProjectStatus.Closed]: "projectStatusClosed",
};

export function projectCalendarDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
  );
  if (!Number.isFinite(date.getTime())) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    )
      return null;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function projectWorkSummary(project: Project, now = new Date()) {
  const checklist = project.checklist || [];
  const outstanding = checklist.filter(
    (item) =>
      item.status !== ComplianceStatus.Compliant &&
      item.status !== ComplianceStatus.NotApplicable,
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    total: checklist.length,
    completed: checklist.filter(
      (item) => item.status === ComplianceStatus.Compliant,
    ).length,
    remaining: outstanding.length,
    unassigned: outstanding.filter((item) => !item.assignedTo).length,
    overdue: outstanding.filter((item) => {
      const due = projectCalendarDate(item.dueDate);
      return due !== null && due < today;
    }).length,
    openCapa: (project.capaReports || []).filter(
      (capa) =>
        capa.status !== ProjectStatus.Closed &&
        capa.status !== ProjectStatus.Completed &&
        capa.status !== ProjectStatus.Finalized,
    ).length,
  };
}
