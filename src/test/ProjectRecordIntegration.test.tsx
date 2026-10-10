import React from "react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useProjectRecord } from "@/hooks/useProjectRecord";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  subscribeToProject,
  finalizeProject,
  getProjects,
  updateProject,
  createProject,
} from "@/services/projectService";
import { getAuthInstance } from "@/firebase/firebaseConfig";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import SignatureModal from "@/components/common/SignatureModal";
import { projectEvidenceSummary } from "@/utils/projectEvidence";
import { cloudinaryService } from "@/services/cloudinaryService";
import { useAppStore } from "@/stores/useAppStore";
import {
  AppDocument,
  ChecklistItem,
  ComplianceStatus,
  Project,
  ProjectStatus,
  User,
  UserRole,
} from "@/types";

let organizationId = "org-a";
let actor: User = {
  id: "u1",
  name: "Reviewer",
  email: "reviewer@example.com",
  role: UserRole.Admin,
  organizationId,
};
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: { getState: () => ({ currentUser: actor }) },
}));
jest.mock("@/stores/useTenantStore", () => ({
  useTenantStore: (selector: (state: { organizationId: string }) => unknown) =>
    selector({ organizationId }),
}));
jest.mock("@/services/projectService", () => ({
  subscribeToProject: jest.fn(),
  finalizeProject: jest.fn(),
  getProjects: jest.fn(),
  updateProject: jest.fn(),
  createProject: jest.fn(),
}));
jest.mock("@/services/workflowEngine", () => ({
  workflowEngine: { evaluate: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: { getState: () => ({ addControlledDocument: saveEvidence }) },
}));
const saveEvidence = jest.fn();
jest.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: jest.fn() },
  reauthenticateWithCredential: jest.fn(),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, dir: "ltr" }),
}));

const record = (id = "p1"): Project => ({
  id,
  organizationId: "org-a",
  name: id,
  programId: "ohas",
  status: ProjectStatus.InProgress,
  startDate: "2026-10-01",
  checklist: [],
  progress: 0,
  createdAt: "",
  updatedAt: "",
});
const document = (
  id: string,
  overrides: Partial<AppDocument> = {},
): AppDocument => ({
  id,
  organizationId: "org-a",
  name: { en: id, ar: id },
  type: "Evidence",
  isControlled: true,
  status: "Approved",
  content: { en: "", ar: "" },
  currentVersion: 1,
  versionHistory: [],
  uploadedAt: "",
  ...overrides,
});

