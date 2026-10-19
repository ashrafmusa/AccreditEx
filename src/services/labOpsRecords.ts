import {
    collection, doc, documentId, getDoc, getDocs, limit, orderBy, query,
    runTransaction, startAfter, type Firestore, type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { LabOpsPersistedData } from "./labOpsService";

export const LAB_LOG_KINDS = ["iqcResults", "reagentUsageLogs", "calibrations", "maintenanceLogs"] as const;
export type LabLogKind = typeof LAB_LOG_KINDS[number];
export type LabLog<K extends LabLogKind> = LabOpsPersistedData[K][number];
export type LabRecordState = Omit<LabOpsPersistedData, LabLogKind> & {
    organizationId: string;
    revision: number;
    ready: boolean;
};
export type LabLogCursor = QueryDocumentSnapshot;
export interface LabLogPage<K extends LabLogKind> {
    records: LabLog<K>[];
    cursor: LabLogCursor | null;
    hasMore: boolean;
}
export function labLogDate(kind: LabLogKind, record: LabLog<LabLogKind>): string {
    const fields = { iqcResults: "measuredAt", reagentUsageLogs: "usageDate", calibrations: "calibrationDate", maintenanceLogs: "scheduledDate" } as const;
    const value = (record as unknown as Record<string, unknown>)[fields[kind]];
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("Invalid operational log date");
    return new Date(value).toISOString();
}

function validId(id: string): string {
    if (!id || id.includes("/") || id === "." || id === "..") throw new Error("Invalid Lab Operations identifier");
    return id;
}

// Firestore does not accept optional undefined fields. Canonicalization also makes retries order independent.
export function canonical(value: unknown): string {
    return JSON.stringify(value, (_key, item: unknown) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
            return Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)));
        }
        return item;
    });
}

export function labMetadata(data: LabOpsPersistedData): Omit<LabRecordState, "organizationId" | "revision" | "ready"> {
    const { iqcResults: _iqc, reagentUsageLogs: _usage, calibrations: _cal, maintenanceLogs: _maint, ...metadata } = data;
    return JSON.parse(canonical(metadata));
}

