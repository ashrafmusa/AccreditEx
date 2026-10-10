import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import MyTasksPage from "@/pages/MyTasksPage";
import AccreditationJourneyGuide from "@/components/common/AccreditationJourneyGuide";
import ProgramCard from "@/components/accreditation/ProgramCard";
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
import { en } from "@/data/locales/en/common";
import { ar } from "@/data/locales/ar/common";
import { en as taskMessages } from "@/data/locales/en/tasks";

let language: "en" | "ar" = "en";
let actor: User;
let disabledModules: string[] = [];
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    lang: language,
    t: (key: string) => {
      const messages: Record<string, unknown> =
        language === "ar" ? ar : { ...en, ...taskMessages };
      return typeof messages[key] === "string" ? messages[key] : key;
    },
  }),
}));
jest.mock("@/hooks/usePermission", () => ({
  ...jest.requireActual("@/hooks/usePermission"),
  usePermission: () => ({
    can: (
      action: Parameters<typeof permissionService.can>[1],
      resource: Parameters<typeof permissionService.can>[2],
    ) => permissionService.can(actor, action, resource),
  }),
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector: (state: { currentUser: User }) => unknown) =>
    selector({ currentUser: actor }),
}));
jest.mock("@/stores/useModuleStore", () => ({
  useModuleStore: () => ({
    isNavKeyEnabled: (view: string) => !disabledModules.includes(view),
  }),
}));

const user: User = {
  id: "u1",
  organizationId: "org-a",
  name: "Alya",
  email: "test@example.com",
  role: UserRole.Admin,
};
const task = (
  id: string,
  dueDate = "2026-10-10",
  status: ComplianceStatus = ComplianceStatus.NotStarted,
): ChecklistItem => ({
  id,
  item: id,
  standardId: "LAB.1",
  assignedTo: user.id,
  dueDate,
  status,
  actionPlan: "",
  notes: "",
  evidenceFiles: [],
  comments: [],
});
const project = (id: string, checklist: ChecklistItem[] = []): Project => ({
  id,
  name: "Same project",
  programId: "lab",
  organizationId: "org-a",
  status: ProjectStatus.InProgress,
  startDate: "2026-10-01",
  progress: 0,
  checklist,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
});
const programs: AccreditationProgram[] = [
  {
    id: "lab",
    name: "Laboratory",
    description: { en: "Lab quality", ar: "جودة المختبر" },
  },
  { id: "lab2", name: "Laboratory", description: { en: "Other", ar: "آخر" } },
];

