import React, { useRef, useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import NavigationRail from "../NavigationRail";
import MobileSidebar from "../MobileSidebar";
import SidebarNavigation, { SidebarItem } from "../SidebarNavigation";
import { FolderIcon } from "@/components/icons";
import { NavigationState } from "@/types";
import { useArrowNavigation } from "@/hooks/useArrowNavigation";
import { en } from "@/data/locales/en/common";
import { ar } from "@/data/locales/ar/common";
import { GuidedTour } from "@/components/onboarding/GuidedTour";

let role = "Admin";
let lang: "en" | "ar" = "en";
let disabledKeys: string[] = [];
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (key: string) => {
      const messages: Record<string, unknown> = lang === "ar" ? ar : en;
      return typeof messages[key] === "string" ? messages[key] : key;
    },
  }),
}));
jest.mock("@/services/routePrefetchService", () => ({ prefetchRoute: jest.fn() }));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector: (state: { currentUser: { role: string; name: string; id: string } }) => unknown) =>
    selector({ currentUser: { role, name: "Alya", id: "u1" } }),
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: (selector: (state: { appSettings: null }) => unknown) => selector({ appSettings: null }),
}));
jest.mock("@/stores/useModuleStore", () => ({
  useModuleStore: (selector: (state: { isNavKeyEnabled: (key: string) => boolean }) => unknown) =>
    selector({ isNavKeyEnabled: key => !disabledKeys.includes(key) }),
}));
jest.mock("../UserAvatar", () => () => <span>Avatar</span>);
jest.mock("@/components/onboarding/Confetti", () => () => null);

const rail = (navigation: NavigationState = { view: "dashboard" }, expanded = true,
  onNavigate = jest.fn(), onExpand = jest.fn()) => (
  <NavigationRail navigation={navigation} isExpanded={expanded}
    setNavigation={onNavigate} setIsExpanded={onExpand} />
);

