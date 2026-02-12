import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmptyState from "../EmptyState";
import { FolderIcon } from "@heroicons/react/24/outline";

// Mock useTranslation
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: "en",
    setLanguage: jest.fn(),
  }),
}));

describe("EmptyState", () => {
  const mockIcon = FolderIcon;
  const mockTitle = "No Projects Yet";
  const mockDescription =
    "Create your first project to start tracking compliance";

  describe("Rendering", () => {
    it("should render with required props", () => {
      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
        />,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(mockTitle)).toBeInTheDocument();
      expect(screen.getByText(mockDescription)).toBeInTheDocument();
    });

    it("should render with primary CTA button", () => {
      const mockCta = jest.fn();

      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          action={{
            label: "Create Project",
            onClick: mockCta,
          }}
        />,
      );

      const button = screen.getByText("Create Project");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-brand-600");
    });

    it("should render with secondary action button", () => {
      const mockSecondary = jest.fn();

      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          secondaryAction={{
            label: "Learn More",
            onClick: mockSecondary,
          }}
        />,
      );

      const button = screen.getByText("Learn More");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("border-slate-300");
    });

    it("should render with both primary and secondary buttons", () => {
      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          action={{
            label: "Create Project",
            onClick: jest.fn(),
          }}
          secondaryAction={{
            label: "Learn More",
            onClick: jest.fn(),
          }}
        />,
      );

      expect(screen.getByText("Create Project")).toBeInTheDocument();
      expect(screen.getByText("Learn More")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          className="custom-class"
        />,
      );

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass("custom-class");
    });
  });

  describe("Interactions", () => {
    it("should call action.onClick when primary button is clicked", () => {
      const mockCta = jest.fn();

      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          action={{
            label: "Create Project",
            onClick: mockCta,
          }}
        />,
      );

      fireEvent.click(screen.getByText("Create Project"));
      expect(mockCta).toHaveBeenCalledTimes(1);
    });

    it("should call secondaryAction.onClick when secondary button is clicked", () => {
      const mockSecondary = jest.fn();

      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          secondaryAction={{
            label: "Learn More",
            onClick: mockSecondary,
          }}
        />,
      );

      fireEvent.click(screen.getByText("Learn More"));
      expect(mockSecondary).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const { container } = render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
        />,
      );

      const emptyState = container.firstChild;
      expect(emptyState).toHaveAttribute("role", "status");
      expect(emptyState).toHaveAttribute("aria-live", "polite");
    });

    it("should have semantic heading for title", () => {
      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
        />,
      );

      const heading = screen.getByText(mockTitle);
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Dark Mode Support", () => {
    it("should have dark mode classes", () => {
      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          action={{
            label: "Create",
            onClick: jest.fn(),
          }}
        />,
      );

      const title = screen.getByText(mockTitle);
      expect(title).toHaveClass("dark:text-dark-brand-text-primary");

      const description = screen.getByText(mockDescription);
      expect(description).toHaveClass("dark:text-dark-brand-text-secondary");
    });
  });

  describe("Edge Cases", () => {
    it("should not render buttons when no handlers provided", () => {
      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={mockDescription}
          // No action or secondaryAction handlers
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should handle long title text gracefully", () => {
      const longTitle =
        "This is a very long title that should still display properly without breaking the layout or causing overflow issues";

      render(
        <EmptyState
          icon={mockIcon}
          title={longTitle}
          message={mockDescription}
        />,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle long description text gracefully", () => {
      const longDescription =
        "This is a very long description that provides detailed information about why this section is empty and what actions the user should take to populate it with content. It should wrap properly and remain readable.";

      render(
        <EmptyState
          icon={mockIcon}
          title={mockTitle}
          message={longDescription}
        />,
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });
});
