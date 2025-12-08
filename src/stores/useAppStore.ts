import { create } from 'zustand';
import {
  AppDocument, Standard, AccreditationProgram, Department,
  TrainingProgram, CertificateData, UserTrainingStatus, Competency, Risk,
  IncidentReport, AuditPlan, Audit, CustomCalendarEvent, AppSettings, UserRole
} from '@/types';
import { ProjectTemplate } from '@/types/templates';
// MIGRATION: Replaced BackendService with Firebase services
import { getAppSettings, updateAppSettings as updateAppSettingsInFirebase } from '@/services/appSettingsService';
import { getStandards, addStandard as addStandardToFirebase, updateStandard as updateStandardInFirebase, deleteStandard as deleteStandardFromFirebase } from '@/services/standardService';
import { getCompetencies, addCompetency as addCompetencyToFirebase, updateCompetency as updateCompetencyInFirebase, deleteCompetency as deleteCompetencyFromFirebase } from '@/services/competencyService';
import { getDepartments, addDepartment as addDepartmentToFirebase, updateDepartment as updateDepartmentInFirebase, deleteDepartment as deleteDepartmentFromFirebase } from '@/services/departmentService';
import { getAccreditationPrograms, addAccreditationProgram, updateAccreditationProgram, deleteAccreditationProgram } from '@/services/accreditationProgramService';
import { getTrainingPrograms, addTrainingProgram as addTrainingProgramToFirebase, updateTrainingProgram as updateTrainingProgramInFirebase, deleteTrainingProgram as deleteTrainingProgramFromFirebase } from '@/services/trainingProgramService';
import { getRisks, addRisk as addRiskToFirebase, updateRisk as updateRiskInFirebase, deleteRisk as deleteRiskFromFirebase } from '@/services/riskService';
import { getDocuments, addDocument as addDocumentToFirebase, updateDocument as updateDocumentInFirebase, deleteDocument as deleteDocumentFromFirebase } from '@/services/documentService';
import { getIncidentReports, addIncidentReport as addIncidentReportToFirebase, updateIncidentReport as updateIncidentReportInFirebase, deleteIncidentReport as deleteIncidentReportFromFirebase } from '@/services/incidentReportService';
import { getAuditPlans, addAuditPlan as addAuditPlanToFirebase, updateAuditPlan as updateAuditPlanInFirebase, deleteAuditPlan as deleteAuditPlanFromFirebase } from '@/services/auditPlanService';
import { getAudits, addAudit as addAuditToFirebase, updateAudit as updateAuditInFirebase, deleteAudit as deleteAuditFromFirebase } from '@/services/auditService';
import { getCustomEvents, addCustomEvent as addCustomEventToFirebase, updateCustomEvent as updateCustomEventInFirebase, deleteCustomEvent as deleteCustomEventFromFirebase } from '@/services/customCalendarEventService';
import { generateProjectTemplates } from '@/data/projectTemplates';
import { useUserStore } from './useUserStore';

interface AppState {
  documents: AppDocument[];
  accreditationPrograms: AccreditationProgram[];
  standards: Standard[];
  projectTemplates: ProjectTemplate[];
  appSettings: AppSettings | null;
  initializationError: string | null;
  departments: Department[];
  trainingPrograms: TrainingProgram[];
  certificates: CertificateData[];
  userTrainingStatuses: { [userId: string]: UserTrainingStatus };
  competencies: Competency[];
  risks: Risk[];
  incidentReports: IncidentReport[];
  auditPlans: AuditPlan[];
  audits: Audit[];
  customEvents: CustomCalendarEvent[];
  
  fetchAllData: () => Promise<void>;
  setAppSettings: (settings: AppSettings) => void;
  clearInitializationError: () => void;

  // Documents
  addDocument: (doc: AppDocument) => void;
  addControlledDocument: (docData: { name: { en: string; ar: string }, type: AppDocument['type'], fileUrl?: string, tags?: string[], category?: string, departmentIds?: string[] }) => Promise<void>;
  addProcessMap: (docData: { name: { en: string; ar: string }, tags?: string[], category?: string, departmentIds?: string[] }) => Promise<void>;
  updateDocument: (doc: AppDocument) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  approveDocument: (docId: string) => Promise<void>;

  // App Settings
  updateAppSettings: (settings: AppSettings) => Promise<void>;
  
