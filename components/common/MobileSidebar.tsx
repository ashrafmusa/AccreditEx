import React from 'react';
import { XMarkIcon } from '../icons';
import { NavigationState, UserRole } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useUserStore } from '../../stores/useUserStore';
import { 
    ChartPieIcon, FolderIcon, DocumentTextIcon, ClipboardDocumentCheckIcon, 
    ExclamationTriangleIcon, ClipboardDocumentSearchIcon, CircleStackIcon, BuildingOffice2Icon, 
    AcademicCapIcon, Cog6ToothIcon, ChartBarSquareIcon, CalendarDaysIcon, LightBulbIcon
} from '../icons';
import { LogoIcon } from '../icons';
import { useAppStore } from '../../stores/useAppStore';


interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  navigation: NavigationState;
  setNavigation: (state: NavigationState) => void;
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
    onClick: () => void;
}> = ({ item, isActive, onClick }) => (
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
        <span className="ltr:ml-4 rtl:mr-4 font-semibold whitespace-nowrap">
          {item.label}
        </span>
      </button>
    </li>
);

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, setIsOpen, navigation, setNavigation }) => {
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

    const handleNav = (nav: NavigationState) => {
        setNavigation(nav);
        setIsOpen(false);
    }
    
    return (
        <>
          <div
            className={`fixed inset-0 bg-black/60 z-30 transition-opacity lg:hidden ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`fixed top-0 bottom-0 z-40 w-64 bg-brand-surface dark:bg-dark-brand-surface transition-transform duration-300 ease-in-out lg:hidden ${
              isOpen ? 'ltr:translate-x-0 rtl:-translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-brand-border dark:border-dark-brand-border">
                <div className="flex items-center gap-2">
                    {appSettings?.logoUrl ? (
                        <img src={appSettings.logoUrl} alt="App Logo" className="h-8 w-8" />
                    ) : (
                        <LogoIcon className="h-8 w-8" />
                    )}
                    <h1 className="text-xl font-bold">
                        <span className="text-brand-text-primary dark:text-dark-brand-text-primary">Accredit</span><span className="text-brand-primary">Ex</span>
                    </h1>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <ul className="space-y-2">
                    {visibleNavItems.map((item) => (
                    <NavItem
                        key={item.key}
                        item={item}
                        isActive={isActive(item.key)}
                        onClick={() => handleNav(item.nav)}
                    />
                    ))}
                </ul>
            </nav>
            <div className="px-3 py-4 border-t border-brand-border dark:border-dark-brand-border">
                <ul className="space-y-2">
                    {visibleBottomNavItems.map((item) => (
                        <NavItem
                            key={item.key}
                            item={item}
                            isActive={isActive(item.key)}
                            onClick={() => handleNav(item.nav)}
                        />
                    ))}
                </ul>
            </div>
          </div>
        </>
    );
};

export default MobileSidebar;
