import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { IntegrationDashboard } from "@/components/his-integration";
import { ServerStackIcon } from "@/components/icons";

const HISIntegrationSettingsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <ServerStackIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {t("hisIntegration") || "HIS Integration"}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("hisIntegrationDescription") ||
              "Connect your healthcare information system to AccreditEx for seamless data synchronization"}
          </p>
        </div>
      </div>

      {/* HIS Integration Dashboard */}
      <IntegrationDashboard />
    </div>
  );
};

export default HISIntegrationSettingsPage;
