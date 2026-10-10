import React from "react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import CreateProjectWizard from "@/pages/CreateProjectWizard";
import {
  useProjectWizard,
  WizardData,
} from "@/components/projects/wizard/useProjectWizard";
import { Step2ProgramStandards } from "@/components/projects/wizard/Step2ProgramStandards";
import { Step3TeamTimeline } from "@/components/projects/wizard/Step3TeamTimeline";
import { aiAgentService } from "@/services/aiAgentService";
import {
  buildProjectChecklist,
  parseProjectTimeline,
  resolveProjectStandards,
} from "@/utils/projectSetup";
import {
  validateAllSteps,
  validateEndDate,
  validateStartDate,
} from "@/components/projects/wizard/projectValidation";
import {
  ComplianceStatus,
  Project,
  ProjectStatus,
  Standard,
  UserRole,
} from "@/types";
import { en } from "@/data/locales/en/projects";

const addProject = jest.fn();
const updateProject = jest.fn();
const success = jest.fn();
const error = jest.fn();
const navigate = jest.fn();
let projects: Project[] = [];
let permitted = true;
const user = {
  id: "lead",
  name: "Laboratory Lead",
  email: "lead@example.com",
  role: UserRole.Admin,
  organizationId: "org-a",
};
const standards: Standard[] = [
  {
    standardId: "LAB.1",
    programId: "ohas",
    scope: "global",
    section: "Lab",
    description: "Control specimen identity",
  },
  {
    standardId: "LAB.1",
    programId: "other",
    scope: "global",
    section: "Other",
    description: "Wrong program text",
  },
  {
    standardId: "LAB.2",
    programId: "ohas",
    scope: "global",
    section: "Lab",
    description: "Control sample transport",
  },
];
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: (selector?: (state: object) => unknown) => {
    const state = { projects, addProject, updateProject };
    return selector ? selector(state) : state;
  },
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector?: (state: object) => unknown) => {
    const state = {
      currentUser: user,
      users: [
        user,
        { ...user, id: "viewer", name: "Read-only colleague", role: "Viewer" },
        {
          ...user,
          id: "foreign",
          name: "Other organization",
          organizationId: "org-b",
        },
        {
          ...user,
          id: "inactive",
          name: "Inactive colleague",
          isActive: false,
        },
      ],
    };
    return selector ? selector(state) : state;
  },
}));
jest.mock("@/stores/useTenantStore", () => ({
  useTenantStore: (selector?: (state: object) => unknown) => {
    const state = { organizationId: "org-a" };
    return selector ? selector(state) : state;
  },
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => ({
    accreditationPrograms: [
      {
        id: "ohas",
        name: "OHAS",
        scope: "global",
        description: { en: "Healthcare requirements" },
      },
    ],
    standards,
    projectTemplates: [],
    departments: [
      { id: "lab", organizationId: "org-a", name: { en: "Laboratory" } },
    ],
  }),
}));
jest.mock("@/hooks/usePermission", () => ({
  ...jest.requireActual("@/services/permissionService"),
  usePermission: () => ({ can: () => permitted }),
}));
jest.mock("@/hooks/useToast", () => ({ useToast: () => ({ success, error }) }));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, unknown> = {
        ...en,
        saveChanges: "Save changes",
      };
      return typeof translations[key] === "string" ? translations[key] : key;
    },
    lang: "en",
  }),
}));
jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { chat: jest.fn() },
}));
jest.mock(
  "@/components/ui/DatePicker",
  () => (props: { date?: Date; setDate: (date: Date) => void }) => (
    <input
      aria-label="Test date"
      value={props.date?.toISOString().slice(0, 10) || ""}
      onChange={(event) =>
        props.setDate(new Date(`${event.target.value}T12:00:00`))
      }
    />
  ),
);

