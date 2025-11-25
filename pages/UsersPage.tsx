import React, { useState, useMemo } from 'react';
import { User, NavigationState } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useUserStore } from '../stores/useUserStore';
import { useAppStore } from '../stores/useAppStore';
import UserModal from '../components/users/UserModal';
import UserRow from '../components/users/UserRow';
import { PlusIcon } from '../components/icons';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface UsersPageProps {
  setNavigation: (state: NavigationState) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { users, currentUser, addUser, updateUser, deleteUser } = useUserStore();
  const { departments, appSettings } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  const usersWithDepartments = useMemo(() => {
    const deptMap = new Map(departments.map(d => [d.id, d]));
    return users.map(u => ({ ...u, department: u.departmentId ? deptMap.get(u.departmentId) : undefined }));
  }, [users, departments]);
  
  const handleSaveUser = (userData: User | Omit<User, 'id'>) => {
    if ('id' in userData) {
      updateUser(userData);
    } else {
      addUser(userData);
    }
    setIsModalOpen(false);
  };
  
  const handleDeleteConfirm = () => {
    if (deletingUserId) {
      deleteUser(deletingUserId);
      setDeletingUserId(null);
    }
  };

  const isLastAdmin = useMemo(() => {
    return users.filter(u => u.role === 'Admin').length === 1;
  }, [users]);
  
  if (!appSettings || !currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full sm:w-auto">
          <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
          {t('addNewUser')}
        </button>
      </div>

      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userName')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userEmail')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('department')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userRole')}</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('actions')}</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
              {usersWithDepartments.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  onSelect={() => setNavigation({ view: 'userProfile', userId: user.id })}
                  onEdit={() => { setEditingUser(user); setIsModalOpen(true); }}
                  onDelete={() => setDeletingUserId(user.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          departments={departments}
          appSettings={appSettings}
          onSave={handleSaveUser}
          onClose={() => setIsModalOpen(false)}
          disableRoleChange={editingUser?.role === 'Admin' && isLastAdmin}
        />
      )}
      
      {deletingUserId && (
        <ConfirmationModal
          isOpen={!!deletingUserId}
          onClose={() => setDeletingUserId(null)}
          onConfirm={handleDeleteConfirm}
          title={t('deleteUser')}
          message={t('areYouSureDeleteUser')}
          confirmationText="DELETE"
        />
      )}
    </div>
  );
};

export default UsersPage;
