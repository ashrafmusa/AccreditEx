import React, { useMemo } from 'react';
import { NavigationState, ProjectStatus, ComplianceStatus, User } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import StatCard from '@/components/common/StatCard';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import DashboardHeader from './DashboardHeader';
import { FolderIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@/components/icons';
import ProjectCard from '@/components/projects/ProjectCard';
import { useAppStore } from '@/stores/useAppStore';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

const ProjectLeadDashboard: React.FC<DashboardPageProps> = ({ setNavigation }) => {
    const { t } = useTranslation();
    const { currentUser, users } = useUserStore();
    const { projects, deleteProject } = useProjectStore();
    const { accreditationPrograms } = useAppStore();

    const myProjects = useMemo(() => {
        if (!currentUser) return [];
        return projects.filter(p => p.projectLead.id === currentUser.id);
    }, [projects, currentUser]);

    const leadStats = useMemo(() => {
        const totalProjects = myProjects.length;
        const inProgressCount = myProjects.filter(p => p.status === ProjectStatus.InProgress).length;
        const openCapaCount = myProjects.flatMap(p => p.capaReports).filter(c => c.status === 'Open').length;
        
        let totalScore = 0;
        let totalApplicableTasks = 0;
        myProjects.forEach(p => {
            const applicableItems = p.checklist.filter(c => c.status !== ComplianceStatus.NotApplicable);
            totalApplicableTasks += applicableItems.length;
            applicableItems.forEach(item => {
                if (item.status === ComplianceStatus.Compliant) totalScore += 1;
                if (item.status === ComplianceStatus.PartiallyCompliant) totalScore += 0.5;
            });
        });
        const overallCompliance = totalApplicableTasks > 0 ? ((totalScore / totalApplicableTasks) * 100).toFixed(1) : '0.0';

        return { totalProjects, inProgressCount, openCapaCount, overallCompliance: `${overallCompliance}%` };
    }, [myProjects]);

    const handleDelete = (projectId: string) => {
        if (window.confirm(t('areYouSureDeleteProject'))) {
            deleteProject(projectId);
        }
    };
    
    const programMap = useMemo(() => new Map(accreditationPrograms.map(p => [p.id, p.name])), [accreditationPrograms]);

    if (!currentUser) return null;

    return (
        <div className="space-y-8">
            <DashboardHeader setNavigation={setNavigation} title={t('projectLeadDashboardTitle')} greeting={t('dashboardGreeting')} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('myProjects')} value={leadStats.totalProjects} icon={FolderIcon} color="from-blue-500 to-blue-700 bg-gradient-to-br"/>
                <StatCard title={t('inProgress')} value={leadStats.inProgressCount} icon={CheckCircleIcon} color="from-orange-400 to-orange-600 bg-gradient-to-br"/>
                <StatCard title={t('teamCompliance')} value={leadStats.overallCompliance} icon={CheckCircleIcon} color="from-indigo-500 to-indigo-700 bg-gradient-to-br"/>
                <StatCard title={t('openCapaReports')} value={leadStats.openCapaCount} icon={ExclamationTriangleIcon} color="from-red-500 to-red-700 bg-gradient-to-br"/>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">{t('myProjects')}</h2>
                {myProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {myProjects.map(p => {
                             const assignedUserIds = new Set(p.checklist.map(item => item.assignedTo).filter(Boolean));
                             assignedUserIds.add(p.projectLead.id);
                             const teamMembers = Array.from(assignedUserIds).map(id => users.find(u => u.id === id)).filter((u): u is User => !!u);
                            return (
                                <ProjectCard
                                    key={p.id}
                                    project={{ ...p, teamMembers, programName: programMap.get(p.programId) || '?' }}
                                    currentUser={currentUser}
                                    onSelect={() => setNavigation({ view: 'projectDetail', projectId: p.id })}
                                    onEdit={() => setNavigation({ view: 'editProject', projectId: p.id })}
                                    onDelete={() => handleDelete(p.id)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noProjectsFound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectLeadDashboard;