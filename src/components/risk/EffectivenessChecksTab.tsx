
import React, { useMemo, useState } from 'react';
import { Project, CAPAReport } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { CheckCircleIcon } from '../icons';

interface Props {
  projects: Project[];
  onUpdateCapa: (projectId: string, capa: CAPAReport) => void;
}

const EffectivenessChecksTab: React.FC<Props> = ({ projects, onUpdateCapa }) => {
  const { t, dir } = useTranslation();
  const [completingCheck, setCompletingCheck] = useState<(CAPAReport & { projectId: string }) | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const checks = useMemo(() => 
    projects.flatMap(p => 
      p.capaReports
        .filter(c => c.effectivenessCheck?.required && !c.effectivenessCheck.completed)
        .map(capa => ({ ...capa, projectId: p.id }))
    ),
  [projects]);

  const handleComplete = () => {
    if (!completingCheck) return;
    const { projectId, ...capaData } = completingCheck;
    const updatedCapa = {
      ...capaData,
      effectivenessCheck: {
        ...completingCheck.effectivenessCheck!,
        completed: true,
        notes: completionNotes,
      },
    };
    onUpdateCapa(projectId, updatedCapa);
    setCompletingCheck(null);
    setCompletionNotes('');
  };

  return (
    <>
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('source')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('checkDueDate')}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('actions')}</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                      {checks.map(capa => (
                          <tr key={capa.id}>
                              <td className="px-6 py-4">{capa.sourceStandardId}</td>
                              <td className="px-6 py-4">{new Date(capa.effectivenessCheck!.dueDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4"><button onClick={() => setCompletingCheck(capa)} className="flex items-center text-sm text-brand-primary hover:underline"><CheckCircleIcon className="w-4 h-4 mr-1"/>{t('completeCheck')}</button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {checks.length === 0 && <p className="text-center py-8 text-gray-500">{t('noEffectivenessChecks')}</p>}
          </div>
      </div>
      {completingCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={() => setCompletingCheck(null)}>
            <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
                <div className="p-6">
                    <h3 className="text-lg font-medium">{t('completeEffectivenessCheck')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{completingCheck.sourceStandardId}</p>
                    <div className="mt-4">
                        <label htmlFor="completionNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('effectivenessCheckNotes')}</label>
                        <textarea id="completionNotes" value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
                    <button type="button" onClick={() => setCompletingCheck(null)} className="py-2 px-4 border rounded-md text-sm">{t('cancel')}</button>
                    <button type="button" onClick={handleComplete} className="py-2 px-4 border rounded-md text-sm text-white bg-brand-primary">{t('save')}</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default EffectivenessChecksTab;