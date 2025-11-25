

import React, { useMemo } from 'react';
import { UserTrainingStatus, TrainingProgram, NavigationState, User } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
    user: User;
    userTrainingStatus: UserTrainingStatus;
    trainingPrograms: TrainingProgram[];
    setNavigation: (state: NavigationState) => void;
}

const UserTrainingDashboard: React.FC<Props> = ({ user, userTrainingStatus, trainingPrograms, setNavigation }) => {
    const { t, lang } = useTranslation();

    const { pending, completed } = useMemo(() => {
        const assigned = user.trainingAssignments || [];
        
        const pending = assigned
            .filter(a => userTrainingStatus[a.trainingId]?.status !== 'Completed')
            .map(a => ({ assignment: a, program: trainingPrograms.find(p => p.id === a.trainingId) }))
            .filter(item => item.program);
            
        const completed = Object.entries(userTrainingStatus)
            .filter(([, status]) => (status as any).status === 'Completed')
            .map(([trainingId, status]) => ({
                status,
                program: trainingPrograms.find(p => p.id === trainingId)
            }))
            .filter(item => item.program);

        return { pending, completed };
    }, [user, userTrainingStatus, trainingPrograms]);

    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
            <h2 className="text-lg font-semibold mb-4">{t('trainingHistory')}</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('pendingTraining')} ({pending.length})</h3>
                    <div className="space-y-2">
                        {pending.map(({ assignment, program }) => (
                            <div key={assignment.trainingId} className="p-3 rounded-md border dark:border-dark-brand-border bg-yellow-50 dark:bg-yellow-900/20">
                                <p className="font-semibold">{program!.title[lang]}</p>
                                <p className="text-xs text-gray-500">{t('assignedOn')}: {new Date(assignment.assignedDate).toLocaleDateString()}
                                {assignment.dueDate && ` | ${t('dueOn')}: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                                </p>
                            </div>
                        ))}
                        {pending.length === 0 && <p className="text-sm text-center text-gray-500 py-4">{t('noPendingTraining')}</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('completedTraining')} ({completed.length})</h3>
                    <div className="space-y-2">
                        {completed.map(({ program, status }) => (
                            <div key={program!.id} className="p-3 rounded-md border dark:border-dark-brand-border flex justify-between items-center">
                                <div>
                                <p className="font-semibold">{program!.title[lang]}</p>
                                <p className="text-xs text-gray-500">{t('completedOn')}: {new Date(status.completionDate!).toLocaleDateString()} | {t('score')}: {status.score}%</p>
                                </div>
                                {status.certificateId && (
                                    <button onClick={() => setNavigation({ view: 'certificate', certificateId: status.certificateId! })} className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline flex-shrink-0">
                                        {t('viewCertificate')}
                                    </button>
                                )}
                            </div>
                        ))}
                        {completed.length === 0 && <p className="text-sm text-center text-gray-500 py-4">{t('noCompletedTraining')}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTrainingDashboard;