import React, { useState, useEffect } from 'react';
import { Standard, StandardCriticality, SubStandard } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';
import { inputClasses, labelClasses } from '@/components/ui/constants';
import { PlusIcon, TrashIcon } from '../icons';

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (standard: Omit<Standard, 'programId'>) => void;
  existingStandard: Standard | null;
}

const StandardModal: React.FC<StandardModalProps> = ({ isOpen, onClose, onSave, existingStandard }) => {
  const { t } = useTranslation();
  const isEditMode = !!existingStandard;

  const [standardId, setStandardId] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('');
  const [criticality, setCriticality] = useState<StandardCriticality>(StandardCriticality.Medium);
  const [subStandards, setSubStandards] = useState<SubStandard[]>([]);

  useEffect(() => {
    if (existingStandard) {
      setStandardId(existingStandard.standardId);
      setDescription(existingStandard.description);
      setSection(existingStandard.section || '');
      setCriticality(existingStandard.criticality || StandardCriticality.Medium);
      setSubStandards(existingStandard.subStandards || []);
    } else {
      setStandardId('');
      setDescription('');
      setSection('');
      setCriticality(StandardCriticality.Medium);
      setSubStandards([]);
    }
  }, [existingStandard, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ standardId, description, section, criticality, subStandards, totalMeasures: subStandards.length });
  };
  
  const handleSubStandardChange = (index: number, field: keyof SubStandard, value: string) => {
    const newSubs = [...subStandards];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setSubStandards(newSubs);
  };
  
  const addSubStandard = () => {
    const newId = `${standardId}.${subStandards.length + 1}`;
    setSubStandards([...subStandards, { id: newId, description: '' }]);
  };

  const removeSubStandard = (index: number) => {
    setSubStandards(subStandards.filter((_, i) => i !== index));
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border rounded-md">{t('cancel')}</button>
      <button type="submit" form="standard-form" className="py-2 px-4 border rounded-md text-white bg-brand-primary">{t('save')}</button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('editStandard') : t('addStandard')} footer={footer} size="2xl">
      <form id="standard-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="standardId" className={labelClasses}>{t('standardId')}</label>
          <input type="text" id="standardId" value={standardId} onChange={e => setStandardId(e.target.value)} className={inputClasses} required disabled={isEditMode}/>
        </div>
        <div>
          <label htmlFor="description" className={labelClasses}>{t('standardDescription')}</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="section" className={labelClasses}>{t('section')}</label>
                <input type="text" id="section" value={section} onChange={e => setSection(e.target.value)} className={inputClasses}/>
            </div>
            <div>
                <label htmlFor="criticality" className={labelClasses}>Criticality</label>
                <select id="criticality" value={criticality} onChange={e => setCriticality(e.target.value as StandardCriticality)} className={inputClasses}>
                    {Object.values(StandardCriticality).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
        <div>
            <h4 className="font-medium mb-2">{t('measuresSubStandards')}</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {subStandards.map((sub, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input type="text" value={sub.id} onChange={e => handleSubStandardChange(index, 'id', e.target.value)} placeholder={t('measureId')} className={`${inputClasses} w-1/4`} />
                        <input type="text" value={sub.description} onChange={e => handleSubStandardChange(index, 'description', e.target.value)} placeholder={t('measureDescription')} className={`${inputClasses} w-3/4`} />
                        <button type="button" onClick={() => removeSubStandard(index)} className="p-1 text-red-500"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addSubStandard} className="text-sm text-brand-primary mt-2 flex items-center gap-1"><PlusIcon className="w-4 h-4"/>{t('addMeasure')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default StandardModal;
