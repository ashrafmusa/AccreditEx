import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import { useToast } from '@/hooks/useToast';
import ToggleSwitch from './ToggleSwitch';
import { labelClasses } from '@/components/ui/constants';

const AccessibilitySettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { appSettings, updateAppSettings } = useAppStore();
    
    // Initialize accessibility settings with defaults if they don't exist
    const [accessibility, setAccessibility] = useState({
        fontSize: (appSettings?.accessibility?.fontSize ?? 'medium') as 'small' | 'medium' | 'large' | 'extra-large',
        highContrast: appSettings?.accessibility?.highContrast ?? false,
        reduceMotion: appSettings?.accessibility?.reduceMotion ?? false,
        screenReaderOptimized: appSettings?.accessibility?.screenReaderOptimized ?? false,
    });

    // Apply font size changes immediately for preview
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-font-size', accessibility.fontSize);
    }, [accessibility.fontSize]);

    const handleSave = () => {
        updateAppSettings({ 
            ...appSettings!, 
            accessibility 
        });
        
        // Apply accessibility changes immediately
        const root = document.documentElement;
        root.setAttribute('data-font-size', accessibility.fontSize);
        
        if (accessibility.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
        
        if (accessibility.reduceMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }
        
        if (accessibility.screenReaderOptimized) {
            root.classList.add('screen-reader-optimized');
        } else {
            root.classList.remove('screen-reader-optimized');
        }
        
        toast.success(t('settingsUpdated'));
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('accessibility')}
                description={t('accessibilityDescription')}
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
                    {/* Font Size */}
                    <div>
                        <label htmlFor="fontSize" className={labelClasses}>
                            {t('fontSize')}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {t('fontSizeDescription')}
                        </p>
                        <select
                            id="fontSize"
                            value={accessibility.fontSize}
                            onChange={e => setAccessibility(a => ({ ...a, fontSize: e.target.value as any }))}
                            className="mt-1 w-full max-w-xs border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                        >
                            <option value="small">{t('small')}</option>
                            <option value="medium">{t('medium')}</option>
                            <option value="large">{t('large')}</option>
                            <option value="extra-large">{t('extraLarge')}</option>
                        </select>
                    </div>

                    {/* High Contrast Mode */}
                    <ToggleSwitch
                        label={t('highContrast')}
                        description={t('highContrastDescription')}
                        enabled={accessibility.highContrast}
                        setEnabled={() => setAccessibility(a => ({ ...a, highContrast: !a.highContrast }))}
                    />

                    {/* Reduce Motion */}
                    <ToggleSwitch
                        label={t('reduceMotion')}
                        description={t('reduceMotionDescription')}
                        enabled={accessibility.reduceMotion}
                        setEnabled={() => setAccessibility(a => ({ ...a, reduceMotion: !a.reduceMotion }))}
                    />

                    {/* Screen Reader Optimization */}
                    <ToggleSwitch
                        label={t('screenReaderOptimized')}
                        description={t('screenReaderOptimizedDescription')}
                        enabled={accessibility.screenReaderOptimized}
                        setEnabled={() => setAccessibility(a => ({ ...a, screenReaderOptimized: !a.screenReaderOptimized }))}
                    />

                    {/* Preview Section */}
                    <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            {t('preview')}
                        </h4>
                        <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
                            {t('previewText')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('previewSecondaryText')}
                        </p>
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
                                    {t('accessibilityInfo')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
};

export default AccessibilitySettingsPage;
