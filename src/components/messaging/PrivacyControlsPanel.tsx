import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@/components/icons";

interface PrivacyControlsPanelProps {
  isUserBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onReport?: () => void;
  userName: string;
  showEncryptionIndicator?: boolean;
  isEncrypted?: boolean;
}

const PrivacyControlsPanel: React.FC<PrivacyControlsPanelProps> = ({
  isUserBlocked,
  onBlock,
  onUnblock,
  onReport,
  userName,
  showEncryptionIndicator = true,
  isEncrypted = false,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Encryption Indicator */}
      {showEncryptionIndicator && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {isEncrypted ? t("encryptionEnabled") : t("encryptionDisabled")}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {isEncrypted ? t("encryptionEnabled") : t("privacyControls")}
            </p>
          </div>
        </div>
      )}

      {/* User Blocking */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("block")}
        </h4>
        {isUserBlocked ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                {userName} {t("userBlocked").toLowerCase()}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {t("blockedUsers")}
              </p>
            </div>
            <button
              onClick={onUnblock}
              className="px-3 py-1.5 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded hover:bg-red-300 dark:hover:bg-red-700 transition-colors text-xs font-medium whitespace-nowrap"
            >
              {t("unblock")}
            </button>
          </div>
        ) : (
          <button
            onClick={onBlock}
            className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm"
          >
            <XMarkIcon className="w-4 h-4 inline mr-2" />
            {t("block")} {userName}
          </button>
        )}
      </div>

      {/* Report User */}
      {onReport && (
        <button
          onClick={onReport}
          className="w-full px-4 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors font-medium text-sm"
        >
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
          {t("report")} {userName}
        </button>
      )}

      {/* Privacy Notice */}
      <p className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        💡 {t("privacyTip")}
      </p>
    </div>
  );
};

export { PrivacyControlsPanel };
export default PrivacyControlsPanel;