export function createLabRecordService(db: Firestore) {
    const root = (org: string) => doc(db, "labOpsRecords", validId(org));
    const requireReady = (state: LabRecordState | undefined, org: string): LabRecordState => {
        if (!state?.ready || state.organizationId !== org) throw new Error("Lab record migration is not ready for this organization");
        return state;
    };
    return {
        async state(org: string): Promise<LabRecordState> {
            return requireReady((await getDoc(root(org))).data() as LabRecordState | undefined, org);
        },
        async page<K extends LabLogKind>(org: string, kind: K, cursor: LabLogCursor | null = null, pageSize = 50): Promise<LabLogPage<K>> {
            if (!LAB_LOG_KINDS.includes(kind) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error("Invalid log page");
            if (cursor && cursor.ref.parent.path !== `labOpsRecords/${validId(org)}/${kind}`) throw new Error("Log cursor tenant mismatch");
            const constraints = [orderBy("sortAt", "desc"), orderBy(documentId(), "desc"), ...(cursor ? [startAfter(cursor)] : []), limit(pageSize + 1)];
            const snapshot = await getDocs(query(collection(root(org), kind), ...constraints));
            const docs = snapshot.docs.slice(0, pageSize);
            return {
                records: docs.map((record) => record.data().record as LabLog<K>),
                cursor: docs.at(-1) ?? null,
                hasMore: snapshot.size > pageSize,
            };
        },
        async save(org: string, data: LabOpsPersistedData, revision: number): Promise<number> {
            return runTransaction(db, async (tx) => {
                const ref = root(org);
                const state = requireReady((await tx.get(ref)).data() as LabRecordState | undefined, org);
                if (state.revision !== revision) throw new Error("Lab records changed; reload before saving");
                tx.update(ref, { ...labMetadata(data), revision: revision + 1 });
                return revision + 1;
            });
        },
        async write<K extends LabLogKind>(
            org: string, kind: K, record: LabLog<K>, revision: number, previous?: LabLog<K>,
        ): Promise<LabRecordState> {
            if (!LAB_LOG_KINDS.includes(kind)) throw new Error("Invalid log kind");
            const clean = JSON.parse(canonical(record)) as LabLog<K>;
            // Some rules-enforced revision races report permission-denied before the SDK's aborted retry.
            // Retry only when an authorized reread proves the root changed; real permission failures stay failures.
            let readRevision = -1;
            const attempt = () => runTransaction(db, async (tx) => {
                const ref = root(org);
                const logRef = doc(collection(ref, kind), validId(record.id));
                const [rootSnapshot, logSnapshot] = await Promise.all([tx.get(ref), tx.get(logRef)]);
                const state = requireReady(rootSnapshot.data() as LabRecordState | undefined, org);
                readRevision = state.revision;
                if (logSnapshot.exists()) {
                    if (canonical(logSnapshot.data().record) === canonical(clean)) return state;
                    if (!previous || !["iqcResults", "maintenanceLogs"].includes(kind)
                        || canonical(logSnapshot.data().record) !== canonical(previous)) {
                        throw new Error("Conflicting Lab record ID; reload before retrying");
                    }
                } else if (previous) throw new Error("Lab record no longer exists");
                // Usage/calibration consume current server state; IQC must use the same history/master revision it evaluated.
                if (kind !== "reagentUsageLogs" && kind !== "calibrations" && state.revision !== revision) {
                    throw new Error("Lab records changed; reload before logging");
                }
                const next = { ...state, revision: state.revision + 1 };
                if (kind === "reagentUsageLogs") {
                    const usage = clean as LabLog<"reagentUsageLogs">;
                    const reagent = state.reagents.find((r) => r.id === usage.reagentId);
                    if (!reagent || !usage.usedBy.trim() || !Number.isFinite(usage.quantityUsed)
                        || usage.quantityUsed <= 0 || usage.quantityUsed > reagent.quantity
                        || usage.unit !== reagent.unit || ["expired", "quarantine", "depleted"].includes(reagent.status)
                        || reagent.qualityFlag === "blocked") throw new Error("Invalid reagent usage");
                    const quantity = reagent.quantity - usage.quantityUsed;
                    next.reagents = state.reagents.map((r) => r.id !== reagent.id ? r : {
                        ...r, quantity, status: quantity === 0 ? "depleted" : quantity <= r.reorderLevel ? "low_stock" : "in_stock",
                        updatedAt: new Date().toISOString(),
                    });
                }
                if (kind === "calibrations") {
                    const cal = clean as LabLog<"calibrations">;
                    const equipment = state.equipment.find((e) => e.id === cal.equipmentId);
                    if (!equipment || !cal.calibratedBy.trim() || !cal.calibrationDate
                        || !["pass", "fail", "adjusted"].includes(cal.result)) throw new Error("Invalid calibration");
                    if (equipment.lastCalibrationDate && cal.calibrationDate < equipment.lastCalibrationDate) {
                        throw new Error("Backdated calibration requires review; equipment state was not changed");
                    }
                    next.equipment = state.equipment.map((e) => e.id !== equipment.id ? e : {
                        ...e, lastCalibrationDate: cal.calibrationDate,
                        nextCalibrationDue: cal.result === "fail" ? e.nextCalibrationDue : cal.nextDueDate,
                        status: e.status === "decommissioned" ? e.status : cal.result === "fail" ? "calibration_due"
                            : e.status === "calibration_due" ? "active" : e.status,
                        updatedAt: new Date().toISOString(),
                    });
                }
                tx.set(logRef, { organizationId: org, record: clean, sortAt: logSnapshot.data()?.sortAt ?? labLogDate(kind, clean) });
                tx.set(ref, { ...JSON.parse(canonical(next)), lastOperation: { kind, id: record.id } });
                return next;
            });
            for (let retry = 0; ; retry++) {
                try { return await attempt(); }
                catch (error) {
                    if (retry >= 3 || (error as { code?: string }).code !== "permission-denied" || readRevision < 0) throw error;
                    const current = requireReady((await getDoc(root(org))).data() as LabRecordState | undefined, org);
                    if (current.revision === readRevision) throw error;
                }
            }
        },
        async writeMany<K extends LabLogKind>(
            org: string,
            kind: K,
            records: LabLog<K>[],
            revision: number,
        ): Promise<LabRecordState> {
            if (!LAB_LOG_KINDS.includes(kind) || records.length === 0 || records.length > 400) {
                throw new Error("Invalid Lab Operations bulk write");
            }
            const cleaned = records.map((record) => {
                const clean = JSON.parse(canonical(record)) as LabLog<K>;
                validId(clean.id);
                return { record: clean, sortAt: labLogDate(kind, clean) };
            });
            const ids = new Set(cleaned.map(({ record }) => record.id));
            if (ids.size !== cleaned.length) throw new Error("Duplicate Lab Operations record IDs");
            return runTransaction(db, async (tx) => {
                const rootRef = root(org);
                const rootSnapshot = await tx.get(rootRef);
                const state = requireReady(rootSnapshot.data() as LabRecordState | undefined, org);
                if (state.revision !== revision) {
                    throw new Error("Lab records changed; reload before importing");
                }
                const recordRefs = cleaned.map(({ record }) =>
                    doc(collection(rootRef, kind), validId(record.id)),
                );
                const snapshots = await Promise.all(recordRefs.map((ref) => tx.get(ref)));
                if (snapshots.some((snapshot) => snapshot.exists())) {
                    throw new Error("One or more imported Lab record IDs already exist");
                }
                recordRefs.forEach((ref, index) => {
                    tx.set(ref, {
                        organizationId: org,
                        ...cleaned[index],
                    });
                });
                const nextState = { ...state, revision: state.revision + 1 };
                tx.update(rootRef, {
                    revision: nextState.revision,
                    lastOperation: {
                        kind,
                        id: "bulk-import",
                        ids: records.map((record) => record.id),
                        count: records.length,
                    },
                });
                return nextState;
            });
        },
        async writeIQCResultWithMetadata(
            org: string,
            result: LabLog<"iqcResults">,
            data: LabOpsPersistedData,
            revision: number,
            previous?: LabLog<"iqcResults">,
        ): Promise<number> {
            const clean = JSON.parse(canonical(result)) as LabLog<"iqcResults">;
            const cleanData = JSON.parse(canonical(labMetadata(data))) as Omit<
                LabRecordState, "organizationId" | "revision" | "ready"
            >;
            return runTransaction(db, async (tx) => {
                const rootRef = root(org);
                const logRef = doc(collection(rootRef, "iqcResults"), validId(clean.id));
                const [rootSnapshot, logSnapshot] = await Promise.all([
                    tx.get(rootRef),
                    tx.get(logRef),
                ]);
                const state = requireReady(rootSnapshot.data() as LabRecordState | undefined, org);
                const storedResult = logSnapshot.data()?.record as LabLog<"iqcResults"> | undefined;

                if (storedResult && canonical(storedResult) === canonical(clean)) {
                    return state.revision;
                }
                if (state.revision !== revision) {
                    throw new Error("Lab records changed; reload before logging");
                }
                if (previous) {
                    if (!storedResult || canonical(storedResult) !== canonical(previous)) {
                        throw new Error("IQC result changed; reload before creating its quality event");
                    }
                } else if (storedResult) {
                    throw new Error("Conflicting Lab record ID; reload before retrying");
                }

                const nextRevision = state.revision + 1;
                tx.set(logRef, {
                    organizationId: org,
                    record: clean,
                    sortAt: logSnapshot.data()?.sortAt ?? labLogDate("iqcResults", clean),
                });
                tx.update(rootRef, {
                    ...cleanData,
                    revision: nextRevision,
                    lastOperation: { kind: "iqcResults", id: clean.id },
                });
                return nextRevision;
            });
        },
    };
}
