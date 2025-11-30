import React, { useState, useEffect } from 'react';
import { Project, AppDocument, DesignControlItem, ComplianceStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { PlusIcon, TrashIcon, PaperClipIcon, XMarkIcon } from '../components/icons';
import DocumentPicker from '../components/common/DocumentPicker';

interface DesignControlsPageProps {
  project: Project;
  documents: AppDocument[];
  isFinalized: boolean;
  onSave: (designControls: DesignControlItem[]) => void;
}

const DesignControlsPage: React.FC<DesignControlsPageProps> = ({ project, documents, isFinalized, onSave }) => {
  const { t, lang } = useTranslation();
  const [controls, setControls] = useState<DesignControlItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);

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
      requirement: '',
      policyProcess: '',
      implementationEvidence: '',
      auditFindings: '',
      outcomeKPI: '',
      status: ComplianceStatus.NotApplicable,
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

  const handleLinkDocument = (rowIndex: number) => {
    setCurrentRowIndex(rowIndex);
    setPickerOpen(true);
  };

  const handleDocumentsSelected = (documentIds: string[]) => {
    if (currentRowIndex !== null) {
      const newControls = [...controls];
      // Add new documents, avoiding duplicates
      const existingIds = newControls[currentRowIndex].linkedDocumentIds;
      const uniqueNewIds = documentIds.filter(id => !existingIds.includes(id));
      newControls[currentRowIndex].linkedDocumentIds = [...existingIds, ...uniqueNewIds];
      setControls(newControls);
    }
    setPickerOpen(false);
    setCurrentRowIndex(null);
  };

  const handleRemoveDocument = (rowIndex: number, docId: string) => {
    const newControls = [...controls];
    newControls[rowIndex].linkedDocumentIds = newControls[rowIndex].linkedDocumentIds.filter(id => id !== docId);
    setControls(newControls);
  };

  const getDocumentName = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return 'Unknown Document';
    return lang === 'ar' ? doc.name.ar : doc.name.en;
  };

  const textareaClasses = "w-full min-h-[80px] p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900";
  const selectClasses = "w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900";

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">Evidence Matrix</h2>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">Trace compliance from standard requirements to implementation evidence.</p>
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
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Standard Requirement</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Policy/Process</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Implementation Evidence</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Audit Findings</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Outcome/KPI</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                {controls.map((row, index) => (
                  <tr key={row.id}>
                    <td className="p-2 align-top">
                      <textarea 
                        value={row.requirement} 
                        onChange={(e) => handleUpdate(index, 'requirement', e.target.value)} 
                        disabled={isFinalized} 
                        className={textareaClasses}
                        placeholder="Enter requirement..."
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        value={row.policyProcess} 
                        onChange={(e) => handleUpdate(index, 'policyProcess', e.target.value)} 
                        disabled={isFinalized} 
                        className={textareaClasses} 
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        value={row.implementationEvidence} 
                        onChange={(e) => handleUpdate(index, 'implementationEvidence', e.target.value)} 
                        disabled={isFinalized} 
                        className={textareaClasses} 
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        value={row.auditFindings} 
                        onChange={(e) => handleUpdate(index, 'auditFindings', e.target.value)} 
                        disabled={isFinalized} 
                        className={textareaClasses} 
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        value={row.outcomeKPI} 
                        onChange={(e) => handleUpdate(index, 'outcomeKPI', e.target.value)} 
                        disabled={isFinalized} 
                        className={textareaClasses} 
                      />
                      <div className="mt-2">
                        <button 
                          onClick={() => handleLinkDocument(index)}
                          disabled={isFinalized} 
                          className="text-xs flex items-center gap-1 text-brand-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <PaperClipIcon className="w-3 h-3"/>
                          {t('linkDocument')}
                        </button>
                      </div>
                      {/* Display linked documents */}
                      {row.linkedDocumentIds.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {row.linkedDocumentIds.map(docId => (
                            <div 
                              key={docId} 
                              className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                            >
                              <span className="truncate flex-1">{getDocumentName(docId)}</span>
                              {!isFinalized && (
                                <button 
                                  onClick={() => handleRemoveDocument(index, docId)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      <select 
                        value={row.status} 
                        onChange={(e) => handleUpdate(index, 'status', e.target.value as ComplianceStatus)} 
                        disabled={isFinalized} 
                        className={selectClasses}
                      >
                        {Object.values(ComplianceStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
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
      {!isFinalized && <button onClick={addRow} className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"><PlusIcon className="w-4 h-4" /> Add New Item</button>}
      
      {/* Document Picker Modal */}
      <DocumentPicker
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setCurrentRowIndex(null);
        }}
        onSelect={handleDocumentsSelected}
        documents={documents}
        selectedIds={currentRowIndex !== null ? controls[currentRowIndex]?.linkedDocumentIds : []}
        multiSelect={true}
      />
    </div>
  );
};

export default DesignControlsPage;