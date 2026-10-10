import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import DashboardJourney from "@/components/dashboard/DashboardJourney";
import { buildDashboardJourney } from "@/utils/dashboardJourney";
import { AppDocument, AuditPlan, ChecklistItem, ComplianceStatus, Project, ProjectStatus, User, UserRole } from "@/types";
import { en } from "@/data/locales/en/dashboard";
import { ar } from "@/data/locales/ar/dashboard";

let language: "en" | "ar" = "en";
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => {
    const messages: Record<string, string> = language === "ar" ? ar : en;
    return messages[key] || key;
  } }),
}));

const user: User = { id: "u1", organizationId: "org-a", name: "Alya", email: "test@example.com", role: UserRole.Admin };
const task = (id: string, dueDate: string, status: ComplianceStatus = ComplianceStatus.NonCompliant): ChecklistItem => ({
  id, item: id, standardId: "LAB.1", assignedTo: user.id, dueDate, status,
  actionPlan: "", notes: "", evidenceFiles: [], comments: [],
});
const project = (id: string, checklist: ChecklistItem[] = []): Project => ({
  id, organizationId: "org-a", name: id, programId: "lab", status: ProjectStatus.InProgress,
  startDate: "2026-10-01", progress: 0, checklist, createdAt: "2026-10-01", updatedAt: "2026-10-01",
});
const documentRecord: AppDocument = {
  id: "doc-1", organizationId: "org-a", name: { en: "Policy", ar: "سياسة" },
  type: "Policy", isControlled: true, status: "Pending Review", currentVersion: 1, uploadedAt: "2026-10-01",
  content: { en: "Policy content", ar: "محتوى السياسة" },
};
const audit: AuditPlan = {
  id: "a1", organizationId: "org-a", name: "Audit", projectId: "p1",
  standardSection: "LAB", frequency: "monthly", itemCount: 1, assignedAuditorId: "u1", status: "planned",
};
const now = new Date(2026, 9, 10, 14);

