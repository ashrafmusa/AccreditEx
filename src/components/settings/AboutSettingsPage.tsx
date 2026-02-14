import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
import SettingsCard from "./SettingsCard";
import SettingsSection from "./SettingsSection";

const AboutSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <SettingsCard title={t("about")} description={t("aboutDescription")}>
        <div className="space-y-8">
          <SettingsSection title={t("appName")} description={t("appTagline")}>
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
                  {t("about")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("aboutParagraph")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("buildDate")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("license")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  MIT
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
