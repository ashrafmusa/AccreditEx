import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsCard from './SettingsCard';
import { useToast } from '@/hooks/useToast';
import ToggleSwitch from './ToggleSwitch';
import { labelClasses, inputClasses } from '@/components/ui/constants';

const SecuritySettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { appSettings, updateAppSettings } = useAppStore();
    const [policy, setPolicy] = useState(appSettings!.passwordPolicy);

    const handleSave = () => {
        updateAppSettings({ ...appSettings!, passwordPolicy: policy });
        toast.success(t('settingsUpdated'));
    };

    const handleToggle = (field: keyof typeof policy) => {
        setPolicy(p => ({ ...p, [field]: !p[field] }));
    };

    return (
        <SettingsCard
            title={t('passwordPolicy')}
            description={t('passwordPolicyDescription')}
            footer={<button onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700">{t('saveChanges')}</button>}
        >
            <div>
                <label htmlFor="minLength" className={labelClasses}>{t('minLength')}</label>
                <input
                    type="number"
                    id="minLength"
                    value={policy.minLength}
                    onChange={e => setPolicy(p => ({ ...p, minLength: parseInt(e.target.value, 10) || 8 }))}
                    className={`${inputClasses} w-24`}
                />
            </div>
            <ToggleSwitch
                label={t('requireUppercase')}
                enabled={policy.requireUppercase}
                setEnabled={() => handleToggle('requireUppercase')}
            />
            <ToggleSwitch
                label={t('requireNumber')}
                enabled={policy.requireNumber}
                setEnabled={() => handleToggle('requireNumber')}
            />
            <ToggleSwitch
                label={t('requireSymbol')}
                enabled={policy.requireSymbol}
                setEnabled={() => handleToggle('requireSymbol')}
            />
        </SettingsCard>
    );
};

export default SecuritySettingsPage;
