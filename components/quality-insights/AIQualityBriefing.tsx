import React, { useState } from 'react';
import { AIQualityBriefing as AIQualityBriefingType, Project, Risk, User, Department, Competency } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
// FIX: Corrected import path for backendService
import { backendService } from '../../services/BackendService';
import { SparklesIcon, CheckBadgeIcon, ExclamationTriangleIcon, LightBulbIcon } from '../icons';

interface AIQualityBriefingProps {
  projects: Project[];
  risks: Risk[];
  users: User[];
  departments: Department[];
  competencies: Competency[];
}

const AIQualityBriefing: React.FC<AIQualityBriefingProps> = ({ projects, risks, users, departments, competencies }) => {
  const { t } = useTranslation();
  const [briefing, setBriefing] = useState<AIQualityBriefingType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setBriefing(null);
    try {
      const result = await backendService.generateQualityBriefing(projects, risks, users, departments, competencies);
      setBriefing(result);
    } catch (e) {
      setError(t('briefingError'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
         <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/50 to-purple-50 dark:to-purple-900/50 p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-brand-primary" />
            {t('aiQualityBriefing')}
          </h3>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 max-w-2xl">{t('aiQualityBriefingDescription')}</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-semibold shadow-sm w-full sm:w-auto disabled:bg-indigo-400 disabled:cursor-wait"
        >
          <SparklesIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
          {isLoading ? t('generatingBriefing') : t('generateBriefing')}
        </button>
      </div>

      <div className="mt-6 border-t border-indigo-200 dark:border-indigo-800 pt-6">
        {isLoading && renderSkeleton()}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {briefing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeInUp_0.5s_ease-out]">
            {/* Strengths */}
            <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-300"><CheckBadgeIcon className="w-5 h-5"/>{t('strengths')}</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {briefing.strengths.map((s, i) => <li key={`s-${i}`}>{s}</li>)}
                </ul>
            </div>
            {/* Concerns */}
            <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-300"><ExclamationTriangleIcon className="w-5 h-5"/>{t('areasForImprovement')}</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {briefing.concerns.map((c, i) => <li key={`c-${i}`}>{c}</li>)}
                </ul>
            </div>
            {/* Recommendations */}
            <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300"><LightBulbIcon className="w-5 h-5"/>{t('recommendations')}</h4>
                <ul className="space-y-3 text-sm">
                    {briefing.recommendations.map((r, i) => (
                        <li key={`r-${i}`} className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                            <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{r.title}</p>
                            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{r.details}</p>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIQualityBriefing;