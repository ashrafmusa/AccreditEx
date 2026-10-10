import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ProjectListPage from "@/pages/ProjectListPage";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectAnalytics from "@/components/projects/ProjectAnalytics";
import {
  projectCalendarDate,
  projectWorkSummary,
} from "@/utils/projectJourney";
import { en } from "@/data/locales/en/projects";
import { ar } from "@/data/locales/ar/projects";
import { en as common } from "@/data/locales/en/common";
import { ar as arabicCommon } from "@/data/locales/ar/common";
import { en as dashboard } from "@/data/locales/en/dashboard";
import { permissionService } from "@/services/permissionService";
import {
  AccreditationProgram,
  ChecklistItem,
  ComplianceStatus,
  Project,
  ProjectStatus,
  User,
  UserRole,
} from "@/types";

let language: "en" | "ar" = "en";
let actor: User;
let projects: Project[];
let loadError: string | null = null;
const removeProject = jest.fn();
const archiveProjects = jest.fn();
const retry = jest.fn();
const success = jest.fn();
const failure = jest.fn();
const confirm = jest.fn();
const user: User = {
  id: "u1",
  name: "Alya",
  email: "test@example.com",
  role: UserRole.Admin,
  organizationId: "org-a",
};
const programs: AccreditationProgram[] = [
  { id: "ohas", name: "OHAS", description: { en: "", ar: "" } },
];
const appState = {
  accreditationPrograms: programs,
  departments: [{ id: "lab", name: { en: "Laboratory", ar: "المختبر" } }],
};
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    lang: language,
    t: (key: string, params?: Record<string, string | number>) => {
      const messages: Record<string, unknown> =
        language === "en"
          ? { ...common, ...dashboard, ...en }
          : { ...arabicCommon, ...ar };
      return Object.entries(params || {}).reduce(
        (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
        typeof messages[key] === "string" ? messages[key] : key,
      );
    },
  }),
}));
jest.mock("@/hooks/usePermission", () => ({
  ...jest.requireActual("@/hooks/usePermission"),
  usePermission: () => ({
    isAdmin: actor.role === UserRole.Admin,
    can: (
      action: Parameters<typeof permissionService.can>[1],
      resource: Parameters<typeof permissionService.can>[2],
    ) => permissionService.can(actor, action, resource),
  }),
}));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => ({
    projects,
    error: loadError,
    loading: false,
    fetchAllProjects: retry,
    deleteProject: removeProject,
    bulkArchiveProjects: archiveProjects,
    bulkRestoreProjects: jest.fn(),
    bulkDeleteProjects: jest.fn(),
    bulkUpdateStatus: jest.fn(),
  }),
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: (selector?: (state: typeof appState) => unknown) =>
    selector ? selector(appState) : appState,
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => ({ currentUser: actor, users: [user] }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success, error: failure }),
}));
jest.mock("@/hooks/useKeyboardNavigation", () => ({
  useKeyboardShortcuts: jest.fn(),
}));
jest.mock("@/stores/useConfirmStore", () => ({
  useConfirmStore: { getState: () => ({ confirm }) },
}));
jest.mock("@/components/common/UserAvatar", () => ({
  __esModule: true,
  default: ({ user }: { user: User }) => <span>{user.name}</span>,
}));

const item = (
  id: string,
  status: ComplianceStatus = ComplianceStatus.NotStarted,
  assignedTo = "",
  dueDate = "2026-10-09",
): ChecklistItem => ({
  id,
  item: id,
  standardId: "LAB.1",
  status,
  assignedTo,
  dueDate,
  actionPlan: "",
  notes: "",
  evidenceFiles: [],
  comments: [],
});
const project = (id: string, overrides: Partial<Project> = {}): Project => ({
  id,
  name: id,
  organizationId: "org-a",
  programId: "ohas",
  status: ProjectStatus.InProgress,
  progress: 25,
  checklist: [],
  startDate: "2026-10-01",
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
  ...overrides,
});
const renderPage = () => {
  const navigate = jest.fn();
  render(<ProjectListPage setNavigation={navigate} />);
  return navigate;
};

