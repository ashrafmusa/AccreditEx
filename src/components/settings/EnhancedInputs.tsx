/**
 * Enhanced Input Components
 * TextInput, Select, and other form inputs with consistent styling
 */

import React from 'react';
import { ChevronDownIcon } from '@/components/icons';

// ============= Enhanced Text Input =============
interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  onIconClick?: () => void;
  valid?: boolean;
  invalid?: boolean;
}

export const EnhancedInput = React.forwardRef<
  HTMLInputElement,
  EnhancedInputProps
>(
  (
    {
      icon: LeftIcon,
      rightIcon: RightIcon,
      onIconClick,
      valid = false,
      invalid = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const borderClass = invalid
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : valid
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    return (
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 ${LeftIcon ? 'pl-10' : ''} ${
            RightIcon ? 'pr-10' : ''
          } bg-white border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${borderClass} ${className}`}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0"
            tabIndex={-1}
          >
            <RightIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
);
EnhancedInput.displayName = 'EnhancedInput';

// ============= Enhanced Select =============
interface Option {
  value: string | number;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface EnhancedSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: Option[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  valid?: boolean;
  invalid?: boolean;
}

export const EnhancedSelect = React.forwardRef<
  HTMLSelectElement,
  EnhancedSelectProps
>(
  (
    {
      options,
      placeholder,
      icon: LeftIcon,
      valid = false,
      invalid = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const borderClass = invalid
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : valid
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    return (
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-2 ${LeftIcon ? 'pl-10' : ''} pr-10 bg-white border rounded-lg text-sm appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${borderClass} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>
    );
  }
);
EnhancedSelect.displayName = 'EnhancedSelect';

// ============= Enhanced Textarea =============
interface EnhancedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  valid?: boolean;
  invalid?: boolean;
  characterLimit?: number;
}

export const EnhancedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  EnhancedTextareaProps
>(
  (
    {
      valid = false,
      invalid = false,
      characterLimit,
      className = '',
      value,
      ...props
    },
    ref
  ) => {
    const borderClass = invalid
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : valid
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    const charCount = typeof value === 'string' ? value.length : 0;
    const isLimitExceeded = characterLimit && charCount > characterLimit;

    return (
      <div>
        <textarea
          ref={ref}
          className={`w-full px-4 py-2 bg-white border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none ${borderClass} ${className}`}
          value={value}
          {...props}
        />
        {characterLimit && (
          <div
            className={`text-xs mt-1 ${
              isLimitExceeded ? 'text-red-600 font-semibold' : 'text-gray-500'
            }`}
          >
            {charCount} / {characterLimit}
          </div>
        )}
      </div>
    );
  }
);
EnhancedTextarea.displayName = 'EnhancedTextarea';

// ============= Slider Input =============
interface SliderInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  unit?: string;
  color?: 'blue' | 'green' | 'red' | 'amber';
}

export const SliderInput: React.FC<SliderInputProps> = ({
  min,
  max,
  step = 1,
  showValue = true,
  unit = '',
  color = 'blue',
  value,
  className = '',
  ...props
}) => {
  const colorClasses = {
    blue: 'accent-blue-600',
    green: 'accent-green-600',
    red: 'accent-red-600',
    amber: 'accent-amber-600',
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClasses[color]}`}
          {...props}
        />
        {showValue && (
          <div className="text-sm font-medium text-gray-900 min-w-16 text-right">
            {value}
            {unit}
          </div>
        )}
      </div>
    </div>
  );
};
