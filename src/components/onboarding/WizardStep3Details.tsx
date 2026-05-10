import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { WizardFormData } from "./ProgramSelectorWizard";

interface WizardStep3DetailsProps {
  formData: WizardFormData;
  onUpdateForm: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WizardStep3Details: React.FC<WizardStep3DetailsProps> = ({
  formData,
  onUpdateForm,
  onNext,
  onBack,
}) => {
  const { t } = useTranslation();

  const organizationTypes = [
    { id: "hospital", label: t("hospitalType") },
    { id: "clinic", label: t("clinicType") },
    { id: "lab", label: t("labType") },
    { id: "pharmacy", label: t("pharmacyType") },
    { id: "other", label: t("otherType") },
  ];

  const countries = [
    { id: "sa", label: "Saudi Arabia" },
    { id: "ae", label: "United Arab Emirates" },
    { id: "eg", label: "Egypt" },
    { id: "jo", label: "Jordan" },
    { id: "kw", label: "Kuwait" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="bg-white dark:bg-dark-brand-background rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
        {t("step3Title")}
      </h2>
      <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mb-8">
        {t("step3Subtitle")}
      </p>

      <div className="space-y-6 mb-8">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("organizationName")}
          </label>
          <input
            type="text"
            value={formData.organizationName}
            onChange={(e) => onUpdateForm({ organizationName: e.target.value })}
            placeholder={t("organizationNamePlaceholder")}
            className="w-full px-4 py-2 border border-brand-background dark:border-dark-brand-background rounded-lg bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary placeholder-brand-text-tertiary dark:placeholder-dark-brand-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-brand-primary"
          />
        </div>

        {/* Organization Type */}
        <div>
          <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("organizationType")}
          </label>
          <select
            value={formData.organizationType}
            onChange={(e) =>
              onUpdateForm({ organizationType: e.target.value as any })
            }
            className="w-full px-4 py-2 border border-brand-background dark:border-dark-brand-background rounded-lg bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-brand-primary"
          >
            <option value="">Select Type</option>
            {organizationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("countryLabel")}
          </label>
          <select
            value={formData.country}
            onChange={(e) => onUpdateForm({ country: e.target.value })}
            className="w-full px-4 py-2 border border-brand-background dark:border-dark-brand-background rounded-lg bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-brand-primary"
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("cityLabel")}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => onUpdateForm({ city: e.target.value })}
            placeholder="City name"
            className="w-full px-4 py-2 border border-brand-background dark:border-dark-brand-background rounded-lg bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary placeholder-brand-text-tertiary dark:placeholder-dark-brand-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-brand-primary"
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("regionLabel")}
          </label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => onUpdateForm({ region: e.target.value })}
            placeholder="Region/Emirate"
            className="w-full px-4 py-2 border border-brand-background dark:border-dark-brand-background rounded-lg bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary placeholder-brand-text-tertiary dark:placeholder-dark-brand-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-brand-primary"
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-brand-primary dark:border-dark-brand-primary text-brand-primary dark:text-dark-brand-primary hover:bg-brand-primary/5 dark:hover:bg-dark-brand-primary/5 font-semibold rounded-lg transition-colors"
        >
          {t("wizardBack")}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 dark:bg-dark-brand-primary dark:hover:bg-dark-brand-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!formData.organizationName || !formData.organizationType}
        >
          {t("wizardNext")}
        </button>
      </div>
    </div>
  );
};

export default WizardStep3Details;
