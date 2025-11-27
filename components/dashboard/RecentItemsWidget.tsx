import React, { useMemo } from 'react';
import { NavigationState } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAppStore } from '@/stores/useAppStore';
import { 
  FolderIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ClockIcon
} from '@/components/icons';

interface RecentItemsWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'project' | 'document' | 'capa';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
  timestamp?: string;
}

const RecentItemsWidget: React.FC<RecentItemsWidgetProps> = ({ setNavigation }) => {
  const { t, lang } = useTranslation();
  const projects = useProjectStore(state => state.projects);
  const { documents } = useAppStore();

  const recentItems = useMemo(() => {
    const items: RecentItem[] = [];

    // Get 3 most recent projects
    const recentProjects = [...projects]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 3)
      .map(project => ({
        id: project.id,
        title: project.name,
        subtitle: `${project.progress.toFixed(0)}% ${t('complete')}`,
        type: 'project' as const,
        icon: FolderIcon,
        color: 'text-blue-500',
        action: () => setNavigation({ view: 'projectDetail', projectId: project.id }),
        timestamp: project.startDate
      }));

    // Get 2 most recent documents
    const recentDocs = [...documents]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 2)
      .map(doc => ({
        id: doc.id,
        title: doc.name[lang] || doc.name.en,
        subtitle: `${t(doc.type.toLowerCase())} • ${doc.status}`,
        type: 'document' as const,
        icon: DocumentTextIcon,
        color: 'text-emerald-500',
        action: () => setNavigation({ view: 'documentControl' }),
        timestamp: doc.uploadedAt
      }));

    // Combine and sort by timestamp
    items.push(...recentProjects, ...recentDocs);
    items.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return items.slice(0, 5);
  }, [projects, documents, lang, t, setNavigation]);

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return t('justNow');
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t('minutesAgo')}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t('hoursAgo')}`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ${t('daysAgo')}`;
    return then.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t('recentItems')}
        </h3>
        <ClockIcon className="w-5 h-5 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
      </div>

      <div className="space-y-3">
        {recentItems.length > 0 ? (
          recentItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full group flex items-center gap-3 p-3 rounded-lg hover:bg-brand-background dark:hover:bg-dark-brand-background transition-colors text-left"
              >
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-brand-text-primary dark:text-dark-brand-text-primary truncate group-hover:text-brand-primary dark:group-hover:text-brand-primary-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary truncate">
                    {item.subtitle}
                  </p>
                </div>
                {item.timestamp && (
                  <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary whitespace-nowrap">
                    {getRelativeTime(item.timestamp)}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <p className="text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary py-8">
            {t('noRecentItems')}
          </p>
        )}
      </div>

      {recentItems.length > 0 && (
        <button
          onClick={() => setNavigation({ view: 'projects' })}
          className="mt-4 w-full text-center text-sm text-brand-primary dark:text-brand-primary-400 hover:underline"
        >
          {t('viewAll')} →
        </button>
      )}
    </div>
  );
};

export default RecentItemsWidget;