describe("Dashboard journey", () => {
  beforeEach(() => { language = "en"; });

  it("prioritizes overdue assigned work and opens the oldest task's project", () => {
    // Arrange
    const projects = [project("newer", [task("t1", "2026-10-09")]), project("older", [task("t2", "2026-10-02")])];
    // Act
    const journey = buildDashboardJourney(user, "org-a", projects, [documentRecord], [audit], now);
    // Assert
    expect(journey.priorities.map(a => a.id)).toEqual(["overdue", "approvals", "audits"]);
    expect(journey.priorities[0]).toMatchObject({ count: 2, urgent: true, navigation: { view: "projectDetail", projectId: "older" } });
  });

  it("does not classify today, invalid dates, completed tasks, or other users' work as overdue", () => {
    // Arrange
    const checklist = [task("today", "2026-10-10"), task("invalid", "invalid"), task("done", "2026-10-01", ComplianceStatus.Compliant),
      task("na", "2026-10-01", ComplianceStatus.NotApplicable), { ...task("other", "2026-10-01"), assignedTo: "u2" }];
    // Act
    const journey = buildDashboardJourney(user, "org-a", [project("p1", checklist)], [], [], now);
    // Assert
    expect(journey.priorities).toEqual([expect.objectContaining({ id: "tasks", count: 2 })]);
  });

  it.each(Object.values(UserRole))("provides read-access journey navigation for %s without granting approval", role => {
    // Arrange
    const actor = { ...user, role };
    // Act
    const journey = buildDashboardJourney(actor, "org-a", [project("p1")], [documentRecord], [], now);
    // Assert
    expect(journey.steps.map(a => a.navigation.view)).toEqual(["accreditationHub", "projects", "documentControl", "auditHub"]);
    expect(journey.priorities.some(a => a.id === "approvals")).toBe(role === UserRole.Admin || role === UserRole.ProjectLead);
  });

  it("excludes foreign, unknown-ownership and archived records and rejects a tenant transition", () => {
    // Arrange
    const projects = [{ ...project("foreign", [task("t", "2026-10-01")]), organizationId: "org-b" },
      { ...project("legacy"), organizationId: undefined }, { ...project("archived"), archived: true }];
    // Act
    const journey = buildDashboardJourney(user, "org-a", projects,
      [{ ...documentRecord, organizationId: "org-b" }], [{ ...audit, organizationId: undefined }], now);
    // Assert
    expect(journey.priorities.map(a => a.id)).toEqual(["start"]);
    expect(buildDashboardJourney(user, "org-b", projects, [], [], now)).toEqual({ priorities: [], steps: [] });
    expect(buildDashboardJourney(user, null, [], [], [], now)).toEqual({ priorities: [], steps: [] });
    expect(buildDashboardJourney({ ...user, isActive: false }, "org-a", [], [], [], now)).toEqual({ priorities: [], steps: [] });
  });

  it("counts only unfinished CAPA and restricts team members to their assigned actions", () => {
    // Arrange
    const base = { id: "c1", checklistItemId: "t1", rootCause: "", correctiveAction: "", createdAt: "2026-10-01", updatedAt: "2026-10-01" };
    const p: Project = { ...project("p1"), capaReports: [
      { ...base, status: ProjectStatus.Open, assignedTo: "u1" },
      { ...base, id: "c2", status: ProjectStatus.Open, assignedTo: "u2" },
      { ...base, id: "c3", status: ProjectStatus.Closed },
      { ...base, id: "c4", status: ProjectStatus.Completed },
    ] };
    // Act
    const admin = buildDashboardJourney(user, "org-a", [p], [], [], now);
    const member = buildDashboardJourney({ ...user, role: UserRole.TeamMember }, "org-a", [p], [], [], now);
    // Assert
    expect(admin.priorities[0].count).toBe(2);
    expect(member.priorities[0]).toMatchObject({ id: "capa", count: 1, navigation: { view: "projectDetail", projectId: "p1" } });
  });

  it("shows only the auditor's unfinished audit plans", () => {
    // Arrange
    const actor = { ...user, role: UserRole.Auditor };
    // Act
    const journey = buildDashboardJourney(actor, "org-a", [project("p1")], [], [
      audit, { ...audit, id: "other", assignedAuditorId: "u2" },
      { ...audit, id: "done", status: "completed" }, { ...audit, id: "cancelled", status: "cancelled" },
    ], now);
    // Assert
    expect(journey.priorities).toEqual([expect.objectContaining({ id: "audits", count: 1 })]);
  });

  it.each(["en", "ar"] as const)("renders actionable priorities and journey navigation in %s", lang => {
    // Arrange
    language = lang;
    const messages = lang === "ar" ? ar : en;
    const setNavigation = jest.fn();
    render(<DashboardJourney user={user} organizationId="org-a" projects={[project("p1")]}
      documents={[documentRecord]} auditPlans={[]} setNavigation={setNavigation} />);
    const region = screen.getByRole("region", { name: messages.journeyTitle });
    // Act
    fireEvent.click(within(region).getByRole("button", { name: new RegExp(messages.journeyApprovals) }));
    // Assert
    expect(setNavigation).toHaveBeenCalledWith({ view: "documentControl", documentId: "doc-1" });
    expect(within(region).getByRole("link", { name: messages.journeyOverview })).toHaveAttribute("href", "#dashboard-overview");
    // Act
    fireEvent.click(within(region).getByRole("button", { name: new RegExp(messages.journeyStandards) }));
    // Assert
    expect(setNavigation).toHaveBeenLastCalledWith({ view: "accreditationHub" });
    expect(within(region).getByText(messages.journeyCoverageNotice)).toBeInTheDocument();
  });

  it("uses an honest empty state instead of claiming accreditation completion", () => {
    // Arrange
    render(<DashboardJourney user={{ ...user, role: UserRole.Viewer }} organizationId="org-a"
      projects={[]} documents={[]} auditPlans={[]} setNavigation={jest.fn()} />);
    // Act / Assert
    expect(screen.getByRole("status")).toHaveTextContent(en.journeyNoPriorities);
    expect(screen.queryByText(en.journeyStartProject)).not.toBeInTheDocument();
  });
});
