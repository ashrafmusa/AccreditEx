import React from 'react';
import { NavigationState } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserStore } from '@/stores/useUserStore';
import { PlusIcon, ClipboardDocumentCheckIcon } from '@/components/icons';

interface DashboardHeaderProps {
  setNavigation: (state: NavigationState) => void;
  title: string;
  greeting: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ setNavigation, title, greeting }) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();

  if (!currentUser) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-slate-800 dark:via-dark-brand-surface dark:to-slate-800 p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-brand-text-primary dark:text-dark-brand-text-primary">{title.replace('{name}', currentUser.name.split(' ')[0])}</h1>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{greeting}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
              <button onClick={() => setNavigation({ view: 'myTasks' })} className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 bg-white dark:bg-dark-brand-surface px-4 py-2.5 rounded-lg hover:bg-brand-primary-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-brand-border dark:border-dark-brand-border shadow-sm">
                  <ClipboardDocumentCheckIcon className="w-5 h-5"/> <span>{t('viewMyTasks')}</span>
              </button>
              <button onClick={() => setNavigation({ view: 'createProject'})} className="text-sm font-semibold text-white bg-brand-primary px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg hover:shadow-indigo-500/50">
                  <PlusIcon className="w-5 h-5"/> <span>{t('createNewProject')}</span>
              </button>
          </div>
      </div>
    </div>
  );
};

export default DashboardHeader;