import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import LandingPage from "@/pages/LandingPage";
import { submitDemoRequest } from "@/services/demoRequestService";

jest.mock("react-router-dom", () => {
  const { TextEncoder, TextDecoder } = jest.requireActual("node:util");
  Object.assign(globalThis, { TextEncoder, TextDecoder });
  return jest.requireActual("react-router-dom");
});

jest.mock("@/services/demoRequestService", () => ({
  submitDemoRequest: jest.fn(),
}));

const submitDemo = jest.mocked(submitDemoRequest);
const renderPage = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <LandingPage onLogin={jest.fn()} />
      </LanguageProvider>
    </MemoryRouter>,
  );
const fillDemo = () => {
  fireEvent.click(
    screen.getAllByRole("button", { name: /request a demo/i })[0],
  );
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "  Demo Person  " },
  });
  fireEvent.change(screen.getByLabelText(/work email/i), {
    target: { value: "demo@example.test" },
  });
};

describe("Public landing experience", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows customer value and explicitly labels the illustrative workflow", () => {
    // Arrange
    renderPage();
    // Act
    fireEvent.click(
      screen.getByText("Does the platform guarantee accreditation?"),
    );
    // Assert
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Continuous Excellence",
    );
    expect(screen.getByText(/not live customer data/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Accreditation decisions remain/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Investor information" }),
    ).toHaveAttribute("href", "/pitch");
  });

  it("switches the public interface to Arabic", () => {
    // Arrange
    renderPage();
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Switch to Arabic" }));
    // Assert
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "التميز المستمر",
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(
      screen.getByRole("button", { name: "التبديل إلى الإنجليزية" }),
    ).toBeInTheDocument();
  });

  it("submits trimmed contact details and shows confirmation only on success", async () => {
    // Arrange
    submitDemo.mockResolvedValue("demo-id");
    renderPage();
    fillDemo();
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));
    // Assert
    await waitFor(() =>
      expect(submitDemo).toHaveBeenCalledWith({
        name: "Demo Person",
        email: "demo@example.test",
        organization: "",
        message: "",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your request has been received",
    );
  });

  it.each([
    ["duplicate", "A request from this email already exists."],
    ["unavailable", "Something went wrong."],
  ])(
    "shows the %s submission error and keeps the form available",
    async (code, message) => {
      // Arrange
      submitDemo.mockRejectedValue(new Error(code));
      renderPage();
      fillDemo();
      // Act
      fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));
      // Assert
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Submit Request" }),
      ).toBeEnabled();
    },
  );

  it("closes with Escape and restores focus to the demo trigger", async () => {
    // Arrange
    renderPage();
    const trigger = screen.getAllByRole("button", {
      name: /request a demo/i,
    })[0];
    fireEvent.click(trigger);
    // Act
    fireEvent.keyDown(window, { key: "Escape" });
    // Assert
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
});
