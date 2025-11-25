import React, { useState, FC } from 'react';
import { TrainingProgram, User, Department } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import DatePicker from '@/components/ui/DatePicker';

interface AssignTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: { trainingId: string; userIds: string[]; departmentIds: string[]; dueDate?: string }) => Promise<void>;
  trainingPrograms: TrainingProgram[];
  users: User[];
  departments: Department[];
}

const AssignTrainingModal: FC<AssignTrainingModalProps> = ({ isOpen, onClose, onAssign, trainingPrograms, users, departments }) => {
    const { t, dir, lang } = useTranslation();
    const toast = useToast();
    const [trainingId, setTrainingId] = useState('');
    const [userIds, setUserIds] = useState<string[]>([]);
    const [departmentIds, setDepartmentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState<Date | undefined>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!trainingId || (userIds.length === 0 && departmentIds.length === 0)) {
            toast.error(t('pleaseFillRequired'));
            return;
        }
        await onAssign({ trainingId, userIds, departmentIds, dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined });
        toast.success(t('trainingAssignedSuccess'));
        onClose();
    }
    
    if (!isOpen) return null;
    
    const inputClasses = "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
            <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium">{t('assignTraining')}</h3>
                         <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="training" className={labelClasses}>{t('trainingModule')}</label>
                                <select id="training" value={trainingId} onChange={e => setTrainingId(e.target.value)} className={inputClasses} required>
                                    <option value="">{t('selectTraining')}</option>
                                    {trainingPrograms.map(p => <option key={p.id} value={p.id}>{p.title[lang]}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="users" className={labelClasses}>{t('assignToUsers')}</label>
                                <select id="users" multiple value={userIds} onChange={e => setUserIds(Array.from(e.target.selectedOptions, (opt: HTMLOptionElement) => opt.value))} className={`${inputClasses} h-32`}>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="departments" className={labelClasses}>{t('assignToDepartments')}</label>
                                <select id="departments" multiple value={departmentIds} onChange={e => setDepartmentIds(Array.from(e.target.selectedOptions, (opt: HTMLOptionElement) => opt.value))} className={`${inputClasses} h-24`}>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name[lang]}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="dueDate" className={labelClasses}>{t('assignmentDueDate')}</label>
                                <DatePicker date={dueDate} setDate={setDueDate} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 border rounded-md">{t('cancel')}</button>
                        <button type="submit" className="py-2 px-4 border rounded-md text-white bg-brand-primary">{t('assign')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignTrainingModal;