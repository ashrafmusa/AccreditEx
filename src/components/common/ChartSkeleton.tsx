import React, { FC } from 'react';

interface ChartSkeletonProps {
  height?: string;
  lines?: number;
}

const ChartSkeleton: FC<ChartSkeletonProps> = ({ height = '300px', lines = 5 }) => {
  return (
    <div
      className="bg-brand-surface dark:bg-dark-brand-surface p-5 rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border"
      style={{ height }}
    >
      <div className="animate-pulse h-full flex flex-col justify-between">
        {/* Title skeleton */}
        <div className="h-6 w-40 bg-brand-border dark:bg-dark-brand-border rounded mb-4" />
        
        {/* Chart area skeleton with lines */}
        <div className="flex-1 space-y-3 mb-4">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className="h-8 bg-brand-border dark:bg-dark-brand-border rounded"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>
        
        {/* Legend skeleton */}
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-border dark:bg-dark-brand-border rounded" />
              <div className="h-4 w-20 bg-brand-border dark:bg-dark-brand-border rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartSkeleton;
