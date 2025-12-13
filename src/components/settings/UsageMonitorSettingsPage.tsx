import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import {
  CheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import { SettingsPanel, FormGroup, AdvancedToggle, SliderInput } from "./index";

const UsageMonitorSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();

  const [usageMonitor, setUsageMonitor] = useState({
    trackPageViews: appSettings?.usageMonitor?.trackPageViews ?? true,
    trackUserActions: appSettings?.usageMonitor?.trackUserActions ?? true,
    trackPerformanceMetrics:
      appSettings?.usageMonitor?.trackPerformanceMetrics ?? true,
    dataRetentionDays: appSettings?.usageMonitor?.dataRetentionDays ?? 90,
    autoExportEnabled: appSettings?.usageMonitor?.autoExportEnabled ?? false,
    alertThreshold: appSettings?.usageMonitor?.alertThreshold ?? 80,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const handleUsageMonitorChange = (
    field: keyof typeof usageMonitor,
    value: any
  ) => {
    const newUsageMonitor = {
      ...usageMonitor,
      [field]: value,
    };
    setUsageMonitor(newUsageMonitor);
    setHasChanges(
      JSON.stringify(newUsageMonitor) !==
        JSON.stringify(appSettings?.usageMonitor || usageMonitor)
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
        usageMonitor,
      };
      await updateAppSettings(updatedSettings);
      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
      console.error("Failed to save usage monitor settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsageMonitor({
      trackPageViews: appSettings?.usageMonitor?.trackPageViews ?? true,
      trackUserActions: appSettings?.usageMonitor?.trackUserActions ?? true,
      trackPerformanceMetrics:
        appSettings?.usageMonitor?.trackPerformanceMetrics ?? true,
      dataRetentionDays: appSettings?.usageMonitor?.dataRetentionDays ?? 90,
      autoExportEnabled: appSettings?.usageMonitor?.autoExportEnabled ?? false,
      alertThreshold: appSettings?.usageMonitor?.alertThreshold ?? 80,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {hasChanges && !dismissedAlert && (
        <SettingsAlert
          type="warning"
          icon={ExclamationTriangleIcon}
          title={t("unsavedChanges")}
          message="You have unsaved changes to your settings"
          onDismiss={() => setDismissedAlert(true)}
        />
      )}

      <SettingsCard
        title={t("usageMonitor") || "Usage Monitor"}
        description={
          t("trackAndAnalyzeUsage") ||
          "Track and analyze system usage and performance"
        }
      >
        <div className="space-y-8">
          <SettingsSection
            title={t("dataCollection") || "Data Collection"}
            description={
              t("configureDataCollection") ||
              "Configure what data to collect about system usage"
            }
          >
            <ToggleSwitch
              label={t("trackPageViews") || "Track Page Views"}
              description={
                t("monitorPagesAccessed") ||
                "Monitor which pages are accessed and how often"
              }
              enabled={usageMonitor.trackPageViews}
              setEnabled={(enabled) =>
                handleUsageMonitorChange("trackPageViews", enabled)
              }
            />
            <ToggleSwitch
              label={t("trackUserActions") || "Track User Actions"}
              description={
                t("monitorUserInteractions") ||
                "Monitor user interactions and activities"
              }
              enabled={usageMonitor.trackUserActions}
              setEnabled={(enabled) =>
                handleUsageMonitorChange("trackUserActions", enabled)
              }
            />
            <ToggleSwitch
              label={
                t("trackPerformanceMetrics") || "Track Performance Metrics"
              }
              description={
                t("monitorPerformanceAndResources") ||
                "Monitor application performance, load times, and resource usage"
              }
              enabled={usageMonitor.trackPerformanceMetrics}
              setEnabled={(enabled) =>
                handleUsageMonitorChange("trackPerformanceMetrics", enabled)
              }
            />
          </SettingsSection>

          <SettingsSection
            title={t("dataManagement") || "Data Management"}
            description={
              t("manageDataRetention") ||
              "Manage how long data is retained and when it's exported"
            }
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t("dataRetentionDays") || "Data Retention Period (days)"}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="1"
                  value={usageMonitor.dataRetentionDays}
                  onChange={(e) =>
                    handleUsageMonitorChange(
                      "dataRetentionDays",
                      parseInt(e.target.value)
                    )
                  }
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-12 text-right">
                  {usageMonitor.dataRetentionDays}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Usage data older than this duration will be automatically
                deleted
              </p>
            </div>

            <ToggleSwitch
              label={t("autoExportEnabled") || "Auto Export Enabled"}
              description={
                t("automaticallyExportReports") ||
                "Automatically export usage reports at regular intervals"
              }
              enabled={usageMonitor.autoExportEnabled}
              setEnabled={(enabled) =>
                handleUsageMonitorChange("autoExportEnabled", enabled)
              }
            />
          </SettingsSection>

          <SettingsSection
            title={t("alerts") || "Alerts"}
            description={
              t("setThresholdForAlerts") || "Set threshold for usage alerts"
            }
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t("alertThresholdPercentage") || "Alert Threshold (%)"}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={usageMonitor.alertThreshold}
                  onChange={(e) =>
                    handleUsageMonitorChange(
                      "alertThreshold",
                      parseInt(e.target.value)
                    )
                  }
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-12 text-right">
                  {usageMonitor.alertThreshold}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("getAlertsWhenExceeded") ||
                  "Get alerts when resource usage exceeds this percentage"}
              </p>
            </div>
          </SettingsSection>

          <SettingsAlert
            type="info"
            message={
              t("allUsageDataSecure") ||
              "All usage data is collected securely and used only for system monitoring and improvement. You can review or delete your data at any time."
            }
            title={t("privacyNotice") || "Privacy Notice"}
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

export default UsageMonitorSettingsPage;
