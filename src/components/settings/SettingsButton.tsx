import React, { FC, ReactNode } from 'react';

interface SettingsButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: FC<{ className: string }>;
}

const SettingsButton: FC<SettingsButtonProps> = ({ 
  onClick, 
  disabled = false, 
  loading = false, 
  variant = 'primary',
  size = 'md',
  children,
  icon: Icon
}) => {
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2.5 px-6 text-sm',
    lg: 'py-3 px-8 text-base'
  };

  const variantClasses = {
    primary: disabled || loading 
      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' 
      : 'bg-brand-primary hover:bg-indigo-700 text-white shadow-md hover:shadow-lg active:scale-95',
    secondary: disabled 
      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' 
      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: disabled 
      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' 
      : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 gap-2 cursor-pointer ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled || loading ? 'cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export { SettingsButton };
export default SettingsButton;
