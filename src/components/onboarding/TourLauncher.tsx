/**
 * Tour Launcher Button
 *
 * Compact button to access tour menu and start tours
 * - Shows badge with tour count
 * - Dropdown menu with available tours
 * - Quick replay of previously completed tours
 */

import { useTourManager } from "@/hooks/useTourManager";
import React, { useState } from "react";
import { TourMenu } from "./TourMenu";

interface TourLauncherProps {
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Show as icon or text button */
  variant?: "icon" | "text";
  /** Optional custom label */
  label?: string;
}

export const TourLauncher: React.FC<TourLauncherProps> = ({
  size = "md",
  variant = "icon",
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tourManager = useTourManager();
  const uncompletedCount = tourManager.getUncompletedTours().length;

  const sizeClasses = {
    sm: "p-1.5 text-sm",
    md: "p-2 text-base",
    lg: "p-3 text-lg",
  };

  const handleTourStart = (tourId: string) => {
    setIsOpen(false);
  };

  if (variant === "text") {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${sizeClasses[size]} flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 dark:bg-dark-brand-primary dark:hover:bg-dark-brand-primary/90 text-white font-semibold rounded-lg transition-colors relative`}
        >
          {/* Tour icon */}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          {label || "Tours"}
          {uncompletedCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold bg-red-500 rounded-full text-white">
              {uncompletedCount}
            </span>
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-dark-brand-surface rounded-xl shadow-xl border border-brand-background dark:border-dark-brand-background z-50 p-4 animate-[fadeInUp_0.2s_ease-out]">
            <TourMenu onTourStart={handleTourStart} />
          </div>
        )}
      </div>
    );
  }

  // Icon variant (for navbar)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} text-brand-text-secondary hover:text-brand-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-primary transition-colors relative`}
        title="Tours"
        aria-label="Tour menu"
      >
        {/* Tour icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        {uncompletedCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 rounded-full text-white">
            {uncompletedCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-dark-brand-surface rounded-xl shadow-xl border border-brand-background dark:border-dark-brand-background z-50 p-4 animate-[fadeInUp_0.2s_ease-out]">
          <TourMenu onTourStart={handleTourStart} />
        </div>
      )}
    </div>
  );
};

export default TourLauncher;
