import React from 'react';
import { NavigationState } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  FolderIcon, 
  ExclamationTriangleIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon
} from '@/components/icons';

interface QuickActionsWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

interface QuickAction {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ setNavigation }) => {
  const { t } = useTranslation();

  const quickActions: QuickAction[] = [
    {
      id: 'create-project',
      titleKey: 'createNewProject',
      descriptionKey: 'quickActionCreateProject',
      icon: FolderIcon,
      color: 'from-blue-500 to-blue-600',
      action: () => setNavigation({ view: 'createProject' })
    },
    {
      id: 'add-capa',
      titleKey: 'addCapaReport',
      descriptionKey: 'quickActionAddCapa',
      icon: ExclamationTriangleIcon,
      color: 'from-red-500 to-red-600',
      action: () => setNavigation({ view: 'riskHub' }) // Will open CAPA creation modal
    },
    {
      id: 'upload-document',
      titleKey: 'uploadDocument',
      descriptionKey: 'quickActionUploadDoc',
      icon: DocumentTextIcon,
      color: 'from-emerald-500 to-emerald-600',
      action: () => setNavigation({ view: 'documentControl' })
    },
    {
      id: 'schedule-survey',
      titleKey: 'scheduleMockSurvey',
      descriptionKey: 'quickActionScheduleSurvey',
      icon: CalendarDaysIcon,
      color: 'from-purple-500 to-purple-600',
      action: () => setNavigation({ view: 'calendar' })
    },
    {
      id: 'create-task',
      titleKey: 'createTask',
      descriptionKey: 'quickActionCreateTask',
      icon: ClipboardDocumentCheckIcon,
      color: 'from-amber-500 to-amber-600',
      action: () => setNavigation({ view: 'myTasks' })
    },
    {
      id: 'add-standard',
      titleKey: 'addStandard',
      descriptionKey: 'quickActionAddStandard',
      icon: CheckCircleIcon,
      color: 'from-indigo-500 to-indigo-600',
      action: () => setNavigation({ view: 'accreditationHub' })
    }
  ];

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t('quickActions')}
        </h3>
        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t('oneClickAccess')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              className="group relative overflow-hidden rounded-lg p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-xl border border-transparent hover:border-brand-primary/20 dark:hover:border-brand-primary/30"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary text-sm mb-1 truncate">
                      {t(action.titleKey)}
                    </h4>
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary line-clamp-2">
                      {t(action.descriptionKey)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-brand-primary dark:text-brand-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsWidget;
