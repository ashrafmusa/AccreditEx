import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import {
  CheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import { SettingsPanel, FormGroup, AdvancedToggle, SliderInput } from './index';

const UsersSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();

  const [usersSettings, setUsersSettings] = useState({
    enableUserManagement: appSettings?.users?.enableUserManagement ?? true,
    requireEmailVerification: appSettings?.users?.requireEmailVerification ?? true,
    autoDeactivateInactiveUsers: appSettings?.users?.autoDeactivateInactiveUsers ?? false,
    inactivityThresholdDays: appSettings?.users?.inactivityThresholdDays ?? 90,
    sessionTimeoutMinutes: appSettings?.users?.sessionTimeoutMinutes ?? 30,
    maxLoginAttempts: appSettings?.users?.maxLoginAttempts ?? 5,
    lockoutDurationMinutes: appSettings?.users?.lockoutDurationMinutes ?? 15,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUsersSettingsChange = (field: keyof typeof usersSettings, value: any) => {
    const newUsersSettings = {
      ...usersSettings,
      [field]: value,
    };
    setUsersSettings(newUsersSettings);
    setHasChanges(
      JSON.stringify(newUsersSettings) !==
        JSON.stringify(appSettings?.users || usersSettings)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateAppSettings({
        ...appSettings!,
        users: usersSettings,
      });
      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsersSettings({
      enableUserManagement: appSettings?.users?.enableUserManagement ?? true,
      requireEmailVerification: appSettings?.users?.requireEmailVerification ?? true,
      autoDeactivateInactiveUsers: appSettings?.users?.autoDeactivateInactiveUsers ?? false,
      inactivityThresholdDays: appSettings?.users?.inactivityThresholdDays ?? 90,
      sessionTimeoutMinutes: appSettings?.users?.sessionTimeoutMinutes ?? 30,
      maxLoginAttempts: appSettings?.users?.maxLoginAttempts ?? 5,
      lockoutDurationMinutes: appSettings?.users?.lockoutDurationMinutes ?? 15,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <SettingsAlert
          type="warning"
          icon={ExclamationTriangleIcon}
          title={t("unsavedChanges")}
          message="You have unsaved changes to your settings"
          onDismiss={() => {}}
        />
      )}

      <SettingsCard
        title="User Management"
        description="Configure user account settings and security policies"
      >
        <div className="space-y-8">
          <SettingsSection
            title="User Accounts"
            description="Manage user account creation and verification"
          >
            <ToggleSwitch
              label="Enable User Management"
              description="Allow creation and management of user accounts"
              enabled={usersSettings.enableUserManagement}
              setEnabled={(enabled) =>
                handleUsersSettingsChange("enableUserManagement", enabled)
              }
            />
            <ToggleSwitch
              label="Require Email Verification"
              description="Users must verify their email address before accessing the application"
              enabled={usersSettings.requireEmailVerification}
              setEnabled={(enabled) =>
                handleUsersSettingsChange("requireEmailVerification", enabled)
              }
            />
          </SettingsSection>

          <SettingsSection
            title="Inactivity Management"
            description="Automatically manage inactive user accounts"
          >
            <ToggleSwitch
              label="Auto-Deactivate Inactive Users"
              description="Automatically deactivate user accounts that haven't been used for a specified period"
              enabled={usersSettings.autoDeactivateInactiveUsers}
              setEnabled={(enabled) =>
                handleUsersSettingsChange("autoDeactivateInactiveUsers", enabled)
              }
            />
            {usersSettings.autoDeactivateInactiveUsers && (
              <div className="ml-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Inactivity Threshold (days)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="7"
                    max="365"
                    step="1"
                    value={usersSettings.inactivityThresholdDays}
                    onChange={(e) =>
                      handleUsersSettingsChange("inactivityThresholdDays", parseInt(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <span className="text-lg font-bold text-gray-900 dark:text-white min-w-16 text-right">
                    {usersSettings.inactivityThresholdDays}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Users inactive for more than this duration will be automatically deactivated
                </p>
              </div>
            )}
          </SettingsSection>

          <SettingsSection
            title="Session Security"
            description="Configure session timeout and access security"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Session Timeout (minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="480"
                  step="5"
                  value={usersSettings.sessionTimeoutMinutes}
                  onChange={(e) =>
                    handleUsersSettingsChange("sessionTimeoutMinutes", parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-16 text-right">
                  {usersSettings.sessionTimeoutMinutes}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Users will be automatically logged out after this period of inactivity
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Login Security"
            description="Set login attempt limits and lockout duration"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Maximum Failed Login Attempts
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={usersSettings.maxLoginAttempts}
                  onChange={(e) =>
                    handleUsersSettingsChange("maxLoginAttempts", parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-8 text-right">
                  {usersSettings.maxLoginAttempts}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Account will be locked after this many failed login attempts
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Account Lockout Duration (minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={usersSettings.lockoutDurationMinutes}
                  onChange={(e) =>
                    handleUsersSettingsChange("lockoutDurationMinutes", parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-16 text-right">
                  {usersSettings.lockoutDurationMinutes}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Account will remain locked for this duration after exceeding failed login attempts
              </p>
            </div>
          </SettingsSection>

          <SettingsAlert
            type="warning"
            title="Security Notice"
            message="These settings affect user access and account security. Changes may impact existing user sessions and require users to re-authenticate."
          />
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

export default UsersSettingsPage;
