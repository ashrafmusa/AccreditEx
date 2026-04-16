import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import DashboardPage from "../DashboardPage";

const mockUseUserStore = jest.fn();
const mockUseProjectStore = jest.fn();
const mockUseAppStore = jest.fn();

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => mockUseUserStore(),
}));

jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => mockUseProjectStore(),
}));

jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => mockUseAppStore(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "welcomeBack") return "Welcome back, {name}";
      if (key === "dashboard") return "Dashboard";
      if (key === "dashboardNotAvailable") return "Dashboard not available";
      if (key === "loading") return "Loading";
      return key;
    },
  }),
}));

jest.mock("@/components/dashboard/AdminDashboard", () => () => (
  <div data-testid="admin-dashboard">Admin Dashboard</div>
));
jest.mock("@/components/dashboard/ProjectLeadDashboard", () => () => (
  <div data-testid="projectlead-dashboard">ProjectLead Dashboard</div>
));
jest.mock("@/components/dashboard/TeamMemberDashboard", () => () => (
  <div data-testid="teammember-dashboard">TeamMember Dashboard</div>
));
jest.mock("@/components/dashboard/AuditorDashboard", () => () => (
  <div data-testid="auditor-dashboard">Auditor Dashboard</div>
));
jest.mock("@/components/dashboard/MyTasksWidget", () => () => (
  <div data-testid="my-tasks-widget">My Tasks</div>
));
jest.mock("@/components/common/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("DashboardPage role rendering", () => {
  beforeEach(() => {
    mockUseProjectStore.mockReturnValue({ projects: [] });
    mockUseAppStore.mockReturnValue({ accreditationPrograms: [] });
  });

  it("renders dedicated Viewer branch", () => {
    const setNavigation = jest.fn();

    mockUseUserStore.mockReturnValue({
      currentUser: { id: "u1", role: "Viewer", name: "Alya" },
    });

    render(<DashboardPage setNavigation={setNavigation} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dashboard",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Alya/)).toBeInTheDocument();
    expect(
      screen.queryByText("Dashboard not available"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("my-tasks-widget")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /projects/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    expect(setNavigation).toHaveBeenCalledWith({ view: "projects" });

    fireEvent.keyDown(window, { key: "8", altKey: true });
    expect(setNavigation).toHaveBeenCalledWith({ view: "projects" });
  });

  it("still renders admin dashboard for Admin role", () => {
    mockUseUserStore.mockReturnValue({
      currentUser: { id: "u2", role: "Admin", name: "Omar" },
    });

    render(<DashboardPage setNavigation={jest.fn()} />);

    expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
  });
});
