/**
 * Conflict Resolver Component
 * UI for resolving data conflicts between local and HIS data
 */

import React, { useState, useEffect } from 'react';
import { useConflictResolution } from '../../hooks/useHISIntegration';

interface Conflict {
  id: string;
  localField: string;
  hisField: string;
  localValue: any;
  hisValue: any;
  timestamp: Date;
  type: 'value' | 'array' | 'object';
}

interface ConflictResolverProps {
  configId: string;
  onResolved?: () => void;
}

export function ConflictResolver({ configId, onResolved }: ConflictResolverProps) {
  const { conflicts, resolving, resolveConflict } = useConflictResolution(configId);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolutionStrategy, setResolutionStrategy] = useState<'last-write-wins' | 'merge' | 'manual'>(
    'last-write-wins'
  );
  const [customResolution, setCustomResolution] = useState<any>(null);

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    const success = await resolveConflict(selectedConflict.id, resolutionStrategy, customResolution);

    if (success) {
      setSelectedConflict(null);
      setCustomResolution(null);
      setResolutionStrategy('last-write-wins');

      if (onResolved) {
        onResolved();
      }
    }
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return 'null';

    if (type === 'object') {
      return JSON.stringify(value, null, 2);
    }

    if (Array.isArray(value)) {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  const getValuePreview = (value: any, maxLength: number = 50): string => {
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  const isMoreRecent = (date1: Date, date2: Date): boolean => {
    return date1.getTime() > date2.getTime();
  };

  return (
    <div className="space-y-4">
      {/* Conflicts List */}
      <div className="border rounded-lg p-4 bg-orange-50">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">
          {conflicts.length > 0 ? `${conflicts.length} Conflict(s) Found` : 'No Conflicts'}
        </h3>

        {conflicts.length === 0 ? (
          <p className="text-orange-700">All data is synchronized. No conflicts detected.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conflicts.map((conflict) => (
              <button
                key={conflict.id}
                onClick={() => setSelectedConflict(conflict)}
                className={`w-full text-left p-3 border rounded transition-colors ${
                  selectedConflict?.id === conflict.id
                    ? 'bg-orange-200 border-orange-400'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{conflict.localField}</p>
                    <p className="text-sm text-gray-600">
                      Local: <span className="font-mono">{getValuePreview(conflict.localValue)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      HIS: <span className="font-mono">{getValuePreview(conflict.hisValue)}</span>
                    </p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    {conflict.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Panel */}
      {selectedConflict && (
        <div className="border rounded-lg p-4 space-y-4 bg-white">
          <h4 className="text-base font-semibold">Resolve Conflict</h4>

          {/* Conflict Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Local Value */}
            <div className="border rounded p-3 bg-blue-50">
              <h5 className="font-medium text-blue-900 mb-2">Local Data</h5>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">{selectedConflict.localField}</span>
                </p>
                <pre className="bg-white border border-blue-200 rounded p-2 text-xs overflow-auto max-h-32 text-gray-900">
                  {formatValue(selectedConflict.localValue, selectedConflict.type)}
                </pre>
              </div>
            </div>

            {/* HIS Value */}
            <div className="border rounded p-3 bg-green-50">
              <h5 className="font-medium text-green-900 mb-2">HIS Data</h5>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">{selectedConflict.hisField}</span>
                </p>
                <pre className="bg-white border border-green-200 rounded p-2 text-xs overflow-auto max-h-32 text-gray-900">
                  {formatValue(selectedConflict.hisValue, selectedConflict.type)}
                </pre>
              </div>
            </div>
          </div>

          {/* Resolution Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Strategy</label>
            <div className="space-y-2">
              {[
                {
                  value: 'last-write-wins',
                  label: 'Last Write Wins',
                  description: 'Keep the most recent value',
                },
                {
                  value: 'merge',
                  label: 'Merge',
                  description: 'Combine values if possible (arrays/objects)',
                },
                {
                  value: 'manual',
                  label: 'Manual',
                  description: 'Specify custom resolution',
                },
              ].map((strategy) => (
                <label key={strategy.value} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={strategy.value}
                    checked={resolutionStrategy === strategy.value}
                    onChange={(e) => {
                      setResolutionStrategy(e.target.value as any);
                      setCustomResolution(null);
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{strategy.label}</p>
                    <p className="text-xs text-gray-600">{strategy.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Manual Resolution Input */}
          {resolutionStrategy === 'manual' && selectedConflict.type === 'value' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Value</label>
              <input
                type="text"
                value={customResolution || ''}
                onChange={(e) => setCustomResolution(e.target.value)}
                placeholder="Enter custom value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {resolutionStrategy === 'manual' && (selectedConflict.type === 'object' || selectedConflict.type === 'array') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Value (JSON)</label>
              <textarea
                value={customResolution ? JSON.stringify(customResolution, null, 2) : ''}
                onChange={(e) => {
                  try {
                    setCustomResolution(JSON.parse(e.target.value));
                  } catch (error) {
                    // Invalid JSON, keep as is
                  }
                }}
                placeholder="Enter JSON value"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          )}

          {/* Quick Options */}
          {resolutionStrategy !== 'manual' && (
            <div className="bg-gray-50 border rounded p-3">
              <p className="text-sm text-gray-700 mb-2">
                Will {resolutionStrategy === 'last-write-wins' ? 'use the most recent value' : 'attempt to merge values'}
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  Local value last updated: <span className="font-mono">{new Date().toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleResolveConflict}
              disabled={resolving || (resolutionStrategy === 'manual' && !customResolution)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                resolving || (resolutionStrategy === 'manual' && !customResolution)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
              }`}
            >
              {resolving ? 'Resolving...' : 'Apply Resolution'}
            </button>
            <button
              onClick={() => {
                setSelectedConflict(null);
                setCustomResolution(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConflictResolver;
