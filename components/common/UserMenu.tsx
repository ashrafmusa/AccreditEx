import React, { useState, useEffect, useRef } from 'react';
import { NavigationState } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserStore } from '@/stores/useUserStore';

interface UserMenuProps {
  onLogout: () => void;
  setNavigation: (state: NavigationState) => void;
  navigation: NavigationState;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLogout, setNavigation, navigation }) => {
  const { t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentUser = useUserStore(state => state.currentUser);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on navigation change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [navigation]);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={userMenuRef}>
      <button 
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
        className="flex items-center space-x-2 rtl:space-x-reverse p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-haspopup="true"
        aria-expanded={isUserMenuOpen}
        aria-controls="user-menu"
        id="user-menu-button"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-primary-700 text-white flex items-center justify-center font-bold text-sm">
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left ltr:text-left rtl:text-right hidden sm:block">
          <p className="font-semibold text-sm text-brand-text-primary dark:text-dark-brand-text-primary">{currentUser.name}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{currentUser.role}</p>
        </div>
      </button>
      {isUserMenuOpen && (
         <div 
            id="user-menu"
            role="menu"
            aria-labelledby="user-menu-button"
            className="absolute top-full right-0 mt-2 w-56 bg-brand-surface dark:bg-dark-brand-surface rounded-md shadow-lg border border-brand-border dark:border-dark-brand-border z-50 animate-[fadeInUp_0.2s_ease-out]"
        >
            <div className="p-2 border-b dark:border-dark-brand-border">
                <p className="text-sm font-semibold">{currentUser.name}</p>
                <p className="text-xs text-brand-text-secondary">{currentUser.email}</p>
            </div>
            <div className="p-2" role="none">
                <button onClick={() => { setNavigation({ view: 'settings', section: 'profile' }); }} role="menuitem" className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">{t('profile')}</button>
                <button onClick={onLogout} role="menuitem" className="w-full text-left px-2 py-1.5 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">{t('logout')}</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;