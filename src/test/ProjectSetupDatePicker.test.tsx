import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DatePicker from "@/components/ui/DatePicker";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, lang: "en" }),
}));

describe("Project setup calendar", () => {
  it("exposes a labelled date control and follows externally applied suggestion dates", () => {
    // Arrange
    const props = { id: "start", ariaLabel: "Start date", setDate: jest.fn() };
    const view = render(<DatePicker {...props} date={new Date(2030, 0, 1)} />);
    // Act
    view.rerender(<DatePicker {...props} date={new Date(2030, 2, 1)} />);
    fireEvent.click(screen.getByRole("button", { name: "Start date" }));
    // Assert
    expect(screen.getByText("March 2030")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start date" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
  it("allows today's date when the setup lower bound is the local start of day", () => {
    // Arrange
    const today = new Date(2030, 2, 10);
    const select = jest.fn();
    render(
      <DatePicker
        ariaLabel="Start date"
        date={today}
        fromDate={today}
        setDate={select}
      />,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Start date" }));
    fireEvent.click(screen.getByRole("button", { name: "10" }));
    // Assert
    expect(select).toHaveBeenCalledWith(today);
  });
});
