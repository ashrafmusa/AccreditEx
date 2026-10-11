import { getLabOpsData, saveLabOpsDataWithRetry, labRecordService, labRecordStorageEnabled } from "@/services/labOpsService";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { SEED_EQUIPMENT, SEED_REAGENTS } from "@/types/labOps";
import { SEED_IQC_RESULTS } from "@/types/labOps";
import type { LabLogCursor } from "@/services/labOpsRecords";
import type { LabRecordState } from "@/services/labOpsRecords";
let mockOrganizationId = "org-a";

jest.mock("@/services/labOpsService", () => ({
    getLabOpsData: jest.fn(), saveLabOpsDataWithRetry: jest.fn(), labRecordStorageEnabled: jest.fn(() => false),
    labRecordService: { state: jest.fn(), page: jest.fn(), write: jest.fn(), save: jest.fn() },
}));
jest.mock("@/stores/useTenantStore", () => ({
    useTenantStore: { getState: () => ({ organizationId: mockOrganizationId }) },
}));

describe("Lab Operations safeguards", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOrganizationId = "org-a";
        jest.mocked(labRecordStorageEnabled).mockReturnValue(false);
        useLabOpsStore.setState({
            equipment: SEED_EQUIPMENT, reagents: SEED_REAGENTS, calibrations: [],
            reagentUsageLogs: [], hasLoadedFromFirestore: false, loadedOrganizationId: null,
            recordMode: false, recordRevision: 0, usageHasMore: false, usageCursor: null, loadingUsage: false,
        });
    });

    it("hydrates complete QC/calculation history while recent usage remains explicitly paged", async () => {
            // Arrange
            jest.mocked(labRecordStorageEnabled).mockReturnValue(true);
            const state = { organizationId: "org-a", ready: true, revision: 1, equipment: [], reagents: [] } as unknown as LabRecordState;
            jest.mocked(labRecordService.state).mockResolvedValue(state);
            const cursor = { id: "cursor" } as LabLogCursor;
            let iqcPage = 0;
            jest.mocked(labRecordService.page).mockImplementation(async (_org, kind, after) => {
                if (kind === "iqcResults") {
                    return { records: [SEED_IQC_RESULTS[iqcPage++]], hasMore: iqcPage === 1, cursor } as Awaited<ReturnType<typeof labRecordService.page>>;
                }
                if (kind === "reagentUsageLogs") return {
                    records: [{ id: after ? "older" : "recent" }], hasMore: !after, cursor,
                } as Awaited<ReturnType<typeof labRecordService.page>>;
                return { records: [], hasMore: false, cursor: null };
            });
            // Act
            await useLabOpsStore.getState().loadFromFirestore();
            // Assert
            expect(useLabOpsStore.getState().iqcResults).toHaveLength(2);
            expect(useLabOpsStore.getState().hasLoadedFromFirestore).toBe(true);
            expect(useLabOpsStore.getState().usageHasMore).toBe(true);
            await useLabOpsStore.getState().loadMoreUsage();
            expect(useLabOpsStore.getState().reagentUsageLogs.map((r) => r.id)).toEqual(["recent", "older"]);
            expect(useLabOpsStore.getState().usageHasMore).toBe(false);
            expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
        });

        it("does not expose incomplete QC history when a later page fails", async () => {
            // Arrange
            jest.mocked(labRecordStorageEnabled).mockReturnValue(true);
            jest.mocked(labRecordService.state).mockResolvedValue({ organizationId: "org-a", ready: true, revision: 0 } as LabRecordState);
            jest.mocked(labRecordService.page).mockResolvedValueOnce({
                records: [SEED_IQC_RESULTS[0]], hasMore: true, cursor: { id: "cursor" } as LabLogCursor,
            }).mockRejectedValueOnce(new Error("page unavailable"));
            // Act
            await useLabOpsStore.getState().loadFromFirestore();
            // Assert
            expect(useLabOpsStore.getState().hasLoadedFromFirestore).toBe(false);
            expect(useLabOpsStore.getState().syncError).toBe("page unavailable");
            expect(labRecordService.write).not.toHaveBeenCalled();
        });

    it("does not initialize or save after a read failure, including manual retry", async () => {
        jest.mocked(getLabOpsData).mockRejectedValue(new Error("offline"));
        await useLabOpsStore.getState().loadFromFirestore();
        await useLabOpsStore.getState().saveToFirestore(true);
        await useLabOpsStore.getState().retrySyncNow();
        expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
        expect(useLabOpsStore.getState().hasLoadedFromFirestore).toBe(false);
    });

    it("rejects an operational write before dispatch when the tenant switches, without queuing it for the new tenant", async () => {
        // Arrange
        useLabOpsStore.setState({
            recordMode: true, hasLoadedFromFirestore: true, loadedOrganizationId: "org-a", syncStatus: "synced",
        });
        const usage = {
            id: "same-id", reagentId: SEED_REAGENTS[0].id, reagentName: "Reagent", usedBy: "QA",
            usageDate: "2026-10-11", quantityUsed: 1, unit: SEED_REAGENTS[0].unit,
        };
        // Act
        const pending = useLabOpsStore.getState().addReagentUsage(usage);
        mockOrganizationId = "org-b";
        // Assert
        await expect(pending).rejects.toThrow("Organization changed");
        expect(labRecordService.write).not.toHaveBeenCalled();
        expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
    });

    it("blocks calculation consumers when a revision changes during history hydration", async () => {
        // Arrange
        jest.mocked(labRecordStorageEnabled).mockReturnValue(true);
        jest.mocked(labRecordService.state)
            .mockResolvedValueOnce({ organizationId: "org-a", ready: true, revision: 1 } as LabRecordState)
            .mockResolvedValueOnce({ organizationId: "org-a", ready: true, revision: 2 } as LabRecordState);
        jest.mocked(labRecordService.page).mockResolvedValue({ records: [], cursor: null, hasMore: false });
        // Act
        await useLabOpsStore.getState().loadFromFirestore();
        // Assert
        expect(useLabOpsStore.getState().hasLoadedFromFirestore).toBe(false);
        expect(useLabOpsStore.getState().syncError).toMatch(/changed during loading/);
    });

    it("discards an old tenant's debounced metadata payload before dispatch", async () => {
        // Arrange
        useLabOpsStore.setState({
            recordMode: true, hasLoadedFromFirestore: true, loadedOrganizationId: "org-a", syncStatus: "synced",
        });
        await useLabOpsStore.getState().saveToFirestore();
        // Act
        mockOrganizationId = "org-b";
        await useLabOpsStore.getState().flushPendingSaves();
        // Assert
        expect(labRecordService.save).not.toHaveBeenCalled();
        expect(saveLabOpsDataWithRetry).not.toHaveBeenCalled();
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

    it("decommissions equipment without removing its associated calibration history and restores it inactive", () => {
        const equipment = SEED_EQUIPMENT[0];
        const calibration = {
            id: "cal-history", equipmentId: equipment.id, equipmentName: equipment.name,
            calibratedBy: "QA", calibrationDate: "2026-10-11", nextDueDate: "2027-01-01",
            result: "pass" as const, createdAt: "2026-10-11",
        };
        useLabOpsStore.setState({ equipment: [equipment], calibrations: [calibration] });

        useLabOpsStore.getState().decommissionEquipment(equipment.id);
        expect(useLabOpsStore.getState().equipment[0].status).toBe("decommissioned");
        expect(useLabOpsStore.getState().calibrations).toEqual([calibration]);

        useLabOpsStore.getState().restoreEquipment(equipment.id);
        expect(useLabOpsStore.getState().equipment[0].status).toBe("inactive");
        expect(useLabOpsStore.getState().calibrations).toEqual([calibration]);
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
