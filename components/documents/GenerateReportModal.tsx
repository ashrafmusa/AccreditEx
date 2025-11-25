import React, { useState, FC } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

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
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium">{t('generateReport')}</h3>
              <div className="mt-4">
                <label className="block text-sm font-medium">{t('documentType')}</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md">
                  <option value="complianceSummary">{t('complianceSummaryReport')}</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="py-2 px-4 border rounded-md text-sm">{t('cancel')}</button>
              <button type="submit" className="py-2 px-4 border rounded-md text-sm text-white bg-brand-primary">{t('generate')}</button>
            </div>
          </form>
        </div>
      </div>
    );
}

export default GenerateReportModal;