import React from 'react';
import { AccreditationProgram } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PencilIcon, TrashIcon } from '../icons';

interface ProgramCardProps {
    program: AccreditationProgram;
    standardCount: number;
    projectCount: number;
    canModify: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, standardCount, projectCount, canModify, onSelect, onEdit, onDelete }) => {
    const { t, lang } = useTranslation();

    return (
        <div 
            onClick={onSelect}
            className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between h-full"
        >
            <div className="p-5">
                <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">{program.name}</h3>
                <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 line-clamp-2 h-10">{program.description[lang]}</p>
                <div className="mt-4 flex space-x-6 rtl:space-x-reverse">
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('totalStandards')}</p>
                        <p className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">{standardCount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('projects')}</p>
                        <p className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">{projectCount}</p>
                    </div>
                </div>
            </div>
            <div className="border-t dark:border-dark-brand-border bg-slate-50 dark:bg-slate-900/50 px-5 py-3 flex justify-between items-center rounded-b-xl">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {canModify && (<>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-slate-500 dark:text-slate-400 hover:text-brand-primary-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title={t('editProgram')}><PencilIcon className="w-4 h-4"/></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title={t('deleteProgram')}><TrashIcon className="w-4 h-4"/></button>
                    </>)}
                </div>
                <span className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline">{t('manageStandards')}</span>
            </div>
        </div>
    );
};

export default ProgramCard;