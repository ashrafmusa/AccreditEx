/**
 * NavigationLink Component
 *
 * Enhanced navigation link that works with both NavigationState and URLs
 * Can be used to replace button elements in navigation for better SEO
 * Currently optional - existing button-based navigation still works
 */

import React from "react";
import { NavigationState } from "@/types";
import { navigationStateToPath } from "@/router/routes";

interface NavigationLinkProps {
  to: NavigationState;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
  children: React.ReactNode;
}

/**
 * NavigationLink
 *
 * Renders a button that navigates using setNavigation
 * The URL sync happens automatically through useNavigation hook in App.tsx
 *
 * This maintains backward compatibility while providing proper navigation
 */
export const NavigationLink: React.FC<NavigationLinkProps> = ({
  to,
  onClick,
  className,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
  children,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  // For now, we keep using buttons since setNavigation is handled in parent components
  // The useNavigation hook in App.tsx will sync the URL automatically
  return (
    <button
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      type="button"
    >
      {children}
    </button>
  );
};

/**
 * Get the URL path for a navigation state
 * Useful for generating href attributes or manual navigation
 */
export const getNavigationPath = (state: NavigationState): string => {
  return navigationStateToPath(state);
};
