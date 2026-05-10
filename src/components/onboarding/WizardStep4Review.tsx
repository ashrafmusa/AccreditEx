import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { WizardFormData } from "./ProgramSelectorWizard";

interface WizardStep4ReviewProps {
  formData: WizardFormData;
  onConfirm: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
  isLoading: boolean;
}

const WizardStep4Review: React.FC<WizardStep4ReviewProps> = ({
  formData,
  onConfirm,
  onBack,
  onEdit,
  isLoading,
}) => {
  const { t } = useTranslation();

  const programLabels: Record<string, string> = {
    cbahi: t("cbahiLabel"),
    ashk: t("ashkLabel"),
    jci: t("jciLabel"),
    other: t("otherProgramLabel"),
  };

  const organizationTypeLabels: Record<string, string> = {
    hospital: t("hospitalType"),
    clinic: t("clinicType"),
    lab: t("labType"),
    pharmacy: t("pharmacyType"),
    other: t("otherType"),
  };

  return (
    <div className="bg-white dark:bg-dark-brand-background rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
        {t("step4Title")}
      </h2>
      <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mb-8">
        {t("step4Subtitle")}
      </p>

      <div className="space-y-6 mb-8">
        {/* Program Selection Review */}
        <div className="p-4 bg-brand-primary/5 dark:bg-dark-brand-primary/5 rounded-lg border border-brand-primary/20 dark:border-dark-brand-primary/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-sm font-semibold text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-1 uppercase">
                {t("programLabel")}
              </h3>
              <p className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {programLabels[formData.program] || "Not Selected"}
              </p>
            </div>
            <button
              onClick={() => onEdit(2)}
              className="text-sm text-brand-primary dark:text-dark-brand-primary hover:underline font-semibold"
            >
              {t("editStep2")}
            </button>
          </div>
        </div>

        {/* Organization Details Review */}
        <div className="p-4 bg-brand-background dark:bg-dark-brand-background rounded-lg border border-brand-background dark:border-dark-brand-background">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-brand-text-tertiary dark:text-dark-brand-text-tertiary uppercase">
              {t("detailsLabel")}
            </h3>
            <button
              onClick={() => onEdit(3)}
              className="text-sm text-brand-primary dark:text-dark-brand-primary hover:underline font-semibold"
            >
              {t("editStep3")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-1 uppercase">
                {t("organizationName")}
              </p>
              <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {formData.organizationName}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-1 uppercase">
                {t("organizationType")}
              </p>
              <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {organizationTypeLabels[formData.organizationType] ||
                  "Not Selected"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-1 uppercase">
                {t("countryLabel")}
              </p>
              <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {formData.country || "Not Selected"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-1 uppercase">
                {t("cityLabel")}
              </p>
              <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {formData.city || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-tertiary dark:text-dark-brand-text-tertiary mb-1 uppercase">
                {t("regionLabel")}
              </p>
              <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {formData.region || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-brand-primary dark:border-dark-brand-primary text-brand-primary dark:text-dark-brand-primary hover:bg-brand-primary/5 dark:hover:bg-dark-brand-primary/5 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {t("wizardBack")}
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 dark:bg-dark-brand-primary dark:hover:bg-dark-brand-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading && (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {t("wizardConfirm")}
        </button>
      </div>
    </div>
  );
};

export default WizardStep4Review;
