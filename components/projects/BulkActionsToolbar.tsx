import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { TrashIcon, ArchiveBoxIcon, CheckIcon, XMarkIcon } from '@/components/icons';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkArchive: () => void;
  onBulkRestore: () => void;
  onBulkDelete: () => void;
  onBulkUpdateStatus: () => void;
  showRestore?: boolean;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkArchive,
  onBulkRestore,
  onBulkDelete,
  onBulkUpdateStatus,
  showRestore = false
}) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Selected Count */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-semibold text-sm">
              {selectedCount}
            </div>
            <span className="text-sm font-medium dark:text-dark-brand-text-primary">
              {selectedCount === 1 ? t('projectSelected') : t('projectsSelected', { count: selectedCount })}
            </span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {showRestore ? (
              <button
                onClick={onBulkRestore}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                {t('restore')}
              </button>
            ) : (
              <button
                onClick={onBulkArchive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                {t('archive')}
              </button>
            )}

            <button
              onClick={onBulkUpdateStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              {t('updateStatus')}
            </button>

            <button
              onClick={onBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              {t('delete')}
            </button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={t('clearSelection')}
          >
            <XMarkIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
