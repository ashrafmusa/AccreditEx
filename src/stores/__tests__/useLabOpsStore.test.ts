import { getLabOpsData, saveLabOpsDataWithRetry } from "@/services/labOpsService";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { SEED_EQUIPMENT, SEED_REAGENTS } from "@/types/labOps";

jest.mock("@/services/labOpsService", () => ({
    getLabOpsData: jest.fn(), saveLabOpsDataWithRetry: jest.fn(),
}));
jest.mock("@/stores/useTenantStore", () => ({
    useTenantStore: { getState: () => ({ organizationId: "org-a" }) },
}));

describe("Lab Operations safeguards", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useLabOpsStore.setState({
            equipment: SEED_EQUIPMENT, reagents: SEED_REAGENTS, calibrations: [],
            reagentUsageLogs: [], hasLoadedFromFirestore: false, loadedOrganizationId: null,
        });
    });

    it("does not initialize or save after a read failure, including manual retry", async () => {
        jest.mocked(getLabOpsData).mockRejectedValue(new Error("offline"));
        await useLabOpsStore.getState().loadFromFirestore();
        await useLabOpsStore.getState().saveToFirestore(true);
        await useLabOpsStore.getState().retrySyncNow();
        expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
        expect(useLabOpsStore.getState().hasLoadedFromFirestore).toBe(false);
    });

    it("initializes a genuinely empty tenant with empty records, not seed data", async () => {
        jest.mocked(getLabOpsData).mockResolvedValue(null);
        await useLabOpsStore.getState().loadFromFirestore();
        expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
        expect(useLabOpsStore.getState().equipment).toEqual([]);
        expect(useLabOpsStore.getState().hasLoadedFromFirestore).toBe(true);
        await useLabOpsStore.getState().flushPendingSaves();
        expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
        await useLabOpsStore.getState().saveToFirestore(true);
        expect(saveLabOpsDataWithRetry).toHaveBeenCalledWith(
            expect.objectContaining({ equipment: [], iqcResults: [], competencyRecords: [] }), 3, 500, "org-a",
        );
    });

    it("keeps failed calibrations restricted and applies pass results atomically", () => {
        const equipment = { ...SEED_EQUIPMENT[0], status: "calibration_due" as const };
        useLabOpsStore.setState({ equipment: [equipment] });
        const calibration = {
            id: "cal", equipmentId: equipment.id, equipmentName: equipment.name,
            calibratedBy: "QA", calibrationDate: "2026-10-11", nextDueDate: "2027-01-01",
            result: "fail" as const, createdAt: "2026-10-11",
        };
        useLabOpsStore.getState().addCalibration(calibration);
        expect(useLabOpsStore.getState().equipment[0].status).toBe("calibration_due");
        useLabOpsStore.getState().addCalibration({ ...calibration, id: "pass", result: "pass" });
        expect(useLabOpsStore.getState().equipment[0].status).toBe("active");
    });

    it("rejects invalid usage without changing stock or logs and subtracts valid usage exactly", () => {
        const reagent = { ...SEED_REAGENTS[0], quantity: 10 };
        useLabOpsStore.setState({ reagents: [reagent] });
        const usage = {
            id: "usage", reagentId: reagent.id, reagentName: reagent.name, usedBy: "QA",
            usageDate: "2026-10-11", quantityUsed: 2, unit: reagent.unit,
        };
        for (const quantityUsed of [-1, 0, NaN, Infinity, 11]) {
            expect(() => useLabOpsStore.getState().addReagentUsage({ ...usage, quantityUsed })).toThrow();
        }
        expect(useLabOpsStore.getState().reagentUsageLogs).toHaveLength(0);
        expect(useLabOpsStore.getState().reagents[0].quantity).toBe(10);
        useLabOpsStore.getState().addReagentUsage(usage);
        expect(useLabOpsStore.getState().reagents[0].quantity).toBe(8);
        expect(useLabOpsStore.getState().reagentUsageLogs[0].quantityUsed).toBe(2);
    });
});
