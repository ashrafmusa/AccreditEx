import React from 'react';
import { User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface DepartmentUserListProps {
  users: User[];
}

const DepartmentUserList: React.FC<DepartmentUserListProps> = ({ users }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border h-full">
      <h2 className="text-lg font-semibold mb-4">{t('departmentMembers')}</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users.map(user => (
          <div key={user.id} className="p-2 rounded-md flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-primary-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.jobTitle || user.role}</p>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-sm text-center text-gray-500 py-4">{t('noUsersInDepartment')}</p>}
      </div>
    </div>
  );
};

export default DepartmentUserList;