import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/components/common/ThemeProvider";
import { useUserStore } from "@/stores/useUserStore";
import { AppSettings, Language, UserRole } from "@/types";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsSection from "./SettingsSection";
import ToggleSwitch from "./ToggleSwitch";
import { useToast } from "@/hooks/useToast";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useSettingsAudit } from "@/hooks/useSettingsAudit";
import ImageUpload from "./ImageUpload";
import ColorPicker from "./ColorPicker";
import Globe from "@/components/ui/Globe";
import { labelClasses, inputClasses } from "@/components/ui/constants";
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
  const { isAdmin, AdminOnly } = useAdminGuard();
  const { auditBatch } = useSettingsAudit();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { appSettings, updateAppSettings } = useAppStore();

  // Combined state for all visual + general settings
  const [settings, setSettings] = useState({
    // General / Branding Settings
    appName: appSettings?.appName ?? "AccreditEx",
    logoUrl: appSettings?.logoUrl ?? "",
    defaultLanguage: (appSettings?.defaultLanguage ?? "en") as Language,
    defaultUserRole: (appSettings?.defaultUserRole ??
      UserRole.TeamMember) as UserRole,

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
      settings.appearance.customColors.primary,
    );
    root.style.setProperty(
      "--user-success",
      settings.appearance.customColors.success,
    );
    root.style.setProperty(
      "--user-warning",
      settings.appearance.customColors.warning,
    );
    root.style.setProperty(
      "--user-danger",
      settings.appearance.customColors.danger,
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
      toast.error(t("appNameRequired"));
      return;
    }

    if (!currentUser) {
      toast.error(t("userNotAuthenticated"));
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
        defaultLanguage: settings.defaultLanguage,
        defaultUserRole: settings.defaultUserRole,
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
        await auditBatch("visual", [
          {
            field: "appName",
            oldValue: appSettings?.appName,
            newValue: settings.appName,
          },
          {
            field: "logoUrl",
            oldValue: appSettings?.logoUrl,
            newValue: settings.logoUrl,
          },
          { field: "theme", oldValue: theme, newValue: theme },
          {
            field: "compactMode",
            oldValue: appSettings?.appearance?.compactMode,
            newValue: settings.appearance.compactMode,
          },
          {
            field: "sidebarCollapsed",
            oldValue: appSettings?.appearance?.sidebarCollapsed,
            newValue: settings.appearance.sidebarCollapsed,
          },
          {
            field: "showAnimations",
            oldValue: appSettings?.appearance?.showAnimations,
            newValue: settings.appearance.showAnimations,
          },
          {
            field: "cardStyle",
            oldValue: appSettings?.appearance?.cardStyle,
            newValue: settings.appearance.cardStyle,
          },
          {
            field: "primaryColor",
            oldValue: appSettings?.appearance?.customColors?.primary,
            newValue: settings.appearance.customColors.primary,
          },
          {
            field: "successColor",
            oldValue: appSettings?.appearance?.customColors?.success,
            newValue: settings.appearance.customColors.success,
          },
          {
            field: "warningColor",
            oldValue: appSettings?.appearance?.customColors?.warning,
            newValue: settings.appearance.customColors.warning,
          },
          {
            field: "dangerColor",
            oldValue: appSettings?.appearance?.customColors?.danger,
            newValue: settings.appearance.customColors.danger,
          },
          {
            field: "globeBaseColor",
            oldValue: appSettings?.globeSettings?.baseColor,
            newValue: settings.globeSettings.baseColor,
          },
          {
            field: "globeMarkerColor",
            oldValue: appSettings?.globeSettings?.markerColor,
            newValue: settings.globeSettings.markerColor,
          },
          {
            field: "globeGlowColor",
            oldValue: appSettings?.globeSettings?.glowColor,
            newValue: settings.globeSettings.glowColor,
          },
          {
            field: "globeScale",
            oldValue: appSettings?.globeSettings?.scale,
            newValue: settings.globeSettings.scale,
          },
          {
            field: "globeDarkness",
            oldValue: appSettings?.globeSettings?.darkness,
            newValue: settings.globeSettings.darkness,
          },
          {
            field: "globeLightIntensity",
            oldValue: appSettings?.globeSettings?.lightIntensity,
            newValue: settings.globeSettings.lightIntensity,
          },
          {
            field: "globeRotationSpeed",
            oldValue: appSettings?.globeSettings?.rotationSpeed,
            newValue: settings.globeSettings.rotationSpeed,
          },
          {
            field: "defaultLanguage",
            oldValue: appSettings?.defaultLanguage,
            newValue: settings.defaultLanguage,
          },
          {
            field: "defaultUserRole",
            oldValue: appSettings?.defaultUserRole,
            newValue: settings.defaultUserRole,
          },
        ]);
      } catch (logError) {
        // Log errors shouldn't prevent save success
        console.warn("Failed to log changes:", logError);
      }

      // Auto-create version snapshot
      try {
        await createSettingsVersion(
          newSettings,
          currentUser.id,
          "Auto-saved version",
          ["auto", "visual"],
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
      defaultLanguage: (appSettings?.defaultLanguage ?? "en") as Language,
      defaultUserRole: (appSettings?.defaultUserRole ??
        UserRole.TeamMember) as UserRole,
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
    <AdminOnly>
      <div className="space-y-6">
        {/* Live Preview Info Banner */}
        {hasChanges && (
          <div className="bg-linear-to-r from-sky-50 to-pink-50 dark:from-sky-900/20 dark:to-pink-900/20 border-2 border-sky-200 dark:border-sky-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <SparklesIcon className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sky-900 dark:text-sky-100 mb-1">
                  {t("livePreviewActive")}
                </h4>
                <p className="text-sm text-sky-700 dark:text-sky-300">
                  {t("livePreviewDescription")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Branding Section */}
        <SettingsCard
          title={t("brandingIdentity")}
          description={t("brandingIdentityDescription")}
          icon={Cog6ToothIcon}
          collapsible
          defaultExpanded
        >
          <SettingsSection
            title={t("applicationIdentity")}
            description={t("basicBrandingDescription")}
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
                placeholder={t("enterApplicationName")}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title={t("visualAssets")}
            description={t("logoPrimaryBrandColor")}
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

          <SettingsSection
            title={t("defaults")}
            description={
              t("defaultLanguageAndRoleDescription") ||
              "Set the default language and role for new users"
            }
            gridCols={2}
            noBorder
          >
            <div>
              <label htmlFor="defaultLanguage" className={labelClasses}>
                {t("defaultLanguage")}
              </label>
              <select
                id="defaultLanguage"
                value={settings.defaultLanguage}
                onChange={(e) =>
                  handleChange((s) => ({
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
                  handleChange((s) => ({
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
          </SettingsSection>
        </SettingsCard>

        {/* Theme & Appearance Section */}
        <SettingsCard
          title={t("themeAppearance")}
          description={t("themeAppearanceDescription")}
          icon={PaintBrushIcon}
          collapsible
          defaultExpanded
        >
          <SettingsSection
            title={t("themeMode")}
            description={t("themeModeDescription")}
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
                    {t("lightMode")}
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
                    {t("darkMode")}
                  </div>
                </div>
                {theme === "dark" && (
                  <CheckIcon className="w-5 h-5 text-brand-primary ml-auto" />
                )}
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            title={t("displayOptions")}
            description={t("displayPreferences")}
            noBorder
          >
            <ToggleSwitch
              label={t("compactMode")}
              description={t("compactModeDescription")}
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
              label={t("collapseSidebar")}
              description={t("collapseSidebarDescription")}
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
              label={t("showAnimations")}
              description={t("showAnimationsDescription")}
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
                {t("cardStyle")}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t("cardStyleDescription")}
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
            title={t("customColors")}
            description={t("customColorsDescription")}
            gridCols={2}
            badge="Advanced"
            noBorder
          >
            <div>
              <label className={labelClasses}>{t("primaryColorLabel")}</label>
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
              <label className={labelClasses}>{t("successColorLabel")}</label>
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
              <label className={labelClasses}>{t("warningColorLabel")}</label>
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
              <label className={labelClasses}>{t("dangerColorLabel")}</label>
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
            title={t("livePreviewLabel")}
            description={t("livePreviewDescription")}
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
                  {t("changesAppliedInstantly")}
                </p>
              </div>
            </div>
          </SettingsSection>
        </SettingsCard>

        {/* Globe Visualization Section */}
        <SettingsCard
          title={t("globeVisualization")}
          description={t("globeVisualizationDescription")}
          icon={GlobeAltIcon}
          collapsible
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings Panel */}
            <div className="space-y-6">
              <SettingsSection
                title={t("colors")}
                description={t("globeColorScheme")}
                noBorder
              >
                <div>
                  <label className={labelClasses}>{t("baseColorLabel")}</label>
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
                  <label className={labelClasses}>
                    {t("markerColorLabel")}
                  </label>
                  <ColorPicker
                    color={settings.globeSettings.markerColor}
                    onChange={(color) =>
                      handleChange((s) => ({
                        ...s,
                        globeSettings: {
                          ...s.globeSettings,
                          markerColor: color,
                        },
                      }))
                    }
                  />
                </div>

                <div>
                  <label className={labelClasses}>{t("glowColorLabel")}</label>
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
                title={t("animationEffects")}
                description={t("globeBehaviorSettings")}
                noBorder
              >
                <div>
                  <label className={labelClasses}>
                    {t("rotationSpeedLabel")}
                  </label>
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
                  <label className={labelClasses}>{t("scale")}</label>
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
              <label className={labelClasses}>{t("livePreviewLabel")}</label>
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
            {t("cancel")}
          </SettingsButton>
          <SettingsButton
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || loading}
            loading={loading}
            icon={!loading ? CheckIcon : undefined}
            fullWidth={false}
          >
            {loading ? t("saving") : t("saveChanges")}
          </SettingsButton>
        </div>
      </div>
    </AdminOnly>
  );
};

export default VisualSettingsPage;
