import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import { useToast } from '@/hooks/useToast';
import ImageUpload from './ImageUpload';
import ColorPicker from './ColorPicker';
import { labelClasses, inputClasses } from '@/components/ui/constants';
import { Language, UserRole } from '@/types';

const GeneralSettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { appSettings, updateAppSettings } = useAppStore();
    const [settings, setSettings] = useState(appSettings!);

    const handleSave = () => {
        updateAppSettings(settings);
        toast.success(t('settingsUpdated'));
    };

    const handleColorChange = (color: string) => {
        setSettings(s => ({...s, primaryColor: color }));
        document.documentElement.style.setProperty('--brand-primary-color', color);
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('general')}
                description={t('generalSettingsDescription')}
                footer={<button onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700">{t('saveChanges')}</button>}
            >
                <div>
                    <label htmlFor="appName" className={labelClasses}>{t('appName')}</label>
                    <input type="text" id="appName" value={settings.appName} onChange={e => setSettings(s => ({...s, appName: e.target.value}))} className={inputClasses} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClasses}>{t('appLogo')}</label>
                        <ImageUpload currentImage={settings.logoUrl} onImageChange={url => setSettings(s => ({...s, logoUrl: url}))} />
                    </div>
                     <div>
                        <label className={labelClasses}>{t('primaryColor')}</label>
                        <ColorPicker color={settings.primaryColor} onChange={handleColorChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="defaultLanguage" className={labelClasses}>{t('defaultLanguage')}</label>
                        <select id="defaultLanguage" value={settings.defaultLanguage} onChange={e => setSettings(s => ({...s, defaultLanguage: e.target.value as Language }))} className={inputClasses}>
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="defaultUserRole" className={labelClasses}>{t('defaultUserRole')}</label>
                        <select id="defaultUserRole" value={settings.defaultUserRole} onChange={e => setSettings(s => ({...s, defaultUserRole: e.target.value as UserRole }))} className={inputClasses}>
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
};

export default GeneralSettingsPage;