describe("Project record integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    organizationId = "org-a";
    actor = {
      id: "u1",
      name: "Reviewer",
      email: "reviewer@example.com",
      role: UserRole.Admin,
      organizationId,
    };
    useProjectStore.setState({ projects: [], loading: false, error: null });
    jest.mocked(getAuthInstance).mockReturnValue({
      currentUser: { uid: "u1", email: actor.email },
    } as ReturnType<typeof getAuthInstance>);
    jest.mocked(getProjects).mockResolvedValue([record()]);
    jest
      .mocked(reauthenticateWithCredential)
      .mockResolvedValue(
        {} as Awaited<ReturnType<typeof reauthenticateWithCredential>>,
      );
  });

  it("applies live snapshots to shared state, recalculates progress and cleans up on switch/unmount", () => {
    // Arrange
    const listeners: Parameters<typeof subscribeToProject>[1][] = [];
    const cleanups = [jest.fn(), jest.fn()];
    jest.mocked(subscribeToProject).mockImplementation((_id, callback) => {
      listeners.push(callback);
      return cleanups[listeners.length - 1];
    });
    const hook = renderHook(({ id }) => useProjectRecord(id), {
      initialProps: { id: "p1" },
    });
    const project = record();
    project.checklist = [
      {
        id: "c1",
        standardId: "LAB.1",
        item: "Control",
        status: ComplianceStatus.Compliant,
        evidenceFiles: [],
        comments: [],
        assignedTo: "",
        dueDate: "",
        actionPlan: "",
        notes: "",
      },
    ];
    // Act
    act(() => listeners[0](project));
    // Assert
    expect(hook.result.current.project?.progress).toBe(100);
    expect(useProjectStore.getState().projects[0].name).toBe("p1");
    // Act
    hook.rerender({ id: "p2" });
    act(() => listeners[0]({ ...project, name: "late update" }));
    // Assert
    expect(cleanups[0]).toHaveBeenCalledTimes(1);
    expect(hook.result.current.project).toBeUndefined();
    expect(useProjectStore.getState().projects[0].name).toBe("p1");
    act(() => listeners[1](record("p2")));
    expect(hook.result.current.project?.id).toBe("p2");
    hook.unmount();
    expect(cleanups[1]).toHaveBeenCalledTimes(1);
  });

  it("surfaces subscription failures, retries, and rejects cross-organization snapshots", () => {
    // Arrange
    const errors: NonNullable<Parameters<typeof subscribeToProject>[2]>[] = [];
    const callbacks: Parameters<typeof subscribeToProject>[1][] = [];
    jest
      .mocked(subscribeToProject)
      .mockImplementation((_id, callback, onError) => {
        callbacks.push(callback);
        if (onError) errors.push(onError);
        return jest.fn();
      });
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const hook = renderHook(() => useProjectRecord("p1"));
    // Act
    act(() => errors[0](new Error("permission-denied")));
    // Assert
    expect(hook.result.current.failed).toBe(true);
    expect(hook.result.current.loading).toBe(false);
    act(() => hook.result.current.retry());
    expect(subscribeToProject).toHaveBeenCalledTimes(2);
    act(() => callbacks[1]({ ...record(), organizationId: "org-b" }));
    expect(hook.result.current.missing).toBe(true);
    expect(hook.result.current.project).toBeUndefined();
    log.mockRestore();
  });

  it("resolves real evidence references without counting not-applicable items or foreign documents", () => {
    // Arrange
    const project = record();
    project.checklist = [
      {
        id: "c1",
        standardId: "L.1",
        item: "A",
        status: ComplianceStatus.Compliant,
        evidenceFiles: ["good", "missing"],
        comments: [],
        assignedTo: "",
        dueDate: "",
        actionPlan: "",
        notes: "",
      },
      {
        id: "c2",
        standardId: "L.2",
        item: "B",
        status: ComplianceStatus.NotStarted,
        evidenceFiles: ["foreign"],
        comments: [],
        assignedTo: "",
        dueDate: "",
        actionPlan: "",
        notes: "",
      },
      {
        id: "c3",
        standardId: "L.3",
        item: "C",
        status: ComplianceStatus.NotApplicable,
        evidenceFiles: [],
        comments: [],
        assignedTo: "",
        dueDate: "",
        actionPlan: "",
        notes: "",
      },
    ];
    // Act
    const result = projectEvidenceSummary(project, [
      document("good"),
      document("foreign", { organizationId: "org-b" }),
      document("direct", { projectId: project.id, status: "Draft" }),
      document("unlinked"),
    ]);
    // Assert
    expect(result.documents.map((doc) => doc.id)).toEqual(["good", "direct"]);
    expect(result.missingEvidence).toBe(1);
    expect(result.unresolvedLinks).toBe(2);
    expect(result.unapprovedDocuments).toBe(1);
  });

  it("returns the persisted project, avoids listener duplicates and blocks viewer creation", async () => {
    // Arrange
    const saved = record("created");
    useProjectStore.setState({ projects: [saved] });
    jest.mocked(createProject).mockResolvedValue(saved);
    const { id, ...input } = saved;
    // Act
    const project = await useProjectStore.getState().addProject(input);
    // Assert
    expect(project.id).toBe("created");
    expect(useProjectStore.getState().projects).toHaveLength(1);
    actor = { ...actor, role: UserRole.Viewer };
    await expect(useProjectStore.getState().addProject(input)).rejects.toThrow(
      "not authorized",
    );
    expect(createProject).toHaveBeenCalledTimes(1);
  });
  it("reauthenticates the submitted password before finalization", async () => {
    // Arrange
    useProjectStore.setState({ projects: [record()] });
    // Act
    await useProjectStore.getState().finalizeProject("p1", "entered-password");
    // Assert
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
      actor.email,
      "entered-password",
    );
    expect(reauthenticateWithCredential).toHaveBeenCalled();
    expect(finalizeProject).toHaveBeenCalledWith("p1", actor.id, actor.name);
    expect(
      jest.mocked(reauthenticateWithCredential).mock.invocationCallOrder[0],
    ).toBeLessThan(jest.mocked(finalizeProject).mock.invocationCallOrder[0]);
  });

  it("does not finalize after rejected credentials or a viewer attempt", async () => {
    // Arrange
    useProjectStore.setState({ projects: [record()] });
    jest
      .mocked(reauthenticateWithCredential)
      .mockRejectedValue(new Error("wrong-password"));
    // Act / Assert
    await expect(
      useProjectStore.getState().finalizeProject("p1", "wrong"),
    ).rejects.toThrow("wrong-password");
    expect(finalizeProject).not.toHaveBeenCalled();
    actor = { ...actor, role: UserRole.Viewer };
    await expect(
      useProjectStore.getState().finalizeProject("p1", "password"),
    ).rejects.toThrow("not authorized");
    expect(finalizeProject).not.toHaveBeenCalled();
  });

  it.each([ProjectStatus.Finalized, ProjectStatus.InProgress])(
    "blocks finalized or viewer checklist writes for %s",
    async (status) => {
      // Arrange
      useProjectStore.setState({ projects: [{ ...record(), status }] });
      if (status === ProjectStatus.InProgress)
        actor = { ...actor, role: UserRole.Viewer };
      // Act / Assert
      await expect(
        useProjectStore
          .getState()
          .updateChecklistItem("p1", "c1", { notes: "write" }),
      ).rejects.toThrow("read-only");
      expect(updateProject).not.toHaveBeenCalled();
    },
  );

  it("locks the signature while awaiting confirmation and clears passwords when closed", async () => {
    // Arrange
    let finish = () => {};
    const confirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const props = {
      isOpen: true,
      onClose: jest.fn(),
      onConfirm: confirm,
      actionTitle: "Review project",
      signatureStatement: "Review",
      confirmActionText: "Sign",
    };
    const view = render(<SignatureModal {...props} />);
    // Act
    fireEvent.change(screen.getByLabelText("enterPasswordToSign"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign" }));
    // Assert
    expect(confirm).toHaveBeenCalledWith("password");
    expect(screen.getByRole("button", { name: "Sign" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "cancel" })).toBeDisabled();
    act(() => finish());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "cancel" })).toBeEnabled(),
    );
    view.rerender(<SignatureModal {...props} isOpen={false} />);
    view.rerender(<SignatureModal {...props} />);
    expect(screen.getByLabelText("enterPasswordToSign")).toHaveValue("");
  });

  it("persists a real evidence document before linking and never links a failed upload", async () => {
    // Arrange
    const project: Project = {
      ...record(),
      checklist: [
        {
          id: "c1",
          standardId: "s1",
          item: "Label samples",
          status: ComplianceStatus.Compliant,
          assignedTo: "",
          dueDate: "",
          actionPlan: "",
          notes: "",
          evidenceFiles: [],
          comments: [],
        },
      ],
    };
    useProjectStore.setState({ projects: [project] });
    jest
      .mocked(cloudinaryService.uploadDocument)
      .mockResolvedValue("https://example.com/evidence.pdf");
    saveEvidence.mockResolvedValue(document("saved-evidence"));
    // Act
    await useProjectStore
      .getState()
      .uploadEvidence("p1", "c1", new File(["evidence"], "evidence.pdf"));
    // Assert
    expect(saveEvidence).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "p1", type: "Evidence" }),
    );
    expect(updateProject).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        checklist: [
          expect.objectContaining({ evidenceFiles: ["saved-evidence"] }),
        ],
      }),
    );
    jest.mocked(updateProject).mockClear();
    jest
      .mocked(cloudinaryService.uploadDocument)
      .mockRejectedValue(new Error("Upload failed"));
    await expect(
      useProjectStore
        .getState()
        .uploadEvidence("p1", "c1", new File(["x"], "x.pdf")),
    ).rejects.toThrow("Upload failed");
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("applies completed survey failures without upgrading passes or duplicating notes", async () => {
    // Arrange
    const checklist: ChecklistItem[] = ["c1", "c2"].map((id) => ({
      id,
      standardId: id,
      item: id,
      status: ComplianceStatus.Compliant,
      assignedTo: "",
      dueDate: "",
      actionPlan: "",
      notes: "Existing note",
      evidenceFiles: [],
      comments: [],
    }));
    useProjectStore.setState({
      projects: [
        {
          ...record(),
          checklist,
          mockSurveys: [
            {
              id: "survey1",
              date: "",
              status: ProjectStatus.Completed,
              createdAt: "",
              updatedAt: "",
              results: [
                {
                  id: "r1",
                  itemId: "c1",
                  result: "Fail",
                  notes: "Label missing",
                },
                { id: "r2", itemId: "c2", result: "Pass" },
              ],
            },
          ],
        },
      ],
    });
    // Act
    await useProjectStore
      .getState()
      .applySurveyFindingsToProject("p1", "survey1");
    await useProjectStore
      .getState()
      .applySurveyFindingsToProject("p1", "survey1");
    // Assert
    const project = useProjectStore.getState().projects[0];
    expect(project.checklist[0].status).toBe(ComplianceStatus.NonCompliant);
    expect(project.checklist[0].notes).toBe(
      "Existing note\n[Survey survey1] Label missing",
    );
    expect(project.checklist[1].status).toBe(ComplianceStatus.Compliant);
  });

  it("rejects applying findings to finalized projects or missing surveys", async () => {
    // Arrange
    useProjectStore.setState({ projects: [record()] });
    // Act / Assert
    await expect(
      useProjectStore.getState().applySurveyFindingsToProject("p1", "absent"),
    ).rejects.toThrow("Completed survey not found");
    useProjectStore.setState({
      projects: [{ ...record(), status: ProjectStatus.Finalized }],
    });
    await expect(
      useProjectStore.getState().applySurveyFindingsToProject("p1", "absent"),
    ).rejects.toThrow("read-only");
    expect(updateProject).not.toHaveBeenCalled();
  });
});
