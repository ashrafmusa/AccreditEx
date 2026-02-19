import React, { lazy, Suspense, useState } from "react";
import { NavigationState, SettingsSection } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";

const ProfileSettingsPage = lazy(() => import("./ProfileSettingsPage"));
const SecuritySettingsPage = lazy(() => import("./SecuritySettingsPage"));
const AccreditationHubPage = lazy(() => import("@/pages/AccreditationHubPage"));
const CompetencyLibraryPage = lazy(
  () => import("../competencies/CompetencyLibraryPage"),
);
const DataSettingsPage = lazy(() => import("./DataSettingsPage"));
const AboutSettingsPage = lazy(() => import("./AboutSettingsPage"));
const NotificationSettingsPage = lazy(
  () => import("./NotificationSettingsPage"),
);
const AccessibilitySettingsPage = lazy(
  () => import("./AccessibilitySettingsPage"),
);
const UsageMonitorSettingsPage = lazy(
  () => import("./UsageMonitorSettingsPage"),
);
const UsageMonitorPage = lazy(() => import("./UsageMonitorPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const FirebaseSetupPage = lazy(() => import("./firebase/FirebaseSetupPage"));
const VisualSettingsPage = lazy(() => import("./VisualSettingsPage"));
const SettingsAuditLogViewer = lazy(() => import("./SettingsAuditLogViewer"));
const SettingsVersionHistory = lazy(() => import("./SettingsVersionHistory"));
const SettingsPresetsPanel = lazy(() => import("./SettingsPresetsPanel"));
const BulkUserImport = lazy(() => import("./BulkUserImport"));
const DepartmentsPage = lazy(() => import("@/pages/DepartmentsPage"));
const LIMSIntegrationSettingsPage = lazy(
  () => import("./LIMSIntegrationSettingsPage"),
);
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
  ClockIcon,
  DocumentDuplicateIcon,
  StarIcon,
  ArrowUpTrayIcon,
  BuildingOffice2Icon,
  BeakerIcon,
} from "@/components/icons";

interface SettingsLayoutProps {
  section: SettingsSection | undefined;
  setNavigation: (state: NavigationState) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  section: sectionProp,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Firebase Setup is admin-only
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Default section: admins see Visual first, non-admins see Profile
  const section = sectionProp ?? (isAdmin ? "visual" : "profile");

  const allNavItems = [
    {
      id: "visual",
      label: t("visualSettings"),
      icon: PaintBrushIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "profile",
      label: t("profile"),
      icon: UserCircleIcon,
      adminOnly: false,
      category: t("personal"),
    },
    {
      id: "security",
      label: t("security"),
      icon: ShieldCheckIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "notifications",
      label: t("notifications"),
      icon: BellIcon,
      adminOnly: false,
      category: t("personal"),
    },
    {
      id: "accessibility",
      label: t("accessibility"),
      icon: EyeIcon,
      adminOnly: false,
      category: t("personal"),
    },
    {
      id: "settingsPresets",
      label: t("settingsPresets"),
      icon: StarIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "versionHistory",
      label: t("versionHistory"),
      icon: DocumentDuplicateIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "usageTracking",
      label: t("usageTracking") || "Usage Tracking Settings",
      icon: Cog6ToothIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "firebaseUsage",
      label: t("firebaseUsageDashboard") || "Firebase Usage Dashboard",
      icon: ChartBarIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "users",
      label: t("userManagement"),
      icon: UsersIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "accreditationHub",
      label: t("accreditationHub"),
      icon: GlobeAltIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "competencies",
      label: t("competencies"),
      icon: IdentificationIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "data",
      label: t("data"),
      icon: CircleStackIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "auditLog",
      label: t("auditLog"),
      icon: ClockIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "bulkUserImport",
      label: t("bulkUserImport"),
      icon: ArrowUpTrayIcon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "departments",
      label: t("departments"),
      icon: BuildingOffice2Icon,
      adminOnly: true,
      category: t("admin"),
    },
    {
      id: "limsIntegration",
      label: "LIMS Integration",
      icon: BeakerIcon,
      adminOnly: true,
      category: t("admin"),
    },
    ...(isAdmin
      ? [
          {
            id: "firebaseSetup",
            label: t("firebaseSetup"),
            icon: SparklesIcon,
            adminOnly: true,
            category: t("admin"),
          },
        ]
      : []),
    {
      id: "about",
      label: t("about"),
      icon: InformationCircleIcon,
      adminOnly: false,
      category: t("system"),
    },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const filteredNavItems = searchQuery
    ? navItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : navItems;

  const groupedItems = filteredNavItems.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof navItems>,
  );

  const renderSection = () => {
    switch (section) {
      case "visual":
        return isAdmin ? <VisualSettingsPage /> : <ProfileSettingsPage />;
      case "profile":
        return <ProfileSettingsPage />;
      case "security":
        return isAdmin ? <SecuritySettingsPage /> : <ProfileSettingsPage />;
      case "notifications":
        return <NotificationSettingsPage />;
      case "accessibility":
        return <AccessibilitySettingsPage />;
      case "settingsPresets":
        return isAdmin ? <SettingsPresetsPanel /> : <ProfileSettingsPage />;
      case "versionHistory":
        return isAdmin ? <SettingsVersionHistory /> : <ProfileSettingsPage />;
      case "usageTracking":
        return isAdmin ? <UsageMonitorSettingsPage /> : <ProfileSettingsPage />;
      case "firebaseUsage":
        return isAdmin ? <UsageMonitorPage /> : <ProfileSettingsPage />;
      case "users":
        return isAdmin ? (
          <UsersPage setNavigation={setNavigation} />
        ) : (
          <ProfileSettingsPage />
        );
      case "accreditationHub":
        return <AccreditationHubPage setNavigation={setNavigation} />;
      case "competencies":
        return <CompetencyLibraryPage />;
      case "data":
        return <DataSettingsPage />;
      case "auditLog":
        return isAdmin ? <SettingsAuditLogViewer /> : <ProfileSettingsPage />;
      case "bulkUserImport":
        return isAdmin ? <BulkUserImport /> : <ProfileSettingsPage />;
      case "departments":
        return isAdmin ? (
          <DepartmentsPage setNavigation={setNavigation} />
        ) : (
          <ProfileSettingsPage />
        );
      case "limsIntegration":
        return isAdmin ? (
          <LIMSIntegrationSettingsPage />
        ) : (
          <ProfileSettingsPage />
        );
      case "firebaseSetup":
        return isAdmin ? <FirebaseSetupPage /> : <ProfileSettingsPage />;
      case "about":
        return <AboutSettingsPage />;
      default:
        return isAdmin ? <VisualSettingsPage /> : <ProfileSettingsPage />;
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
            placeholder={t("searchSettings")}
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
                  aria-current={section === item.id ? "page" : undefined}
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
        aria-label={t("toggleSettingsMenu")}
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
        <div className="h-screen lg:h-auto lg:max-h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden sticky top-4">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full lg:flex-1">
        <div className="animate-fadeIn">
          <Suspense
            fallback={
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            }
          >
            {renderSection()}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export { SettingsLayout };
export default SettingsLayout;
