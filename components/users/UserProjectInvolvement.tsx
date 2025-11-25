
import React, { useMemo } from 'react';
import { User, Project } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
    user: User;
    projects: Project[];
}

const UserProjectInvolvement: React.FC<Props> = ({ user, projects }) => {
    const { t } = useTranslation();

    const userProjects = useMemo(() => {
        const projectSet = new Set<Project>();
        projects.forEach(p => {
            if (p.projectLead.id === user.id || p.checklist.some(item => item.assignedTo === user.id)) {
                projectSet.add(p);
            }
        });
        return Array.from(projectSet);
    }, [projects, user.id]);

    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
            <h2 className="text-lg font-semibold mb-4">{t('projectInvolvement')}</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {userProjects.map(p => (
                     <div key={p.id} className="p-3 rounded-md border dark:border-dark-brand-border">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-gray-500">{t('status')}: {p.status} | {t('complianceRate')}: {p.progress}%</p>
                     </div>
                ))}
                {userProjects.length === 0 && <p className="text-sm text-center text-gray-500 py-4">{t('noProjectsAssigned')}</p>}
            </div>
        </div>
    );
};

export default UserProjectInvolvement;
