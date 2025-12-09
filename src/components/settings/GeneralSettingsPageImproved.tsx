/**
 * Improved General Settings Page
 * Using new enhanced components for better UX
 */

import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import ImageUpload from './ImageUpload';
import ColorPicker from './ColorPicker';
import { Language, UserRole } from '@/types';
import {
  Cog6ToothIcon,
  CheckIcon,
  SpinnerIcon,
  ExclamationCircleIcon,
} from '@/components/icons';
import {
  SettingsPanel,
  FormGroup,
  EnhancedInput,
  EnhancedSelect,
  SettingsPresets,
} from './index';

const GeneralSettingsPageImproved: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();
  const [settings, setSettings] = useState(appSettings!);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);

  const handleSettingChange = (
    updater: (s: typeof settings) => typeof settings
  ) => {
    const newSettings = updater(settings);
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(appSettings));
  };

  const handleSave = async () => {
    if (!settings.appName.trim()) {
      toast.error(t('appNameRequired'));
      return;
    }
    setLoading(true);
    try {
      await updateAppSettings(settings);
      setHasChanges(false);
      toast.success(t('settingsUpdated'));
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (color: string) => {
    handleSettingChange((s) => ({ ...s, primaryColor: color }));
    document.documentElement.style.setProperty('--brand-primary-color', color);
  };

  const handleSavePreset = (name: string, description: string) => {
    const newPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      settings: { ...settings },
      createdAt: new Date(),
      isDefault: false,
    };
    setPresets([...presets, newPreset]);
    toast.success(`Preset "${name}" saved`);
  };

  const handleLoadPreset = (preset: any) => {
    setSettings(preset.settings);
    setHasChanges(true);
    toast.success(`Preset "${preset.name}" loaded`);
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets(presets.filter((p) => p.id !== presetId));
    toast.success('Preset deleted');
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية (Arabic)' },
  ];

  const roleOptions = Object.values(UserRole).map((role) => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("general")}</h1>
        <p className="text-gray-600 mt-2">{t("generalSettingsDescription")}</p>
      </div>

      {/* Unsaved Changes Alert */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              You have unsaved changes
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Save your changes to update the application settings.
            </p>
          </div>
        </div>
      )}

      {/* Application Info */}
      <SettingsPanel
        title={t("applicationDetails") || "Application Details"}
        description={
          t("configureBasicAppInfo") ||
          "Configure basic application information"
        }
        icon={Cog6ToothIcon}
      >
        <FormGroup
          label={t("appName")}
          required
          description={
            t("applicationNameDescription") ||
            "The name displayed in the application"
          }
        >
          <EnhancedInput
            type="text"
            value={settings.appName}
            onChange={(e) =>
              handleSettingChange((s) => ({ ...s, appName: e.target.value }))
            }
            placeholder={t("enterApplicationName") || "Enter application name"}
            valid={settings.appName.trim().length > 0}
          />
        </FormGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup
            label={t("appLogo")}
            description="Upload your company logo"
          >
            <ImageUpload
              currentImage={settings.logoUrl}
              onImageChange={(url) =>
                handleSettingChange((s) => ({ ...s, logoUrl: url }))
              }
            />
          </FormGroup>

          <FormGroup
            label={t("primaryColor")}
            description="Choose the primary brand color"
          >
            <ColorPicker
              color={settings.primaryColor}
              onChange={handleColorChange}
            />
          </FormGroup>
        </div>
      </SettingsPanel>

      {/* Regional Settings */}
      <SettingsPanel
        title="Regional Settings"
        description="Configure language and regional preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup
            label={t("defaultLanguage")}
            description="Default language for new users"
          >
            <EnhancedSelect
              options={languageOptions}
              value={settings.defaultLanguage}
              onChange={(e) =>
                handleSettingChange((s) => ({
                  ...s,
                  defaultLanguage: e.target.value as Language,
                }))
              }
            />
          </FormGroup>

          <FormGroup
            label={t("defaultUserRole")}
            description="Default role for newly registered users"
          >
            <EnhancedSelect
              options={roleOptions}
              value={settings.defaultUserRole}
              onChange={(e) =>
                handleSettingChange((s) => ({
                  ...s,
                  defaultUserRole: e.target.value as UserRole,
                }))
              }
            />
          </FormGroup>
        </div>
      </SettingsPanel>

      {/* Presets */}
      <SettingsPanel
        title="Configuration Presets"
        description="Save and restore your settings"
        collapsible
        defaultOpen={presets.length > 0}
      >
        <SettingsPresets
          presets={presets}
          currentSettings={settings}
          onLoadPreset={handleLoadPreset}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onSetDefault={(presetId) => {
            setPresets(
              presets.map((p) => ({
                ...p,
                isDefault: p.id === presetId,
              }))
            );
          }}
        />
      </SettingsPanel>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <SpinnerIcon className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>

        {hasChanges && (
          <button
            onClick={() => {
              setSettings(appSettings!);
              setHasChanges(false);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-blue-900">Need Help?</h4>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>
            • <strong>App Name:</strong> The primary identifier for your
            application
          </li>
          <li>
            • <strong>Logo:</strong> Used in headers and branding elements
            (recommended: PNG, max 2MB)
          </li>
          <li>
            • <strong>Primary Color:</strong> Used across UI for buttons and
            highlights
          </li>
          <li>
            • <strong>Presets:</strong> Save settings for quick restoration
            later
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GeneralSettingsPageImproved;
