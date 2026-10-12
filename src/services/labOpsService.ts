import { useTenantStore } from "@/stores/useTenantStore";
import { collection, doc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";

import { db } from "@/firebase/firebaseConfig";
import { createLabRecordService } from "./labOpsRecords";
export const labRecordService = createLabRecordService(db);
export const labRecordStorageEnabled = (): boolean =>
    process.env.NODE_ENV !== "production" && process.env.VITE_LAB_RECORD_STORAGE === "true";
import type {
    CalibrationRecord,
    CAPARecord,
    CompetencyRecord,
    Equipment,
    IQCAnalyte,
    IQCResult,
    MaintenanceLog,
    ProficiencyTest,
    QualityEvent,
    QualityRiskRecord,
    Reagent,
    ReagentUsageLog,
} from "@/types/labOps";

const LAB_OPS_COLLECTION = "labOpsData";
const MAX_PAYLOAD_BYTES = 900_000;

function omitUndefinedFields(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.filter((item) => item !== undefined).map(omitUndefinedFields);
    }
    if (value && typeof value === "object" &&
        (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
        return Object.fromEntries(
            Object.entries(value).filter(([, field]) => field !== undefined)
                .map(([key, field]) => [key, omitUndefinedFields(field)]),
        );
    }
    return value;
}

function requireOrganization(organizationId: string): string {
    if (!organizationId || organizationId.includes("/")) {
        throw new Error("Lab Operations requires an active organization");
    }
    return organizationId;
}

export interface LabOpsPersistedData {
    equipment: Equipment[];
    calibrations: CalibrationRecord[];
    maintenanceLogs: MaintenanceLog[];
    reagents: Reagent[];
    reagentUsageLogs: ReagentUsageLog[];
    proficiencyTests: ProficiencyTest[];
    qualityEvents: QualityEvent[];
    capaRecords: CAPARecord[];
    qualityRisks: QualityRiskRecord[];
    competencyRecords: CompetencyRecord[];
    iqcAnalytes: IQCAnalyte[];
    iqcResults: IQCResult[];
}

export async function getLabOpsData(
    organizationId = useTenantStore.getState().organizationId,
): Promise<LabOpsPersistedData | null> {
    try {
        const orgId = requireOrganization(organizationId);
        const snapshot = await getDocs(query(
            collection(db, LAB_OPS_COLLECTION),
            where("organizationId", "==", orgId),
        ));
        if (snapshot.empty) return null;
        const canonical = snapshot.docs.find((record) => record.id === orgId);
        if (canonical) return canonical.data() as LabOpsPersistedData;
        if (snapshot.docs.length !== 1) {
            throw new Error("Multiple legacy Lab Operations records exist; reconcile them before loading");
        }
        return snapshot.docs[0].data() as LabOpsPersistedData;
    } catch (error) {
        console.error("Error loading Lab Ops data:", error);
        throw error;
    }
}

export async function saveLabOpsData(
    data: LabOpsPersistedData,
    organizationId = useTenantStore.getState().organizationId,
): Promise<void> {
    try {
        const orgId = requireOrganization(organizationId);
        // Leave headroom for Firestore field names, timestamps and document metadata.
        if (new TextEncoder().encode(JSON.stringify(data)).byteLength > MAX_PAYLOAD_BYTES) {
            throw new Error("Lab Operations storage is nearing its document limit; archive logs before saving");
        }
        const ref = doc(db, LAB_OPS_COLLECTION, orgId);
        await setDoc(ref, {
            ...omitUndefinedFields(data) as LabOpsPersistedData,
            organizationId: orgId,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
    } catch (error) {
        console.error("Error saving Lab Ops data:", error);
        throw error;
    }
}

export async function resetLabOpsData(
    organizationId = useTenantStore.getState().organizationId,
): Promise<void> {
    try {
        const orgId = requireOrganization(organizationId);
        const snapshot = await getDocs(query(
            collection(db, LAB_OPS_COLLECTION),
            where("organizationId", "==", orgId),
        ));
        const legacyDocs = snapshot.docs.filter((record) => record.id !== orgId);
        if (legacyDocs.length >= 500) {
            throw new Error("Too many legacy Lab Operations documents to reset safely; contact support");
        }

        const ref = doc(db, LAB_OPS_COLLECTION, orgId);
        const batch = writeBatch(db);
        legacyDocs.forEach((record) => batch.delete(record.ref));
        batch.set(ref, {
            equipment: [],
            calibrations: [],
            maintenanceLogs: [],
            reagents: [],
            reagentUsageLogs: [],
            proficiencyTests: [],
            qualityEvents: [],
            capaRecords: [],
            qualityRisks: [],
            competencyRecords: [],
            iqcAnalytes: [],
            iqcResults: [],
            organizationId: orgId,
            updatedAt: new Date().toISOString(),
        });
        await batch.commit();
    } catch (error) {
        console.error("Error resetting Lab Ops data:", error);
        throw error;
    }
}

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

export async function saveLabOpsDataWithRetry(
    data: LabOpsPersistedData,
    maxRetries = 3,
    baseDelayMs = 500,
    organizationId = useTenantStore.getState().organizationId,
): Promise<void> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
        try {
            await saveLabOpsData(data, organizationId);
            return;
        } catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                break;
            }
            const backoff = baseDelayMs * 2 ** attempt;
            await delay(backoff);
            attempt += 1;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("Failed to save Lab Ops data after retries");
}
