import { create } from 'zustand';
import { Project, ChecklistItem, DesignControlItem, CAPAReport, MockSurvey, ComplianceStatus, PDCACycle, PDCAStage } from '@/types';
import * as projectService from '@/services/projectService';
import { useUserStore } from './useUserStore';
import { useAppStore } from './useAppStore';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;
  fetchAllProjects: () => Promise<void>;
  subscribeToProjects: () => void;
  unsubscribeFromProjects: () => void;
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
  bulkArchiveProjects: (projectIds: string[]) => Promise<boolean>;
  bulkRestoreProjects: (projectIds: string[]) => Promise<boolean>;
  bulkDeleteProjects: (projectIds: string[]) => Promise<boolean>;
  bulkUpdateStatus: (projectIds: string[], status: ProjectStatus) => Promise<boolean>;
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
  loading: false,
  error: null,
  unsubscribe: null,

  fetchAllProjects: async () => {
    try {
      set({ loading: true, error: null });
      const projectsFromBackend = await projectService.getProjects();
      const projectsWithProgress = projectsFromBackend.map(p => ({
        ...p,
        progress: calculateProgress(p.checklist)
      }));
      set({ projects: projectsWithProgress, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  subscribeToProjects: () => {
    const unsubscribeFn = projectService.subscribeToProjects((projects) => {
      const projectsWithProgress = projects.map(p => ({
        ...p,
        progress: calculateProgress(p.checklist)
      }));
      set({ projects: projectsWithProgress });
    });
    set({ unsubscribe: unsubscribeFn });
  },

  unsubscribeFromProjects: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },
  addProject: async (newProjectData) => {
    const newProject = await projectService.createProject(newProjectData);
    set(state => ({ projects: [...state.projects, { ...newProject, progress: calculateProgress(newProject.checklist) }] }));
  },
  updateProject: async (updatedProject) => {
    const projectWithRecalculatedProgress = {
      ...updatedProject,
      progress: calculateProgress(updatedProject.checklist)
    };
    await projectService.updateProject(updatedProject.id, projectWithRecalculatedProgress);
    set(state => ({
      projects: state.projects.map(p => p.id === updatedProject.id ? projectWithRecalculatedProgress : p)
    }));
  },
  deleteProject: async (projectId) => {
    await projectService.deleteProject(projectId);
    set(state => ({
      projects: state.projects.filter(p => p.id !== projectId)
    }));
  },
  finalizeProject: async (projectId, passwordAttempt) => {
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error("User not authenticated");
    await projectService.finalizeProject(projectId, user.id, user.name);
    await get().fetchAllProjects();
  },
  updateDesignControls: async (projectId, designControls) => {
    await projectService.updateDesignControls(projectId, designControls);
    await get().fetchAllProjects();
  },
  generateReport: async (projectId, reportType) => {
    // This functionality needs to be implemented in a separate report service
    // For now, we'll keep it as a placeholder
    console.log('Generate report:', projectId, reportType);
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
      await projectService.addComment(projectId, checklistItemId, {
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        text: commentText,
      });
      await get().fetchAllProjects();
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
      await projectService.addCapaReport(projectId, capaData);
      await get().fetchAllProjects();
    }
  },
  uploadEvidence: async (projectId, checklistItemId, fileData) => {
    const user = useUserStore.getState().currentUser;
    if (user) {
      // Upload file and get document ID
      // This needs to be implemented with Firebase Storage
      const fileId = `doc-${Date.now()}`;
      await projectService.uploadEvidence(projectId, checklistItemId, fileId);
      await get().fetchAllProjects();
    }
  },
  startMockSurvey: async (projectId) => {
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error("User not authenticated");
    const newSurvey = await projectService.startMockSurvey(projectId, user.id);
    await get().fetchAllProjects();
    const updatedProject = get().projects.find(p => p.id === projectId)!;
    return { updatedProject, newSurvey };
  },
  updateMockSurvey: async (projectId, survey) => {
    await projectService.updateMockSurvey(projectId, survey.id, survey);
    await get().fetchAllProjects();
  },
  applySurveyFindingsToProject: async (projectId, surveyId) => {
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error("User not authenticated");
    // This functionality needs to be implemented
    console.log('Apply survey findings:', projectId, surveyId);
  },
  updateCapa: async (projectId, capa) => {
    await projectService.updateCapa(projectId, capa.id, capa);
    await get().fetchAllProjects();
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
    const user = useUserStore.getState().currentUser;
    if (!user) throw new Error('User not authenticated');

    await projectService.createPDCACycle(projectId, cycleData, user.id);
    await get().fetchAllProjects();
  },

  updatePDCACycle: async (projectId, cycle) => {
    await projectService.updatePDCACycle(projectId, cycle.id, cycle);
    await get().fetchAllProjects();
  },

  getPDCACyclesByStage: (projectId, stage) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project || !project.pdcaCycles) {
      return [];
    }
    return project.pdcaCycles.filter(cycle => cycle.currentStage === stage);
  },

  // Bulk Operations
  bulkArchiveProjects: async (projectIds: string[]) => {
    await projectService.bulkArchiveProjects(projectIds);
    await get().fetchAllProjects();
    return true;
  },

  bulkRestoreProjects: async (projectIds: string[]) => {
    await projectService.bulkRestoreProjects(projectIds);
    await get().fetchAllProjects();
    return true;
  },

  bulkDeleteProjects: async (projectIds: string[]) => {
    await projectService.bulkDeleteProjects(projectIds);
    await get().fetchAllProjects();
    return true;
  },

  bulkUpdateStatus: async (projectIds: string[], status: any) => {
    await projectService.bulkUpdateStatus(projectIds, status);
    await get().fetchAllProjects();
    return true;
  },
}));
