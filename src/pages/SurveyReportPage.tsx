import React from 'react';
import { Project, MockSurvey, User, NavigationState } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface SurveyReportPageProps {
  project: Project;
  survey: MockSurvey;
  users: User[];
  surveyor?: User;
  onApplyFindings: (projectId: string, surveyId: string) => void;
  setNavigation: (state: NavigationState) => void;
}

const SurveyReportPage: React.FC<SurveyReportPageProps> = ({ project, survey, users, surveyor, onApplyFindings, setNavigation }) => {
    const { t } = useTranslation();
    const failedItems = survey.results.filter(r => r.result === 'Fail');

    return (
        <div className="space-y-6">
            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
                <h1 className="text-2xl font-bold">{t('surveyReport')} - {project.name}</h1>
                <p className="text-sm text-gray-500">Date: {new Date(survey.date).toLocaleDateString()} | Surveyor: {surveyor?.name}</p>
                <button onClick={() => onApplyFindings(project.id, survey.id)} className="mt-4 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm">{t('applyFindings')}</button>
            </div>
            
            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
                <h2 className="text-xl font-semibold mb-4">{t('failedItems')} ({failedItems.length})</h2>
                <div className="space-y-4">
                    {failedItems.map(result => {
                        const item = project.checklist.find(c => c.id === result.checklistItemId);
                        if (!item) return null;
                        return (
                            <div key={result.checklistItemId} className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                <p className="font-semibold">{item.item}</p>
                                <p className="text-xs text-gray-500 mb-2">{item.standardId}</p>
                                <p className="text-sm italic">"{result.notes}"</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default SurveyReportPage;
