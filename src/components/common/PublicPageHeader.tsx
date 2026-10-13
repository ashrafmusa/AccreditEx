import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "./LanguageProvider";
import { useTranslation } from "@/hooks/useTranslation";

const PublicPageHeader: React.FC<{ landing?: boolean }> = ({
  landing = false,
}) => {
  const { t, lang } = useTranslation();
  const { toggleLang } = useContext(LanguageContext);

  return (
    <header className="relative z-30 border-b border-brand-border bg-brand-surface dark:border-dark-brand-border dark:bg-dark-brand-surface">
      <a
        href="#public-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-brand-surface focus:p-3 focus:text-brand-primary"
      >
        {t("public_skip")}
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          to="/"
          aria-label={t("public_home")}
          className="flex items-center gap-2 text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary"
        >
          <img
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span>
            Accredit<span className="text-brand-primary">Ex</span>
          </span>
        </Link>
        <nav
          aria-label={t("public_navigation")}
          className="flex flex-wrap items-center gap-3 text-sm sm:gap-6"
        >
          {landing && (
            <div className="hidden items-center gap-6 lg:flex">
              <a href="#platform" className="hover:text-brand-primary">
                {t("public_platform")}
              </a>
              <a href="#workflow" className="hover:text-brand-primary">
                {t("public_workflow")}
              </a>
              <a href="#faq" className="hover:text-brand-primary">
                {t("public_faq")}
              </a>
            </div>
          )}
          <button
            type="button"
            onClick={toggleLang}
            lang={lang === "en" ? "ar" : "en"}
            aria-label={t("public_switchLanguage")}
            className="rounded-lg border border-brand-border px-3 py-2 hover:bg-brand-primary/10 dark:border-dark-brand-border"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          {landing && (
            <Link
              to="/login"
              className="font-semibold hover:text-brand-primary"
            >
              {t("landing_nav_login")}
            </Link>
          )}
          {landing && (
            <Link
              to="/register"
              className="hidden rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white hover:bg-brand-primary/90 sm:block"
            >
              {t("public_trial")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default PublicPageHeader;
