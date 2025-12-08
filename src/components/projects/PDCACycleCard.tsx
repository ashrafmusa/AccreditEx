import React from 'react';
import { CAPAReport, PDCACycle, PDCAStage } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { ClockIcon, UserIcon, FlagIcon } from '../icons';

interface PDCACycleCardProps {
  item: CAPAReport | PDCACycle;
  type: 'capa' | 'cycle';
  onView: () => void;
  onAdvanceStage?: () => void;
}

const PDCACycleCard: React.FC<PDCACycleCardProps> = ({ item, type, onView, onAdvanceStage }) => {
  const { t } = useTranslation();

  // Determine current stage
  const currentStage: PDCAStage = type === 'capa' 
    ? (item as CAPAReport).pdcaStage || 'Plan'
    : (item as PDCACycle).currentStage;

  // Get stage color
  const getStageColor = (stage: PDCAStage) => {
    switch (stage) {
      case 'Plan': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500';
      case 'Do': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500';
      case 'Check': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-500';
      case 'Act': return 'bg-green-100 dark:bg-green-900/20 border-green-500';
      case 'Completed': return 'bg-gray-100 dark:bg-gray-800 border-gray-400';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-400';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Extract data based on type
  const title = type === 'capa' 
    ? (item as CAPAReport).description 
    : (item as PDCACycle).title;
  
  const owner = type === 'capa'
    ? (item as CAPAReport).assignedTo
    : (item as PDCACycle).owner;

  const dueDate = type === 'capa'
    ? (item as CAPAReport).dueDate
    : (item as PDCACycle).targetCompletionDate;

  const priority = type === 'cycle' 
    ? (item as PDCACycle).priority 
    : 'Medium'; // Default for CAPAs

  // Calculate days until due
  const getDaysUntilDue = (date: string) => {
    const due = new Date(date);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(dueDate);
  const isOverdue = daysUntilDue < 0;

  return (
    <div 
      className={`${getStageColor(currentStage)} border-l-4 rounded-lg p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200`}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary line-clamp-2 flex-1">
          {title}
        </h4>
        {type === 'cycle' && (
          <span className={`${getPriorityColor(priority)} text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0`}>
            {priority}
          </span>
        )}
      </div>

      {/* Type Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {type === 'capa' ? (
            <>
              <FlagIcon className="h-3 w-3 mr-1" />
              {(item as CAPAReport).type} CAPA
            </>
          ) : (
            <>
              <FlagIcon className="h-3 w-3 mr-1" />
              {(item as PDCACycle).category}
            </>
          )}
        </span>
      </div>

      {/* Owner & Due Date */}
      <div className="flex items-center justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
        <div className="flex items-center">
          <UserIcon className="h-3 w-3 mr-1" />
          <span className="truncate max-w-[100px]">{owner || t('unassigned')}</span>
        </div>
        <div className={`flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
          <ClockIcon className="h-3 w-3 mr-1" />
          <span>
            {isOverdue 
              ? `${Math.abs(daysUntilDue)}d ${t('overdue')}`
              : `${daysUntilDue}d`
            }
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      {type === 'capa' && (item as CAPAReport).pdcaHistory && (item as CAPAReport).pdcaHistory!.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border dark:border-dark-brand-border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t('progress')}
            </span>
            <span className="text-brand-text-primary dark:text-dark-brand-text-primary font-semibold">
              {Math.round(((item as CAPAReport).pdcaHistory!.length / 4) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-brand-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((item as CAPAReport).pdcaHistory!.length / 4) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {onAdvanceStage && currentStage !== 'Completed' && (
        <div className="mt-3 pt-3 border-t border-brand-border dark:border-dark-brand-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage();
            }}
            className="w-full text-xs py-1.5 px-3 rounded bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors duration-200"
          >
            {t('advanceToNextStage')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PDCACycleCard;