  // Programs
  addProgram: (programData: Omit<AccreditationProgram, 'id'>) => Promise<void>;
  updateProgram: (program: AccreditationProgram) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  
  // Project Templates (generated dynamically, not persisted)
  getTemplatesByProgram: (programId: string) => ProjectTemplate[];
  refreshTemplates: () => void;
  
  // Standards
  addStandard: (standardData: Omit<Standard, 'programId'> & {programId: string}) => Promise<void>;
  updateStandard: (standard: Standard) => Promise<void>;
  deleteStandard: (standardId: string) => Promise<void>;
  
  // Departments
  addDepartment: (deptData: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (deptId: string) => Promise<void>;
  
  // Competencies
  addCompetency: (compData: Omit<Competency, 'id'>) => Promise<void>;
  updateCompetency: (comp: Competency) => Promise<void>;
  deleteCompetency: (compId: string) => Promise<void>;
  
  // Training
  addTrainingProgram: (programData: Omit<TrainingProgram, 'id'>) => Promise<void>;
  updateTrainingProgram: (program: TrainingProgram) => Promise<void>;
  deleteTrainingProgram: (programId: string) => Promise<void>;
  assignTraining: (data: { trainingId: string; userIds: string[]; departmentIds: string[]; dueDate?: string }) => Promise<void>;
  submitQuiz: (trainingId: string, answers: {[key: string]: number}) => Promise<{ score: number, passed: boolean, certificateId?: string }>;
  
  // Risk
  addRisk: (riskData: Omit<Risk, 'id'>) => Promise<void>;
  updateRisk: (risk: Risk) => Promise<void>;
  deleteRisk: (riskId: string) => Promise<void>;
  
  // Incidents
  addIncidentReport: (reportData: Omit<IncidentReport, 'id'>) => Promise<void>;
  updateIncidentReport: (report: IncidentReport) => Promise<void>;
  deleteIncidentReport: (reportId: string) => Promise<void>;
  
  // Audits
  addAuditPlan: (planData: Omit<AuditPlan, 'id'>) => Promise<void>;
  updateAuditPlan: (plan: AuditPlan) => Promise<void>;
  deleteAuditPlan: (planId: string) => Promise<void>;
  runAudit: (planId: string) => Promise<void>;
  
  // Calendar
  addCustomEvent: (eventData: Omit<CustomCalendarEvent, 'id' | 'type'>) => Promise<void>;
  updateCustomEvent: (event: CustomCalendarEvent) => Promise<void>;
  deleteCustomEvent: (eventId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  documents: [],
  accreditationPrograms: [],
  standards: [],
  projectTemplates: [],
  appSettings: null,
  initializationError: null,
  departments: [],
  trainingPrograms: [],
  certificates: [],
  userTrainingStatuses: {},
  competencies: [],
  risks: [],
  incidentReports: [],
  auditPlans: [],
  audits: [],
  customEvents: [],
  
  fetchAllData: async () => {
    try {
      // Fetch all data concurrently using Promise.allSettled to allow partial success
      const results = await Promise.allSettled([
        getAppSettings(),
        getStandards(),
        getCompetencies(),
        getDepartments(),
        getAccreditationPrograms(),
        getTrainingPrograms(),
        getRisks(),
        getDocuments()
      ]);

      // Extract values from PromiseSettledResult objects
      const [settingsResult, stdsResult, compsResult, deptsResult, programsResult, trainingsResult, rksResult, docsResult] = results;
      
      const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
      const stds = stdsResult.status === 'fulfilled' ? stdsResult.value : null;
      const comps = compsResult.status === 'fulfilled' ? compsResult.value : null;
      const depts = deptsResult.status === 'fulfilled' ? deptsResult.value : null;
      const programs = programsResult.status === 'fulfilled' ? programsResult.value : null;
      const trainings = trainingsResult.status === 'fulfilled' ? trainingsResult.value : null;
      const rks = rksResult.status === 'fulfilled' ? rksResult.value : null;
      const docs = docsResult.status === 'fulfilled' ? docsResult.value : null;

      // Log any failures for debugging
      const failedServices: string[] = [];
      if (settingsResult.status === 'rejected') failedServices.push('appSettings');
      if (stdsResult.status === 'rejected') failedServices.push('standards');
      if (compsResult.status === 'rejected') failedServices.push('competencies');
      if (deptsResult.status === 'rejected') failedServices.push('departments');
      if (programsResult.status === 'rejected') failedServices.push('programs');
      if (trainingsResult.status === 'rejected') failedServices.push('trainings');
      if (rksResult.status === 'rejected') failedServices.push('risks');
      if (docsResult.status === 'rejected') failedServices.push('documents');

      if (failedServices.length > 0) {
        const errorMsg = `Failed to load: ${failedServices.join(', ')}`;
        console.warn('Partial initialization failure:', errorMsg);
        if (settingsResult.status === 'rejected') {
          set({ initializationError: errorMsg });
        }
      }

      // CRITICAL: Always set appSettings (with null/fallback if failed) to prevent infinite loading
      set({
        appSettings: settings,
        standards: stds || [],
        competencies: comps || [],
        departments: depts || [],
        accreditationPrograms: programs || [],
        trainingPrograms: trainings || [],
        risks: rks || [],
        documents: docs || []
      });

      // Generate project templates dynamically based on loaded programs
      if (programs && programs.length > 0) {
        const generatedTemplates = generateProjectTemplates(programs);
        set({ projectTemplates: generatedTemplates });
      } else {
        set({ projectTemplates: [] });
      }
    } catch (error) {
      // Catch-all for unexpected errors
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during initialization';
      console.error('Unexpected error during data fetch:', error);
      set({ initializationError: errorMsg });
    }
  },
  
  // Internal setter for app settings (used when Firebase fails)
  setAppSettings: (settings: AppSettings) => set({ appSettings: settings }),
  
  // Clear initialization error
  clearInitializationError: () => set({ initializationError: null }),
  
  // Documents
  addDocument: (doc: AppDocument) => set(state => ({ documents: [...state.documents, doc] })),
  addControlledDocument: async (docData: { name: { en: string; ar: string }, type: AppDocument['type'], fileUrl?: string, tags?: string[], category?: string, departmentIds?: string[] }) => {
    try {
      const newDoc: AppDocument = {
        id: `doc-${Date.now()}`,
        name: docData.name,
        type: docData.type,
        isControlled: true,
        status: 'Draft',
        content: { en: '', ar: '' },
        fileUrl: docData.fileUrl,
        currentVersion: 1,
        versionHistory: [],
        uploadedAt: new Date().toISOString(),
        tags: docData.tags,
        category: docData.category,
        departmentIds: docData.departmentIds,
      };
      
      // Save to Firebase first
      await addDocumentToFirebase(newDoc);
      // Then update local state
      set(state => ({ documents: [...state.documents, newDoc] }));
    } catch (error) {
      console.error('Failed to add document:', error);
      throw error;
    }
  },
  addProcessMap: async (docData: { name: { en: string; ar: string }, tags?: string[], category?: string, departmentIds?: string[] }) => {
    try {
      const newDoc: AppDocument = {
        id: `pm-${Date.now()}`,
        name: docData.name,
        type: 'Process Map',
        isControlled: true,
        status: 'Draft',
        content: null,
        processMapContent: { nodes: [], edges: [] },
        currentVersion: 1,
        versionHistory: [],
        uploadedAt: new Date().toISOString(),
        tags: docData.tags,
        category: docData.category,
        departmentIds: docData.departmentIds,
      };
      
      // Save to Firebase first
      await addDocumentToFirebase(newDoc);
      // Then update local state
      set(state => ({ documents: [...state.documents, newDoc] }));
    } catch (error) {
      console.error('Failed to add process map:', error);
      throw error;
    }
  },
  updateDocument: async (doc: AppDocument) => {
    try {
      // Save to Firebase first
      await updateDocumentInFirebase(doc);
      // Then update local state
      set(state => ({ documents: state.documents.map(d => d.id === doc.id ? doc : d) }));
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  },
  deleteDocument: async (docId: string) => {
    try {
      // Delete from Firebase first
      await deleteDocumentFromFirebase(docId);
      // Then update local state
      set(state => ({ documents: state.documents.filter(d => d.id !== docId) }));
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  },
  approveDocument: async (docId: string) => {
    try {
      const doc = get().documents.find(d => d.id === docId);
      if (doc) {
        const updatedDoc = { ...doc, status: 'Approved' as const };
        // Save to Firebase first
        await updateDocumentInFirebase(updatedDoc);
        // Then update local state
        set(state => ({ documents: state.documents.map(d => d.id === docId ? updatedDoc : d) }));
      }
    } catch (error) {
      console.error('Failed to approve document:', error);
      throw error;
    }
  },

  // App Settings
  updateAppSettings: async (settings: AppSettings) => {
    try {
      // Update Firebase first
      await updateAppSettingsInFirebase(settings);
      // Then update local state
      set({ appSettings: settings });
    } catch (error) {
      console.error('Failed to update app settings:', error);
      // Still update local state as fallback
      set({ appSettings: settings });
      throw error;
    }
  },

  // Programs
  addProgram: async (programData: Omit<AccreditationProgram, 'id'>) => {
    try {
      // Save to Firebase first
      const newProgram = await addAccreditationProgram(programData);
      // Then update local state
      set(state => ({ accreditationPrograms: [...state.accreditationPrograms, newProgram] }));
      // Regenerate templates with new program
      const { accreditationPrograms } = get();
      const generatedTemplates = generateProjectTemplates(accreditationPrograms);
      set({ projectTemplates: generatedTemplates });
    } catch (error) {
      console.error('Failed to add program:', error);
      throw error;
    }
  },
  updateProgram: async (program: AccreditationProgram) => {
    try {
      // Save to Firebase first
      await updateAccreditationProgram(program);
      // Then update local state
      set(state => ({ accreditationPrograms: state.accreditationPrograms.map(p => p.id === program.id ? program : p) }));
      // Regenerate templates after program update
      const { accreditationPrograms } = get();
      const generatedTemplates = generateProjectTemplates(accreditationPrograms);
      set({ projectTemplates: generatedTemplates });
    } catch (error) {
      console.error('Failed to update program:', error);
      throw error;
    }
  },
  deleteProgram: async (programId: string) => {
    try {
      // Delete from Firebase first
      await deleteAccreditationProgram(programId);
      // Then update local state
      set(state => ({ accreditationPrograms: state.accreditationPrograms.filter(p => p.id !== programId) }));
      // Regenerate templates after program deletion
      const updatedPrograms = get().accreditationPrograms.filter(p => p.id !== programId);
      const generatedTemplates = generateProjectTemplates(updatedPrograms);
      set({ projectTemplates: generatedTemplates });
    } catch (error) {
      console.error('Failed to delete program:', error);
      throw error;
    }
  },

  // Project Templates (generated dynamically from programs)
  getTemplatesByProgram: (programId: string) => {
    const { projectTemplates } = get();
    return projectTemplates.filter(t => t.programId === programId || t.programId === '');
  },
  refreshTemplates: () => {
    const { accreditationPrograms } = get();
    const generatedTemplates = generateProjectTemplates(accreditationPrograms);
    set({ projectTemplates: generatedTemplates });
  },
  
  addStandard: async (standardData: Omit<Standard, 'id'>) => {
    try {
      const newStandard = await addStandardToFirebase(standardData);
      set(state => ({ standards: [...state.standards, newStandard] }));
    } catch (error) {
      console.error('Failed to add standard:', error);
      throw error;
    }
  },
  updateStandard: async (standard: Standard) => {
    try {
      await updateStandardInFirebase(standard);
      set(state => ({ standards: state.standards.map(s => s.standardId === standard.standardId ? standard : s) }));
    } catch (error) {
      console.error('Failed to update standard:', error);
      throw error;
    }
  },
  deleteStandard: async (standardId: string) => {
    try {
      await deleteStandardFromFirebase(standardId);
      set(state => ({ standards: state.standards.filter(s => s.standardId !== standardId) }));
    } catch (error) {
      console.error('Failed to delete standard:', error);
      throw error;
    }
  },

  
  addDepartment: async (deptData: Omit<Department, 'id'>) => {
    try {
      const newDept = await addDepartmentToFirebase(deptData);
      set(state => ({ departments: [...state.departments, newDept] }));
    } catch (error) {
      console.error('Failed to add department:', error);
      throw error;
    }
  },
  updateDepartment: async (dept: Department) => {
    try {
      await updateDepartmentInFirebase(dept);
      set(state => ({ departments: state.departments.map(d => d.id === dept.id ? dept : d) }));
    } catch (error) {
      console.error('Failed to update department:', error);
      throw error;
    }
  },
  deleteDepartment: async (deptId: string) => {
    try {
      await deleteDepartmentFromFirebase(deptId);
      set(state => ({ departments: state.departments.filter(d => d.id !== deptId) }));
    } catch (error) {
      console.error('Failed to delete department:', error);
      throw error;
    }
  },  
  addCompetency: async (compData: Omit<Competency, 'id'>) => {
    try {
      const newComp = await addCompetencyToFirebase(compData);
      set(state => ({ competencies: [...state.competencies, newComp] }));
    } catch (error) {
      console.error('Failed to add competency:', error);
      throw error;
    }
  },
  updateCompetency: async (comp: Competency) => {
    try {
      await updateCompetencyInFirebase(comp);
      set(state => ({ competencies: state.competencies.map(c => c.id === comp.id ? comp : c) }));
    } catch (error) {
      console.error('Failed to update competency:', error);
      throw error;
    }
  },
  deleteCompetency: async (compId: string) => {
    try {
      await deleteCompetencyFromFirebase(compId);
      set(state => ({ competencies: state.competencies.filter(c => c.id !== compId) }));
    } catch (error) {
      console.error('Failed to delete competency:', error);
      throw error;
    }
  },
  
  addTrainingProgram: async (programData: Omit<TrainingProgram, 'id'>) => {
    try {
      const newProgram = await addTrainingProgramToFirebase(programData);
      set(state => ({ trainingPrograms: [...state.trainingPrograms, newProgram] }));
    } catch (error) {
      console.error('Failed to add training program:', error);
      throw error;
    }
  },
  updateTrainingProgram: async (program: TrainingProgram) => {
    try {
      await updateTrainingProgramInFirebase(program);
      set(state => ({ trainingPrograms: state.trainingPrograms.map(p => p.id === program.id ? program : p) }));
    } catch (error) {
      console.error('Failed to update training program:', error);
      throw error;
    }
  },
  deleteTrainingProgram: async (programId: string) => {
    try {
      await deleteTrainingProgramFromFirebase(programId);
      set(state => ({ trainingPrograms: state.trainingPrograms.filter(p => p.id !== programId) }));
    } catch (error) {
      console.error('Failed to delete training program:', error);
      throw error;
    }
  },
  
  assignTraining: async ({ trainingId, userIds, departmentIds, dueDate }: { trainingId: string; userIds: string[]; departmentIds: string[]; dueDate?: string }) => {
    const userStore = useUserStore.getState();
    const allUsersToUpdate = new Set<string>(userIds);
    if(departmentIds.length > 0) {
        userStore.users.forEach(u => {
            if(u.departmentId && departmentIds.includes(u.departmentId)) {
                allUsersToUpdate.add(u.id);
            }
        });
    }
    
    allUsersToUpdate.forEach(uid => {
        const user = userStore.users.find(u => u.id === uid);
        if(user) {
            const newAssignments = [...(user.trainingAssignments || [])];
            if(!newAssignments.find(a => a.trainingId === trainingId)) {
                newAssignments.push({ trainingId, assignedDate: new Date().toISOString(), dueDate });
            }
            userStore.updateUser({...user, trainingAssignments: newAssignments });
        }
    });
  },

  submitQuiz: async (trainingId: string, answers: { [key: string]: number }) => {
      const user = useUserStore.getState().currentUser;
      const program = get().trainingPrograms.find(p => p.id === trainingId);
      if(!user || !program) throw new Error("User or training not found");

      let correctAnswers = 0;
      program.quiz.forEach(q => {
          if(answers[q.id] === q.correctOptionIndex) {
              correctAnswers++;
          }
      });
      const score = Math.round((correctAnswers / program.quiz.length) * 100);
      const passed = score >= program.passingScore;

      let certificateId: string | undefined;
      if (passed) {
          const newCert: CertificateData = {
              id: `cert-${user.id}-${trainingId}`,
              userId: user.id,
              userName: user.name,
              trainingId,
              trainingTitle: typeof program.title === 'string' ? program.title : program.title.en,
              completionDate: new Date().toISOString(),
              score
          };
          set(state => ({ certificates: [...state.certificates.filter(c => c.id !== newCert.id), newCert]}));
          certificateId = newCert.id;
      }
      
      set(state => ({
          userTrainingStatuses: {
              ...state.userTrainingStatuses,
              [user.id]: {
                  ...state.userTrainingStatuses[user.id],
                  [trainingId]: { status: passed ? 'Completed' : 'In Progress', score, completionDate: passed ? new Date().toISOString() : undefined, certificateId }
              }
          }
      }));
      return { score, passed, certificateId };
  },
  
  addRisk: async (riskData: Omit<Risk, 'id'>) => {
    try {
      const newRisk = await addRiskToFirebase(riskData);
      set(state => ({ risks: [...state.risks, newRisk] }));
    } catch (error) {
      console.error('Failed to add risk:', error);
      throw error;
    }
  },
  updateRisk: async (risk: Risk) => {
    try {
      await updateRiskInFirebase(risk);
      set(state => ({ risks: state.risks.map(r => r.id === risk.id ? risk : r) }));
    } catch (error) {
      console.error('Failed to update risk:', error);
      throw error;
    }
  },
  deleteRisk: async (riskId: string) => {
    try {
      await deleteRiskFromFirebase(riskId);
      set(state => ({ risks: state.risks.filter(r => r.id !== riskId) }));
    } catch (error) {
      console.error('Failed to delete risk:', error);
      throw error;
    }
  },
  
  addIncidentReport: async (reportData: Omit<IncidentReport, 'id'>) => {
    try {
      const newReport = await addIncidentReportToFirebase(reportData);
      set(state => ({ incidentReports: [...state.incidentReports, newReport] }));
    } catch (error) {
      console.error('Failed to add incident report:', error);
      throw error;
    }
  },
  updateIncidentReport: async (report: IncidentReport) => {
    try {
      await updateIncidentReportInFirebase(report);
      set(state => ({ incidentReports: state.incidentReports.map(r => r.id === report.id ? report : r) }));
    } catch (error) {
      console.error('Failed to update incident report:', error);
      throw error;
    }
  },
  deleteIncidentReport: async (reportId: string) => {
    try {
      await deleteIncidentReportFromFirebase(reportId);
      set(state => ({ incidentReports: state.incidentReports.filter(r => r.id !== reportId) }));
    } catch (error) {
      console.error('Failed to delete incident report:', error);
      throw error;
    }
  },
  
  addAuditPlan: async (planData: Omit<AuditPlan, 'id'>) => {
    try {
      const newPlan = await addAuditPlanToFirebase(planData);
      set(state => ({ auditPlans: [...state.auditPlans, newPlan] }));
    } catch (error) {
      console.error('Failed to add audit plan:', error);
      throw error;
    }
  },
  updateAuditPlan: async (plan: AuditPlan) => {
    try {
      await updateAuditPlanInFirebase(plan);
      set(state => ({ auditPlans: state.auditPlans.map(p => p.id === plan.id ? plan : p) }));
    } catch (error) {
      console.error('Failed to update audit plan:', error);
      throw error;
    }
  },
  deleteAuditPlan: async (planId: string) => {
    try {
      await deleteAuditPlanFromFirebase(planId);
      set(state => ({ auditPlans: state.auditPlans.filter(p => p.id !== planId) }));
    } catch (error) {
      console.error('Failed to delete audit plan:', error);
      throw error;
    }
  },
  
  runAudit: async (planId: string) => {
      // Mock audit run
      // Audit run executed
  },

  
  addCustomEvent: async (eventData: Omit<CustomCalendarEvent, 'id' | 'type'>) => {
    try {
      const newEvent = await addCustomEventToFirebase({ ...eventData, type: 'Custom' });
      set(state => ({ customEvents: [...state.customEvents, newEvent] }));
    } catch (error) {
      console.error('Failed to add custom event:', error);
      throw error;
    }
  },
  updateCustomEvent: async (event: CustomCalendarEvent) => {
    try {
      await updateCustomEventInFirebase(event);
      set(state => ({ customEvents: state.customEvents.map(e => e.id === event.id ? event : e) }));
    } catch (error) {
      console.error('Failed to update custom event:', error);
      throw error;
    }
  },
  deleteCustomEvent: async (eventId: string) => {
    try {
      await deleteCustomEventFromFirebase(eventId);
      set(state => ({ customEvents: state.customEvents.filter(e => e.id !== eventId) }));
    } catch (error) {
      console.error('Failed to delete custom event:', error);
      throw error;
    }
  },}));