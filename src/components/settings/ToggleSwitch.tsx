import React, { FC } from "react";

interface ToggleSwitchProps {
  label: string;
  description?: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled?: boolean;
  badge?: string;
  icon?: FC<{ className: string }>;
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({
  label,
  description,
  enabled,
  setEnabled,
  disabled = false,
  badge,
  icon: Icon,
}) => {
  return (
    <div
      className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
        enabled
          ? "bg-brand-primary/5 border-brand-primary/20 dark:bg-brand-primary/10 dark:border-brand-primary/30"
          : "bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      } ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-sm cursor-pointer"
      }`}
      onClick={() => !disabled && setEnabled(!enabled)}
    >
      <div className="flex-1 flex items-start gap-3">
        {Icon && (
          <div
            className={`p-2 rounded-lg transition-colors ${
              enabled
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {label}
            </span>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-brand-primary/10 text-brand-primary">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setEnabled(!enabled);
        }}
        disabled={disabled}
        className={`${
          enabled ? "bg-brand-primary" : "bg-gray-300 dark:bg-gray-600"
        } relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:ring-offset-gray-900 ml-4 shadow-sm hover:shadow-md ${
          !disabled && "active:scale-95"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        aria-label={`Toggle ${label}`}
        aria-checked={enabled}
        role="switch"
      >
        <span
          className={`${
            enabled ? "translate-x-5" : "translate-x-0.5"
          } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out flex items-center justify-center`}
        >
          {enabled && (
            <svg
              className="w-3 h-3 text-brand-primary"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
};

export { ToggleSwitch };
export default ToggleSwitch;
