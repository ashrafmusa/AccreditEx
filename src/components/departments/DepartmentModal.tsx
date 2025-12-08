import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import Modal from '../ui/Modal';
import { inputClasses, labelClasses } from '../ui/constants';

interface DepartmentModalProps {
  department: Department | null;
  onSave: (department: Department | Omit<Department, 'id'>) => void;
  onClose: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ department, onSave, onClose }) => {
  const { t } = useTranslation();
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  
  const isEditMode = department !== null;

  useEffect(() => {
    if (isEditMode) {
      setNameEn(department.name.en);
      setNameAr(department.name.ar);
    }
  }, [department, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameEn && nameAr) {
      const deptData = { name: { en: nameEn, ar: nameAr } };
      if (isEditMode) {
        onSave({ id: department.id, ...deptData });
      } else {
        onSave(deptData);
      }
    }
  };
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{t('cancel')}</button>
      <button type="submit" form="dept-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{t('save')}</button>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditMode ? t('editDepartment') : t('addNewDepartment')} footer={footer}>
      <form id="dept-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="nameEn" className={labelClasses}>{t('departmentNameEn')}</label>
            <input type="text" name="nameEn" id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputClasses} required />
        </div>
        <div>
            <label htmlFor="nameAr" className={labelClasses}>{t('departmentNameAr')}</label>
            <input type="text" name="nameAr" id="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputClasses} required dir="rtl" />
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentModal;
