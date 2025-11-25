import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ClipboardDocumentSearchIcon, PlusIcon } from '../components/icons';
import { useAppStore } from '../stores/useAppStore';
import { useUserStore } from '../stores/useUserStore';
import { useProjectStore } from '../stores/useProjectStore';
import { AuditPlan } from '../types';
import AuditPlanModal from '../components/audits/AuditPlanModal';

interface AuditHubPageProps {
  setNavigation: (state: any) => void;
}

const AuditHubPage: React.FC<AuditHubPageProps> = () => {
    const { t } = useTranslation();
    const { auditPlans, addAuditPlan, updateAuditPlan, deleteAuditPlan, runAudit } = useAppStore();
    const { users } = useUserStore();
    const { projects } = useProjectStore();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<AuditPlan | null>(null);

    const handleSavePlan = (plan: AuditPlan | Omit<AuditPlan, 'id'>) => {
        if ('id' in plan) {
            updateAuditPlan(plan);
        } else {
            addAuditPlan(plan);
        }
        setIsModalOpen(false);
    };

    const handleDeletePlan = (planId: string) => {
        if (window.confirm(t('areYouSureDeleteAuditPlan'))) {
            deleteAuditPlan(planId);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
                    <ClipboardDocumentSearchIcon className="h-8 w-8 text-brand-primary" />
                    <div>
                        <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('auditHub')}</h1>
                        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('auditHubDescription')}</p>
                    </div>
                </div>
                <button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto">
                    <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('newAuditPlan')}
                </button>
            </div>

            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
                <h2 className="text-xl font-semibold mb-4">{t('auditPlans')}</h2>
                 <div className="space-y-4">
                    {auditPlans.map(plan => {
                        const project = projects.find(p => p.id === plan.projectId);
                        const auditor = users.find(u => u.id === plan.assignedAuditorId);
                        return (
                            <div key={plan.id} className="p-4 border rounded-lg dark:border-dark-brand-border flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{plan.name}</p>
                                    <p className="text-sm text-gray-500">{project?.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">Audits {plan.itemCount} items {plan.frequency}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm">Auditor: {auditor?.name}</span>
                                    <button onClick={() => runAudit(plan.id)} className="text-sm font-semibold text-brand-primary hover:underline">{t('runAudit')}</button>
                                    <button onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }} className="p-1">{t('edit')}</button>
                                    <button onClick={() => handleDeletePlan(plan.id)} className="p-1">{t('delete')}</button>
                                </div>
                            </div>
                        )
                    })}
                     {auditPlans.length === 0 && <p className="text-center py-8 text-gray-500">{t('noAuditPlans')}</p>}
                </div>
            </div>

            {isModalOpen && (
                <AuditPlanModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePlan}
                    existingPlan={editingPlan}
                    projects={projects}
                    users={users}
                />
            )}
        </div>
    );
};

export default AuditHubPage;
