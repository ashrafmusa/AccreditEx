import React, { useState } from 'react';
import { Standard } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { ChevronDownIcon, PencilIcon, TrashIcon, DocumentIcon } from '../icons';

interface StandardAccordionProps { 
  standard: Standard; 
  canModify: boolean; 
  onEdit: () => void;
  onDelete: () => void;
}

const StandardAccordion: React.FC<StandardAccordionProps> = ({ standard, canModify, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const { t } = useTranslation();
  
  const hasSubStandards = standard.subStandards && standard.subStandards.length > 0;
  const hasDocuments = standard.documents && standard.documents.length > 0;

  return (
    <div className={`bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border dark:border-dark-brand-border`}>
      <div
        className="w-full text-left p-5 focus:outline-none flex justify-between items-start gap-4"
      >
        <div className='flex-grow'>
          <p className="font-bold text-brand-primary dark:text-indigo-400">{standard.standardId}</p>
          <p className="mt-2 text-brand-text-primary dark:text-dark-brand-text-primary text-left">{standard.description}</p>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
              {standard.totalMeasures && (
                <span className="text-xs font-semibold text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">
                  {t('totalMeasures')}: {standard.totalMeasures}
                </span>
              )}
              {hasDocuments && (
                <span className="text-xs font-semibold text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                  <DocumentIcon className="w-3 h-3" />
                  {t('documents') || 'Guides'}: {standard.documents?.length || 0}
                </span>
              )}
              {hasSubStandards && (
                  <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center text-sm text-brand-primary font-medium">
                  <span>{t('subStandards')} ({standard.subStandards.length})</span>
                  <ChevronDownIcon className={`h-5 w-5 ltr:ml-1 rtl:mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
              )}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end space-y-2">
            {hasDocuments && (
              <button onClick={() => setShowDocuments(!showDocuments)} className="text-xs text-green-600 dark:text-green-400 hover:underline">
                {showDocuments ? '▼' : '▶'} {t('guides') || 'Guides'}
              </button>
            )}
            {canModify && (
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <button onClick={onEdit} className="p-1 text-gray-500 dark:text-gray-400 hover:text-brand-primary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={t('editStandard')}><PencilIcon className="w-4 h-4"/></button>
                    <button onClick={onDelete} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={t('deleteStandard')}><TrashIcon className="w-4 h-4"/></button>
                </div>
            )}
        </div>
      </div>
      
      {showDocuments && hasDocuments && (
        <div className="px-5 pb-5 border-t border-gray-200 dark:border-dark-brand-border mt-2 pt-4 bg-green-50 dark:bg-green-900/10">
          <div className="space-y-2">
            {standard.documents?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-green-200 dark:border-green-700">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.fileName}</p>
                  {doc.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{doc.description}</p>
                  )}
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0 ltr:ml-2 rtl:mr-2"
                >
                  {t('download') || 'Download'}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSubStandards && isExpanded && (
        <div id={`substandards-${standard.standardId}`} className="px-5 pb-5 border-t border-gray-200 dark:border-dark-brand-border mt-2 pt-4">
          <ul className="space-y-3 list-disc ltr:list-inside rtl:list-inside marker:text-brand-primary">
            {standard.subStandards.map((sub) => (
              <li key={sub.id} className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                <span className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary ltr:mr-1 rtl:ml-1">{sub.id}:</span> {sub.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StandardAccordion;