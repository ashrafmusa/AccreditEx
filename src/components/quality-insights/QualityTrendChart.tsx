import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';
import { Project, Risk } from '@/types';

interface QualityTrendChartProps {
  projects: Project[];
  risks: Risk[];
}

const QualityTrendChart: React.FC<QualityTrendChartProps> = ({ projects, risks }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Generate trend data based on current metrics
  // In a real app, this would come from historical snapshots
  const data = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Calculate current metrics
    const totalProjects = projects.length || 1;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const activeProjects = projects.filter(p => p.status === 'In Progress').length;
    const currentCompliance = Math.round(((completedProjects + activeProjects) / totalProjects) * 100);
    
    const totalRisks = risks.length || 1;
    const mitigatedRisks = risks.filter(r => r.status === 'Mitigated' || r.status === 'Closed').length;
    const currentRiskControl = Math.round((mitigatedRisks / totalRisks) * 100);
    
    const currentScore = Math.round((currentCompliance * 0.6) + (currentRiskControl * 0.4));

    // Simulate historical trend with some variance
    return months.map((month, index) => {
      // Create a slight upward trend ending at current values
      const variance = (5 - index) * 2; // Higher variance in past months
      const randomFluctuation = Math.random() * 5 - 2.5;
      
      return {
        month,
        score: Math.min(100, Math.max(0, Math.round(currentScore - variance + randomFluctuation))),
        compliance: Math.min(100, Math.max(0, Math.round(currentCompliance - variance + randomFluctuation))),
        risk: Math.min(100, Math.max(0, Math.round(currentRiskControl - variance + randomFluctuation)))
      };
    });
  }, [projects, risks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {entry.name === 'score' ? t('qualityScore') || 'Quality Score' : 
                 entry.name === 'compliance' ? t('compliance') || 'Compliance' : 
                 t('riskControl') || 'Risk Control'}:
              </span>
              <span className="font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t('strategicQualityTrends') || 'Strategic Quality Trends'}
          </h3>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t('qualityScoreOverTime') || 'Composite Quality Score over last 6 months'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-sky-500"></span>
            <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('qualityScore') || 'Quality Score'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('compliance') || 'Compliance'}</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="compliance" 
              stroke="#34d399" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorCompliance)" 
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#6366f1" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QualityTrendChart;
