import React, { FC } from 'react';

interface ToggleSwitchProps {
  label: string;
  description?: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({ label, description, enabled, setEnabled }) => {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </span>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`${
          enabled ? "bg-brand-primary" : "bg-gray-300 dark:bg-gray-600"
        } relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:ring-offset-gray-800 ml-4 shadow-sm hover:shadow-md active:scale-95`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`${
            enabled ? "translate-x-5" : "translate-x-0.5"
          } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out`}
        />
      </button>
    </div>
  );
};

export { ToggleSwitch };
export default ToggleSwitch;
