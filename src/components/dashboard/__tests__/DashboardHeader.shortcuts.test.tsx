import { fireEvent, render, screen } from "@testing-library/react";
import DashboardHeader from "../DashboardHeader";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (k: string) => {
      if (k === "welcomeBack") return "Welcome back, {name}";
      if (k === "dashboardGreeting") return "Let us get work done";
      if (k === "lastUpdated") return "Last updated";
      if (k === "justNow") return "Just now";
      if (k === "viewMyTasks") return "View My Tasks";
      if (k === "createNewProject") return "Create New Project";
      return k;
    },
  }),
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => ({
    currentUser: { name: "Sara", email: "sara@test.com" },
  }),
}));

jest.mock("@/components/icons", () => ({
  PlusIcon: () => <span />,
  ClipboardDocumentCheckIcon: () => <span />,
  ArrowPathIcon: () => <span />,
  DownloadIcon: () => <span />,
}));

describe("DashboardHeader role shortcuts", () => {
  it("navigates when role shortcut is clicked", () => {
    const setNavigation = jest.fn();

    render(
      <DashboardHeader
        setNavigation={setNavigation}
        title="Welcome back, {name}"
        greeting="Hi"
        roleShortcuts={[
          { label: "Schedule Audit", navigation: { view: "auditHub" } as any },
          {
            label: "Overdue Docs",
            navigation: { view: "documentControl", filter: "overdue" } as any,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByText("Schedule Audit"));
    expect(setNavigation).toHaveBeenCalledWith({ view: "auditHub" });

    fireEvent.click(screen.getByText("Overdue Docs"));
    expect(setNavigation).toHaveBeenCalledWith({
      view: "documentControl",
      filter: "overdue",
    });
  });

  it("navigates when Alt+number shortcut is pressed", () => {
    const setNavigation = jest.fn();

    render(
      <DashboardHeader
        setNavigation={setNavigation}
        title="Welcome back, {name}"
        greeting="Hi"
        roleShortcuts={[
          { label: "Schedule Audit", navigation: { view: "auditHub" } as any },
          {
            label: "Overdue Docs",
            navigation: { view: "documentControl", filter: "overdue" } as any,
          },
        ]}
      />,
    );

    fireEvent.keyDown(window, { key: "1", altKey: true });
    expect(setNavigation).toHaveBeenCalledWith({ view: "auditHub" });

    fireEvent.keyDown(window, { key: "2", altKey: true });
    expect(setNavigation).toHaveBeenCalledWith({
      view: "documentControl",
      filter: "overdue",
    });
  });
});
