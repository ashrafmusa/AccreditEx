import React, { useMemo } from 'react';
import { NavigationState, ComplianceStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { 
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  CalendarDaysIcon
} from '@/components/icons';

interface OverdueTasksWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

interface OverdueTask {
  id: string;
  title: string;
  type: 'checklist' | 'training' | 'competency';
  projectName?: string;
  daysOverdue: number;
  assignee?: string;
  action: () => void;
}

const OverdueTasksWidget: React.FC<OverdueTasksWidgetProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const projects = useProjectStore(state => state.projects);
  const { currentUser, users } = useUserStore();

  const overdueTasks = useMemo(() => {
    const tasks: OverdueTask[] = [];
    const now = new Date();

    // Overdue checklist items
    projects.forEach(project => {
      project.checklist
        .filter(item => 
          item.dueDate && 
          new Date(item.dueDate) < now && 
          item.status !== ComplianceStatus.Compliant &&
          item.status !== ComplianceStatus.NotApplicable
        )
        .forEach(item => {
          const daysOverdue = Math.floor((now.getTime() - new Date(item.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
          const assignee = item.assignedTo ? users.find(u => u.id === item.assignedTo) : undefined;
          
          tasks.push({
            id: item.id,
            title: item.item.substring(0, 60) + (item.item.length > 60 ? '...' : ''),
            type: 'checklist',
            projectName: project.name,
            daysOverdue,
            assignee: assignee?.name,
            action: () => setNavigation({ view: 'projectDetail', projectId: project.id })
          });
        });
    });

    // Overdue training assignments
    if (currentUser) {
      currentUser.trainingAssignments
        ?.filter(assignment => 
          assignment.dueDate && 
          new Date(assignment.dueDate) < now
        )
        .forEach(assignment => {
          const daysOverdue = Math.floor((now.getTime() - new Date(assignment.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
          
          tasks.push({
            id: assignment.trainingId,
            title: t('trainingAssignment'),
            type: 'training',
            daysOverdue,
            action: () => setNavigation({ view: 'trainingHub' })
          });
        });
    }

    // Expired competencies
    if (currentUser) {
      currentUser.competencies
        ?.filter(comp => 
          comp.expiryDate && 
          new Date(comp.expiryDate) < now
        )
        .forEach(comp => {
          const daysOverdue = Math.floor((now.getTime() - new Date(comp.expiryDate!).getTime()) / (1000 * 60 * 60 * 24));
          
          tasks.push({
            id: comp.competencyId,
            title: t('expiredCompetency'),
            type: 'competency',
            daysOverdue,
            action: () => setNavigation({ view: 'userProfile', userId: currentUser.id })
          });
        });
    }

    // Sort by days overdue (most overdue first)
    tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return tasks.slice(0, 5);
  }, [projects, currentUser, users, t, setNavigation]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checklist': return ClipboardDocumentCheckIcon;
      case 'training': return AcademicCapIcon;
      case 'competency': return CalendarDaysIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'checklist': return 'text-red-500';
      case 'training': return 'text-orange-500';
      case 'competency': return 'text-amber-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue > 30) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    if (daysOverdue > 14) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          {t('overdueTasks')}
        </h3>
        {overdueTasks.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
            {overdueTasks.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {overdueTasks.length > 0 ? (
          overdueTasks.map((task) => {
            const Icon = getTypeIcon(task.type);
            
            return (
              <button
                key={task.id}
                onClick={task.action}
                className="w-full group flex items-start gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left border border-transparent hover:border-red-200 dark:hover:border-red-800"
              >
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${getTypeColor(task.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-brand-text-primary dark:text-dark-brand-text-primary truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {task.projectName && (
                      <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary truncate">
                        {task.projectName}
                      </span>
                    )}
                    {task.assignee && (
                      <>
                        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">•</span>
                        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {task.assignee}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getSeverityColor(task.daysOverdue)}`}>
                  {task.daysOverdue} {t('daysOverdue')}
                </span>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8">
            <CalendarDaysIcon className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
              {t('allCaughtUp')}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t('noOverdueTasks')}
            </p>
          </div>
        )}
      </div>

      {overdueTasks.length > 0 && (
        <button
          onClick={() => setNavigation({ view: 'myTasks' })}
          className="mt-4 w-full text-center text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
        >
          {t('viewAllOverdue')} →
        </button>
      )}
    </div>
  );
};

export default OverdueTasksWidget;
