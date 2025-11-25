import { create } from 'zustand';
import {
  AppDocument, Standard, AccreditationProgram, Department,
  TrainingProgram, CertificateData, UserTrainingStatus, Competency, Risk,
  IncidentReport, AuditPlan, Audit, CustomCalendarEvent, AppSettings, UserRole
} from '@/types';
// FIX: Corrected import path for backendService
import { backendService } from '@/services/BackendService';
// FIX: Corrected import path for useUserStore
import { useUserStore } from './useUserStore';

interface AppState {
  documents: AppDocument[];
  accreditationPrograms: AccreditationProgram[];
  standards: Standard[];
  appSettings: AppSettings | null;
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

  // Documents
  addDocument: (doc: AppDocument) => void;
  addControlledDocument: (docData: { name: { en: string; ar: string }, type: AppDocument['type'] }) => Promise<void>;
  addProcessMap: (docData: { name: { en: string; ar: string }}) => Promise<void>;
  updateDocument: (doc: AppDocument) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  approveDocument: (docId: string, passwordAttempt: string) => Promise<void>;

  // App Settings
  updateAppSettings: (settings: AppSettings) => Promise<void>;
  
  // Programs
  addProgram: (programData: Omit<AccreditationProgram, 'id'>) => Promise<void>;
  updateProgram: (program: AccreditationProgram) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  
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
  appSettings: null,
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
    const data = await backendService.getAllData();
    set(data);
  },
  
  // Documents
  addDocument: (doc) => set(state => ({ documents: [...state.documents, doc] })),
  addControlledDocument: async (docData) => {
    // This would call a backend service method
    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: docData.name,
      type: docData.type,
      isControlled: true,
      status: 'Draft',
      content: { en: '', ar: '' },
      currentVersion: 1,
      versionHistory: [],
      uploadedAt: new Date().toISOString(),
    };
    set(state => ({ documents: [...state.documents, newDoc] }));
  },
  addProcessMap: async (docData) => {
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
      };
      set(state => ({ documents: [...state.documents, newDoc] }));
  },
  updateDocument: async (doc) => set(state => ({ documents: state.documents.map(d => d.id === doc.id ? doc : d) })),
  deleteDocument: async (docId) => set(state => ({ documents: state.documents.filter(d => d.id !== docId) })),
  approveDocument: async (docId, passwordAttempt) => {
    const user = useUserStore.getState().currentUser;
    if (!user || passwordAttempt !== 'password123') { // Mock password check
        throw new Error("Invalid credentials");
    }
    set(state => ({
        documents: state.documents.map(doc => {
            if (doc.id === docId) {
                return { ...doc, status: 'Approved', approvedBy: user.name, approvalDate: new Date().toISOString() };
            }
            return doc;
        })
    }));
  },

  // App Settings
  updateAppSettings: async (settings) => set({ appSettings: settings }),
  
  // CRUD stubs for other types - in a real app these would call backendService
  addProgram: async (programData) => {
      const newProgram = { id: `prog-${Date.now()}`, ...programData };
      set(state => ({ accreditationPrograms: [...state.accreditationPrograms, newProgram] }));
  },
  updateProgram: async (program) => set(state => ({ accreditationPrograms: state.accreditationPrograms.map(p => p.id === program.id ? program : p) })),
  deleteProgram: async (programId) => set(state => ({ accreditationPrograms: state.accreditationPrograms.filter(p => p.id !== programId) })),
  
  addStandard: async (standardData) => {
    const newStandard = { ...standardData };
    set(state => ({ standards: [...state.standards, newStandard] }));
  },
  updateStandard: async (standard) => set(state => ({ standards: state.standards.map(s => s.standardId === standard.standardId ? standard : s) })),
  deleteStandard: async (standardId) => set(state => ({ standards: state.standards.filter(s => s.standardId !== standardId) })),

  addDepartment: async (deptData) => {
    const newDept = { id: `dept-${Date.now()}`, ...deptData };
    set(state => ({ departments: [...state.departments, newDept] }));
  },
  updateDepartment: async (dept) => set(state => ({ departments: state.departments.map(d => d.id === dept.id ? dept : d) })),
  deleteDepartment: async (deptId) => set(state => ({ departments: state.departments.filter(d => d.id !== deptId) })),
  
  addCompetency: async (compData) => {
    const newComp = { id: `comp-${Date.now()}`, ...compData };
    set(state => ({ competencies: [...state.competencies, newComp] }));
  },
  updateCompetency: async (comp) => set(state => ({ competencies: state.competencies.map(c => c.id === comp.id ? comp : c) })),
  deleteCompetency: async (compId) => set(state => ({ competencies: state.competencies.filter(c => c.id !== compId) })),
  
  addTrainingProgram: async (programData) => {
      const newProgram = { id: `train-${Date.now()}`, ...programData };
      set(state => ({ trainingPrograms: [...state.trainingPrograms, newProgram] }));
  },
  updateTrainingProgram: async (program) => set(state => ({ trainingPrograms: state.trainingPrograms.map(p => p.id === program.id ? program : p) })),
  deleteTrainingProgram: async (programId) => set(state => ({ trainingPrograms: state.trainingPrograms.filter(p => p.id !== programId) })),
  
  assignTraining: async ({ trainingId, userIds, departmentIds, dueDate }) => {
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

  submitQuiz: async (trainingId, answers) => {
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
              trainingTitle: program.title,
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
  
  addRisk: async (riskData) => {
      const newRisk = { id: `risk-${Date.now()}`, ...riskData };
      set(state => ({ risks: [...state.risks, newRisk] }));
  },
  updateRisk: async (risk) => set(state => ({ risks: state.risks.map(r => r.id === risk.id ? risk : r) })),
  deleteRisk: async (riskId) => set(state => ({ risks: state.risks.filter(r => r.id !== riskId) })),
  
  addIncidentReport: async (reportData) => {
      const newReport = { id: `inc-${Date.now()}`, ...reportData };
      set(state => ({ incidentReports: [...state.incidentReports, newReport] }));
  },
  updateIncidentReport: async (report) => set(state => ({ incidentReports: state.incidentReports.map(r => r.id === report.id ? report : r) })),
  deleteIncidentReport: async (reportId) => set(state => ({ incidentReports: state.incidentReports.filter(r => r.id !== reportId) })),
  
  addAuditPlan: async (planData) => {
    const newPlan = { id: `plan-${Date.now()}`, ...planData };
    set(state => ({ auditPlans: [...state.auditPlans, newPlan] }));
  },
  updateAuditPlan: async (plan) => set(state => ({ auditPlans: state.auditPlans.map(p => p.id === plan.id ? plan : p) })),
  deleteAuditPlan: async (planId) => set(state => ({ auditPlans: state.auditPlans.filter(p => p.id !== planId) })),
  
  runAudit: async (planId) => {
      // Mock audit run
      console.log(`Running audit for plan ${planId}`);
  },

  addCustomEvent: async (eventData) => {
      const newEvent = { id: `event-${Date.now()}`, type: 'Custom' as const, ...eventData };
      set(state => ({ customEvents: [...state.customEvents, newEvent]}));
  },
  updateCustomEvent: async (event) => set(state => ({ customEvents: state.customEvents.map(e => e.id === event.id ? event : e) })),
  deleteCustomEvent: async (eventId) => set(state => ({ customEvents: state.customEvents.filter(e => e.id !== eventId) })),

}));