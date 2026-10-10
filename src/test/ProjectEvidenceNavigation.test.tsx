import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { useNavigation } from "@/hooks/useNavigation";
import { navigationStateToPath } from "@/router/routes";
jest.mock("react-router-dom", () => {
  const { TextEncoder, TextDecoder } = jest.requireActual("node:util");
  Object.assign(globalThis, { TextEncoder, TextDecoder });
  return jest.requireActual("react-router-dom");
});

function Journey() {
  const { navigation, setNavigation } = useNavigation({ view: "dashboard" });
  const navigate = useNavigate();
  return (
    <div>
      <pre data-testid="navigation">{JSON.stringify(navigation)}</pre>
      <button
        onClick={() =>
          setNavigation({
            view: "documentControl",
            filter: "project:p1",
            documentId: "doc1",
          })
        }
      >
        Evidence
      </button>
      <button onClick={() => setNavigation({ view: "documentControl" })}>
        Clear
      </button>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
    </div>
  );
}

describe("Persistent project evidence navigation", () => {
  it("serializes project filters and document IDs without dropping template navigation", () => {
    // Arrange / Act
    const path = navigationStateToPath({
      view: "documentControl",
      filter: "project:p1",
      documentId: "doc/1",
      templateId: "template1",
    });
    const params = new URLSearchParams(path.split("?")[1]);
    // Assert
    expect(params.get("filter")).toBe("project:p1");
    expect(params.get("documentId")).toBe("doc/1");
    expect(params.get("templateId")).toBe("template1");
    expect(navigationStateToPath({ view: "documentControl" })).toBe(
      "/documents",
    );
  });
  it("retains scope and selected evidence through real routing and browser history", () => {
    // Arrange
    render(
      <MemoryRouter initialEntries={["/projects/p1"]}>
        <Journey />
      </MemoryRouter>,
    );
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
    // Assert
    expect(
      JSON.parse(screen.getByTestId("navigation").textContent || "{}"),
    ).toMatchObject({
      view: "documentControl",
      filter: "project:p1",
      documentId: "doc1",
    });
    // Act
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      JSON.parse(screen.getByTestId("navigation").textContent || "{}"),
    ).toEqual({ view: "documentControl" });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      JSON.parse(screen.getByTestId("navigation").textContent || "{}").filter,
    ).toBe("project:p1");
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(
      JSON.parse(screen.getByTestId("navigation").textContent || "{}").filter,
    ).toBeUndefined();
  });
  it("hydrates a directly loaded evidence URL and retains overdue dashboard navigation", () => {
    // Arrange / Act
    const view = render(
      <MemoryRouter
        initialEntries={["/documents?filter=project%3Ap1&documentId=doc1"]}
      >
        <Journey />
      </MemoryRouter>,
    );
    // Assert
    expect(
      JSON.parse(screen.getByTestId("navigation").textContent || "{}"),
    ).toMatchObject({ filter: "project:p1", documentId: "doc1" });
    view.unmount();
    render(
      <MemoryRouter initialEntries={["/documents?filter=overdue"]}>
        <Journey />
      </MemoryRouter>,
    );
    expect(
      JSON.parse(screen.getByTestId("navigation").textContent || "{}").filter,
    ).toBe("overdue");
  });
});
