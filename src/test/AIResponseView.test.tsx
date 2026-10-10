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
import type { AIGrounding } from "@/services/aiGroundingService";
import { en } from "@/data/locales/en/ai";
import { ar } from "@/data/locales/ar/ai";

const groundingFixture = (): AIGrounding => ({
  schema: "ai-grounding/1",
  organizationId: "org-1",
  sources: [{
    ref: "document:policy-1@v3",
    kind: "document",
    id: "policy-1",
    organizationId: "org-1",
    title: "Hand hygiene policy",
    status: "Draft",
    version: 3,
    excerpt: "Wash hands before each procedure.",
    excerptTruncated: true,
    links: [{ relation: "related", target: "document:policy-2" }],
  }],
  coverage: {
    available: 7,
    selected: 1,
    omitted: 6,
    limitations: ["Loaded records only; not an exhaustive database search."],
  },
});

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

  it("preserves responses without supplied evidence", () => {
    // Arrange / Act
    const { container } = render(<AIResponseView content="Answer" />);

    // Assert
    expect(screen.getByTestId("md")).toHaveTextContent("Answer");
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText("aiEvidenceDisclaimer")).not.toBeInTheDocument();
  });

  it("shows an initially collapsed evidence section with bounded coverage and partial excerpts", () => {
    // Arrange
    const grounding = groundingFixture();
    const { container } = render(<AIResponseView content="Answer" grounding={grounding} showDisclaimer={false} />);
    const details = container.querySelector("details")!;

    // Assert
    expect(details).not.toHaveAttribute("open");
    expect(details.querySelector("summary")).toHaveTextContent("aiEvidenceTitle (1)");
    expect(details).toHaveTextContent("aiEvidenceAvailable: 7");
    expect(details).toHaveTextContent("aiEvidenceSelected: 1");
    expect(details).toHaveTextContent("aiEvidenceOmitted: 6");
    expect(details).toHaveTextContent("aiEvidenceLimits");
    expect(details).toHaveTextContent(grounding.coverage.limitations[0]);
    expect(details).toHaveTextContent("Hand hygiene policy");
    expect(details).toHaveTextContent("document:policy-1@v3");
    expect(details).toHaveTextContent("aiEvidenceVersion: 3");
    expect(details).toHaveTextContent("Wash hands before each procedure.");
    expect(details).toHaveTextContent("aiEvidencePartialExcerpt");
    expect(details).toHaveTextContent("aiEvidenceDisclaimer");
    expect(details.querySelector("a")).toBeNull();
  });

  it.each(["Approved", "Draft", "Expired", "Archived", "catalog requirement"])(
    "shows the recorded %s status without implying certification",
    (status) => {
      // Arrange
      const grounding = groundingFixture();
      grounding.sources[0].status = status;

      // Act
      render(<AIResponseView content="Answer" grounding={grounding} />);

      // Assert
      expect(screen.getByText(status)).toBeInTheDocument();
      expect(screen.getByText("aiEvidenceDisclaimer")).toBeInTheDocument();
    },
  );

  it("explains absent sources even when the answer body is missing", () => {
    // Arrange
    const grounding = groundingFixture();
    grounding.sources = [];
    grounding.coverage = { available: 0, selected: 0, omitted: 0, limitations: [] };

    // Act
    render(<AIResponseView grounding={grounding} />);

    // Assert
    expect(screen.getByText("aiEvidenceTitle", { exact: false })).toHaveTextContent("(0)");
    expect(screen.getByText("aiEvidenceNoSources")).toBeInTheDocument();
    expect(screen.getByText("aiEvidenceDisclaimer")).toBeInTheDocument();
    expect(screen.queryByText("aiEvidenceLimits")).not.toBeInTheDocument();
  });

  it("keeps evidence visible for an empty response and handles missing metadata", () => {
    // Arrange
    const grounding = groundingFixture();
    grounding.sources[0].status = undefined;
    grounding.sources[0].version = undefined;
    grounding.sources[0].excerpt = "";
    grounding.sources[0].excerptTruncated = false;

    // Act
    render(<AIResponseView content={{ analysis: "" }} grounding={grounding} />);

    // Assert
    expect(screen.getByText("aiResponseEmpty")).toBeInTheDocument();
    expect(screen.getByText("aiEvidenceStatusUnknown")).toBeInTheDocument();
    expect(screen.getByText("aiEvidenceNoExcerpt")).toBeInTheDocument();
    expect(screen.queryByText("aiEvidenceVersion", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("aiEvidencePartialExcerpt")).not.toBeInTheDocument();
  });

  it("renders evidence as plain text, never invented destinations or markup", () => {
    // Arrange
    const grounding = groundingFixture();
    grounding.sources[0].excerpt = '<a href="https://example.com">Untrusted source</a>';
    grounding.sources[0].version = 0;

    // Act
    const { container } = render(<AIResponseView content="Answer" grounding={grounding} />);

    // Assert
    expect(screen.getByText(grounding.sources[0].excerpt)).toBeInTheDocument();
    expect(container.querySelector("details a")).toBeNull();
    expect(container.querySelector("details")).toHaveTextContent("aiEvidenceVersion: 0");
  });

  it("provides English and Arabic evidence labels and a non-certification disclaimer", () => {
    // Arrange
    const evidenceKeys = Object.keys(en).filter((key) => key.startsWith("aiEvidence")) as (keyof typeof en)[];

    // Act / Assert
    evidenceKeys.forEach((key) => {
      expect(en[key]).toBeTruthy();
      expect(ar[key as keyof typeof ar]).toBeTruthy();
    });
    expect(en.aiEvidenceDisclaimer).toContain("not proof of compliance");
    expect(en.aiEvidenceDisclaimer).toContain("certification");
    expect(ar.aiEvidenceDisclaimer).toContain("ليست إثباتاً للامتثال");
    expect(ar.aiEvidenceDisclaimer).toContain("شهادة اعتماد");
  });
});
