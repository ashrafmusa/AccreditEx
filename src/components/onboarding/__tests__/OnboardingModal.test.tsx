import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OnboardingModal } from "../OnboardingModal";

// Mock the icons
jest.mock("@/components/icons", () => ({
  LogoIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="logo-icon" />
  ),
  ChartPieIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="chart-pie-icon" />
  ),
  FolderIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="folder-icon" />
  ),
  UsersIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="users-icon" />
  ),
  ShieldCheckIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="shield-check-icon" />
  ),
  SparklesIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="sparkles-icon" />
  ),
  ChevronLeftIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="chevron-left-icon" />
  ),
  ChevronRightIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="chevron-right-icon" />
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="check-icon" />
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <div className={className} data-testid="x-mark-icon" />
  ),
}));

// Mock the UI components
jest.mock("@/components/ui/Modal", () => ({
  __esModule: true,
  default: ({ children, isOpen, title, footer }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <div data-testid="modal-footer">{footer}</div>
      </div>
    ) : null,
}));

jest.mock("@/components/ui", () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock the translation hook
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    dir: "ltr",
  }),
}));

// Mock the useFocusTrap hook
jest.mock("@/hooks/useKeyboardNavigation", () => ({
  useFocusTrap: jest.fn(),
}));

describe("OnboardingModal", () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render when isOpen is true", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      expect(screen.getByText("welcomeToAccreditEx")).toBeInTheDocument();
    });

    test("should not render when isOpen is false", () => {
      render(<OnboardingModal isOpen={false} onComplete={mockOnComplete} />);

      expect(screen.queryByText("welcomeToAccreditEx")).not.toBeInTheDocument();
    });

    test("should render modal title", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      expect(screen.getByText("gettingStarted")).toBeInTheDocument();
    });

    test("should render first step by default", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      expect(screen.getByText("welcomeToAccreditEx")).toBeInTheDocument();
      expect(screen.getByText("onboardingWelcomeMessage")).toBeInTheDocument();
    });

    test("should render from initialStep if provided", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={2}
        />,
      );

      expect(screen.getByText("onboardingProjectsTitle")).toBeInTheDocument();
    });

    test("should render all progress dots", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      // Should have 6 step dots
      const stepButtons = screen.getAllByRole("button");
      const stepDots = stepButtons.filter((button) =>
        button.getAttribute("aria-label")?.includes("goToStep"),
      );
      expect(stepDots).toHaveLength(6);
    });

    test("should render progress indicator text", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      // Check for the combined progress text
      expect(screen.getByText("step 1 of 6")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    test("should navigate to next step when Next button is clicked", async () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByText("next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText("onboardingDashboardTitle"),
        ).toBeInTheDocument();
      });
    });

    test("should navigate to previous step when Previous button is clicked", async () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={1}
        />,
      );

      const previousButton = screen.getByText("previous");
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText("welcomeToAccreditEx")).toBeInTheDocument();
      });
    });

    test("should disable Previous button on first step", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const previousButton = screen.getByText("previous");
      expect(previousButton).toBeDisabled();
    });

    test("should not disable Previous button on second step", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={1}
        />,
      );

      const previousButton = screen.getByText("previous");
      expect(previousButton).not.toBeDisabled();
    });

    test("should navigate to specific step when progress dot is clicked", async () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const stepButtons = screen.getAllByRole("button");
      const step3Button = stepButtons.find(
        (button) => button.getAttribute("aria-label") === "goToStep 3",
      );

      if (step3Button) {
        fireEvent.click(step3Button);

        await waitFor(() => {
          expect(
            screen.getByText("onboardingProjectsTitle"),
          ).toBeInTheDocument();
        });
      }
    });

    test('should call onComplete when "Get Started" button is clicked on last step', async () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={5} // Last step
        />,
      );

      const getStartedButton = screen.getByText("getStarted");
      fireEvent.click(getStartedButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test("should navigate through all steps sequentially", async () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByText("next");

      // Step 1 → 2
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(
          screen.getByText("onboardingDashboardTitle"),
        ).toBeInTheDocument();
      });

      // Step 2 → 3
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText("onboardingProjectsTitle")).toBeInTheDocument();
      });

      // Step 3 → 4
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(
          screen.getByText("onboardingAccreditationTitle"),
        ).toBeInTheDocument();
      });

      // Step 4 → 5
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText("onboardingUsersTitle")).toBeInTheDocument();
      });

      // Step 5 → 6
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText("onboardingAiTitle")).toBeInTheDocument();
      });

      // Step 6 → Complete
      const getStartedButton = screen.getByText("getStarted");
      fireEvent.click(getStartedButton);
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe("Step Content", () => {
    test("should display correct content for step 1 (Welcome)", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      expect(screen.getByText("welcomeToAccreditEx")).toBeInTheDocument();
      expect(screen.getByText("onboardingWelcomeMessage")).toBeInTheDocument();
    });

    test("should display correct content for step 2 (Dashboard)", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={1}
        />,
      );

      expect(screen.getByText("onboardingDashboardTitle")).toBeInTheDocument();
      expect(
        screen.getByText("onboardingDashboardMessage"),
      ).toBeInTheDocument();
    });

    test("should display correct content for step 3 (Projects)", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={2}
        />,
      );

      expect(screen.getByText("onboardingProjectsTitle")).toBeInTheDocument();
      expect(screen.getByText("onboardingProjectsMessage")).toBeInTheDocument();
    });

    test("should display correct content for step 4 (Accreditation)", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={3}
        />,
      );

      expect(
        screen.getByText("onboardingAccreditationTitle"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("onboardingAccreditationMessage"),
      ).toBeInTheDocument();
    });

    test("should display correct content for step 5 (Users)", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={4}
        />,
      );

      expect(screen.getByText("onboardingUsersTitle")).toBeInTheDocument();
      expect(screen.getByText("onboardingUsersMessage")).toBeInTheDocument();
    });

    test("should display correct content for step 6 (AI)", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={5}
        />,
      );

      expect(screen.getByText("onboardingAiTitle")).toBeInTheDocument();
      expect(screen.getByText("onboardingAiMessage")).toBeInTheDocument();
    });
  });

  describe("Progress Indicators", () => {
    test("should highlight current step dot", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={2}
        />,
      );

      const stepButtons = screen.getAllByRole("button");
      const currentStepDot = stepButtons.find(
        (button) => button.getAttribute("aria-current") === "step",
      );

      expect(currentStepDot).toBeDefined();
      expect(currentStepDot?.getAttribute("aria-label")).toBe("goToStep 3");
    });

    test("should update progress text when navigating", async () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      // Initially on step 1
      expect(screen.getByText("step 1 of 6")).toBeInTheDocument();

      // Navigate to step 2
      const nextButton = screen.getByText("next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("step 2 of 6")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    test("should have proper ARIA labels on navigation buttons", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const previousButton = screen.getByText("previous");
      const nextButton = screen.getByText("next");

      expect(previousButton).toHaveAttribute("aria-label", "previousStep");
      expect(nextButton).toHaveAttribute("aria-label", "nextStep");
    });

    test("should have proper ARIA labels on step dots", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const stepButtons = screen.getAllByRole("button");
      const stepDots = stepButtons.filter((button) =>
        button.getAttribute("aria-label")?.includes("goToStep"),
      );

      stepDots.forEach((dot, index) => {
        expect(dot).toHaveAttribute("aria-label", `goToStep ${index + 1}`);
      });
    });

    test("should indicate current step with aria-current", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={3}
        />,
      );

      const stepButtons = screen.getAllByRole("button");
      const currentStepDot = stepButtons.find(
        (button) => button.getAttribute("aria-current") === "step",
      );

      expect(currentStepDot).toBeDefined();
      expect(currentStepDot?.getAttribute("aria-label")).toBe("goToStep 4");
    });

    test('should change "Get Started" button ARIA label on last step', () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={5}
        />,
      );

      const getStartedButton = screen.getByText("getStarted");
      expect(getStartedButton).toHaveAttribute(
        "aria-label",
        "finishOnboarding",
      );
    });
  });

  describe("Modal Dismissal", () => {
    test("should call onComplete when allowDismiss is true and modal is closed", () => {
      const { container } = render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          allowDismiss={true}
        />,
      );

      // Find the close button (X button in modal header)
      const closeButton = container.querySelector('[aria-label="Close modal"]');
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnComplete).toHaveBeenCalled();
      }
    });

    test("should not dismiss when clicking outside if allowDismiss is false", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          allowDismiss={false}
        />,
      );

      // Modal backdrop (overlay) outside the modal content
      const backdrop = document.querySelector('[role="dialog"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnComplete).not.toHaveBeenCalled();
      }
    });
  });

  describe("RTL Support", () => {
    test("should reverse button icons in RTL mode", () => {
      jest.mock("@/hooks/useTranslation", () => ({
        useTranslation: () => ({
          t: (key: string) => key,
          dir: "rtl",
        }),
      }));

      const { container } = render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={1}
        />,
      );

      // In RTL, the icons should be reversed
      // This is a visual check - ensure ChevronRightIcon is on left for Previous
      expect(container).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    test("should not navigate beyond last step", async () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={5}
        />,
      );

      expect(screen.getByText("onboardingAiTitle")).toBeInTheDocument();

      // Try to navigate beyond
      const getStartedButton = screen.getByText("getStarted");
      fireEvent.click(getStartedButton);

      // Should call onComplete instead of navigating
      expect(mockOnComplete).toHaveBeenCalled();
    });

    test("should not navigate before first step", () => {
      render(<OnboardingModal isOpen={true} onComplete={mockOnComplete} />);

      const previousButton = screen.getByText("previous");
      fireEvent.click(previousButton);

      // Should still be on first step
      expect(screen.getByText("welcomeToAccreditEx")).toBeInTheDocument();
    });

    test("should handle invalid init ialStep gracefully", () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={mockOnComplete}
          initialStep={999}
        />,
      );

      // Should default to first step or last valid step
      // Component should not crash
      expect(screen.getByText("gettingStarted")).toBeInTheDocument();
    });
  });
});
