import React from 'react';
import { useHealthScore } from '../../hooks/useAnalyticsHooks';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface HealthScoreGaugeProps {
  configId: string;
  showDetails?: boolean;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ configId, showDetails = true }) => {
  const health = useHealthScore(configId);

  if (health.isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-500">Loading health score...</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Attention';
    return 'Critical';
  };

  const getTrendIcon = () => {
    if (health.performanceTrend === 'improving') {
      return <TrendingUp className="text-green-600" size={20} />;
    }
    if (health.performanceTrend === 'declining') {
      return <TrendingDown className="text-red-600" size={20} />;
    }
    return <div className="text-blue-600 text-lg">→</div>;
  };

  const scoreColor = getScoreColor(health.overall);

  // SVG Gauge Chart
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health.overall / 100) * circumference;

  return (
    <div className={`${scoreColor.bg} ${scoreColor.border} border rounded-lg p-8`}>
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${scoreColor.text} mb-2`}>System Health Score</h3>
        <p className="text-sm text-gray-700">Overall integration health status</p>
      </div>

      {/* Gauge */}
      <div className="flex justify-center mb-6">
        <svg width="220" height="140" viewBox="0 0 220 140">
          {/* Background arc */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            startOffset="0"
          />

          {/* Score arc */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={health.overall >= 80 ? '#16a34a' : health.overall >= 60 ? '#eab308' : '#dc2626'}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '110px 110px',
            }}
          />

          {/* Score text */}
          <text x="110" y="125" fontSize="48" fontWeight="bold" textAnchor="middle" fill="#1f2937">
            {health.overall}
          </text>
          <text x="145" y="120" fontSize="20" textAnchor="start" fill="#6b7280">
            /100
          </text>
        </svg>
      </div>

      {/* Status */}
      <div className="text-center mb-6">
        <p className={`text-sm font-semibold ${scoreColor.text}`}>{getScoreStatus(health.overall)}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs text-gray-700">Trend:</span>
          {getTrendIcon()}
          <span className="text-xs text-gray-700 capitalize">{health.performanceTrend}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-3 border-t border-current border-opacity-20 pt-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Sync Health</span>
              <span className="text-sm font-semibold text-gray-900">{health.syncHealth}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${health.syncHealth}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Data Quality</span>
              <span className="text-sm font-semibold text-gray-900">{health.dataQuality}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${health.dataQuality}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">System Stability</span>
              <span className="text-sm font-semibold text-gray-900">{health.systemStability}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${health.systemStability}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
