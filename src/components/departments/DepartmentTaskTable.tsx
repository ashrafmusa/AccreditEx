import React, { useState, useMemo } from 'react';
import { ChecklistItem, User, ComplianceStatus } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { SearchIcon } from '../icons';

interface DepartmentTaskTableProps {
  tasks: (ChecklistItem & { projectName: string })[];
  users: User[];
}

const DepartmentTaskTable: React.FC<DepartmentTaskTableProps> = ({ tasks, users }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const statusInfo: Record<ComplianceStatus, { text: string; color: string }> = {
        [ComplianceStatus.Compliant]: { text: t('compliant'), color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        [ComplianceStatus.PartiallyCompliant]: { text: t('partiallyCompliant'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
        [ComplianceStatus.NonCompliant]: { text: t('nonCompliant'), color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
        [ComplianceStatus.NotApplicable]: { text: t('notApplicable'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };

    const filteredTasks = useMemo(() => 
        tasks.filter(task => 
        task.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
        task.standardId.toLowerCase().includes(searchTerm.toLowerCase())
        ), [tasks, searchTerm]);

    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
            <div className="p-4 border-b dark:border-dark-brand-border">
                <div className="relative flex-grow max-w-sm">
                    <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder={t('searchByTask')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"/>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right">{t('status')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right">{t('taskDescription')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right">{t('assignedTo')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right">{t('project')}</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                    {filteredTasks.map(task => {
                        const assignedUser = users.find(u => u.id === task.assignedTo);
                        return (
                            <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo[task.status]?.color || 'bg-gray-100 text-gray-800'}`}>{statusInfo[task.status]?.text || task.status}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">{task.item}</p>
                                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('standard')}: {task.standardId}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{assignedUser?.name || t('unassigned')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{task.projectName}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                {filteredTasks.length === 0 && <p className="text-center py-8 text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noTasksForDepartment')}</p>}
            </div>
        </div>
    );
};

export default DepartmentTaskTable;