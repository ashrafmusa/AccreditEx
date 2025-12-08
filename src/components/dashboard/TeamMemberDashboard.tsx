import React, { useMemo, useState, useEffect } from 'react';
import { NavigationState, ComplianceStatus, ChecklistItem } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import StatCard from '@/components/common/StatCard';
import StatCardSkeleton from '@/components/common/StatCardSkeleton';
import EmptyStatePlaceholder from '@/components/common/EmptyStatePlaceholder';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import DashboardHeader from './DashboardHeader';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, SparklesIcon, ChartBarIcon } from '@/components/icons';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

const getDefaultTaskStats = () => ({
  totalTasks: 0,
  completedTasks: 0,
  complianceRate: '100.0%',
  overdueTasks: 0,
  upcomingTasks: 0,
  partiallyCompliantTasks: 0,
  nonCompliantTasks: 0,
  completionTrend: '0.0%'
});

const TaskItemCard: React.FC<{ task: ChecklistItem & { projectName: string, projectId: string }, onSelect: () => void }> = ({ task, onSelect }) => {
    const { t } = useTranslation();
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    
    const statusInfo: Record<ComplianceStatus, { text: string; color: string }> = {
        [ComplianceStatus.Compliant]: { text: t('compliant'), color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        [ComplianceStatus.PartiallyCompliant]: { text: t('partiallyCompliant'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
        [ComplianceStatus.NonCompliant]: { text: t('nonCompliant'), color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
        [ComplianceStatus.NotApplicable]: { text: t('notApplicable'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };

    return (
        <div
            onClick={onSelect}
            className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-dark-brand-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
            <div className="flex justify-between items-start">
                <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex-1 pr-4">{task.item}</p>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo[task.status].color}`}>
                    {statusInfo[task.status].text}
                </span>
            </div>
            <div className="flex items-center justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
                <span>{task.projectName}</span>
                {task.dueDate && <span className={isOverdue ? 'font-bold text-red-500' : ''}>{t('dueDate')}: {new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
        </div>
    );
};


const TeamMemberDashboard: React.FC<DashboardPageProps> = ({ setNavigation }) => {
    const { t } = useTranslation();
    const { currentUser } = useUserStore();
    const { projects } = useProjectStore();
    
    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }, []);

    const myTasks = useMemo(() => {
        try {
            if (!currentUser) return [];
            return projects
                .filter(p => p && Array.isArray(p.checklist))
                .flatMap(project => 
                    project.checklist
                        .filter(item => item?.assignedTo === currentUser.id)
                        .map(item => ({...item, projectName: project.name, projectId: project.id}))
                );
        } catch (error) {
            console.warn('TeamMemberDashboard: Error getting tasks', error);
            return [];
        }
    }, [projects, currentUser]);

    const taskStats = useMemo(() => {
        try {
            const totalTasks = myTasks.length;
            const completedTasks = myTasks.filter(t => t?.status === ComplianceStatus.Compliant).length;
            const partiallyCompliantTasks = myTasks.filter(t => t?.status === ComplianceStatus.PartiallyCompliant).length;
            const nonCompliantTasks = myTasks.filter(t => t?.status === ComplianceStatus.NonCompliant).length;
            const applicableTasks = myTasks.filter(t => t?.status !== ComplianceStatus.NotApplicable);
            
            const score = applicableTasks.reduce((acc, item) => {
                if (!item) return acc;
                if (item.status === ComplianceStatus.Compliant) return acc + 1;
                if (item.status === ComplianceStatus.PartiallyCompliant) return acc + 0.5;
                return acc;
            }, 0);
            const complianceRate = applicableTasks.length > 0 ? ((score / applicableTasks.length) * 100).toFixed(1) : '100.0';
            
            // Overdue tasks (past due and not compliant)
            const overdueTasks = myTasks.filter(t => {
                try {
                    return t?.dueDate && new Date(t.dueDate) < new Date() && t.status !== ComplianceStatus.Compliant;
                } catch (error) {
                    return false;
                }
            }).length;
            
            // Upcoming tasks (due within next 7 days and not yet compliant)
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingTasks = myTasks.filter(t => {
                try {
                    if (!t?.dueDate || t.status === ComplianceStatus.Compliant) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= now && dueDate <= nextWeek;
                } catch (error) {
                    return false;
                }
            }).length;
            
            // Completion trend: percentage of tasks completed
            const completionTrend = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';
            
            return {
                totalTasks,
                completedTasks,
                complianceRate: `${complianceRate}%`,
                overdueTasks,
                upcomingTasks,
                partiallyCompliantTasks,
                nonCompliantTasks,
                completionTrend: `${completionTrend}%`
            };
        } catch (error) {
            console.error('TeamMemberDashboard stats calculation error:', error);
            return getDefaultTaskStats();
        }
    }, [myTasks]);

    return (
        <ErrorBoundary>
            <div className="space-y-8">
                <DashboardHeader setNavigation={setNavigation} title={t('welcomeBack')} greeting={t('teamMemberDashboardTitle')} />
                
                {isLoading ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCardSkeleton count={6} />
                    </div>
                  </div>
                ) : (
                <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      title={t('tasksCompleted')} 
                      value={`${taskStats.completedTasks} / ${taskStats.totalTasks}`} 
                      icon={CheckCircleIcon} 
                      color="from-green-500 to-green-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'myTasks', filter: 'completed' })}
                    />
                    <StatCard 
                      title={t('myComplianceRate')} 
                      value={taskStats.complianceRate} 
                      icon={ClockIcon} 
                      color="from-indigo-500 to-indigo-700 bg-gradient-to-br"
                    />
                    <StatCard 
                      title={t('upcomingTasks')} 
                      value={taskStats.upcomingTasks} 
                      icon={SparklesIcon} 
                      color="from-blue-500 to-blue-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'myTasks', filter: 'upcoming' })}
                    />
                    <StatCard 
                      title={t('overdue')} 
                      value={taskStats.overdueTasks} 
                      icon={ExclamationTriangleIcon} 
                      color="from-red-500 to-red-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'myTasks', filter: 'overdue' })}
                    />
                    <StatCard 
                      title={t('completionRate')} 
                      value={taskStats.completionTrend} 
                      icon={ChartBarIcon} 
                      color="from-cyan-500 to-cyan-700 bg-gradient-to-br"
                    />
                    <StatCard 
                      title={t('partiallyDone')} 
                      value={taskStats.partiallyCompliantTasks} 
                      icon={ClockIcon} 
                      color="from-amber-500 to-amber-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'myTasks', filter: 'partial' })}
                    />
                </div>

                <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                    <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('myOpenTasks')}</h3>
                    {myTasks.filter(t => t.status !== ComplianceStatus.Compliant).length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {myTasks.filter(t => t.status !== ComplianceStatus.Compliant).map(task => (
                            <TaskItemCard
                                key={task.id}
                                task={task}
                                onSelect={() => setNavigation({ view: 'projectDetail', projectId: task.projectId })}
                            />
                        ))}
                      </div>
                    ) : (
                      <EmptyStatePlaceholder 
                        icon={CheckCircleIcon}
                        title={t('allTasksComplete')} 
                        message={t('allTasksCompleteMessage')}
                        secondary
                        compact
                      />
                    )}
                </div>
                </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default TeamMemberDashboard;