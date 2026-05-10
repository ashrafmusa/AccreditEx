import { useTranslation } from "@/hooks/useTranslation";
import { setProgramSelection } from "@/services/userService";
import { useUserStore } from "@/stores/useUserStore";
import React, { useState } from "react";
import WizardStep1Welcome from "./WizardStep1Welcome";
import WizardStep2ProgramSelection from "./WizardStep2ProgramSelection";
import WizardStep3Details from "./WizardStep3Details";
import WizardStep4Review from "./WizardStep4Review";

export interface WizardFormData {
  program: "cbahi" | "ashk" | "jci" | "other" | "";
  organizationName: string;
  organizationType: "hospital" | "clinic" | "lab" | "pharmacy" | "other" | "";
  country: string;
  city: string;
  region: string;
}

interface ProgramSelectorWizardProps {
  onComplete?: () => void;
}

const ProgramSelectorWizard: React.FC<ProgramSelectorWizardProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();
  const currentUser = useUserStore((state) => state.currentUser);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WizardFormData>({
    program: "",
    organizationName: "",
    organizationType: "",
    country: "",
    city: "",
    region: "",
  });
  const [error, setError] = useState<string>("");

  const handleNext = () => {
    // Validate current step
    if (currentStep === 2 && !formData.program) {
      setError(t("selectProgramError"));
      return;
    }
    if (currentStep === 3 && !formData.organizationName) {
      setError(t("enterOrgNameError"));
      return;
    }
    if (currentStep === 3 && !formData.organizationType) {
      setError(t("selectOrgTypeError"));
      return;
    }
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleUpdateForm = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setError("");
  };

  const handleConfirm = async () => {
    if (!currentUser?.id) {
      setError(t("userNotAuthenticatedError") || "User not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      await setProgramSelection(currentUser, {
        program: formData.program as string,
        organizationName: formData.organizationName,
        organizationType: formData.organizationType as string,
        country: formData.country,
        city: formData.city,
        region: formData.region,
      });

      // Keep UI state in sync immediately after persisting selection.
      setCurrentUser({
        ...currentUser,
        profile: {
          ...currentUser.profile,
          accreditationProgram: formData.program,
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          country: formData.country,
          city: formData.city,
          region: formData.region,
          programSelectedAt: new Date().toISOString(),
        },
      });

      // Show success screen or redirect
      setCurrentStep(5);

      // Flag: auto-start welcome tour when the main dashboard mounts
      localStorage.setItem('accreditex_start_welcome_tour', 'true');

      // Redirect after 2 seconds
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("saveProgramSelectionError") ||
              "Failed to save program selection",
      );
      setIsLoading(false);
    }
  };

  const handleEditStep = (step: number) => {
    setError("");
    setCurrentStep(step);
  };

  // Render success screen
  if (currentStep === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 dark:from-dark-brand-primary/10 dark:to-dark-brand-primary/5 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
            {t("setupComplete")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mb-6">
            {t("setupCompleteSubtitle")}
          </p>
          <p className="text-sm text-brand-text-tertiary dark:text-dark-brand-text-tertiary animate-pulse">
            {t("setupRedirect")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 dark:from-dark-brand-primary/5 dark:to-dark-brand-primary/10 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 mx-1 rounded-full transition-colors ${
                  step <= currentStep
                    ? "bg-brand-primary"
                    : "bg-brand-background dark:bg-dark-brand-background"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-brand-text-tertiary dark:text-dark-brand-text-tertiary text-center">
            {t("wizardStep")} {currentStep} {t("of")} 4
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <WizardStep1Welcome onNext={handleNext} formData={formData} />
        )}
        {currentStep === 2 && (
          <WizardStep2ProgramSelection
            formData={formData}
            onUpdateForm={handleUpdateForm}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <WizardStep3Details
            formData={formData}
            onUpdateForm={handleUpdateForm}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 4 && (
          <WizardStep4Review
            formData={formData}
            onConfirm={handleConfirm}
            onBack={handleBack}
            onEdit={handleEditStep}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ProgramSelectorWizard;
