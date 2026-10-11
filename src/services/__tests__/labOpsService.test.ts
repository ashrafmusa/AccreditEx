import { getDocs, setDoc } from "firebase/firestore";
import { TextEncoder } from "node:util";
import { getLabOpsData, saveLabOpsData, labRecordStorageEnabled, type LabOpsPersistedData } from "@/services/labOpsService";

jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("@/stores/useTenantStore", () => ({
    useTenantStore: { getState: () => ({ organizationId: "org-a" }) },
}));
jest.mock("firebase/firestore", () => ({
    collection: jest.fn((_db, path) => path),
    doc: jest.fn((_db, collection, id) => `${collection}/${id}`),
    query: jest.fn((...args) => args),
    where: jest.fn((...args) => args),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
}));
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });

const data: LabOpsPersistedData = {
    equipment: [], calibrations: [], maintenanceLogs: [], reagents: [], reagentUsageLogs: [],
    proficiencyTests: [], qualityEvents: [], capaRecords: [], qualityRisks: [],
    competencyRecords: [], iqcAnalytes: [], iqcResults: [],
};

describe("Lab Operations persistence", () => {
    beforeEach(() => jest.clearAllMocks());

    it("keeps production record mode off even when the environment flag is true", () => {
        // Arrange
        const originalMode = process.env.NODE_ENV;
        const originalGate = process.env.VITE_LAB_RECORD_STORAGE;
        try {
            process.env.VITE_LAB_RECORD_STORAGE = "true";
            process.env.NODE_ENV = "production";
            // Act / Assert
            expect(labRecordStorageEnabled()).toBe(false);
            process.env.NODE_ENV = "development";
            expect(labRecordStorageEnabled()).toBe(true);
            delete process.env.VITE_LAB_RECORD_STORAGE;
            expect(labRecordStorageEnabled()).toBe(false);
        } finally {
            process.env.NODE_ENV = originalMode;
            if (originalGate === undefined) delete process.env.VITE_LAB_RECORD_STORAGE;
            else process.env.VITE_LAB_RECORD_STORAGE = originalGate;
        }
    });

    it("writes each organization to a distinct canonical path", async () => {
        await saveLabOpsData(data, "org-a");
        await saveLabOpsData(data, "org-b");
        expect(setDoc).toHaveBeenNthCalledWith(1, "labOpsData/org-a", expect.objectContaining({ organizationId: "org-a" }), { merge: true });
        expect(setDoc).toHaveBeenNthCalledWith(2, "labOpsData/org-b", expect.objectContaining({ organizationId: "org-b" }), { merge: true });
    });

    it("omits undefined optional fields before writing nested records to Firestore", async () => {
        const dataWithOptionalFields = {
            ...data,
            equipment: [{
                id: "equipment-1",
                name: "Analyzer",
                optionalField: undefined,
                nested: { absent: undefined, present: "value" },
            }],
        } as unknown as LabOpsPersistedData;

        await saveLabOpsData(dataWithOptionalFields, "org-a");

        expect(setDoc).toHaveBeenCalledWith(
            "labOpsData/org-a",
            expect.objectContaining({
                equipment: [{
                    id: "equipment-1",
                    name: "Analyzer",
                    nested: { present: "value" },
                }],
            }),
            { merge: true },
        );
    });

    it("distinguishes a missing record from a failed read", async () => {
        jest.mocked(getDocs).mockResolvedValueOnce({ empty: true } as Awaited<ReturnType<typeof getDocs>>);
        expect(await getLabOpsData()).toBeNull();
        jest.mocked(getDocs).mockRejectedValueOnce(new Error("offline"));
        await expect(getLabOpsData()).rejects.toThrow("offline");
        expect(setDoc).not.toHaveBeenCalled();
    });

    it("loads legacy records but refuses ambiguous duplicates", async () => {
        jest.mocked(getDocs).mockResolvedValueOnce({
            empty: false, docs: [{ id: "default", data: () => data }],
        } as unknown as Awaited<ReturnType<typeof getDocs>>);
        expect(await getLabOpsData()).toEqual(data);
        jest.mocked(getDocs).mockResolvedValueOnce({
            empty: false, docs: [{ id: "one", data: () => data }, { id: "two", data: () => data }],
        } as unknown as Awaited<ReturnType<typeof getDocs>>);
        await expect(getLabOpsData()).rejects.toThrow("Multiple legacy");
    });

    it("rejects missing tenant context and oversized aggregates before writing", async () => {
        await expect(saveLabOpsData(data, "")).rejects.toThrow("active organization");
        const oversized = { ...data, equipment: [{ notes: "x".repeat(900_001) }] } as unknown as LabOpsPersistedData;
        await expect(saveLabOpsData(oversized)).rejects.toThrow("document limit");
        expect(setDoc).not.toHaveBeenCalled();
    });
});
