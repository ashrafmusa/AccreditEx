import { db } from "@/firebase/firebaseConfig";
import {
  deleteDoc,
  doc,
  getDocs,
  QueryConstraint,
  setDoc,
} from "firebase/firestore";
import { getTenantQuery, getTenantStamp } from "@/utils/tenantQuery";

export type TrainingHubCollection =
  | "capAssessments"
  | "ceCredits"
  | "learningPaths"
  | "userLearningPathProgress"
  | "smcsCompetencies";

export async function getTrainingHubRecords<T extends { id?: string }>(
  collectionName: TrainingHubCollection,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const snapshot = await getDocs(getTenantQuery(collectionName, ...constraints));
  return snapshot.docs.map(
    (record) => ({ ...record.data(), id: record.id }) as T,
  );
}

export async function saveTrainingHubRecord<T extends { id: string }>(
  collectionName: TrainingHubCollection,
  record: T,
): Promise<void> {
  if (!record.id.trim() || record.id.includes("/")) {
    throw new Error("Training record must have a valid document ID");
  }

  await setDoc(
    doc(db, collectionName, record.id),
    { ...record, ...getTenantStamp() },
    { merge: true },
  );
}

export async function deleteTrainingHubRecord(
  collectionName: TrainingHubCollection,
  recordId: string,
): Promise<void> {
  if (!recordId.trim() || recordId.includes("/")) {
    throw new Error("Training record must have a valid document ID");
  }

  await deleteDoc(doc(db, collectionName, recordId));
}
