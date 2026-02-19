/**
 * Lab Operations Zustand Store
 * Manages equipment, maintenance, reagents, calibrations, proficiency testing
 */
import { create } from "zustand";
import type {
    Equipment,
    CalibrationRecord,
    MaintenanceLog,
    Reagent,
    ReagentUsageLog,
    ProficiencyTest,
} from "@/types/labOps";
import {
    SEED_EQUIPMENT,
    SEED_MAINTENANCE_LOGS,
    SEED_CALIBRATION_RECORDS,
    SEED_REAGENTS,
    SEED_PROFICIENCY_TESTS,
} from "@/types/labOps";

interface LabOpsState {
    // Data
    equipment: Equipment[];
    calibrations: CalibrationRecord[];
    maintenanceLogs: MaintenanceLog[];
    reagents: Reagent[];
    reagentUsageLogs: ReagentUsageLog[];
    proficiencyTests: ProficiencyTest[];
    loading: boolean;

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

    // Computed helpers
    getEquipmentById: (id: string) => Equipment | undefined;
    getOverdueCalibrations: () => Equipment[];
    getOverdueMaintenance: () => Equipment[];
    getLowStockReagents: () => Reagent[];
    getExpiredReagents: () => Reagent[];
}

export const useLabOpsStore = create<LabOpsState>((set, get) => ({
    equipment: SEED_EQUIPMENT,
    calibrations: SEED_CALIBRATION_RECORDS,
    maintenanceLogs: SEED_MAINTENANCE_LOGS,
    reagents: SEED_REAGENTS,
    reagentUsageLogs: [],
    proficiencyTests: SEED_PROFICIENCY_TESTS,
    loading: false,

    // Equipment
    addEquipment: (eq) =>
        set((s) => ({ equipment: [...s.equipment, eq] })),
    updateEquipment: (eq) =>
        set((s) => ({
            equipment: s.equipment.map((e) => (e.id === eq.id ? eq : e)),
        })),
    removeEquipment: (id) =>
        set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) })),

    // Calibrations
    addCalibration: (cal) =>
        set((s) => ({ calibrations: [...s.calibrations, cal] })),

    // Maintenance
    addMaintenanceLog: (log) =>
        set((s) => ({ maintenanceLogs: [...s.maintenanceLogs, log] })),
    updateMaintenanceLog: (log) =>
        set((s) => ({
            maintenanceLogs: s.maintenanceLogs.map((m) =>
                m.id === log.id ? log : m,
            ),
        })),

    // Reagents
    addReagent: (r) =>
        set((s) => ({ reagents: [...s.reagents, r] })),
    updateReagent: (r) =>
        set((s) => ({
            reagents: s.reagents.map((rg) => (rg.id === r.id ? r : rg)),
        })),
    removeReagent: (id) =>
        set((s) => ({ reagents: s.reagents.filter((r) => r.id !== id) })),
    addReagentUsage: (usage) =>
        set((s) => ({ reagentUsageLogs: [...s.reagentUsageLogs, usage] })),

    // Proficiency
    addProficiencyTest: (pt) =>
        set((s) => ({ proficiencyTests: [...s.proficiencyTests, pt] })),
    updateProficiencyTest: (pt) =>
        set((s) => ({
            proficiencyTests: s.proficiencyTests.map((p) =>
                p.id === pt.id ? pt : p,
            ),
        })),

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
}));
