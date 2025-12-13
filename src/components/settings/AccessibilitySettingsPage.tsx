import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import { labelClasses } from "@/components/ui/constants";
import { CheckIcon } from "@/components/icons";
import {
  SettingsPanel,
  FormGroup,
  AdvancedToggle,
  EnhancedSelect,
  SliderInput,
} from "./index";

const AccessibilitySettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();

  const [accessibility, setAccessibility] = useState({
    fontSize: (appSettings?.accessibility?.fontSize ?? "medium") as
      | "small"
      | "medium"
      | "large"
      | "extra-large",
    highContrast: appSettings?.accessibility?.highContrast ?? false,
    reduceMotion: appSettings?.accessibility?.reduceMotion ?? false,
    screenReaderOptimized:
      appSettings?.accessibility?.screenReaderOptimized ?? false,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", accessibility.fontSize);
  }, [accessibility.fontSize]);

  const handleAccessibilityChange = (
    updater: (prev: typeof accessibility) => typeof accessibility
  ) => {
    const newAccessibility = updater(accessibility);
    setAccessibility(newAccessibility);
    setHasChanges(
      JSON.stringify(newAccessibility) !==
        JSON.stringify(appSettings?.accessibility || accessibility)
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
        accessibility,
      };
      await updateAppSettings(updatedSettings);

      const root = document.documentElement;
      root.setAttribute("data-font-size", accessibility.fontSize);

      if (accessibility.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      if (accessibility.reduceMotion) {
        root.classList.add("reduce-motion");
      } else {
        root.classList.remove("reduce-motion");
      }

      if (accessibility.screenReaderOptimized) {
        root.classList.add("screen-reader-optimized");
      } else {
        root.classList.remove("screen-reader-optimized");
      }

      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
      console.error("Failed to save accessibility settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAccessibility({
      fontSize: (appSettings?.accessibility?.fontSize ?? "medium") as
        | "small"
        | "medium"
        | "large"
        | "extra-large",
      highContrast: appSettings?.accessibility?.highContrast ?? false,
      reduceMotion: appSettings?.accessibility?.reduceMotion ?? false,
      screenReaderOptimized:
        appSettings?.accessibility?.screenReaderOptimized ?? false,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <SettingsAlert
          type="warning"
          title={t("unsavedChanges")}
          message="You have unsaved accessibility settings changes"
          dismissible
        />
      )}

      {/* Text & Display Settings Panel */}
      <SettingsPanel
        title={t("fontSize")}
        description="Adjust text and component sizing for better readability"
        collapsible={false}
        variant="default"
      >
        <div className="space-y-4">
          <FormGroup
            label={t("fontSize")}
            description={t("fontSizeDescription")}
            required
          >
            <EnhancedSelect
              value={accessibility.fontSize}
              onChange={(e) =>
                handleAccessibilityChange((a) => ({
                  ...a,
                  fontSize: e.target.value as any,
                }))
              }
              options={[
                { value: "small", label: `${t("small")} (12px)` },
                { value: "medium", label: `${t("medium")} (14px)` },
                { value: "large", label: `${t("large")} (16px)` },
                { value: "extra-large", label: `${t("extraLarge")} (18px)` },
              ]}
            />
          </FormGroup>

          {/* Live Preview */}
          <div className="mt-6 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
              Preview
            </h5>
            <p
              className="text-gray-700 dark:text-gray-300 mb-2"
              style={{
                fontSize:
                  accessibility.fontSize === "small"
                    ? "12px"
                    : accessibility.fontSize === "medium"
                    ? "14px"
                    : accessibility.fontSize === "large"
                    ? "16px"
                    : "18px",
              }}
            >
              {t("previewText")}
            </p>
            <p
              className="text-gray-600 dark:text-gray-400"
              style={{
                fontSize:
                  accessibility.fontSize === "small"
                    ? "11px"
                    : accessibility.fontSize === "medium"
                    ? "13px"
                    : accessibility.fontSize === "large"
                    ? "15px"
                    : "17px",
              }}
            >
              {t("previewSecondaryText")}
            </p>
          </div>
        </div>
      </SettingsPanel>

      {/* Vision & Contrast Panel */}
      <SettingsPanel
        title="Vision & Contrast"
        description="Improve visual accessibility with enhanced contrast options"
        collapsible={false}
        variant="default"
      >
        <FormGroup
          label={t("highContrast")}
          description={t("highContrastDescription")}
        >
          <AdvancedToggle
            checked={accessibility.highContrast}
            onChange={() =>
              handleAccessibilityChange((a) => ({
                ...a,
                highContrast: !a.highContrast,
              }))
            }
            color="purple"
            size="md"
          />
        </FormGroup>

        {/* Contrast Info */}
        {accessibility.highContrast && (
          <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              ✓ High contrast mode is active. UI elements will display with
              stronger color differences for better visibility.
            </p>
          </div>
        )}
      </SettingsPanel>

      {/* Motion & Animation Panel */}
      <SettingsPanel
        title="Motion & Animation"
        description="Control animations and motion effects for comfortable viewing"
        collapsible={false}
        variant="default"
      >
        <FormGroup
          label={t("reduceMotion")}
          description={t("reduceMotionDescription")}
        >
          <AdvancedToggle
            checked={accessibility.reduceMotion}
            onChange={() =>
              handleAccessibilityChange((a) => ({
                ...a,
                reduceMotion: !a.reduceMotion,
              }))
            }
            color="amber"
            size="md"
          />
        </FormGroup>

        {/* Motion Info */}
        {accessibility.reduceMotion && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              ✓ Reduced motion is enabled. Animations and transitions will be
              minimized throughout the application.
            </p>
          </div>
        )}
      </SettingsPanel>

      {/* Assistive Technology Panel */}
      <SettingsPanel
        title="Assistive Technology"
        description="Support for screen readers and other assistive devices"
        collapsible={false}
        variant="default"
      >
        <FormGroup
          label={t("screenReaderOptimized")}
          description={t("screenReaderOptimizedDescription")}
        >
          <AdvancedToggle
            checked={accessibility.screenReaderOptimized}
            onChange={() =>
              handleAccessibilityChange((a) => ({
                ...a,
                screenReaderOptimized: !a.screenReaderOptimized,
              }))
            }
            color="green"
            size="md"
          />
        </FormGroup>

        {/* Screen Reader Info */}
        {accessibility.screenReaderOptimized && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✓ Screen reader optimization is active. Content navigation will be
              optimized for assistive technologies.
            </p>
          </div>
        )}
      </SettingsPanel>

      {/* Accessibility Tips */}
      <SettingsAlert
        type="info"
        title="Accessibility Tips"
        message="• Use keyboard shortcuts: Tab to navigate, Enter to activate, Arrow keys to select
• Screen readers work best with semantic HTML and proper ARIA labels
• High contrast improves readability in bright or low-light conditions
• Reduced motion helps prevent dizziness or discomfort from animations"
        dismissible={false}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4">
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

export default AccessibilitySettingsPage;
