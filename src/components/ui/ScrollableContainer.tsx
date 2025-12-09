import React, { ReactNode } from 'react';

interface ScrollableContainerProps {
  children: ReactNode;
  maxHeight?: string;
  className?: string;
}

export const ScrollableContainer: React.FC<ScrollableContainerProps> = ({ 
  children, 
  maxHeight = 'max-h-96',
  className = '' 
}) => {
  return (
    <div className={`overflow-y-auto ${maxHeight} ${className}`}>
      {children}
    </div>
  );
};

interface TableContainerProps {
  children: ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      {children}
    </div>
  );
};
