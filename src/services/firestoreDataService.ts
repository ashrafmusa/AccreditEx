/**
 * Firestore Data Export/Import Service
 * Handles exporting and importing data to/from JSON
 */

import {
  collection,
  getDocs,
  setDoc,
  doc,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const COLLECTIONS_TO_BACKUP = [
  'users',
  'projects',
  'documents',
  'standards',
  'accreditationPrograms',
  'departments',
  'trainingPrograms',
  'competencies',
  'risks',
  'appSettings',
];

/**
 * Export all Firestore data to JSON object
 */
export async function exportAllFirestoreData(): Promise<Record<string, any>> {
  const exportData: Record<string, any> = {};

  try {
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      exportData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    return exportData;
  } catch (error) {
    throw new Error(`Failed to export Firestore data: ${error}`);
  }
}

/**
 * Import data from JSON object to Firestore
 */
export async function importAllFirestoreData(
  data: Record<string, any>
): Promise<void> {
  try {
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      if (!data[collectionName]) continue;

      const batch = writeBatch(db);
      const documents = Array.isArray(data[collectionName])
        ? data[collectionName]
        : [];

      for (const docData of documents) {
        const { id, ...restData } = docData;
        const docRef = doc(db, collectionName, id);
        batch.set(docRef, restData, { merge: true });
      }

      await batch.commit();
    }
  } catch (error) {
    throw new Error(`Failed to import Firestore data: ${error}`);
  }
}
