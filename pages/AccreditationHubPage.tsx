import React, { useState } from 'react';
import { AccreditationProgram, UserRole, NavigationState } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../stores/useAppStore';
import { useProjectStore } from '../stores/useProjectStore';
import { useUserStore } from '../stores/useUserStore';
import ProgramCard from '../components/accreditation/ProgramCard';
import ProgramModal from '../components/accreditation/ProgramModal';
import { PlusIcon } from '../components/icons';
import EmptyState from '../components/common/EmptyState';
import { ShieldCheckIcon } from '../components/icons';

interface AccreditationHubPageProps {
    setNavigation: (state: NavigationState) => void;
}

const AccreditationHubPage: React.FC<AccreditationHubPageProps> = ({ setNavigation }) => {
    const { t } = useTranslation();
    const { accreditationPrograms, standards, addProgram, updateProgram, deleteProgram } = useAppStore();
    const { projects } = useProjectStore();
    const { currentUser } = useUserStore();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<AccreditationProgram | null>(null);

    const canModify = currentUser?.role === UserRole.Admin;

    const handleSave = (programData: AccreditationProgram | Omit<AccreditationProgram, 'id'>) => {
        if ('id' in programData) {
            updateProgram(programData);
        } else {
            addProgram(programData);
        }
        setIsModalOpen(false);
    };
    
    const handleDelete = (programId: string) => {
        if (window.confirm(t('areYouSureDeleteProgram'))) {
            deleteProgram(programId);
        }
    };
    
    return (
        <div className="space-y-6">
            {canModify && (
                <div className="flex justify-end">
                    <button onClick={() => { setEditingProgram(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full sm:w-auto">
                        <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('createNewProgram')}
                    </button>
                </div>
            )}
            
            {accreditationPrograms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {accreditationPrograms.map(prog => (
                        <ProgramCard 
                            key={prog.id}
                            program={prog}
                            standardCount={standards.filter(s => s.programId === prog.id).length}
                            projectCount={projects.filter(p => p.programId === prog.id).length}
                            canModify={canModify}
                            onSelect={() => setNavigation({ view: 'standards', programId: prog.id })}
                            onEdit={() => { setEditingProgram(prog); setIsModalOpen(true); }}
                            onDelete={() => handleDelete(prog.id)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState 
                    icon={ShieldCheckIcon}
                    title={t('noProgramsFound')}
                    message={canModify ? t('createProgramToStart') : ''}
                />
            )}

            {isModalOpen && (
                <ProgramModal 
                    program={editingProgram}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AccreditationHubPage;
