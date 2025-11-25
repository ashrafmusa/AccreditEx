import React, { useState, useMemo, useRef } from 'react';
import { Standard, AccreditationProgram, User, UserRole } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { ShieldCheckIcon, PlusIcon, SearchIcon } from '@/components/icons';
import StandardAccordion from '@/components/accreditation/StandardAccordion';
import StandardModal from '@/components/accreditation/StandardModal';
import ImportStandardsModal from '@/components/accreditation/ImportStandardsModal';

interface StandardsPageProps {
  program: AccreditationProgram;
  standards: Standard[];
  currentUser: User;
  onCreateStandard: (standard: Omit<Standard, 'programId'> & { programId: string }) => Promise<void>;
  onUpdateStandard: (standard: Standard) => Promise<void>;
  onDeleteStandard: (standardId: string) => Promise<void>;
}

const StandardsPage: React.FC<StandardsPageProps> = ({ program, standards, currentUser, onCreateStandard, onUpdateStandard, onDeleteStandard }) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileContent, setFileContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canModify = currentUser.role === UserRole.Admin;

  const filteredStandards = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return standards.filter(s => 
      s.standardId.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower) ||
      s.section?.toLowerCase().includes(searchLower)
    );
  }, [standards, searchTerm]);

  const handleSave = (data: Omit<Standard, 'programId'>) => {
    if (editingStandard) {
      onUpdateStandard({ ...data, programId: program.id });
    } else {
      onCreateStandard({ ...data, programId: program.id });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (standardId: string) => {
    if(window.confirm(t('areYouSureDeleteStandard'))) {
      onDeleteStandard(standardId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target?.result as string);
        setIsImportModalOpen(true);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <ShieldCheckIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{program.name}</h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('programStandards')}</p>
          </div>
        </div>
        {canModify && (
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-semibold text-sm">{t('importStandards')}</button>
            <button onClick={() => { setEditingStandard(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center font-semibold text-sm">
              <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('addStandard')}
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder={t('searchByStandard')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border rounded-lg bg-brand-surface dark:bg-dark-brand-surface"/>
      </div>

      <div className="space-y-4">
        {filteredStandards.map(standard => (
          <StandardAccordion
            key={standard.standardId}
            standard={standard}
            canModify={canModify}
            onEdit={() => { setEditingStandard(standard); setIsModalOpen(true); }}
            onDelete={() => handleDelete(standard.standardId)}
          />
        ))}
        {filteredStandards.length === 0 && <p className="text-center py-8">{t('noStandardsFound')}</p>}
      </div>

      {isModalOpen && <StandardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} existingStandard={editingStandard} />}
      {isImportModalOpen && <ImportStandardsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={() => {}} fileContent={fileContent} programs={[program]} />}
    </div>
  );
};

export default StandardsPage;