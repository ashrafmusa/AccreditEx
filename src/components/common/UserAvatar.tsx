import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { getInitials } from '@/utils/getInitials';
import { getAvatarColor } from '@/utils/getAvatarColor';
import { CheckCircleIcon } from '../icons';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface UserAvatarProps {
  user: User | null;
  size?: AvatarSize;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', status: 'p-0.5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'p-0.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'p-1' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'p-1' },
  xl: { container: 'w-16 h-16', text: 'text-lg', status: 'p-1.5' },
  xxl: { container: 'w-24 h-24', text: 'text-2xl', status: 'p-2' },
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showStatus = false,
  className = '',
  onClick,
  ariaLabel = 'User avatar',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!user) {
    return (
      <div
        className={`${sizeClasses[size].container} rounded-full bg-gray-300 dark:bg-gray-600 ${className}`}
        role="img"
        aria-label={ariaLabel}
      />
    );
  }

  const initials = getInitials(user.name);
  const bgColor = getAvatarColor(user.id, user.name);
  const hasImage = user.avatarUrl && !imageError;
  const sizeClass = sizeClasses[size];
  const isClickable = onClick ? 'cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-brand-primary transition-all' : '';
  const ringClass = isClickable ? 'ring-2 ring-white dark:ring-gray-800' : '';

  return (
    <div
      className={`relative inline-block ${sizeClass.container} rounded-full overflow-hidden flex-shrink-0 ${isClickable} ${ringClass} ${className}`}
      onClick={onClick}
      style={hasImage ? {} : { backgroundColor: bgColor }}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Image */}
      {hasImage && (
        <img
          src={user.avatarUrl}
          alt={user.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Initials Fallback */}
      {!hasImage && (
        <div className={`w-full h-full flex items-center justify-center font-bold text-white ${sizeClass.text}`}>
          {initials}
        </div>
      )}

      {/* Loading Skeleton */}
      {hasImage && !imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* Status Indicator */}
      {showStatus && (
        <div className={`absolute -bottom-1 -right-1 ${sizeClass.status} bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800 flex items-center justify-center`}>
          <CheckCircleIcon className={`${size === 'xs' || size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
