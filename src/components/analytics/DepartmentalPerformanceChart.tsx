import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Department, User, Project, Language, ComplianceStatus, NavigationState } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../common/ThemeProvider';

interface Props {
  projects: Project[];
  departments: Department[];
  users: User[];
  setNavigation: (state: NavigationState) => void;
}

const CustomTooltip = ({ active, payload, label, t }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{label}</p>
          <p className="text-sm text-brand-primary dark:text-brand-primary-400">{`${t('complianceRate')}: ${payload[0].value}%`}</p>
          <p className="text-sm text-gray-500">{`${t('totalTasksTooltip')}: ${payload[0].payload.totalTasks}`}</p>
          <p className="text-xs text-gray-400 mt-2">{t('barChartTooltip')}</p>
        </div>
      );
    }
    return null;
  };

const DepartmentalPerformanceChart: React.FC<Props> = ({ projects, departments, users, setNavigation }) => {
    const { t, lang } = useTranslation();
    const { theme } = useTheme();
  
    const data = useMemo(() => {
      return departments.map(dept => {
        const usersInDept = users.filter(u => u.departmentId === dept.id);
        const userIdsInDept = new Set(usersInDept.map(u => u.id));
        const relevantTasks = projects.flatMap(p => p.checklist).filter(item => item && item.assignedTo && userIdsInDept.has(item.assignedTo));
        const applicableTasks = relevantTasks.filter(c => c.status !== ComplianceStatus.NotApplicable);
  
        let score = 0;
        applicableTasks.forEach(item => {
          if (item.status === ComplianceStatus.Compliant) score += 1;
          if (item.status === ComplianceStatus.PartiallyCompliant) score += 0.5;
        });
  
        const compliance = applicableTasks.length > 0 ? (score / applicableTasks.length) * 100 : 0;
        return {
          id: dept.id,
          name: dept.name[lang as Language],
          compliance: Math.round(compliance),
          totalTasks: relevantTasks.length,
        };
      }).filter(d => d.totalTasks > 0).sort((a,b) => b.compliance - a.compliance);
    }, [projects, departments, users, lang]);

    const handleBarClick = (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        const departmentId = data.activePayload[0].payload.id;
        setNavigation({ view: 'departmentDetail', departmentId });
      }
    };

    const tickStyle = { fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '0.75rem' };
  
    return (
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">{t('departmentalPerformance')}</h3>
        {data.length > 0 ? (
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }} onClick={handleBarClick}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(128,128,128,0.1)' : 'rgba(128,128,128,0.2)'} horizontal={false}/>
                        <XAxis type="number" unit="%" domain={[0, 100]} tick={tickStyle} />
                        <YAxis type="category" dataKey="name" width={80} tick={{...tickStyle, textAnchor: 'end'}} tickLine={false} />
                        <Tooltip content={<CustomTooltip t={t} />} cursor={{fill: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.4)'}}/>
                        <Bar dataKey="compliance" name={t('complianceRate')} fill="#4f46e5" barSize={20} radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : <div className="flex items-center justify-center flex-grow"><p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noDataAvailable')}</p></div>}
      </div>
    );
  };

export default DepartmentalPerformanceChart;