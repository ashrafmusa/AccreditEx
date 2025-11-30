import React, { useState, useEffect } from 'react';
import { PDCACycle, PDCAStage, CAPAReport } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { usePDCASuggestions } from '@/hooks/usePDCASuggestions';
import PDCAMetricsChart from './PDCAMetricsChart';
import { 
  XMarkIcon, 
  LightBulbIcon, 
  ChartBarIcon, 
  ClipboardDocumentCheckIcon,
  PaperClipIcon
} from '@/components/icons';
import { useAppStore } from '@/stores/useAppStore';
import DocumentPicker from '../common/DocumentPicker';

interface PDCACycleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: PDCACycle | CAPAReport;
  type: 'cycle' | 'capa';
  onUpdate: (updatedCycle: PDCACycle | CAPAReport) => void;
}

const PDCACycleDetailModal: React.FC<PDCACycleDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  cycle, 
  type,
  onUpdate 
}) => {
  const { t, lang } = useTranslation();
  const { suggestions, generateSuggestions, isLoading: isLoadingSuggestions } = usePDCASuggestions();
  const { documents } = useAppStore();
  const [activeTab, setActiveTab] = useState<PDCAStage | 'History'>('Plan');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  // Helper to get current stage
  const currentStage = type === 'cycle' 
    ? (cycle as PDCACycle).currentStage 
    : (cycle as CAPAReport).pdcaStage || 'Plan';

  useEffect(() => {
    if (isOpen && activeTab !== 'History') {
      generateSuggestions(activeTab as PDCAStage, {
        title: type === 'cycle' ? (cycle as PDCACycle).title : (cycle as CAPAReport).description,
        description: (cycle as any).description || ''
      });
    }
  }, [isOpen, activeTab, cycle]);

  if (!isOpen) return null;

  const tabs: (PDCAStage | 'History')[] = ['Plan', 'Do', 'Check', 'Act', 'History'];

  const linkedDocs = documents.filter(doc => (cycle.linkedDocumentIds || []).includes(doc.id));

  const handleDocumentsSelected = (documentIds: string[]) => {
    const currentIds = cycle.linkedDocumentIds || [];
    const uniqueIds = documentIds.filter(id => !currentIds.includes(id));
    onUpdate({ ...cycle, linkedDocumentIds: [...currentIds, ...uniqueIds] });
    setIsPickerOpen(false);
  };

  const handleRemoveDocument = (docId: string) => {
    const currentIds = cycle.linkedDocumentIds || [];
    onUpdate({ ...cycle, linkedDocumentIds: currentIds.filter(id => id !== docId) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${
                type === 'cycle' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {type === 'cycle' ? t('pdcaCycle') : 'CAPA'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                currentStage === 'Plan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                currentStage === 'Do' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                currentStage === 'Check' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                currentStage === 'Act' ? 'bg-green-100 text-green-800 border-green-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {currentStage}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {type === 'cycle' ? (cycle as PDCACycle).title : (cycle as CAPAReport).description}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {t(tab.toLowerCase() + (tab !== 'History' ? 'Stage' : '')) || tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'Plan' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">{t('problemStatement') || 'Problem Statement'}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {(cycle as any).description || (cycle as CAPAReport).description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">{t('rootCauseAnalysis') || 'Root Cause Analysis'}</h4>
                    <textarea 
                      className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm" 
                      rows={4}
                      defaultValue={(cycle as CAPAReport).rootCauseAnalysis || ''}
                      placeholder="Describe the root cause..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'Do' && (
                <div className="space-y-4">
                   <div>
                    <h4 className="font-medium mb-2">{t('actionPlan') || 'Action Plan'}</h4>
                    <textarea 
                      className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm" 
                      rows={4}
                      defaultValue={(cycle as CAPAReport).actionPlan || ''}
                      placeholder="Describe the implementation steps..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'Check' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-brand-primary" />
                        {t('metricsComparison') || 'Metrics Comparison'}
                      </h4>
                    </div>
                    {/* Use the new Metrics Chart component */}
                    {(cycle as any).improvementMetrics ? (
                      <PDCAMetricsChart metrics={(cycle as any).improvementMetrics} />
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        {t('noMetricsDefined') || 'No metrics defined for this cycle.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Act' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('standardization') || 'Standardization & Closure'}</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('actStageDescription') || 'Document standardized processes and share lessons learned.'}
                    </p>
                    <textarea 
                      className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm" 
                      rows={4}
                      placeholder="Describe standardization steps..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'History' && (
                <div className="space-y-4">
                   <h4 className="font-medium mb-4">{t('stageHistory') || 'Stage History'}</h4>
                   <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                     {((cycle as any).stageHistory || (cycle as CAPAReport).pdcaHistory || []).map((entry: any, idx: number) => (
                       <div key={idx} className="relative pl-6">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-primary border-2 border-white dark:border-gray-900"></div>
                         <div className="mb-1">
                           <span className="text-sm font-bold text-gray-900 dark:text-white">{entry.stage}</span>
                           <span className="text-xs text-gray-500 ml-2">{new Date(entry.completedAt).toLocaleDateString()}</span>
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</p>
                       </div>
                     ))}
                     {(!((cycle as any).stageHistory) && !((cycle as CAPAReport).pdcaHistory)) && (
                        <p className="text-sm text-gray-500 pl-6">{t('noHistory') || 'No history available.'}</p>
                     )}
                   </div>
                </div>
              )}
            </div>

            {/* Sidebar (AI Suggestions & Info) */}
            <div className="space-y-6">
              {activeTab !== 'History' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                  <h4 className="font-medium text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-3">
                    <LightBulbIcon className="w-5 h-5" />
                    {t('aiSuggestions') || 'AI Suggestions'}
                  </h4>
                  {isLoadingSuggestions ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-3/4"></div>
                      <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-1/2"></div>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {suggestions.map(suggestion => (
                        <li key={suggestion.id} className="text-sm bg-white dark:bg-gray-800 p-3 rounded border border-indigo-100 dark:border-indigo-900 shadow-sm">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                            {suggestion.category}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {suggestion.content}
                          </span>
                        </li>
                      ))}
                      {suggestions.length === 0 && (
                        <li className="text-sm text-indigo-700 dark:text-indigo-400 italic">
                          {t('noSuggestions') || 'No suggestions available for this stage.'}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-500" />
                  {t('quickActions') || 'Quick Actions'}
                </h4>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {t('addEvidence') || 'Add Evidence Document'}
                  </button>
                  <button 
                    onClick={() => setIsPickerOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    {t('linkDocument') || 'Link Document'}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {t('assignTask') || 'Assign Task'}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 hover:text-red-700">
                    {t('deleteCycle') || 'Delete Cycle'}
                  </button>
                </div>
              </div>

              {/* Linked Documents Section */}
              {linkedDocs.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <PaperClipIcon className="w-5 h-5 text-gray-500" />
                    {t('linkedDocuments') || 'Linked Documents'}
                  </h4>
                  <div className="space-y-2">
                    {linkedDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm group">
                        <span className="truncate flex-1" title={doc.name[lang]}>{doc.name[lang]}</span>
                        <button 
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            {t('close') || 'Close'}
          </button>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-dark">
            {t('saveChanges') || 'Save Changes'}
          </button>
        </div>

      </div>
      
      <DocumentPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleDocumentsSelected}
        documents={documents}
        selectedIds={cycle.linkedDocumentIds || []}
        multiSelect={true}
      />
    </div>
  );
};

export default PDCACycleDetailModal;
