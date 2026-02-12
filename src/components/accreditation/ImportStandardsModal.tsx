import React, { useState, FC, useMemo } from 'react';
import { AccreditationProgram } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';

interface ImportStandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (programId: string) => void;
  fileContent: string;
  programs: AccreditationProgram[];
}

const ImportStandardsModal: FC<ImportStandardsModalProps> = ({ isOpen, onClose, onImport, fileContent, programs }) => {
    const { t, dir } = useTranslation();
    const { toast } = useToast();
    const [selectedProgramId, setSelectedProgramId] = useState('');

    const detectedCount = useMemo(() => {
        try {
            const data = JSON.parse(fileContent);
            // Validate that it's an array
            if (!Array.isArray(data)) {
                return 0;
            }
            // Validate each standard has required fields
            const validStandards = data.filter((standard: any) => 
                standard.standardId && 
                standard.description && 
                (typeof standard.description === 'string' || typeof standard.description.en === 'string')
            );
            return validStandards.length;
        } catch (e) {
            return 0;
        }
    }, [fileContent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedProgramId) return;
        onImport(selectedProgramId);
    }
    
    if (!isOpen) return null;
    
    const inputClasses = "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
            <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">{t('importStandards')}</h3>
                         <div className="mt-4 space-y-4">
                            <p className="text-sm text-gray-500">{t('standardsFound').replace('{count}', detectedCount.toString())}</p>
                            <div>
                                <label htmlFor="program" className={labelClasses}>{t('importToProgram')}</label>
                                <select id="program" value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} className={inputClasses} required>
                                    <option value="">{t('selectProgram')}</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md text-sm">{t('cancel')}</button>
                        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-sky-700" disabled={!selectedProgramId}>{t('importData')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportStandardsModal;