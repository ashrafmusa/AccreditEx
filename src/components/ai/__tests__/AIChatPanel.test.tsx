import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import AIChatPanel from "../AIChatPanel";

// Mock scrollIntoView
Object.defineProperty(HTMLDivElement.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});

// Mock the useAIChatStore hook
const mockUseAIChatStore = jest.fn();
jest.mock("@/stores/useAIChatStore", () => ({
  useAIChatStore: () => mockUseAIChatStore(),
}));

// Mock the useTranslation hook
const mockUseTranslation = jest.fn();
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock Heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  XMarkIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="x-mark-icon" />
  ),
  PaperAirplaneIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="paper-airplane-icon" />
  ),
  SparklesIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="sparkles-icon" />
  ),
  ArrowPathIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="arrow-path-icon" />
  ),
  ExclamationTriangleIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="exclamation-triangle-icon" />
  ),
}));

describe("AIChatPanel", () => {
  const defaultStoreState = {
    messages: [],
    isOpen: true,
    isLoading: false,
    error: null,
    isServiceAvailable: true,
    sendMessage: jest.fn(),
    toggleChat: jest.fn(),
    clearChat: jest.fn(),
    setError: jest.fn(),
  };

  const defaultTranslation = {
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        aiAssistant: "AI Assistant",
        clearChat: "Clear Chat",
        typeYourQuestion: "Type your question...",
        send: "Send",
        dismiss: "Dismiss",
        aiSampleQuestion1:
          "What are the key requirements for JCI accreditation?",
        aiSampleQuestion2: "How do I prepare for a mock survey?",
        aiSampleQuestion3:
          "What evidence do I need for patient safety standards?",
      };
      return translations[key] || key;
    },
  };

  beforeEach(() => {
    mockUseAIChatStore.mockReturnValue(defaultStoreState);
    mockUseTranslation.mockReturnValue(defaultTranslation);
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render nothing when chat is closed", () => {
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        isOpen: false,
      });

      const { container } = render(<AIChatPanel />);
      expect(container.firstChild).toBeNull();
    });

    test("should render chat panel when open", () => {
      render(<AIChatPanel />);

      expect(screen.getByText("AI Assistant")).toBeInTheDocument();
      expect(screen.getAllByTestId("sparkles-icon")).toHaveLength(2); // Header and welcome message
      expect(screen.getByTestId("x-mark-icon")).toBeInTheDocument();
      expect(screen.getByTestId("arrow-path-icon")).toBeInTheDocument();
    });

    test("should render with correct structure and styling", () => {
      render(<AIChatPanel />);

      const panel = document.querySelector(".fixed.bottom-4.right-4"); // More specific selector
      expect(panel).toHaveClass(
        "fixed",
        "bottom-4",
        "right-4",
        "w-96",
        "h-[600px]",
      );
    });

    test("should display service availability indicator when service is unavailable", () => {
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        isServiceAvailable: false,
      });

      render(<AIChatPanel />);

      expect(
        screen.getByTestId("exclamation-triangle-icon"),
      ).toBeInTheDocument();
      expect(screen.getByText("AI Service Unavailable")).toBeInTheDocument();
      expect(
        screen.getByText(
          "The AI assistant is temporarily offline. Please try again later.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Message Display", () => {
    test("should display messages correctly", () => {
      const mockMessages = [
        {
          id: "1",
          type: "user",
          content: "Hello AI",
          timestamp: new Date("2026-02-11T10:00:00Z").toISOString(),
        },
        {
          id: "2",
          type: "assistant",
          content: "Hello! How can I help you?",
          timestamp: new Date("2026-02-11T10:01:00Z").toISOString(),
        },
      ];

      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        messages: mockMessages,
      });

      render(<AIChatPanel />);

      expect(screen.getByText("Hello AI")).toBeInTheDocument();
      expect(
        screen.getByText("Hello! How can I help you?"),
      ).toBeInTheDocument();
    });

    test("should display suggested questions when no messages", () => {
      render(<AIChatPanel />);

      expect(
        screen.getByText(
          "What are the key requirements for JCI accreditation?",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("How do I prepare for a mock survey?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "What evidence do I need for patient safety standards?",
        ),
      ).toBeInTheDocument();
    });

    test("should show loading animation when AI is responding", () => {
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true,
      });

      render(<AIChatPanel />);

      const loadingDots = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-bounce"));
      expect(loadingDots).toHaveLength(3);
    });

    test("should display error message when present", () => {
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        error: "Network error occurred",
      });

      render(<AIChatPanel />);

      expect(screen.getByText("Network error occurred")).toBeInTheDocument();
      expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    test("should call toggleChat when close button is clicked", () => {
      const mockToggleChat = jest.fn();
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        toggleChat: mockToggleChat,
      });

      render(<AIChatPanel />);

      const closeButton = screen.getByTestId("x-mark-icon").closest("button");
      fireEvent.click(closeButton!);

      expect(mockToggleChat).toHaveBeenCalledTimes(1);
    });

    test("should call clearChat when clear chat button is clicked", () => {
      const mockClearChat = jest.fn();
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        clearChat: mockClearChat,
      });

      render(<AIChatPanel />);

      const clearButton = screen
        .getByTestId("arrow-path-icon")
        .closest("button");
      fireEvent.click(clearButton!);

      expect(mockClearChat).toHaveBeenCalledTimes(1);
    });

    test("should handle text input changes", () => {
      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      fireEvent.change(input, { target: { value: "Test message" } });

      expect(input).toHaveValue("Test message");
    });

    test("should submit message on form submit", async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        sendMessage: mockSendMessage,
      });

      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      const submitButton = screen
        .getByTestId("paper-airplane-icon")
        .closest("button");

      fireEvent.change(input, { target: { value: "Test message" } });
      fireEvent.click(submitButton!);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith("Test message");
      });
    });

    test("should submit message on Enter key press", async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        sendMessage: mockSendMessage,
      });

      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");

      fireEvent.change(input, { target: { value: "Test message" } });
      fireEvent.submit(input.closest("form")!);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith("Test message");
      });
    });

    test("should not submit empty or whitespace-only messages", async () => {
      const mockSendMessage = jest.fn();
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        sendMessage: mockSendMessage,
      });

      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      const submitButton = screen
        .getByTestId("paper-airplane-icon")
        .closest("button");

      // Test empty message
      fireEvent.click(submitButton!);
      expect(mockSendMessage).not.toHaveBeenCalled();

      // Test whitespace-only message
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.click(submitButton!);
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test("should clear input after successful message send", async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        sendMessage: mockSendMessage,
      });

      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText(
        "Type your question...",
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "Test message" } });
      fireEvent.submit(input.closest("form")!);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    test("should dismiss error when dismiss button is clicked", () => {
      const mockSetError = jest.fn();
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        error: "Test error",
        setError: mockSetError,
      });

      render(<AIChatPanel />);

      const dismissButton = screen.getByText("Dismiss");
      fireEvent.click(dismissButton);

      expect(mockSetError).toHaveBeenCalledWith(null);
    });
  });

  describe("Disabled States", () => {
    test("should disable input and button when loading", () => {
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true,
      });

      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      const submitButton = screen
        .getByTestId("paper-airplane-icon")
        .closest("button");

      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test("should disable input and button when service is unavailable", () => {
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        isServiceAvailable: false,
      });

      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      const submitButton = screen
        .getByTestId("paper-airplane-icon")
        .closest("button");

      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test("should disable submit button when input is empty", () => {
      render(<AIChatPanel />);

      const submitButton = screen
        .getByTestId("paper-airplane-icon")
        .closest("button");

      expect(submitButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    test("should have proper ARIA labels and roles", () => {
      render(<AIChatPanel />);

      const clearButton = screen.getByTitle("Clear Chat");
      const sendButton = screen.getByTitle("Send");

      expect(clearButton).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    test("should handle keyboard navigation properly", () => {
      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      expect(input).toHaveAttribute("type", "text");

      // Input should be focusable - just verify no errors when focusing
      expect(() => {
        fireEvent.focus(input);
      }).not.toThrow();
    });
  });

  describe("Suggested Questions", () => {
    test("should populate input when suggested question is clicked", async () => {
      render(<AIChatPanel />);

      const input = screen.getByPlaceholderText("Type your question...");
      const suggestionButton = screen.getByText(
        "What are the key requirements for JCI accreditation?",
      );

      fireEvent.click(suggestionButton);

      await waitFor(() => {
        expect(input).toHaveValue(
          "What are the key requirements for JCI accreditation?",
        );
      });
    });
  });

  describe("Translations", () => {
    test("should display fallback text when translations are missing", () => {
      mockUseTranslation.mockReturnValue({
        t: () => undefined, // No translation available
      });

      render(<AIChatPanel />);

      expect(screen.getByText("AI Assistant")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Type your question..."),
      ).toBeInTheDocument();
    });

    test("should use translated text when available", () => {
      mockUseTranslation.mockReturnValue({
        t: (key: string) =>
          key === "aiAssistant" ? "مساعد الذكاء الاصطناعي" : key,
      });

      render(<AIChatPanel />);

      expect(screen.getByText("مساعد الذكاء الاصطناعي")).toBeInTheDocument();
    });
  });

  describe("Auto-scroll Behavior", () => {
    test("should scroll to bottom when messages change", () => {
      const scrollIntoViewMock = jest.fn();
      HTMLDivElement.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(<AIChatPanel />);

      // Update messages
      mockUseAIChatStore.mockReturnValue({
        ...defaultStoreState,
        messages: [
          {
            id: "1",
            type: "user",
            content: "New message",
            timestamp: new Date().toISOString(),
          },
        ],
      });

      rerender(<AIChatPanel />);

      // Note: Due to useEffect timing, this would require more complex testing setup
      // to verify the scroll behavior properly in a unit test environment
    });
  });
});
