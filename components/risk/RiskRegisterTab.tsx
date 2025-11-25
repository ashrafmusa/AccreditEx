
import React, { useState, useMemo } from 'react';
import { Risk } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../stores/useAppStore';
import { useUserStore } from '../../stores/useUserStore';
import RiskMatrix from './RiskMatrix';
import RiskModal from './RiskModal';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons';

const RiskRegisterTab: React.FC = () => {
  const { t } = useTranslation();
  const { risks, addRisk, updateRisk, deleteRisk, trainingPrograms } = useAppStore();
  const { users } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);

  const handleSave = (riskData: Risk | Omit<Risk, 'id'>) => {
    if ('id' in riskData) {
      updateRisk(riskData);
    } else {
      addRisk(riskData);
    }
    setIsModalOpen(false);
  };
  
  const handleDelete = (riskId: string) => {
    if (window.confirm(t('areYouSureDeleteRisk'))) {
      deleteRisk(riskId);
    }
  };

  const sortedRisks = useMemo(() => [...risks].sort((a,b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)), [risks]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
          <button onClick={() => { setEditingRisk(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center font-semibold text-sm">
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>{t('addNewRisk')}
          </button>
      </div>

      <RiskMatrix risks={risks} />

      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('riskTitle')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('riskScore')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('owner')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
              {sortedRisks.map(risk => {
                const owner = users.find(u => u.id === risk.ownerId);
                const score = risk.impact * risk.likelihood;
                return (
                  <tr key={risk.id}>
                    <td className="px-6 py-4 font-medium">{risk.title}</td>
                    <td className="px-6 py-4 text-sm">{risk.status}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{score}</td>
                    <td className="px-6 py-4 text-sm">{owner?.name || t('unassigned')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                          <button onClick={() => { setEditingRisk(risk); setIsModalOpen(true); }} className="p-1"><PencilIcon className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(risk.id)} className="p-1"><TrashIcon className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && <RiskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} existingRisk={editingRisk} users={users} trainingPrograms={trainingPrograms} />}
    </div>
  );
};

export default RiskRegisterTab;
