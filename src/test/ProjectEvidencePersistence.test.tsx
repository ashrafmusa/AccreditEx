import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PDCACycleDetailModal from "@/components/projects/PDCACycleDetailModal";
import DesignControlsComponent from "@/components/projects/DesignControlsComponent";
import { cloudinaryService } from "@/services/cloudinaryService";
import {
  AppDocument,
  CAPAReport,
  PDCACycle,
  Project,
  ProjectStatus,
} from "@/types";

const addDocument = jest.fn();
const error = jest.fn();
const success = jest.fn();
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => ({ documents: [], addControlledDocument: addDocument }),
}));
jest.mock("@/hooks/useToast", () => ({ useToast: () => ({ error, success }) }));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, lang: "en" }),
}));
jest.mock("@/hooks/usePDCASuggestions", () => ({
  usePDCASuggestions: () => ({
    suggestions: [],
    generateSuggestions: jest.fn(),
    isLoading: false,
  }),
}));
jest.mock("@/components/projects/PDCAMetricsChart", () => () => null);
jest.mock("@/components/documents/DocumentListItem", () => () => null);
jest.mock("@/components/common/DocumentPicker", () => () => null);
jest.mock("@/components/documents/DocumentEditorModal", () => () => null);
jest.mock("@/components/documents/PDFViewerModal", () => () => null);
jest.mock(
  "@/components/documents/FileUploader",
  () => (props: { onFilesSelected: (files: File[]) => void }) => (
    <button
      onClick={() =>
        props.onFilesSelected([
          new File(["evidence"], "evidence.pdf", { type: "application/pdf" }),
        ])
      }
    >
      Choose evidence
    </button>
  ),
);
jest.mock("@/services/aiAgentService", () => ({ aiAgentService: {} }));
jest.mock("@/components/ai/AISuggestionModal", () => () => null);

const capa: CAPAReport = {
  id: "capa1",
  checklistItemId: "requirement1",
  description: "Investigate",
  status: ProjectStatus.InProgress,
  rootCause: "",
  correctiveAction: "",
  preventiveAction: "",
  createdAt: "",
  updatedAt: "",
  pdcaStage: "Plan",
  pdcaHistory: [],
};
const storedDocument: AppDocument = {
  id: "stored-document",
  name: { en: "Evidence", ar: "Evidence" },
  type: "Evidence",
  isControlled: true,
  status: "Draft",
  content: { en: "", ar: "" },
  uploadedAt: "",
  currentVersion: 1,
  versionHistory: [],
};

describe("Project evidence persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(cloudinaryService.uploadFile)
      .mockResolvedValue("https://example.com/evidence.pdf");
    addDocument.mockResolvedValue(storedDocument);
  });
  it("persists uploaded PDCA evidence before linking its saved ID to the project", async () => {
    // Arrange
    const update = jest
      .fn<Promise<void>, [PDCACycle | CAPAReport]>()
      .mockResolvedValue();
    render(
      <PDCACycleDetailModal
        isOpen
        onClose={jest.fn()}
        cycle={capa}
        type="capa"
        onUpdate={update}
        projectId="p1"
        organizationId="org-a"
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "uploadDocument" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose evidence" }));
    // Assert
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ linkedDocumentIds: ["stored-document"] }),
      ),
    );
    expect(addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        type: "Evidence",
        fileUrl: "https://example.com/evidence.pdf",
      }),
    );
    expect(addDocument.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0],
    );
  });
  it("does not link phantom evidence when document persistence fails", async () => {
    // Arrange
    addDocument.mockRejectedValue(new Error("permission-denied"));
    const update = jest.fn();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PDCACycleDetailModal
        isOpen
        onClose={jest.fn()}
        cycle={capa}
        type="capa"
        onUpdate={update}
        projectId="p1"
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "uploadDocument" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose evidence" }));
    // Assert
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("projectWriteFailed"),
    );
    expect(update).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it("hides PDCA mutation actions for read-only projects", () => {
    // Arrange / Act
    render(
      <PDCACycleDetailModal
        isOpen
        readOnly
        onClose={jest.fn()}
        cycle={capa}
        type="capa"
        onUpdate={jest.fn()}
      />,
    );
    // Assert
    expect(
      screen.queryByRole("button", { name: "uploadDocument" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "linkDocument" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "saveChanges" }),
    ).not.toBeInTheDocument();
  });
  it("does not announce design-control saves until persistence succeeds and reports rejected saves", async () => {
    // Arrange
    const project: Project = {
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
    const save = jest.fn().mockRejectedValue(new Error("offline"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <DesignControlsComponent
        project={project}
        documents={[]}
        isFinalized={false}
        onSave={save}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "saveChanges" }));
    // Assert
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("projectWriteFailed"),
    );
    expect(success).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
