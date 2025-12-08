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

import { useAppStore } from '@/stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
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
});
