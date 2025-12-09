import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsSection from "./SettingsSection";
import ToggleSwitch from "./ToggleSwitch";
import { useToast } from "@/hooks/useToast";
import ImageUpload from "./ImageUpload";
import ColorPicker from "./ColorPicker";
import Globe from "@/components/ui/Globe";
import { labelClasses, inputClasses } from "@/components/ui/constants";
import {
  CheckIcon,
  SunIcon,
  MoonIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from "@/components/icons";

const VisualSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const { appSettings, updateAppSettings } = useAppStore();

  // Combined state for all visual settings
  const [settings, setSettings] = useState({
    // General UI Settings
    appName: appSettings?.appName ?? "AccreditEx",
    logoUrl: appSettings?.logoUrl ?? "",
    primaryColor: appSettings?.primaryColor ?? "#4f46e5",

    // Appearance Settings
    appearance: {
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
    },

    // Globe Settings
    globeSettings: {
      baseColor: appSettings?.globeSettings?.baseColor ?? "#1e293b",
      markerColor: appSettings?.globeSettings?.markerColor ?? "#818cf8",
      glowColor: appSettings?.globeSettings?.glowColor ?? "#4f46e5",
      scale: appSettings?.globeSettings?.scale ?? 2.5,
      darkness: appSettings?.globeSettings?.darkness ?? 0.9,
      lightIntensity: appSettings?.globeSettings?.lightIntensity ?? 1.2,
      rotationSpeed: appSettings?.globeSettings?.rotationSpeed ?? 0.02,
    },
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (updater: (s: typeof settings) => typeof settings) => {
    const newSettings = updater(settings);
    setSettings(newSettings);
    setHasChanges(true);
  };

  const applyVisualChanges = () => {
    const root = document.documentElement;

    // Apply primary color
    root.style.setProperty(
      "--user-primary",
      settings.appearance.customColors.primary
    );
    root.style.setProperty(
      "--user-success",
      settings.appearance.customColors.success
    );
    root.style.setProperty(
      "--user-warning",
      settings.appearance.customColors.warning
    );
    root.style.setProperty(
      "--user-danger",
      settings.appearance.customColors.danger
    );

    // Apply appearance modes
    if (settings.appearance.compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }

    if (settings.appearance.showAnimations) {
      root.classList.remove("reduce-motion");
    } else {
      root.classList.add("reduce-motion");
    }
  };

  const handleSave = async () => {
    if (!settings.appName.trim()) {
      toast.error("App name is required");
      return;
    }

    setLoading(true);
    try {
      await updateAppSettings({
        ...appSettings!,
        appName: settings.appName,
        logoUrl: settings.logoUrl,
        primaryColor: settings.primaryColor,
        appearance: settings.appearance,
        globeSettings: settings.globeSettings,
      });

      // Apply visual changes immediately
      applyVisualChanges();

      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSettings({
      appName: appSettings?.appName ?? "AccreditEx",
      logoUrl: appSettings?.logoUrl ?? "",
      primaryColor: appSettings?.primaryColor ?? "#4f46e5",
      appearance: {
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
      },
      globeSettings: {
        baseColor: appSettings?.globeSettings?.baseColor ?? "#1e293b",
        markerColor: appSettings?.globeSettings?.markerColor ?? "#818cf8",
        glowColor: appSettings?.globeSettings?.glowColor ?? "#4f46e5",
        scale: appSettings?.globeSettings?.scale ?? 2.5,
        darkness: appSettings?.globeSettings?.darkness ?? 0.9,
        lightIntensity: appSettings?.globeSettings?.lightIntensity ?? 1.2,
        rotationSpeed: appSettings?.globeSettings?.rotationSpeed ?? 0.02,
      },
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Branding Section */}
      <SettingsCard
        title="Branding & Identity"
        description="Customize your application's name, logo, and primary brand color"
        icon={Cog6ToothIcon}
        collapsible
        defaultExpanded
      >
        <SettingsSection
          title="Application Identity"
          description="Basic branding settings for your application"
          noBorder
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
                handleChange((s) => ({ ...s, appName: e.target.value }))
              }
              className={`${inputClasses} transition-all focus:ring-2`}
              placeholder="Enter application name"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Visual Assets"
          description="Logo and primary brand color"
          gridCols={2}
          noBorder
        >
          <div>
            <label className={labelClasses}>{t("appLogo")}</label>
            <ImageUpload
              currentImage={settings.logoUrl}
              onImageChange={(url) =>
                handleChange((s) => ({ ...s, logoUrl: url }))
              }
            />
          </div>
          <div>
            <label className={labelClasses}>{t("primaryColor")}</label>
            <ColorPicker
              color={settings.primaryColor}
              onChange={(color) =>
                handleChange((s) => ({ ...s, primaryColor: color }))
              }
            />
          </div>
        </SettingsSection>
      </SettingsCard>

      {/* Theme & Appearance Section */}
      <SettingsCard
        title="Theme & Appearance"
        description="Customize the visual appearance and behavior of the interface"
        icon={PaintBrushIcon}
        collapsible
        defaultExpanded
      >
        <SettingsSection
          title="Theme Mode"
          description="Choose between light and dark mode"
          noBorder
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => theme === "dark" && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                theme === "light"
                  ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-brand-primary/50"
              }`}
            >
              <SunIcon
                className={`w-6 h-6 ${
                  theme === "light" ? "text-brand-primary" : "text-gray-400"
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
                  Light Mode
                </div>
              </div>
              {theme === "light" && (
                <CheckIcon className="w-5 h-5 text-brand-primary ml-auto" />
              )}
            </button>

            <button
              onClick={() => theme === "light" && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                theme === "dark"
                  ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-brand-primary/50"
              }`}
            >
              <MoonIcon
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-brand-primary" : "text-gray-400"
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
                  Dark Mode
                </div>
              </div>
              {theme === "dark" && (
                <CheckIcon className="w-5 h-5 text-brand-primary ml-auto" />
              )}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Display Options"
          description="Customize display preferences"
          noBorder
        >
          <ToggleSwitch
            label="Compact Mode"
            description="Reduce spacing and padding for denser layouts"
            enabled={settings.appearance.compactMode}
            setEnabled={() =>
              handleChange((s) => ({
                ...s,
                appearance: {
                  ...s.appearance,
                  compactMode: !s.appearance.compactMode,
                },
              }))
            }
          />

          <ToggleSwitch
            label="Show Animations"
            description="Enable smooth transitions and animations"
            enabled={settings.appearance.showAnimations}
            setEnabled={() =>
              handleChange((s) => ({
                ...s,
                appearance: {
                  ...s.appearance,
                  showAnimations: !s.appearance.showAnimations,
                },
              }))
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Custom Colors"
          description="Customize color scheme throughout the application"
          gridCols={2}
          badge="Advanced"
          noBorder
        >
          <div>
            <label className={labelClasses}>Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.appearance.customColors.primary}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        primary: e.target.value,
                      },
                    },
                  }))
                }
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.appearance.customColors.primary}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        primary: e.target.value,
                      },
                    },
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Success Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.appearance.customColors.success}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        success: e.target.value,
                      },
                    },
                  }))
                }
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.appearance.customColors.success}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        success: e.target.value,
                      },
                    },
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Warning Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.appearance.customColors.warning}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        warning: e.target.value,
                      },
                    },
                  }))
                }
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.appearance.customColors.warning}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        warning: e.target.value,
                      },
                    },
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Danger Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.appearance.customColors.danger}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        danger: e.target.value,
                      },
                    },
                  }))
                }
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.appearance.customColors.danger}
                onChange={(e) =>
                  handleChange((s) => ({
                    ...s,
                    appearance: {
                      ...s.appearance,
                      customColors: {
                        ...s.appearance.customColors,
                        danger: e.target.value,
                      },
                    },
                  }))
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
            </div>
          </div>
        </SettingsSection>
      </SettingsCard>

      {/* Globe Visualization Section */}
      <SettingsCard
        title="Globe Visualization"
        description="Customize the 3D globe appearance and behavior"
        icon={GlobeAltIcon}
        collapsible
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            <SettingsSection
              title="Colors"
              description="Globe color scheme"
              noBorder
            >
              <div>
                <label className={labelClasses}>Base Color</label>
                <ColorPicker
                  color={settings.globeSettings.baseColor}
                  onChange={(color) =>
                    handleChange((s) => ({
                      ...s,
                      globeSettings: { ...s.globeSettings, baseColor: color },
                    }))
                  }
                />
              </div>

              <div>
                <label className={labelClasses}>Marker Color</label>
                <ColorPicker
                  color={settings.globeSettings.markerColor}
                  onChange={(color) =>
                    handleChange((s) => ({
                      ...s,
                      globeSettings: { ...s.globeSettings, markerColor: color },
                    }))
                  }
                />
              </div>

              <div>
                <label className={labelClasses}>Glow Color</label>
                <ColorPicker
                  color={settings.globeSettings.glowColor}
                  onChange={(color) =>
                    handleChange((s) => ({
                      ...s,
                      globeSettings: { ...s.globeSettings, glowColor: color },
                    }))
                  }
                />
              </div>
            </SettingsSection>

            <SettingsSection
              title="Animation & Effects"
              description="Globe behavior settings"
              noBorder
            >
              <div>
                <label className={labelClasses}>Rotation Speed</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.01"
                    max="0.1"
                    step="0.01"
                    value={settings.globeSettings.rotationSpeed}
                    onChange={(e) =>
                      handleChange((s) => ({
                        ...s,
                        globeSettings: {
                          ...s.globeSettings,
                          rotationSpeed: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">
                    {settings.globeSettings.rotationSpeed.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Scale</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={settings.globeSettings.scale}
                    onChange={(e) =>
                      handleChange((s) => ({
                        ...s,
                        globeSettings: {
                          ...s.globeSettings,
                          scale: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">
                    {settings.globeSettings.scale.toFixed(1)}
                  </span>
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* Live Preview */}
          <div>
            <label className={labelClasses}>Live Preview</label>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <Globe
                width={400}
                height={400}
                baseColor={settings.globeSettings.baseColor}
                glowColor={settings.globeSettings.glowColor}
                markerColor={settings.globeSettings.markerColor}
                scale={settings.globeSettings.scale}
                darkness={settings.globeSettings.darkness}
                lightIntensity={settings.globeSettings.lightIntensity}
                rotationSpeed={settings.globeSettings.rotationSpeed}
                userLocation={{ lat: 24.7136, long: 46.6753 }}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <SettingsButton
          variant="secondary"
          onClick={handleCancel}
          disabled={!hasChanges || loading}
          fullWidth={false}
        >
          Cancel
        </SettingsButton>
        <SettingsButton
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || loading}
          loading={loading}
          icon={!loading ? CheckIcon : undefined}
          fullWidth={false}
        >
          {loading ? "Saving..." : "Save All Changes"}
        </SettingsButton>
      </div>
    </div>
  );
};

export default VisualSettingsPage;
