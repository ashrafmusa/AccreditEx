import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIAgent } from '@/hooks/useAIAgent';
import { SparklesIcon, ArrowPathIcon } from '@/components/icons';
import ReactMarkdown from 'react-markdown';

interface AnalyticsAIWidgetProps {
  data: {
    kpis: {
      overdueTasks: number;
      activeProjects: number;
      complianceRate: number;
      capaResolutionRate: number;
    };
    projectStatus: Record<string, number>;
    topRisks: string[];
  };
}

const AnalyticsAIWidget: React.FC<AnalyticsAIWidgetProps> = ({ data }) => {
  const { t } = useTranslation();
  const { chatHistory, isLoading, error, sendMessage, clearHistory } = useAIAgent();
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = () => {
    clearHistory();
    const prompt = `
      Analyze the following accreditation data and provide a concise executive summary.
      Focus on:
      1. Key achievements (high compliance, resolution rates)
      2. Critical risks (overdue tasks, low compliance areas)
      3. 3 specific actionable recommendations for the Project Lead.

      Data:
      ${JSON.stringify(data, null, 2)}
      
      Format the response in Markdown with clear headings and bullet points.
    `;
    sendMessage(prompt, { page_title: 'Analytics Hub', user_role: 'Admin' });
    setHasGenerated(true);
  };

  const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-lg border border-sky-100 dark:border-slate-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <SparklesIcon className="w-24 h-24 text-sky-600 dark:text-sky-400" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('aiInsights') || 'AI Insights'}
            </h3>
          </div>
          <button
            onClick={generateInsights}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
            {hasGenerated ? (t('regenerate') || 'Regenerate') : (t('generateInsights') || 'Generate Insights')}
          </button>
        </div>

        <div className="min-h-[200px] bg-white/60 dark:bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/50 dark:border-white/10">
          {isLoading && !lastMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 gap-2">
              <ArrowPathIcon className="w-6 h-6 animate-spin" />
              <p className="text-sm">{t('analyzingData') || 'Analyzing data...'}</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          ) : lastMessage?.role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{lastMessage.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
              <SparklesIcon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm max-w-xs">
                {t('clickToGenerateInsights') || 'Click "Generate Insights" to get an AI-powered analysis of your current accreditation status.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAIWidget;
