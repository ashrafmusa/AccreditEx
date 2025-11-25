import React, { useMemo } from 'react';
import { TrainingProgram, UserTrainingStatus, User, NavigationState } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import TrainingCard from '../training/TrainingCard';
import EmptyState from '../common/EmptyState';
import { AcademicCapIcon } from '../icons';

interface MyTrainingTabProps {
  trainingPrograms: TrainingProgram[];
  userTrainingStatus: UserTrainingStatus;
  currentUser: User;
  setNavigation: (state: NavigationState) => void;
}

const MyTrainingTab: React.FC<MyTrainingTabProps> = ({ trainingPrograms, userTrainingStatus, currentUser, setNavigation }) => {
  const { t } = useTranslation();

  const handleCardAction = (programId: string) => {
    const status = userTrainingStatus[programId];
    if (status?.status === 'Completed' && status.certificateId) {
        setNavigation({ view: 'certificate', certificateId: status.certificateId });
    } else {
        setNavigation({ view: 'trainingDetail', trainingId: programId });
    }
  };
  
  const { pending, completed } = useMemo(() => {
    const assignedIds = new Set(currentUser.trainingAssignments?.map(a => a.trainingId));
    
    const pending = (currentUser.trainingAssignments || [])
        .filter(assignment => userTrainingStatus[assignment.trainingId]?.status !== 'Completed')
        .map(assignment => ({
            program: trainingPrograms.find(p => p.id === assignment.trainingId)!,
            status: userTrainingStatus[assignment.trainingId],
            assignment: assignment
        }))
        .filter(item => item.program);

    const completed = trainingPrograms
        .filter(p => userTrainingStatus[p.id]?.status === 'Completed')
        .map(p => ({
            program: p,
            status: userTrainingStatus[p.id],
            assignment: currentUser.trainingAssignments?.find(a => a.trainingId === p.id)
        }));
        
    return { pending, completed };
  }, [currentUser, trainingPrograms, userTrainingStatus]);


  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold mb-4">{t('pendingTraining')}</h2>
            {pending.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pending.map(({ program, status, assignment }) => (
                        <TrainingCard
                            key={program.id}
                            program={program}
                            status={status}
                            assignment={assignment}
                            onAction={() => handleCardAction(program.id)}
                        />
                    ))}
                </div>
            ) : <EmptyState icon={AcademicCapIcon} title={t('noPendingTraining')} message="" />}
        </div>
        
         <div>
            <h2 className="text-xl font-semibold mb-4">{t('completedTraining')}</h2>
            {completed.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completed.map(({ program, status, assignment }) => (
                        <TrainingCard
                            key={program.id}
                            program={program}
                            status={status}
                            assignment={assignment}
                            onAction={() => handleCardAction(program.id)}
                        />
                    ))}
                </div>
            ) : <EmptyState icon={AcademicCapIcon} title={t('noCompletedTraining')} message="" />}
        </div>
    </div>
  );
};

export default MyTrainingTab;