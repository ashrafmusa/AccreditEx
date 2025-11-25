import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Project } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';

interface Props {
  projects: Project[];
}

const ComplianceOverTimeChart: React.FC<Props> = ({ projects }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    const timeData = projects.reduce((acc: Record<string, { sum: number, count: number }>, project) => {
      const month = new Date(project.startDate).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!acc[month]) acc[month] = { sum: 0, count: 0 };
      acc[month].sum += project.progress;
      acc[month].count += 1;
      return acc;
    }, {});
    
    return Object.entries(timeData)
      .map(([month, data]) => ({ month, compliance: Math.round((data as any).sum / (data as any).count) }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
  }, [projects]);

  const tickStyle = { fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '0.75rem' };
  const tooltipStyle = {
    borderRadius: '0.5rem',
    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">{t('complianceOverTime')}</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(128,128,128,0.1)' : 'rgba(128,128,128,0.2)'} />
            <XAxis dataKey="month" tick={tickStyle} />
            <YAxis tick={tickStyle} unit="%"/>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="compliance" name={t('complianceRate')} stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" dot={{ r: 4 }} activeDot={{ r: 6, strokeWidth: 2 }}/>
          </AreaChart>
        </ResponsiveContainer>
      ) : <div className="flex items-center justify-center h-[300px]"><p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noDataAvailable')}</p></div>}
    </div>
  );
};

export default ComplianceOverTimeChart;