import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import SettingsCard from './SettingsCard';

const AboutSettingsPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <SettingsCard title={t('about')} description="">
            <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">AccreditEx</p>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('appVersion')} 1.0.0</p>
            <p className="mt-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">A centralized platform to support healthcare institutions throughout their accreditation journey, streamlining project management, ensuring traceability, and maintaining compliance.</p>
        </SettingsCard>
    );
};

export default AboutSettingsPage;