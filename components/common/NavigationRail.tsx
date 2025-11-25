import React from 'react';
import { NavigationState, UserRole } from '@/types';
import { ChartPieIcon, FolderIcon, LogoIcon, BuildingOffice2Icon, Cog6ToothIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, ChartBarSquareIcon, CalendarDaysIcon, ExclamationTriangleIcon, UsersIcon, ShieldCheckIcon, DocumentTextIcon, LightBulbIcon, CircleStackIcon, ClipboardDocumentSearchIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';

interface NavigationRailProps {
  setNavigation: (state: NavigationState) => void;
  navigation: NavigationState;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

interface NavItemData {
  nav: NavigationState;
  key: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

const NavItem: React.FC<{
  item: NavItemData;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}> = ({ item, isActive, isExpanded, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center h-12 px-4 rounded-lg transition-colors duration-200 group ${
        isActive
          ? 'bg-brand-primary text-white'
          : 'text-slate-500 dark:text-slate-400 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 hover:text-brand-primary'
      }`}
    >
      <item.icon className="h-6 w-6 flex-shrink-0" />
      <span className={`transition-opacity duration-200 font-semibold whitespace-nowrap ${isExpanded ? 'opacity-100 ltr:ml-4 rtl:mr-4' : 'opacity-0'}`}>
        {item.label}
      </span>
    </button>
  </li>
);

const NavigationRail: React.FC<NavigationRailProps> = ({ setNavigation, navigation, isExpanded, setIsExpanded }) => {
  const { t } = useTranslation();
  const currentUser = useUserStore(state => state.currentUser);
  const appSettings = useAppStore(state => state.appSettings);
  const currentView = navigation.view;
  const isProjectsActive = navigation.view === 'projects' || navigation.view === 'projectDetail' || navigation.view === 'createProject';

  const allNavItems: NavItemData[] = [
    { nav: { view: 'dashboard' }, key: 'dashboard', label: t('dashboard'), icon: ChartPieIcon },
    { nav: { view: 'analytics' }, key: 'analytics', label: t('analytics'), icon: ChartBarSquareIcon },
    { nav: { view: 'qualityInsights' }, key: 'qualityInsights', label: t('qualityInsights'), icon: LightBulbIcon },
    { nav: { view: 'calendar' }, key: 'calendar', label: t('calendar'), icon: CalendarDaysIcon },
    { nav: { view: 'projects' }, key: 'projects', label: t('projects'), icon: FolderIcon },
    { nav: { view: 'documentControl' }, key: 'documentControl', label: t('documentControl'), icon: DocumentTextIcon },
    { nav: { view: 'myTasks' }, key: 'myTasks', label: t('myTasks'), icon: ClipboardDocumentCheckIcon },
    { nav: { view: 'risk' }, key: 'risk', label: t('riskHub'), icon: ExclamationTriangleIcon },
    { nav: { view: 'auditHub' }, key: 'auditHub', label: t('auditHub'), icon: ClipboardDocumentSearchIcon, adminOnly: true },
    { nav: { view: 'dataHub' }, key: 'dataHub', label: t('dataHub'), icon: CircleStackIcon, adminOnly: true },
    { nav: { view: 'departments' }, key: 'departments', label: t('departments'), icon: BuildingOffice2Icon, adminOnly: true },
    { nav: { view: 'trainingHub' }, key: 'trainingHub', label: t('trainingHub'), icon: AcademicCapIcon },
  ];

  const bottomNavItems: NavItemData[] = [
    { nav: { view: 'settings' }, key: 'settings', label: t('settings'), icon: Cog6ToothIcon, adminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter(item => !item.adminOnly || currentUser?.role === UserRole.Admin);
  const visibleBottomNavItems = bottomNavItems.filter(item => !item.adminOnly || currentUser?.role === UserRole.Admin);

  const isActive = (key: string) => {
    if (key === 'projects') return isProjectsActive;
    if (navigation.view === 'settings') return key === 'settings';
    return currentView === key;
  };

  return (
    <aside 
        className={`fixed top-0 ltr:left-0 rtl:right-0 h-full bg-brand-surface dark:bg-dark-brand-surface border-r border-brand-border dark:border-dark-brand-border flex flex-col py-4 transition-all duration-300 z-20 ${isExpanded ? 'w-64' : 'w-20'}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`flex items-center justify-center h-16 mb-4 flex-shrink-0 ${isExpanded ? 'px-4' : ''}`}>
        {appSettings?.logoUrl ? (
          <img src={appSettings.logoUrl} alt="App Logo" className="h-8 w-8 flex-shrink-0" />
        ) : (
          <LogoIcon className="h-8 w-8 flex-shrink-0" />
        )}
        <h1 className={`text-2xl font-bold transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100 ltr:ml-3 rtl:mr-3' : 'opacity-0'}`}>
          <span className="text-brand-text-primary dark:text-dark-brand-text-primary">Accredit</span>
          <span className="text-brand-primary">Ex</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 overflow-y-auto min-h-0">
        <ul className="space-y-2">
            {visibleNavItems.map((item) => (
            <NavItem
                key={item.key}
                item={item}
                isActive={isActive(item.key)}
                isExpanded={isExpanded}
                onClick={() => setNavigation(item.nav)}
            />
            ))}
        </ul>
      </nav>
      <div className="px-3">
          <ul className="space-y-2">
            {visibleBottomNavItems.map((item) => (
                <NavItem
                    key={item.key}
                    item={item}
                    isActive={isActive(item.key)}
                    isExpanded={isExpanded}
                    onClick={() => setNavigation(item.nav)}
                />
            ))}
        </ul>
      </div>
    </aside>
  );
};

export default NavigationRail;