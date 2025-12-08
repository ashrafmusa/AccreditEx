import React from 'react';
import { TrainingProgram, UserTrainingStatus, User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface TrainingCardProps {
    program: TrainingProgram;
    status: UserTrainingStatus[string];
    assignment?: User['trainingAssignments'][0];
    onAction: () => void;
}

const TrainingCard: React.FC<TrainingCardProps> = ({ program, status, assignment, onAction }) => {
  const { t, lang } = useTranslation();

  const getStatusInfo = () => {
    if (!status || status.status === 'Not Started') {
      return { text: t('statusNotStarted'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', buttonText: t('startTraining') };
    }
    if (status.status === 'Completed') {
      return { text: t('statusCompleted'), color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', buttonText: t('viewCertificate') };
    }
    return { text: t('statusInProgress'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', buttonText: t('continueTraining') };
  };

  const { text, color, buttonText } = getStatusInfo();

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary flex-1 ltr:pr-2 rtl:pl-2">{program.title[lang]}</h3>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color} flex-shrink-0`}>{text}</span>
        </div>
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2 line-clamp-3 h-16">{program.description[lang]}</p>
        
        <div className="mt-4 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {status?.status === 'Completed' && status.completionDate ? (
                <>
                    <p>{t('completedOn')}: {new Date(status.completionDate).toLocaleDateString()}</p>
                    <p>{t('score')}: <span className="font-semibold">{status.score}%</span></p>
                </>
            ) : assignment?.dueDate && (
                 <p className="text-red-600 dark:text-red-400 font-semibold">{t('dueOn')}: {new Date(assignment.dueDate).toLocaleDateString()}</p>
            )}
        </div>
      </div>
       <div className="border-t dark:border-dark-brand-border bg-slate-50 dark:bg-slate-900/50 px-5 py-3 flex justify-end rounded-b-xl">
         <button onClick={onAction} className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline">{status?.status === 'Completed' && !status.certificateId ? t('retakeQuiz') : buttonText}</button>
      </div>
    </div>
  );
};

export default TrainingCard;