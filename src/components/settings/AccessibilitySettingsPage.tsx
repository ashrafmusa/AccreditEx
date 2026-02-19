import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettingsAudit } from "@/hooks/useSettingsAudit";
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
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

const AccessibilitySettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { auditBatch } = useSettingsAudit();
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
  useBeforeUnload(hasChanges);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", accessibility.fontSize);
  }, [accessibility.fontSize]);

  const handleAccessibilityChange = (
    updater: (prev: typeof accessibility) => typeof accessibility,
  ) => {
    const newAccessibility = updater(accessibility);
    setAccessibility(newAccessibility);
    setHasChanges(
      JSON.stringify(newAccessibility) !==
        JSON.stringify(appSettings?.accessibility || accessibility),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!appSettings) {
        toast.error(t("settingsNotLoaded"));
        return;
      }
      const updatedSettings = {
        ...appSettings,
        accessibility,
      };
      await updateAppSettings(updatedSettings);

      // Audit log accessibility changes
      const oldA = appSettings?.accessibility || {};
      const changes = [
        {
          field: "fontSize",
          oldValue: (oldA as any).fontSize ?? "medium",
          newValue: accessibility.fontSize,
        },
        {
          field: "highContrast",
          oldValue: String((oldA as any).highContrast ?? false),
          newValue: String(accessibility.highContrast),
        },
        {
          field: "reduceMotion",
          oldValue: String((oldA as any).reduceMotion ?? false),
          newValue: String(accessibility.reduceMotion),
        },
        {
          field: "screenReaderOptimized",
          oldValue: String((oldA as any).screenReaderOptimized ?? false),
          newValue: String(accessibility.screenReaderOptimized),
        },
      ].filter((c) => c.oldValue !== c.newValue);
      if (changes.length > 0) {
        await auditBatch("accessibility", changes);
      }

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
      {/* Global settings warning banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <svg
          className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          These settings apply to all users across the application.
        </p>
      </div>

      {hasChanges && (
        <SettingsAlert
          type="warning"
          title={t("unsavedChanges")}
          message={t("unsavedAccessibilityChanges")}
          dismissible
        />
      )}

      {/* Text & Display Settings Panel */}
      <SettingsPanel
        title={t("fontSize")}
        description={t("textDisplayDescription")}
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
              {t("preview")}
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
        title={t("visionContrast")}
        description={t("visionContrastDescription")}
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
          <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-pink-900/20 border border-rose-200 dark:border-pink-700">
            <p className="text-sm text-pink-600 dark:text-rose-300">
              ✓ {t("highContrastActive")}
            </p>
          </div>
        )}
      </SettingsPanel>

      {/* Motion & Animation Panel */}
      <SettingsPanel
        title={t("motionAnimation")}
        description={t("motionAnimationDescription")}
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
              ✓ {t("reducedMotionActive")}
            </p>
          </div>
        )}
      </SettingsPanel>

      {/* Assistive Technology Panel */}
      <SettingsPanel
        title={t("assistiveTechnology")}
        description={t("assistiveTechnologyDescription")}
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
              ✓ {t("screenReaderActive")}
            </p>
          </div>
        )}
      </SettingsPanel>

      {/* Accessibility Tips */}
      <SettingsAlert
        type="info"
        title={t("accessibilityTips")}
        message={t("accessibilityTipsMessage")}
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
