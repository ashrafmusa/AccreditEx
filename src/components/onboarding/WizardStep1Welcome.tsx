import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { WizardFormData } from "./ProgramSelectorWizard";

interface WizardStep1WelcomeProps {
  onNext: () => void;
  formData: WizardFormData;
}

const WizardStep1Welcome: React.FC<WizardStep1WelcomeProps> = ({ onNext }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-dark-brand-background rounded-xl shadow-lg p-8 text-center">
      <div className="mb-8">
        <div className="inline-block p-4 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-lg mb-4">
          <svg
            className="w-12 h-12 text-brand-primary dark:text-dark-brand-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
        {t("step1Welcome")}
      </h1>
      <p className="text-lg text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
        {t("step1Subtitle")}
      </p>
      <p className="text-base text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-8 max-w-md mx-auto">
        {t("step1Description")}
      </p>

      <button
        onClick={onNext}
        className="inline-block px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 dark:bg-dark-brand-primary dark:hover:bg-dark-brand-primary/90 text-white font-semibold rounded-lg transition-colors"
      >
        {t("step1CTA")}
      </button>
    </div>
  );
};

export default WizardStep1Welcome;
