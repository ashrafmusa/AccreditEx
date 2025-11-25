import React, { useState, useMemo } from 'react';
import { Department, User, Project, NavigationState, UserRole, ComplianceStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import DepartmentCard from '../components/departments/DepartmentCard';
import DepartmentModal from '../components/departments/DepartmentModal';
import { BuildingOffice2Icon, PlusIcon, UsersIcon } from '../components/icons';
import StatCard from '../components/common/StatCard';

interface DepartmentsPageProps {
  departments: Department[];
  users: User[];
  projects: Project[];
  currentUser: User;
  setNavigation: (state: NavigationState) => void;
  onCreateDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  onUpdateDepartment: (dept: Department) => Promise<void>;
  onDeleteDepartment: (deptId: string) => Promise<void>;
}

const DepartmentsPage: React.FC<DepartmentsPageProps> = (props) => {
  const { t } = useTranslation();
  const { departments, users, projects, currentUser, setNavigation, onCreateDepartment, onUpdateDepartment, onDeleteDepartment } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const canModify = currentUser.role === UserRole.Admin;

  const departmentStats = useMemo(() => {
    return departments.map(dept => {
      const usersInDept = users.filter(u => u.departmentId === dept.id);
      const userIds = new Set(usersInDept.map(u => u.id));
      const tasks = projects.flatMap(p => p.checklist).filter(item => item.assignedTo && userIds.has(item.assignedTo));
      
      const applicableTasks = tasks.filter(t => t.status !== ComplianceStatus.NotApplicable);
      let score = 0;
      applicableTasks.forEach(item => {
        if (item.status === ComplianceStatus.Compliant) score += 1;
        if (item.status === ComplianceStatus.PartiallyCompliant) score += 0.5;
      });
      const compliance = applicableTasks.length > 0 ? Math.round((score / applicableTasks.length) * 100) : 100;

      return { ...dept, userCount: usersInDept.length, taskCount: tasks.length, compliance, usersInDept };
    });
  }, [departments, users, projects]);

  const handleSave = (deptData: Department | Omit<Department, 'id'>) => {
    if ('id' in deptData) {
      onUpdateDepartment(deptData);
    } else {
      onCreateDepartment(deptData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (deptId: string) => {
    if (window.confirm(t('areYouSureDeleteDepartment'))) {
      onDeleteDepartment(deptId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <BuildingOffice2Icon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('departmentsHub')}</h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('departmentsPageDescription')}</p>
          </div>
        </div>
        {canModify && (
          <button onClick={() => { setEditingDept(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto">
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('addNewDepartment')}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t('totalDepartments')} value={departments.length} icon={BuildingOffice2Icon} />
        <StatCard title={t('totalStaffAssigned')} value={users.filter(u => u.departmentId).length} icon={UsersIcon} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentStats.map(dept => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            canModify={canModify}
            onSelect={() => setNavigation({ view: 'departmentDetail', departmentId: dept.id })}
            onEdit={() => { setEditingDept(dept); setIsModalOpen(true); }}
            onDelete={() => handleDelete(dept.id)}
          />
        ))}
      </div>

      {isModalOpen && <DepartmentModal department={editingDept} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default DepartmentsPage;
