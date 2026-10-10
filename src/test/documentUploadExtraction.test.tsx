import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import type { DocumentTextExtraction } from "@/types";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, lang: "en", dir: "ltr" }),
}));
const warning = jest.fn();
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ warning, error: jest.fn(), success: jest.fn() }),
}));
jest.mock("@/stores/useAppStore", () => ({ useAppStore: () => ({ departments: [] }) }));
jest.mock("@/services/aiAgentService", () => ({ aiAgentService: { chat: jest.fn() } }));
jest.mock("@/services/cloudinaryService", () => ({
  cloudinaryService: { uploadDocument: jest.fn(), uploadFile: jest.fn() },
}));
jest.mock("@/services/documentTextExtractionService", () => ({
  extractDocumentText: jest.fn(),
  extractionWarningKey: (result: DocumentTextExtraction) =>
    result.status === "failed" ? "documentExtractionFailed" :
      result.status === "unsupported" ? "documentExtractionUnsupported" : null,
}));
jest.mock("@/components/documents/FileUploader", () => ({
  __esModule: true,
  default: ({ onFilesSelected, disabled }: { onFilesSelected: (files: File[]) => void; disabled?: boolean }) => (
    <button type="button" disabled={disabled} onClick={() => onFilesSelected([new File(["local"], "policy.pdf", { type: "application/pdf" })])}>
      Select local file
    </button>
  ),
}));
jest.mock("@/components/ai/AIDocumentGenerator", () => ({
  __esModule: true, default: () => <div />,
}));

import DocumentMetadataModal from "@/components/documents/DocumentMetadataModal";
import DocumentCreationWizard from "@/components/documents/DocumentCreationWizard";
import { aiAgentService } from "@/services/aiAgentService";
import { cloudinaryService } from "@/services/cloudinaryService";
import { extractDocumentText } from "@/services/documentTextExtractionService";

const extraction: DocumentTextExtraction = {
  sourceFileName: "policy.pdf",
  text: "Attachment-only evidence",
  status: "extracted",
  extractedAt: "2026-10-10T00:00:00Z",
  pagesProcessed: 1,
  totalPages: 1,
  limitations: ["ocrUnavailable"],
};

describe("document upload extraction metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(extractDocumentText).mockResolvedValue(extraction);
    jest.mocked(cloudinaryService.uploadDocument).mockResolvedValue("https://storage.example/policy.pdf");
    jest.mocked(cloudinaryService.uploadFile).mockResolvedValue("https://storage.example/policy.pdf");
    jest.mocked(aiAgentService.chat).mockResolvedValue({ response: "<p>Existing AI draft</p>", thread_id: "", timestamp: "" });
  });

  it("saves attachment extraction separately without overwriting a generated draft", async () => {
    // Arrange
    const onSave = jest.fn();
    render(<DocumentMetadataModal isOpen onSave={onSave} onClose={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Infection Control Policy"), { target: { value: "Policy" } });
    fireEvent.change(screen.getByPlaceholderText("مثال: سياسة مكافحة العدوى"), { target: { value: "سياسة" } });
    fireEvent.click(screen.getByRole("button", { name: "aiGenerateInitialContent" }));
    await screen.findByText("contentGenerated");
    fireEvent.click(screen.getByRole("button", { name: "Select local file" }));

    // Act
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    // Assert
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      extractedText: extraction, content: { en: "<p>Existing AI draft</p>", ar: "" },
      fileUrl: "https://storage.example/policy.pdf",
    });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("status", "Approved");
    expect(extractDocumentText).toHaveBeenCalledWith(expect.any(File));
  });

  it("warns and saves explicit failed extraction metadata rather than implying usable evidence", async () => {
    // Arrange
    const failed: DocumentTextExtraction = { ...extraction, text: "", status: "failed", limitations: ["parseFailed"] };
    jest.mocked(extractDocumentText).mockResolvedValue(failed);
    const onSave = jest.fn();
    render(<DocumentMetadataModal isOpen onSave={onSave} onClose={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Infection Control Policy"), { target: { value: "Policy" } });
    fireEvent.change(screen.getByPlaceholderText("مثال: سياسة مكافحة العدوى"), { target: { value: "سياسة" } });
    fireEvent.click(screen.getByRole("button", { name: "Select local file" }));

    // Act
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    // Assert
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ extractedText: failed })));
    expect(warning).toHaveBeenCalledWith("documentExtractionFailed");
    expect(onSave.mock.calls[0][0].content).toBeUndefined();
  });

  it.each(["extracted", "unsupported"] as const)("passes typed %s extraction through the wizard upload callback", async (status) => {
    // Arrange
    const result: DocumentTextExtraction = {
      ...extraction, status,
      text: status === "unsupported" ? "" : extraction.text,
    };
    jest.mocked(extractDocumentText).mockResolvedValue(result);
    const onCreateDocument = jest.fn().mockResolvedValue(undefined);
    render(<DocumentCreationWizard isOpen preselectedTab="upload" onClose={jest.fn()} onCreateDocument={onCreateDocument}
      departments={[]} projects={[]} currentUser={{ departmentId: "department-1" }} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Select local file" }));

    // Assert
    await waitFor(() => expect(onCreateDocument).toHaveBeenCalledWith(expect.objectContaining({
      extractedText: result, fileUrl: "https://storage.example/policy.pdf", type: "Evidence",
    })));
    expect(onCreateDocument.mock.calls[0][0]).not.toHaveProperty("content");
    expect(onCreateDocument.mock.calls[0][0]).not.toHaveProperty("status", "Approved");
    expect(extractDocumentText).toHaveBeenCalledWith(expect.any(File));
    if (status === "unsupported") expect(warning).toHaveBeenCalledWith("documentExtractionUnsupported");
  });
});
