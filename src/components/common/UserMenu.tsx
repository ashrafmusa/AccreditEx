import React, { useState, useEffect, useRef } from "react";
import { NavigationState } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import UserAvatar from "./UserAvatar";

interface UserMenuProps {
  onLogout: () => void;
  setNavigation: (state: NavigationState) => void;
  navigation: NavigationState;
}

const UserMenu: React.FC<UserMenuProps> = ({
  onLogout,
  setNavigation,
  navigation,
}) => {
  const { t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);
  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
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

  // Keyboard navigation within dropdown
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = menuItemsRef.current.filter(Boolean);
    const currentIndex = items.indexOf(
      document.activeElement as HTMLButtonElement,
    );

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        setIsUserMenuOpen(false);
        document.getElementById("user-menu-button")?.focus();
        break;
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  };

  // Focus first item when menu opens
  useEffect(() => {
    if (isUserMenuOpen) {
      requestAnimationFrame(() => {
        menuItemsRef.current[0]?.focus();
      });
    }
  }, [isUserMenuOpen]);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        className="flex items-center space-x-2 rtl:space-x-reverse p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-haspopup="true"
        aria-expanded={isUserMenuOpen}
        aria-controls="user-menu"
        aria-label={t("userMenu")}
        id="user-menu-button"
      >
        <UserAvatar
          user={currentUser}
          size="md"
          ariaLabel={`${currentUser.name} profile avatar`}
        />
        <div className="text-left ltr:text-left rtl:text-right hidden sm:block">
          <p className="font-semibold text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
            {currentUser.name}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {currentUser.role}
          </p>
        </div>
      </button>
      {isUserMenuOpen && (
        <div
          id="user-menu"
          role="menu"
          aria-labelledby="user-menu-button"
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full ltr:right-0 rtl:left-0 mt-2 w-56 bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-lg border border-brand-border dark:border-dark-brand-border z-50 animate-[fadeInUp_0.2s_ease-out] overflow-hidden"
        >
          <div className="p-3 border-b border-brand-border dark:border-dark-brand-border bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {currentUser.name}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {currentUser.email}
            </p>
          </div>
          <div className="p-1" role="none">
            <button
              ref={(el) => {
                if (el) menuItemsRef.current[0] = el;
              }}
              onClick={() => {
                setNavigation({ view: "userProfile", userId: currentUser.id });
              }}
              role="menuitem"
              tabIndex={-1}
              className="w-full text-left rtl:text-right px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-brand-text-primary dark:text-dark-brand-text-primary"
            >
              {t("profile")}
            </button>
            <button
              ref={(el) => {
                if (el) menuItemsRef.current[1] = el;
              }}
              onClick={onLogout}
              role="menuitem"
              tabIndex={-1}
              className="w-full text-left rtl:text-right px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
