import { Action, Resource, permissionService } from "@/services/permissionService";
import type { AppDocument, AuditPlan, NavigationState, Project, User } from "@/types";
import { ComplianceStatus, ProjectStatus, UserRole } from "@/types";
import { normalizeUserRole } from "@/utils/roleAccess";

export interface DashboardJourneyAction {
  id: string;
  titleKey: string;
  descriptionKey: string;
  count?: number;
  urgent?: boolean;
  navigation: NavigationState;
}

export function buildDashboardJourney(
  user: User,
  organizationId: string | null,
  projects: Project[],
  documents: AppDocument[],
  auditPlans: AuditPlan[],
  now = new Date(),
): { priorities: DashboardJourneyAction[]; steps: DashboardJourneyAction[] } {
  if (!organizationId || user.organizationId !== organizationId) return { priorities: [], steps: [] };
  const can = (action: Action, resource: Resource) => permissionService.can(user, action, resource);
  const scopedProjects = can(Action.Read, Resource.Project)
    ? projects.filter(p => p.organizationId === organizationId && !p.archived) : [];
  const scopedDocuments = can(Action.Read, Resource.Document)
    ? documents.filter(d => d.organizationId === organizationId) : [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const isOverdue = (date?: string) => {
    if (!date || !Number.isFinite(Date.parse(date))) return false;
    const due = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date);
    return due.getTime() < today;
  };
  const priorities: DashboardJourneyAction[] = [];
  const tasks = scopedProjects.flatMap(project => (project.checklist || [])
    .filter(item => item.assignedTo === user.id &&
      item.status !== ComplianceStatus.Compliant && item.status !== ComplianceStatus.NotApplicable)
    .map(item => ({ project, item })));
  const overdue = tasks.filter(task => isOverdue(task.item.dueDate))
    .sort((a, b) => Date.parse(a.item.dueDate) - Date.parse(b.item.dueDate));
  if (overdue.length) priorities.push({
    id: "overdue", titleKey: "journeyOverdue", descriptionKey: "journeyOverdueDescription",
    count: overdue.length, urgent: true,
    navigation: { view: "projectDetail", projectId: overdue[0].project.id },
  });
  const pending = scopedDocuments.filter(d => d.status === "Pending Review");
  if (pending.length && can(Action.Approve, Resource.Document)) priorities.push({
    id: "approvals", titleKey: "journeyApprovals", descriptionKey: "journeyApprovalsDescription",
    count: pending.length, navigation: { view: "documentControl", documentId: pending[0].id },
  });
  if (can(Action.Read, Resource.CAPA)) {
    const role = normalizeUserRole(user.role);
    const capas = scopedProjects.flatMap(project => (project.capaReports || [])
      .filter(capa => capa.status !== ProjectStatus.Closed && capa.status !== ProjectStatus.Completed &&
        (role !== UserRole.TeamMember || capa.assignedTo === user.id))
      .map(capa => ({ project, capa })));
    if (capas.length) priorities.push({
      id: "capa", titleKey: "journeyCapa", descriptionKey: "journeyCapaDescription",
      count: capas.length, navigation: { view: "projectDetail", projectId: capas[0].project.id },
    });
  }
  if (tasks.length && !overdue.length) priorities.push({
    id: "tasks", titleKey: "journeyTasks", descriptionKey: "journeyTasksDescription",
    count: tasks.length, navigation: { view: "myTasks" },
  });
  if (can(Action.Read, Resource.Audit)) {
    const audits = auditPlans.filter(a => a.organizationId === organizationId &&
      a.status !== "completed" && a.status !== "cancelled" &&
      (normalizeUserRole(user.role) !== UserRole.Auditor || a.assignedAuditorId === user.id));
    if (audits.length) priorities.push({
      id: "audits", titleKey: "journeyAudits", descriptionKey: "journeyAuditsDescription",
      count: audits.length, navigation: { view: "auditHub" },
    });
  }
  const steps: DashboardJourneyAction[] = [];
  if (can(Action.Read, Resource.Standard)) steps.push({
    id: "standards", titleKey: "journeyStandards", descriptionKey: "journeyStandardsDescription",
    navigation: { view: "accreditationHub" },
  });
  if (can(Action.Read, Resource.Project)) steps.push({
    id: "projects", titleKey: "journeyProjects", descriptionKey: "journeyProjectsDescription",
    navigation: { view: "projects" },
  });
  if (can(Action.Read, Resource.Document)) steps.push({
    id: "evidence", titleKey: "journeyEvidence", descriptionKey: "journeyEvidenceDescription",
    navigation: { view: "documentControl" },
  });
  if (can(Action.Read, Resource.Audit)) steps.push({
    id: "review", titleKey: "journeyReview", descriptionKey: "journeyReviewDescription",
    navigation: { view: "auditHub" },
  });
  if (!scopedProjects.length && can(Action.Create, Resource.Project)) priorities.unshift({
    id: "start", titleKey: "journeyStartProject", descriptionKey: "journeyStartProjectDescription",
    navigation: { view: "createProject" },
  });
  return { priorities: priorities.slice(0, 3), steps };
}
