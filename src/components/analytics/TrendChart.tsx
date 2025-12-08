import React, { useState } from 'react';
import { useTrends } from '../../hooks/useAnalyticsHooks';
import { AlertTriangle } from 'lucide-react';

interface TrendChartProps {
  configId: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ configId }) => {
  const { data: trends, period, setPeriod, isLoading, error } = useTrends(configId, 30);
  const [metric, setMetric] = useState<'successRate' | 'duration' | 'syncCount'>('successRate');

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">Loading trends...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">No trend data available</div>
      </div>
    );
  }

  // Find min and max for scaling
  const values = trends.map((t) => {
    switch (metric) {
      case 'successRate':
        return t.successRate || 0;
      case 'duration':
        return t.averageDuration || 0;
      case 'syncCount':
        return t.syncCount || 0;
      default:
        return 0;
    }
  });

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Create simple line chart using SVG
  const width = 800;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = trends.map((t, i) => {
    const x = padding + (i / (trends.length - 1)) * chartWidth;
    const value = values[i];
    const normalizedValue = (value - minValue) / range;
    const y = padding + chartHeight - normalizedValue * chartHeight;
    return { x, y, value, date: t.timestamp };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const getMetricLabel = () => {
    switch (metric) {
      case 'successRate':
        return 'Success Rate (%)';
      case 'duration':
        return 'Avg Duration (ms)';
      case 'syncCount':
        return 'Sync Count';
      default:
        return '';
    }
  };

  const getMetricUnit = () => {
    switch (metric) {
      case 'successRate':
        return '%';
      case 'duration':
        return 'ms';
      case 'syncCount':
        return '';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Trends</h3>

        <div className="flex flex-wrap gap-4 mb-6">
          {/* Period Selector */}
          <div className="flex gap-2">
            {[7, 14, 30, 60].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex gap-2 ml-auto">
            {[
              { key: 'successRate' as const, label: 'Success Rate' },
              { key: 'duration' as const, label: 'Duration' },
              { key: 'syncCount' as const, label: 'Sync Count' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  metric === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto mb-6">
        <svg width={width} height={height} className="mx-auto" style={{ minWidth: '100%' }}>
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding}
              y1={padding + ratio * chartHeight}
              x2={width - padding}
              y2={padding + ratio * chartHeight}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="2" />

          {/* Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = minValue + ratio * range;
            return (
              <text
                key={`y-${ratio}`}
                x={padding - 10}
                y={padding + (1 - ratio) * chartHeight + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toFixed(0)}
                {getMetricUnit()}
              </text>
            );
          })}

          {/* X-Axis Labels */}
          {trends.map((_, i) => {
            if (i % Math.ceil(trends.length / 6) === 0 || i === trends.length - 1) {
              const x = padding + (i / (trends.length - 1)) * chartWidth;
              const date = new Date(trends[i].timestamp);
              return (
                <text key={`x-${i}`} x={x} y={height - 10} textAnchor="middle" fontSize="12" fill="#6b7280">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              );
            }
            return null;
          })}

          {/* Path */}
          <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle key={`point-${i}`} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
          ))}

          {/* Y-Axis Label */}
          <text
            x={20}
            y={padding - 10}
            fontSize="12"
            fontWeight="bold"
            fill="#374151"
            textAnchor="start"
          >
            {getMetricLabel()}
          </text>
        </svg>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Min Value</div>
          <div className="text-lg font-semibold text-gray-900">
            {minValue.toFixed(1)}
            {getMetricUnit()}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Max Value</div>
          <div className="text-lg font-semibold text-gray-900">
            {maxValue.toFixed(1)}
            {getMetricUnit()}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Average</div>
          <div className="text-lg font-semibold text-gray-900">
            {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}
            {getMetricUnit()}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Data Points</div>
          <div className="text-lg font-semibold text-gray-900">{trends.length}</div>
        </div>
      </div>
    </div>
  );
};
