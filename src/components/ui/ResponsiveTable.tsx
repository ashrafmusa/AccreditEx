import React, { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  headers: string[];
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  headers,
  mobileBreakpoint = 'md' 
}) => {
  const breakpointClass = {
    sm: 'sm:table',
    md: 'md:table',
    lg: 'lg:table'
  }[mobileBreakpoint];

  return (
    <div className="overflow-x-auto">
      <div className={`${breakpointClass} hidden w-full`}>
        {children}
      </div>
      {/* Mobile view - cards */}
      <div className={`${breakpointClass.replace('table', 'hidden')} space-y-4`}>
        {/* Mobile cards will be rendered by parent component */}
      </div>
    </div>
  );
};

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};
