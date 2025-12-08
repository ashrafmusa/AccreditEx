import React from 'react';
import { useDataQuality } from '../../hooks/useAnalyticsHooks';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface DataQualityPanelProps {
  configId: string;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ configId }) => {
  const quality = useDataQuality(configId);

  if (quality.isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">Loading data quality metrics...</div>
      </div>
    );
  }

  const getQualityScore = () => {
    if (quality.totalRecords === 0) return 100;
    return Math.round(
      ((quality.validRecords / quality.totalRecords) * 100 + quality.dataIntegrity) / 2
    );
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
    if (score >= 90) return { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700' };
    if (score >= 80) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
    if (score >= 70) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
  };

  const qualityScore = getQualityScore();
  const qualityColor = getQualityColor(qualityScore);

  const getStatusIcon = () => {
    if (qualityScore >= 95) return <CheckCircle className="text-green-600" size={24} />;
    if (qualityScore >= 80) return <AlertCircle className="text-yellow-600" size={24} />;
    return <AlertTriangle className="text-red-600" size={24} />;
  };

  return (
    <div className={`${qualityColor.bg} ${qualityColor.border} border rounded-lg p-6`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Quality</h3>
          <p className="text-sm text-gray-600">Comprehensive data integrity assessment</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getStatusIcon()}
            <div className="text-3xl font-bold text-gray-900">{qualityScore}%</div>
          </div>
          <p className="text-xs text-gray-600">Overall quality score</p>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded p-4">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Total Records</div>
          <div className="text-2xl font-bold text-gray-900">{quality.totalRecords.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Processed</p>
        </div>

        <div className="bg-white rounded p-4">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Valid Records</div>
          <div className="text-2xl font-bold text-green-600">{quality.validRecords.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">
            {quality.totalRecords > 0
              ? ((quality.validRecords / quality.totalRecords) * 100).toFixed(1)
              : '0'}
            %
          </p>
        </div>

        <div className="bg-white rounded p-4">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Invalid Records</div>
          <div className="text-2xl font-bold text-red-600">{quality.invalidRecords.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">{quality.validationErrorRate.toFixed(1)}% error rate</p>
        </div>
      </div>

      {/* Data Integrity */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Data Integrity</span>
          <span className="text-sm font-bold text-gray-900">{quality.dataIntegrity}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              quality.dataIntegrity >= 90
                ? 'bg-green-600'
                : quality.dataIntegrity >= 80
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
            }`}
            style={{ width: `${quality.dataIntegrity}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {quality.dataIntegrity >= 95
            ? 'Excellent - all records complete and consistent'
            : quality.dataIntegrity >= 80
              ? 'Good - minor missing or inconsistent data'
              : 'Fair - significant data issues detected'}
        </p>
      </div>

      {/* Issues */}
      <div className="space-y-3 mb-6 p-4 bg-white rounded">
        <h4 className="text-sm font-semibold text-gray-800">Detected Issues</h4>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Duplicate Records</span>
          <span className="font-semibold text-gray-900">{quality.duplicateCount}</span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Missing Fields</h5>
          {Object.keys(quality.missingFieldErrors).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(quality.missingFieldErrors)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([field, count]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{field}</span>
                    <span className="text-xs font-semibold text-red-600">{count} missing</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No missing fields detected</p>
          )}
        </div>
      </div>

      {/* Validation Error Rate */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Validation Error Rate</span>
          <span className={`text-lg font-bold ${qualityColor.text}`}>
            {quality.validationErrorRate.toFixed(2)}%
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {quality.validationErrorRate < 1
            ? '✓ Excellent validation pass rate'
            : quality.validationErrorRate < 5
              ? '◐ Acceptable validation errors'
              : '✗ High validation error rate - review needed'}
        </p>
      </div>
    </div>
  );
};
