import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="md">{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => undefined }));
jest.mock("@/components/ai/AIActionCard", () => ({
  __esModule: true,
  default: ({ action }: { action: { title: string } }) => <div data-testid="action-card">{action.title}</div>,
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "en", dir: "ltr" }),
}));
const toastSuccess = jest.fn();
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: toastSuccess, error: jest.fn(), warning: jest.fn(), info: jest.fn() }),
}));
const submitAIFeedback = jest.fn();
jest.mock("@/services/aiFeedbackService", () => ({
  submitAIFeedback: (...args: unknown[]) => submitAIFeedback(...args),
}));

import AIResponseView from "@/components/ai/AIResponseView";

describe("AIResponseView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows a loading state", () => {
    // Arrange / Act
    render(<AIResponseView loading content="x" />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent("aiResponseLoading");
  });

  it("shows an error with retry", () => {
    // Arrange
    const onRetry = jest.fn();
    render(<AIResponseView error="Service down" onRetry={onRetry} />);

    // Act
    fireEvent.click(screen.getByText("aiResponseRetry"));

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent("Service down");
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows the empty state for blank payloads", () => {
    // Arrange / Act
    render(<AIResponseView content={{ analysis: "" }} />);

    // Assert
    expect(screen.getByText("aiResponseEmpty")).toBeInTheDocument();
  });

  it("renders markdown and action cards from raw text", () => {
    // Arrange
    const raw =
      "## Findings\nLabels missing\n\n```accreditex-action\n" +
      '{"type":"create_risk","title":"Label risk","description":"d","likelihood":3,"impact":4}' +
      "\n```";

    // Act
    render(<AIResponseView content={raw} />);

    // Assert
    expect(screen.getByTestId("md")).toHaveTextContent("Labels missing");
    expect(screen.getByTestId("md")).not.toHaveTextContent("accreditex-action");
    expect(screen.getByTestId("action-card")).toHaveTextContent("Label risk");
  });

  it("persists feedback by default and disables the buttons", () => {
    // Arrange
    render(<AIResponseView content="A helpful answer about readiness." />);

    // Act
    fireEvent.click(screen.getByLabelText("aiResponseHelpful"));

    // Assert
    expect(submitAIFeedback).toHaveBeenCalledWith("up", expect.objectContaining({ contentMarkdown: "A helpful answer about readiness." }));
    expect(screen.getByLabelText("aiResponseNotHelpful")).toBeDisabled();
  });

  it("hides the toolbar when requested", () => {
    // Arrange / Act
    render(<AIResponseView content="Answer" showToolbar={false} />);

    // Assert
    expect(screen.queryByLabelText("aiResponseCopy")).toBeNull();
  });
});