describe("Accreditation workspace improvements", () => {
  beforeEach(() => {
    language = "en";
    actor = user;
    disabledModules = [];
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 10, 14));
  });
  afterEach(() => jest.useRealTimers());

  it("keeps equal-name programs and projects separate and opens the exact project", () => {
    // Arrange
    const navigate = jest.fn();
    render(
      <MyTasksPage
        projects={[
          project("p1", [task("first")]),
          project("p2", [task("second")]),
          { ...project("p3", [task("third")]), programId: "lab2" },
        ]}
        programs={programs}
        currentUser={user}
        setNavigation={navigate}
      />,
    );
    // Act
    fireEvent.click(
      screen.getAllByRole("button", { name: "Open project: Same project" })[1],
    );
    // Assert
    expect(screen.getAllByRole("heading", { name: "Laboratory" })).toHaveLength(
      2,
    );
    expect(
      screen.getAllByRole("heading", { name: "Same project" }),
    ).toHaveLength(3);
    expect(navigate).toHaveBeenCalledWith({
      view: "projectDetail",
      projectId: "p2",
    });
  });

  it("filters by local-calendar deadlines, excludes closed work, and handles invalid dates", () => {
    // Arrange
    render(
      <MyTasksPage
        projects={[
          project("p1", [
            task("late", "2026-10-09"),
            task("today"),
            task("week", "2026-10-17"),
            task("later", "2026-10-18"),
            task("invalid", "invalid"),
            task("done", "2026-10-01", ComplianceStatus.Compliant),
            task("na", "2026-10-01", ComplianceStatus.NotApplicable),
          ]),
        ]}
        programs={programs}
        currentUser={user}
        setNavigation={jest.fn()}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Overdue (1)" }));
    // Assert
    expect(screen.getByText("late")).toBeInTheDocument();
    expect(screen.queryByText("today")).not.toBeInTheDocument();
    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Due within 7 days (2)" }),
    );
    // Assert
    expect(screen.getByText("today")).toBeInTheDocument();
    expect(screen.getByText("week")).toBeInTheDocument();
    expect(screen.queryByText("later")).not.toBeInTheDocument();
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
    expect(screen.queryByText("done")).not.toBeInTheDocument();
    expect(screen.queryByText("na")).not.toBeInTheDocument();
  });

  it("searches requirement metadata and resets a no-match filter without losing tasks", () => {
    // Arrange
    render(
      <MyTasksPage
        projects={[project("p1", [task("Maintain QC", "invalid")])]}
        programs={programs}
        currentUser={user}
        setNavigation={jest.fn()}
      />,
    );
    // Act
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "LAB.1" },
    });
    // Assert
    expect(screen.getByText("Maintain QC")).toBeInTheDocument();
    expect(screen.getByText(en.qualityTaskInvalidDate)).toBeInTheDocument();
    // Act
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "missing" },
    });
    // Assert
    expect(screen.getByText(en.qualityTaskNoMatches)).toBeInTheDocument();
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.qualityTaskReset }));
    // Assert
    expect(screen.getByText("Maintain QC")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 1 of 1 open tasks",
    );
  });

  it("excludes foreign, unknown-ownership, archived, and other users' tasks", () => {
    // Arrange
    const records = [
      { ...project("foreign", [task("foreign")]), organizationId: "org-b" },
      { ...project("unknown", [task("unknown")]), organizationId: undefined },
      { ...project("archived", [task("archived")]), archived: true },
      project("other", [{ ...task("other"), assignedTo: "u2" }]),
    ];
    // Act
    render(
      <MyTasksPage
        projects={records}
        programs={programs}
        currentUser={user}
        setNavigation={jest.fn()}
      />,
    );
    // Assert
    expect(screen.getByText("Showing 0 of 0 open tasks")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Open project:/ }),
    ).not.toBeInTheDocument();
  });

  it.each(["en", "ar"] as const)(
    "localizes new task guidance and navigation in %s",
    (lang) => {
      // Arrange
      language = lang;
      const messages = lang === "ar" ? ar : en;
      const navigate = jest.fn();
      render(
        <MyTasksPage
          projects={[project("p1", [task("QC")])]}
          programs={programs}
          currentUser={user}
          setNavigation={navigate}
        />,
      );
      // Act
      fireEvent.click(
        screen.getByRole("button", {
          name: messages.qualityTaskOpenProjectLabel.replace(
            "{name}",
            "Same project",
          ),
        }),
      );
      // Assert
      expect(navigate).toHaveBeenCalledWith({
        view: "projectDetail",
        projectId: "p1",
      });
      expect(
        screen.getByText(messages.qualityTaskProgressNotice),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.qualityTaskPrograms.replace("{count}", "1")),
      ).toBeInTheDocument();
    },
  );

  it.each(Object.values(UserRole))(
    "preserves audit role access for %s and navigates to evidence",
    (role) => {
      // Arrange
      actor = { ...user, role };
      const navigate = jest.fn();
      render(
        <AccreditationJourneyGuide
          navigation={{ view: "projects" }}
          setNavigation={navigate}
        />,
      );
      // Act
      fireEvent.click(
        screen.getByRole("button", { name: en.qualityJourneyEvidence }),
      );
      // Assert
      expect(navigate).toHaveBeenCalledWith({ view: "documentControl" });
      expect(
        screen.queryByRole("button", { name: en.qualityJourneyAudits }) !==
          null,
      ).toBe(role === UserRole.Admin || role === UserRole.Auditor);
      expect(
        screen.getByRole("button", { name: en.qualityJourneyProjects }),
      ).toHaveAttribute("aria-current", "step");
    },
  );

  it("hides disabled modules and omits unrelated pages", () => {
    // Arrange
    disabledModules = ["auditHub", "documentControl"];
    const { rerender } = render(
      <AccreditationJourneyGuide
        navigation={{ view: "projects" }}
        setNavigation={jest.fn()}
      />,
    );
    // Assert
    expect(
      screen.queryByRole("button", { name: en.qualityJourneyAudits }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.qualityJourneyEvidence }),
    ).not.toBeInTheDocument();
    // Act
    rerender(
      <AccreditationJourneyGuide
        navigation={{ view: "settings" }}
        setNavigation={jest.fn()}
      />,
    );
    // Assert
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("provides independent keyboard-focusable program actions", () => {
    // Arrange
    const select = jest.fn();
    const edit = jest.fn();
    const remove = jest.fn();
    render(
      <ProgramCard
        program={programs[0]}
        standardCount={10}
        projectCount={2}
        canModify
        onSelect={select}
        onEdit={edit}
        onDelete={remove}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "editProgram" }));
    fireEvent.click(screen.getByRole("button", { name: "deleteProgram" }));
    // Assert
    expect(edit).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
    // Act
    const card = screen.getByRole("article");
    fireEvent.click(
      within(card).getByRole("button", { name: "View standards: Laboratory" }),
    );
    // Assert
    expect(select).toHaveBeenCalledTimes(1);
  });
});
