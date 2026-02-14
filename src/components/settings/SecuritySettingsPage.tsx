import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useSettingsAudit } from "@/hooks/useSettingsAudit";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import { labelClasses, inputClasses } from "@/components/ui/constants";
import { CheckIcon, ExclamationTriangleIcon } from "@/components/icons";
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
  const { isAdmin, AdminOnly } = useAdminGuard();
  const { auditBatch } = useSettingsAudit();
  const { appSettings, updateAppSettings } = useAppStore();
  const [policy, setPolicy] = useState(appSettings!.passwordPolicy);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePolicyChange = (
    updater: (prev: typeof policy) => typeof policy,
  ) => {
    const newPolicy = updater(policy);
    setPolicy(newPolicy);
    setHasChanges(
      JSON.stringify(newPolicy) !== JSON.stringify(appSettings!.passwordPolicy),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!appSettings) {
        toast.error(t("settingsNotLoaded"));
        return;
      }
      const oldPolicy = appSettings.passwordPolicy;
      const changes: { field: string; oldValue: unknown; newValue: unknown }[] =
        [];
      if (oldPolicy.minLength !== policy.minLength) {
        changes.push({
          field: "minLength",
          oldValue: oldPolicy.minLength,
          newValue: policy.minLength,
        });
      }
      if (oldPolicy.requireUppercase !== policy.requireUppercase) {
        changes.push({
          field: "requireUppercase",
          oldValue: oldPolicy.requireUppercase,
          newValue: policy.requireUppercase,
        });
      }
      if (oldPolicy.requireNumber !== policy.requireNumber) {
        changes.push({
          field: "requireNumber",
          oldValue: oldPolicy.requireNumber,
          newValue: policy.requireNumber,
        });
      }
      if (oldPolicy.requireSymbol !== policy.requireSymbol) {
        changes.push({
          field: "requireSymbol",
          oldValue: oldPolicy.requireSymbol,
          newValue: policy.requireSymbol,
        });
      }
      if (changes.length > 0) {
        await auditBatch("security", changes);
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
    <AdminOnly>
      <div className="space-y-6">
        {hasChanges && (
          <SettingsAlert
            type="warning"
            icon={ExclamationTriangleIcon}
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
    </AdminOnly>
  );
};

export default SecuritySettingsPage;
