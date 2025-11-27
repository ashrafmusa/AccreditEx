import React, { useState, useMemo } from 'react';
import { NavigationState, User, ProjectStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import ProjectCard from '@/components/projects/ProjectCard';
import { FolderIcon, PlusIcon, SearchIcon, FunnelIcon, XMarkIcon } from '@/components/icons';
import EmptyState from '@/components/common/EmptyState';

interface ProjectListPageProps {
  setNavigation: (state: NavigationState) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { projects, deleteProject } = useProjectStore();
  const { currentUser, users } = useUserStore();
  const { accreditationPrograms } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const programMap = useMemo(() => new Map(accreditationPrograms.map(p => [p.id, p.name])), [accreditationPrograms]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      const matchesAssignee = assigneeFilter === 'all' || 
        p.projectLead.id === assigneeFilter || 
        p.checklist.some(item => item.assignedTo === assigneeFilter);

      const matchesDate = (!dateFilter.start || new Date(p.startDate) >= new Date(dateFilter.start)) &&
                          (!dateFilter.end || (p.endDate && new Date(p.endDate) <= new Date(dateFilter.end)));

      return matchesSearch && matchesStatus && matchesAssignee && matchesDate;
    });
  }, [projects, searchTerm, statusFilter, assigneeFilter, dateFilter]);
  
  const handleDelete = (projectId: string) => {
    if (window.confirm(t('areYouSureDeleteProject'))) {
        deleteProject(projectId);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setAssigneeFilter('all');
    setDateFilter({ start: '', end: '' });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <FolderIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('accreditationProjects')}</h1>
          </div>
        </div>
        <button onClick={() => setNavigation({ view: 'createProject' })} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto">
          <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
          {t('createNewProject')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                type="text"
                placeholder={t('searchProjects')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-primary focus:border-brand-primary text-sm bg-brand-surface dark:bg-dark-brand-surface"
                />
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-medium transition-colors ${showFilters ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}
            >
                <FunnelIcon className="w-5 h-5" />
                {t('filterByStatus')}
            </button>
             {(statusFilter !== 'all' || assigneeFilter !== 'all' || dateFilter.start || dateFilter.end) && (
                <button onClick={clearFilters} className="text-red-500 hover:text-red-700 text-sm font-medium px-2">
                    {t('clearFilters')}
                </button>
            )}
        </div>

        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('filterByStatus')}</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    >
                        <option value="all">{t('allStatuses')}</option>
                        {Object.values(ProjectStatus).map(status => (
                            <option key={status} value={status}>{t(status.replace(/\s/g, '').toLowerCase() as any) || status}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('filterByAssignee')}</label>
                    <select 
                        value={assigneeFilter} 
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    >
                        <option value="all">{t('allAssignees')}</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('startDate')}</label>
                    <input 
                        type="date" 
                        value={dateFilter.start} 
                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('endDate')}</label>
                    <input 
                        type="date" 
                        value={dateFilter.end} 
                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    />
                </div>
            </div>
        )}
      </div>
      
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(p => {
            const assignedUserIds = new Set(p.checklist.map(item => item.assignedTo).filter(Boolean));
            assignedUserIds.add(p.projectLead.id);
            const teamMembers = Array.from(assignedUserIds).map(id => users.find(u => u.id === id)).filter((u): u is User => !!u);

            return (
              <ProjectCard
                key={p.id}
                project={{...p, programName: programMap.get(p.programId) || '?', teamMembers}}
                currentUser={currentUser!}
                onSelect={() => setNavigation({ view: 'projectDetail', projectId: p.id })}
                onEdit={() => setNavigation({ view: 'editProject', projectId: p.id })}
                onDelete={() => handleDelete(p.id)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState 
            icon={FolderIcon} 
            title={t('noProjectsFound')} 
            message={t('tryAdjustingSearch')} 
        />
      )}
    </div>
  );
};

export default ProjectListPage;
