import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
  getCountFromServer,
  DocumentData,
} from 'firebase/firestore';
import { AppSettings } from '@/types';

/**
 * Firebase Setup Service
 * Provides admin utilities for managing Firebase Firestore configuration
 */

export interface FirebaseStatus {
  isConnected: boolean;
  lastChecked: Date;
  message: string;
}

export interface CollectionInfo {
  name: string;
  documentCount: number;
  exists: boolean;
  sample?: DocumentData;
}

export interface AppSettingsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lastUpdated?: Date;
}

export interface FirebaseHealthReport {
  connectionStatus: FirebaseStatus;
  appSettingsValid: AppSettingsValidation;
  collections: CollectionInfo[];
  backupTime?: Date;
  totalDocuments: number;
}

export interface CollectionSchema {
  collectionName: string;
  fields: Record<string, string>; // field name: data type
  documentCount: number;
  sampleDoc?: DocumentData;
}

export interface SearchResult {
  docId: string;
  data: DocumentData;
  matchedFields?: string[];
}

export interface CollectionBackup {
  collectionName: string;
  documentCount: number;
  data: DocumentData[];
  createdAt: Date;
  version: string;
}

// Required fields for AppSettings validation
const REQUIRED_APP_SETTINGS_FIELDS = [
  'appName',
  'primaryColor',
  'defaultLanguage',
  'defaultUserRole',
  'passwordPolicy',
  'globeSettings',
  'appearance',
  'notifications',
  'accessibility',
];

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(): Promise<FirebaseStatus> {
  const startTime = new Date();
  try {
    // Attempt to read a test document
    const testRef = doc(db, 'appSettings', 'default');
    const testSnapshot = await getDoc(testRef);
    
    return {
      isConnected: true,
      lastChecked: new Date(),
      message: 'Firebase connection successful',
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      isConnected: false,
      lastChecked: new Date(),
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get appSettings document with validation
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  try {
    const docRef = doc(db, 'appSettings', 'default');
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data() as AppSettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching appSettings:', error);
    throw error;
  }
}

/**
 * Validate appSettings document
 */
export async function validateAppSettings(): Promise<AppSettingsValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const appSettings = await getAppSettings();

    if (!appSettings) {
      errors.push('appSettings document does not exist');
      return { isValid: false, errors, warnings };
    }

    // Check for required fields
    REQUIRED_APP_SETTINGS_FIELDS.forEach((field) => {
      if (!(field in appSettings)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate specific fields
    if (!appSettings.appName || appSettings.appName.trim() === '') {
      errors.push('appName cannot be empty');
    }

    if (!appSettings.primaryColor || !appSettings.primaryColor.match(/^#[0-9A-F]{6}$/i)) {
      errors.push('primaryColor must be a valid hex color');
    }

    if (!['en', 'ar'].includes(appSettings.defaultLanguage)) {
      warnings.push('Unusual defaultLanguage value');
    }

    if (!appSettings.passwordPolicy) {
      errors.push('passwordPolicy object is required');
    } else {
      if (typeof appSettings.passwordPolicy.minLength !== 'number') {
        errors.push('passwordPolicy.minLength must be a number');
      }
    }

    if (!appSettings.globeSettings) {
      errors.push('globeSettings object is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lastUpdated: new Date(),
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Get collection information
 */
export async function getCollectionInfo(collectionName: string): Promise<CollectionInfo> {
  try {
    const collRef = collection(db, collectionName);
    const snapshot = await getDocs(collRef);

    const documentCount = snapshot.size;
    const sample = snapshot.docs.length > 0 ? snapshot.docs[0].data() : undefined;

    return {
      name: collectionName,
      documentCount,
      exists: true,
      sample,
    };
  } catch (error) {
    console.error(`Error fetching collection info for ${collectionName}:`, error);
    return {
      name: collectionName,
      documentCount: 0,
      exists: false,
    };
  }
}

/**
 * Get all collections info
 */
export async function getAllCollectionsInfo(): Promise<CollectionInfo[]> {
  const collectionsToCheck = [
    'appSettings',
    'users',
    'projects',
    'documents',
    'audits',
    'risks',
    'departments',
  ];

  const collections: CollectionInfo[] = [];

  for (const collectionName of collectionsToCheck) {
    const info = await getCollectionInfo(collectionName);
    collections.push(info);
  }

  return collections;
}

/**
 * Generate comprehensive health report
 */
export async function generateHealthReport(): Promise<FirebaseHealthReport> {
  try {
    const [connectionStatus, appSettingsValid, collections] = await Promise.all([
      testFirebaseConnection(),
      validateAppSettings(),
      getAllCollectionsInfo(),
    ]);

    const totalDocuments = collections.reduce((sum, col) => sum + col.documentCount, 0);

    return {
      connectionStatus,
      appSettingsValid,
      collections,
      totalDocuments,
      backupTime: new Date(),
    };
  } catch (error) {
    console.error('Error generating health report:', error);
    throw error;
  }
}

/**
 * Update appSettings with new configuration
 */
export async function updateAppSettingsConfig(settings: Partial<AppSettings>): Promise<void> {
  try {
    const docRef = doc(db, 'appSettings', 'default');
    await updateDoc(docRef, settings);
  } catch (error) {
    console.error('Error updating appSettings:', error);
    throw error;
  }
}

/**
 * Create appSettings document if it doesn't exist
 */
export async function initializeAppSettings(settings: AppSettings): Promise<void> {
  try {
    const docRef = doc(db, 'appSettings', 'default');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error('Error initializing appSettings:', error);
    throw error;
  }
}

/**
 * Export appSettings as JSON for backup
 */
export async function exportAppSettings(): Promise<string> {
  try {
    const appSettings = await getAppSettings();
    if (!appSettings) {
      throw new Error('appSettings document not found');
    }
    return JSON.stringify(appSettings, null, 2);
  } catch (error) {
    console.error('Error exporting appSettings:', error);
    throw error;
  }
}

/**
 * Import appSettings from JSON
 */
export async function importAppSettings(jsonString: string): Promise<void> {
  try {
    const settings = JSON.parse(jsonString) as AppSettings;
    await updateAppSettingsConfig(settings);
  } catch (error) {
    console.error('Error importing appSettings:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStatistics(): Promise<{
  totalCollections: number;
  totalDocuments: number;
  collectionBreakdown: Record<string, number>;
}> {
  try {
    const collections = await getAllCollectionsInfo();

    const collectionBreakdown: Record<string, number> = {};
    let totalDocuments = 0;

    collections.forEach((col) => {
      collectionBreakdown[col.name] = col.documentCount;
      totalDocuments += col.documentCount;
    });

    return {
      totalCollections: collections.length,
      totalDocuments,
      collectionBreakdown,
    };
  } catch (error) {
    console.error('Error fetching database statistics:', error);
    throw error;
  }
}

/**
 * Monitor Firebase in real-time (returns unsubscribe function)
 */
export function monitorAppSettings(
  callback: (settings: AppSettings | null, error?: Error) => void
) {
  try {
    const docRef = doc(db, 'appSettings', 'default');
    
    // This is a simplified monitoring - Firebase doesn't directly support real-time
    // Instead we'll set up periodic checks
    const interval = setInterval(async () => {
      try {
        const settings = await getAppSettings();
        callback(settings);
      } catch (error) {
        callback(null, error as Error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  } catch (error) {
    console.error('Error setting up monitoring:', error);
    throw error;
  }
}

/**
 * Create a new collection with initial document
 */
export async function createCollection(
  collectionName: string,
  initialData: DocumentData
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, 'default');
    await setDoc(docRef, {
      ...initialData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Error creating collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete entire collection (all documents)
 */
export async function deleteCollection(collectionName: string): Promise<void> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error deleting collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get collection schema from sample documents
 */
export async function getCollectionSchema(
  collectionName: string
): Promise<CollectionSchema> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, limit(10)); // Sample 10 docs
    const snapshot = await getDocs(q);

    const fields: Record<string, string> = {};
    let sampleDoc: DocumentData | undefined;

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      if (index === 0) sampleDoc = data;

      Object.entries(data).forEach(([key, value]) => {
        if (!fields[key]) {
          fields[key] = typeof value;
        }
      });
    });

    const countSnapshot = await getCountFromServer(collectionRef);

    return {
      collectionName,
      fields,
      documentCount: countSnapshot.data().count,
      sampleDoc,
    };
  } catch (error) {
    console.error(`Error getting schema for ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Search collection documents
 */
export async function searchCollectionDocuments(
  collectionName: string,
  searchTerm: string,
  searchFields?: string[]
): Promise<SearchResult[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    const results: SearchResult[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const fieldsToSearch = searchFields || Object.keys(data);
      let matched = false;
      const matchedFields: string[] = [];

      fieldsToSearch.forEach((field) => {
        const value = data[field];
        const stringValue = String(value).toLowerCase();
        if (stringValue.includes(searchTerm.toLowerCase())) {
          matched = true;
          matchedFields.push(field);
        }
      });

      if (matched) {
        results.push({
          docId: doc.id,
          data,
          matchedFields,
        });
      }
    });

    return results;
  } catch (error) {
    console.error(`Error searching collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Export collection data as JSON
 */
export async function exportCollection(
  collectionName: string
): Promise<CollectionBackup> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    const data: DocumentData[] = [];
    snapshot.docs.forEach((doc) => {
      data.push({
        _id: doc.id,
        ...doc.data(),
      });
    });

    return {
      collectionName,
      documentCount: data.length,
      data,
      createdAt: new Date(),
      version: '1.0',
    };
  } catch (error) {
    console.error(`Error exporting collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Import collection data from backup
 */
export async function importCollection(backup: CollectionBackup): Promise<void> {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, backup.collectionName);

    backup.data.forEach((item) => {
      const { _id, ...data } = item;
      const docRef = doc(collectionRef, _id);
      batch.set(docRef, {
        ...data,
        importedAt: new Date(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error importing collection:`, error);
    throw error;
  }
}

/**
 * Delete specific document from collection
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(
      `Error deleting document ${documentId} from ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Get document preview
 */
export async function getDocumentPreview(
  collectionName: string,
  documentId: string,
  fieldLimit: number = 5
): Promise<DocumentData> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error('Document not found');
    }

    const data = snapshot.data();
    const limitedData: DocumentData = { _id: documentId };

    Object.entries(data).forEach(([key, value], index) => {
      if (index < fieldLimit) {
        limitedData[key] = value;
      }
    });

    if (Object.keys(data).length > fieldLimit) {
      limitedData._more = `+${Object.keys(data).length - fieldLimit} more fields`;
    }

    return limitedData;
  } catch (error) {
    console.error(
      `Error getting preview for ${documentId} from ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Get collection statistics with document sizes
 */
export async function getCollectionStatistics(
  collectionName: string
): Promise<{
  documentCount: number;
  averageDocumentSize: number;
  largestDocument?: { id: string; size: number };
  fieldCount: number;
}> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    let totalSize = 0;
    let largestDoc = { id: '', size: 0 };
    const allFields = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const docSize = JSON.stringify(data).length;

      totalSize += docSize;
      if (docSize > largestDoc.size) {
        largestDoc = { id: doc.id, size: docSize };
      }

      Object.keys(data).forEach((field) => allFields.add(field));
    });

    return {
      documentCount: snapshot.size,
      averageDocumentSize:
        snapshot.size > 0 ? Math.round(totalSize / snapshot.size) : 0,
      largestDocument: largestDoc.id ? largestDoc : undefined,
      fieldCount: allFields.size,
    };
  } catch (error) {
    console.error(`Error getting statistics for ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update specific fields in a document
 */
export async function updateDocument(
  collectionName: string,
  documentId: string,
  updates: DocumentData,
  options?: { merge?: boolean }
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    
    if (options?.merge === false) {
      await setDoc(docRef, updates);
    } else {
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error(
      `Error updating document ${documentId} in ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Create a new document
 */
export async function createDocument(
  collectionName: string,
  documentId: string,
  data: DocumentData
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      throw new Error(`Document ${documentId} already exists`);
    }
    
    await setDoc(docRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(
      `Error creating document ${documentId} in ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Get complete document with all fields
 */
export async function getFullDocument(
  collectionName: string,
  documentId: string
): Promise<DocumentData> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error('Document not found');
    }
    
    return {
      _id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error(
      `Error getting document ${documentId} from ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Validate document structure against required fields
 */
export function validateDocumentStructure(
  data: DocumentData,
  requiredFields?: string[]
): Array<{ field: string; error: string }> {
  const errors: Array<{ field: string; error: string }> = [];

  if (requiredFields) {
    requiredFields.forEach((field) => {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push({ field, error: 'Required field missing' });
      }
    });
  }

  // Validate document ID format in data if present
  if (data._id && typeof data._id !== 'string') {
    errors.push({ field: '_id', error: 'ID must be a string' });
  }

  return errors;
}
