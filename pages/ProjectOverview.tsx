import React from 'react';
import { Project, User, ComplianceStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import StatCard from '@/components/common/StatCard';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@/components/icons';
import { useUserStore } from '@/stores/useUserStore';

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  const { t, lang } = useTranslation();
  const { users } = useUserStore();

  const stats = React.useMemo(() => {
    const total = project.checklist.length;
    const compliant = project.checklist.filter(i => i.status === ComplianceStatus.Compliant).length;
    const nonCompliant = project.checklist.filter(i => i.status === ComplianceStatus.NonCompliant).length;
    const openCapa = project.capaReports.filter(c => c.status === 'Open').length;
    return { total, compliant, nonCompliant, openCapa };
  }, [project]);

  const teamMemberIds = new Set(project.checklist.map(item => item.assignedTo).filter(Boolean));
  teamMemberIds.add(project.projectLead.id);
  const teamMembers = Array.from(teamMemberIds).map(id => users.find(u => u.id === id)).filter((u): u is User => !!u);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t('compliant')} value={`${stats.compliant} / ${stats.total}`} icon={CheckCircleIcon} color="from-green-500 to-green-700" />
        <StatCard title={t('nonCompliant')} value={stats.nonCompliant} icon={ExclamationTriangleIcon} color="from-red-500 to-red-700" />
        <StatCard title={t('openCapaReports')} value={stats.openCapa} icon={ClockIcon} color="from-yellow-500 to-yellow-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold mb-4">{t('teamMembers')}</h3>
          <div className="space-y-3">
            {teamMembers.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.id === project.projectLead.id ? t('projectLead') : user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold mb-4">{t('auditLog')}</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {project.activityLog.slice(0, 10).map(log => (
              <div key={log.id} className="text-sm">
                <p className="font-semibold">{log.action[lang]} <span className="font-normal text-gray-500">by {log.user}</span></p>
                <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
