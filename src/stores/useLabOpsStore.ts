/**
 * Lab Operations Zustand Store
 * Manages equipment, maintenance, reagents, calibrations, proficiency testing
 */
import type { LabOpsPersistedData } from "@/services/labOpsService";
import {
    getLabOpsData,
    resetLabOpsData,
    saveLabOpsDataWithRetry,
    labRecordService, labRecordStorageEnabled,
} from "@/services/labOpsService";
import { LAB_LOG_KINDS, type LabLogKind, type LabLog, type LabLogCursor, type LabLogPage } from "@/services/labOpsRecords";
import type {
    CalibrationRecord,
    CAPARecord,
    CompetencyRecord,
    Equipment,
    IQCAnalyte, IQCResult,
    MaintenanceLog,
    ProficiencyTest,
    QualityEvent,
    QualityRiskRecord,
    Reagent,
    ReagentUsageLog,
} from "@/types/labOps";
import {
    SEED_CALIBRATION_RECORDS,
    SEED_CAPA_RECORDS,
    SEED_COMPETENCY_RECORDS,
    SEED_EQUIPMENT,
    SEED_IQC_ANALYTES,
    SEED_IQC_RESULTS,
    SEED_MAINTENANCE_LOGS,
    SEED_PROFICIENCY_TESTS,
    SEED_QUALITY_EVENTS,
    SEED_QUALITY_RISKS,
    SEED_REAGENTS,
} from "@/types/labOps";
import { create } from "zustand";
import { useTenantStore } from "@/stores/useTenantStore";
import { checkCompetencyAuthorization } from "@/types/labOps";

type LabOpsSyncStatus = "idle" | "saving" | "synced" | "error";

const SAVE_DEBOUNCE_MS = 700;

let queuedPayload: LabOpsPersistedData | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let isSaving = false;
let queuedOrganizationId = "";
let queuedRecordMode = false;
let queuedRevision = 0;
let loadGeneration = 0;
let activeSave: Promise<void> | null = null;

export interface LabOpsState {
    // Data
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
    loading: boolean;
    hasLoadedFromFirestore: boolean;
    loadedOrganizationId: string | null;
    syncStatus: LabOpsSyncStatus;
    syncError: string | null;
    lastSyncedAt: string | null;
    recordMode: boolean;
    recordRevision: number;
    usageCursor: LabLogCursor | null;
    usageHasMore: boolean;
    loadingUsage: boolean;
    loadMoreUsage: () => Promise<void>;

    // Equipment CRUD
    addEquipment: (eq: Equipment) => void;
    updateEquipment: (eq: Equipment) => Promise<void>;
    decommissionEquipment: (id: string) => void;
    restoreEquipment: (id: string) => void;

    // Calibrations
    addCalibration: (cal: CalibrationRecord) => void | Promise<void>;

    // Maintenance
    addMaintenanceLog: (log: MaintenanceLog) => void | Promise<void>;
    updateMaintenanceLog: (log: MaintenanceLog) => void | Promise<void>;

    // Reagents
    addReagent: (r: Reagent) => void;
    updateReagent: (r: Reagent) => void;
    removeReagent: (id: string) => void;
    addReagentUsage: (usage: ReagentUsageLog) => void | Promise<void>;

    // Proficiency
    addProficiencyTest: (pt: ProficiencyTest) => void;
    updateProficiencyTest: (pt: ProficiencyTest) => void;

    // Quality events + CAPA
    addQualityEvent: (event: QualityEvent) => void;
    updateQualityEvent: (event: QualityEvent) => void;
    addCAPARecord: (capa: CAPARecord) => void;
    updateCAPARecord: (capa: CAPARecord) => void;
    addQualityRisk: (risk: QualityRiskRecord) => void;
    updateQualityRisk: (risk: QualityRiskRecord) => void;

    // Computed helpers
    // IQC / Westgard
    iqcAnalytes: IQCAnalyte[];
    iqcResults: IQCResult[];
    addIQCAnalyte: (analyte: IQCAnalyte) => void;
    updateIQCAnalyte: (analyte: IQCAnalyte) => void;
    logIQCResultWithSideEffects: (
        result: IQCResult,
        qualityEvent?: QualityEvent,
        previousResult?: IQCResult,
    ) => Promise<IQCResult>;
    importIQCResults: (results: IQCResult[]) => Promise<void>;
    getIQCResultsForAnalyte: (analyteId: string) => IQCResult[];
    addCompetencyRecord: (record: CompetencyRecord) => void;
    updateCompetencyRecord: (record: CompetencyRecord) => void;
    removeCompetencyRecord: (id: string) => void;
    findCompetencyRecord: (staffId: string, analyteCode: string) => CompetencyRecord | undefined;
    loadFromFirestore: () => Promise<void>;
    saveToFirestore: (forceImmediate?: boolean) => Promise<void>;
    retrySyncNow: () => Promise<void>;
    flushPendingSaves: () => Promise<void>;
    resetOrganizationData: (organizationId: string) => Promise<void>;
    importOrganizationData: (
        organizationId: string,
        data: LabOpsPersistedData,
    ) => Promise<{ importedCount: number; skippedCount: number }>;

    // Computed helpers
    getEquipmentById: (id: string) => Equipment | undefined;
    getOverdueCalibrations: () => Equipment[];
    getOverdueMaintenance: () => Equipment[];
    getLowStockReagents: () => Reagent[];
    getExpiredReagents: () => Reagent[];
    getOpenQualityEvents: () => QualityEvent[];
    getOverdueCAPA: () => CAPARecord[];
    getOpenHighQualityRisks: () => QualityRiskRecord[];
}

const toPersistedData = (state: LabOpsState): LabOpsPersistedData => ({
    equipment: state.equipment,
    calibrations: state.calibrations,
    maintenanceLogs: state.maintenanceLogs,
    reagents: state.reagents,
    reagentUsageLogs: state.reagentUsageLogs,
    proficiencyTests: state.proficiencyTests,
    qualityEvents: state.qualityEvents,
    capaRecords: state.capaRecords,
    qualityRisks: state.qualityRisks,
    competencyRecords: state.competencyRecords,
    iqcAnalytes: state.iqcAnalytes,
    iqcResults: state.iqcResults,
});

const queueSave = (get: () => LabOpsState, set: (state: Partial<LabOpsState>) => void): void => {
    queuedPayload = toPersistedData(get());
    queuedOrganizationId = get().loadedOrganizationId!;
    queuedRecordMode = get().recordMode;
    queuedRevision = get().recordRevision;
    set({ syncStatus: "saving", syncError: null });

    if (saveTimer) {
        clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
        void flushSaveQueue(get, set);
    }, SAVE_DEBOUNCE_MS);
};

