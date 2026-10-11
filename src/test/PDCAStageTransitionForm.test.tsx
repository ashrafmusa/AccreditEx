import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PDCAStageTransitionForm from "@/components/projects/PDCAStageTransitionForm";
import { AppDocument } from "@/types";

const mockToastError = jest.fn();
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ error: mockToastError }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: "en",
  }),
}));
jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { suggestPDCAImprovements: jest.fn() },
}));

const evidence: AppDocument = {
  id: "evidence-1",
  name: { en: "Approved workflow", ar: "إجراء معتمد" },
  type: "Evidence",
  isControlled: true,
  status: "Approved",
  content: null,
  currentVersion: 1,
  uploadedAt: "",
};

describe("PDCAStageTransitionForm", () => {
  it("passes selected evidence document IDs with the transition notes", () => {
    // Arrange
    const onConfirm = jest.fn();
    render(
      <PDCAStageTransitionForm
        currentStage="Do"
        availableDocuments={[evidence]}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    // Act
    fireEvent.change(screen.getByLabelText(/transitionNotes/i), {
      target: { value: "Implementation completed and evidence reviewed." },
    });
    fireEvent.click(screen.getByLabelText("Approved workflow"));
    fireEvent.click(screen.getByRole("button", { name: /confirmAdvance/i }));

    // Assert
    expect(onConfirm).toHaveBeenCalledWith(
      "Implementation completed and evidence reviewed.",
      ["evidence-1"],
    );
  });

  it("does not require an evidence attachment when none is available", () => {
    // Arrange
    const onConfirm = jest.fn();
    render(
      <PDCAStageTransitionForm
        currentStage="Plan"
        availableDocuments={[]}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    // Act
    fireEvent.change(screen.getByLabelText(/transitionNotes/i), {
      target: { value: "The plan and owner have been confirmed." },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmAdvance/i }));

    // Assert
    expect(onConfirm).toHaveBeenCalledWith(
      "The plan and owner have been confirmed.",
      [],
    );
    expect(screen.getByText("pdcaNoEvidenceDocuments")).toBeInTheDocument();
  });
});
