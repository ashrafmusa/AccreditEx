import {
  AcademicCapIcon,
  ArrowPathIcon,
  BeakerIcon,
  BoltIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
  ChatBubbleLeftEllipsisIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentSearchIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  LightBulbIcon,
  ListBulletIcon,
  LogoIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { prefetchRoute } from "@/services/routePrefetchService";
import { useAppStore } from "@/stores/useAppStore";
import { useModuleStore } from "@/stores/useModuleStore";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState } from "@/types";
import React, { useEffect, useRef } from "react";
import UserAvatar from "./UserAvatar";
import SidebarNavigation from "./SidebarNavigation";

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setNavigation: (state: NavigationState) => void;
  navigation: NavigationState;
  isProjectsActive: boolean;
  isSettingsActive: boolean;
}

interface NavItemType {
  nav: NavigationState;
  key: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
  auditorAllowed?: boolean;
  bottom?: boolean;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  setIsOpen,
  setNavigation,
  navigation,
  isProjectsActive,
  isSettingsActive,
}) => {
  const { t, dir } = useTranslation();
  const currentUser = useUserStore((state) => state.currentUser);
  const appSettings = useAppStore((state) => state.appSettings);
  const currentView = navigation.view;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isNavKeyEnabled = useModuleStore((s) => s.isNavKeyEnabled);

  // Focus Trap
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const previousFocus = document.activeElement;
      const getFocusableElements = () => Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter(element => !element.closest("[hidden]") && !element.hasAttribute("disabled"));

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          const focusableElements = getFocusableElements();
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("keydown", handleTabKey);
      document.addEventListener("keydown", handleEscapeKey);
      getFocusableElements()[0]?.focus();

      return () => {
        document.removeEventListener("keydown", handleTabKey);
        document.removeEventListener("keydown", handleEscapeKey);
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      };
    }
  }, [isOpen, setIsOpen]);

  const allNavItems: NavItemType[] = [
    {
      nav: { view: "dashboard" },
      key: "dashboard",
      label: t("dashboard"),
      icon: ChartPieIcon,
    },
    {
      nav: { view: "accreditationHub" },
      key: "accreditationHub",
      label: t("accreditationHub"),
      icon: ShieldCheckIcon,
    },
    {
      nav: { view: "analyticsHub" },
      key: "analyticsHub",
      label: t("analyticsHub") || "Analytics",
      icon: ChartBarSquareIcon,
    },
    {
      nav: { view: "qualityInsights" },
      key: "qualityInsights",
      label: t("qualityInsights"),
      icon: LightBulbIcon,
    },
    {
      nav: { view: "projects" },
      key: "projects",
      label: t("projects"),
      icon: FolderIcon,
    },
    {
      nav: { view: "documentControl" },
      key: "documentControl",
      label: t("documentControl"),
      icon: DocumentTextIcon,
    },
    {
      nav: { view: "riskHub" },
      key: "riskHub",
      label: t("riskHub"),
      icon: ExclamationTriangleIcon,
    },
    {
      nav: { view: "auditHub" },
      key: "auditHub",
      label: t("auditHub"),
      auditorAllowed: true,
      icon: ClipboardDocumentSearchIcon,
      adminOnly: true,
    },
    {
      nav: { view: "trainingHub" },
      key: "trainingHub",
      label: t("trainingHub"),
      icon: AcademicCapIcon,
    },
    {
      nav: { view: "myTasks" },
      key: "myTasks",
      label: t("myTasks") || "My Tasks",
      icon: ListBulletIcon,
    },
    {
      nav: { view: "qualityTools" },
      key: "qualityTools",
      label: t("qualityTools") || "Quality Tools",
      icon: SparklesIcon,
    },
    {
      nav: { view: "knowledgeBase" },
      key: "knowledgeBase",
      label: t("knowledgeBase") || "Knowledge Base",
      icon: BookOpenIcon,
    },
    {
      nav: { view: "calendar" },
      key: "calendar",
      label: t("calendar"),
      icon: CalendarDaysIcon,
    },
    {
      nav: { view: "messaging" },
      key: "messaging",
      label: t("messages"),
      icon: ChatBubbleLeftEllipsisIcon,
    },
    {
      nav: { view: "templateLibrary" },
      key: "templateLibrary",
      label: t("templateLibrary") || "Template Library",
      icon: Squares2X2Icon,
    },
    {
      nav: { view: "dataHub" },
      key: "dataHub",
      label: t("dataHub"),
      icon: CircleStackIcon,
      adminOnly: true,
    },
    {
      nav: { view: "departments" },
      key: "departments",
      label: t("departments"),
      icon: BuildingOffice2Icon,
      adminOnly: true,
    },
    {
      nav: { view: "labOperations" },
      key: "labOperations",
      label: t("labOperations") || "Lab Operations",
      icon: BeakerIcon,
      adminOnly: true,
    },
    {
      nav: { view: "qualityRounding" },
      key: "qualityRounding",
      label: t("qualityRounding") || "Quality Rounding",
      icon: ClipboardDocumentListIcon,
      adminOnly: true,
    },
    {
      nav: { view: "multiFacility" },
      key: "multiFacility",
      label: t("multiFacilityDashboard") || "Multi-Facility",
      icon: BuildingOffice2Icon,
      adminOnly: true,
    },
    {
      nav: { view: "workflowAutomation" },
      key: "workflowAutomation",
      label: t("workflowAutomation") || "Workflow Automation",
      icon: BoltIcon,
      adminOnly: true,
    },
    {
      nav: { view: "reportBuilder" },
      key: "reportBuilder",
      label: t("reportBuilder") || "Report Builder",
      icon: ChartBarIcon,
      adminOnly: true,
      auditorAllowed: true,
    },
    {
      nav: { view: "supplierHub" },
      key: "supplierHub",
      label: t("supplierHub") || "Suppliers",
      icon: CubeIcon,
      adminOnly: true,
    },
    {
      nav: { view: "changeControlHub" },
      key: "changeControlHub",
      label: t("changeControl") || "Change Control",
      icon: ArrowPathIcon,
      adminOnly: true,
    },
    {
      nav: { view: "settings" },
      key: "settings",
      label: t("settings"),
      icon: Cog6ToothIcon,
      bottom: true,
    },
  ];

  const isAuditor = currentUser?.role?.toLowerCase() === "auditor";
  const visibleNavItems = allNavItems.filter(
    (item) =>
      (!item.adminOnly ||
        currentUser?.role?.toLowerCase() === "admin" ||
        (item.auditorAllowed && isAuditor)) &&
      isNavKeyEnabled(item.key),
  );
  const mainItems = visibleNavItems.filter((item) => !item.bottom);
  const bottomItems = visibleNavItems.filter((item) => item.bottom);

  const isActive = (key: string) => {
    if (key === "projects") return isProjectsActive;
    if (key === "messaging") return navigation.view === "messaging";
    if (key === "accreditationHub" && currentView === "standards") return true;

    if (navigation.view === "settings") {
      const section = navigation.section;
      if (key === "users") return section === "users";
      if (key === "accreditationHub")
        return section === "accreditationHub" || currentView === "standards";
      if (key === "settings")
        return (
          !section ||
          ["general", "profile", "data", "about"].includes(section || "")
        );
    }

    return currentView === key;
  };

  const handleNavigate = (state: NavigationState) => {
    setNavigation(state);
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity sm:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("navMobile")}
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 ${dir === "ltr" ? "left-0" : "right-0"} w-72 max-w-[calc(100vw-2rem)] h-dvh flex flex-col bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary transform transition-transform z-40 sm:hidden ${isOpen ? "translate-x-0" : dir === "ltr" ? "-translate-x-full" : "translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between h-20 px-4 border-b border-brand-border dark:border-dark-brand-border">
          <div className="flex items-center">
            {appSettings?.logoUrl ? (
              <img
                src={appSettings.logoUrl}
                alt="App Logo"
                className="h-8 w-8"
              />
            ) : (
              <LogoIcon className="h-8 w-8" />
            )}
            <h1 className="text-2xl font-bold mx-3">
              <span>Accredit</span>
              <span className="text-brand-primary">Ex</span>
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-brand-primary/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
            aria-label={t("closeMenu")}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        {/* User identity */}
        {currentUser && (
          <div className="shrink-0 px-4 py-3 border-b border-brand-border dark:border-dark-brand-border flex items-center gap-3">
            <UserAvatar user={currentUser} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}
        <nav
          className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
          aria-label={t("navPrimary")}
        >
          <SidebarNavigation items={mainItems} isActive={isActive} onNavigate={handleNavigate} itemIdPrefix="mobile-nav-item" />
        </nav>
          <ul className="shrink-0 border-t border-brand-border dark:border-dark-brand-border px-3 py-2" role="list" aria-label={t("navSecondary")}>
            {bottomItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleNavigate(item.nav)}
                  onPointerEnter={() => prefetchRoute(item.nav.view)}
                  aria-current={isActive(item.key) ? "page" : undefined}
                  className={`w-full text-start flex items-center min-h-12 px-3 py-3 my-1 rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary ${isActive(item.key) ? "bg-brand-primary text-white" : "text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-brand-primary/10"}`}
                >
                  <item.icon className="h-6 w-6 ltr:mr-3 rtl:ml-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
      </div>
    </>
  );
};

export default MobileSidebar;
