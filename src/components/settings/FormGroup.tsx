/**
 * Enhanced Form Group Component
 * Unified form field container with consistent styling and validation
 */

import React from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon } from '@/components/icons';

interface FormGroupProps {
  label: string;
  description?: string;
  error?: string;
  success?: string;
  info?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  layout?: 'vertical' | 'horizontal';
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  description,
  error,
  success,
  info,
  required = false,
  htmlFor,
  children,
  className = '',
  layout = 'vertical',
}) => {
  const isHorizontal = layout === 'horizontal';

  return (
    <div
      className={`${isHorizontal ? 'flex items-start gap-4' : ''} ${className}`}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className={`${
            isHorizontal ? 'w-32 flex-shrink-0 pt-2' : 'block'
          } text-sm font-medium text-gray-900`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Content Wrapper */}
      <div className={isHorizontal ? 'flex-1' : ''}>
        {/* Description (before input) */}
        {description && !isHorizontal && (
          <p className="text-sm text-gray-600 mb-2">{description}</p>
        )}

        {/* Input/Control */}
        {children}

        {/* Messages (after input) */}
        <div className="mt-2 space-y-1">
          {error && (
            <div className="flex items-start gap-2 text-red-600">
              <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{error}</span>
            </div>
          )}

          {success && !error && (
            <div className="flex items-start gap-2 text-green-600">
              <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{success}</span>
            </div>
          )}

          {info && !error && !success && (
            <div className="flex items-start gap-2 text-blue-600">
              <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{info}</span>
            </div>
          )}
        </div>

        {/* Description (horizontal) */}
        {description && isHorizontal && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};
