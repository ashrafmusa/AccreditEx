import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import { useUserStore } from "@/stores/useUserStore";
import { AppSettings, UserRole } from "@/types";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsSection from "./SettingsSection";
import ToggleSwitch from "./ToggleSwitch";
import { useToast } from "@/hooks/useToast";
import ImageUpload from "./ImageUpload";
import ColorPicker from "./ColorPicker";
import Globe from "@/components/ui/Globe";
import { labelClasses, inputClasses } from "@/components/ui/constants";
import { logSettingsChange } from "@/services/settingsAuditService";
import { createSettingsVersion } from "@/services/settingsVersionService";
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
  const { currentUser } = useUserStore();
  const toast = useToast();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { appSettings, updateAppSettings } = useAppStore();

  // Combined state for all visual settings
  const [settings, setSettings] = useState({
    // General UI Settings
    appName: appSettings?.appName ?? "AccreditEx",
    logoUrl: appSettings?.logoUrl ?? "",

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

  // Live preview: Apply visual changes immediately as user makes changes
  useEffect(() => {
    applyVisualChanges();
  }, [
    settings.appearance.customColors,
    settings.appearance.compactMode,
    settings.appearance.showAnimations,
  ]);

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

    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    console.log("Current user role:", currentUser.role);
    console.log("Current user:", {
      id: currentUser.id,
      role: currentUser.role,
      email: currentUser.email,
    });

    setLoading(true);
    try {
      // Create a clean settings object with only the required fields
      const newSettings: AppSettings = {
        appName: settings.appName,
        logoUrl: settings.logoUrl,
        primaryColor: settings.appearance.customColors.primary,
        defaultLanguage: appSettings?.defaultLanguage ?? "en",
        defaultUserRole: appSettings?.defaultUserRole ?? UserRole.TeamMember,
        passwordPolicy: appSettings?.passwordPolicy ?? {
          minLength: 8,
          requireUppercase: false,
          requireNumber: false,
          requireSymbol: false,
        },
        globeSettings: settings.globeSettings,
        appearance: settings.appearance,
        notifications: appSettings?.notifications ?? {
          emailNotifications: true,
          pushNotifications: false,
          taskReminders: true,
          projectUpdates: true,
          trainingDueDates: true,
          auditSchedules: true,
        },
        accessibility: appSettings?.accessibility ?? {
          fontSize: "medium",
          highContrast: false,
          reduceMotion: false,
          screenReaderOptimized: false,
        },
        ...(appSettings?.usageMonitor && {
          usageMonitor: appSettings.usageMonitor,
        }),
        ...(appSettings?.users && { users: appSettings.users }),
      };

      console.log("Saving settings:", newSettings);

      // Save to Firebase
      try {
        await updateAppSettings(newSettings);
        console.log("Settings saved to Firebase successfully");
      } catch (saveError: any) {
        console.error("Failed to save to Firebase:", saveError);
        console.error("Error code:", saveError?.code);
        console.error("Error message:", saveError?.message);
        console.error("Full error object:", saveError);

        // Pass through the actual Firebase error
        throw saveError;
      }

      // Log changes to audit trail
      try {
        if (appSettings?.appName !== settings.appName) {
          await logSettingsChange(
            currentUser.id,
            "update",
            "visual",
            "appName",
            appSettings.appName,
            settings.appName
          );
        }
        if (
          appSettings?.appearance?.customColors?.primary !==
          settings.appearance.customColors.primary
        ) {
          await logSettingsChange(
            currentUser.id,
            "update",
            "visual",
            "primaryColor",
            appSettings.appearance.customColors.primary,
            settings.appearance.customColors.primary
          );
        }
      } catch (logError) {
        // Log errors shouldn't prevent save success
        console.warn("Failed to log changes:", logError);
      }

      // Auto-create version snapshot
      try {
        await createSettingsVersion(
          currentUser.id,
          newSettings,
          "Auto-saved version",
          ["auto", "visual"]
        );
      } catch (versionError) {
        // Version snapshot errors shouldn't prevent save success
        console.warn("Failed to create version snapshot:", versionError);
      }

      // Apply visual changes immediately
      applyVisualChanges();

      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save settings: ${errorMessage}`);
      console.error("Save settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSettings({
      appName: appSettings?.appName ?? "AccreditEx",
      logoUrl: appSettings?.logoUrl ?? "",
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
      {/* Live Preview Info Banner */}
      {hasChanges && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                Live Preview Active
              </h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Your changes are being previewed in real-time! Colors and
                display options update instantly. Click{" "}
                <strong>Save Changes</strong> below to make them permanent.
              </p>
            </div>
          </div>
        </div>
      )}

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
          gridCols={1}
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
              onClick={() => setTheme("light")}
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
              onClick={() => setTheme("dark")}
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
            label="Collapse Sidebar"
            description="Keep sidebar minimized by default"
            enabled={settings.appearance.sidebarCollapsed}
            setEnabled={() =>
              handleChange((s) => ({
                ...s,
                appearance: {
                  ...s.appearance,
                  sidebarCollapsed: !s.appearance.sidebarCollapsed,
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

          <div>
            <label htmlFor="cardStyle" className={labelClasses}>
              Card Style
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Choose how cards and panels are displayed
            </p>
            <select
              id="cardStyle"
              value={settings.appearance.cardStyle}
              onChange={(e) =>
                handleChange((s) => ({
                  ...s,
                  appearance: {
                    ...s.appearance,
                    cardStyle: e.target.value as
                      | "elevated"
                      | "outlined"
                      | "filled",
                  },
                }))
              }
              className={inputClasses}
            >
              <option value="elevated">Elevated (with shadow)</option>
              <option value="outlined">Outlined (with border)</option>
              <option value="filled">Filled (solid background)</option>
            </select>
          </div>
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

        {/* Live Preview - Color Swatches */}
        <SettingsSection
          title="Live Preview"
          description="See your color changes in real-time"
          badge="Preview"
          noBorder
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div
                className="w-full h-20 rounded-md mb-2 flex items-center justify-center text-white font-semibold"
                style={{
                  backgroundColor: settings.appearance.customColors.primary,
                }}
              >
                Primary
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {settings.appearance.customColors.primary}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div
                className="w-full h-20 rounded-md mb-2 flex items-center justify-center text-white font-semibold"
                style={{
                  backgroundColor: settings.appearance.customColors.success,
                }}
              >
                Success
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {settings.appearance.customColors.success}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div
                className="w-full h-20 rounded-md mb-2 flex items-center justify-center text-white font-semibold"
                style={{
                  backgroundColor: settings.appearance.customColors.warning,
                }}
              >
                Warning
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {settings.appearance.customColors.warning}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div
                className="w-full h-20 rounded-md mb-2 flex items-center justify-center text-white font-semibold"
                style={{
                  backgroundColor: settings.appearance.customColors.danger,
                }}
              >
                Danger
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {settings.appearance.customColors.danger}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Changes are applied instantly! Try adjusting colors to see
                immediate results.
              </p>
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
