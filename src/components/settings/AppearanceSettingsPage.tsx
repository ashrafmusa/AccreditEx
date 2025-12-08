import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import { labelClasses } from "@/components/ui/constants";
import { CheckIcon } from "@/components/icons";
import { SettingsPanel, FormGroup, AdvancedToggle, EnhancedSelect } from './index';

const AppearanceSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();

  const [appearance, setAppearance] = useState({
    compactMode: appSettings?.appearance?.compactMode ?? false,
    sidebarCollapsed: appSettings?.appearance?.sidebarCollapsed ?? false,
    showAnimations: appSettings?.appearance?.showAnimations ?? true,
    cardStyle: (appSettings?.appearance?.cardStyle ?? "elevated") as
      | "elevated"
      | "outlined"
      | "filled",
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleAppearanceChange = (
    updater: (prev: typeof appearance) => typeof appearance
  ) => {
    const newAppearance = updater(appearance);
    setAppearance(newAppearance);
    setHasChanges(
      JSON.stringify(newAppearance) !==
        JSON.stringify(appSettings?.appearance || appearance)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateAppSettings({
        ...appSettings!,
        appearance,
      });

      if (appearance.compactMode) {
        document.documentElement.classList.add("compact-mode");
      } else {
        document.documentElement.classList.remove("compact-mode");
      }

      if (appearance.showAnimations) {
        document.documentElement.classList.remove("reduce-motion");
      } else {
        document.documentElement.classList.add("reduce-motion");
      }

      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAppearance({
      compactMode: appSettings?.appearance?.compactMode ?? false,
      sidebarCollapsed: appSettings?.appearance?.sidebarCollapsed ?? false,
      showAnimations: appSettings?.appearance?.showAnimations ?? true,
      cardStyle: (appSettings?.appearance?.cardStyle ?? "elevated") as
        | "elevated"
        | "outlined"
        | "filled",
    });
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
        title={t("appearance")}
        description={t("appearanceDescription")}
      >
        <div className="space-y-8">
          <SettingsSection
            title={t("colors")}
            description="Customize display preferences"
          >
            <ToggleSwitch
              label={t("compactMode")}
              description={t("compactModeDescription")}
              enabled={appearance.compactMode}
              setEnabled={() =>
                handleAppearanceChange((a) => ({
                  ...a,
                  compactMode: !a.compactMode,
                }))
              }
            />

            <ToggleSwitch
              label={t("collapseSidebar")}
              description={t("collapseSidebarDescription")}
              enabled={appearance.sidebarCollapsed}
              setEnabled={() =>
                handleAppearanceChange((a) => ({
                  ...a,
                  sidebarCollapsed: !a.sidebarCollapsed,
                }))
              }
            />
          </SettingsSection>

          <SettingsSection
            title={t("animation")}
            description="Animation and motion preferences"
          >
            <ToggleSwitch
              label={t("showAnimations")}
              description={t("showAnimationsDescription")}
              enabled={appearance.showAnimations}
              setEnabled={() =>
                handleAppearanceChange((a) => ({
                  ...a,
                  showAnimations: !a.showAnimations,
                }))
              }
            />
          </SettingsSection>

          <div>
            <label htmlFor="cardStyle" className={labelClasses}>
              {t("cardStyle")}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t("cardStyleDescription")}
            </p>
            <select
              id="cardStyle"
              value={appearance.cardStyle}
              onChange={(e) =>
                handleAppearanceChange((a) => ({
                  ...a,
                  cardStyle: e.target.value as
                    | "elevated"
                    | "outlined"
                    | "filled",
                }))
              }
              className="mt-1 w-full max-w-xs border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="elevated">{t("elevated")}</option>
              <option value="outlined">{t("outlined")}</option>
              <option value="filled">{t("filled")}</option>
            </select>
          </div>

          <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t("preview")}
            </h4>
            <div
              className={`p-4 rounded-lg ${
                appearance.cardStyle === "elevated"
                  ? "shadow-md bg-white dark:bg-gray-800"
                  : appearance.cardStyle === "outlined"
                  ? "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t("previewCardText")}
              </p>
            </div>
          </div>
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

export default AppearanceSettingsPage;
