/**
 * SkeletonLoader Component
 *
 * Provides skeleton loading states for various UI elements while data is being fetched.
 * Improves perceived performance by showing placeholder content instead of blank screens.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import React from "react";

interface SkeletonLoaderProps {
  /** Type of skeleton to display */
  variant?: "text" | "rectangular" | "circular" | "table" | "card" | "list";
  /** Width of the skeleton (CSS value or number in pixels) */
  width?: string | number;
  /** Height of the skeleton (CSS value or number in pixels) */
  height?: string | number;
  /** Number of rows for table variant */
  rows?: number;
  /** Number of items for list variant */
  items?: number;
  /** Additional CSS classes */
  className?: string;
  /** Animation style */
  animation?: "pulse" | "wave" | "none";
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "rectangular",
  width,
  height,
  rows = 5,
  items = 3,
  className = "",
  animation = "pulse",
}) => {
  // Convert numeric values to px
  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  // Animation classes
  const animationClass =
    animation === "pulse"
      ? "animate-pulse"
      : animation === "wave"
      ? "animate-shimmer"
      : "";

  // Base skeleton class
  const baseClass = `bg-gray-200 dark:bg-gray-700 ${animationClass} ${className}`;

  // Text skeleton (single line)
  if (variant === "text") {
    return (
      <div
        className={`${baseClass} rounded h-4`}
        style={{ width: widthStyle || "100%" }}
      />
    );
  }

  // Circular skeleton (avatars, icons)
  if (variant === "circular") {
    const size = width || height || 40;
    return (
      <div
        className={`${baseClass} rounded-full`}
        style={{
          width: typeof size === "number" ? `${size}px` : size,
          height: typeof size === "number" ? `${size}px` : size,
        }}
      />
    );
  }

  // Card skeleton
  if (variant === "card") {
    return (
      <div
        className={`border border-gray-200 dark:border-dark-brand-border rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className={`${baseClass} rounded-full w-10 h-10`} />
          <div className="flex-1">
            <div className={`${baseClass} rounded h-4 w-3/4 mb-2`} />
            <div className={`${baseClass} rounded h-3 w-1/2`} />
          </div>
        </div>
        <div className={`${baseClass} rounded h-24 w-full mb-3`} />
        <div className={`${baseClass} rounded h-3 w-full mb-2`} />
        <div className={`${baseClass} rounded h-3 w-4/5`} />
      </div>
    );
  }

  // List skeleton
  if (variant === "list") {
    return (
      <div className={className}>
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 mb-4">
            <div className={`${baseClass} rounded-full w-8 h-8`} />
            <div className="flex-1">
              <div className={`${baseClass} rounded h-4 w-2/3 mb-2`} />
              <div className={`${baseClass} rounded h-3 w-1/3`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table skeleton
  if (variant === "table") {
    return (
      <div
        className={`border border-gray-200 dark:border-dark-brand-border rounded-lg overflow-hidden ${className}`}
      >
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 flex space-x-4">
          <div className={`${baseClass} rounded h-4 w-1/6`} />
          <div className={`${baseClass} rounded h-4 w-1/4`} />
          <div className={`${baseClass} rounded h-4 w-1/5`} />
          <div className={`${baseClass} rounded h-4 w-1/6`} />
          <div className={`${baseClass} rounded h-4 w-1/6`} />
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="p-4 flex space-x-4 border-t border-gray-200 dark:border-dark-brand-border"
          >
            <div className={`${baseClass} rounded h-4 w-1/6`} />
            <div className={`${baseClass} rounded h-4 w-1/4`} />
            <div className={`${baseClass} rounded h-4 w-1/5`} />
            <div className={`${baseClass} rounded h-4 w-1/6`} />
            <div className={`${baseClass} rounded h-4 w-1/6`} />
          </div>
        ))}
      </div>
    );
  }

  // Rectangular skeleton (default)
  return (
    <div
      className={`${baseClass} rounded`}
      style={{
        width: widthStyle || "100%",
        height: heightStyle || 200,
      }}
    />
  );
};

export default SkeletonLoader;

/**
 * Usage Examples:
 *
 * // Text skeleton
 * <SkeletonLoader variant="text" width="80%" />
 *
 * // Circular avatar skeleton
 * <SkeletonLoader variant="circular" width={48} height={48} />
 *
 * // Card skeleton
 * <SkeletonLoader variant="card" />
 *
 * // List skeleton with 5 items
 * <SkeletonLoader variant="list" items={5} />
 *
 * // Table skeleton with 10 rows
 * <SkeletonLoader variant="table" rows={10} />
 *
 * // Custom rectangular skeleton
 * <SkeletonLoader variant="rectangular" width={300} height={200} />
 */
