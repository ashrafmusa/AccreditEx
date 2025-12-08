import React, { useState } from 'react';
import { Project, MockSurvey, User, NavigationState, MockSurveyResult } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface SurveyComponentProps {
  project: Project;
  survey: MockSurvey;
  users: User[];
  onUpdateSurvey: (projectId: string, survey: MockSurvey) => void;
  setNavigation: (state: NavigationState) => void;
}

const SurveyComponent: React.FC<SurveyComponentProps> = ({ project, survey, users, onUpdateSurvey, setNavigation }) => {
    const { t } = useTranslation();
    const [results, setResults] = useState<MockSurveyResult[]>(survey.results);
    const surveyor = users.find(u => u.id === survey.surveyorId);

    const handleResultChange = (checklistItemId: string, field: keyof MockSurveyResult, value: any) => {
        const newResults = results.map(r => 
            r.checklistItemId === checklistItemId ? { ...r, [field]: value } : r
        );
        setResults(newResults);
    };

    const handleSave = () => {
        onUpdateSurvey(project.id, { ...survey, results });
        alert('Progress saved!');
    };
    
    const handleComplete = () => {
        onUpdateSurvey(project.id, { ...survey, results, status: 'Completed' });
        setNavigation({ view: 'surveyReport', projectId: project.id, surveyId: survey.id });
    };

    return (
        <div className="space-y-6">
            <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
                <h1 className="text-2xl font-bold">{t('mockSurvey')} - {project.name}</h1>
                <p className="text-sm text-gray-500">Date: {new Date(survey.date).toLocaleDateString()} | Surveyor: {surveyor?.name}</p>
            </div>
            
            <div className="space-y-4">
                {project.checklist.map(item => {
                    const result = results.find(r => r.checklistItemId === item.id);
                    return (
                        <div key={item.id} className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg border dark:border-dark-brand-border">
                            <p className="font-semibold">{item.item}</p>
                            <p className="text-xs text-gray-400">{item.standardId}</p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-4">
                                        {(['Pass', 'Fail', 'Not Applicable'] as const).map(res => (
                                            <label key={res} className="flex items-center gap-1 text-sm">
                                                <input type="radio" name={`result-${item.id}`} value={res} checked={result?.result === res} onChange={() => handleResultChange(item.id, 'result', res)} />
                                                {res}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <textarea 
                                        value={result?.notes || ''} 
                                        onChange={(e) => handleResultChange(item.id, 'notes', e.target.value)}
                                        rows={2} 
                                        placeholder="Surveyor notes..." 
                                        className="w-full text-sm p-2 border rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="flex justify-end gap-4">
                <button onClick={handleSave} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md">{t('saveChanges')}</button>
                <button onClick={handleComplete} className="bg-brand-primary text-white py-2 px-4 rounded-md">{t('completeSurvey')}</button>
            </div>
        </div>
    );
};

export default SurveyComponent;
