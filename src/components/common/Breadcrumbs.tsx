/**
 * Breadcrumbs Component
 * Provides navigational context for deep hierarchies
 * Auto-adjusts direction for RTL languages
 */

import React from "react";
import { NavigationState } from "@/types";
import {
  HomeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "@/hooks/useTranslation";

export interface BreadcrumbItem {
  label: string;
  nav: NavigationState;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  setNavigation: (state: NavigationState) => void;
  className?: string;
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  setNavigation,
  className = "",
  showHome = true,
}) => {
  const { t, dir } = useTranslation();

  // Use appropriate chevron based on text direction
  const Separator = dir === "rtl" ? ChevronLeftIcon : ChevronRightIcon;

  if (items.length === 0 && !showHome) return null;

  return (
    <nav
      className={`flex items-center gap-2 text-sm mb-4 ${className}`}
      aria-label="Breadcrumb"
    >
      {showHome && (
        <>
          <button
            onClick={() => setNavigation({ view: "dashboard" })}
            className="flex items-center gap-1 text-brand-text-secondary hover:text-brand-primary 
              dark:text-dark-brand-text-secondary dark:hover:text-brand-primary
              transition-colors"
            aria-label={t("home")}
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t("home")}</span>
          </button>
          {items.length > 0 && (
            <Separator
              className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0"
              aria-hidden="true"
            />
          )}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const ItemIcon = item.icon;

        return (
          <React.Fragment key={index}>
            <button
              onClick={() => !isLast && setNavigation(item.nav)}
              disabled={isLast}
              className={`flex items-center gap-1.5 transition-colors ${
                isLast
                  ? "font-semibold text-brand-text-primary dark:text-dark-brand-text-primary cursor-default"
                  : "text-brand-text-secondary hover:text-brand-primary dark:text-dark-brand-text-secondary dark:hover:text-brand-primary"
              }`}
              aria-current={isLast ? "page" : undefined}
            >
              {ItemIcon && <ItemIcon className="w-4 h-4 flex-shrink-0" />}
              <span className="truncate max-w-[150px] sm:max-w-xs">
                {item.label}
              </span>
            </button>

            {!isLast && (
              <Separator
                className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
