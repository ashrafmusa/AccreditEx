import React from 'react';
import { CAPAReport, Project, User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { ExclamationTriangleIcon } from '../icons';

interface CapaListItemProps {
  capa: CAPAReport;
  project?: Project;
  assignee?: User;
}

const CapaListItem: React.FC<CapaListItemProps> = ({ capa, project, assignee }) => {
  const { t } = useTranslation();
  const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date();
  
  return (
    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-dark-brand-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-grow">
          <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{capa.description}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t('inProject')} <span className="font-medium">{project?.name || 'N/A'}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs sm:text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary ltr:sm:pl-8 rtl:sm:pr-8 flex-shrink-0">
        <span className="font-medium">{assignee?.name || t('unassigned')}</span>
        {capa.dueDate && <span className={isOverdue ? 'font-bold text-red-500' : ''}>{t('dueDate')}: {new Date(capa.dueDate).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};

export default CapaListItem;