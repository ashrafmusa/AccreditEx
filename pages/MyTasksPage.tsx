import React, { useMemo } from 'react';
import { Project, ChecklistItem, User, AccreditationProgram, ComplianceStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { ClipboardDocumentCheckIcon } from '@/components/icons';
import EmptyState from '@/components/common/EmptyState';

interface MyTasksPageProps {
  projects: Project[];
  currentUser: User;
  programs: AccreditationProgram[];
}

const MyTasksPage: React.FC<MyTasksPageProps> = ({ projects, currentUser, programs }) => {
  const { t } = useTranslation();

  const myTasks = useMemo(() => {
    return projects.flatMap(project =>
      project.checklist
        .filter(item => item.assignedTo === currentUser.id && item.status !== ComplianceStatus.Compliant && item.status !== ComplianceStatus.NotApplicable)
        .map(item => ({ ...item, projectName: project.name, programId: project.programId }))
    );
  }, [projects, currentUser]);

  const groupedTasks = useMemo(() => {
    return myTasks.reduce((acc, task) => {
      const program = programs.find(p => p.id === task.programId);
      const programName = program?.name || 'Uncategorized';
      if (!acc[programName]) acc[programName] = {};
      if (!acc[programName][task.projectName]) acc[programName][task.projectName] = [];
      acc[programName][task.projectName].push(task);
      return acc;
    }, {} as Record<string, Record<string, (ChecklistItem & { projectName: string })[]>>);
  }, [myTasks, programs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <ClipboardDocumentCheckIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('myTasks')}</h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('myTasksDescription')}</p>
        </div>
      </div>

      {Object.keys(groupedTasks).length > 0 ? (
        Object.entries(groupedTasks).map(([programName, projectTasks]) => (
          <div key={programName}>
            <h2 className="text-xl font-semibold mb-2">{programName}</h2>
            {Object.entries(projectTasks).map(([projectName, tasks]) => (
              <div key={projectName} className="mb-4 bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
                <h3 className="font-bold">{projectName}</h3>
                <div className="divide-y divide-gray-200 dark:divide-dark-brand-border">
                  {tasks.map(task => (
                    <div key={task.id} className="py-3">
                      <p className="font-medium">{task.item}</p>
                      <p className="text-xs text-gray-500">Standard: {task.standardId}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <EmptyState 
            icon={ClipboardDocumentCheckIcon}
            title={t('noTasksAssigned')}
            message=""
        />
      )}
    </div>
  );
};

export default MyTasksPage;
