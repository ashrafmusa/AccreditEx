import '@testing-library/jest-dom';

// Mock import.meta.env for Vite
Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_KEY: 'test-key',
        VITE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_PROJECT_ID: 'test-project',
        VITE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_MESSAGING_SENDER_ID: 'test-id',
        VITE_APP_ID: 'test-app-id',
      },
    },
  },
  writable: true,
  configurable: true,
});

// Mock Firebase Auth
jest.mock('@firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('@firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
  DocumentReference: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Setup environment variables for tests
process.env.REACT_APP_FIREBASE_API_KEY = 'test-key';
process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
process.env.REACT_APP_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 'test-id';
process.env.REACT_APP_FIREBASE_APP_ID = 'test-app-id';
