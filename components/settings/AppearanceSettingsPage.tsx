import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import { useToast } from '@/hooks/useToast';
import ToggleSwitch from './ToggleSwitch';
import { labelClasses } from '@/components/ui/constants';

const AppearanceSettingsPage: React.FC = () =>{
    const { t } = useTranslation();
    const toast = useToast();
    const { appSettings, updateAppSettings } = useAppStore();
    
    // Initialize appearance settings with defaults if they don't exist
    const [appearance, setAppearance] = useState({
        compactMode: appSettings?.appearance?.compactMode ?? false,
        sidebarCollapsed: appSettings?.appearance?.sidebarCollapsed ?? false,
        showAnimations: appSettings?.appearance?.showAnimations ?? true,
        cardStyle: (appSettings?.appearance?.cardStyle ?? 'elevated') as 'elevated' | 'outlined' | 'filled',
    });

    const handleSave = () => {
        updateAppSettings({ 
            ...appSettings!, 
            appearance 
        });
        
        // Apply appearance changes immediately
        if (appearance.compactMode) {
            document.documentElement.classList.add('compact-mode');
        } else {
            document.documentElement.classList.remove('compact-mode');
        }
        
        if (appearance.showAnimations) {
            document.documentElement.classList.remove('reduce-motion');
        } else {
            document.documentElement.classList.add('reduce-motion');
        }
        
        toast.success(t('settingsUpdated'));
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('appearance')}
                description={t('appearanceDescription')}
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
                    {/* Compact Mode */}
                    <ToggleSwitch
                        label={t('compactMode')}
                        description={t('compactModeDescription')}
                        enabled={appearance.compactMode}
                        setEnabled={() => setAppearance(a => ({ ...a, compactMode: !a.compactMode }))}
                    />

                    {/* Sidebar Behavior */}
                    <ToggleSwitch
                        label={t('collapseSidebar')}
                        description={t('collapseSidebarDescription')}
                        enabled={appearance.sidebarCollapsed}
                        setEnabled={() => setAppearance(a => ({ ...a, sidebarCollapsed: !a.sidebarCollapsed }))}
                    />

                    {/* Animations */}
                    <ToggleSwitch
                        label={t('showAnimations')}
                        description={t('showAnimationsDescription')}
                        enabled={appearance.showAnimations}
                        setEnabled={() => setAppearance(a => ({ ...a, showAnimations: !a.showAnimations }))}
                    />

                    {/* Card Style */}
                    <div>
                        <label htmlFor="cardStyle" className={labelClasses}>
                            {t('cardStyle')}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {t('cardStyleDescription')}
                        </p>
                        <select
                            id="cardStyle"
                            value={appearance.cardStyle}
                            onChange={e => setAppearance(a => ({ ...a, cardStyle: e.target.value as 'elevated' | 'outlined' | 'filled' }))}
                            className="mt-1 w-full max-w-xs border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                        >
                            <option value="elevated">{t('elevated')}</option>
                            <option value="outlined">{t('outlined')}</option>
                            <option value="filled">{t('filled')}</option>
                        </select>
                    </div>

                    {/* Preview Section */}
                    <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            {t('preview')}
                        </h4>
                        <div className={`p-4 rounded-lg ${
                            appearance.cardStyle === 'elevated' ? 'shadow-md bg-white dark:bg-gray-800' :
                            appearance.cardStyle === 'outlined' ? 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800' :
                            'bg-gray-100 dark:bg-gray-700'
                        }`}>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {t('previewCardText')}
                            </p>
                        </div>
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
};

export default AppearanceSettingsPage;
