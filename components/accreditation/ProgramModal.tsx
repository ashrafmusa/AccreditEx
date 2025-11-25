import React, { useState, useEffect } from 'react';
import { AccreditationProgram } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';
import { inputClasses, labelClasses } from '@/components/ui/constants';

interface ProgramModalProps {
  program: AccreditationProgram | null;
  onSave: (program: AccreditationProgram | Omit<AccreditationProgram, 'id'>) => void;
  onClose: () => void;
}

const ProgramModal: React.FC<ProgramModalProps> = ({ program, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  
  const isEditMode = program !== null;

  useEffect(() => {
    if (isEditMode) {
      setName(program.name);
      setDescriptionEn(program.description.en);
      setDescriptionAr(program.description.ar);
    }
  }, [program, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && descriptionEn && descriptionAr) {
      const programData = { name, description: { en: descriptionEn, ar: descriptionAr } };
      if (isEditMode) {
        onSave({ id: program.id, ...programData });
      } else {
        onSave(programData);
      }
    }
  };
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">{t('cancel')}</button>
      <button type="submit" form="program-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700">{t('save')}</button>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditMode ? t('editProgram') : t('createNewProgram')} footer={footer}>
        <form id="program-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className={labelClasses}>{t('programName')}</label>
                <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} required />
            </div>
            <div>
                <label htmlFor="descriptionEn" className={labelClasses}>{t('programDescriptionEn')}</label>
                <textarea name="descriptionEn" id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={3} className={inputClasses} required />
            </div>
            <div>
                <label htmlFor="descriptionAr" className={labelClasses}>{t('programDescriptionAr')}</label>
                <textarea name="descriptionAr" id="descriptionAr" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={3} className={inputClasses} required dir="rtl" />
            </div>
        </form>
    </Modal>
  );
};

export default ProgramModal;