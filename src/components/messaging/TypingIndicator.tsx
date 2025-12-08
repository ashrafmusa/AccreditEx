import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface TypingIndicatorProps {
  userName: string;
  show: boolean;
  size?: 'sm' | 'md';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName, show, size = 'md' }) => {
  const { t } = useTranslation();
  if (!show) return null;

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const spacing = size === 'sm' ? 'gap-1' : 'gap-1.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center ${spacing}`}>
      <p className={`${textSize} text-gray-500 dark:text-gray-400 italic`}>
        {t('isTyping', { name: userName })}
      </p>
      <div className={`flex ${spacing}`}>
        <div
          className={`${dotSize} bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce`}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={`${dotSize} bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce`}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={`${dotSize} bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce`}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
};

export { TypingIndicator };
export default TypingIndicator;
