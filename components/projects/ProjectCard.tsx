import React from 'react';
import { Project, User, UserRole, ProjectStatus, ComplianceStatus } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PencilIcon, TrashIcon, ExclamationTriangleIcon, ClipboardDocumentCheckIcon } from '../icons';
import { programColorMap } from '../ui/constants';

const Avatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs border-2 border-white dark:border-dark-brand-surface" title={name}>
        {name.split(' ').map(n => n[0]).join('')}
    </div>
);

interface ProjectCardProps { 
    project: Project & { programName: string, teamMembers: User[] }; 
    currentUser: User;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, currentUser, onSelect, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const compliance = Math.round(project.progress);
  const canModify = (currentUser.role === UserRole.Admin || currentUser.id === project.projectLead.id) && project.status !== ProjectStatus.Finalized;
  const totalTasks = project.checklist.length;
  const completedTasks = project.checklist.filter(c => c.status === ComplianceStatus.Compliant).length;
  const openCapaCount = project.capaReports.filter(c => c.status === 'Open').length;
  
  const colorClass = programColorMap[project.programName] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full" onClick={onSelect}>
        <div className="p-5 flex-grow">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>{project.programName}</span>
          <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-3">{project.name}</h3>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('complianceRate')}</span>
              <span className="text-sm font-bold text-brand-primary-600 dark:text-brand-primary-400">{compliance}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-brand-primary-600 h-2 rounded-full" style={{ width: `${compliance}%` }}></div></div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-brand-border dark:border-dark-brand-border flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">{t('teamMembers')}</p>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                  {project.teamMembers.slice(0, 4).map(member => <Avatar key={member.id} name={member.name} />)}
                  {project.teamMembers.length > 4 && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-dark-brand-surface">+{project.teamMembers.length - 4}</div>}
              </div>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center text-brand-text-secondary dark:text-dark-brand-text-secondary" title={`${completedTasks}/${totalTasks} ${t('tasksCompleted')}`}>
                    <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1"/>
                    <span>{completedTasks}/{totalTasks}</span>
                  </div>
                  {openCapaCount > 0 && 
                      <div className="flex items-center text-red-500" title={`${openCapaCount} ${t('openIssues')}`}>
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1"/>
                        <span>{openCapaCount}</span>
                      </div>
                  }
                </div>
            </div>
          </div>

        </div>
        <div className="border-t dark:border-dark-brand-border bg-slate-50 dark:bg-slate-900/50 px-5 py-3 flex justify-between items-center rounded-b-xl">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {canModify && (<>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-slate-500 dark:text-slate-400 hover:text-brand-primary-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title={t('editProject')}><PencilIcon className="w-4 h-4"/></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title={t('deleteProject')}><TrashIcon className="w-4 h-4"/></button>
              </>)}
          </div>
          <span className="text-sm font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline">{t('viewDetails')}</span>
        </div>
    </div>
  );
};

export default ProjectCard;
