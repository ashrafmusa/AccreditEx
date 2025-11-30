import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import {
  Project,
  ChecklistItem,
  CAPAReport,
  PDCACycle,
  PDCAStage,
  Comment,
  DesignControlItem,
  MockSurvey,
  ProjectStatus,
  ComplianceStatus
} from '@/types';

const projectsCollection = collection(db, 'projects');

// ========================================
// CRUD Operations
// ========================================

export const getProjects = async (): Promise<Project[]> => {
  const projectSnapshot = await getDocs(query(projectsCollection, orderBy('createdAt', 'desc')));
  return projectSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
};

export const getProjectsByProgram = async (programId: string): Promise<Project[]> => {
  const q = query(projectsCollection, where('programId', '==', programId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
};

export const getProjectsByStatus = async (status: ProjectStatus): Promise<Project[]> => {
  const q = query(projectsCollection, where('status', '==', status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
  const newProject = {
    ...projectData,
    createdAt: Timestamp.now().toDate().toISOString(),
    updatedAt: Timestamp.now().toDate().toISOString(),
    progress: 0,
    checklist: projectData.checklist || [],
    capaReports: projectData.capaReports || [],
    pdcaCycles: projectData.pdcaCycles || [],
    mockSurveys: projectData.mockSurveys || [],
    designControls: projectData.designControls || [],
    activityLog: projectData.activityLog || []
  };
  
  const docRef = await addDoc(projectsCollection, newProject);
  return { id: docRef.id, ...newProject } as Project;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now().toDate().toISOString()
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const docRef = doc(db, 'projects', projectId);
  await deleteDoc(docRef);
};

// ========================================
// Real-time Listeners
// ========================================

export const subscribeToProjects = (callback: (projects: Project[]) => void): (() => void) => {
  const q = query(projectsCollection, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
    callback(projects);
  });
  
  return unsubscribe;
};

export const subscribeToProject = (
  projectId: string,
  callback: (project: Project | null) => void
): (() => void) => {
  const docRef = doc(db, 'projects', projectId);
  
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Project);
    } else {
      callback(null);
    }
  });
  
  return unsubscribe;
};

// ========================================
// Checklist Operations
// ========================================

export const updateChecklistItem = async (
  projectId: string,
  itemId: string,
  updates: Partial<ChecklistItem>
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const updatedChecklist = project.checklist.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  
  await updateProject(projectId, { checklist: updatedChecklist });
};

export const addComment = async (
  projectId: string,
  itemId: string,
  comment: Omit<Comment, 'id'>
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const updatedChecklist = project.checklist.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        comments: [
          ...item.comments,
          { ...comment, id: `comment-${Date.now()}` }
        ]
      };
    }
    return item;
  });
  
  await updateProject(projectId, { checklist: updatedChecklist });
};

export const uploadEvidence = async (
  projectId: string,
  itemId: string,
  fileId: string
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const updatedChecklist = project.checklist.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        evidenceFiles: [...item.evidenceFiles, fileId]
      };
    }
    return item;
  });
  
  await updateProject(projectId, { checklist: updatedChecklist });
};

// ========================================
// CAPA Operations
// ========================================

export const addCapaReport = async (
  projectId: string,
  capaData: Omit<CAPAReport, 'id'>
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const newCapa: CAPAReport = {
    ...capaData,
    id: `capa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pdcaStage: capaData.pdcaStage || 'Plan',
    pdcaHistory: capaData.pdcaHistory || []
  };
  
  await updateProject(projectId, {
    capaReports: [...project.capaReports, newCapa]
  });
};

export const updateCapa = async (
  projectId: string,
  capaId: string,
  updates: Partial<CAPAReport>
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const updatedCapas = project.capaReports.map(capa =>
    capa.id === capaId ? { ...capa, ...updates } : capa
  );
  
  await updateProject(projectId, { capaReports: updatedCapas });
};

export const updateCapaPDCAStage = async (
  projectId: string,
  capaId: string,
  newStage: PDCAStage,
  notes: string,
  completedBy: string,
  attachments: string[] = []
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const capa = project.capaReports.find(c => c.id === capaId);
  if (!capa) throw new Error('CAPA not found');
  
  const historyEntry = {
    stage: capa.pdcaStage || 'Plan',
    enteredAt: capa.pdcaHistory?.[capa.pdcaHistory.length - 1]?.completedAt || capa.createdAt,
    completedAt: new Date().toISOString(),
    completedBy,
    notes,
    attachments
  };
  
  const updatedCapa: CAPAReport = {
    ...capa,
    pdcaStage: newStage,
    pdcaHistory: [...(capa.pdcaHistory || []), historyEntry]
  };
  
  const updatedCapas = project.capaReports.map(c =>
    c.id === capaId ? updatedCapa : c
  );
  
  await updateProject(projectId, { capaReports: updatedCapas });
};

// ========================================
// PDCA Cycle Operations
// ========================================

export const createPDCACycle = async (
  projectId: string,
  cycleData: Omit<PDCACycle, 'id' | 'createdAt' | 'stageHistory'>,
  userId: string
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const newCycle: PDCACycle = {
    ...cycleData,
    id: `pdca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    stageHistory: [{
      stage: 'Plan',
      enteredAt: new Date().toISOString(),
      completedAt: '',
      completedBy: userId,
      notes: 'PDCA cycle created',
      attachments: []
    }]
  };
  
  await updateProject(projectId, {
    pdcaCycles: [...(project.pdcaCycles || []), newCycle]
  });
};

