import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { ActionType, TriggerEntity, WorkflowAction, WorkflowDefinition } from "@/types/workflow";
import { workflowEngine } from "@/services/workflowEngine";
import { addCAPAReport } from "@/services/capaService";
import { ComplianceStatus, ProjectStatus, UserRole } from "@/types";

jest.mock("@/services/notificationService", () => ({
  notificationService: { createNotification: jest.fn() },
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: { getState: jest.fn() },
}));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: { getState: jest.fn() },
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: { getState: jest.fn() },
}));
jest.mock("@/services/capaService", () => ({
  addCAPAReport: jest.fn(),
  getCAPAReports: jest.fn(),
  updateCAPAReport: jest.fn(),
}));

const makeWorkflow = (
  entity: TriggerEntity,
  action: WorkflowAction,
): WorkflowDefinition => ({
  id: "workflow-1",
  name: "Workflow test",
  description: "",
  trigger: { entity, event: "updated" },
  conditionGroup: { logic: "AND", conditions: [] },
  actions: [action],
  status: "active",
  createdBy: "user-1",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  executionCount: 0,
  category: "custom",
  isTemplate: false,
});

const action = (type: ActionType, config: Record<string, unknown>): WorkflowAction => ({
  id: "action-1",
  type,
  config,
  delayMinutes: 0,
  order: 1,
});

const projectWithItem = () => ({
  id: "project-1",
  name: "Project",
  programId: "program-1",
  status: ProjectStatus.InProgress,
  startDate: "2026-01-01",
  progress: 0,
  checklist: [{
    id: "item-1",
    item: "Test checklist item",
    standardId: "standard-1",
    status: ComplianceStatus.NotStarted,
    assignedTo: "",
    dueDate: "",
    actionPlan: "",
    notes: "",
    evidenceFiles: [],
    comments: [],
  }],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

const adminUser = {
  id: "user-1",
  name: "Admin",
  email: "admin@example.test",
  role: UserRole.Admin,
  organizationId: "org-1",
};

describe("workflowEngine data mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists checklist status changes without recursively re-triggering workflows", async () => {
    const updateChecklistItem = jest.fn().mockResolvedValue(undefined);
    jest.mocked(useProjectStore.getState).mockReturnValue({
      ...useProjectStore.getState(),
      projects: [projectWithItem()],
      updateChecklistItem,
    });
    workflowEngine.initialize([
      makeWorkflow("checklist_item", action("change_status", { targetStatus: "Compliant" })),
    ]);

    const [log] = await workflowEngine.evaluate("checklist_item", "updated", {
      id: "item-1",
      projectId: "project-1",
    });

    expect(updateChecklistItem).toHaveBeenCalledWith(
      "project-1",
      "item-1",
      { status: "Compliant" },
      { skipWorkflowEvaluation: true },
    );
    expect(log.actionResults[0]).toMatchObject({ status: "completed" });
  });

  it("creates incident CAPAs with a durable incident link", async () => {
    jest.mocked(useUserStore.getState).mockReturnValue({
      ...useUserStore.getState(),
      currentUser: adminUser,
      users: [],
    });
    jest.mocked(addCAPAReport).mockResolvedValue({
      id: "capa-1",
      checklistItemId: "",
      rootCause: "",
      correctiveAction: "",
      status: ProjectStatus.InProgress,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });
    workflowEngine.initialize([
      makeWorkflow(
        "incident",
        action("create_capa", {
          title: "CAPA: {{entity.description}}",
          description: "{{entity.description}}",
        }),
      ),
    ]);

    const [log] = await workflowEngine.evaluate("incident", "updated", {
      id: "incident-1",
      description: "Medication reconciliation gap",
      organizationId: "org-1",
    });

    expect(addCAPAReport).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "CAPA: Medication reconciliation gap",
        sourceIncidentId: "incident-1",
      }),
    );
    expect(log.actionResults[0]).toMatchObject({ status: "completed" });
  });

  it("persists checklist assignments and comments through their store actions", async () => {
    const updateChecklistItem = jest.fn().mockResolvedValue(undefined);
    const addComment = jest.fn().mockResolvedValue(undefined);
    jest.mocked(useProjectStore.getState).mockReturnValue({
      ...useProjectStore.getState(),
      projects: [projectWithItem()],
      updateChecklistItem,
      addComment,
    });
    jest.mocked(useUserStore.getState).mockReturnValue({
      ...useUserStore.getState(),
      currentUser: adminUser,
      users: [{
        id: "assignee-1",
        name: "Assignee",
        email: "assignee@example.test",
        role: UserRole.TeamMember,
        organizationId: "org-1",
      }],
    });

    workflowEngine.initialize([
      makeWorkflow("checklist_item", action("assign_user", { userIds: ["assignee-1"] })),
    ]);
    const [assignmentLog] = await workflowEngine.evaluate(
      "checklist_item",
      "updated",
      { id: "item-1", projectId: "project-1", organizationId: "org-1" },
    );
    expect(updateChecklistItem).toHaveBeenCalledWith(
      "project-1",
      "item-1",
      { assignedTo: "assignee-1" },
      { skipWorkflowEvaluation: true },
    );
    expect(assignmentLog.actionResults[0].status).toBe("completed");

    workflowEngine.initialize([
      makeWorkflow(
        "checklist_item",
        action("add_comment", { comment: "Review {{entity.item}}" }),
      ),
    ]);
    const [commentLog] = await workflowEngine.evaluate(
      "checklist_item",
      "updated",
      {
        id: "item-1",
        item: "Controlled document review",
        projectId: "project-1",
      },
    );
    expect(addComment).toHaveBeenCalledWith(
      "project-1",
      "item-1",
      "Review Controlled document review",
    );
    expect(commentLog.actionResults[0].status).toBe("completed");
  });

  it("fails assignment rather than choosing arbitrarily when a role has multiple users", async () => {
    jest.mocked(useUserStore.getState).mockReturnValue({
      ...useUserStore.getState(),
      currentUser: adminUser,
      users: [
        { id: "admin-1", name: "Admin One", email: "a1@example.test", role: UserRole.Admin, organizationId: "org-1" },
        { id: "admin-2", name: "Admin Two", email: "a2@example.test", role: UserRole.Admin, organizationId: "org-1" },
      ],
    });
    workflowEngine.initialize([
      makeWorkflow("incident", action("assign_user", { roles: ["Admin"] })),
    ]);

    const [log] = await workflowEngine.evaluate("incident", "updated", {
      id: "incident-1",
      organizationId: "org-1",
    });

    expect(log.actionResults[0]).toMatchObject({
      status: "failed",
      message: expect.stringContaining("multiple users"),
    });
  });
});
