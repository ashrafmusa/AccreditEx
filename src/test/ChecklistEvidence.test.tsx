import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChecklistEvidence from "@/components/projects/ChecklistEvidence";
import { cloudinaryService } from "@/services/cloudinaryService";
import { AppDocument, ChecklistItem, Project, ProjectStatus } from "@/types";

const mockAddControlledDocument = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => ({
    documents: [],
    addControlledDocument: mockAddControlledDocument,
  }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/services/cloudinaryService", () => ({
  cloudinaryService: { uploadDocument: jest.fn() },
}));
jest.mock("@/services/nativeCameraService", () => ({
  smartCapturePhoto: jest.fn(),
}));
jest.mock("@/components/common/DocumentPicker", () => () => null);
jest.mock("@/components/documents/DocumentListItem", () => () => null);
jest.mock("@/components/documents/PDFViewerModal", () => () => null);
jest.mock("@/components/documents/DocumentEditorModal", () => () => null);
jest.mock("@/components/documents/DOCXViewerModal", () => () => null);
jest.mock(
  "@/components/documents/FileUploader",
  () =>
    (props: {
      onFilesSelected: (files: File[]) => void;
      disabled?: boolean;
    }) => (
      <button
        disabled={props.disabled}
        onClick={() =>
          props.onFilesSelected([
            new File(["evidence"], "evidence.pdf", {
              type: "application/pdf",
            }),
          ])
        }
      >
        Choose evidence file
      </button>
    ),
);

const item: ChecklistItem = {
  id: "item-1",
  item: "Maintain specimen identification controls",
  standardId: "LAB.1",
  status: "NotStarted" as ChecklistItem["status"],
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
  organizationId: "org-1",
  programId: "ohas",
  status: ProjectStatus.InProgress,
  startDate: "",
  progress: 0,
  checklist: [item],
  createdAt: "",
  updatedAt: "",
};
const storedDocument: AppDocument = {
  id: "saved-evidence",
  name: { en: "evidence.pdf", ar: "evidence.pdf" },
  type: "Evidence",
  isControlled: true,
  status: "Draft",
  content: { en: "", ar: "" },
  uploadedAt: "",
  currentVersion: 1,
  versionHistory: [],
};

describe("Checklist evidence workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(cloudinaryService.uploadDocument)
      .mockResolvedValue("https://example.com/evidence.pdf");
    mockAddControlledDocument.mockResolvedValue(storedDocument);
  });

  it("persists the document before linking it and reports success", async () => {
    // Arrange
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    render(
      <ChecklistEvidence
        item={item}
        project={project}
        isFinalized={false}
        onUpdate={onUpdate}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "uploadEvidence" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Choose evidence file" }),
    );

    // Assert
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        evidenceFiles: ["saved-evidence"],
      }),
    );
    expect(mockAddControlledDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: project.id,
        type: "Evidence",
        fileUrl: "https://example.com/evidence.pdf",
      }),
    );
    expect(mockAddControlledDocument.mock.invocationCallOrder[0]).toBeLessThan(
      onUpdate.mock.invocationCallOrder[0],
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("projectEvidenceUploaded");
    expect(
      screen.queryByRole("button", { name: "linkLiveData" }),
    ).not.toBeInTheDocument();
  });

  it("does not persist or link an upload if the project becomes read-only mid-upload", async () => {
    // Arrange
    let finishUpload: (url: string) => void = () => {};
    jest.mocked(cloudinaryService.uploadDocument).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve;
        }),
    );
    const onUpdate = jest.fn();
    const view = render(
      <ChecklistEvidence
        item={item}
        project={project}
        isFinalized={false}
        onUpdate={onUpdate}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "uploadEvidence" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Choose evidence file" }),
    );
    await waitFor(() =>
      expect(cloudinaryService.uploadDocument).toHaveBeenCalled(),
    );
    view.rerender(
      <ChecklistEvidence
        item={item}
        project={project}
        isFinalized
        onUpdate={onUpdate}
      />,
    );
    finishUpload("https://example.com/evidence.pdf");

    // Assert
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "projectEvidenceUploadFailed",
      ),
    );
    expect(mockAddControlledDocument).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Choose evidence file" }),
    ).not.toBeInTheDocument();
  });
});
