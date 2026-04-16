import { render, screen } from "@testing-library/react";
import NavigationRail from "../NavigationRail";

const mockUseUserStore = jest.fn();
const mockUseModuleStore = jest.fn();
const mockUseAppStore = jest.fn();

jest.mock("@/hooks/useArrowNavigation", () => ({
  useArrowNavigation: jest.fn(),
}));

jest.mock("@/services/routePrefetchService", () => ({
  prefetchRoute: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector?: any) => mockUseUserStore(selector),
}));

jest.mock("@/stores/useModuleStore", () => ({
  useModuleStore: (selector?: any) => mockUseModuleStore(selector),
}));

jest.mock("@/stores/useAppStore", () => ({
  useAppStore: (selector?: any) => mockUseAppStore(selector),
}));

describe("NavigationRail role access integration", () => {
  beforeEach(() => {
    mockUseUserStore.mockImplementation((selector?: any) => {
      const state = { currentUser: { role: "TeamMember" } };
      return typeof selector === "function" ? selector(state) : state;
    });
    mockUseModuleStore.mockImplementation((selector?: any) => {
      const state = { isNavKeyEnabled: () => true };
      return typeof selector === "function" ? selector(state) : state;
    });
    mockUseAppStore.mockImplementation((selector?: any) => {
      const state = { appSettings: null };
      return typeof selector === "function" ? selector(state) : state;
    });
  });

  it("hides admin-only nav entries for non-admin user", () => {
    render(
      <NavigationRail
        setNavigation={jest.fn()}
        navigation={{ view: "dashboard" } as any}
        isExpanded={true}
        setIsExpanded={jest.fn()}
      />,
    );

    expect(screen.queryByText("auditHub")).not.toBeInTheDocument();
    expect(screen.queryByText("dataHub")).not.toBeInTheDocument();
  });

  it("shows admin-only nav entries for admin user", () => {
    mockUseUserStore.mockImplementation((selector?: any) => {
      const state = { currentUser: { role: "Admin" } };
      return typeof selector === "function" ? selector(state) : state;
    });

    render(
      <NavigationRail
        setNavigation={jest.fn()}
        navigation={{ view: "dashboard" } as any}
        isExpanded={true}
        setIsExpanded={jest.fn()}
      />,
    );

    expect(screen.getByText("auditHub")).toBeInTheDocument();
    expect(screen.getByText("dataHub")).toBeInTheDocument();
    expect(screen.getByText("labOperations")).toBeInTheDocument();
  });

  it("shows admin-only nav entries for lowercase admin role", () => {
    mockUseUserStore.mockImplementation((selector?: any) => {
      const state = { currentUser: { role: "admin" } };
      return typeof selector === "function" ? selector(state) : state;
    });

    render(
      <NavigationRail
        setNavigation={jest.fn()}
        navigation={{ view: "dashboard" } as any}
        isExpanded={true}
        setIsExpanded={jest.fn()}
      />,
    );

    expect(screen.getByText("auditHub")).toBeInTheDocument();
    expect(screen.getByText("dataHub")).toBeInTheDocument();
    expect(screen.getByText("labOperations")).toBeInTheDocument();
  });
});
