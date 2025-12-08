import React, { useState } from 'react';
import { Competency } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PlusIcon, IdentificationIcon, PencilIcon, TrashIcon } from '../icons';
import CompetencyModal from './CompetencyModal';
import { useAppStore } from '../../stores/useAppStore';

const CompetencyLibraryPage: React.FC = () => {
  const { t, lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  
  const { 
    competencies, 
    addCompetency: onCreate, 
    updateCompetency: onUpdate, 
    deleteCompetency: onDelete 
  } = useAppStore();

  const handleOpenCreateModal = () => {
    setEditingCompetency(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (comp: Competency) => {
    setEditingCompetency(comp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompetency(null);
  };

  const handleSave = (data: Competency | Omit<Competency, 'id'>) => {
    if ('id' in data) {
      onUpdate(data);
    } else {
      onCreate(data);
    }
    handleCloseModal();
  };

  const handleDelete = (compId: string) => {
    if (window.confirm(t('areYouSureDeleteCompetency'))) {
      onDelete(compId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <IdentificationIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('competencyLibrary')}</h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('competencyLibraryDescription')}</p>
          </div>
        </div>
        <button onClick={handleOpenCreateModal} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto">
          <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('addCompetency')}
        </button>
      </div>

      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right">{t('competencyName')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right">{t('description')}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
              {competencies.map((comp) => (
                <tr key={comp.id}>
                  <td className="px-6 py-4 font-medium text-brand-text-primary dark:text-dark-brand-text-primary">{comp.name[lang]}</td>
                  <td className="px-6 py-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{comp.description[lang]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 rtl:space-x-reverse">
                    <button onClick={() => handleOpenEditModal(comp)} className="p-1 text-gray-500 hover:text-brand-primary"><PencilIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(comp.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {competencies.length === 0 && <p className="text-center py-8 text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('noCompetenciesDefined')}</p>}
        </div>
      </div>

      {isModalOpen && (
        <CompetencyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          existingCompetency={editingCompetency}
        />
      )}
    </div>
  );
};

export default CompetencyLibraryPage;
