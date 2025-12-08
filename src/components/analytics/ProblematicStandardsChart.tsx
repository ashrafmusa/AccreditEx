import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChecklistItem, ComplianceStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';

interface Props {
  checklistItems: ChecklistItem[];
}

const ProblematicStandardsChart: React.FC<Props> = ({ checklistItems }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const data = useMemo(() => {
    const failureCounts = checklistItems
      .filter(item => item.status === ComplianceStatus.NonCompliant || item.status === ComplianceStatus.PartiallyCompliant)
      .reduce((acc: Record<string, number>, item) => {
        acc[item.standardId] = (acc[item.standardId] || 0) + 1;
        return acc;
      }, {});
      
    return Object.entries(failureCounts)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 7)
      .map(([standard, count]) => ({ standard, count }))
      .reverse(); // For horizontal bar chart, reverse to show highest on top
  }, [checklistItems]);

  const tickStyle = { fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '0.75rem' };
  const tooltipStyle = {
    borderRadius: '0.5rem',
    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">{t('topProblematicStandardsChart')}</h3>
      {data.length > 0 ? (
        <div className="flex-grow min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(128,128,128,0.1)' : 'rgba(128,128,128,0.2)'} horizontal={false}/>
              <XAxis type="number" allowDecimals={false} tick={tickStyle} />
              <YAxis type="category" dataKey="standard" width={80} tick={tickStyle} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{fill: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.4)'}}/>
              <Bar dataKey="count" name={t('failureCount')} fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <div className="flex items-center justify-center flex-grow"><p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noDataAvailable')}</p></div>}
    </div>
  );
};

export default ProblematicStandardsChart;