const flushSaveQueue = async (
    get: () => LabOpsState,
    set: (state: Partial<LabOpsState>) => void,
): Promise<void> => {
    if (isSaving || !queuedPayload) {
        if (activeSave) {
            await activeSave.catch(() => undefined);
            if (queuedPayload) await flushSaveQueue(get, set);
        }
        return;
    }

    if (queuedOrganizationId !== useTenantStore.getState().organizationId) {
        queuedPayload = null;
        return;
    }

    isSaving = true;
    const payload = queuedPayload;
    const organizationId = queuedOrganizationId;
    const recordMode = queuedRecordMode;
    const revision = queuedRevision;
    queuedPayload = null;

    try {
        activeSave = (async () => {
            if (recordMode) {
                const nextRevision = await labRecordService.save(organizationId, payload, revision);
                if (get().loadedOrganizationId === organizationId && useTenantStore.getState().organizationId === organizationId) {
                    set({ recordRevision: nextRevision });
                }
                if (queuedPayload && queuedOrganizationId === organizationId && queuedRecordMode && queuedRevision === revision) {
                    queuedRevision = nextRevision;
                }
            } else await saveLabOpsDataWithRetry(payload, 3, 500, organizationId);
        })();
        await activeSave;
        if (get().loadedOrganizationId === organizationId && useTenantStore.getState().organizationId === organizationId) set({
            syncStatus: "synced",
            syncError: null,
            lastSyncedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to synchronize Lab Operations:", error);
        if (get().loadedOrganizationId === organizationId && useTenantStore.getState().organizationId === organizationId) set({
            syncStatus: "error",
            syncError: error instanceof Error ? error.message : "Save failed",
        });
    } finally {
        isSaving = false;
        activeSave = null;
        if (queuedPayload) {
            await flushSaveQueue(get, set);
        }
    }
};

async function writeOperationalRecord<K extends LabLogKind>(
    get: () => LabOpsState, set: (state: Partial<LabOpsState>) => void, kind: K, record: LabLog<K>, previous?: LabLog<K>,
): Promise<void> {
    const org = get().loadedOrganizationId;
    const generation = loadGeneration;
    if (!org || !get().hasLoadedFromFirestore || org !== useTenantStore.getState().organizationId) {
        throw new Error("Load Lab Operations successfully before logging");
    }
    try {
        await get().flushPendingSaves();
        if (generation !== loadGeneration || org !== useTenantStore.getState().organizationId) throw new Error("Organization changed");
        if (get().syncStatus === "error") throw new Error("Reload Lab Operations before logging");
        set({ syncStatus: "saving", syncError: null });
        await labRecordService.write(org, kind, record, get().recordRevision, previous);
        if (generation !== loadGeneration || org !== useTenantStore.getState().organizationId) return;
        // Hydrate complete calculation histories after each committed operation, never a truncated QC window.
        await get().loadFromFirestore();
        if (!get().hasLoadedFromFirestore) throw new Error("Record committed, but reload failed; retry the same record ID");
    } catch (error) {
        if (generation === loadGeneration && org === useTenantStore.getState().organizationId) set({
            syncStatus: "error", syncError: error instanceof Error ? error.message : "Record save failed",
        });
        throw error;
    }
}

export const useLabOpsStore = create<LabOpsState>((set, get) => ({
    equipment: SEED_EQUIPMENT,
    calibrations: SEED_CALIBRATION_RECORDS,
    maintenanceLogs: SEED_MAINTENANCE_LOGS,
    reagents: SEED_REAGENTS,
    reagentUsageLogs: [],
    proficiencyTests: SEED_PROFICIENCY_TESTS,
    qualityEvents: SEED_QUALITY_EVENTS,
    capaRecords: SEED_CAPA_RECORDS,
    qualityRisks: SEED_QUALITY_RISKS,
    competencyRecords: SEED_COMPETENCY_RECORDS,
    loading: false,
    hasLoadedFromFirestore: false,
    loadedOrganizationId: null,
    syncStatus: "idle",
    syncError: null,
    lastSyncedAt: null,
    recordMode: false,
    recordRevision: 0,
    usageCursor: null,
    usageHasMore: false,
    loadingUsage: false,
    loadMoreUsage: async () => {
        const org = get().loadedOrganizationId;
        const generation = loadGeneration;
        if (!get().recordMode || !get().usageHasMore || get().loadingUsage || !org || org !== useTenantStore.getState().organizationId) return;
        set({ loadingUsage: true });
        try {
            const page = await labRecordService.page(org, "reagentUsageLogs", get().usageCursor);
            if ((await labRecordService.state(org)).revision !== get().recordRevision) {
                throw new Error("Lab records changed; reload before continuing history");
            }
            if (generation !== loadGeneration || org !== useTenantStore.getState().organizationId) return;
            const records = new Map(get().reagentUsageLogs.map((r) => [r.id, r]));
            page.records.forEach((r) => records.set(r.id, r));
            set({ reagentUsageLogs: [...records.values()], usageCursor: page.cursor, usageHasMore: page.hasMore });
        } catch (error) {
            if (generation === loadGeneration) set({ syncStatus: "error", syncError: error instanceof Error ? error.message : "Log page failed" });
        } finally {
            if (generation === loadGeneration) set({ loadingUsage: false });
        }
    },
    iqcAnalytes: SEED_IQC_ANALYTES,
    iqcResults: SEED_IQC_RESULTS,

    // Equipment
    addEquipment: (eq) => {
        set((s) => ({ equipment: [...s.equipment, eq] }));
        void get().saveToFirestore();
    },
    updateEquipment: async (eq) => {
        const previous = get().equipment.find((equipment) => equipment.id === eq.id);
        if (!previous) throw new Error("Equipment no longer exists");
        set((s) => ({
            equipment: s.equipment.map((e) => (e.id === eq.id ? eq : e)),
        }));
        try {
            await get().saveToFirestore(true);
            if (get().syncStatus === "error") {
                throw new Error(get().syncError || "Equipment update failed to synchronize");
            }
        } catch (error) {
            set((s) => ({
                equipment: s.equipment.map((equipment) => equipment.id === eq.id && equipment === eq
                    ? previous
                    : equipment),
            }));
            throw error;
        }
    },
    decommissionEquipment: (id) => {
        set((s) => ({
            equipment: s.equipment.map((e) => e.id === id
                ? { ...e, status: "decommissioned", updatedAt: new Date().toISOString() }
                : e),
        }));
        void get().saveToFirestore();
    },
    restoreEquipment: (id) => {
        set((s) => ({
            equipment: s.equipment.map((e) => e.id === id && e.status === "decommissioned"
                ? { ...e, status: "inactive", updatedAt: new Date().toISOString() }
                : e),
        }));
        void get().saveToFirestore();
    },

    // Calibrations
    addCalibration: (cal) => {
        if (get().recordMode) return writeOperationalRecord(get, set, "calibrations", cal);
        set((s) => ({
            calibrations: [...s.calibrations, cal],
            equipment: s.equipment.map((equipment) => equipment.id !== cal.equipmentId ? equipment : {
                ...equipment,
                lastCalibrationDate: cal.calibrationDate,
                nextCalibrationDue: cal.result === "fail" ? equipment.nextCalibrationDue : cal.nextDueDate,
                status: equipment.status === "decommissioned" ? equipment.status
                    : cal.result === "fail" ? "calibration_due"
                    : equipment.status === "calibration_due" ? "active" : equipment.status,
                updatedAt: new Date().toISOString(),
            }),
        }));
        void get().saveToFirestore();
    },

    // Maintenance
    addMaintenanceLog: (log) => {
        if (get().recordMode) return writeOperationalRecord(get, set, "maintenanceLogs", log);
        set((s) => ({ maintenanceLogs: [...s.maintenanceLogs, log] }));
        void get().saveToFirestore();
    },
    updateMaintenanceLog: (log) => {
        if (get().recordMode) return writeOperationalRecord(get, set, "maintenanceLogs", log, get().maintenanceLogs.find((r) => r.id === log.id));
        set((s) => ({
            maintenanceLogs: s.maintenanceLogs.map((m) =>
                m.id === log.id ? log : m,
            ),
        }));
        void get().saveToFirestore();
    },

    // Reagents
    addReagent: (r) => {
        set((s) => ({ reagents: [...s.reagents, r] }));
        void get().saveToFirestore();
    },
    updateReagent: (r) => {
        set((s) => ({
            reagents: s.reagents.map((rg) => (rg.id === r.id ? r : rg)),
        }));
        void get().saveToFirestore();
    },
    removeReagent: (id) => {
        set((s) => ({ reagents: s.reagents.filter((r) => r.id !== id) }));
        void get().saveToFirestore();
    },
    addReagentUsage: (usage) => {
        if (get().recordMode) return writeOperationalRecord(get, set, "reagentUsageLogs", usage);
        const reagent = get().reagents.find((record) => record.id === usage.reagentId);
        if (!reagent || !usage.usedBy.trim() || !Number.isFinite(usage.quantityUsed)
            || usage.quantityUsed <= 0 || usage.quantityUsed > reagent.quantity) {
            throw new Error("Invalid reagent usage quantity or operator");
        }
        const quantity = reagent.quantity - usage.quantityUsed;
        set((s) => ({
            reagentUsageLogs: [...s.reagentUsageLogs, usage],
            reagents: s.reagents.map((record) => record.id !== reagent.id ? record : {
                ...record,
                quantity,
                status: record.status === "quarantine" || record.status === "expired" ? record.status
                    : quantity === 0 ? "depleted" : quantity <= record.reorderLevel ? "low_stock" : "in_stock",
                updatedAt: new Date().toISOString(),
            }),
        }));
        void get().saveToFirestore();
    },

    // Proficiency
    addProficiencyTest: (pt) => {
        set((s) => ({ proficiencyTests: [...s.proficiencyTests, pt] }));
        void get().saveToFirestore();
    },
    updateProficiencyTest: (pt) => {
        set((s) => ({
            proficiencyTests: s.proficiencyTests.map((p) =>
                p.id === pt.id ? pt : p,
            ),
        }));
        void get().saveToFirestore();
    },

    // Quality events + CAPA
    addQualityEvent: (event) => {
        set((s) => ({ qualityEvents: [...s.qualityEvents, event] }));
        void get().saveToFirestore();
    },
    updateQualityEvent: (event) => {
        set((s) => ({
            qualityEvents: s.qualityEvents.map((e) =>
                e.id === event.id ? event : e,
            ),
        }));
        void get().saveToFirestore();
    },
    addCAPARecord: (capa) => {
        set((s) => ({ capaRecords: [...s.capaRecords, capa] }));
        void get().saveToFirestore();
    },
    updateCAPARecord: (capa) => {
        set((s) => ({
            capaRecords: s.capaRecords.map((c) =>
                c.id === capa.id ? capa : c,
            ),
        }));
        void get().saveToFirestore();
    },
    addQualityRisk: (risk) => {
        set((s) => ({ qualityRisks: [...s.qualityRisks, risk] }));
        void get().saveToFirestore();
    },
    updateQualityRisk: (risk) => {
        set((s) => ({
            qualityRisks: s.qualityRisks.map((r) =>
                r.id === risk.id ? risk : r,
            ),
        }));
        void get().saveToFirestore();
    },

    // Computed
    getEquipmentById: (id) => get().equipment.find((e) => e.id === id),
    getOverdueCalibrations: () => {
        const now = new Date().toISOString().split("T")[0];
        return get().equipment.filter(
            (e) =>
                e.nextCalibrationDue &&
                e.nextCalibrationDue < now &&
                e.status !== "decommissioned",
        );
    },
    getOverdueMaintenance: () => {
        const now = new Date().toISOString().split("T")[0];
        return get().equipment.filter(
            (e) =>
                e.nextMaintenanceDue &&
                e.nextMaintenanceDue < now &&
                e.status !== "decommissioned",
        );
    },
    getLowStockReagents: () =>
        get().reagents.filter((r) => r.status === "low_stock"),
    getExpiredReagents: () =>
        get().reagents.filter((r) => r.status === "expired"),
    getOpenQualityEvents: () =>
        get().qualityEvents.filter((e) => e.status !== "closed"),
    getOverdueCAPA: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().capaRecords.filter(
            (c) => c.status !== "closed" && c.dueDate < today,
        );
    },
    getOpenHighQualityRisks: () =>
        get().qualityRisks.filter(
            (r) =>
                r.status !== "closed" &&
                (r.riskLevel === "high" || r.riskLevel === "critical"),
        ),

    // IQC / Westgard
    addIQCAnalyte: (analyte) => {
        set((s) => ({ iqcAnalytes: [...s.iqcAnalytes, analyte] }));
        void get().saveToFirestore();
    },
    updateIQCAnalyte: (analyte) => {
        set((s) => ({
            iqcAnalytes: s.iqcAnalytes.map((a) => (a.id === analyte.id ? analyte : a)),
        }));
        void get().saveToFirestore();
    },
    logIQCResultWithSideEffects: async (result, qualityEvent, previousResult) => {
        const organizationId = get().loadedOrganizationId;
        const generation = loadGeneration;
        if (!organizationId || !get().hasLoadedFromFirestore
            || organizationId !== useTenantStore.getState().organizationId) {
            throw new Error("Load Lab Operations for the active organization before logging");
        }

        await get().flushPendingSaves();
        if (generation !== loadGeneration || organizationId !== useTenantStore.getState().organizationId) {
            throw new Error("Organization changed before the QC result could be saved");
        }
        if (get().syncStatus === "error") {
            throw new Error(get().syncError || "Reload Lab Operations before logging");
        }

        const current = get();
        const existingResult = current.iqcResults.find((record) => record.id === result.id);
        if (previousResult) {
            if (!existingResult || JSON.stringify(existingResult) !== JSON.stringify(previousResult)) {
                throw new Error("IQC result changed; reload before creating its quality event");
            }
        } else if (existingResult) {
            throw new Error("This IQC result has already been logged");
        }
        if (qualityEvent && current.qualityEvents.some((record) => record.id === qualityEvent.id
            && JSON.stringify(record) !== JSON.stringify(qualityEvent))) {
            throw new Error("Conflicting quality-event identifier");
        }

        const now = result.createdAt;
        let resultToSave = { ...result };
        let nextData = toPersistedData(current);
        const nextIQCResults = previousResult
            ? current.iqcResults.map((record) => record.id === result.id ? resultToSave : record)
            : [...current.iqcResults, resultToSave];
        let nextQualityEvents = current.qualityEvents;
        let nextCAPARecords = current.capaRecords;
        let nextQualityRisks = current.qualityRisks;
        let nextReagents = current.reagents;

        if (qualityEvent) {
            resultToSave = { ...resultToSave, linkedQualityEventId: qualityEvent.id };
            nextQualityEvents = current.qualityEvents.some((record) => record.id === qualityEvent.id)
                ? current.qualityEvents.map((record) => record.id === qualityEvent.id ? qualityEvent : record)
                : [...current.qualityEvents, qualityEvent];
        }
        if (!previousResult && resultToSave.rejected && resultToSave.reagentLot) {
            const reagent = current.reagents.find((record) =>
                record.lotNumber === resultToSave.reagentLot
                && record.labSection.toLowerCase() === resultToSave.labSection.toLowerCase());
            if (reagent) {
                const riskId = `${resultToSave.id}-risk`;
                const capaId = `${resultToSave.id}-capa`;
                const createdAt = new Date(now);
                if (!Number.isFinite(createdAt.getTime())) throw new Error("Invalid IQC result creation date");
                const dueDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                const risk: QualityRiskRecord = {
                    id: riskId,
                    relatedCapaId: capaId,
                    title: `Supplier-linked IQC instability: ${resultToSave.analyteCode} lot ${resultToSave.reagentLot}`,
                    hazard: "Potential reagent lot instability causing analytical drift",
                    potentialHarm: "Delayed reporting, inaccurate patient results, and increased rerun burden",
                    labSection: resultToSave.labSection,
                    owner: "Quality Manager",
                    likelihood: 4,
                    impact: 5,
                    riskScore: 20,
                    riskLevel: "critical",
                    status: "open",
                    relatedSupplierId: reagent.supplierId,
                    relatedSupplierName: reagent.supplierName,
                    relatedReagentLot: reagent.lotNumber,
                    mitigationPlan: "Quarantine impacted lot, verify alternate lot performance, and complete supplier CAPA follow-up.",
                    createdAt: now,
                    updatedAt: now,
                };
                const capa: CAPARecord = {
                    id: capaId,
                    title: `CAPA: Investigate ${resultToSave.reagentLot} IQC rejection trend`,
                    owner: "Section Supervisor",
                    dueDate,
                    status: "open",
                    actionPlan: "Quarantine lot, repeat QC with alternate lot, perform calibration verification, notify supplier, and document disposition decision.",
                    effectivenessCriteria: "Three consecutive in-control runs with no reject Westgard rules and documented supplier response.",
                    createdAt: now,
                    updatedAt: now,
                };
                resultToSave = { ...resultToSave, linkedRiskRecordId: riskId, linkedCapaId: capaId };
                nextQualityRisks = [...current.qualityRisks, risk];
                nextCAPARecords = [...current.capaRecords, capa];
                nextReagents = current.reagents.map((record) => record.id !== reagent.id ? record : {
                    ...record,
                    status: "quarantine",
                    qualityFlag: "under_investigation",
                    notes: `${record.notes ? `${record.notes} | ` : ""}Auto-flagged from IQC reject (${resultToSave.id}).`,
                    updatedAt: now,
                });
            }
        }
        nextData = {
            ...nextData,
            iqcResults: previousResult
                ? nextIQCResults.map((record) => record.id === resultToSave.id ? resultToSave : record)
                : [...current.iqcResults, resultToSave],
            qualityEvents: nextQualityEvents,
            capaRecords: nextCAPARecords,
            qualityRisks: nextQualityRisks,
            reagents: nextReagents,
        };

        set({ syncStatus: "saving", syncError: null });
        try {
            let recordRevision = current.recordRevision;
            if (current.recordMode) {
                recordRevision = await labRecordService.writeIQCResultWithMetadata(
                    organizationId,
                    resultToSave,
                    nextData,
                    current.recordRevision,
                    previousResult,
                );
            } else {
                await saveLabOpsDataWithRetry(nextData, 3, 500, organizationId);
            }
            if (generation !== loadGeneration || organizationId !== useTenantStore.getState().organizationId) {
                throw new Error("Organization changed while the QC result was being saved");
            }
            set({
                ...nextData,
                recordRevision,
                syncStatus: "synced",
                syncError: null,
                lastSyncedAt: new Date().toISOString(),
            });
            return resultToSave;
        } catch (error) {
            if (generation === loadGeneration && organizationId === useTenantStore.getState().organizationId) {
                set({
                    syncStatus: "error",
                    syncError: error instanceof Error ? error.message : "QC result could not be saved",
                });
            }
            throw error;
        }
    },
    importIQCResults: async (results) => {
        if (results.length === 0 || results.length > 400) {
            throw new Error("Import between 1 and 400 QC records at a time");
        }
        const organizationId = get().loadedOrganizationId;
        const generation = loadGeneration;
        if (!organizationId || !get().hasLoadedFromFirestore
            || organizationId !== useTenantStore.getState().organizationId) {
            throw new Error("Load Lab Operations for the active organization before importing");
        }
        await get().flushPendingSaves();
        if (generation !== loadGeneration || organizationId !== useTenantStore.getState().organizationId) {
            throw new Error("Organization changed before the QC import could be saved");
        }
        const current = get();
        const incomingIds = new Set(results.map((result) => result.id));
        if (incomingIds.size !== results.length
            || current.iqcResults.some((result) => incomingIds.has(result.id))) {
            throw new Error("QC import contains duplicate result identifiers");
        }
        const nextResults = [...current.iqcResults, ...results];
        if (current.recordMode) {
            set({ syncStatus: "saving", syncError: null });
            try {
                const nextState = await labRecordService.writeMany(
                    organizationId,
                    "iqcResults",
                    results,
                    current.recordRevision,
                );
                if (generation !== loadGeneration
                    || organizationId !== useTenantStore.getState().organizationId) {
                    throw new Error("Organization changed while the QC import was being saved");
                }
                set({
                    iqcResults: nextResults,
                    recordRevision: nextState.revision,
                    syncStatus: "synced",
                    syncError: null,
                    lastSyncedAt: new Date().toISOString(),
                });
            } catch (error) {
                if (generation === loadGeneration
                    && organizationId === useTenantStore.getState().organizationId) {
                    set({
                        syncStatus: "error",
                        syncError: error instanceof Error ? error.message : "QC import failed",
                    });
                }
                throw error;
            }
            return;
        }
        set({ iqcResults: nextResults, syncStatus: "saving", syncError: null });
        await get().saveToFirestore(true);
        const latest = get();
        if (generation !== loadGeneration
            || organizationId !== useTenantStore.getState().organizationId) {
            throw new Error("Organization changed while the QC import was being saved");
        }
        if (latest.syncStatus !== "synced") {
            set({
                iqcResults: get().iqcResults.filter((result) => !incomingIds.has(result.id)),
            });
            throw new Error(latest.syncError || "QC import could not be saved");
        }
    },
    getIQCResultsForAnalyte: (analyteId) =>
        get()
            .iqcResults.filter((r) => r.analyteId === analyteId)
            .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)),
    addCompetencyRecord: (record) => {
        set((s) => ({ competencyRecords: [...s.competencyRecords, record] }));
        void get().saveToFirestore();
    },
    updateCompetencyRecord: (record) => {
        set((s) => ({
            competencyRecords: s.competencyRecords.map((r) => (r.id === record.id ? record : r)),
        }));
        void get().saveToFirestore();
    },
    removeCompetencyRecord: (id) => {
        set((s) => ({ competencyRecords: s.competencyRecords.filter((r) => r.id !== id) }));
        void get().saveToFirestore();
    },
    findCompetencyRecord: (staffId, analyteCode) =>
        checkCompetencyAuthorization(get().competencyRecords, staffId, analyteCode).record,
    loadFromFirestore: async () => {
        const organizationId = useTenantStore.getState().organizationId;
        const generation = ++loadGeneration;
        if (saveTimer) clearTimeout(saveTimer);
        await get().flushPendingSaves();
        if (generation !== loadGeneration) return;
        set({ loading: true, syncError: null, hasLoadedFromFirestore: false, loadedOrganizationId: null, usageCursor: null, usageHasMore: false, loadingUsage: false });
        try {
            const recordMode = labRecordStorageEnabled();
            set({ recordMode });
            let remote: LabOpsPersistedData | null;
            let recordRevision = 0;
            let usageCursor: LabLogCursor | null = null;
            let usageHasMore = false;
            if (recordMode) {
                const state = await labRecordService.state(organizationId);
                recordRevision = state.revision;
                remote = { ...state, iqcResults: [], reagentUsageLogs: [], calibrations: [], maintenanceLogs: [] };
                for (const kind of LAB_LOG_KINDS) {
                    let cursor: LabLogCursor | null = null;
                    do {
                        const page: LabLogPage<LabLogKind> = await labRecordService.page(organizationId, kind, cursor);
                        (remote[kind] as LabLog<LabLogKind>[]).push(...page.records);
                        cursor = page.hasMore ? page.cursor : null;
                        if (kind === "reagentUsageLogs") {
                            usageCursor = page.cursor;
                            usageHasMore = page.hasMore;
                            break;
                        }
                    } while (cursor);
                }
                // Fail closed if concurrent writes changed a calculation history during pagination.
                if ((await labRecordService.state(organizationId)).revision !== recordRevision) throw new Error("Lab records changed during loading; retry");
            } else remote = await getLabOpsData(organizationId);
            if (generation !== loadGeneration || useTenantStore.getState().organizationId !== organizationId) return;
            set({ recordMode, recordRevision, usageCursor, usageHasMore });
            if (remote) {
                set({
                    equipment: remote.equipment || [],
                    calibrations: remote.calibrations || [],
                    maintenanceLogs: remote.maintenanceLogs || [],
                    reagents: remote.reagents || [],
                    reagentUsageLogs: remote.reagentUsageLogs || [],
                    proficiencyTests: remote.proficiencyTests || [],
                    qualityEvents: remote.qualityEvents || [],
                    capaRecords: remote.capaRecords || [],
                    qualityRisks: remote.qualityRisks || [],
                    competencyRecords: remote.competencyRecords || [],
                    iqcAnalytes: remote.iqcAnalytes || [],
                    iqcResults: remote.iqcResults || [],
                    hasLoadedFromFirestore: true,
                    loadedOrganizationId: organizationId,
                    syncStatus: "synced",
                    lastSyncedAt: new Date().toISOString(),
                });
            } else {
                const empty: LabOpsPersistedData = {
                    equipment: [], calibrations: [], maintenanceLogs: [], reagents: [],
                    reagentUsageLogs: [], proficiencyTests: [], qualityEvents: [], capaRecords: [],
                    qualityRisks: [], competencyRecords: [], iqcAnalytes: [], iqcResults: [],
                };
                set({
                    ...empty,
                    hasLoadedFromFirestore: true,
                    loadedOrganizationId: organizationId,
                    syncStatus: "idle",
                    lastSyncedAt: null,
                });
            }
        } catch (error) {
            if (generation !== loadGeneration || useTenantStore.getState().organizationId !== organizationId) return;
            set({
                syncStatus: "error",
                syncError: error instanceof Error ? error.message : "Failed to load Lab Ops data",
            });
        } finally {
            if (generation === loadGeneration) set({ loading: false });
        }
    },
    saveToFirestore: async (forceImmediate = false) => {
        if (!get().hasLoadedFromFirestore || get().loadedOrganizationId !== useTenantStore.getState().organizationId) {
            set({ syncStatus: "error", syncError: "Load Lab Operations successfully before saving" });
            return;
        }
        if (forceImmediate) {
            queuedPayload = toPersistedData(get());
            queuedOrganizationId = get().loadedOrganizationId!;
            queuedRecordMode = get().recordMode;
            queuedRevision = get().recordRevision;
            if (saveTimer) {
                clearTimeout(saveTimer);
                saveTimer = null;
            }
            await flushSaveQueue(get, set);
            return;
        }

        queueSave(get, set);
    },
    retrySyncNow: async () => {
        if (!get().hasLoadedFromFirestore) await get().loadFromFirestore();
        else if (get().recordMode) await get().loadFromFirestore();
        else await get().saveToFirestore(true);
    },
    resetOrganizationData: async (organizationId) => {
        if (!organizationId || organizationId !== useTenantStore.getState().organizationId
            || organizationId !== get().loadedOrganizationId || !get().hasLoadedFromFirestore) {
            throw new Error("Load Lab Operations for the active organization before resetting it");
        }
        if (get().recordMode) {
            throw new Error("Reset is unavailable while record-level Lab Operations storage is active");
        }

        const generation = loadGeneration;
        await get().flushPendingSaves();
        if (generation !== loadGeneration || organizationId !== useTenantStore.getState().organizationId
            || organizationId !== get().loadedOrganizationId || !get().hasLoadedFromFirestore) {
            throw new Error("Organization changed; reload Lab Operations before resetting");
        }
        if (get().syncStatus === "error") {
            throw new Error("Pending Lab Operations changes did not synchronize; retry before resetting");
        }

        await resetLabOpsData(organizationId);
        if (organizationId !== useTenantStore.getState().organizationId) {
            throw new Error("Organization changed after reset; reload Lab Operations");
        }
        loadGeneration += 1;
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        queuedPayload = null;
        set({
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
            usageCursor: null,
            usageHasMore: false,
            loadingUsage: false,
            hasLoadedFromFirestore: true,
            loadedOrganizationId: organizationId,
            syncStatus: "synced",
            syncError: null,
            lastSyncedAt: new Date().toISOString(),
        });
    },
    importOrganizationData: async (organizationId, importedData) => {
        if (!organizationId || organizationId !== useTenantStore.getState().organizationId
            || organizationId !== get().loadedOrganizationId || !get().hasLoadedFromFirestore) {
            throw new Error("Load Lab Operations for the active organization before importing");
        }
        if (get().recordMode) {
            throw new Error("Import is unavailable while record-level Lab Operations storage is active");
        }

        const generation = loadGeneration;
        await get().flushPendingSaves();
        if (generation !== loadGeneration || organizationId !== useTenantStore.getState().organizationId
            || organizationId !== get().loadedOrganizationId || !get().hasLoadedFromFirestore) {
            throw new Error("Organization changed; reload Lab Operations before importing");
        }
        if (get().syncStatus === "error") {
            throw new Error("Pending Lab Operations changes did not synchronize; retry before importing");
        }

        const current = toPersistedData(get());
        const merged = { ...current };
        let importedCount = 0;
        let skippedCount = 0;
        const additionsByGroup = new Map<
            keyof LabOpsPersistedData,
            { id: string; values: Record<string, unknown> }[]
        >();
        for (const key of Object.keys(current) as (keyof LabOpsPersistedData)[]) {
            const existingIds = new Set(current[key].map((record) => record.id));
            const additions = importedData[key].filter((record) => {
                if (existingIds.has(record.id)) {
                    skippedCount += 1;
                    return false;
                }
                existingIds.add(record.id);
                importedCount += 1;
                return true;
            });
            (merged[key] as typeof additions) = [...current[key], ...additions] as typeof additions;
            additionsByGroup.set(key, additions.map((record) => ({
                id: record.id,
                values: Object.fromEntries(Object.entries(record)),
            })));
        }
        if (importedCount === 0) return { importedCount, skippedCount };

        const references: {
            source: keyof LabOpsPersistedData;
            field: string;
            target: keyof LabOpsPersistedData;
            optional?: boolean;
        }[] = [
            { source: "calibrations", field: "equipmentId", target: "equipment" },
            { source: "maintenanceLogs", field: "equipmentId", target: "equipment" },
            { source: "reagents", field: "associatedEquipmentId", target: "equipment", optional: true },
            { source: "reagentUsageLogs", field: "reagentId", target: "reagents" },
            { source: "reagentUsageLogs", field: "equipmentId", target: "equipment", optional: true },
            { source: "proficiencyTests", field: "correctiveActionId", target: "capaRecords", optional: true },
            { source: "qualityEvents", field: "capaId", target: "capaRecords", optional: true },
            { source: "capaRecords", field: "sourceEventId", target: "qualityEvents", optional: true },
            { source: "qualityRisks", field: "sourceEventId", target: "qualityEvents", optional: true },
            { source: "qualityRisks", field: "relatedCapaId", target: "capaRecords", optional: true },
            { source: "iqcAnalytes", field: "equipmentId", target: "equipment" },
            { source: "iqcResults", field: "analyteId", target: "iqcAnalytes" },
            { source: "iqcResults", field: "equipmentId", target: "equipment" },
            { source: "iqcResults", field: "linkedQualityEventId", target: "qualityEvents", optional: true },
            { source: "iqcResults", field: "linkedRiskRecordId", target: "qualityRisks", optional: true },
            { source: "iqcResults", field: "linkedCapaId", target: "capaRecords", optional: true },
        ];
        const brokenReferences: string[] = [];
        for (const reference of references) {
            const targetIds = new Set(merged[reference.target].map((record) => record.id));
            for (const row of additionsByGroup.get(reference.source) ?? []) {
                const linkedId = row.values[reference.field];
                if (linkedId === undefined || linkedId === null || linkedId === "") {
                    if (!reference.optional) {
                        brokenReferences.push(`${reference.source} ${row.id} is missing ${reference.field}`);
                    }
                } else if (typeof linkedId !== "string" || !targetIds.has(linkedId)) {
                    brokenReferences.push(`${reference.source} ${row.id} references unknown ${reference.field} "${String(linkedId)}"`);
                }
                if (brokenReferences.length >= 8) break;
            }
            if (brokenReferences.length >= 8) break;
        }
        if (brokenReferences.length) {
            throw new Error(`Import validation failed: ${brokenReferences.join("; ")}`);
        }

        set({ syncStatus: "saving", syncError: null });
        try {
            await saveLabOpsDataWithRetry(merged, 3, 500, organizationId);
            if (generation !== loadGeneration || organizationId !== useTenantStore.getState().organizationId
                || organizationId !== get().loadedOrganizationId) {
                throw new Error("Organization changed during import; reload Lab Operations to verify the saved data");
            }
            set({
                ...merged,
                syncStatus: "synced",
                syncError: null,
                lastSyncedAt: new Date().toISOString(),
            });
            return { importedCount, skippedCount };
        } catch (error) {
            if (organizationId === useTenantStore.getState().organizationId
                && organizationId === get().loadedOrganizationId) {
                set({
                    syncStatus: "error",
                    syncError: error instanceof Error ? error.message : "Import save failed",
                });
            }
            throw error;
        }
    },
    flushPendingSaves: async () => {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        await flushSaveQueue(get, set);
        while (queuedPayload || isSaving) await flushSaveQueue(get, set);
    },
}));

if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
    const flush = (): void => {
        void useLabOpsStore.getState().flushPendingSaves();
    };

    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            flush();
        }
    });

}
