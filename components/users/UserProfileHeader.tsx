
import React from 'react';
import { User, Department } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

const StatBox: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
);

interface Props {
  user: User;
  department?: Department;
}

const UserProfileHeader: React.FC<Props> = ({ user, department }) => {
  const { t, lang } = useTranslation();

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-primary-700 text-white flex items-center justify-center font-bold text-3xl">{user.name.charAt(0)}</div>
            <div>
                <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">{user.name}</h1>
                <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{user.jobTitle || user.role}</p>
            </div>
        </div>
         <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
            <StatBox label={t('userEmail')} value={user.email} />
            <StatBox label={t('department')} value={department?.name[lang] || t('unassigned')} />
            <StatBox label={t('hireDate')} value={user.hireDate ? new Date(user.hireDate).toLocaleDateString() : 'N/A'} />
        </dl>
    </div>
  );
};

export default UserProfileHeader;
