import React, { useMemo } from 'react';
import { NavigationState, ComplianceStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAppStore } from '@/stores/useAppStore';
import { 
  DocumentTextIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@/components/icons';

interface PendingApprovalsWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

interface PendingItem {
  id: string;
  title: string;
  type: 'document' | 'project' | 'capa';
  status: string;
  dueDate?: string;
  action: () => void;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ setNavigation }) => {
  const { t, lang } = useTranslation();
  const projects = useProjectStore(state => state.projects);
  const { documents } = useAppStore();

  const pendingItems = useMemo(() => {
    const items: PendingItem[] = [];

    // Pending document approvals
    const pendingDocs = documents
      .filter(doc => doc.status === 'Pending Review')
      .map(doc => ({
        id: doc.id,
        title: doc.name[lang] || doc.name.en,
        type: 'document' as const,
        status: t('pendingReview'),
        dueDate: doc.reviewDate,
        action: () => setNavigation({ view: 'documentControl' })
      }));

    // Projects pending finalization
    const pendingProjects = projects
      .filter(p => p.status === 'Completed' && !p.finalizedBy)
      .map(project => ({
        id: project.id,
        title: project.name,
        type: 'project' as const,
        status: t('pendingFinalization'),
        action: () => setNavigation({ view: 'projectDetail', projectId: project.id })
      }));

    // Open CAPA reports needing closure
    const openCapas = projects
      .flatMap(p => p.capaReports
        .filter(c => c.status === 'Open')
        .map(capa => ({
          id: capa.id,
          title: capa.description.substring(0, 50) + '...',
          type: 'capa' as const,
          status: t('awaitingClosure'),
          dueDate: capa.dueDate,
          action: () => setNavigation({ view: 'projectDetail', projectId: p.id })
        }))
      );

    items.push(...pendingDocs, ...pendingProjects, ...openCapas.slice(0, 3));
    
    // Sort by due date if available
    items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return items.slice(0, 5);
  }, [projects, documents, lang, t, setNavigation]);

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return { text: t('overdue'), color: 'text-red-500' };
    if (diffInDays === 0) return { text: t('today'), color: 'text-amber-500' };
    if (diffInDays === 1) return { text: t('tomorrow'), color: 'text-amber-500' };
    if (diffInDays <= 7) return { text: `${diffInDays} ${t('daysLeft')}`, color: 'text-orange-500' };
    return { text: `${diffInDays} ${t('daysLeft')}`, color: 'text-brand-text-secondary dark:text-dark-brand-text-secondary' };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return DocumentTextIcon;
      case 'project': return CheckCircleIcon;
      case 'capa': return ExclamationCircleIcon;
      default: return DocumentTextIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'text-emerald-500';
      case 'project': return 'text-blue-500';
      case 'capa': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t('pendingApprovals')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            {pendingItems.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {pendingItems.length > 0 ? (
          pendingItems.map((item) => {
            const Icon = getTypeIcon(item.type);
            const dueInfo = getDaysUntilDue(item.dueDate);
            
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full group flex items-start gap-3 p-3 rounded-lg hover:bg-brand-background dark:hover:bg-dark-brand-background transition-colors text-left border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
              >
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${getTypeColor(item.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-brand-text-primary dark:text-dark-brand-text-primary truncate group-hover:text-brand-primary dark:group-hover:text-brand-primary-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {item.status}
                    </span>
                    {dueInfo && (
                      <>
                        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">•</span>
                        <span className={`text-xs font-medium ${dueInfo.color}`}>
                          {dueInfo.text}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ClockIcon className="w-4 h-4 text-brand-text-secondary dark:text-dark-brand-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })
        ) : (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t('noPendingApprovals')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsWidget;
