import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SurveyComponent from "@/components/projects/SurveyComponent";
import {
  ChecklistItem,
  MockSurvey,
  Project,
  ProjectStatus,
} from "@/types";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/components/ai/AIResponseView", () => () => null);

const checklistItem: ChecklistItem = {
  id: "requirement-1",
  item: "Maintain specimen identification controls",
  standardId: "LAB.1",
  status: "Not Started",
  assignedTo: "",
  dueDate: "",
  actionPlan: "",
  notes: "",
  evidenceFiles: [],
  comments: [],
};

const project: Project = {
  id: "project-1",
  name: "Laboratory",
  programId: "ohas",
  status: ProjectStatus.InProgress,
  startDate: "",
  progress: 0,
  checklist: [checklistItem],
  createdAt: "",
  updatedAt: "",
};

const survey: MockSurvey = {
  id: "survey-1",
  date: "2026-10-11T00:00:00.000Z",
  results: [],
  status: ProjectStatus.InProgress,
  createdAt: "",
  updatedAt: "",
};

describe("SurveyComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates and persists results for surveys that start with no results", async () => {
    // Arrange
    const onUpdateSurvey = jest.fn().mockResolvedValue(undefined);
    render(
      <SurveyComponent
        project={project}
        survey={survey}
        users={[]}
        onUpdateSurvey={onUpdateSurvey}
        setNavigation={jest.fn()}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "surveyPass" }));
    fireEvent.change(screen.getByPlaceholderText("surveyorNotes"), {
      target: { value: "Identification verified." },
    });
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    // Assert
    await waitFor(() =>
      expect(onUpdateSurvey).toHaveBeenCalledWith(
        project.id,
        expect.objectContaining({
          results: [
            {
              id: `${survey.id}-${checklistItem.id}`,
              itemId: checklistItem.id,
              checklistItemId: checklistItem.id,
              result: "Pass",
              notes: "Identification verified.",
            },
          ],
        }),
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("projectSurveySaved");
  });

  it("does not navigate to the report when completion fails to persist", async () => {
    // Arrange
    const onUpdateSurvey = jest
      .fn()
      .mockRejectedValue(new Error("Write failed"));
    const setNavigation = jest.fn();
    render(
      <SurveyComponent
        project={project}
        survey={survey}
        users={[]}
        onUpdateSurvey={onUpdateSurvey}
        setNavigation={setNavigation}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "completeSurvey" }));

    // Assert
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "projectSurveyCompleteFailed",
      ),
    );
    expect(setNavigation).not.toHaveBeenCalled();
  });

  it("reports a failed progress save instead of claiming success", async () => {
    // Arrange
    const onUpdateSurvey = jest.fn().mockRejectedValue(new Error("Write failed"));
    render(
      <SurveyComponent
        project={project}
        survey={survey}
        users={[]}
        onUpdateSurvey={onUpdateSurvey}
        setNavigation={jest.fn()}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));

    // Assert
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("projectSurveySaveFailed"),
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("keeps completed or finalized surveys read-only", () => {
    // Arrange
    const onUpdateSurvey = jest.fn().mockResolvedValue(undefined);
    render(
      <SurveyComponent
        project={{ ...project, status: ProjectStatus.Finalized }}
        survey={{ ...survey, status: ProjectStatus.Completed }}
        users={[]}
        onUpdateSurvey={onUpdateSurvey}
        setNavigation={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "surveyPass" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "saveChanges" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "completeSurvey" }),
    ).not.toBeInTheDocument();
    expect(onUpdateSurvey).not.toHaveBeenCalled();
  });
});
