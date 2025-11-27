import { create } from 'zustand';
import { Project, ChecklistItem, DesignControlItem, CAPAReport, MockSurvey, ComplianceStatus, PDCACycle, PDCAStage } from '@/types';
import { backendService } from '@/services/BackendService';
import { useUserStore } from './useUserStore';
import { useAppStore } from './useAppStore';

interface ProjectState {
  projects: Project[];
  fetchAllProjects: () => Promise<void>;
  addProject: (newProjectData: any) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  finalizeProject: (projectId: string, passwordAttempt: string) => Promise<void>;
  updateDesignControls: (projectId: string, designControls: DesignControlItem[]) => Promise<void>;
  generateReport: (projectId: string, reportType: string) => Promise<void>;
  updateChecklistItem: (projectId: string, checklistItemId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  addComment: (projectId: string, checklistItemId: string, commentText: string) => Promise<void>;
  addCapaReport: (projectId: string, checklistItemId: string) => Promise<void>;
  uploadEvidence: (projectId: string, checklistItemId: string, fileData: any) => Promise<void>;
  startMockSurvey: (projectId: string) => Promise<{ updatedProject: Project; newSurvey: MockSurvey }>;
  updateMockSurvey: (projectId: string, survey: MockSurvey) => Promise<void>;
  applySurveyFindingsToProject: (projectId: string, surveyId: string) => Promise<void>;
  updateCapa: (projectId: string, capa: CAPAReport) => Promise<void>;
  // PDCA actions
  updateCAPAPDCAStage: (projectId: string, capaId: string, newStage: PDCAStage, notes: string, attachments: string[]) => Promise<void>;
  createPDCACycle: (projectId: string, cycleData: Omit<PDCACycle, 'id' | 'createdAt' | 'stageHistory'>) => Promise<void>;
  updatePDCACycle: (projectId: string, cycle: PDCACycle) => Promise<void>;
  getPDCACyclesByStage: (projectId: string, stage: PDCAStage) => PDCACycle[];
}

const calculateProgress = (checklist: ChecklistItem[]): number => {
  if (!checklist || checklist.length === 0) {
    return 0;
  }
  const applicableItems = checklist.filter(c => c.status !== ComplianceStatus.NotApplicable);
  if (applicableItems.length === 0) {
    return 100;
  }
  const score = applicableItems.reduce((acc, item) => {
    if (item.status === ComplianceStatus.Compliant) return acc + 1;
    if (item.status === ComplianceStatus.PartiallyCompliant) return acc + 0.5;
    return acc;
  }, 0);
  return (score / applicableItems.length) * 100;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  fetchAllProjects: async () => {
    const projectsFromBackend = await backendService.getProjects();
    const projectsWithProgress = projectsFromBackend.map(p => ({
      ...p,
      progress: calculateProgress(p.checklist)
    }));
    set({ projects: projectsWithProgress });
  },
  addProject: async (newProjectData) => {
    const newProject = await backendService.createProject(newProjectData);
    set(state => ({ projects: [...state.projects, { ...newProject, progress: calculateProgress(newProject.checklist) }] }));
  },
  updateProject: async (updatedProject) => {
    const projectWithRecalculatedProgress = {
      ...updatedProject,
      progress: calculateProgress(updatedProject.checklist)
    };
    const returnedProject = await backendService.updateProject(projectWithRecalculatedProgress);
    set(state => ({
      projects: state.projects.map(p => p.id === returnedProject.id ? returnedProject : p)
    }));
  },
  deleteProject: async (projectId) => {
    await backendService.deleteProject(projectId);
    set(state => ({
      projects: state.projects.filter(p => p.id !== projectId)
    }));
  },
  finalizeProject: async (projectId, passwordAttempt) => {
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error("User not authenticated");
    const updatedProject = await backendService.finalizeProject(projectId, user.id, passwordAttempt);
    get().updateProject(updatedProject);
  },
  updateDesignControls: async (projectId, designControls) => {
    const updatedProject = await backendService.updateDesignControls(projectId, designControls);
    get().updateProject(updatedProject);
  },
  generateReport: async (projectId, reportType) => {
    const project = get().projects.find(p => p.id === projectId);
    const user = useUserStore.getState().currentUser;
    if (project && user) {
      const newReport = await backendService.generateProjectReport(project, reportType, user.name);
      useAppStore.getState().addDocument(newReport);
    }
  },
  updateChecklistItem: async (projectId, checklistItemId, updates) => {
    const project = get().projects.find(p => p.id === projectId);
    if (project) {
      const newChecklist = project.checklist.map(item =>
        item.id === checklistItemId ? { ...item, ...updates } : item
      );
      await get().updateProject({ ...project, checklist: newChecklist });
    }
  },
  addComment: async (projectId, checklistItemId, commentText) => {
    const user = useUserStore.getState().currentUser;
    if (user) {
      const updatedProject = await backendService.addComment(projectId, checklistItemId, {
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        text: commentText,
      });
      get().updateProject(updatedProject);
    }
  },
  addCapaReport: async (projectId, checklistItemId) => {
    const project = get().projects.find(p => p.id === projectId);
    const item = project?.checklist.find(i => i.id === checklistItemId);
    if (project && item) {
      const capaData = {
        status: 'Open' as 'Open',
        type: 'Corrective' as 'Corrective',
        sourceProjectId: projectId,
        sourceChecklistItemId: checklistItemId,
        sourceStandardId: item.standardId,
        description: `CAPA for non-compliance in standard ${item.standardId}: ${item.item}`,
        rootCauseAnalysis: '',
        actionPlan: '',
        assignedTo: null,
        dueDate: '',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await backendService.addCapaReport(projectId, capaData);
      get().updateProject(updatedProject);
    }
  },
  uploadEvidence: async (projectId, checklistItemId, docData) => {
    const user = useUserStore.getState().currentUser;
    if (user) {
      const { updatedProject, newDocument } = await backendService.uploadEvidenceDocument(projectId, checklistItemId, docData, user.name);
      get().updateProject(updatedProject);
      useAppStore.getState().addDocument(newDocument);
    }
  },
  startMockSurvey: async (projectId) => {
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error("User not authenticated");
    const { updatedProject, newSurvey } = await backendService.startMockSurvey(projectId, user.id);
    get().updateProject(updatedProject);
    return { updatedProject, newSurvey };
  },
  updateMockSurvey: async (projectId, survey) => {
    const updatedProject = await backendService.updateMockSurvey(projectId, survey);
    get().updateProject(updatedProject);
  },
  applySurveyFindingsToProject: async (projectId, surveyId) => {
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error("User not authenticated");
    const updatedProject = await backendService.applySurveyFindingsToProject(projectId, surveyId, user.name);
    get().updateProject(updatedProject);
  },
  updateCapa: async (projectId, capa) => {
    const updatedProject = await backendService.updateCapa(projectId, capa);
    get().updateProject(updatedProject);
  },

  // PDCA actions
  updateCAPAPDCAStage: async (projectId, capaId, newStage, notes, attachments) => {
    const project = get().projects.find(p => p.id === projectId);
    const capa = project?.capaReports.find(c => c.id === capaId);

    if (!project || !capa) {
      throw new Error('Project or CAPA not found');
    }

    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error('User not authenticated');

    // Create history entry
    const historyEntry = {
      stage: capa.pdcaStage || 'Plan',
      enteredAt: capa.pdcaHistory?.[capa.pdcaHistory.length - 1]?.completedAt || capa.createdAt,
      completedAt: new Date().toISOString(),
      completedBy: user.id,
      notes,
      attachments
    };

    // Update CAPA with new stage and history
    const updatedCapa: CAPAReport = {
      ...capa,
      pdcaStage: newStage,
      pdcaHistory: [...(capa.pdcaHistory || []), historyEntry]
    };

    await get().updateCapa(projectId, updatedCapa);
  },

  createPDCACycle: async (projectId, cycleData) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error('User not authenticated');

    const newCycle: PDCACycle = {
      ...cycleData,
      id: `pdca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      stageHistory: [{
        stage: 'Plan',
        enteredAt: new Date().toISOString(),
        completedAt: '',
        completedBy: user.id,
        notes: 'PDCA cycle created',
        attachments: []
      }]
    };

    const updatedProject: Project = {
      ...project,
      pdcaCycles: [...(project.pdcaCycles || []), newCycle]
    };

    await get().updateProject(updatedProject);
  },

  updatePDCACycle: async (projectId, cycle) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const updatedProject: Project = {
      ...project,
      pdcaCycles: (project.pdcaCycles || []).map(c =>
        c.id === cycle.id ? cycle : c
      )
    };

    await get().updateProject(updatedProject);
  },

  getPDCACyclesByStage: (projectId, stage) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project || !project.pdcaCycles) {
      return [];
    }
    return project.pdcaCycles.filter(cycle => cycle.currentStage === stage);
  }
}));
