/**
 * Enhanced Toggle Switch Component
 * Advanced toggle with labels, descriptions, and disabled states
 */

import React from 'react';

interface AdvancedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'amber';
  showLabels?: boolean;
  onLabel?: string;
  offLabel?: string;
  id?: string;
  className?: string;
}

export const AdvancedToggle: React.FC<AdvancedToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  color = 'blue',
  showLabels = false,
  onLabel = 'On',
  offLabel = 'Off',
  id,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-8 w-14',
  };

  const toggleClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-6' : 'translate-x-0.5',
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-rose-600',
    amber: 'bg-amber-600',
  };

  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        {/* Toggle Button */}
        <button
          id={id}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          className={`relative inline-flex flex-shrink-0 ${sizeClasses[size]} ${
            checked ? colorClasses[color] : 'bg-gray-300'
          } rounded-full transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500`}
        >
          <span
            className={`pointer-events-none inline-block ${toggleClasses[size]} transform rounded-full bg-white shadow transition-transform ${
              translateClasses[size]
            }`}
          />

          {/* Inner Labels */}
          {showLabels && (
            <>
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs font-semibold transition-opacity ${
                  checked ? 'opacity-0' : 'opacity-100'
                } text-gray-700 pointer-events-none`}
              >
                {offLabel}
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs font-semibold transition-opacity ${
                  checked ? 'opacity-100' : 'opacity-0'
                } text-white pointer-events-none`}
              >
                {onLabel}
              </span>
            </>
          )}
        </button>

        {/* Label & Description */}
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={id}
                className={`text-sm font-medium text-gray-900 block ${
                  disabled ? 'opacity-50' : 'cursor-pointer'
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
