import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that wraps components with providers if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'TeamMember',
  departmentId: 'dept-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test Description',
  programId: 'prog-1',
  departmentId: 'dept-1',
  status: 'In Progress',
  createdBy: 'test-user-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  targetCompletion: new Date('2025-12-31'),
  ...overrides,
});

export const createMockDocument = (overrides = {}) => ({
  id: 'doc-1',
  title: 'Test Document',
  type: 'Evidence',
  status: 'Draft',
  projectId: 'proj-1',
  uploadedBy: 'test-user-1',
  uploadedAt: new Date('2025-01-01'),
  content: 'Test content',
  ...overrides,
});

export const createMockNotification = (overrides = {}) => ({
  id: 'notif-1',
  userId: 'test-user-1',
  type: 'assignment',
  message: 'You have been assigned to a project',
  read: false,
  createdAt: new Date('2025-01-01'),
  ...overrides,
});

// Async test utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock Firebase functions
export const mockFirebaseAuth = () => {
  const { getAuth } = require('@firebase/auth');
  getAuth.mockReturnValue({
    currentUser: createMockUser(),
  });
};

export const mockFirebaseFirestore = () => {
  const { getFirestore, getDocs, getDoc, query } = require('@firebase/firestore');
  getFirestore.mockReturnValue({});
  getDocs.mockResolvedValue({ docs: [] });
  getDoc.mockResolvedValue({ data: () => null, exists: () => false });
};
