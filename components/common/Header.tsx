import React from 'react';
import { NavigationState, Notification } from '../../types';
import { Bars3Icon } from '../icons';
import HeaderTitle from './HeaderTitle';
import HeaderActions from './HeaderActions';
import NotificationButton from './NotificationButton';
import UserMenu from './UserMenu';

interface HeaderProps {
  navigation: NavigationState;
  notifications: Notification[];
  onToggleMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  setNavigation: (state: NavigationState) => void;
  onMarkAsRead: (notificationId: string | 'all') => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ navigation, notifications, onToggleMobileMenu, onOpenCommandPalette, setNavigation, onMarkAsRead, onLogout }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 bg-brand-surface dark:bg-dark-brand-surface border-b border-brand-border dark:border-dark-brand-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onToggleMobileMenu} className="sm:hidden p-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
            <HeaderTitle navigation={navigation} />
            {!isOnline && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300 animate-pulse">
                Offline
              </span>
            )}
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
        <HeaderActions onOpenCommandPalette={onOpenCommandPalette} />
        <NotificationButton 
            notifications={notifications}
            setNavigation={setNavigation}
            onMarkAsRead={onMarkAsRead}
            navigation={navigation}
        />
        <UserMenu 
            onLogout={onLogout}
            setNavigation={setNavigation}
        />
      </div>
    </header>
  );
};

export default Header;