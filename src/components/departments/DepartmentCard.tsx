import React from 'react';
import { Department, User, UserRole } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PencilIcon, TrashIcon, UsersIcon, ClipboardDocumentCheckIcon } from '../icons';

interface DepartmentCardProps {
    department: Department & { userCount: number, taskCount: number, compliance: number, usersInDept: User[] };
    canModify: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const Avatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs border-2 border-white dark:border-dark-brand-surface" title={name}>
        {name.split(' ').map(n => n[0]).join('')}
    </div>
);

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, canModify, onSelect, onEdit, onDelete }) => {
    const { t, lang } = useTranslation();

    return (
        <div 
            onClick={onSelect}
            className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between h-full"
        >
            <div className="p-5">
                <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">{department.name[lang]}</h3>
                
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('complianceRate')}</span>
                        <span className="text-sm font-bold text-brand-primary-600 dark:text-brand-primary-400">{department.compliance}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-brand-primary-600 h-2 rounded-full" style={{ width: `${department.compliance}%` }}></div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-brand-border dark:border-dark-brand-border flex justify-between items-end">
                    <div>
                        <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">{t('teamMembers')}</p>
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                            {department.usersInDept.slice(0, 4).map(member => <Avatar key={member.id} name={member.name} />)}
                            {department.usersInDept.length > 4 && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-dark-brand-surface">+{department.usersInDept.length - 4}</div>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center text-brand-text-secondary dark:text-dark-brand-text-secondary" title={`${department.userCount} ${t('assignedUsers')}`}>
                                <UsersIcon className="w-4 h-4 mr-1"/>
                                <span>{department.userCount}</span>
                            </div>
                            <div className="flex items-center text-brand-text-secondary dark:text-dark-brand-text-secondary" title={`${department.taskCount} ${t('tasksAssigned')}`}>
                                <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1"/>
                                <span>{department.taskCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t dark:border-dark-brand-border bg-slate-50 dark:bg-slate-900/50 px-5 py-3 flex justify-between items-center rounded-b-xl">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {canModify && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-slate-500 dark:text-slate-400 hover:text-brand-primary-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title={t('editDepartment')}><PencilIcon className="w-4 h-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title={t('delete')}><TrashIcon className="w-4 h-4"/></button>
                        </>
                    )}
                </div>
                <span className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline">{t('viewDetails')}</span>
            </div>
        </div>
    );
};

export default DepartmentCard;