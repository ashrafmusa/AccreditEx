import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SurveyReportPage from "@/pages/SurveyReportPage";
import { MockSurvey, Project, ProjectStatus } from "@/types";

const success = jest.fn();
const error = jest.fn();
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/hooks/usePermission", () => ({
  ...jest.requireActual("@/services/permissionService"),
  usePermission: () => ({ can: () => true }),
}));
jest.mock("@/hooks/useToast", () => ({ useToast: () => ({ success, error }) }));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => ({
    createPDCACycle: jest.fn(),
    createCAPA: jest.fn(),
  }),
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => ({ addRisk: jest.fn() }),
}));
jest.mock("@/services/aiAgentService", () => ({ aiAgentService: {} }));
jest.mock("@/components/ai/AISuggestionModal", () => () => null);

const project: Project = {
  id: "p1",
  name: "Laboratory",
  programId: "ohas",
  status: ProjectStatus.InProgress,
  checklist: [],
  progress: 0,
  startDate: "",
  createdAt: "",
  updatedAt: "",
};
const survey: MockSurvey = {
  id: "survey1",
  date: "",
  status: ProjectStatus.Completed,
  results: [],
  createdAt: "",
  updatedAt: "",
};
describe("Project survey integration", () => {
  beforeEach(() => jest.clearAllMocks());
  it("awaits findings persistence before showing success", async () => {
    // Arrange
    let finish = () => {};
    const apply = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <SurveyReportPage
        project={project}
        survey={survey}
        users={[]}
        onApplyFindings={apply}
        setNavigation={jest.fn()}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "applyFindings" }));
    // Assert
    expect(apply).toHaveBeenCalledWith("p1", "survey1");
    expect(
      screen.getByRole("button", { name: "applyFindings" }),
    ).toBeDisabled();
    expect(success).not.toHaveBeenCalled();
    finish();
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("projectSurveyApplied"),
    );
  });
  it("surfaces failed saves and hides project mutations after finalization", async () => {
    // Arrange
    const apply = jest.fn().mockRejectedValue(new Error("Save failed"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const props = {
      project,
      survey,
      users: [],
      onApplyFindings: apply,
      setNavigation: jest.fn(),
    };
    const view = render(<SurveyReportPage {...props} />);
    // Act
    fireEvent.click(screen.getByRole("button", { name: "applyFindings" }));
    // Assert
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("projectSurveyApplyFailed"),
    );
    expect(success).not.toHaveBeenCalled();
    view.rerender(
      <SurveyReportPage
        {...props}
        project={{ ...project, status: ProjectStatus.Finalized }}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "applyFindings" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Auto-Create/ }),
    ).not.toBeInTheDocument();
    log.mockRestore();
  });
});
