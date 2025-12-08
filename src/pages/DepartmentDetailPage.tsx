import React, { useMemo } from 'react';
import { Department, User, Project, NavigationState, UserRole, ChecklistItem, ComplianceStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { BuildingOffice2Icon, CheckCircleIcon, UsersIcon, ClipboardDocumentCheckIcon } from '../components/icons';
import StatCard from '../components/common/StatCard';
import DepartmentUserList from '../components/departments/DepartmentUserList';
import DepartmentTaskTable from '../components/departments/DepartmentTaskTable';

interface DepartmentDetailPageProps {
    department: Department;
    users: User[];
    projects: Project[];
    currentUser: User;
    setNavigation: (state: NavigationState) => void;
    onUpdateDepartment: (dept: Department) => void;
    onDeleteDepartment: (deptId: string) => void;
}

const DepartmentDetailPage: React.FC<DepartmentDetailPageProps> = (props) => {
    const { department, users, projects, currentUser, setNavigation, onUpdateDepartment, onDeleteDepartment } = props;
    const { t, lang } = useTranslation();

    const canModify = currentUser.role === UserRole.Admin;

    const departmentData = useMemo(() => {
        const usersInDept = users.filter(u => u.departmentId === department.id);
        const userIds = new Set(usersInDept.map(u => u.id));
        const tasks = projects.flatMap(p => 
            p.checklist
             .filter(item => item.assignedTo && userIds.has(item.assignedTo))
             .map(item => ({ ...item, projectName: p.name }))
        );
        
        const applicableTasks = tasks.filter(t => t.status !== ComplianceStatus.NotApplicable);
        let score = 0;
        applicableTasks.forEach(item => {
            if (item.status === ComplianceStatus.Compliant) score += 1;
            if (item.status === ComplianceStatus.PartiallyCompliant) score += 0.5;
        });
        const compliance = applicableTasks.length > 0 ? Math.round((score / applicableTasks.length) * 100) : 100;

        return { usersInDept, tasks, compliance };
    }, [department.id, users, projects]);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
                <BuildingOffice2Icon className="h-8 w-8 text-brand-primary" />
                <div>
                    <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{department.name[lang]}</h1>
                    <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('departmentDetails')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={t('departmentMembers')} value={departmentData.usersInDept.length} icon={UsersIcon} />
                <StatCard title={t('tasksAssigned')} value={departmentData.tasks.length} icon={ClipboardDocumentCheckIcon} />
                <StatCard title={t('complianceRate')} value={`${departmentData.compliance}%`} icon={CheckCircleIcon} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1">
                    <DepartmentUserList users={departmentData.usersInDept} />
                </div>
                <div className="lg:col-span-2">
                    <DepartmentTaskTable tasks={departmentData.tasks} users={users} />
                </div>
            </div>
        </div>
    );
};

export default DepartmentDetailPage;
