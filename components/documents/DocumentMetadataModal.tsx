

import React, { useState } from 'react';
import { AppDocument } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface DocumentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: { en: string; ar: string }, type: AppDocument['type'] }) => void;
}

const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t, dir } = useTranslation();
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [type, setType] = useState<AppDocument['type']>('Policy');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name: { en: nameEn, ar: nameAr }, type });
        onClose();
    };

    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium">{t('addNewDocument')}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t('documentNameEn')}</label>
                  <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t('documentNameAr')}</label>
                  <input type="text" value={nameAr} onChange={e => setNameAr(e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md" dir="rtl" required />
                </div>
                 <div>
                  <label className="block text-sm font-medium">{t('documentType')}</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md">
                    <option value="Policy">{t('policy')}</option>
                    <option value="Procedure">{t('procedure')}</option>
                    <option value="Report">{t('report')}</option>
                  </select>
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

export default DocumentMetadataModal;