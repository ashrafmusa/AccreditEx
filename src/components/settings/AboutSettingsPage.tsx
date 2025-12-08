import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import SettingsCard from './SettingsCard';
import SettingsSection from "./SettingsSection";

const AboutSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <SettingsCard
        title={t("about")}
        description="Information about AccreditEx"
      >
        <div className="space-y-8">
          <SettingsSection
            title="AccreditEx"
            description="Healthcare Accreditation Management Platform"
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("appVersion")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  1.0.0
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  About
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A centralized platform to support healthcare institutions
                  throughout their accreditation journey, streamlining project
                  management, ensuring traceability, and maintaining compliance.
                </p>
              </div>
            </div>
          </SettingsSection>
        </div>
      </SettingsCard>
    </div>
  );
};

export default AboutSettingsPage;