import React, { useMemo } from 'react';
import { NavigationState, ComplianceStatus, ChecklistItem } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import StatCard from '@/components/common/StatCard';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import DashboardHeader from './DashboardHeader';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@/components/icons';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

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

    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return projects.flatMap(project => 
            project.checklist
                .filter(item => item.assignedTo === currentUser.id)
                .map(item => ({...item, projectName: project.name, projectId: project.id}))
        );
    }, [projects, currentUser]);

    const taskStats = useMemo(() => {
        const totalTasks = myTasks.length;
        const completedTasks = myTasks.filter(t => t.status === ComplianceStatus.Compliant).length;
        const applicableTasks = myTasks.filter(t => t.status !== ComplianceStatus.NotApplicable);
        const score = applicableTasks.reduce((acc, item) => {
            if (item.status === ComplianceStatus.Compliant) return acc + 1;
            if (item.status === ComplianceStatus.PartiallyCompliant) return acc + 0.5;
            return acc;
        }, 0);
        const complianceRate = applicableTasks.length > 0 ? ((score / applicableTasks.length) * 100).toFixed(1) : '100.0';
        const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== ComplianceStatus.Compliant).length;
        
        return {
            totalTasks,
            completedTasks,
            complianceRate: `${complianceRate}%`,
            overdueTasks
        };
    }, [myTasks]);

    return (
        <div className="space-y-8">
            <DashboardHeader setNavigation={setNavigation} title={t('welcomeBack')} greeting={t('teamMemberDashboardTitle')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title={t('tasksCompleted')} value={`${taskStats.completedTasks} / ${taskStats.totalTasks}`} icon={CheckCircleIcon} color="from-green-500 to-green-700 bg-gradient-to-br"/>
                <StatCard title={t('myComplianceRate')} value={taskStats.complianceRate} icon={ClockIcon} color="from-indigo-500 to-indigo-700 bg-gradient-to-br"/>
                <StatCard title={t('overdue')} value={taskStats.overdueTasks} icon={ExclamationTriangleIcon} color="from-red-500 to-red-700 bg-gradient-to-br"/>
            </div>

            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('myOpenTasks')}</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myTasks.filter(t => t.status !== ComplianceStatus.Compliant).map(task => (
                        <TaskItemCard
                            key={task.id}
                            task={task}
                            onSelect={() => setNavigation({ view: 'projectDetail', projectId: task.projectId })}
                        />
                    ))}
                     {myTasks.filter(t => t.status !== ComplianceStatus.Compliant).length === 0 && (
                        <p className="text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary py-6">{t('noTasksAssigned')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamMemberDashboard;