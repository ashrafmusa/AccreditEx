import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { TrashIcon, DocumentTextIcon, CheckIcon } from '@/components/icons';
import UserAvatar from '../common/UserAvatar';
import { User } from '@/types';

interface MessageBubbleProps {
  content: string;
  sender: User;
  isOwn: boolean;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  onDelete?: () => void;
  onReply?: () => void;
  attachments?: string[];
  mentions?: string[];
  showAvatar?: boolean;
  showName?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  sender,
  isOwn,
  timestamp,
  status = 'read',
  onDelete,
  onReply,
  attachments = [],
  mentions = [],
  showAvatar = true,
  showName = false,
}) => {
  const [hovered, setHovered] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'sent':
        return 'text-gray-400 dark:text-gray-600';
      case 'delivered':
        return 'text-blue-500 dark:text-blue-400';
      case 'read':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderStatusIcon = () => {
    if (status === 'read') {
      return (
        <div className="flex">
          <CheckIcon className="w-3 h-3" />
          <CheckIcon className="w-3 h-3 -ml-1.5" />
        </div>
      );
    }
    return <CheckIcon className="w-3 h-3" />;
  };

  return (
    <div
      className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <UserAvatar user={sender} size="sm" ariaLabel={`${sender.name} avatar`} />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
        {showName && (
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3">
            {sender.name}
          </p>
        )}

        <div
          className={`px-4 py-2.5 rounded-lg transition-all ${
            isOwn
              ? 'bg-brand-primary text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          {mentions.length > 0 && (
            <div className="text-xs mb-1 opacity-75">
              {mentions.map((mention) => (
                <span key={mention} className="font-semibold">
                  @{mention}{' '}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>

          {attachments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-current border-opacity-20 space-y-1">
              {attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs underline opacity-80 hover:opacity-100"
                >
                  <DocumentTextIcon className="w-3 h-3" />
                  {attachment.split('/').pop()}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp and Status */}
        <div
          className={`flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-3 ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwn && (
            <div className={getStatusColor()}>
              {renderStatusIcon()}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {hovered && (
        <div className="flex items-center gap-1">
          {onReply && (
            <button
              onClick={onReply}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Reply"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l-6-6"
                />
              </svg>
            </button>
          )}
          {onDelete && isOwn && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export { MessageBubble };
export default MessageBubble;
