import React, { useState, useMemo, useRef } from 'react';
import { Standard, AccreditationProgram, User, UserRole, StandardCriticality } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { ShieldCheckIcon, PlusIcon, SearchIcon, FunnelIcon } from '@/components/icons';
import StandardAccordion from '@/components/accreditation/StandardAccordion';
import StandardModal from '@/components/accreditation/StandardModal';
import ImportStandardsModal from '@/components/accreditation/ImportStandardsModal';
import RestrictedFeatureIndicator from '@/components/common/RestrictedFeatureIndicator';

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
  const [riskFilter, setRiskFilter] = useState<StandardCriticality | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [fileContent, setFileContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canModify = currentUser.role === UserRole.Admin;

  const filteredStandards = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return standards.filter(s => {
      const matchesSearch = s.standardId.toLowerCase().includes(searchLower) ||
                            s.description.toLowerCase().includes(searchLower) ||
                            s.section?.toLowerCase().includes(searchLower);
      
      const matchesRisk = riskFilter === 'all' || s.criticality === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [standards, searchTerm, riskFilter]);

  const handleImportStandards = async (programId: string) => {
    try {
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        toast.error(t('invalidStandardsFormat') || 'Invalid standards format. Expected an array.');
        return;
      }

      // Validate structure before import
      const validationErrors: string[] = [];
      const validStandards = data.filter((standard: any, index: number) => {
        if (!standard.standardId || !standard.standardId.trim()) {
          validationErrors.push(`Row ${index + 1}: standardId is required`);
          return false;
        }
        if (!standard.description || !standard.description.trim()) {
          validationErrors.push(`Row ${index + 1}: description is required`);
          return false;
        }
        return true;
      });

      if (validationErrors.length > 0) {
        toast.error(`Validation errors: ${validationErrors.slice(0, 3).join('; ')}${validationErrors.length > 3 ? '...' : ''}`);
        return;
      }

      if (validStandards.length === 0) {
        toast.error(t('noValidStandardsFound') || 'No valid standards found in file');
        return;
      }

      let importCount = 0;
      let failCount = 0;
      
      for (const standard of validStandards) {
        try {
          await onCreateStandard({
            standardId: standard.standardId.trim(),
            description: standard.description.trim(),
            section: standard.section?.trim() || '',
            criticality: standard.criticality || 'medium',
            ...standard,
            programId: programId,
          });
          importCount++;
        } catch (error) {
          console.warn(`Failed to import standard ${standard.standardId}:`, error);
          failCount++;
        }
      }

      if (importCount > 0) {
        const message = failCount > 0 
          ? `${importCount} ${t('standardsImportedSuccessfully') || 'standards imported'}, ${failCount} failed`
          : `${importCount} ${t('standardsImportedSuccessfully') || 'standards imported successfully'}`;
        toast.success(message);
        setFileContent('');
        setIsImportModalOpen(false);
      } else {
        toast.error(t('noValidStandardsFound') || 'No standards could be imported');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('failedToImportStandards') || 'Failed to import standards';
      toast.error(errorMsg);
      console.error('Standards import failed:', error);
    }
  };

  const handleSave = async (data: Omit<Standard, 'programId'>) => {
    try {
      if (!data.standardId || !data.standardId.trim()) {
        toast.error(t('standardIdRequired') || 'Standard ID is required');
        return;
      }
      if (!data.description || !data.description.trim()) {
        toast.error(t('descriptionRequired') || 'Description is required');
        return;
      }
      
      if (editingStandard) {
        await onUpdateStandard({ ...data, programId: program.id });
        toast.success(t('standardUpdatedSuccessfully') || 'Standard updated successfully');
      } else {
        await onCreateStandard({ ...data, programId: program.id });
        toast.success(t('standardCreatedSuccessfully') || 'Standard created successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('failedToSaveStandard') || 'Failed to save standard';
      toast.error(errorMsg);
      console.error('Standard save failed:', error);
    }
  };

  const handleDelete = async (standardId: string) => {
    if (!window.confirm(t('areYouSureDeleteStandard') || 'Are you sure? This cannot be undone.')) {
      return;
    }
    
    try {
      await onDeleteStandard(standardId);
      toast.success(t('standardDeletedSuccessfully') || 'Standard deleted successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('failedToDeleteStandard') || 'Failed to delete standard';
      toast.error(errorMsg);
      console.error('Standard delete failed:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      if (!file.name.endsWith('.json')) {
        toast.error(t('invalidFileFormat') || 'Please select a JSON file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Validate JSON format
          JSON.parse(content);
          setFileContent(content);
          setIsImportModalOpen(true);
          toast.success(t('fileLoadedSuccessfully') || 'File loaded successfully');
        } catch (parseError) {
          toast.error(t('invalidJsonFormat') || 'Invalid JSON format in file');
          console.error('JSON parse error:', parseError);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('fileLoadError') || 'Error loading file';
      toast.error(errorMsg);
      console.error('File load failed:', error);
    }
  };

  const clearFilters = () => {
    setRiskFilter('all');
    setSearchTerm('');
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

      {!canModify && <RestrictedFeatureIndicator featureName="Standards Management" />}

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder={t('searchByStandard')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border rounded-lg bg-brand-surface dark:bg-dark-brand-surface"/>
            </div>
             <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-medium transition-colors ${showFilters ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}
            >
                <FunnelIcon className="w-5 h-5" />
                {t('filterByStatus')}
            </button>
            {(riskFilter !== 'all') && (
                <button onClick={clearFilters} className="text-red-500 hover:text-red-700 text-sm font-medium px-2">
                    {t('clearFilters')}
                </button>
            )}
        </div>
        
        {showFilters && (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('riskLevel')}</label>
                    <select 
                        value={riskFilter} 
                        onChange={(e) => setRiskFilter(e.target.value as StandardCriticality | 'all')}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    >
                        <option value="all">{t('allRisks')}</option>
                        {Object.values(StandardCriticality).map(risk => (
                            <option key={risk} value={risk}>{t(risk.toLowerCase() as any) || risk}</option>
                        ))}
                    </select>
                </div>
             </div>
        )}
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
        {filteredStandards.length === 0 && <p className="text-center py-8">{t('noResultsFound')}</p>}
      </div>

      {isModalOpen && <StandardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} existingStandard={editingStandard} />}
      {isImportModalOpen && <ImportStandardsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportStandards} fileContent={fileContent} programs={[program]} />}
    </div>
  );
};

export default StandardsPage;