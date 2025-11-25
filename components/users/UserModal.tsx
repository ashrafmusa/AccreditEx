import React, { useState, useEffect } from 'react';
import { User, UserRole, Department, AppSettings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
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
  const isEditMode = user !== null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(isEditMode ? user.role : appSettings.defaultUserRole);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (isEditMode) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setDepartmentId(user.departmentId);
    }
  }, [user, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && role) {
      const userData = { name, email, role, departmentId: departmentId || undefined };
      if (isEditMode) {
        onSave({ ...user, ...userData });
      } else {
        onSave({ ...userData, competencies: [], trainingAssignments: [] });
      }
    }
  };
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{t('cancel')}</button>
      <button type="submit" form="user-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{t('save')}</button>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditMode ? t('editUser') : t('addNewUser')} footer={footer}>
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
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
      </form>
    </Modal>
  );
};

export default UserModal;
