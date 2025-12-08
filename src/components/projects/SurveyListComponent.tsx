import React from 'react';
import { Project, NavigationState, MockSurvey } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { ClipboardDocumentSearchIcon, PlusIcon } from '@/components/icons';

interface SurveyListComponentProps {
  project: Project;
  setNavigation: (state: NavigationState) => void;
}

const SurveyListComponent: React.FC<SurveyListComponentProps> = ({ project, setNavigation }) => {
    const { t } = useTranslation();
    const { startMockSurvey } = useProjectStore();

    const handleStartSurvey = async () => {
        const { newSurvey } = await startMockSurvey(project.id);
        setNavigation({ view: 'mockSurvey', projectId: project.id, surveyId: newSurvey.id });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{t('mockSurveys')}</h2>
                <button onClick={handleStartSurvey} className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <PlusIcon className="w-4 h-4"/>
                    {t('startNewSurvey')}
                </button>
            </div>

            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('date')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('actions')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
                            {project.mockSurveys.map((survey: MockSurvey) => (
                                <tr key={survey.id}>
                                    <td className="px-6 py-4">{new Date(survey.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{survey.status}</td>
                                    <td className="px-6 py-4">
                                        {survey.status === 'In Progress' ? (
                                             <button onClick={() => setNavigation({ view: 'mockSurvey', projectId: project.id, surveyId: survey.id })} className="text-sm text-brand-primary">{t('continueSurvey')}</button>
                                        ) : (
                                            <button onClick={() => setNavigation({ view: 'surveyReport', projectId: project.id, surveyId: survey.id })} className="text-sm text-brand-primary">{t('viewReport')}</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {project.mockSurveys.length === 0 && <p className="text-center py-8 text-gray-500">{t('noMockSurveys')}</p>}
                </div>
            </div>
        </div>
    );
};

export default SurveyListComponent;
