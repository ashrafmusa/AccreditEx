import React, { useState, useEffect } from 'react';
import { NavigationState, Project, ComplianceStatus } from '@/types';
import { ProjectTemplate } from '@/types/templates';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import { projectTemplates, getTemplatesByProgram } from '@/data/projectTemplates';
import { FolderIcon, ArrowLeftIcon } from '@/components/icons';
import { inputClasses, labelClasses } from '@/components/ui/constants';
import DatePicker from '@/components/ui/DatePicker';
import TemplateSelector from '@/components/projects/TemplateSelector';

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
  
  const [showTemplateSelector, setShowTemplateSelector] = useState(!isEditMode);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);

  useEffect(() => {
    if (isEditMode && existingProject) {
      setName(existingProject.name);
      setDescription(existingProject.description);
      setProgramId(existingProject.programId);
      setLeadId(existingProject.projectLead?.id || '');
      setStartDate(new Date(existingProject.startDate));
      setEndDate(existingProject.endDate ? new Date(existingProject.endDate) : undefined);
      setShowTemplateSelector(false);
    }
  }, [isEditMode, existingProject]);

  const handleTemplateSelect = (template: ProjectTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setName(template.name);
      setDescription(template.description);
      // Try to match program based on template ID or name if possible, otherwise leave empty
      if (template.programId) {
          setProgramId(template.programId);
      }
      
      // Calculate end date based on estimated duration
      if (startDate && template.estimatedDuration) {
          const end = new Date(startDate);
          end.setDate(end.getDate() + template.estimatedDuration);
          setEndDate(end);
      }
    } else {
        // Reset if "Start from Scratch" is selected
        setName('');
        setDescription('');
        setProgramId('');
        setEndDate(undefined);
    }
    setShowTemplateSelector(false);
  };

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
        // Convert template checklist to proper ChecklistItem format
        const convertedChecklist = selectedTemplate?.checklist.map((templateItem, index) => ({
          id: `item-${Date.now()}-${index}`,
          item: templateItem.title,
          standardId: templateItem.category || `STD-${index + 1}`,
          status: ComplianceStatus.NotStarted,
          assignedTo: null,
          dueDate: null,
          actionPlan: templateItem.description || '',
          notes: '',
          evidenceFiles: [],
          comments: [],
          linkedFhirResources: []
        })) || [];

        const projectLead = users.find(u => u.id === leadId);
        if (!projectLead) {
          console.error('Project lead not found');
          return;
        }

        // Create a clean project lead object without undefined values
        const cleanProjectLead = {
          id: projectLead.id,
          name: projectLead.name,
          email: projectLead.email,
          role: projectLead.role,
          departmentId: projectLead.departmentId || null,
          jobTitle: projectLead.jobTitle || null,
          hireDate: projectLead.hireDate || null,
          competencies: projectLead.competencies || [],
          trainingAssignments: projectLead.trainingAssignments || [],
          readAndAcknowledge: projectLead.readAndAcknowledge || []
        };

        const newProjectData: any = {
          name,
          description: description || '',
          programId,
          projectLead: cleanProjectLead,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate ? endDate.toISOString().split('T')[0] : null,
          status: 'Not Started',
          archived: false,
          archivedAt: null,
          finalizedBy: null,
          finalizationDate: null,
          progress: 0,
          checklist: convertedChecklist,
          capaReports: [],
          pdcaCycles: [],
          mockSurveys: [],
          designControls: [],
          activityLog: []
        };
        
        // Remove any undefined values recursively
        const removeUndefined = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(removeUndefined);
          } else if (obj !== null && typeof obj === 'object') {
            return Object.entries(obj).reduce((acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = removeUndefined(value);
              }
              return acc;
            }, {} as any);
          }
          return obj;
        };
        
        const cleanedData = removeUndefined(newProjectData);
        console.log('Project data to be saved:', cleanedData);
        
        await addProject(cleanedData);
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
      
      {showTemplateSelector ? (
          <TemplateSelector 
            templates={projectTemplates}
            selectedTemplateId={selectedTemplate?.id || null}
            onSelectTemplate={(templateId) => {
              const template = templateId ? projectTemplates.find(t => t.id === templateId) : null;
              handleTemplateSelect(template);
            }}
            onPreview={(template) => setPreviewTemplate(template)}
          />
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6 bg-brand-surface dark:bg-dark-brand-surface p-8 rounded-lg shadow-md border border-brand-border dark:border-dark-brand-border animate-fadeIn">
        {!isEditMode && (
            <button 
                type="button" 
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center text-sm text-brand-primary hover:text-brand-primary-700 mb-4"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-1 rtl:ml-1" />
                {t('backToTemplates')}
            </button>
        )}
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
      )}
      
      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">{previewTemplate.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{previewTemplate.description}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>📋 {previewTemplate.checklist.length} {t('items')}</span>
                  <span>⏱️ {previewTemplate.estimatedDuration} {t('days')}</span>
                  <span>🏥 {previewTemplate.category}</span>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 dark:text-white">{t('checklistItems')}:</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {previewTemplate.checklist.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        <h4 className="font-medium dark:text-white">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                        {item.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {t('close')}
                  </button>
                  <button
                    onClick={() => {
                      handleTemplateSelect(previewTemplate);
                      setPreviewTemplate(null);
                      setShowTemplateSelector(false);
                    }}
                    className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-indigo-700"
                  >
                    {t('useThisTemplate')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectPage;
