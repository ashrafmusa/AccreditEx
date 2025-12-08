import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CheckIcon } from '@/components/icons';

interface ReadReceiptProps {
  status: 'sent' | 'delivered' | 'read';
  timestamp?: Date;
  showTime?: boolean;
  size?: 'sm' | 'md';
}

const ReadReceipt: React.FC<ReadReceiptProps> = ({
  status,
  timestamp,
  showTime = false,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  const getStatusColor = () => {
    switch (status) {
      case 'sent':
        return 'text-gray-400 dark:text-gray-600';
      case 'delivered':
        return 'text-blue-500 dark:text-blue-400';
      case 'read':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-400 dark:text-gray-600';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'sent':
        return t('sent');
      case 'delivered':
        return t('delivered');
      case 'read':
        return t('read');
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-1">
      {status === 'read' ? (
        <div className="flex">
          <CheckIcon className={`${iconSize} ${getStatusColor()}`} />
          <CheckIcon className={`${iconSize} ${getStatusColor()} -ml-1.5`} />
        </div>
      ) : (
        <CheckIcon className={`${iconSize} ${getStatusColor()}`} />
      )}
      {showTime && timestamp && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
      <span className={`text-xs ${getStatusColor()} font-medium`}>{getStatusLabel()}</span>
    </div>
  );
};

export { ReadReceipt };
export default ReadReceipt;
