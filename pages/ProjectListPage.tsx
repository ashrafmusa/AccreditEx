import React, { useState, useMemo, useEffect } from 'react';
import { NavigationState, User, ProjectStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import { useToast } from '@/hooks/useToast';
import ProjectCard from '@/components/projects/ProjectCard';
import BulkActionsToolbar from '@/components/projects/BulkActionsToolbar';
import ProjectAnalytics from '@/components/projects/ProjectAnalytics';
import { FolderIcon, PlusIcon, SearchIcon, FunnelIcon, XMarkIcon, ArchiveBoxIcon, CheckIcon, ChartBarSquareIcon } from '@/components/icons';
import EmptyState from '@/components/common/EmptyState';

interface ProjectListPageProps {
  setNavigation: (state: NavigationState) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { 
    projects, 
    deleteProject, 
    loading, 
    subscribeToProjects, 
    unsubscribeFromProjects,
    bulkArchiveProjects,
    bulkRestoreProjects,
    bulkDeleteProjects,
    bulkUpdateStatus
  } = useProjectStore();
  const { currentUser, users } = useUserStore();
  const { accreditationPrograms } = useAppStore();
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const programMap = useMemo(() => new Map(accreditationPrograms.map(p => [p.id, p.name])), [accreditationPrograms]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Archive filter
      const matchesArchived = showArchived ? p.archived === true : p.archived !== true;
      if (!matchesArchived) return false;

      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      const matchesProgram = programFilter === 'all' || p.programId === programFilter;
      
      const matchesAssignee = assigneeFilter === 'all' || 
        p.projectLead?.id === assigneeFilter || 
        p.checklist.some(item => item.assignedTo === assigneeFilter);

      const matchesDate = (!dateFilter.start || new Date(p.startDate) >= new Date(dateFilter.start)) &&
                            (!dateFilter.end || (p.endDate && new Date(p.endDate) <= new Date(dateFilter.end)));

      return matchesSearch && matchesStatus && matchesProgram && matchesAssignee && matchesDate;
    });
  }, [projects, searchTerm, statusFilter, programFilter, assigneeFilter, dateFilter, showArchived]);
  
  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const handleBulkArchive = async () => {
    await bulkArchiveProjects(selectedProjects);
    setSelectedProjects([]);
    showToast(t('projectsArchivedSuccessfully'), 'success');
  };

  const handleBulkRestore = async () => {
    await bulkRestoreProjects(selectedProjects);
    setSelectedProjects([]);
    showToast(t('projectsRestoredSuccessfully'), 'success');
  };

  const handleBulkDelete = async () => {
    await bulkDeleteProjects(selectedProjects);
    setSelectedProjects([]);
    showToast(t('projectsDeletedSuccessfully'), 'success');
  };

  const handleBulkUpdateStatus = async (status: ProjectStatus) => {
    await bulkUpdateStatus(selectedProjects, status);
    setSelectedProjects([]);
    showToast(t('projectsUpdatedSuccessfully'), 'success');
  };

  const handleDelete = (projectId: string) => {
    if (window.confirm(t('areYouSureDeleteProject'))) {
        deleteProject(projectId);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setProgramFilter('all');
    setAssigneeFilter('all');
    setDateFilter({ start: '', end: '' });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {selectedProjects.length > 0 && (
        <div className="sticky top-4 z-40 animate-fadeIn">
          <BulkActionsToolbar
            selectedCount={selectedProjects.length}
            onArchive={handleBulkArchive}
            onRestore={handleBulkRestore}
            onDelete={handleBulkDelete}
            onUpdateStatus={handleBulkUpdateStatus}
            onClearSelection={() => setSelectedProjects([])}
            showRestore={showArchived}
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <FolderIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('accreditationProjects')}</h1>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`px-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors w-full md:w-auto ${showAnalytics ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}
            >
                <ChartBarSquareIcon className="w-5 h-5" />
                {showAnalytics ? t('hideAnalytics') : t('showAnalytics')}
            </button>
            <button 
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors w-full md:w-auto ${showArchived ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}
            >
                <ArchiveBoxIcon className="w-5 h-5" />
                {showArchived ? t('hideArchived') : t('showArchived')}
            </button>
            <button onClick={() => setNavigation({ view: 'createProject' })} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto">
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t('createNewProject')}
            </button>
        </div>
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
             {(statusFilter !== 'all' || programFilter !== 'all' || assigneeFilter !== 'all' || dateFilter.start || dateFilter.end) && (
                <button onClick={clearFilters} className="text-red-500 hover:text-red-700 text-sm font-medium px-2">
                    {t('clearFilters')}
                </button>
            )}
        </div>

        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('program')}</label>
                    <select 
                        value={programFilter} 
                        onChange={(e) => setProgramFilter(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    >
                        <option value="all">{t('allPrograms')}</option>
                        {accreditationPrograms.map(program => (
                            <option key={program.id} value={program.id}>{program.name}</option>
                        ))}
                    </select>
                </div>
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dateRange')}</label>
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={dateFilter.start} 
                            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                            placeholder={t('startDate')}
                        />
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {/* Analytics Section */}
      {showAnalytics && (
        <div className="animate-fadeIn">
          <ProjectAnalytics projects={filteredProjects} />
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(p => {
            const assignedUserIds = new Set(p.checklist.map(item => item.assignedTo).filter(Boolean));
            if (p.projectLead?.id) {
              assignedUserIds.add(p.projectLead.id);
            }
            const teamMembers = Array.from(assignedUserIds).map(id => users.find(u => u.id === id)).filter((u): u is User => !!u);

            return (
              <ProjectCard
                key={p.id}
                project={{...p, programName: programMap.get(p.programId) || '?', teamMembers}}
                currentUser={currentUser!}
                onSelect={() => setNavigation({ view: 'projectDetail', projectId: p.id })}
                onEdit={() => setNavigation({ view: 'editProject', projectId: p.id })}
                onDelete={() => handleDelete(p.id)}
                selected={selectedProjects.includes(p.id)}
                onToggleSelect={() => handleSelectProject(p.id)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState 
            icon={FolderIcon} 
            title={searchTerm || statusFilter !== 'all' || programFilter !== 'all' || assigneeFilter !== 'all' ? t('noProjectsFound') : t('noProjects')} 
            message={searchTerm || statusFilter !== 'all' || programFilter !== 'all' || assigneeFilter !== 'all' ? t('tryAdjustingSearch') : t('createFirstProject')} 
        />
      )}
    </div>
  );
};

export default ProjectListPage;
