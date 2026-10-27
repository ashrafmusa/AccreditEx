import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { WizardFormData } from "./ProgramSelectorWizard";

interface WizardStep2ProgramSelectionProps {
  formData: WizardFormData;
  onUpdateForm: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WizardStep2ProgramSelection: React.FC<
  WizardStep2ProgramSelectionProps
> = ({ formData, onUpdateForm, onNext, onBack }) => {
  const { t } = useTranslation();

  const programs = [
    {
      id: "cbahi" as const,
      label: t("cbahiLabel") || "CBAHI (Saudi Central Board)",
      description:
        t("cbahiDescription") ||
        "Hospital, Primary Healthcare (PHC), Clinical Lab & Ambulatory Standards",
      icon: "🏥",
    },
    {
      id: "jci" as const,
      label: t("jciLabel") || "JCI (Joint Commission International)",
      description:
        t("jciDescription") ||
        "International Patient Safety Goals (IPSG), Hospital & Ambulatory Care",
      icon: "🌍",
    },
    {
      id: "cap_iso15189" as const,
      label: "CAP / ISO 15189 (Clinical Laboratories)",
      description:
        "College of American Pathologists & ISO 15189 Medical Laboratory Quality",
      icon: "🔬",
    },
    {
      id: "dnv_iso9001" as const,
      label: "DNV NIAHO / ISO 9001",
      description:
        "Integrated Hospital Quality Management System & Risk-Based Accreditation",
      icon: "🛡️",
    },
    {
      id: "doh_dha" as const,
      label: "DOH / DHA / MOH (GCC Regional)",
      description:
        "Jawda Quality Indicators, TASNEEF & Regional Clinical Governance",
      icon: "🏛️",
    },
    {
      id: "ashk" as const,
      label: t("ashkLabel") || "ASHK",
      description: t("ashkDescription") || "Healthcare Accreditation Standards",
      icon: "⚕️",
    },
    {
      id: "other" as const,
      label: t("otherProgramLabel") || "Multi-Program / Custom Framework",
      description:
        t("otherProgramDescription") ||
        "Combine or customize standards for specialized centers",
      icon: "📋",
    },
  ];

  return (
    <div className="bg-white dark:bg-dark-brand-background rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
        {t("step2Title")}
      </h2>
      <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mb-8">
        {t("step2Subtitle")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {programs.map((program) => (
          <button
            key={program.id}
            onClick={() => onUpdateForm({ program: program.id })}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              formData.program === program.id
                ? "border-brand-primary bg-brand-primary/5 dark:border-dark-brand-primary dark:bg-dark-brand-primary/5"
                : "border-brand-background dark:border-dark-brand-background hover:border-brand-primary/50 dark:hover:border-dark-brand-primary/50"
            }`}
          >
            <div className="text-3xl mb-2">{program.icon}</div>
            <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
              {program.label}
            </h3>
            <p className="text-sm text-brand-text-tertiary dark:text-dark-brand-text-tertiary">
              {program.description}
            </p>
          </button>
        ))}
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
          disabled={!formData.program}
        >
          {t("wizardNext")}
        </button>
      </div>
    </div>
  );
};

export default WizardStep2ProgramSelection;