describe("Projects action-first journey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    language = "en";
    actor = user;
    loadError = null;
    confirm.mockResolvedValue(true);
    projects = [
      project("Alpha", { departmentId: "lab", projectLead: user }),
      project("Beta"),
      project("Archived", { archived: true }),
      project("Other tenant", { organizationId: "org-b" }),
    ];
  });

  it.each(["OHAS", "Laboratory", "Alya"])(
    "searches project program, department and lead using %s",
    (term) => {
      // Arrange
      renderPage();
      // Act
      fireEvent.change(
        screen.getByRole("textbox", { name: en.searchProjects }),
        { target: { value: ` ${term} ` } },
      );
      // Assert
      expect(
        screen.getByRole("article", { name: "Alpha" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("article", { name: "Other tenant" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("article", { name: "Archived" }),
      ).not.toBeInTheDocument();
    },
  );

  it("labels the card status, ownership, checklist work and real project navigation", () => {
    // Arrange
    projects = [
      project("Alpha", {
        projectLead: user,
        checklist: [
          item("open"),
          item("done", ComplianceStatus.Compliant),
          item("na", ComplianceStatus.NotApplicable),
        ],
        teamMembers: [user.id],
      }),
    ];
    const navigate = renderPage();
    const card = screen.getByRole("article", { name: "Alpha" });
    // Assert
    expect(within(card).getByText("In Progress")).toBeInTheDocument();
    expect(within(card).getByText("1 outstanding")).toBeInTheDocument();
    expect(
      within(card).getByText("1 unassigned outstanding"),
    ).toBeInTheDocument();
    expect(
      within(card).getByText("1 of 3 requirements marked compliant"),
    ).toBeInTheDocument();
    expect(within(card).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    expect(within(card).getByText(en.projectNoTargetDate)).toBeInTheDocument();
    expect(screen.getByText(en.projectListHelp)).toBeInTheDocument();
    // Act
    fireEvent.click(
      within(card).getByRole("button", { name: "Open project: Alpha" }),
    );
    // Assert
    expect(navigate).toHaveBeenCalledWith({
      view: "projectDetail",
      projectId: "Alpha",
    });
  });

  it("uses labelled inclusive start/end filters and resets search-only empty results", () => {
    // Arrange
    projects = [
      project("Alpha", { endDate: "2026-10-10" }),
      project("Beta", { endDate: "2026-10-11" }),
    ];
    renderPage();
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.projectFilters }));
    fireEvent.change(screen.getByLabelText(en.projectEndBy), {
      target: { value: "2026-10-10" },
    });
    fireEvent.change(screen.getByLabelText(en.projectStartFrom), {
      target: { value: "2026-10-01" },
    });
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article", { name: "Alpha" })).toBeInTheDocument();
    // Act
    fireEvent.click(screen.getByRole("button", { name: common.clearFilters }));
    fireEvent.change(screen.getByRole("textbox", { name: en.searchProjects }), {
      target: { value: "missing" },
    });
    // Assert
    expect(screen.getByText(en.noProjectsFound)).toBeInTheDocument();
    // Act
    fireEvent.click(
      screen.getAllByRole("button", { name: common.clearFilters })[0],
    );
    // Assert
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("sorts by target date and remaining work without moving undated projects ahead of dated ones", () => {
    // Arrange
    projects = [
      project("Undated"),
      project("Later", { endDate: "2026-10-11", checklist: [item("one")] }),
      project("Earlier", {
        endDate: "2026-10-10",
        checklist: [item("one"), item("two")],
      }),
    ];
    renderPage();
    // Act
    fireEvent.change(screen.getByRole("combobox", { name: en.projectSort }), {
      target: { value: "deadline" },
    });
    // Assert
    expect(
      screen.getAllByRole("article").map((el) => el.getAttribute("aria-label")),
    ).toEqual(["Earlier", "Later", "Undated"]);
    // Act
    fireEvent.change(screen.getByRole("combobox", { name: en.projectSort }), {
      target: { value: "remaining" },
    });
    // Assert
    expect(
      screen.getAllByRole("article").map((el) => el.getAttribute("aria-label")),
    ).toEqual(["Earlier", "Later", "Undated"]);
  });

  it("limits bulk operations to selected projects currently visible and hides selection in archive mode", async () => {
    // Arrange
    renderPage();
    fireEvent.click(
      screen.getByRole("button", { name: en.projectSelectVisible }),
    );
    // Act
    fireEvent.change(screen.getByRole("textbox", { name: en.searchProjects }), {
      target: { value: "Alpha" },
    });
    fireEvent.click(screen.getByRole("button", { name: common.archive }));
    // Assert
    await waitFor(() =>
      expect(archiveProjects).toHaveBeenCalledWith(["Alpha"]),
    );
    expect(archiveProjects).not.toHaveBeenCalledWith(
      expect.arrayContaining(["Beta"]),
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: common.clearFilters }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select project: Beta" }),
    );
    fireEvent.click(screen.getByRole("button", { name: en.showArchived }));
    // Assert
    expect(
      screen.queryByRole("button", { name: common.archive }),
    ).not.toBeInTheDocument();
  });

  it("includes assigned requirement owners in My Projects and hides mutation actions for read-only users", () => {
    // Arrange
    actor = { ...user, role: UserRole.Viewer };
    projects = [
      project("Assigned", {
        checklist: [item("task", ComplianceStatus.NotStarted, user.id)],
      }),
      project("Unassigned"),
    ];
    // Act
    renderPage();
    // Assert
    expect(
      screen.getByRole("article", { name: "Assigned" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "Unassigned" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Delete project:/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Edit project:/ }),
    ).not.toBeInTheDocument();
  });

  it("shows load errors explicitly instead of an empty state or cached project cards", () => {
    // Arrange
    loadError = "failed";
    renderPage();
    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(en.projectLoadError);
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.projectRetry }));
    // Assert
    expect(retry).toHaveBeenCalled();
  });

  it("does not report deletion success before the operation resolves and surfaces rejection", async () => {
    // Arrange
    let rejectDelete: (reason: Error) => void = () => {};
    removeProject.mockReturnValue(
      new Promise<void>((_, reject) => {
        rejectDelete = reject;
      }),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    renderPage();
    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Delete project: Alpha" }),
    );
    await waitFor(() => expect(removeProject).toHaveBeenCalledWith("Alpha"));
    // Assert
    expect(success).not.toHaveBeenCalled();
    // Act
    await act(async () => rejectDelete(new Error("Denied")));
    // Assert
    expect(failure).toHaveBeenCalledWith("Denied");
    expect(success).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("localizes project controls, statuses and department names in Arabic", () => {
    // Arrange
    language = "ar";
    renderPage();
    // Act
    fireEvent.click(screen.getByRole("button", { name: ar.projectFilters }));
    // Assert
    expect(
      screen.getByRole("combobox", { name: ar.program }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "المختبر" })).toBeInTheDocument();
    expect(
      screen.getAllByText(ar.projectStatusInProgress).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "فتح المشروع: Alpha" }),
    ).toBeInTheDocument();
  });
});