export const updatePDCACycle = async (
  projectId: string,
  cycleId: string,
  updates: Partial<PDCACycle>
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const updatedCycles = (project.pdcaCycles || []).map(cycle =>
    cycle.id === cycleId ? { ...cycle, ...updates } : cycle
  );
  
  await updateProject(projectId, { pdcaCycles: updatedCycles });
};

export const getPDCACyclesByStage = async (
  projectId: string,
  stage: PDCAStage
): Promise<PDCACycle[]> => {
  const project = await getProjectById(projectId);
  if (!project || !project.pdcaCycles) return [];
  
  return project.pdcaCycles.filter(cycle => cycle.currentStage === stage);
};

// ========================================
// Advanced Operations
// ========================================

export const finalizeProject = async (
  projectId: string,
  userId: string,
  userName: string
): Promise<void> => {
  await updateProject(projectId, {
    status: ProjectStatus.Finalized,
    finalizedBy: userName,
    finalizationDate: new Date().toISOString()
  });
};

export const archiveProject = async (projectId: string): Promise<void> => {
  await updateProject(projectId, {
    archived: true,
    archivedAt: new Date().toISOString()
  });
};

export const restoreProject = async (projectId: string): Promise<void> => {
  await updateProject(projectId, {
    archived: false,
    archivedAt: null
  });
};

export const duplicateProject = async (
  projectId: string,
  newName: string,
  userId: string
): Promise<Project> => {
  const originalProject = await getProjectById(projectId);
  if (!originalProject) throw new Error('Project not found');
  
  const { id, createdAt, updatedAt, activityLog, ...projectData } = originalProject;
  
  const duplicatedProject: Omit<Project, 'id'> = {
    ...projectData,
    name: newName,
    status: ProjectStatus.NotStarted,
    progress: 0,
    activityLog: [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userId,
      action: { en: 'Project Duplicated', ar: 'تم تكرار المشروع' }
    }]
  };
  
  return await createProject(duplicatedProject);
};

// ========================================
// Batch Operations
// ========================================

export const bulkUpdateProjects = async (
  updates: { id: string; data: Partial<Project> }[]
): Promise<void> => {
  const batch = writeBatch(db);
  
  updates.forEach(({ id, data }) => {
    const docRef = doc(db, 'projects', id);
    batch.update(docRef, {
      ...data,
      updatedAt: Timestamp.now().toDate().toISOString()
    });
  });
  
  await batch.commit();
};

export const bulkArchiveProjects = async (projectIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  const timestamp = Timestamp.now().toDate().toISOString();
  
  projectIds.forEach(id => {
    const docRef = doc(db, 'projects', id);
    batch.update(docRef, {
      archived: true,
      archivedAt: timestamp,
      updatedAt: timestamp
    });
  });
  
  await batch.commit();
};

export const bulkRestoreProjects = async (projectIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  const timestamp = Timestamp.now().toDate().toISOString();
  
  projectIds.forEach(id => {
    const docRef = doc(db, 'projects', id);
    batch.update(docRef, {
      archived: false,
      archivedAt: null,
      updatedAt: timestamp
    });
  });
  
  await batch.commit();
};

export const bulkDeleteProjects = async (projectIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  
  projectIds.forEach(id => {
    const docRef = doc(db, 'projects', id);
    batch.delete(docRef);
  });
  
  await batch.commit();
};

export const bulkUpdateStatus = async (
  projectIds: string[],
  status: ProjectStatus
): Promise<void> => {
  const batch = writeBatch(db);
  const timestamp = Timestamp.now().toDate().toISOString();
  
  projectIds.forEach(id => {
    const docRef = doc(db, 'projects', id);
    batch.update(docRef, {
      status,
      updatedAt: timestamp
    });
  });
  
  await batch.commit();
};

// ========================================
// Mock Survey Operations
// ========================================

export const startMockSurvey = async (
  projectId: string,
  userId: string
): Promise<MockSurvey> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const newSurvey: MockSurvey = {
    id: `survey-${Date.now()}`,
    conductedBy: userId,
    conductedDate: new Date().toISOString(),
    results: [],
    overallScore: 0,
    recommendations: []
  };
  
  await updateProject(projectId, {
    mockSurveys: [...project.mockSurveys, newSurvey]
  });
  
  return newSurvey;
};

export const updateMockSurvey = async (
  projectId: string,
  surveyId: string,
  updates: Partial<MockSurvey>
): Promise<void> => {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Project not found');
  
  const updatedSurveys = project.mockSurveys.map(survey =>
    survey.id === surveyId ? { ...survey, ...updates } : survey
  );
  
  await updateProject(projectId, { mockSurveys: updatedSurveys });
};

// ========================================
// Design Controls Operations
// ========================================

export const updateDesignControls = async (
  projectId: string,
  designControls: DesignControlItem[]
): Promise<void> => {
  await updateProject(projectId, { designControls });
};
