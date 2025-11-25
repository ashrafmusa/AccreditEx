import React, { useState, useMemo } from 'react';
import { NavigationState, User } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import ProjectCard from '@/components/projects/ProjectCard';
import { FolderIcon, PlusIcon, SearchIcon } from '@/components/icons';
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

  const programMap = useMemo(() => new Map(accreditationPrograms.map(p => [p.id, p.name])), [accreditationPrograms]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);
  
  const handleDelete = (projectId: string) => {
    if (window.confirm(t('areYouSureDeleteProject'))) {
        deleteProject(projectId);
    }
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

      <div className="relative">
        <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('searchProjects')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-primary focus:border-brand-primary text-sm bg-brand-surface dark:bg-dark-brand-surface"
        />
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
            message={t('createProjectToStart')} 
        />
      )}
    </div>
  );
};

export default ProjectListPage;
