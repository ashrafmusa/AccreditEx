import React from 'react';
import { NavigationState, SettingsSection } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import GeneralSettingsPage from './GeneralSettingsPage';
import ProfileSettingsPage from './ProfileSettingsPage';
import SecuritySettingsPage from './SecuritySettingsPage';
import UsersPage from '@/pages/UsersPage';
import AccreditationHubPage from '@/pages/AccreditationHubPage';
import CompetencyLibraryPage from '../competencies/CompetencyLibraryPage';
import DataSettingsPage from './DataSettingsPage';
import AboutSettingsPage from './AboutSettingsPage';
import AppearanceSettingsPage from './AppearanceSettingsPage';
import NotificationSettingsPage from './NotificationSettingsPage';
import AccessibilitySettingsPage from './AccessibilitySettingsPage';
import { 
    Cog6ToothIcon, UserCircleIcon, ShieldCheckIcon, UsersIcon, GlobeAltIcon, 
    CircleStackIcon, InformationCircleIcon, IdentificationIcon, BellIcon,
    EyeIcon, PaintBrushIcon
} from '@/components/icons';

interface SettingsLayoutProps {
  section: SettingsSection | undefined;
  setNavigation: (state: NavigationState) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ section = 'general', setNavigation }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'general', label: t('general'), icon: Cog6ToothIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'profile', label: t('profile'), icon: UserCircleIcon },
    { id: 'security', label: t('security'), icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'accessibility', label: 'Accessibility', icon: EyeIcon },
    { id: 'users', label: t('userManagement'), icon: UsersIcon },
    { id: 'accreditationHub', label: t('accreditationHub'), icon: GlobeAltIcon },
    { id: 'competencies', label: t('competencies'), icon: IdentificationIcon },
    { id: 'data', label: t('data'), icon: CircleStackIcon },
    { id: 'about', label: t('about'), icon: InformationCircleIcon },
  ];
  
  const renderSection = () => {
    switch (section) {
      case 'general': return <GeneralSettingsPage />;
      case 'appearance': return <AppearanceSettingsPage />;
      case 'profile': return <ProfileSettingsPage />;
      case 'security': return <SecuritySettingsPage />;
      case 'notifications': return <NotificationSettingsPage />;
      case 'accessibility': return <AccessibilitySettingsPage />;
      case 'users': return <UsersPage setNavigation={setNavigation} />;
      case 'accreditationHub': return <AccreditationHubPage setNavigation={setNavigation} />;
      case 'competencies': return <CompetencyLibraryPage />;
      case 'data': return <DataSettingsPage />;
      case 'about': return <AboutSettingsPage />;
      default: return <GeneralSettingsPage />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
        <nav className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setNavigation({ view: 'settings', section: item.id as SettingsSection })}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                section === item.id
                  ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
                  : 'text-brand-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="w-full md:w-3/4 lg:w-4/5">
        {renderSection()}
      </main>
    </div>
  );
};

export default SettingsLayout;
