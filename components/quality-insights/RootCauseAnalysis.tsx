import React, { useState, useMemo } from 'react';
import { Project, Risk } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../common/ThemeProvider';

interface RootCauseAnalysisProps {
  projects: Project[];
  risks: Risk[];
}

const RootCauseAnalysis: React.FC<RootCauseAnalysisProps> = ({ projects, risks }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  const allIssues = useMemo(() => [
      ...projects.flatMap(p => p.capaReports.map(c => ({...c, type: 'CAPA' as const, projectName: p.name}))),
      ...risks.map(r => ({...r, type: 'Risk' as const, projectName: 'Organizational'}))
  ], [projects, risks]);

  const rootCauseData = useMemo(() => {
    const categoryCounts = allIssues.reduce((acc, issue) => {
      if (issue.rootCauseCategory) {
        const key = issue.rootCauseCategory;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([name, value]) => ({ name, value, translatedName: t(name as any) }));
  }, [allIssues, t]);
  
  const filteredIssues = useMemo(() => {
    if (!selectedCategoryKey) return [];
    return allIssues.filter(issue => issue.rootCauseCategory === selectedCategoryKey);
  }, [allIssues, selectedCategoryKey]);

  const handlePieClick = (data: any) => {
    const clickedCategoryKey = data.payload.payload.name;
    setSelectedCategoryKey(prev => prev === clickedCategoryKey ? null : clickedCategoryKey);
  };
  
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];
  const tooltipStyle = {
    borderRadius: '0.5rem',
    background: theme === 'dark' ? '#0f172a' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{t('rootCauseAnalysisDashboard')}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
        <div className="lg:col-span-2">
            {rootCauseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                    data={rootCauseData} 
                    dataKey="value" 
                    nameKey="translatedName" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    onClick={handlePieClick}
                    cursor="pointer"
                >
                    {rootCauseData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke={selectedCategoryKey === entry.name ? (theme === 'dark' ? '#FFF' : '#000') : 'none'}
                            strokeWidth={2}
                        />
                    ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[300px]"><p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noDataAvailable')}</p></div>}
        </div>
        <div className="lg:col-span-3">
          <h4 className="font-semibold mb-2">{t('issueDetails')} {selectedCategoryKey && `: ${t(selectedCategoryKey as any)}`}</h4>
          <div className="max-h-[280px] overflow-y-auto pr-2 border-t dark:border-dark-brand-border pt-2">
            {filteredIssues.length > 0 ? (
                <table className="min-w-full text-sm">
                    <thead>
                        <tr>
                            <th className="py-1 text-left font-medium">{t('description')}</th>
                            <th className="py-1 text-left font-medium">{t('issueType')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIssues.map(issue => (
                            <tr key={issue.id} className="border-b dark:border-dark-brand-border">
                                <td className="py-2 pr-2">{issue.type === 'CAPA' ? issue.description : issue.title}</td>
                                <td className="py-2">{issue.type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p className="text-sm text-center text-gray-500 py-4">{selectedCategoryKey ? 'No issues for this category' : 'Click on a chart slice to see details'}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootCauseAnalysis;