import React, { useState, useEffect, FC } from 'react';
import { AuditPlan, Project, User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface AuditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: AuditPlan | Omit<AuditPlan, 'id'>) => void;
  existingPlan: AuditPlan | null;
  projects: Project[];
  users: User[];
}

const AuditPlanModal: FC<AuditPlanModalProps> = ({ isOpen, onClose, onSave, existingPlan, projects, users }) => {
  const { t, dir } = useTranslation();
  const isEditMode = !!existingPlan;

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [standardSection, setStandardSection] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [itemCount, setItemCount] = useState(5);
  const [assignedAuditorId, setAssignedAuditorId] = useState('');

  useEffect(() => {
    if (existingPlan) {
      setName(existingPlan.name);
      setProjectId(existingPlan.projectId);
      setStandardSection(existingPlan.standardSection);
      setFrequency(existingPlan.frequency);
      setItemCount(existingPlan.itemCount);
      setAssignedAuditorId(existingPlan.assignedAuditorId);
    } else {
      setName('');
      setProjectId('');
      setStandardSection('');
      setFrequency('monthly');
      setItemCount(5);
      setAssignedAuditorId('');
    }
  }, [existingPlan, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !projectId || !assignedAuditorId) return;
    const planData = { name, projectId, standardSection, frequency, itemCount, assignedAuditorId };
    if (isEditMode) onSave({ ...planData, id: existingPlan.id });
    else onSave(planData);
  };

  if (!isOpen) return null;

  const inputClasses = "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-medium">{isEditMode ? t('editAuditPlan') : t('newAuditPlan')}</h3>
            <div className="mt-4 space-y-4">
              <div><label className={labelClasses}>{t('planName')}</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required /></div>
              <div>
                <label className={labelClasses}>{t('targetProject')}</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputClasses} required>
                  <option value="">{t('selectProject')}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClasses}>{t('frequency')}</label><select value={frequency} onChange={e => setFrequency(e.target.value as any)} className={inputClasses}><option value="weekly">{t('weekly')}</option><option value="monthly">{t('monthly')}</option></select></div>
                <div><label className={labelClasses}>{t('itemsToAudit')}</label><input type="number" min="1" value={itemCount} onChange={e => setItemCount(parseInt(e.target.value))} className={inputClasses} /></div>
              </div>
              <div><label className={labelClasses}>{t('assignAuditor')}</label><select value={assignedAuditorId} onChange={e => setAssignedAuditorId(e.target.value)} className={inputClasses} required><option value="">{t('selectAuditor')}</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="py-2 px-4 border rounded-md">{t('cancel')}</button>
            <button type="submit" className="py-2 px-4 border rounded-md text-white bg-brand-primary">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuditPlanModal;