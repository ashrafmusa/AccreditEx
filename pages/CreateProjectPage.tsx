import React, { useState, useEffect } from 'react';
import { NavigationState, Project } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import { FolderIcon } from '@/components/icons';
import { inputClasses, labelClasses } from '@/components/ui/constants';
import DatePicker from '@/components/ui/DatePicker';

interface CreateProjectPageProps {
  navigation: { view: 'createProject' } | { view: 'editProject', projectId: string };
  setNavigation: (state: NavigationState) => void;
}

const CreateProjectPage: React.FC<CreateProjectPageProps> = ({ navigation, setNavigation }) => {
  const { t } = useTranslation();
  const { addProject, projects, updateProject } = useProjectStore();
  const { users } = useUserStore();
  const { accreditationPrograms } = useAppStore();

  const isEditMode = navigation.view === 'editProject';
  const existingProject = isEditMode ? projects.find(p => p.id === navigation.projectId) : undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [programId, setProgramId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (isEditMode && existingProject) {
      setName(existingProject.name);
      setDescription(existingProject.description);
      setProgramId(existingProject.programId);
      setLeadId(existingProject.projectLead.id);
      setStartDate(new Date(existingProject.startDate));
      setEndDate(existingProject.endDate ? new Date(existingProject.endDate) : undefined);
    }
  }, [isEditMode, existingProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !programId || !leadId || !startDate) return;

    if (isEditMode && existingProject) {
        const updatedData: Project = {
            ...existingProject,
            name,
            description,
            programId,
            projectLead: users.find(u => u.id === leadId)!,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        }
        await updateProject(updatedData);
        setNavigation({ view: 'projectDetail', projectId: existingProject.id });
    } else {
        const newProjectData = {
          name,
          description,
          programId,
          leadId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        };
        await addProject(newProjectData);
        setNavigation({ view: 'projects' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start mb-6">
        <FolderIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{isEditMode ? t('editProject') : t('createNewProject')}</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-brand-surface dark:bg-dark-brand-surface p-8 rounded-lg shadow-md border border-brand-border dark:border-dark-brand-border">
        <div>
          <label htmlFor="name" className={labelClasses}>{t('projectName')}</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
        </div>

        <div>
            <label htmlFor="description" className={labelClasses}>{t('projectDescription')}</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputClasses} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="program" className={labelClasses}>{t('program')}</label>
                <select id="program" value={programId} onChange={e => setProgramId(e.target.value)} className={inputClasses} required disabled={isEditMode}>
                    <option value="">{t('selectProgram')}</option>
                    {accreditationPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="lead" className={labelClasses}>{t('projectLead')}</label>
                <select id="lead" value={leadId} onChange={e => setLeadId(e.target.value)} className={inputClasses} required>
                    <option value="">{t('selectLead')}</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className={labelClasses}>{t('startDate')}</label>
                <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div>
                <label className={labelClasses}>{t('endDate')}</label>
                <DatePicker date={endDate} setDate={setEndDate} fromDate={startDate} />
            </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t border-brand-border dark:border-dark-brand-border">
            <button type="button" onClick={() => setNavigation({ view: 'projects' })} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600">{t('cancel')}</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700">{t('save')}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
