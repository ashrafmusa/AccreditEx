import { doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { TracerSession, TracerTemplate } from "@/types";
import { getTenantQuery, getTenantStamp } from "@/utils/tenantQuery";

async function getRecords<T extends { id?: string }>(
  collectionName: "tracerTemplates" | "tracerSessions",
): Promise<T[]> {
  const snapshot = await getDocs(getTenantQuery(collectionName));
  return snapshot.docs.map(
    (record) => ({ ...record.data(), id: record.id }) as T,
  );
}

async function saveRecord<T extends { id: string }>(
  collectionName: "tracerTemplates" | "tracerSessions",
  record: T,
): Promise<void> {
  if (!record.id.trim() || record.id.includes("/")) {
    throw new Error("Tracer record must have a valid document ID");
  }

  await setDoc(
    doc(db, collectionName, record.id),
    { ...record, ...getTenantStamp() },
    { merge: true },
  );
}

export const getTracerTemplates = (): Promise<TracerTemplate[]> =>
  getRecords<TracerTemplate>("tracerTemplates");

export const saveTracerTemplate = (
  template: TracerTemplate,
): Promise<void> => saveRecord("tracerTemplates", template);

export const getTracerSessions = (): Promise<TracerSession[]> =>
  getRecords<TracerSession>("tracerSessions");

export const saveTracerSession = (
  session: TracerSession,
): Promise<void> => saveRecord("tracerSessions", session);

export function getTenantTracerTemplates(
  templates: TracerTemplate[],
): TracerTemplate[] {
  const tenantPrefix = getTenantStamp().organizationId || "legacy";
  return templates.map((template) => ({
    ...template,
    id: `${tenantPrefix}_${template.id}`,
  }));
}
