import React, { useState, useEffect } from 'react';
import { Project, AppDocument, DesignControlItem } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { PlusIcon, TrashIcon, PaperClipIcon } from '../components/icons';

interface DesignControlsPageProps {
  project: Project;
  documents: AppDocument[];
  isFinalized: boolean;
  onSave: (designControls: DesignControlItem[]) => void;
}

const DesignControlsPage: React.FC<DesignControlsPageProps> = ({ project, documents, isFinalized, onSave }) => {
  const { t, lang } = useTranslation();
  const [controls, setControls] = useState<DesignControlItem[]>([]);

  useEffect(() => {
    setControls(JSON.parse(JSON.stringify(project.designControls || [])));
  }, [project.designControls]);

  const handleUpdate = (index: number, field: keyof DesignControlItem, value: any) => {
    const newControls = [...controls];
    (newControls[index] as any)[field] = value;
    setControls(newControls);
  };

  const addRow = () => {
    const newRow: DesignControlItem = {
      id: `dc-${Date.now()}`,
      userNeed: '',
      designInput: '',
      designOutput: '',
      verification: '',
      validation: '',
      linkedDocumentIds: [],
    };
    setControls([...controls, newRow]);
  };

  const removeRow = (index: number) => {
    setControls(controls.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    onSave(controls);
    alert('Changes saved!');
  };

  const textareaClasses = "w-full min-h-[80px] p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900";

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{t('traceabilityMatrix')}</h2>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('traceabilityMatrixDescription')}</p>
          </div>
          {!isFinalized && <button onClick={handleSave} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold shadow-sm w-full sm:w-auto">{t('saveChanges')}</button>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="border rounded-lg shadow overflow-hidden dark:border-dark-brand-border">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('userNeeds')}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('designInputs')}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('designOutputs')}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('verification')}</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('validation')}</th>
                  <th scope="col" className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                {controls.map((row, index) => (
                  <tr key={row.id}>
                    <td className="p-2 align-top"><textarea value={row.userNeed} onChange={(e) => handleUpdate(index, 'userNeed', e.target.value)} disabled={isFinalized} className={textareaClasses} /></td>
                    <td className="p-2 align-top"><textarea value={row.designInput} onChange={(e) => handleUpdate(index, 'designInput', e.target.value)} disabled={isFinalized} className={textareaClasses} /></td>
                    <td className="p-2 align-top"><textarea value={row.designOutput} onChange={(e) => handleUpdate(index, 'designOutput', e.target.value)} disabled={isFinalized} className={textareaClasses} /></td>
                    <td className="p-2 align-top"><textarea value={row.verification} onChange={(e) => handleUpdate(index, 'verification', e.target.value)} disabled={isFinalized} className={textareaClasses} /></td>
                    <td className="p-2 align-top">
                        <textarea value={row.validation} onChange={(e) => handleUpdate(index, 'validation', e.target.value)} disabled={isFinalized} className={textareaClasses} />
                        <div className="mt-2">
                            <button disabled={isFinalized} className="text-xs flex items-center gap-1 text-brand-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"><PaperClipIcon className="w-3 h-3"/>{t('linkDocument')}</button>
                        </div>
                    </td>
                    <td className="p-2 align-middle">
                      {!isFinalized && <button onClick={() => removeRow(index)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
       {!isFinalized && <button onClick={addRow} className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"><PlusIcon className="w-4 h-4" />{t('addNewRequirement')}</button>}
    </div>
  );
};

export default DesignControlsPage;