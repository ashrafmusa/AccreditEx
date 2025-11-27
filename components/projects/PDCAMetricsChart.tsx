import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ImprovementMetrics } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface PDCAMetricsChartProps {
  metrics: ImprovementMetrics;
  title?: string;
}

const PDCAMetricsChart: React.FC<PDCAMetricsChartProps> = ({ metrics, title }) => {
  const { t } = useTranslation();

  // Transform data for chart
  // We want to group by metric name
  const data = metrics.baseline.map((baseMetric, index) => {
    const targetMetric = metrics.target.find(m => m.metric === baseMetric.metric);
    const actualMetric = metrics.actual?.find(m => m.metric === baseMetric.metric);

    return {
      name: baseMetric.metric,
      Baseline: baseMetric.value,
      Target: targetMetric?.value || 0,
      Actual: actualMetric?.value || 0,
      unit: baseMetric.unit
    };
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">{t('noMetricsDefined') || 'No metrics defined'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-brand-text-primary dark:text-dark-brand-text-primary">
          {title}
        </h3>
      )}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              tick={{ fill: '#6b7280' }} 
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              stroke="#6b7280" 
              tick={{ fill: '#6b7280' }} 
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} name={t('baseline') || 'Baseline'} />
            <Bar dataKey="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('target') || 'Target'} />
            <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} name={t('actual') || 'Actual'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PDCAMetricsChart;
