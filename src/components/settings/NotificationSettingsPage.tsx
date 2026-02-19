import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettingsAudit } from "@/hooks/useSettingsAudit";
import { useNotifications } from "@/hooks/useNotifications";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import { useToast } from "@/hooks/useToast";
import ToggleSwitch from "./ToggleSwitch";
import {
  CheckIcon,
  BellIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@/components/icons";
import {
  SettingsPanel,
  FormGroup,
  AdvancedToggle,
  EnhancedSelect,
} from "./index";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

const NotificationSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { auditBatch } = useSettingsAudit();
  const { appSettings, updateAppSettings } = useAppStore();
  const { getStats, markAllAsRead } = useNotifications({ autoCleanup: true });

  const [notifications, setNotifications] = useState({
    emailNotifications: appSettings?.notifications?.emailNotifications ?? true,
    pushNotifications: appSettings?.notifications?.pushNotifications ?? false,
    taskReminders: appSettings?.notifications?.taskReminders ?? true,
    projectUpdates: appSettings?.notifications?.projectUpdates ?? true,
    trainingDueDates: appSettings?.notifications?.trainingDueDates ?? true,
    auditSchedules: appSettings?.notifications?.auditSchedules ?? true,
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    criticalAlertsOnly: appSettings?.notifications?.criticalAlertsOnly ?? false,
    quietHoursEnabled: appSettings?.notifications?.quietHoursEnabled ?? false,
    quietHoursStart: appSettings?.notifications?.quietHoursStart ?? "22:00",
    quietHoursEnd: appSettings?.notifications?.quietHoursEnd ?? "08:00",
    digestFrequency: (appSettings?.notifications?.digestFrequency ??
      "instant") as "instant" | "daily" | "weekly",
    notificationSound: appSettings?.notifications?.notificationSound ?? true,
    desktopNotifications:
      appSettings?.notifications?.desktopNotifications ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  useBeforeUnload(hasChanges);
  const stats = getStats();

  const handleNotificationChange = (field: keyof typeof notifications) => {
    const newNotifications = {
      ...notifications,
      [field]: !notifications[field],
    };
    setNotifications(newNotifications);
    setHasChanges(true);
  };

  const handleAdvancedChange = (
    field: keyof typeof advancedSettings,
    value: any,
  ) => {
    const newAdvanced = {
      ...advancedSettings,
      [field]: value,
    };
    setAdvancedSettings(newAdvanced);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!appSettings) {
        toast.error(t("settingsNotLoaded"));
        return;
      }
      const oldNotif = appSettings.notifications || {};
      const allNewValues = { ...notifications, ...advancedSettings };
      const changes: { field: string; oldValue: unknown; newValue: unknown }[] =
        [];
      for (const [key, newVal] of Object.entries(allNewValues)) {
        const oldVal = (oldNotif as any)[key];
        if (oldVal !== newVal) {
          changes.push({ field: key, oldValue: oldVal, newValue: newVal });
        }
      }
      if (changes.length > 0) {
        await auditBatch("notifications", changes);
      }
      const updatedSettings = {
        ...appSettings,
        notifications: {
          ...notifications,
          ...advancedSettings,
        },
      };
      await updateAppSettings(updatedSettings);
      setHasChanges(false);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error(t("settingsUpdateFailed"));
      console.error("Failed to save notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNotifications({
      emailNotifications:
        appSettings?.notifications?.emailNotifications ?? true,
      pushNotifications: appSettings?.notifications?.pushNotifications ?? false,
      taskReminders: appSettings?.notifications?.taskReminders ?? true,
      projectUpdates: appSettings?.notifications?.projectUpdates ?? true,
      trainingDueDates: appSettings?.notifications?.trainingDueDates ?? true,
      auditSchedules: appSettings?.notifications?.auditSchedules ?? true,
    });
    setAdvancedSettings({
      criticalAlertsOnly:
        appSettings?.notifications?.criticalAlertsOnly ?? false,
      quietHoursEnabled: appSettings?.notifications?.quietHoursEnabled ?? false,
      quietHoursStart: appSettings?.notifications?.quietHoursStart ?? "22:00",
      quietHoursEnd: appSettings?.notifications?.quietHoursEnd ?? "08:00",
      digestFrequency: (appSettings?.notifications?.digestFrequency ??
        "instant") as "instant" | "daily" | "weekly",
      notificationSound: appSettings?.notifications?.notificationSound ?? true,
      desktopNotifications:
        appSettings?.notifications?.desktopNotifications ?? true,
    });
    setHasChanges(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success(t("notificationsMarkedAsRead"));
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <SettingsAlert
          type="warning"
          title={t("unsavedChanges")}
          message={t("unsavedNotificationChanges")}
          dismissible
        />
      )}

      {/* Notification Statistics Card */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  {t("total")}
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <BellIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">
                  {t("unread")}
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {stats.unread}
                </p>
              </div>
              <InformationCircleIcon className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div className="bg-linear-to-br from-rose-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-700/30 rounded-lg p-4 border border-rose-200 dark:border-pink-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">
                  {t("critical")}
                </p>
                <p className="text-2xl font-bold text-pink-900 dark:text-rose-100 mt-1">
                  {stats.byPriority["critical"] || 0}
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">
                  {t("archived")}
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {stats.archived}
                </p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      <SettingsCard
        title={t("notifications")}
        description={t("notificationsDescription")}
      >
        <div className="space-y-8">
          <SettingsSection
            title={t("generalNotifications")}
            description={t("configureDeliveryMethods")}
          >
            <ToggleSwitch
              label={t("emailNotifications")}
              description={t("emailNotificationsDescription")}
              enabled={notifications.emailNotifications}
              setEnabled={() => handleNotificationChange("emailNotifications")}
            />
            <ToggleSwitch
              label={t("pushNotifications")}
              description={t("pushNotificationsDescription")}
              enabled={notifications.pushNotifications}
              setEnabled={() => handleNotificationChange("pushNotifications")}
            />
            <ToggleSwitch
              label={t("desktopNotifications")}
              description={t("desktopNotificationsDescription")}
              enabled={advancedSettings.desktopNotifications}
              setEnabled={(enabled) =>
                handleAdvancedChange("desktopNotifications", enabled)
              }
            />
            <ToggleSwitch
              label={t("notificationSound") || "Notification Sound"}
              description={
                t("playSoundOnNotifications") ||
                "Play sound when new notifications arrive"
              }
              enabled={advancedSettings.notificationSound}
              setEnabled={(enabled) =>
                handleAdvancedChange("notificationSound", enabled)
              }
            />
          </SettingsSection>

          <SettingsSection
            title={t("notificationCategories")}
            description={
              t("chooseNotificationTypes") ||
              "Choose which notification types to receive"
            }
          >
            <ToggleSwitch
              label={t("taskReminders")}
              description={t("taskRemindersDescription")}
              enabled={notifications.taskReminders}
              setEnabled={() => handleNotificationChange("taskReminders")}
            />
            <ToggleSwitch
              label={t("projectUpdates")}
              description={t("projectUpdatesDescription")}
              enabled={notifications.projectUpdates}
              setEnabled={() => handleNotificationChange("projectUpdates")}
            />
            <ToggleSwitch
              label={t("trainingDueDates")}
              description={t("trainingDueDatesDescription")}
              enabled={notifications.trainingDueDates}
              setEnabled={() => handleNotificationChange("trainingDueDates")}
            />
            <ToggleSwitch
              label={t("auditSchedules")}
              description={t("auditSchedulesDescription")}
              enabled={notifications.auditSchedules}
              setEnabled={() => handleNotificationChange("auditSchedules")}
            />
          </SettingsSection>

          <SettingsSection
            title={t("advancedSettings") || "Advanced Settings"}
            description={
              t("fineTuneNotificationPreferences") ||
              "Fine-tune your notification preferences"
            }
          >
            <ToggleSwitch
              label={t("criticalAlertsOnly") || "Critical Alerts Only"}
              description={
                t("onlyReceiveCriticalNotifications") ||
                "Only receive high priority and critical notifications"
              }
              enabled={advancedSettings.criticalAlertsOnly}
              setEnabled={(enabled) =>
                handleAdvancedChange("criticalAlertsOnly", enabled)
              }
            />
            <ToggleSwitch
              label={t("quietHours") || "Quiet Hours"}
              description={
                t("muteNotificationsDuringHours") ||
                "Mute notifications during specific hours"
              }
              enabled={advancedSettings.quietHoursEnabled}
              setEnabled={(enabled) =>
                handleAdvancedChange("quietHoursEnabled", enabled)
              }
            />
            {advancedSettings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("startTime")}
                  </label>
                  <input
                    type="time"
                    value={advancedSettings.quietHoursStart}
                    onChange={(e) =>
                      handleAdvancedChange("quietHoursStart", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("endTime")}
                  </label>
                  <input
                    type="time"
                    value={advancedSettings.quietHoursEnd}
                    onChange={(e) =>
                      handleAdvancedChange("quietHoursEnd", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t("digestFrequency")}
              </label>
              <select
                value={advancedSettings.digestFrequency}
                onChange={(e) =>
                  handleAdvancedChange("digestFrequency", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
              >
                <option value="instant">
                  Instant - Get notified immediately
                </option>
                <option value="daily">
                  Daily Digest - Once per day at 9 AM
                </option>
                <option value="weekly">
                  Weekly Digest - Every Monday at 9 AM
                </option>
              </select>
            </div>
          </SettingsSection>

          <SettingsAlert
            type="info"
            title={t("notificationTips")}
            message={t("notificationTipsMessage")}
            dismissible={false}
          />
        </div>
      </SettingsCard>

      <div className="flex gap-3 justify-between">
        <SettingsButton
          variant="secondary"
          onClick={handleMarkAllAsRead}
          size="sm"
        >
          {t("markAllAsRead")}
        </SettingsButton>
        <div className="flex gap-3">
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
    </div>
  );
};

export default NotificationSettingsPage;
