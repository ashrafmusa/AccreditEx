import React, { useMemo } from 'react';
import { Department, User, Project, Risk, UserTrainingStatus } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../common/ThemeProvider';

interface TrainingEffectivenessChartProps {
  projects: Project[];
  risks: Risk[];
  departments: Department[];
  users: User[];
  userTrainingStatuses: { [userId: string]: UserTrainingStatus };
}

const TrainingEffectivenessChart: React.FC<TrainingEffectivenessChartProps> = ({ projects, risks, departments, users, userTrainingStatuses }) => {
  const { t, lang } = useTranslation();
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    return departments.map(dept => {
      const usersInDept = users.filter(u => u.departmentId === dept.id);
      if (usersInDept.length === 0) return null;

      const userIdsInDept = new Set(usersInDept.map(u => u.id));

      const capaIssues = projects.flatMap(p => p.capaReports).filter(c => c.assignedTo && userIdsInDept.has(c.assignedTo)).length;
      const riskIssues = risks.filter(r => r.ownerId && userIdsInDept.has(r.ownerId)).length;
      const totalIssues = capaIssues + riskIssues;

      let totalAssigned = 0;
      let totalCompleted = 0;
      usersInDept.forEach(user => {
        const assigned = user.trainingAssignments || [];
        totalAssigned += assigned.length;
        assigned.forEach(assignment => {
          const status = userTrainingStatuses[user.id]?.[assignment.trainingId];
          if (status?.status === 'Completed') {
            totalCompleted++;
          }
        });
      });
      const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

      return { name: dept.name[lang], totalIssues, completionRate };
    }).filter((item): item is NonNullable<typeof item> => item !== null && (item.totalIssues > 0 || item.completionRate > 0));
  }, [projects, risks, departments, users, userTrainingStatuses, lang]);
  
  const tickStyle = { fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '0.75rem' };
  const tooltipStyle = {
    borderRadius: '0.5rem',
    background: theme === 'dark' ? '#0f172a' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">{t('trainingEffectiveness')}</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(128,128,128,0.1)' : 'rgba(128,128,128,0.2)'} vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} />
            <YAxis yAxisId="left" orientation="left" stroke="#EF4444" tick={tickStyle} />
            <YAxis yAxisId="right" orientation="right" stroke="#22C55E" tick={tickStyle} unit="%" domain={[0, 100]}/>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="left" dataKey="totalIssues" name={t('totalIssues')} fill="#EF4444" barSize={20} />
            <Bar yAxisId="right" dataKey="completionRate" name={t('trainingCompletionRate')} fill="#22C55E" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      ) : <div className="flex items-center justify-center h-[300px]"><p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noDataAvailable')}</p></div>}
    </div>
  );
};

export default TrainingEffectivenessChart;