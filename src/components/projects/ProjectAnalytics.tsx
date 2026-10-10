import React, { useMemo } from 'react';
import { Project, ProjectStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import AnalyticsCard from './AnalyticsCard';
import { FolderIcon, CheckIcon, ClockIcon, ChartBarSquareIcon } from '@/components/icons';
import { PROJECT_STATUS_KEYS, projectCalendarDate } from '@/utils/projectJourney';

interface ProjectAnalyticsProps {
  projects: Project[];
}

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projects }) => {
  const { t, lang } = useTranslation();
  const accreditationPrograms = useAppStore(state => state.accreditationPrograms);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const isComplete = (p: Project) => p.status === ProjectStatus.Finalized || p.status === ProjectStatus.Completed || p.status === ProjectStatus.Closed;
    const active = projects.filter(p => !p.archived && !isComplete(p)).length;
    const completed = projects.filter(isComplete).length;
    const assessed = projects.filter(p => Number.isFinite(p.progress) && p.progress >= 0 && p.progress <= 100);
    const avgCompletion = assessed.length > 0
      ? Math.round(assessed.reduce((sum, p) => sum + p.progress, 0) / assessed.length)
      : null;

    return { total, active, completed, avgCompletion };
  }, [projects]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    projects.forEach(p => {
      const status = p.status || 'Not Started';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }, [projects]);

  // Program distribution
  const programDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    projects.forEach(p => {
      const program = accreditationPrograms.find(prog => prog.id === p.programId);
      const programName = program?.name || t('projectUnknownProgram');
      distribution[programName] = (distribution[programName] || 0) + 1;
    });
    return distribution;
  }, [projects, accreditationPrograms, lang]);

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    return projects
      .filter(p => {
        if (!p.endDate || p.archived || p.status === ProjectStatus.Finalized || p.status === ProjectStatus.Completed || p.status === ProjectStatus.Closed) return false;
        const endDate = projectCalendarDate(p.endDate);
        return !!endDate && endDate >= now && endDate <= thirtyDaysFromNow;
      })
      .flatMap(p => {
        const endDate = projectCalendarDate(p.endDate);
        if (!endDate) return [];
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return [{ ...p, daysRemaining }];
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);
  }, [projects]);

  // Get color for urgency
  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 14) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  // Calculate max value for bar chart scaling
  const maxProgramCount = Math.max(...Object.values(programDistribution), 1);

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          icon={<FolderIcon className="w-6 h-6" />}
          value={stats.total}
          label={t('totalProjects')}
          color="blue"
        />
        <AnalyticsCard
          icon={<ClockIcon className="w-6 h-6" />}
          value={stats.active}
          label={t('activeProjects')}
          color="blue"
        />
        <AnalyticsCard
          icon={<CheckIcon className="w-6 h-6" />}
          value={stats.completed}
          label={t('completedProjects')}
          color="green"
        />
        <AnalyticsCard
          icon={<ChartBarSquareIcon className="w-6 h-6" />}
          value={stats.avgCompletion === null ? t('projectNotAssessed') : `${stats.avgCompletion}%`}
          label={t('projectAverageChecklist')}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('statusDistribution')}
          </h3>
          <div className="space-y-3">
            {Object.entries(statusDistribution).map(([status, count]) => {
              const percentage = (count / stats.total) * 100;
              const statusColors: Record<string, string> = {
                'Not Started': 'bg-gray-500',
                'In Progress': 'bg-blue-500',
                'On Hold': 'bg-yellow-500',
                'Completed': 'bg-green-500',
                'Finalized': 'bg-rose-500'
              };
              const color = statusColors[status] || 'bg-gray-500';

              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{t(PROJECT_STATUS_KEYS[status as ProjectStatus] || status)}</span>
                    <span className="text-gray-600 dark:text-gray-400">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects by Program */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('projectsByProgram')}
          </h3>
          <div className="space-y-3">
            {Object.entries(programDistribution).map(([program, count]) => {
              const percentage = (count / maxProgramCount) * 100;

              return (
                <div key={program}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{program}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📅 {t('upcomingDeadlines')}
        </h3>
        {upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeadlines.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {projectCalendarDate(project.endDate)?.toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                  </p>
                </div>
                <div className={`text-sm font-semibold ml-4 ${getUrgencyColor(project.daysRemaining)}`}>
                  {project.daysRemaining} {t('daysRemaining')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {t('noUpcomingDeadlines')}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalytics;
