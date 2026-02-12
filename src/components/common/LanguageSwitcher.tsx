/**
 * Language Switcher Component
 * Allows users to switch between English and Arabic
 * Variants: compact (header), full (settings), mobile (sidebar)
 */

import React from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/hooks/useTranslation";
import { useContext } from "react";
import { LanguageContext } from "./LanguageProvider";

interface LanguageSwitcherProps {
  variant?: "compact" | "full" | "mobile";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "compact",
  className = "",
}) => {
  const { lang, t } = useTranslation();
  const { setLang } = useContext(LanguageContext);

  // Compact variant for Header
  if (variant === "compact") {
    return (
      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg 
          hover:bg-brand-surface/10 dark:hover:bg-white/5 
          transition-colors border border-brand-border/50 
          dark:border-dark-brand-border/50
          text-brand-text-secondary dark:text-dark-brand-text-secondary
          hover:text-brand-text-primary dark:hover:text-dark-brand-text-primary
          ${className}`}
        aria-label={lang === "en" ? t("switchToArabic") : t("switchToEnglish")}
        title={t("displayLanguage")}
      >
        <GlobeAltIcon className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {lang === "en" ? "عربي" : "English"}
        </span>
      </button>
    );
  }

  // Mobile variant for Sidebar
  if (variant === "mobile") {
    return (
      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
          text-gray-300 hover:bg-white/10 hover:text-white
          transition-colors ${className}`}
        aria-label={lang === "en" ? t("switchToArabic") : t("switchToEnglish")}
      >
        <GlobeAltIcon className="w-6 h-6" />
        <div className="flex-1 text-start">
          <div className="font-medium">
            {lang === "en" ? t("switchToArabic") : t("switchToEnglish")}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {t("displayLanguage")}
          </div>
        </div>
        <span className="text-sm px-2 py-1 rounded bg-white/10">
          {lang === "en" ? "عربي" : "EN"}
        </span>
      </button>
    );
  }

  // Full variant for Settings Page
  return (
    <div
      className={`flex items-center justify-between p-4 border border-brand-border dark:border-dark-brand-border rounded-lg ${className}`}
    >
      <div>
        <label className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("displayLanguage")}
        </label>
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
          {t("chooseLanguageDescription")}
        </p>
      </div>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as "en" | "ar")}
        className="px-4 py-2 rounded-lg border border-brand-border dark:border-dark-brand-border
          bg-brand-surface dark:bg-dark-brand-surface
          text-brand-text-primary dark:text-dark-brand-text-primary
          focus:ring-2 focus:ring-brand-primary focus:border-transparent
          transition-colors cursor-pointer"
        aria-label={t("selectLanguage")}
      >
        <option value="en">{t("englishLanguage")}</option>
        <option value="ar">{t("arabicLanguage")}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
