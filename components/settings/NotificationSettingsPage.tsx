import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import { useToast } from '@/hooks/useToast';
import ToggleSwitch from './ToggleSwitch';

const NotificationSettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { appSettings, updateAppSettings } = useAppStore();
    
    // Initialize notification settings with defaults if they don't exist
    const [notifications, setNotifications] = useState({
        emailNotifications: appSettings?.notifications?.emailNotifications ?? true,
        pushNotifications: appSettings?.notifications?.pushNotifications ?? false,
        taskReminders: appSettings?.notifications?.taskReminders ?? true,
        projectUpdates: appSettings?.notifications?.projectUpdates ?? true,
        trainingDueDates: appSettings?.notifications?.trainingDueDates ?? true,
        auditSchedules: appSettings?.notifications?.auditSchedules ?? true,
    });

    const handleSave = () => {
        updateAppSettings({ 
            ...appSettings!, 
            notifications 
        });
        toast.success(t('settingsUpdated'));
    };

    const handleToggle = (field: keyof typeof notifications) => {
        setNotifications(n => ({ ...n, [field]: !n[field] }));
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('notifications')}
                description={t('notificationsDescription')}
                footer={
                    <button 
                        onClick={handleSave} 
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700"
                    >
                        {t('saveChanges')}
                    </button>
                }
            >
                <div className="space-y-6">
                    {/* General Notifications */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                            {t('generalNotifications')}
                        </h4>
                        <div className="space-y-4">
                            <ToggleSwitch
                                label={t('emailNotifications')}
                                description={t('emailNotificationsDescription')}
                                enabled={notifications.emailNotifications}
                                setEnabled={() => handleToggle('emailNotifications')}
                            />
                            <ToggleSwitch
                                label={t('pushNotifications')}
                                description={t('pushNotificationsDescription')}
                                enabled={notifications.pushNotifications}
                                setEnabled={() => handleToggle('pushNotifications')}
                            />
                        </div>
                    </div>

                    {/* Notification Categories */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                            {t('notificationCategories')}
                        </h4>
                        <div className="space-y-4">
                            <ToggleSwitch
                                label={t('taskReminders')}
                                description={t('taskRemindersDescription')}
                                enabled={notifications.taskReminders}
                                setEnabled={() => handleToggle('taskReminders')}
                            />
                            <ToggleSwitch
                                label={t('projectUpdates')}
                                description={t('projectUpdatesDescription')}
                                enabled={notifications.projectUpdates}
                                setEnabled={() => handleToggle('projectUpdates')}
                            />
                            <ToggleSwitch
                                label={t('trainingDueDates')}
                                description={t('trainingDueDatesDescription')}
                                enabled={notifications.trainingDueDates}
                                setEnabled={() => handleToggle('trainingDueDates')}
                            />
                            <ToggleSwitch
                                label={t('auditSchedules')}
                                description={t('auditSchedulesDescription')}
                                enabled={notifications.auditSchedules}
                                setEnabled={() => handleToggle('auditSchedules')}
                            />
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {t('notificationInfo')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
};

export default NotificationSettingsPage;
