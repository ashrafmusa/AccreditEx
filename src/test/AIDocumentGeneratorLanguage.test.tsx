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
  },
}));

it("sends the selected language and preserves generated language if the selector changes", async () => {
  // Arrange
  jest.mocked(aiDocumentGeneratorService.generateDocument).mockResolvedValue({
    content: "<h2>سياسة</h2>", language: "ar", suggestions: [], complianceIssues: [],
    wordCount: 1, estimatedReadingTime: 1, generationTime: 100,
  });
  jest.mocked(aiDocumentGeneratorService.improveContent).mockResolvedValue({
    originalContent: "<h2>سياسة</h2>", improvedContent: "<h2>سياسة محسنة</h2>", changes: [],
    statistics: { readabilityScore: 80, grammarIssues: 0, clarityScore: 80, professionalismScore: 80 },
  });
  const onGenerated = jest.fn();
  render(<AIDocumentGenerator templateId="test-policy" onDocumentGenerated={onGenerated} />);

  // Act
  fireEvent.change(screen.getByLabelText("aiDocumentLanguage"), { target: { value: "ar" } });
  fireEvent.click(screen.getByRole("button", { name: "Generate document" }));
  await waitFor(() => expect(onGenerated).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("aiDocumentLanguage"), { target: { value: "en" } });
  fireEvent.click(screen.getByRole("button", { name: /improve/i }));

  // Assert
  expect(aiDocumentGeneratorService.generateDocument).toHaveBeenCalledWith(expect.objectContaining({ language: "ar" }));
  await waitFor(() => expect(aiDocumentGeneratorService.improveContent).toHaveBeenCalledWith(
    expect.objectContaining({ language: "ar" }),
  ));
});
