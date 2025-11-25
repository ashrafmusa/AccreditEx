import React, { useState } from 'react';
import { User, Competency, AppDocument, UserCompetency, UserRole } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '../icons';
import UserCompetencyModal from '../competencies/UserCompetencyModal';
import { useToast } from '../../hooks/useToast';

interface Props {
    user: User;
    currentUser: User;
    competencies: Competency[];
    documents: AppDocument[];
    onUpdateUser: (user: User) => void;
}

const UserCompetencies: React.FC<Props> = ({ user, currentUser, competencies, documents, onUpdateUser }) => {
    const { t, lang } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompetency, setEditingCompetency] = useState<UserCompetency | null>(null);
    const canEdit = currentUser.role === UserRole.Admin;
    const toast = useToast();
    const [isSyncing, setIsSyncing] = useState(false);

    const getCompetencyStatus = (uc: UserCompetency) => {
        if (!uc.expiryDate) return { text: t('active'), color: 'text-green-600' };
        const expiry = new Date(uc.expiryDate);
        const now = new Date();
        const thirtyDaysFromNow = new Date(new Date().setDate(now.getDate() + 30));
        
        if (expiry < now) return { text: t('expired'), color: 'text-red-600' };
        if (expiry <= thirtyDaysFromNow) return { text: t('expiringSoon'), color: 'text-yellow-600' };
        return { text: t('active'), color: 'text-green-600' };
    };

    const handleSave = (competency: UserCompetency) => {
        const existingIndex = user.competencies?.findIndex(c => c.competencyId === competency.competencyId);
        let newCompetencies = [...(user.competencies || [])];
        if(existingIndex !== undefined && existingIndex > -1) {
            newCompetencies[existingIndex] = competency;
        } else {
            newCompetencies.push(competency);
        }
        onUpdateUser({ ...user, competencies: newCompetencies });
        setIsModalOpen(false);
        setEditingCompetency(null);
    };

    const handleDelete = (competencyId: string) => {
        if (window.confirm(t('areYouSureDeleteCompetency'))) {
             onUpdateUser({ ...user, competencies: user.competencies?.filter(c => c.competencyId !== competencyId) || [] });
        }
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            toast.success(t('syncSuccess'));
            // In a real app, you would refetch user competencies here
        }, 1500);
    };
    
    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t('competenciesCerts')}</h2>
                {canEdit && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleSync} disabled={isSyncing} className="flex items-center justify-center text-sm bg-slate-100 dark:bg-slate-700 text-brand-text-primary dark:text-dark-brand-text-primary px-2 sm:px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-70">
                            <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline ltr:ml-1.5 rtl:mr-1.5">{isSyncing ? t('syncing') : t('syncWithHris')}</span>
                        </button>
                        <button onClick={() => { setEditingCompetency(null); setIsModalOpen(true); }} className="flex items-center justify-center text-sm bg-brand-primary text-white px-2 sm:px-3 py-1.5 rounded-md hover:bg-indigo-700" title={t('addCompetency')}>
                            <PlusIcon className="w-4 h-4"/><span className="hidden sm:inline ltr:ml-1.5 rtl:mr-1.5">{t('addCompetency')}</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="space-y-3">
               {(user.competencies || []).map(uc => {
                   const competency = competencies.find(c => c.id === uc.competencyId);
                   if (!competency) return null;
                   const status = getCompetencyStatus(uc);
                   return (
                       <div key={uc.competencyId} className="p-3 rounded-md border dark:border-dark-brand-border flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                           <div>
                               <p className="font-semibold">{competency.name[lang]}</p>
                               <p className="text-xs text-gray-500">{t('issueDate')}: {new Date(uc.issueDate).toLocaleDateString()} {uc.expiryDate && `| ${t('expiryDate')}: ${new Date(uc.expiryDate).toLocaleDateString()}`}</p>
                           </div>
                           <div className="flex items-center gap-4">
                               <span className={`text-sm font-semibold ${status.color}`}>{status.text}</span>
                               {canEdit && <div className="flex gap-2"><button onClick={() => { setEditingCompetency(uc); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-brand-primary"><PencilIcon className="w-4 h-4"/></button><button onClick={() => handleDelete(uc.competencyId)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button></div>}
                           </div>
                       </div>
                   )
               })}
               {(user.competencies || []).length === 0 && <p className="text-sm text-center text-gray-500 py-4">{t('noCompetencies')}</p>}
            </div>
            {isModalOpen && <UserCompetencyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} competencies={competencies} documents={documents} existingUserCompetency={editingCompetency} />}
        </div>
    );
};

export default UserCompetencies;