describe("Grouped sidebar user journey", () => {
  beforeEach(() => { role = "Admin"; lang = "en"; disabledKeys = []; });

  it("puts daily destinations first and hides secondary workspaces behind named groups", () => {
    // Arrange / Act
    render(rail());
    const nav = within(screen.getByRole("navigation", { name: en.navPrimary }));
    // Assert
    expect(nav.getAllByRole("button").slice(0, 3).map(button => button.getAttribute("aria-label")))
      .toEqual([en.dashboard, en.myTasks, en.projects]);
    expect(nav.getByRole("button", { name: en.navGroupAccreditation })).toHaveAttribute("aria-expanded", "true");
    expect(nav.getByRole("button", { name: en.navGroupQuality })).toHaveAttribute("aria-expanded", "false");
    expect(nav.queryByRole("button", { name: en.auditHub })).not.toBeInTheDocument();
    // Act
    fireEvent.click(nav.getByRole("button", { name: en.navGroupQuality }));
    // Assert
    expect(nav.getByRole("button", { name: en.auditHub })).toBeInTheDocument();
  });

  it("opens the current route's group, highlights it, and retains project detail highlighting", () => {
    // Arrange
    const { rerender } = render(rail({ view: "auditHub" }));
    // Assert
    expect(screen.getByRole("button", { name: en.auditHub })).toHaveAttribute("aria-current", "page");
    // Act
    rerender(rail({ view: "labOperations" }));
    // Assert
    expect(screen.getByRole("button", { name: en.navGroupOperations })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "labOperations" })).toHaveAttribute("aria-current", "page");
    // Act
    rerender(rail({ view: "editProject", projectId: "p1" }));
    // Assert
    expect(screen.getByRole("button", { name: en.projects })).toHaveAttribute("aria-current", "page");
  });

  it("uses an explicit collapse control instead of pointer-driven layout changes", () => {
    // Arrange
    const expand = jest.fn();
    const { rerender } = render(rail({ view: "dashboard" }, true, jest.fn(), expand));
    // Act
    fireEvent.mouseEnter(screen.getByRole("complementary"));
    fireEvent.mouseLeave(screen.getByRole("complementary"));
    // Assert
    expect(expand).not.toHaveBeenCalled();
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.navCollapse }));
    // Assert
    expect(expand).toHaveBeenLastCalledWith(false);
    // Act
    rerender(rail({ view: "dashboard" }, false, jest.fn(), expand));
    fireEvent.click(screen.getByRole("button", { name: en.navGroupOperations }));
    // Assert
    expect(expand).toHaveBeenLastCalledWith(true);
    // Act
    rerender(rail({ view: "dashboard" }, true, jest.fn(), expand));
    // Assert
    expect(screen.getByRole("button", { name: "labOperations" })).toBeInTheDocument();
  });

  it.each(["Admin", "admin", "Auditor", "TeamMember", "Viewer", "ProjectLead"])(
    "preserves existing role gating for %s on desktop and mobile", actorRole => {
      // Arrange
      role = actorRole;
      const { container } = render(<>
        {rail()}
        <MobileSidebar isOpen setIsOpen={jest.fn()} setNavigation={jest.fn()}
          navigation={{ view: "dashboard" }} isProjectsActive={false} isSettingsActive={false} />
      </>);
      // Act / Assert
      expect(container.querySelector("#nav-item-dataHub") !== null).toBe(actorRole.toLowerCase() === "admin");
      expect(container.querySelector("#mobile-nav-item-dataHub") !== null).toBe(actorRole.toLowerCase() === "admin");
      expect(container.querySelector("#nav-item-auditHub") !== null)
        .toBe(["admin", "auditor"].includes(actorRole.toLowerCase()));
      expect(container.querySelector("#mobile-nav-item-auditHub") !== null)
        .toBe(["admin", "auditor"].includes(actorRole.toLowerCase()));
    },
  );

  it("omits disabled entries and empty groups without losing Settings", () => {
    // Arrange
    disabledKeys = ["analyticsHub", "reportBuilder", "dataHub", "multiFacility", "myTasks"];
    // Act
    render(rail());
    // Assert
    expect(screen.queryByRole("button", { name: en.navGroupAdministration })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.myTasks })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.settings })).toBeInTheDocument();
  });

  it("navigates through a group without changing the navigation payload", () => {
    // Arrange
    const navigate = jest.fn();
    render(rail({ view: "dashboard" }, true, navigate));
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.navGroupAdministration }));
    fireEvent.click(screen.getByRole("button", { name: "dataHub" }));
    // Assert
    expect(navigate).toHaveBeenCalledWith({ view: "dataHub" });
  });

  it("retains every desktop destination exactly once after all groups are opened", () => {
    // Arrange
    const { container } = render(rail());
    const nav = within(screen.getByRole("navigation", { name: en.navPrimary }));
    // Act
    [en.navGroupQuality, en.navGroupOperations, en.navGroupAdministration]
      .forEach(name => fireEvent.click(nav.getByRole("button", { name })));
    // Assert
    expect(nav.getAllByRole("button")).toHaveLength(26);
    expect(container.querySelectorAll('[id^="nav-item-"]')).toHaveLength(23);
    const ids = Array.from(container.querySelectorAll("[id]")).map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders localized group and sidebar controls in Arabic", () => {
    // Arrange
    lang = "ar";
    // Act
    render(rail());
    // Assert
    expect(screen.getByRole("button", { name: ar.navGroupAccreditation })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ar.navCollapse })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: ar.navPrimary })).toBeInTheDocument();
  });

  it("skips hidden accordion links during arrow-key navigation", () => {
    // Arrange
    const items: SidebarItem[] = (["dashboard", "projects", "riskHub", "labOperations"] as const).map(key => ({
      key, nav: { view: key }, label: key, icon: FolderIcon,
    }));
    const Harness = () => {
      const ref = useRef<HTMLElement>(null);
      useArrowNavigation(ref);
      return <nav ref={ref}><SidebarNavigation items={items} isActive={() => false} onNavigate={jest.fn()} /></nav>;
    };
    render(<Harness />);
    const quality = screen.getByRole("button", { name: en.navGroupQuality });
    // Act
    quality.focus();
    fireEvent.keyDown(quality, { key: "ArrowDown" });
    // Assert
    expect(screen.getByRole("button", { name: en.navGroupOperations })).toHaveFocus();
  });

  it("keeps mobile focus trapped after group expansion and closes after navigation", () => {
    // Arrange
    const navigate = jest.fn();
    const close = jest.fn();
    render(<MobileSidebar isOpen setIsOpen={close} setNavigation={navigate}
      navigation={{ view: "dashboard" }} isProjectsActive={false} isSettingsActive={false} />);
    // Act
    fireEvent.click(screen.getByRole("button", { name: en.navGroupOperations }));
    screen.getByRole("button", { name: en.settings }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    // Assert
    expect(screen.getByRole("button", { name: en.closeMenu })).toHaveFocus();
    // Act
    fireEvent.click(screen.getByRole("button", { name: "labOperations" }));
    // Assert
    expect(navigate).toHaveBeenCalledWith({ view: "labOperations" });
    expect(close).toHaveBeenCalledWith(false);
    // Act
    fireEvent.keyDown(document, { key: "Escape" });
    // Assert
    expect(close).toHaveBeenLastCalledWith(false);
  });

  it("removes the closed mobile drawer from the accessibility tree", () => {
    // Arrange / Act
    const { container } = render(<MobileSidebar isOpen={false} setIsOpen={jest.fn()} setNavigation={jest.fn()}
      navigation={{ view: "dashboard" }} isProjectsActive={false} isSettingsActive={false} />);
    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).toHaveAttribute("inert");
  });

  it("reveals a tour target in a collapsed sidebar without skipping the step", () => {
    // Arrange
    jest.useFakeTimers();
    const shown = jest.fn();
    const scroll = jest.fn();
    const originalScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    const steps = [{ target: "#nav-item-auditHub", titleKey: "auditTourTitle", descriptionKey: "auditTourDescription", onShow: shown }];
    const Harness = () => {
      const [expanded, setExpanded] = useState(false);
      return <>
        <NavigationRail navigation={{ view: "dashboard" }} isExpanded={expanded}
          setIsExpanded={setExpanded} setNavigation={jest.fn()} />
        <GuidedTour tourId="sidebar-regression" steps={steps} isActive forceShow onComplete={jest.fn()} />
      </>;
    };
    try {
      // Act
      render(<Harness />);
      act(() => { jest.advanceTimersByTime(350); });
      // Assert
      expect(screen.getByRole("button", { name: en.auditHub })).toBeVisible();
      expect(screen.getByText("auditTourTitle")).toBeInTheDocument();
      expect(shown).toHaveBeenCalled();
      expect(scroll).toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScroll;
      jest.useRealTimers();
    }
  });
});
