import React, { useEffect, useRef } from "react";
import { NavigationState, SettingsSection, UserRole } from "@/types";
import {
  ChartPieIcon,
  FolderIcon,
  LogoIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  ChartBarSquareIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CircleStackIcon,
  ClipboardDocumentSearchIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { prefetchRoute } from "@/services/routePrefetchService";
import UserAvatar from "./UserAvatar";

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

  // Focus Trap
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const focusableElements = sidebarRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
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
      firstElement?.focus();

      return () => {
        document.removeEventListener("keydown", handleTabKey);
        document.removeEventListener("keydown", handleEscapeKey);
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
      nav: { view: "analytics" },
      key: "analytics",
      label: t("analytics"),
      icon: ChartBarSquareIcon,
    },
    {
      nav: { view: "qualityInsights" },
      key: "qualityInsights",
      label: t("qualityInsights"),
      icon: LightBulbIcon,
    },
    {
      nav: { view: "calendar" },
      key: "calendar",
      label: t("calendar"),
      icon: CalendarDaysIcon,
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
      nav: { view: "myTasks" },
      key: "myTasks",
      label: t("myTasks"),
      icon: ClipboardDocumentCheckIcon,
    },
    {
      nav: { view: "messaging" },
      key: "messaging",
      label: t("messages"),
      icon: ChatBubbleLeftEllipsisIcon,
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
      icon: ClipboardDocumentSearchIcon,
      adminOnly: true,
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
      nav: { view: "trainingHub" },
      key: "trainingHub",
      label: t("trainingHub"),
      icon: AcademicCapIcon,
    },
    {
      nav: { view: "settings" },
      key: "settings",
      label: t("settings"),
      icon: Cog6ToothIcon,
      adminOnly: true,
      bottom: true,
    },
  ];

  const visibleNavItems = allNavItems.filter(
    (item) => !item.adminOnly || currentUser?.role?.toLowerCase() === "admin",
  );
  const mainItems = visibleNavItems.filter((item) => !item.bottom);
  const bottomItems = visibleNavItems.filter((item) => item.bottom);

  const isActive = (key: string) => {
    if (key === "projects") return isProjectsActive;
    if (key === "messaging") return navigation.view === "messaging";

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
        aria-label="Mobile Navigation"
        className={`fixed inset-y-0 ${dir === "ltr" ? "left-0" : "right-0"} w-72 bg-slate-900 text-white transform transition-transform z-40 sm:hidden ${isOpen ? "translate-x-0" : dir === "ltr" ? "-translate-x-full" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
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
              <span className="text-gray-100">Accredit</span>
              <span className="text-brand-primary">Ex</span>
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={t("closeMenu")}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        {/* User identity */}
        {currentUser && (
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <UserAvatar user={currentUser} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}
        <nav
          className="flex-1 px-4 py-6 flex flex-col justify-between h-[calc(100%-5rem)]"
          aria-label="Main Navigation"
        >
          <ul role="list">
            {mainItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleNavigate(item.nav)}
                  onPointerEnter={() => prefetchRoute(item.nav.view)}
                  className={`w-full text-left flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${isActive(item.key) ? "bg-brand-primary text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <item.icon className="h-6 w-6 ltr:mr-3 rtl:ml-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <ul role="list" aria-label="Secondary Navigation">
            {bottomItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleNavigate(item.nav)}
                  onPointerEnter={() => prefetchRoute(item.nav.view)}
                  className={`w-full text-left flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${isActive(item.key) ? "bg-brand-primary text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <item.icon className="h-6 w-6 ltr:mr-3 rtl:ml-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileSidebar;
