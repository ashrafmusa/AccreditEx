import React, { useMemo, useState } from 'react';
import { TrainingProgram, UserTrainingStatus, User, NavigationState } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import TrainingCard from '../training/TrainingCard';
import EmptyState from '../common/EmptyState';
import { AcademicCapIcon } from '../icons';
import { getTrainingDueState } from './TrainingCard';

interface MyTrainingTabProps {
  trainingPrograms: TrainingProgram[];
  userTrainingStatus: UserTrainingStatus;
  currentUser: User;
  setNavigation: (state: NavigationState) => void;
}

const MyTrainingTab: React.FC<MyTrainingTabProps> = ({ trainingPrograms, userTrainingStatus, currentUser, setNavigation }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const handleCardAction = (programId: string) => {
    const status = userTrainingStatus[programId];
    if (status?.status === 'Completed' && status.certificateId) {
        setNavigation({ view: 'certificate', certificateId: status.certificateId });
    } else {
        setNavigation({ view: 'trainingDetail', trainingId: programId });
    }
  };
  
  const { pending, completed } = useMemo(() => {
    const pending = (currentUser.trainingAssignments || [])
        .filter(assignment => userTrainingStatus[assignment.trainingId]?.status !== 'Completed')
        .map(assignment => ({
            program: trainingPrograms.find(p => p.id === assignment.trainingId)!,
            status: userTrainingStatus[assignment.trainingId],
            assignment: assignment
        }))
        .filter(item => item.program)
        .sort((left, right) => {
            const leftDue = left.assignment.dueDate;
            const rightDue = right.assignment.dueDate;
            if (!leftDue) return rightDue ? 1 : 0;
            if (!rightDue) return -1;
            return leftDue.localeCompare(rightDue);
        });

    const completed = trainingPrograms
        .filter(p => userTrainingStatus[p.id]?.status === 'Completed')
        .map(p => ({
            program: p,
            status: userTrainingStatus[p.id],
            assignment: currentUser.trainingAssignments?.find(a => a.trainingId === p.id)
        }));
        
    return { pending, completed };
  }, [currentUser, trainingPrograms, userTrainingStatus]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const matchesSearch = (program: TrainingProgram) => {
      if (!normalizedSearch) return true;
      return [
        program.title.en,
        program.title.ar,
        program.description.en,
        program.description.ar,
        program.category ?? '',
      ].some(value => value.toLocaleLowerCase().includes(normalizedSearch));
    };
    return {
      pending: pending.filter(({ program }) => matchesSearch(program)),
      completed: completed.filter(({ program }) => matchesSearch(program)),
    };
  }, [completed, pending, search]);

  const inProgressCount = pending.filter(({ status }) => status?.status === 'In Progress').length;
  const overdueCount = pending.filter(({ assignment }) => getTrainingDueState(assignment.dueDate) === 'overdue').length;
  const assignedCount = pending.length + completed.length;
  const matchingCount = filtered.pending.length + filtered.completed.length;
  const completionPercentage = assignedCount === 0
    ? 0
    : Math.round((completed.length / assignedCount) * 100);

  return (
    <div className="space-y-8">
        <section aria-labelledby="training-progress-heading" className="space-y-4">
            <div>
                <h2 id="training-progress-heading" className="text-xl font-semibold">
                    {t('trainingProgress')}
                </h2>
                <p className="mt-1 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {t('trainingProgressSummary', { percentage: completionPercentage })}
                </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                    { label: t('trainingAssignedCount'), value: assignedCount, color: 'text-brand-primary' },
                    { label: t('trainingInProgressCount'), value: inProgressCount, color: 'text-amber-700 dark:text-amber-300' },
                    { label: t('trainingOverdueCount'), value: overdueCount, color: 'text-red-600 dark:text-red-400' },
                    { label: t('trainingCompletedCount'), value: completed.length, color: 'text-green-700 dark:text-green-300' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-brand-border bg-brand-surface p-4 dark:border-dark-brand-border dark:bg-dark-brand-surface">
                        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{label}</p>
                        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>
            <div
                className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                role="progressbar"
                aria-label={t('trainingCompletionProgress')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercentage}
            >
                <div
                    className="h-full rounded-full bg-brand-primary transition-[width]"
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>
        </section>
        {(pending.length > 0 || completed.length > 0) && (
            <div>
                <label htmlFor="training-search" className="mb-1 block text-sm font-medium">
                    {t('trainingSearchLabel')}
                </label>
                <input
                    id="training-search"
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder={t('trainingSearchPlaceholder')}
                    className="w-full max-w-xl rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm dark:border-dark-brand-border dark:bg-dark-brand-surface"
                />
            </div>
        )}
        <div>
            <h2 className="text-xl font-semibold mb-4">{t('pendingTraining')}</h2>
            {filtered.pending.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.pending.map(({ program, status, assignment }) => (
                        <TrainingCard
                            key={program.id}
                            program={program}
                            status={status}
                            assignment={assignment}
                            onAction={() => handleCardAction(program.id)}
                        />
                    ))}
                </div>
            ) : pending.length === 0 ? (
                <EmptyState icon={AcademicCapIcon} title={t('noPendingTraining')} message="" />
            ) : null}
        </div>
        
         <div>
            <h2 className="text-xl font-semibold mb-4">{t('completedTraining')}</h2>
            {filtered.completed.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.completed.map(({ program, status, assignment }) => (
                        <TrainingCard
                            key={program.id}
                            program={program}
                            status={status}
                            assignment={assignment}
                            onAction={() => handleCardAction(program.id)}
                        />
                    ))}
                </div>
            ) : completed.length === 0 ? (
                <EmptyState icon={AcademicCapIcon} title={t('noCompletedTraining')} message="" />
            ) : null}
        </div>
        {search.trim() && matchingCount === 0 && (
            <p role="status" className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t('noTrainingSearchResults')}
            </p>
        )}
    </div>
  );
};

export default MyTrainingTab;