describe("Project setup integrity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    projects = [];
    permitted = true;
    addProject.mockResolvedValue({ id: "new-project" });
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: () => `id-${Math.random()}`,
    });
  });
  it("rejects invalid dates but allows short plans and historical edit dates", () => {
    // Arrange / Act / Assert
    expect(validateStartDate(new Date("invalid"))).toBe("setupDateInvalid");
    expect(validateStartDate(new Date(2020, 0, 1), true)).toBeNull();
    expect(
      validateEndDate(new Date(2030, 0, 1), new Date(2030, 0, 2)),
    ).toBeNull();
    expect(() =>
      parseProjectTimeline("START: 2030-02-30\nEND: 2030-03-15"),
    ).toThrow("invalid");
    expect(() => parseProjectTimeline("START: 2030-01-01")).toThrow(
      "incomplete",
    );
    expect(() =>
      parseProjectTimeline("START: 2030-01-02\nEND: 2030-01-01"),
    ).toThrow("reversed");
    expect(
      validateAllSteps({
        projectName: "",
        description: "",
        programId: "",
        standardIds: [],
        leadId: "",
        startDate: undefined,
        endDate: undefined,
      }).isValid,
    ).toBe(false);
  });
  it("builds only the selected program's standards, unique IDs and fresh template tasks", () => {
    // Arrange
    const existing = {
      id: "existing",
      item: "Reviewed work",
      standardId: "LAB.1",
      status: ComplianceStatus.Compliant,
      assignedTo: "lead",
      dueDate: "",
      actionPlan: "",
      notes: "Keep",
      evidenceFiles: ["proof"],
      comments: [],
    };
    // Act
    const created = buildProjectChecklist(
      "ohas",
      ["LAB.1", "LAB.1"],
      standards,
      [],
    );
    const edited = buildProjectChecklist(
      "ohas",
      ["LAB.2"],
      standards,
      [],
      [existing],
    );
    // Assert
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      item: "Control specimen identity",
      status: ComplianceStatus.NotStarted,
      evidenceFiles: [],
    });
    expect(edited[0]).toEqual(existing);
    expect(edited).toHaveLength(2);
    expect(() =>
      buildProjectChecklist("ohas", ["unknown"], standards, []),
    ).toThrow("unavailable");
  });
  it("collapses identical source duplicates and blocks conflicting identifiers instead of guessing their text", () => {
    // Arrange
    const records = [
      standards[0],
      { ...standards[0], id: "duplicate" },
      { ...standards[2], description: "Conflicting transport requirement" },
      standards[2],
    ];
    // Act
    const resolved = resolveProjectStandards(records);
    // Assert
    expect(resolved.standards).toHaveLength(1);
    expect(resolved.conflicts).toEqual([
      { programId: "ohas", standardId: "LAB.2" },
    ]);
    expect(() => buildProjectChecklist("ohas", ["LAB.2"], records, [])).toThrow(
      "unavailable",
    );
    expect(buildProjectChecklist("ohas", ["LAB.1"], records, [])).toHaveLength(
      1,
    );
  });
  it("prevents step skipping and clears a successful draft without a delayed rewrite", () => {
    // Arrange
    jest.useFakeTimers();
    const hook = renderHook(() => useProjectWizard({ draftKey: "account-a" }));
    // Act
    act(() => hook.result.current.goToStep(3));
    // Assert
    expect(hook.result.current.currentStep).toBe(0);
    act(() =>
      hook.result.current.updateData({ projectName: "Laboratory project" }),
    );
    act(() => hook.result.current.clearDraft());
    act(() => jest.advanceTimersByTime(1000));
    expect(localStorage.getItem("account-a")).toBeNull();
    hook.unmount();
    jest.useRealTimers();
  });
  it("does not restore another account's draft or persist edit data", () => {
    // Arrange
    jest.useFakeTimers();
    localStorage.setItem(
      "account-a",
      JSON.stringify({ projectName: "Foreign draft" }),
    );
    // Act
    const hook = renderHook(() =>
      useProjectWizard({
        draftKey: "account-b",
        isEditMode: true,
        initialData: { projectName: "Edit only" },
      }),
    );
    act(() => hook.result.current.updateData({ description: "Private edit" }));
    act(() => jest.advanceTimersByTime(1000));
    // Assert
    expect(hook.result.current.data.projectName).toBe("Edit only");
    expect(localStorage.getItem("account-b")).toBeNull();
    hook.unmount();
    jest.useRealTimers();
  });
  it("restores its own scoped draft with dates and refuses corrupted draft fields", () => {
    // Arrange
    jest.useFakeTimers();
    const hook = renderHook(() => useProjectWizard({ draftKey: "account-a" }));
    act(() =>
      hook.result.current.updateData({
        projectName: "Saved setup",
        leadId: "lead",
        startDate: new Date(2030, 0, 1),
      }),
    );
    act(() => hook.result.current.saveDraft());
    hook.unmount();
    // Act
    const restored = renderHook(() =>
      useProjectWizard({ draftKey: "account-a" }),
    );
    // Assert
    expect(restored.result.current.data.projectName).toBe("Saved setup");
    expect(restored.result.current.data.startDate).toBeInstanceOf(Date);
    expect(restored.result.current.draftStatus).toBe("restored");
    restored.unmount();
    localStorage.setItem(
      "corrupt",
      JSON.stringify({ standardIds: "wrong shape" }),
    );
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const failed = renderHook(() => useProjectWizard({ draftKey: "corrupt" }));
    act(() => jest.advanceTimersByTime(1000));
    expect(failed.result.current.draftStatus).toBe("failed");
    expect(localStorage.getItem("corrupt")).toContain("wrong shape");
    failed.unmount();
    log.mockRestore();
    jest.useRealTimers();
  });
  const validData = (): WizardData => ({
    templateId: null,
    projectName: "Laboratory project",
    description: "",
    programId: "ohas",
    standardIds: ["LAB.1"],
    leadId: "lead",
    teamMemberIds: [],
    teamMemberRoles: {},
    departmentIds: [],
    startDate: new Date(),
    endDate: undefined,
    checklistItems: [],
    aiEnhanced: false,
  });
  it("adds visible standards without erasing earlier selections and clears template scope on program changes", () => {
    // Arrange
    const update = jest.fn();
    const data = { ...validData(), templateId: "old-template" };
    render(
      <Step2ProgramStandards
        data={data}
        updateData={update}
        validationErrors={{}}
        touched={{}}
        touchField={jest.fn()}
        programs={[
          { id: "ohas", name: "OHAS", description: { en: "", ar: "" } },
          { id: "other", name: "Other", description: { en: "", ar: "" } },
        ]}
        allStandards={standards}
      />,
    );
    // Act
    fireEvent.change(
      screen.getByRole("textbox", { name: /search standards/i }),
      { target: { value: "transport" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /select all/i }));
    // Assert
    expect(update).toHaveBeenLastCalledWith({
      standardIds: ["LAB.1", "LAB.2"],
    });
    fireEvent.click(screen.getByRole("button", { name: /Other/ }));
    expect(update).toHaveBeenLastCalledWith({
      programId: "other",
      standardIds: [],
      templateId: null,
      checklistItems: [],
    });
  });
  it("requires reviewing and applying valid AI dates and preserves existing dates on invalid output", async () => {
    // Arrange
    const update = jest.fn();
    jest.mocked(aiAgentService.chat).mockResolvedValue({
      response: "START: 2030-01-01\nEND: 2030-03-01",
    } as Awaited<ReturnType<typeof aiAgentService.chat>>);
    render(
      <Step3TeamTimeline
        data={validData()}
        updateData={update}
        validationErrors={{}}
        touched={{}}
        touchField={jest.fn()}
        users={[user]}
        departments={[]}
      />,
    );
    // Act
    fireEvent.click(
      screen.getByRole("button", { name: en.setupSuggestTimeline }),
    );
    // Assert
    await screen.findByRole("button", { name: en.setupApplyTimeline });
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: en.setupApplyTimeline }),
    );
    expect(update).toHaveBeenCalledWith({
      startDate: new Date(2030, 0, 1),
      endDate: new Date(2030, 2, 1),
    });
    update.mockClear();
    jest
      .mocked(aiAgentService.chat)
      .mockResolvedValue({ response: "No dates" } as Awaited<
        ReturnType<typeof aiAgentService.chat>
      >);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.click(
      screen.getByRole("button", { name: en.setupSuggestTimeline }),
    );
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(update).not.toHaveBeenCalled();
    log.mockRestore();
  });
  const reachReview = () => {
    fireEvent.change(screen.getByLabelText(/project name/i), {
      target: { value: "  Laboratory project  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /OHAS/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /LAB.1/ }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    const leadSelect = screen.getByLabelText(/project lead/i);
    expect(leadSelect).not.toHaveTextContent("Read-only colleague");
    expect(leadSelect).not.toHaveTextContent("Other organization");
    expect(leadSelect).not.toHaveTextContent("Inactive colleague");
    fireEvent.change(leadSelect, { target: { value: "lead" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
  };
  it("shows the actual checklist preview and opens the persisted project after saving", async () => {
    // Arrange
    render(<CreateProjectWizard setNavigation={navigate} />);
    // Act
    reachReview();
    // Assert
    expect(screen.getByText("Control specimen identity")).toBeInTheDocument();
    expect(screen.queryByText("Wrong program text")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        view: "projectDetail",
        projectId: "new-project",
      }),
    );
    expect(addProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Laboratory project",
        programId: "ohas",
        standardIds: ["LAB.1"],
        checklist: [
          expect.objectContaining({
            standardId: "LAB.1",
            item: "Control specimen identity",
          }),
        ],
      }),
    );
    expect(success).toHaveBeenCalled();
  });
  it("preserves the review on failure and does not show success or navigate", async () => {
    // Arrange
    addProject.mockRejectedValue(new Error("Network unavailable"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<CreateProjectWizard setNavigation={navigate} />);
    reachReview();
    // Act
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    // Assert
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(success).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByText("Control specimen identity")).toBeInTheDocument();
    log.mockRestore();
  });
  it("blocks unauthorized setup before rendering the form", () => {
    // Arrange
    permitted = false;
    // Act
    render(<CreateProjectWizard />);
    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(en.setupUnavailable);
    expect(screen.queryByLabelText(/project name/i)).not.toBeInTheDocument();
  });
  it("locks submission and does not redirect after leaving while a save is pending", async () => {
    // Arrange
    let finish: (record: { id: string }) => void = () => {};
    addProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = render(<CreateProjectWizard setNavigation={navigate} />);
    reachReview();
    // Act
    const create = screen.getByRole("button", { name: /create project/i });
    fireEvent.click(create);
    fireEvent.click(create);
    // Assert
    expect(addProject).toHaveBeenCalledTimes(1);
    expect(create).toBeDisabled();
    view.unmount();
    await act(async () => finish({ id: "saved-after-leaving" }));
    expect(navigate).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
  });
  it("preserves recorded checklist evidence when editing and adds selected requirements", async () => {
    // Arrange
    const checklist = buildProjectChecklist("ohas", ["LAB.1"], standards, []);
    checklist[0].status = ComplianceStatus.Compliant;
    checklist[0].evidenceFiles = ["approved-proof"];
    projects = [
      {
        id: "existing-project",
        organizationId: "org-a",
        name: "Existing project",
        programId: "ohas",
        status: ProjectStatus.InProgress,
        projectLead: user,
        startDate: new Date(2020, 0, 1).toISOString(),
        checklist,
        progress: 100,
        createdAt: "",
        updatedAt: "",
      },
    ];
    render(
      <CreateProjectWizard
        projectId="existing-project"
        setNavigation={navigate}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /LAB.2/ }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    // Assert
    await waitFor(() => expect(updateProject).toHaveBeenCalled());
    expect(updateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        checklist: [
          expect.objectContaining({
            id: checklist[0].id,
            status: ComplianceStatus.Compliant,
            evidenceFiles: ["approved-proof"],
          }),
          expect.objectContaining({
            standardId: "LAB.2",
            status: ComplianceStatus.NotStarted,
          }),
        ],
      }),
    );
    expect(addProject).not.toHaveBeenCalled();
  });
});
