import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import { labelClasses } from "@/components/ui/constants";
import {
  CheckIcon,
  SunIcon,
  MoonIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import {
  SettingsPanel,
  FormGroup,
  AdvancedToggle,
  EnhancedSelect,
} from "./index";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

const AppearanceSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { appSettings, updateAppSettings } = useAppStore();

  const [appearance, setAppearance] = useState({
    compactMode: appSettings?.appearance?.compactMode ?? false,
    sidebarCollapsed: appSettings?.appearance?.sidebarCollapsed ?? false,
    showAnimations: appSettings?.appearance?.showAnimations ?? true,
    cardStyle: (appSettings?.appearance?.cardStyle ?? "elevated") as
      | "elevated"
      | "outlined"
      | "filled",
    customColors: appSettings?.appearance?.customColors ?? {
      primary: "#4f46e5",
      success: "#22c55e",
      warning: "#f97316",
      danger: "#ef4444",
    },
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  useBeforeUnload(hasChanges);

  const applyCustomColors = (colors: typeof appearance.customColors) => {
    const root = document.documentElement;
    root.style.setProperty("--user-primary", colors.primary);
    root.style.setProperty("--user-success", colors.success);
    root.style.setProperty("--user-warning", colors.warning);
    root.style.setProperty("--user-danger", colors.danger);
  };

  const handleAppearanceChange = (
    updater: (prev: typeof appearance) => typeof appearance,
  ) => {
    const newAppearance = updater(appearance);
    setAppearance(newAppearance);
    setHasChanges(
      JSON.stringify(newAppearance) !==
        JSON.stringify(appSettings?.appearance || appearance),
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
        appearance,
      };
      await updateAppSettings(updatedSettings);

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

      // Apply custom colors
      applyCustomColors(appearance.customColors);

      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
      console.error("Failed to save appearance settings:", error);
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
      customColors: appSettings?.appearance?.customColors ?? {
        primary: "#4f46e5",
        success: "#22c55e",
        warning: "#f97316",
        danger: "#ef4444",
      },
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
          message={
            t("youHaveUnsavedChanges") ||
            "You have unsaved changes to your settings"
          }
          onDismiss={() => {}}
        />
      )}

      <SettingsCard
        title={t("appearance")}
        description={t("appearanceDescription")}
      >
        <div className="space-y-8">
          {/* Theme Mode Section */}
          <SettingsSection
            title={t("themeMode") || "Theme Mode"}
            description={
              t("themeModeDescription") ||
              "Choose between light and dark mode for the application"
            }
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  theme === "light"
                    ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                    : "border-gray-300 dark:border-gray-600 hover:border-brand-primary/50"
                }`}
                aria-pressed={theme === "light"}
              >
                <SunIcon
                  className={`w-6 h-6 ${
                    theme === "light"
                      ? "text-brand-primary"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
                <div className="text-left">
                  <div
                    className={`font-medium ${
                      theme === "light"
                        ? "text-brand-primary"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {t("lightMode") || "Light Mode"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("lightModeDesc") || "Bright theme for daytime"}
                  </div>
                </div>
                {theme === "light" && (
                  <CheckIcon className="w-5 h-5 text-brand-primary ml-auto" />
                )}
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  theme === "dark"
                    ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                    : "border-gray-300 dark:border-gray-600 hover:border-brand-primary/50"
                }`}
                aria-pressed={theme === "dark"}
              >
                <MoonIcon
                  className={`w-6 h-6 ${
                    theme === "dark"
                      ? "text-brand-primary"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
                <div className="text-left">
                  <div
                    className={`font-medium ${
                      theme === "dark"
                        ? "text-brand-primary"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {t("darkMode") || "Dark Mode"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("darkModeDesc") || "Dark theme for low light"}
                  </div>
                </div>
                {theme === "dark" && (
                  <CheckIcon className="w-5 h-5 text-brand-primary ml-auto" />
                )}
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            title={t("displayOptions") || "Display Options"}
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

          {/* Custom Colors Section */}
          <SettingsSection
            title={t("customColors") || "Custom Colors"}
            description="Customize brand colors throughout the application"
          >
            <div className="space-y-4">
              {/* Primary Color */}
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("primaryColor") || "Primary Color"}
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.customColors.primary}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            primary: e.target.value,
                          },
                        }))
                      }
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearance.customColors.primary}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            primary: e.target.value,
                          },
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="#4f46e5"
                    />
                  </div>
                </label>
              </div>

              {/* Success Color */}
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("successColor") || "Success Color"}
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.customColors.success}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            success: e.target.value,
                          },
                        }))
                      }
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearance.customColors.success}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            success: e.target.value,
                          },
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="#22c55e"
                    />
                  </div>
                </label>
              </div>

              {/* Warning Color */}
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("warningColor") || "Warning Color"}
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.customColors.warning}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            warning: e.target.value,
                          },
                        }))
                      }
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearance.customColors.warning}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            warning: e.target.value,
                          },
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="#f97316"
                    />
                  </div>
                </label>
              </div>

              {/* Danger Color */}
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("dangerColor") || "Danger Color"}
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.customColors.danger}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            danger: e.target.value,
                          },
                        }))
                      }
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearance.customColors.danger}
                      onChange={(e) =>
                        handleAppearanceChange((a) => ({
                          ...a,
                          customColors: {
                            ...a.customColors,
                            danger: e.target.value,
                          },
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="#ef4444"
                    />
                  </div>
                </label>
              </div>

              {/* Reset to Defaults Button */}
              <button
                onClick={() =>
                  handleAppearanceChange((a) => ({
                    ...a,
                    customColors: {
                      primary: "#4f46e5",
                      success: "#22c55e",
                      warning: "#f97316",
                      danger: "#ef4444",
                    },
                  }))
                }
                className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
              >
                {t("resetToDefaults") || "Reset to Defaults"}
              </button>
            </div>
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

export default AppearanceSettingsPage;
