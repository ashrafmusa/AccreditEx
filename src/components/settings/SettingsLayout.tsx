import React, { useState } from "react";
import { NavigationState, SettingsSection } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import GeneralSettingsPage from "./GeneralSettingsPage";
import ProfileSettingsPage from "./ProfileSettingsPage";
import SecuritySettingsPage from "./SecuritySettingsPage";
import AccreditationHubPage from "@/pages/AccreditationHubPage";
import CompetencyLibraryPage from "../competencies/CompetencyLibraryPage";
import DataSettingsPage from "./DataSettingsPage";
import AboutSettingsPage from "./AboutSettingsPage";
import AppearanceSettingsPage from "./AppearanceSettingsPage";
import NotificationSettingsPage from "./NotificationSettingsPage";
import AccessibilitySettingsPage from "./AccessibilitySettingsPage";
import GlobeSettingsPage from "./GlobeSettingsPage";
import UsageMonitorSettingsPage from "./UsageMonitorSettingsPage";
import UsersPage from "@/pages/UsersPage";
import FirebaseSetupPage from "./firebase/FirebaseSetupPage";
import VisualSettingsPage from "./VisualSettingsPage";
import {
  Cog6ToothIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  GlobeAltIcon,
  CircleStackIcon,
  InformationCircleIcon,
  IdentificationIcon,
  BellIcon,
  EyeIcon,
  PaintBrushIcon,
  ChartBarIcon,
  SparklesIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@/components/icons";

interface SettingsLayoutProps {
  section: SettingsSection | undefined;
  setNavigation: (state: NavigationState) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  section = "general",
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Firebase Setup is admin-only
  const isAdmin = currentUser?.role === "Admin";

  const allNavItems = [
    {
      id: "visual",
      label: "Visual Settings",
      icon: PaintBrushIcon,
      adminOnly: false,
      category: "Personal",
    },
    {
      id: "profile",
      label: t("profile"),
      icon: UserCircleIcon,
      adminOnly: false,
      category: "Personal",
    },
    {
      id: "security",
      label: t("security"),
      icon: ShieldCheckIcon,
      adminOnly: false,
      category: "Personal",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: BellIcon,
      adminOnly: false,
      category: "Personal",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      icon: EyeIcon,
      adminOnly: false,
      category: "Personal",
    },
    {
      id: "usageMonitor",
      label: "Usage Monitor",
      icon: ChartBarIcon,
      adminOnly: false,
      category: "System",
    },
    {
      id: "users",
      label: t("userManagement"),
      icon: UsersIcon,
      adminOnly: true,
      category: "Admin",
    },
    {
      id: "accreditationHub",
      label: t("accreditationHub"),
      icon: GlobeAltIcon,
      adminOnly: true,
      category: "Admin",
    },
    {
      id: "competencies",
      label: t("competencies"),
      icon: IdentificationIcon,
      adminOnly: true,
      category: "Admin",
    },
    {
      id: "data",
      label: t("data"),
      icon: CircleStackIcon,
      adminOnly: true,
      category: "Admin",
    },
    ...(isAdmin
      ? [
          {
            id: "firebaseSetup",
            label: t("firebaseSetup"),
            icon: SparklesIcon,
            adminOnly: true,
            category: "Admin",
          },
        ]
      : []),
    {
      id: "about",
      label: t("about"),
      icon: InformationCircleIcon,
      adminOnly: false,
      category: "System",
    },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const filteredNavItems = searchQuery
    ? navItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;

  const groupedItems = filteredNavItems.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const renderSection = () => {
    switch (section) {
      case "visual":
        return <VisualSettingsPage />;
      case "general":
        return <GeneralSettingsPage />;
      case "appearance":
        return <AppearanceSettingsPage />;
      case "globe":
        return <GlobeSettingsPage />;
      case "profile":
        return <ProfileSettingsPage />;
      case "security":
        return <SecuritySettingsPage />;
      case "notifications":
        return <NotificationSettingsPage />;
      case "accessibility":
        return <AccessibilitySettingsPage />;
      case "usageMonitor":
        return <UsageMonitorSettingsPage />;
      case "users":
        return <UsersPage setNavigation={setNavigation} />;
      case "accreditationHub":
        return <AccreditationHubPage setNavigation={setNavigation} />;
      case "competencies":
        return <CompetencyLibraryPage />;
      case "data":
        return <DataSettingsPage />;
      case "firebaseSetup":
        return isAdmin ? <FirebaseSetupPage /> : <GeneralSettingsPage />;
      case "about":
        return <AboutSettingsPage />;
      default:
        return <VisualSettingsPage />;
    }
  };

  const SidebarContent = () => (
    <>
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-2 overflow-y-auto flex-1">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-4">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {category}
              </h3>
            </div>
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setNavigation({
                      view: "settings",
                      section: item.id as SettingsSection,
                    });
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    section === item.id
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-text-primary dark:hover:text-dark-brand-text-primary"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      section === item.id
                        ? ""
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {section === item.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 items-start relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-brand-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
        aria-label="Toggle settings menu"
      >
        {isSidebarOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-full lg:w-72 shrink-0 fixed lg:sticky top-0 left-0 h-full lg:h-auto z-40 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-screen lg:h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden sticky top-4">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full lg:flex-1 min-h-[calc(100vh-8rem)]">
        <div className="animate-fadeIn">{renderSection()}</div>
      </main>
    </div>
  );
};

export { SettingsLayout };
export default SettingsLayout;
