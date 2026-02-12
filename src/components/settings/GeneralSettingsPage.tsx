import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import SettingsCard from "./SettingsCard";
import { useToast } from "@/hooks/useToast";
import ImageUpload from "./ImageUpload";
import ColorPicker from "./ColorPicker";
import { labelClasses, inputClasses } from "@/components/ui/constants";
import { Language, UserRole } from "@/types";
import { Cog6ToothIcon, CheckIcon, SpinnerIcon } from "@/components/icons";

const GeneralSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();
  const [settings, setSettings] = useState(appSettings!);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (
    updater: (s: typeof settings) => typeof settings,
  ) => {
    const newSettings = updater(settings);
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(appSettings));
  };

  const handleSave = async () => {
    if (!settings.appName.trim()) {
      toast.error("App name is required");
      return;
    }
    setLoading(true);
    try {
      await updateAppSettings(settings);
      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (color: string) => {
    handleSettingChange((s) => ({ ...s, primaryColor: color }));
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title={t("general")}
        description={t("generalSettingsDescription")}
        icon={Cog6ToothIcon}
      >
        <div>
          <label htmlFor="appName" className={labelClasses}>
            {t("appName")}
          </label>
          <input
            type="text"
            id="appName"
            value={settings.appName}
            onChange={(e) =>
              handleSettingChange((s) => ({ ...s, appName: e.target.value }))
            }
            className={`${inputClasses} transition-all focus:ring-2`}
            placeholder="Enter application name"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>{t("appLogo")}</label>
            <ImageUpload
              currentImage={settings.logoUrl}
              onImageChange={(url) =>
                handleSettingChange((s) => ({ ...s, logoUrl: url }))
              }
            />
          </div>
          <div>
            <label className={labelClasses}>{t("primaryColor")}</label>
            <ColorPicker
              color={settings.primaryColor}
              onChange={handleColorChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="defaultLanguage" className={labelClasses}>
              {t("defaultLanguage")}
            </label>
            <select
              id="defaultLanguage"
              value={settings.defaultLanguage}
              onChange={(e) =>
                handleSettingChange((s) => ({
                  ...s,
                  defaultLanguage: e.target.value as Language,
                }))
              }
              className={`${inputClasses} transition-all`}
            >
              <option value="en">{t("englishLanguage")}</option>
              <option value="ar">{t("arabicLanguage")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="defaultUserRole" className={labelClasses}>
              {t("defaultUserRole")}
            </label>
            <select
              id="defaultUserRole"
              value={settings.defaultUserRole}
              onChange={(e) =>
                handleSettingChange((s) => ({
                  ...s,
                  defaultUserRole: e.target.value as UserRole,
                }))
              }
              className={`${inputClasses} transition-all`}
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingsCard>

      {hasChanges && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3 animate-slideIn">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            You have unsaved changes
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8">
        {hasChanges && (
          <button
            onClick={() => {
              setSettings(appSettings!);
              setHasChanges(false);
            }}
            className="inline-flex items-center justify-center py-2.5 px-6 rounded-lg font-medium text-sm transition-all duration-200 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          className={`inline-flex items-center justify-center py-2.5 px-6 rounded-lg font-medium text-sm transition-all duration-200 gap-2 ${
            loading || !hasChanges
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-brand-primary hover:bg-sky-700 text-white shadow-md hover:shadow-lg active:scale-95"
          }`}
        >
          {loading ? (
            <>
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="w-4 h-4" />
              {t("saveChanges")}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
