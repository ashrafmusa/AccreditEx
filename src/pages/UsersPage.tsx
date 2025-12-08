import React, { useState, useMemo } from 'react';
import { User, NavigationState, UserRole } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useUserStore } from '../stores/useUserStore';
import { useAppStore } from '../stores/useAppStore';
import UserModal from '../components/users/UserModal';
import UserRow from '../components/users/UserRow';
import { PlusIcon, MagnifyingGlassIcon } from '../components/icons';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'All'>('All');
  
  const usersWithDepartments = useMemo(() => {
    const deptMap = new Map(departments.map(d => [d.id, d]));
    const result = users.map(u => ({ ...u, department: u.departmentId ? deptMap.get(u.departmentId) : undefined }));
    
    // Apply search and role filtering
    return result.filter(user => {
      const matchesSearch = searchQuery.toLowerCase() === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.name.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.name.ar?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === 'All' || user.role === filterRole;
      
      return matchesSearch && matchesRole;
    });
  }, [users, departments, searchQuery, filterRole]);
  
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
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">{t('usersManagement')}</h1>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t('totalUsers')}: <span className="font-semibold">{users.length}</span> | {t('admins')}: <span className="font-semibold">{users.filter(u => u.role === 'Admin').length}</span>
          </p>
        </div>
        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full sm:w-auto">
          <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
          {t('addNewUser')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg border border-gray-200 dark:border-dark-brand-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-primary-400"
            />
          </div>
          
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | 'All')}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-primary-400 min-w-[150px]"
          >
            <option value="All">{t('allRoles')}</option>
            <option value="Admin">{t('admin')}</option>
            <option value="User">{t('user')}</option>
          </select>
        </div>
        
        {/* Results Summary */}
        {searchQuery && (
          <div className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t('found')}: <span className="font-semibold">{usersWithDepartments.length}</span> {usersWithDepartments.length === 1 ? t('user') : t('users')}
          </div>
        )}
      </div>

      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="overflow-x-auto">
          {usersWithDepartments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userName')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userEmail')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('department')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userRole')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('status')}</th>
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">{t('noUsersFound')}</p>
            </div>
          )}
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
