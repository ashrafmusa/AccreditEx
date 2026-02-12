import React, { useState, FC } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { SparklesIcon, DocumentTextIcon } from '../icons';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (reportType: string) => void;
}

const GenerateReportModal: FC<GenerateReportModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const { t, dir } = useTranslation();
    const [reportType, setReportType] = useState('complianceSummary');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(reportType);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="w-6 h-6 text-brand-primary" />
                <h3 className="text-lg font-medium text-brand-text-primary dark:text-dark-brand-text-primary">{t('generateReport')}</h3>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Professional PDF Report with AI Analysis</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Generate a comprehensive, professionally formatted PDF report using AI analysis of your project's 
                      compliance data, CAPA reports, and evidence documentation. The report includes charts, tables, 
                      and strategic recommendations. It will be automatically saved to Document Control and downloaded to your device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                  {t('reportType') || 'Report Type'}
                </label>
                <select 
                  value={reportType} 
                  onChange={e => setReportType(e.target.value)} 
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                  <option value="complianceSummary">{t('complianceSummaryReport')}</option>
                  <option value="detailedCompliance">Detailed Compliance Report</option>
                  <option value="executiveSummary">Executive Summary</option>
                  <option value="capaAnalysis">CAPA Analysis Report</option>
                </select>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Generation typically takes 30-60 seconds depending on project complexity.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <button 
                type="button" 
                onClick={onClose} 
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                type="submit" 
                className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-sky-700 transition-colors flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                {t('generate')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}

export default GenerateReportModal;