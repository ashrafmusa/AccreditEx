import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AIDocumentGenerator from "@/components/ai/AIDocumentGenerator";
import { aiDocumentGeneratorService } from "@/services/aiDocumentGeneratorService";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, lang: "en" }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: (selector: (state: { departments: never[] }) => unknown) => selector({ departments: [] }),
}));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: (selector: (state: { projects: never[] }) => unknown) => selector({ projects: [] }),
}));
jest.mock("@/components/ai/AIResponseView", () => ({
  __esModule: true,
  default: () => <div />,
}));
jest.mock("@/data/templateLibrary", () => ({
  templateLibrary: [{
    id: "test-policy", name: "Policy", description: "Policy template", category: "Policy", program: "JCI",
  }],
}));
jest.mock("@/services/aiDocumentGeneratorService", () => ({
  aiDocumentGeneratorService: {
    generateDocument: jest.fn(),
    improveContent: jest.fn(),
    analyzeDocument: jest.fn(),
  },
}));

beforeEach(() => jest.resetAllMocks());

it("sends the selected language and preserves generated language if the selector changes", async () => {
  // Arrange
  jest.mocked(aiDocumentGeneratorService.generateDocument).mockResolvedValue({
    content: "<h2>سياسة</h2>", language: "ar", suggestions: [], complianceIssues: [],
    wordCount: 1, estimatedReadingTime: 1, generationTime: 100,
  });
  jest.mocked(aiDocumentGeneratorService.improveContent).mockResolvedValue({
    originalContent: "<h2>سياسة</h2>", improvedContent: "<h2>سياسة محسنة</h2>", changes: [],
    statistics: { readabilityScore: null, grammarIssues: null, clarityScore: null, professionalismScore: null },
  });
  const onGenerated = jest.fn();
  render(<AIDocumentGenerator templateId="test-policy" onDocumentGenerated={onGenerated} />);
  // Act
  fireEvent.change(screen.getByLabelText("aiDocumentLanguage"), { target: { value: "ar" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate document" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "aiDraftSave" })).toBeEnabled());
  expect(onGenerated).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "aiDraftSave" }));
  await waitFor(() => expect(onGenerated).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("aiDocumentLanguage"), { target: { value: "en" } });
  fireEvent.click(screen.getByRole("button", { name: /improve/i }));
  // Assert
  expect(aiDocumentGeneratorService.generateDocument).toHaveBeenCalledWith(expect.objectContaining({ language: "ar" }));
  await waitFor(() => expect(aiDocumentGeneratorService.improveContent).toHaveBeenCalledWith(
    expect.objectContaining({ language: "ar", format: "html" }),
  ));
});

  it("keeps a draft after save failure and allows retry without automatic persistence", async () => {
    // Arrange
    jest.mocked(aiDocumentGeneratorService.generateDocument).mockResolvedValue({
      content: "<h2>Draft policy</h2>", language: "en", format: "html", suggestions: [], complianceIssues: [],
      wordCount: 2, estimatedReadingTime: 1, generationTime: 10,
    });
    const save = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AIDocumentGenerator templateId="test-policy" onDocumentGenerated={save} />);
    try {
      // Act
      fireEvent.click(screen.getByRole("button", { name: "Generate document" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "aiDraftSave" })).toBeEnabled());
      expect(save).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "aiDraftSave" }));
      await screen.findByText("aiDraftSaveFailed");

      // Assert
      expect(screen.getByText("Draft policy")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "aiDraftSave" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "aiDraftSaved" })).toBeDisabled());
      expect(save).toHaveBeenCalledTimes(2);
    } finally {
      log.mockRestore();
    }
  });

  it("renders unassessed metrics and clears old analysis when a new analysis fails", async () => {
    // Arrange
    jest.mocked(aiDocumentGeneratorService.generateDocument).mockResolvedValue({
      content: "<h2>Draft</h2>", language: "en", format: "html", suggestions: [], complianceIssues: [],
      wordCount: 1, estimatedReadingTime: 1, generationTime: 10,
    });
    jest.mocked(aiDocumentGeneratorService.analyzeDocument).mockResolvedValueOnce({
      contentScore: 0, readabilityScore: null, grammarScore: null, structureScore: null,
      complianceIssues: [], improvementSuggestions: [], keySections: [],
    }).mockRejectedValueOnce(new Error("Invalid JSON"));
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AIDocumentGenerator templateId="test-policy" />);
    try {
      // Act
      fireEvent.click(screen.getByRole("button", { name: "Generate document" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Analyze document" })).toBeEnabled());
      fireEvent.click(screen.getByRole("button", { name: "Analyze document" }));
      await screen.findByText("aiAnalysisEstimateNotice");

      // Assert
      expect(screen.getAllByText("aiNotAssessed")).toHaveLength(3);
      expect(screen.getByText("0")).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("button", { name: "Analyze document" })).toBeEnabled());
      fireEvent.click(screen.getByRole("button", { name: "Analyze document" }));
      await screen.findByText("aiAnalysisFailed");
      expect(screen.queryByText("aiAnalysisEstimateNotice")).not.toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
    } finally {
      log.mockRestore();
    }
  });
