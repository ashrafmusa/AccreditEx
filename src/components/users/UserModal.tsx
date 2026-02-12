import React, { useState, useEffect } from 'react';
import { User, UserRole, Department, AppSettings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../stores/useAppStore';
import Modal from '../ui/Modal';
import { inputClasses, labelClasses } from '../ui/constants';

interface UserModalProps {
  user: User | null;
  departments: Department[];
  appSettings: AppSettings;
  onSave: (user: User | Omit<User, 'id'>) => void;
  onClose: () => void;
  disableRoleChange?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ user, departments, appSettings, onSave, onClose, disableRoleChange }) => {
  const { t, lang } = useTranslation();
  const { trainingPrograms } = useAppStore();
  const isEditMode = user !== null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(isEditMode ? user.role : appSettings.defaultUserRole);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [jobTitle, setJobTitle] = useState('');
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  useEffect(() => {
    if (isEditMode) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setDepartmentId(user.departmentId);
      setJobTitle(user.jobTitle || '');
      setSelectedTrainings(user.trainingAssignments?.map(t => t.trainingId) || []);
    }
  }, [user, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && role) {
      const now = new Date().toISOString();
      const trainingAssignments = selectedTrainings.map(trainingId => ({
        trainingId,
        assignedDate: now,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }));

      const userData = { 
        name, 
        email, 
        role, 
        departmentId: departmentId || undefined,
        jobTitle: jobTitle || undefined,
        trainingAssignments: trainingAssignments.length > 0 ? trainingAssignments : user?.trainingAssignments || []
      };
      
      if (isEditMode) {
        onSave({ ...user, ...userData });
      } else {
        onSave({ ...userData, competencies: [] });
      }
    }
  };

  const toggleTraining = (trainingId: string) => {
    setSelectedTrainings(prev => 
      prev.includes(trainingId) 
        ? prev.filter(id => id !== trainingId)
        : [...prev, trainingId]
    );
  };
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">{t('cancel')}</button>
      <button type="submit" form="user-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">{t('save')}</button>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditMode ? t('editUser') : t('addNewUser')} footer={footer}>
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
        {/* Basic Information */}
        <div>
            <label htmlFor="name" className={labelClasses}>{t('userName')}</label>
            <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} required />
        </div>
        <div>
            <label htmlFor="email" className={labelClasses}>{t('userEmail')}</label>
            <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
        </div>
        <div>
            <label htmlFor="role" className={labelClasses}>{t('userRole')}</label>
            <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClasses} disabled={disableRoleChange} title={disableRoleChange ? t('lastAdminRoleUnchangeable') : ''}>
            {Object.values(UserRole).map((r: UserRole) => (<option key={r} value={r}>{r}</option>))}
            </select>
        </div>
        <div>
            <label htmlFor="department" className={labelClasses}>{t('department')}</label>
            <select id="department" name="department" value={departmentId || ''} onChange={(e) => setDepartmentId(e.target.value)} className={inputClasses}>
            <option value="">{t('unassigned')}</option>
            {departments.map((d: Department) => (<option key={d.id} value={d.id}>{d.name[lang]}</option>))}
            </select>
        </div>

        {/* Job Title */}
        <div>
            <label htmlFor="jobTitle" className={labelClasses}>{t('jobTitle')}</label>
            <input type="text" name="jobTitle" id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClasses} placeholder={t('optional')} />
        </div>

        {/* Advanced Section - Training Assignment */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-sky-700 dark:hover:text-sky-400"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            {t('assignTraining')}
          </button>

          {showAdvanced && trainingPrograms.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('selectTrainingPrograms')}</p>
              <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900/30 p-3 rounded border border-gray-200 dark:border-gray-700">
                {trainingPrograms.map(program => (
                  <label key={program.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTrainings.includes(program.id)}
                      onChange={() => toggleTraining(program.id)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{program.title[lang]}</span>
                  </label>
                ))}
              </div>
              {selectedTrainings.length > 0 && (
                <p className="text-xs text-brand-primary font-semibold mt-2">{selectedTrainings.length} {t('trainingAssigned')}</p>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
