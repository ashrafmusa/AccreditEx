/**
 * Enhanced Settings Panel Component
 * Provides a unified container with consistent styling and behavior
 */

import React from 'react';
import { ChevronRightIcon } from '@/components/icons';

interface SettingsPanelProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'danger' | 'success';
  collapsible?: boolean;
  defaultOpen?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  title,
  description,
  icon: Icon,
  children,
  variant = 'default',
  collapsible = false,
  defaultOpen = true,
  footer,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const variantClasses = {
    default: 'bg-white border-gray-200 hover:bg-gray-50',
    accent: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    danger: 'bg-red-50 border-red-200 hover:bg-red-100',
    success: 'bg-green-50 border-green-200 hover:bg-green-100',
  };

  const headerClasses = {
    default: 'text-gray-900',
    accent: 'text-blue-900',
    danger: 'text-red-900',
    success: 'text-green-900',
  };

  const descriptionClasses = {
    default: 'text-gray-600',
    accent: 'text-blue-700',
    danger: 'text-red-700',
    success: 'text-green-700',
  };

  return (
    <div
      className={`border rounded-lg transition-all ${variantClasses[variant]} ${className}`}
    >
      {/* Header */}
      <div
        className={`p-4 sm:p-6 flex items-start justify-between ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-start gap-3 flex-1">
          {Icon && (
            <div className={`flex-shrink-0 mt-1 ${headerClasses[variant]}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${headerClasses[variant]}`}>
              {title}
            </h3>
            {description && (
              <p className={`text-sm ${descriptionClasses[variant]} mt-1`}>
                {description}
              </p>
            )}
          </div>
        </div>

        {collapsible && (
          <button
            className={`flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-transform ${
              isOpen ? '' : '-rotate-90'
            }`}
            aria-expanded={isOpen}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      {(!collapsible || isOpen) && (
        <>
          <div
            className={`px-4 sm:px-6 ${
              collapsible && isOpen ? 'border-t border-current border-opacity-10' : ''
            }`}
          >
            <div className="py-4 space-y-4">{children}</div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-4 sm:px-6 py-4 border-t border-current border-opacity-10 bg-gray-50 rounded-b-lg">
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  );
};
