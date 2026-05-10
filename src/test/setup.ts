import '@testing-library/jest-dom';

// Mock import.meta BEFORE any modules are imported
// This must be done early to intercept module loading
const mockEnv = {
  DEV: true,
  PROD: false,
  MODE: 'test',
  VITE_API_KEY: 'test-key',
  VITE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_PROJECT_ID: 'test-project',
  VITE_STORAGE_BUCKET: 'test.appspot.com',
  VITE_MESSAGING_SENDER_ID: 'test-id',
  VITE_APP_ID: 'test-app-id',
  VITE_AI_AGENT_URL: 'http://localhost:8000',
  VITE_AI_AGENT_API_KEY: 'test-api-key',
  VITE_CLOUDINARY_CLOUD_NAME: 'demo',
  VITE_CLOUDINARY_UPLOAD_PRESET: 'ml_default',
  VITE_EMAILJS_SERVICE_ID: 'test-service',
  VITE_EMAILJS_ADMIN_TEMPLATE_ID: 'test-template',
  VITE_EMAILJS_REPLY_TEMPLATE_ID: 'test-template',
  VITE_STRICT_CAPA_CLOSURE_VALIDATION: 'false',
};

// Set in process.env so it's available during module resolution
Object.keys(mockEnv).forEach((key) => {
  if (!process.env[key]) {
    process.env[key] = (mockEnv as any)[key] || '';
  }
});

// Mock import.meta globally for jsdom window context
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: mockEnv,
    },
  },
  writable: true,
  configurable: true,
});

// Polyfill Blob.arrayBuffer for jsdom (needed by ExcelJS tests)
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock logger service to avoid import.meta.env issues
jest.mock('@/services/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock AI service to avoid import.meta.env issues
jest.mock('@/services/ai', () => ({
  aiService: {
    chat: jest.fn(),
    analyzeDocument: jest.fn(),
    generateTrainingPlan: jest.fn(),
    assessCompliance: jest.fn(),
  },
}));

// Mock Firebase config to avoid import.meta.env issues
jest.mock('@/firebase/firebaseConfig', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
}));

// Mock storage service
jest.mock('@/services/storageService', () => ({
  storageService: {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
  },
}));

// Mock Cloudinary service to avoid import.meta.env issues
jest.mock('@/services/cloudinaryService', () => ({
  cloudinaryService: {
    uploadFile: jest.fn(),
    uploadDocument: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
    generateThumbnailUrl: jest.fn(),
    getOptimizedUrl: jest.fn(),
  },
}));

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
