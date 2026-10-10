import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import { aiAgentService } from "@/services/aiAgentService";
import { en } from "@/data/locales/en/projects";
import { ar } from "@/data/locales/ar/projects";
import { Project, ProjectStatus, UserRole } from "@/types";

let language: "en" | "ar" = "en";
let failed = false;
const retry = jest.fn();
const finalize = jest.fn();
const toastError = jest.fn();
let project: Project;
jest.mock("@/hooks/useProjectRecord", () => ({
  useProjectRecord: () => ({
    project,
    loading: false,
    missing: false,
    failed,
    retry,
  }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    lang: language,
    t: (key: string, params?: Record<string, string | number>) => {
      const messages: Record<string, unknown> = language === "en" ? en : ar;
      return Object.entries(params || {}).reduce(
        (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
        typeof messages[key] === "string" ? messages[key] : key,
      );
    },
  }),
}));
jest.mock("@/hooks/usePermission", () => ({
  Action: { Read: "read", Update: "update" },
  Resource: {
    Project: "project",
    Document: "document",
    Audit: "audit",
    Report: "report",
  },
  usePermission: () => ({ can: () => true }),
}));
jest.mock("@/stores/useModuleStore", () => ({
  useModuleStore: (
    selector?: (state: { isNavKeyEnabled: () => boolean }) => unknown,
  ) => {
    const state = { isNavKeyEnabled: () => true };
    return selector ? selector(state) : state;
  },
}));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => ({
    finalizeProject: finalize,
    updateProject: jest.fn(),
    updateDesignControls: jest.fn(),
    generateReport: jest.fn(),
  }),
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => ({
    currentUser: { id: "u1", name: "Reviewer", role: UserRole.Admin },
  }),
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => ({
    accreditationPrograms: [],
    documents: [],
    standards: [],
    risks: [],
  }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ error: toastError, success: jest.fn(), info: jest.fn() }),
}));
jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { chat: jest.fn() },
}));
jest.mock(
  "@/components/ai/AISuggestionModal",
  () =>
    (props: { isOpen: boolean; content: string; footer: React.ReactNode }) =>
      props.isOpen ? (
        <div role="dialog">
          {props.content}
          {props.footer}
        </div>
      ) : null,
);
jest.mock("@/components/documents/GenerateReportModal", () => () => null);
jest.mock("@/components/common/ContextualHelp", () => ({
  ContextualHelp: () => null,
}));
jest.mock("@/pages/ProjectOverview", () => () => <div>Overview content</div>);
jest.mock(
  "@/components/projects/ProjectChecklist",
  () => (props: { readOnly: boolean }) => (
    <div>{props.readOnly ? "Read-only checklist" : "Editable checklist"}</div>
  ),
);
jest.mock("@/components/projects/PDCACycleManager", () => () => (
  <div>PDCA content</div>
));
jest.mock("@/components/projects/DesignControlsComponent", () => () => null);
jest.mock("@/components/projects/SurveyListComponent", () => () => null);
jest.mock("@/components/audits/AuditLogComponent", () => () => null);

describe("Project detail user journey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    failed = false;
    language = "en";
    project = {
      id: "p1",
      name: "Laboratory",
      programId: "ohas",
      status: ProjectStatus.InProgress,
      startDate: "",
      progress: 0,
      checklist: [],
      createdAt: "",
      updatedAt: "",
    };
  });
  it("provides project-scoped evidence navigation and a selected accessible workspace section", async () => {
    // Arrange
    const navigate = jest.fn();
    render(
      <ProjectDetailPage
        navigation={{ view: "projectDetail", projectId: "p1" }}
        setNavigation={navigate}
      />,
    );
    // Act
    fireEvent.click(
      screen.getByRole("button", {
        name: en.projectEvidenceAction.replace("{count}", "0"),
      }),
    );
    await screen.findByText(en.noProjectDocuments);
    fireEvent.click(
      screen.getByRole("button", { name: en.viewAllInDocControl }),
    );
    // Assert
    expect(navigate).toHaveBeenCalledWith({
      view: "documentControl",
      filter: "project:p1",
    });
    expect(
      screen.getByRole("navigation", { name: en.projectWorkspaceSections }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en["projects.documents"] }),
    ).toHaveAttribute("aria-current", "page");
  });
  it("shows localized failure and retry without rendering a cached project", () => {
    // Arrange
    failed = true;
    language = "ar";
    render(
      <ProjectDetailPage
        navigation={{ view: "projectDetail", projectId: "p1" }}
        setNavigation={jest.fn()}
      />,
    );
    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      ar.projectDetailLoadError,
    );
    expect(screen.queryByText("Laboratory")).not.toBeInTheDocument();
    // Act
    fireEvent.click(screen.getByRole("button", { name: ar.projectRetry }));
    expect(retry).toHaveBeenCalled();
  });
  it("does not open a signature or finalize after AI failure", async () => {
    // Arrange
    jest
      .mocked(aiAgentService.chat)
      .mockRejectedValue(new Error("AI unavailable"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ProjectDetailPage
        navigation={{ view: "projectDetail", projectId: "p1" }}
        setNavigation={jest.fn()}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.finalizeProject }));
    // Assert
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(en.projectReadinessFailed),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(finalize).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it("requires an advisory review followed by an actual password before finalization", async () => {
    // Arrange
    jest
      .mocked(aiAgentService.chat)
      .mockResolvedValue({ response: "Review unresolved work" } as Awaited<
        ReturnType<typeof aiAgentService.chat>
      >);
    render(
      <ProjectDetailPage
        navigation={{ view: "projectDetail", projectId: "p1" }}
        setNavigation={jest.fn()}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.finalizeProject }));
    await screen.findByText(en.projectReadinessAdvisory);
    fireEvent.click(
      screen.getByRole("button", { name: en.projectProceedSignature }),
    );
    fireEvent.change(screen.getByLabelText("enterPasswordToSign"), {
      target: { value: "entered" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: en.finalizeProject,
      }),
    );
    // Assert
    await waitFor(() => expect(finalize).toHaveBeenCalledWith("p1", "entered"));
    expect(jest.mocked(aiAgentService.chat).mock.calls[0][0]).toContain(
      "Unresolved Document References: 0",
    );
  });
  it("makes finalized requirements read-only and removes finalization control", async () => {
    // Arrange
    project = { ...project, status: ProjectStatus.Finalized };
    render(
      <ProjectDetailPage
        navigation={{ view: "projectDetail", projectId: "p1" }}
        setNavigation={jest.fn()}
      />,
    );
    // Act
    fireEvent.click(
      screen.getByRole("button", {
        name: en.projectRequirementsAction.replace("{count}", "0"),
      }),
    );
    // Assert
    expect(await screen.findByText("Read-only checklist")).toBeInTheDocument();
    expect(screen.getByText(en.projectReadOnlyNotice)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: en.finalizeProject }),
    ).not.toBeInTheDocument();
  });
});
