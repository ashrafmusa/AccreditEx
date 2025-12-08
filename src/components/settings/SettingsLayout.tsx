import React from 'react';
import { NavigationState, SettingsSection } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserStore } from '@/stores/useUserStore';
import GeneralSettingsPage from './GeneralSettingsPage';
import ProfileSettingsPage from './ProfileSettingsPage';
import SecuritySettingsPage from './SecuritySettingsPage';
import AccreditationHubPage from '@/pages/AccreditationHubPage';
import CompetencyLibraryPage from '../competencies/CompetencyLibraryPage';
import DataSettingsPage from './DataSettingsPage';
import AboutSettingsPage from './AboutSettingsPage';
import AppearanceSettingsPage from './AppearanceSettingsPage';
import NotificationSettingsPage from './NotificationSettingsPage';
import AccessibilitySettingsPage from './AccessibilitySettingsPage';
import GlobeSettingsPage from "./GlobeSettingsPage";
import UsageMonitorSettingsPage from "./UsageMonitorSettingsPage";
import UsersPage from '@/pages/UsersPage';
import FirebaseSetupPage from './firebase/FirebaseSetupPage';
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

  // Firebase Setup is admin-only
  const isAdmin = currentUser?.role === 'Admin';

  const allNavItems = [
    { id: "general", label: t("general"), icon: Cog6ToothIcon, adminOnly: false },
    { id: "appearance", label: "Appearance", icon: PaintBrushIcon, adminOnly: false },
    { id: "globe", label: "Globe", icon: GlobeAltIcon, adminOnly: false },
    { id: "profile", label: t("profile"), icon: UserCircleIcon, adminOnly: false },
    { id: "security", label: t("security"), icon: ShieldCheckIcon, adminOnly: false },
    { id: "notifications", label: "Notifications", icon: BellIcon, adminOnly: false },
    { id: "accessibility", label: "Accessibility", icon: EyeIcon, adminOnly: false },
    { id: "usageMonitor", label: "Usage Monitor", icon: ChartBarIcon, adminOnly: false },
    { id: "users", label: t("userManagement"), icon: UsersIcon, adminOnly: true },
    {
      id: "accreditationHub",
      label: t("accreditationHub"),
      icon: GlobeAltIcon,
      adminOnly: true,
    },
    { id: "competencies", label: t("competencies"), icon: IdentificationIcon, adminOnly: true },
    { id: "data", label: t("data"), icon: CircleStackIcon, adminOnly: true },
    ...(isAdmin ? [{ id: "firebaseSetup", label: t("firebaseSetup"), icon: SparklesIcon, adminOnly: true }] : []),
    { id: "about", label: t("about"), icon: InformationCircleIcon, adminOnly: false },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  const renderSection = () => {
    switch (section) {
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
        return <GeneralSettingsPage />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 items-start">
      <aside className="w-full lg:w-1/5 flex-shrink-0">
        <nav className="space-y-0.5 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-8rem)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setNavigation({
                  view: "settings",
                  section: item.id as SettingsSection,
                })
              }
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                section === item.id
                  ? "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20"
                  : "text-brand-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="w-full lg:w-4/5 overflow-y-auto max-h-[calc(100vh-8rem)]">{renderSection()}</main>
    </div>
  );
};

export { SettingsLayout };
export default SettingsLayout;