describe("Project work summaries", () => {
  beforeEach(() => {
    language = "en";
    actor = user;
  });
  it("counts all non-terminal CAPA statuses rather than only Open", () => {
    // Arrange
    const p = project("P", {
      capaReports: [
        ProjectStatus.Open,
        ProjectStatus.InProgress,
        ProjectStatus.OnHold,
        ProjectStatus.Completed,
        ProjectStatus.Closed,
        ProjectStatus.Finalized,
      ].map((status, index) => ({
        id: String(index),
        status,
        checklistItemId: "task",
        rootCause: "",
        correctiveAction: "",
        createdAt: "2026-10-01",
        updatedAt: "2026-10-01",
      })),
    });
    // Act
    const summary = projectWorkSummary(p);
    // Assert
    expect(summary.openCapa).toBe(3);
  });
  it("uses local calendar deadlines, rejects impossible dates and excludes complete/not-applicable tasks", () => {
    // Arrange
    const p = project("P", {
      checklist: [
        item("late"),
        item("today", ComplianceStatus.NotStarted, user.id, "2026-10-10"),
        item("done", ComplianceStatus.Compliant),
        item("na", ComplianceStatus.NotApplicable),
        item("invalid", ComplianceStatus.NotStarted, "", "2026-02-30"),
      ],
    });
    // Act
    const work = projectWorkSummary(p, new Date(2026, 9, 10, 15));
    // Assert
    expect(work).toMatchObject({
      remaining: 3,
      unassigned: 2,
      overdue: 1,
      completed: 1,
      total: 5,
    });
    expect(projectCalendarDate("2026-10-10")?.getDate()).toBe(10);
    expect(projectCalendarDate("2026-02-30")).toBeNull();
    expect(projectCalendarDate("invalid")).toBeNull();
  });

  it("does not display invalid progress as zero or an invalid target as scheduled", () => {
    // Arrange
    actor = user;
    // Act
    render(
      <ProjectCard
        project={{
          ...project("P", { progress: NaN, endDate: "bad" }),
          programName: "OHAS",
        }}
        currentUser={user}
        onSelect={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    // Assert
    expect(screen.getByText(en.projectNotAssessed)).toBeInTheDocument();
    expect(screen.getByText(en.projectInvalidDate)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("counts completed projects accurately and localizes analytics statuses", () => {
    // Arrange
    language = "en";
    const records = [
      project("complete", { status: ProjectStatus.Completed }),
      project("final", { status: ProjectStatus.Finalized }),
      project("active"),
    ];
    // Act
    render(<ProjectAnalytics projects={records} />);
    // Assert
    expect(
      screen.getByText(common.completedProjects).parentElement?.parentElement,
    ).toHaveTextContent("2");
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText(en.projectAverageChecklist)).toBeInTheDocument();
  });
});
