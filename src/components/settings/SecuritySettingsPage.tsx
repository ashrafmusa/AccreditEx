import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import { labelClasses, inputClasses } from "@/components/ui/constants";
import { CheckIcon } from "@/components/icons";
import {
  SettingsPanel,
  FormGroup,
  AdvancedToggle,
  EnhancedInput,
  SliderInput,
} from "./index";

const SecuritySettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();
  const [policy, setPolicy] = useState(appSettings!.passwordPolicy);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePolicyChange = (
    updater: (prev: typeof policy) => typeof policy
  ) => {
    const newPolicy = updater(policy);
    setPolicy(newPolicy);
    setHasChanges(
      JSON.stringify(newPolicy) !== JSON.stringify(appSettings!.passwordPolicy)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!appSettings) {
        toast.error("Settings not loaded");
        return;
      }
      const updatedSettings = {
        ...appSettings,
        passwordPolicy: policy,
      };
      await updateAppSettings(updatedSettings);
      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
      console.error("Failed to save security settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPolicy(appSettings!.passwordPolicy);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <SettingsAlert
          type="warning"
          icon
          title={t("unsavedChanges")}
          dismissible
        />
      )}

      <SettingsCard
        title={t("passwordPolicy")}
        description={t("passwordPolicyDescription")}
      >
        <div className="space-y-8">
          <SettingsSection
            title={t("passwordRequirements") || "Password Requirements"}
            description={
              t("configurePasswordComplexity") ||
              "Configure minimum password complexity standards"
            }
          >
            <div>
              <label htmlFor="minLength" className={labelClasses}>
                {t("minLength")}
              </label>
              <input
                type="number"
                id="minLength"
                value={policy.minLength}
                onChange={(e) =>
                  handlePolicyChange((p) => ({
                    ...p,
                    minLength: parseInt(e.target.value, 10) || 8,
                  }))
                }
                className={`${inputClasses} w-24`}
              />
            </div>
            <ToggleSwitch
              label={t("requireUppercase")}
              enabled={policy.requireUppercase}
              setEnabled={() =>
                handlePolicyChange((p) => ({
                  ...p,
                  requireUppercase: !p.requireUppercase,
                }))
              }
            />
            <ToggleSwitch
              label={t("requireNumber")}
              enabled={policy.requireNumber}
              setEnabled={() =>
                handlePolicyChange((p) => ({
                  ...p,
                  requireNumber: !p.requireNumber,
                }))
              }
            />
            <ToggleSwitch
              label={t("requireSymbol")}
              enabled={policy.requireSymbol}
              setEnabled={() =>
                handlePolicyChange((p) => ({
                  ...p,
                  requireSymbol: !p.requireSymbol,
                }))
              }
            />
          </SettingsSection>
        </div>
      </SettingsCard>

      <div className="flex gap-3 justify-end">
        <SettingsButton
          variant="secondary"
          onClick={handleCancel}
          disabled={!hasChanges || loading}
        >
          {t("cancel")}
        </SettingsButton>
        <SettingsButton
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || loading}
          loading={loading}
          icon={!loading && hasChanges ? CheckIcon : undefined}
        >
          {loading ? t("saving") : t("saveChanges")}
        </SettingsButton>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
