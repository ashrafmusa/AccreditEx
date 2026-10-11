/**
 * Lab Operations Zustand Store
 * Manages equipment, maintenance, reagents, calibrations, proficiency testing
 */
import type { LabOpsPersistedData } from "@/services/labOpsService";
import {
    getLabOpsData,
    saveLabOpsDataWithRetry,
} from "@/services/labOpsService";
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
let loadGeneration = 0;

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

    // Equipment CRUD
    addEquipment: (eq: Equipment) => void;
    updateEquipment: (eq: Equipment) => void;
    removeEquipment: (id: string) => void;

    // Calibrations
    addCalibration: (cal: CalibrationRecord) => void;

    // Maintenance
    addMaintenanceLog: (log: MaintenanceLog) => void;
    updateMaintenanceLog: (log: MaintenanceLog) => void;

    // Reagents
    addReagent: (r: Reagent) => void;
    updateReagent: (r: Reagent) => void;
    removeReagent: (id: string) => void;
    addReagentUsage: (usage: ReagentUsageLog) => void;

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
    addIQCResult: (result: IQCResult) => void;
    updateIQCResult: (result: IQCResult) => void;
    getIQCResultsForAnalyte: (analyteId: string) => IQCResult[];
    addCompetencyRecord: (record: CompetencyRecord) => void;
    updateCompetencyRecord: (record: CompetencyRecord) => void;
    removeCompetencyRecord: (id: string) => void;
    findCompetencyRecord: (staffId: string, analyteCode: string) => CompetencyRecord | undefined;
    loadFromFirestore: () => Promise<void>;
    saveToFirestore: (forceImmediate?: boolean) => Promise<void>;
    retrySyncNow: () => Promise<void>;
    flushPendingSaves: () => Promise<void>;

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
        return;
    }

    isSaving = true;
    const payload = queuedPayload;
    const organizationId = queuedOrganizationId;
    queuedPayload = null;

    try {
        await saveLabOpsDataWithRetry(payload, 3, 500, organizationId);
        if (get().loadedOrganizationId === organizationId) set({
            syncStatus: "synced",
            syncError: null,
            lastSyncedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to synchronize Lab Operations:", error);
        if (get().loadedOrganizationId === organizationId) set({
            syncStatus: "error",
            syncError: error instanceof Error ? error.message : "Save failed",
        });
    } finally {
        isSaving = false;
        if (queuedPayload) {
            void flushSaveQueue(get, set);
        }
    }
};

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
    iqcAnalytes: SEED_IQC_ANALYTES,
    iqcResults: SEED_IQC_RESULTS,

    // Equipment
    addEquipment: (eq) => {
        set((s) => ({ equipment: [...s.equipment, eq] }));
        void get().saveToFirestore();
    },
    updateEquipment: (eq) => {
        set((s) => ({
            equipment: s.equipment.map((e) => (e.id === eq.id ? eq : e)),
        }));
        void get().saveToFirestore();
    },
    removeEquipment: (id) => {
        set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) }));
        void get().saveToFirestore();
    },

    // Calibrations
    addCalibration: (cal) => {
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
        set((s) => ({ maintenanceLogs: [...s.maintenanceLogs, log] }));
        void get().saveToFirestore();
    },
    updateMaintenanceLog: (log) => {
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
    addIQCResult: (result) => {
        set((s) => ({ iqcResults: [...s.iqcResults, result] }));
        void get().saveToFirestore();
    },
    updateIQCResult: (result) => {
        set((s) => ({
            iqcResults: s.iqcResults.map((r) => (r.id === result.id ? result : r)),
        }));
        void get().saveToFirestore();
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
        await flushSaveQueue(get, set);
        if (generation !== loadGeneration) return;
        set({ loading: true, syncError: null, hasLoadedFromFirestore: false, loadedOrganizationId: null });
        try {
            const remote = await getLabOpsData(organizationId);
            if (generation !== loadGeneration || useTenantStore.getState().organizationId !== organizationId) return;
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
        else await get().saveToFirestore(true);
    },
    flushPendingSaves: async () => {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        await flushSaveQueue(get, set);
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
