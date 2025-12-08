import React, { FC } from 'react';

interface StatCardSkeletonProps {
  count?: number;
}

const StatCardSkeleton: FC<StatCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-brand-surface dark:bg-dark-brand-surface p-5 rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border animate-pulse"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-4 w-24 bg-brand-border dark:bg-dark-brand-border rounded mb-2" />
              
              {/* Value skeleton */}
              <div className="h-8 w-32 bg-brand-border dark:bg-dark-brand-border rounded mb-2" />
              
              {/* Subtitle skeleton */}
              <div className="h-3 w-40 bg-brand-border dark:bg-dark-brand-border rounded" />
            </div>
            
            {/* Icon skeleton */}
            <div className="w-12 h-12 bg-brand-border dark:bg-dark-brand-border rounded-lg" />
          </div>

          {/* Sparkline skeleton */}
          <div className="mt-3 h-8 bg-brand-border dark:bg-dark-brand-border rounded" />
        </div>
      ))}
    </>
  );
};

export default StatCardSkeleton;
