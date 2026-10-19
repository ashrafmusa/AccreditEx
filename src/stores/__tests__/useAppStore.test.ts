// Mock Firebase before importing store
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  db: {},
  auth: {},
}));

jest.mock('@/services/appSettingsService', () => ({
  getAppSettings: jest.fn(() => Promise.resolve({})),
  updateAppSettings: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@/services/projectService', () => ({
  getProjects: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/competencyService', () => ({
  getCompetencies: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/departmentService', () => ({
  getDepartments: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/documentService', () => ({
  addDocument: jest.fn(async data => ({ ...data, id: 'persisted-document' })),
  addDocumentWithProjectEvidence: jest.fn(async data => ({ ...data, id: 'persisted-evidence' })),
}));

jest.mock('@/services/trainingQuizService', () => ({
  submitTrainingQuiz: jest.fn(),
}));

import { useAppStore } from '@/stores/useAppStore';
import { useUserStore } from '@/stores/useUserStore';
import { addDocument, addDocumentWithProjectEvidence } from '@/services/documentService';
import { submitTrainingQuiz } from '@/services/trainingQuizService';
import type { CertificateData, DocumentTextExtraction, TrainingProgram, User } from '@/types';

describe('useAppStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({
      standards: [],
      competencies: [],
      departments: [],
    });
  });

  it('should initialize with empty state', () => {
    const state = useAppStore.getState();
    expect(state.standards).toEqual([]);
    expect(state.competencies).toEqual([]);
    expect(state.departments).toEqual([]);
  });

  it('persists attachment extraction separately while keeping the document a draft', async () => {
    // Arrange
    const extractedText: DocumentTextExtraction = {
      sourceFileName: 'review.txt', text: 'Review checklist.', status: 'extracted',
      extractedAt: '', pagesProcessed: 0, totalPages: null, limitations: [],
    };
    // Act
    const result = await useAppStore.getState().addControlledDocument({
      name: { en: 'Review', ar: '' }, type: 'Evidence', extractedText,
      content: { en: 'Editable draft.', ar: '' },
    });
    // Assert
    expect(addDocument).toHaveBeenCalledWith(expect.objectContaining({
      extractedText, content: { en: 'Editable draft.', ar: '' }, status: 'Draft',
    }));
    expect(result.extractedText).toEqual(extractedText);
  });

  it('commits project evidence and its checklist link through one persistence operation', async () => {
    const projectId = 'project-1';
    const checklistItemId = 'item-1';

    const result = await useAppStore.getState().addControlledDocument({
      name: { en: 'Evidence', ar: 'Evidence' },
      type: 'Evidence',
      fileUrl: 'https://example.test/evidence.pdf',
      projectId,
      checklistEvidence: { projectId, checklistItemId },
    });

    expect(addDocumentWithProjectEvidence).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Evidence', fileUrl: 'https://example.test/evidence.pdf' }),
      projectId,
      checklistItemId,
    );
    expect(addDocument).not.toHaveBeenCalled();
    expect(result.id).toBe('persisted-evidence');
  });

  it('should update standards', () => {
    const standards = [
      { id: '1', standardId: '1', programId: 'p1', section: 'S1', description: 'JCI', },
      { id: '2', standardId: '2', programId: 'p1', section: 'S2', description: 'DNV' },
    ];

    useAppStore.setState({ standards });
    const state = useAppStore.getState();
    expect(state.standards).toEqual(standards);
  });

  it('should handle multiple data types update', () => {
    const updates = {
      standards: [{ id: '1', standardId: '1', programId: 'p1', section: 'S1', description: 'JCI' }],
      competencies: [{ id: 'c1', name: { en: 'Leadership', ar: 'القيادة' }, description: { en: 'desc', ar: 'وصف' } }],
      departments: [{ id: 'd1', name: { en: 'Operations', ar: 'العمليات' } }],
    };

    useAppStore.setState(updates);
    const state = useAppStore.getState();
    expect(state.standards).toBe(updates.standards);
    expect(state.competencies).toBe(updates.competencies);
    expect(state.departments).toBe(updates.departments);
  });

  it("persists quiz completion through the verified server endpoint", async () => {
    const user = {
      id: "user-a",
      name: "Test User",
      email: "test@example.com",
      role: "TeamMember",
    } as User;
    const program = {
      id: "training-a",
      title: { en: "Safety" },
      passingScore: 80,
      quiz: [{ id: "q1", question: { en: "Question" }, options: [{ en: "A" }], correctOptionIndex: 0 }],
    } as TrainingProgram;
    const certificate: CertificateData = {
      id: "cert-user-a-training-a",
      userId: user.id,
      trainingId: program.id,
      completionDate: "2026-10-18T00:00:00.000Z",
      score: 100,
    };
    useUserStore.setState({ currentUser: user });
    useAppStore.setState({
      trainingPrograms: [program],
      certificates: [],
      userTrainingStatuses: {},
    });
    jest.mocked(submitTrainingQuiz).mockResolvedValue({
      score: 100,
      passed: true,
      certificateId: certificate.id,
      certificate,
    });

    const result = await useAppStore.getState().submitQuiz(program.id, { q1: 0 });

    expect(submitTrainingQuiz).toHaveBeenCalledWith(program.id, { q1: 0 });
    expect(result).toEqual({ score: 100, passed: true, certificateId: certificate.id });
    expect(useAppStore.getState().certificates).toEqual([certificate]);
    expect(useAppStore.getState().userTrainingStatuses[user.id]?.[program.id]).toMatchObject({
      status: "Completed",
      score: 100,
      certificateId: certificate.id,
    });
  });

  it("rejects empty quizzes before contacting the certificate issuer", async () => {
    const user = {
      id: "user-a",
      name: "Test User",
      email: "test@example.com",
      role: "TeamMember",
    } as User;
    useUserStore.setState({ currentUser: user });
    useAppStore.setState({
      trainingPrograms: [{
        id: "empty-training",
        title: { en: "Empty", ar: "فارغ" },
        description: { en: "", ar: "" },
        content: { en: "", ar: "" },
        passingScore: 80,
        quiz: [],
      }],
    });

    await expect(useAppStore.getState().submitQuiz("empty-training", {}))
      .rejects.toThrow("at least one question");
    expect(submitTrainingQuiz).not.toHaveBeenCalled();
  });
});
