import React from "react";
import { MoonIcon, SunIcon, MagnifyingGlassIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageContext } from "@/components/common/LanguageProvider";
import { useTheme } from "@/components/common/ThemeProvider";

interface HeaderActionsProps {
  onOpenCommandPalette: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  onOpenCommandPalette,
}) => {
  const { t } = useTranslation();
  const { lang, toggleLang } = React.useContext(LanguageContext);
  const { theme, toggleTheme } = useTheme();

  // Command Palette Shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenCommandPalette]);

  return (
    <>
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
        <span className="hidden md:inline">{t("searchAnything")}</span>
        <kbd className="hidden md:inline font-sans text-xs text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-md px-1.5 py-0.5">
          Ctrl K
        </kbd>
      </button>

      <button
        onClick={toggleLang}
        className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline hidden sm:block"
      >
        {lang === "en" ? "العربية" : "English"}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleTheme();
        }}
        className="text-brand-text-secondary dark:text-dark-brand-text-secondary hover:text-brand-primary-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label={t("toggleTheme")}
      >
        {theme === "light" ? (
          <MoonIcon className="h-5 w-5" />
        ) : (
          <SunIcon className="h-5 w-5" />
        )}
      </button>
    </>
  );
};

export default HeaderActions;
