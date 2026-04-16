import { getTenantQuery, getTenantStamp } from "@/utils/tenantQuery";
import { collection, doc, getDocs, limit, setDoc } from "firebase/firestore";

import { db } from "@/firebase/firebaseConfig";
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
const DEFAULT_DOC_ID = "default";

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

export async function getLabOpsData(): Promise<LabOpsPersistedData | null> {
    try {
        const snapshot = await getDocs(getTenantQuery(LAB_OPS_COLLECTION, limit(1)));
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as LabOpsPersistedData;
    } catch (error) {
        console.error("Error loading Lab Ops data:", error);
        return null;
    }
}

export async function saveLabOpsData(data: LabOpsPersistedData): Promise<void> {
    try {
        const existingSnapshot = await getDocs(
            getTenantQuery(LAB_OPS_COLLECTION, limit(1)),
        );

        if (!existingSnapshot.empty) {
            const existingId = existingSnapshot.docs[0].id;
            await setDoc(
                doc(db, LAB_OPS_COLLECTION, existingId),
                {
                    ...data,
                    ...getTenantStamp(),
                    updatedAt: new Date().toISOString(),
                },
                { merge: true },
            );
            return;
        }

        await setDoc(doc(collection(db, LAB_OPS_COLLECTION), DEFAULT_DOC_ID), {
            ...data,
            ...getTenantStamp(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error saving Lab Ops data:", error);
        throw error;
    }
}

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

export async function saveLabOpsDataWithRetry(
    data: LabOpsPersistedData,
    maxRetries = 3,
    baseDelayMs = 500,
): Promise<void> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
        try {
            await saveLabOpsData(data);
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
