import React, { useState } from "react";
import { useInsights } from "../../hooks/useAnalyticsHooks";
import {
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface InsightsPanelProps {
  configId: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ configId }) => {
  const { insights, isLoading, error, refresh } = useInsights(configId);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">Loading insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "anomaly":
      case "warning":
        return <AlertCircle className="text-red-500" size={20} />;
      case "trend":
      case "improvement":
        return <TrendingUp className="text-green-500" size={20} />;
      case "recommendation":
      case "suggestion":
        return <Lightbulb className="text-yellow-500" size={20} />;
      case "info":
      case "observation":
        return <Info className="text-blue-500" size={20} />;
      default:
        return <CheckCircle className="text-gray-500" size={20} />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "anomaly":
      case "warning":
        return "border-red-200 bg-red-50";
      case "trend":
      case "improvement":
        return "border-green-200 bg-green-50";
      case "recommendation":
      case "suggestion":
        return "border-yellow-200 bg-yellow-50";
      case "info":
      case "observation":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getInsightTextColor = (type: string) => {
    switch (type) {
      case "anomaly":
      case "warning":
        return "text-red-900";
      case "trend":
      case "improvement":
        return "text-green-900";
      case "recommendation":
      case "suggestion":
        return "text-yellow-900";
      case "info":
      case "observation":
        return "text-blue-900";
      default:
        return "text-gray-900";
    }
  };

  if (insights.length === 0) {
    return (
      <div className="p-6 bg-green-50 rounded-lg shadow border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-600" size={24} />
          <div>
            <h3 className="font-semibold text-green-900">All Systems Normal</h3>
            <p className="text-sm text-green-700">
              No insights or anomalies detected at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-yellow-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">
            Analytics Insights
          </h3>
        </div>
        <div className="text-xs font-medium text-gray-500">
          {insights.length} insight{insights.length !== 1 ? "s" : ""} found
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-all cursor-pointer ${getInsightColor(insight.type)}`}
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getInsightIcon(insight.type)}</div>
              <div className="flex-1">
                <h4
                  className={`font-semibold ${getInsightTextColor(insight.type)} mb-1`}
                >
                  {insight.title}
                </h4>
                <p
                  className={`text-sm ${getInsightTextColor(insight.type)} mb-2`}
                >
                  {insight.message}
                </p>

                {expandedIndex === index && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <div className="bg-white/50 rounded p-3">
                      <p className="text-xs font-semibold uppercase text-gray-700 mb-1">
                        Recommendation
                      </p>
                      <p
                        className={`text-sm ${getInsightTextColor(insight.type)}`}
                      >
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {expandedIndex !== index && (
                  <button className="text-xs font-medium text-gray-600 hover:text-gray-900 mt-2">
                    View recommendation →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Click on any insight to view recommendations
        </p>
        <button
          onClick={refresh}
          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};
