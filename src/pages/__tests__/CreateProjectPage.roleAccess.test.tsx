import { render, screen } from "@testing-library/react";
import CreateProjectPage from "../CreateProjectPage";

const mockUseTranslation = jest.fn();
const mockUseProjectStore = jest.fn();
const mockUseUserStore = jest.fn();
const mockUseAppStore = jest.fn();
const mockUseToast = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => mockUseProjectStore(),
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => mockUseUserStore(),
}));

jest.mock("@/stores/useAppStore", () => {
  const useAppStore: any = () => mockUseAppStore();
  useAppStore.getState = () => ({ departments: [] });
  return { useAppStore };
});

jest.mock("@/hooks/useToast", () => ({
  useToast: () => mockUseToast(),
}));

jest.mock("@/components/common/ContextualHelp", () => ({
  ContextualHelp: () => null,
}));

jest.mock("@/components/projects/TemplateSelector", () => () => null);

jest.mock("@/components/ui/DatePicker", () => () => null);

jest.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/icons", () => ({
  FolderIcon: () => <span />,
  ArrowLeftIcon: () => <span />,
}));

jest.mock("@/data/helpContent", () => ({
  getHelpContent: () => ({ title: "help", content: "help" }),
}));

jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: {
    chat: jest.fn(),
  },
}));

describe("CreateProjectPage role access integration", () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({ t: (k: string) => k });
    mockUseToast.mockReturnValue({ success: jest.fn(), error: jest.fn() });

    mockUseProjectStore.mockReturnValue({
      addProject: jest.fn(),
      projects: [
        {
          id: "p1",
          name: "Existing Project",
          description: "desc",
          programId: "prog1",
          projectLead: { id: "u1", name: "Lead" },
          startDate: "2026-01-01",
          endDate: null,
          checklist: [],
          teamMembers: [],
        },
      ],
      updateProject: jest.fn(),
    });

    mockUseAppStore.mockReturnValue({
      accreditationPrograms: [{ id: "prog1", name: "JCI" }],
      projectTemplates: [],
      getTemplatesByProgram: jest.fn(() => []),
      standards: [],
    });

    mockUseUserStore.mockReturnValue({
      users: [
        { id: "u1", name: "Project Lead", role: "ProjectLead", isActive: true },
        { id: "u2", name: "Admin User", role: "Admin", isActive: true },
        { id: "u3", name: "Auditor User", role: "Auditor", isActive: true },
        { id: "u4", name: "Team User", role: "TeamMember", isActive: true },
      ],
    });
  });

  it("shows only Admin and ProjectLead in project lead selector", () => {
    render(
      <CreateProjectPage
        navigation={{ view: "editProject", projectId: "p1" }}
        setNavigation={jest.fn()}
      />,
    );

    const leadSelect = screen.getByLabelText(
      "projectLead",
    ) as HTMLSelectElement;
    const optionValues = Array.from(leadSelect.options).map(
      (o) => o.textContent,
    );

    expect(optionValues).toContain("Project Lead");
    expect(optionValues).toContain("Admin User");
    expect(optionValues).not.toContain("Auditor User");
    expect(optionValues).not.toContain("Team User");
  });
});
