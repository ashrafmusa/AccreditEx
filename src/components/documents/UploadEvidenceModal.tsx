import React, { useState, FC } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface UploadEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: { en: string; ar: string }, uploadedFile: { name: string, type: string }}) => void;
}

const UploadEvidenceModal: FC<UploadEvidenceModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t, dir } = useTranslation();
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [fileName, setFileName] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!nameEn || !nameAr || !fileName) return;
        onSave({ 
            name: { en: nameEn, ar: nameAr },
            uploadedFile: { name: fileName, type: 'PDF' } // Simulate file type
        });
    };

    if (!isOpen) return null;
    
    const inputClasses = "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium">{t('uploadEvidence')}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="nameEn" className={labelClasses}>{t('documentNameEn')}</label>
                  <input type="text" id="nameEn" value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                  <label htmlFor="nameAr" className={labelClasses}>{t('documentNameAr')}</label>
                  <input type="text" id="nameAr" value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputClasses} dir="rtl" required />
                </div>
                <div>
                  <label htmlFor="fileName" className={labelClasses}>{t('fileName')}</label>
                  <input type="text" id="fileName" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g., audit_report_q1.pdf" className={inputClasses} required />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="py-2 px-4 border rounded-md text-sm">{t('cancel')}</button>
              <button type="submit" className="py-2 px-4 border rounded-md text-sm text-white bg-brand-primary">{t('save')}</button>
            </div>
          </form>
        </div>
      </div>
    );
}

export default UploadEvidenceModal;