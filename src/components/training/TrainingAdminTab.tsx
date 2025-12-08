import React, { useState } from 'react';
import { TrainingProgram, User, Department } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PlusIcon, PencilIcon, TrashIcon, AcademicCapIcon } from '../icons';
import TrainingProgramModal from './TrainingProgramModal';
import AssignTrainingModal from './AssignTrainingModal';
import EmptyState from '../common/EmptyState';

interface Props {
  trainingPrograms: TrainingProgram[];
  users: User[];
  departments: Department[];
  onAssign: (data: { trainingId: string; userIds: string[]; departmentIds: string[]; dueDate?: string }) => Promise<void>;
  onCreate: (program: Omit<TrainingProgram, 'id'>) => Promise<void>;
  onUpdate: (program: TrainingProgram) => Promise<void>;
  onDelete: (programId: string) => Promise<void>;
}

const TrainingAdminTab: React.FC<Props> = ({ trainingPrograms, users, departments, onAssign, onCreate, onUpdate, onDelete }) => {
  const { t, lang } = useTranslation();
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);

  const handleSaveProgram = (program: TrainingProgram | Omit<TrainingProgram, 'id'>) => {
    if ('id' in program) {
      onUpdate(program);
    } else {
      onCreate(program);
    }
    setIsProgramModalOpen(false);
  };
  
  const handleDelete = (programId: string) => {
    if (window.confirm(t('areYouSureDeleteTraining'))) {
      onDelete(programId);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button onClick={() => setIsAssignModalOpen(true)} className="bg-white dark:bg-slate-700 text-brand-text-primary dark:text-dark-brand-text-primary border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center font-semibold shadow-sm">
                {t('assignTraining')}
            </button>
            <button onClick={() => { setEditingProgram(null); setIsProgramModalOpen(true); }} className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm">
                <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('createNewTraining')}
            </button>
        </div>
        
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('trainingTitle')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('quizQuestions')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
                        {trainingPrograms.map(program => (
                            <tr key={program.id}>
                                <td className="px-6 py-4 font-medium">{program.title[lang]}</td>
                                <td className="px-6 py-4 text-sm">{program.quiz.length}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <button onClick={() => { setEditingProgram(program); setIsProgramModalOpen(true); }} className="p-1 text-gray-500 hover:text-brand-primary"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(program.id)} className="p-1 text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {trainingPrograms.length === 0 && <EmptyState icon={AcademicCapIcon} title="No Training Programs" message="Create a new training program to get started." />}
            </div>
        </div>

        {isProgramModalOpen && <TrainingProgramModal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} onSave={handleSaveProgram} existingProgram={editingProgram} />}
        {isAssignModalOpen && <AssignTrainingModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onAssign={onAssign} trainingPrograms={trainingPrograms} users={users} departments={departments} />}
    </div>
  );
};

export default TrainingAdminTab;