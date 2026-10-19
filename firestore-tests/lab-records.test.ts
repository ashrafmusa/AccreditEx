import { readFileSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import { createLabRecordService, labMetadata } from "../src/services/labOpsRecords";
import type { LabOpsPersistedData } from "../src/services/labOpsService";
import { SEED_EQUIPMENT, SEED_REAGENTS, SEED_IQC_RESULTS, SEED_MAINTENANCE_LOGS, SEED_CALIBRATION_RECORDS } from "../src/types/labOps";
jest.setTimeout(30_000);

const migration = require("../scripts/migrations/lab-operations-records.cjs") as {
    backupLabOperations: (db: ReturnType<typeof getFirestore>, org: string, path: string) => Promise<unknown>;
    migrateLabOperations: (db: ReturnType<typeof getFirestore>, org: string, backup: unknown, options?: { chunkSize?: number; stopAfterChunks?: number }) => Promise<{ ready: boolean; offset: number; total: number }>;
};

describe("Lab record migration and transactional operations", () => {
    let env: RulesTestEnvironment;
    const app = initializeApp({ projectId: "demo-accreditex-rules" }, "lab-record-migration");
    const admin = getFirestore(app);
    const file = resolve("lab-migration-backups", "emulator-test.json");
    const client = (org = "org-a", role = "Admin") =>
        env.authenticatedContext(`${org}-${role}`, { role, organizationId: org }).firestore() as unknown as Firestore;
    const data: LabOpsPersistedData = {
        equipment: [{ ...SEED_EQUIPMENT[0], lastCalibrationDate: "2026-01-01", status: "calibration_due" }],
        reagents: [{ ...SEED_REAGENTS[0], quantity: 10, status: "in_stock", qualityFlag: "normal" }],
        calibrations: [], maintenanceLogs: [], reagentUsageLogs: [], iqcResults: [],
        iqcAnalytes: [], proficiencyTests: [], qualityEvents: [], capaRecords: [], qualityRisks: [], competencyRecords: [],
    };
    const usage = (id: string, quantityUsed = 2) => ({
        id, reagentId: data.reagents[0].id, reagentName: "Reagent", usedBy: "QA", usageDate: "2026-10-11",
        quantityUsed, unit: data.reagents[0].unit,
    });
    async function backup(source = data) {
        await admin.doc("labOpsData/org-a").set(JSON.parse(JSON.stringify({ ...source, organizationId: "org-a" })));
        try { unlinkSync(file); } catch { /* absent fixture */ }
        await migration.backupLabOperations(admin, "org-a", file);
        return JSON.parse(readFileSync(file, "utf8")) as unknown;
    }
    beforeAll(async () => {
        mkdirSync(resolve("lab-migration-backups"), { recursive: true });
        env = await initializeTestEnvironment({
            projectId: "demo-accreditex-rules", firestore: { rules: readFileSync(resolve("firestore.rules"), "utf8") },
        });
    });
    beforeEach(async () => { await env.clearFirestore(); });
    afterAll(async () => {
        try { unlinkSync(file); } catch { /* absent fixture */ }
        await env.cleanup();
        await deleteApp(app);
    });

    it("resumes atomic chunks, preserves the aggregate, isolates tenants and tolerates concurrent retries", async () => {
        // Arrange
        const source = { ...data, reagentUsageLogs: Array.from({ length: 5 }, (_, i) => usage(`legacy-${i}`)) };
        const saved = await backup(source);
        await admin.doc("labOpsData/org-b").set({ organizationId: "org-b", private: "unrelated" });
        const before = (await admin.doc("labOpsData/org-a").get()).data();
        // Act
        expect(await migration.migrateLabOperations(admin, "org-a", saved, { chunkSize: 2, stopAfterChunks: 1 }))
            .toEqual({ ready: false, offset: 2, total: 5 });
        await assertFails(getDoc(doc(client(), "labOpsRecords/org-a")));
        await assertFails(updateDoc(doc(client(), "labOpsData/org-a"), { equipment: [] }));
        await Promise.all([migration.migrateLabOperations(admin, "org-a", saved), migration.migrateLabOperations(admin, "org-a", saved)]);
        // Assert
        expect((await admin.doc("labOpsData/org-a").get()).data()).toEqual(before);
        expect((await admin.doc("labOpsRecords/org-b").get()).exists).toBe(false);
        expect((await admin.doc("labOpsData/org-b").get()).data()).toEqual({ organizationId: "org-b", private: "unrelated" });
        expect((await admin.collection("labOpsRecords/org-a/reagentUsageLogs").get()).size).toBe(5);
        await expect(migration.migrateLabOperations(admin, "org-b", saved)).rejects.toThrow("tenant mismatch");
    });

    it("fails closed on a changed source and duplicate IDs without activating partial data", async () => {
        // Arrange
        const saved = await backup({ ...data, reagentUsageLogs: [usage("one"), usage("two")] });
        await migration.migrateLabOperations(admin, "org-a", saved, { chunkSize: 1, stopAfterChunks: 1 });
        // Act
        await admin.doc("labOpsData/org-a").update({ equipment: [] });
        // Assert
        await expect(migration.migrateLabOperations(admin, "org-a", saved)).rejects.toThrow("source changed");
        expect((await admin.doc("labOpsRecords/org-a").get()).data()?.ready).toBe(false);
        await expect(backup({ ...data, reagentUsageLogs: [usage("duplicate"), usage("duplicate")] })).rejects.toThrow("duplicate");
    });

    it("copies and verifies all four log kinds and retains exact legacy payloads", async () => {
        // Arrange
        const source = { ...data, iqcResults: SEED_IQC_RESULTS.slice(0, 2), maintenanceLogs: SEED_MAINTENANCE_LOGS.slice(0, 2),
            calibrations: SEED_CALIBRATION_RECORDS.slice(0, 2), reagentUsageLogs: [usage("legacy")] };
        const saved = await backup(source);
        // Act
        await migration.migrateLabOperations(admin, "org-a", saved, { chunkSize: 1 });
        // Assert
        const service = createLabRecordService(client());
        for (const kind of ["iqcResults", "maintenanceLogs", "calibrations", "reagentUsageLogs"] as const) {
            const page = await service.page("org-a", kind);
            expect(page.records).toHaveLength(source[kind].length);
            expect(page.records).toEqual(expect.arrayContaining(JSON.parse(JSON.stringify(source[kind])) as unknown[]));
        }
        expect((await admin.doc("labOpsData/org-a").get()).data()).toEqual(JSON.parse(JSON.stringify({ ...source, organizationId: "org-a" })));
    });

    it("keeps concurrent inventory usage exact and retries idempotent; rejects stale metadata", async () => {
        // Arrange
        const saved = await backup();
        await migration.migrateLabOperations(admin, "org-a", saved);
        const service = createLabRecordService(client());
        // Act
        await Promise.all([
            service.write("org-a", "reagentUsageLogs", usage("usage-a"), 0),
            service.write("org-a", "reagentUsageLogs", usage("usage-b"), 0),
        ]);
        await service.write("org-a", "reagentUsageLogs", usage("usage-a"), 0);
        await migration.migrateLabOperations(admin, "org-a", saved);
        // Assert
        expect((await service.state("org-a")).reagents[0].quantity).toBe(6);
        expect((await service.state("org-a")).revision).toBe(2);
        await expect(service.write("org-a", "reagentUsageLogs", usage("usage-a", 3), 2)).rejects.toThrow("Conflicting");
        await expect(service.write("org-a", "reagentUsageLogs", usage("excess", 7), 2)).rejects.toThrow("Invalid reagent");
        await expect(service.save("org-a", data, 0)).rejects.toThrow("changed");
        expect((await service.state("org-a")).reagents[0].quantity).toBe(6);
        await expect(service.write("org-b", "reagentUsageLogs", usage("cross"), 0)).rejects.toThrow();
    });

    it("updates calibration restrictions transactionally and never reactivates decommissioned assets", async () => {
        // Arrange
        await migration.migrateLabOperations(admin, "org-a", await backup());
        const service = createLabRecordService(client());
        const cal = { id: "cal-fail", equipmentId: data.equipment[0].id, equipmentName: "Analyzer", calibratedBy: "QA",
            calibrationDate: "2026-10-11", nextDueDate: "2027-01-01", result: "fail" as const, createdAt: "2026-10-11" };
        // Act
        await service.write("org-a", "calibrations", cal, 0);
        await service.write("org-a", "calibrations", cal, 0);
        // Assert
        expect((await service.state("org-a")).equipment[0].status).toBe("calibration_due");
        await service.write("org-a", "calibrations", { ...cal, id: "cal-pass", result: "pass" }, 1);
        expect((await service.state("org-a")).equipment[0].status).toBe("active");
        const state = await service.state("org-a");
        await service.save("org-a", { ...data, ...labMetadata({ ...data, equipment: [{ ...state.equipment[0], status: "decommissioned" }] }) }, state.revision);
        await service.write("org-a", "calibrations", { ...cal, id: "decommissioned-pass", result: "pass" }, 3);
        expect((await service.state("org-a")).equipment[0].status).toBe("decommissioned");
        await expect(service.write("org-a", "calibrations", { ...cal, id: "backdated", calibrationDate: "2025-01-01" }, 4)).rejects.toThrow("Backdated");
    });

    it("paginates equal-date records without omissions or duplicates and bounds each page", async () => {
        // Arrange
        await migration.migrateLabOperations(admin, "org-a", await backup({
            ...data, reagentUsageLogs: Array.from({ length: 55 }, (_, i) => usage(`legacy-${String(i).padStart(3, "0")}`)),
        }));
        const service = createLabRecordService(client());
        // Act
        const first = await service.page("org-a", "reagentUsageLogs", null, 25);
        const second = await service.page("org-a", "reagentUsageLogs", first.cursor, 25);
        const third = await service.page("org-a", "reagentUsageLogs", second.cursor, 25);
        // Assert
        expect([first.records.length, second.records.length, third.records.length]).toEqual([25, 25, 5]);
        expect([first.hasMore, second.hasMore, third.hasMore]).toEqual([true, true, false]);
        expect(new Set([...first.records, ...second.records, ...third.records].map((r) => r.id)).size).toBe(55);
    });

    it("enforces tenant claims, admin permissions, frozen rollback source and atomic log writes", async () => {
        // Arrange
        await migration.migrateLabOperations(admin, "org-a", await backup());
        const path = "labOpsRecords/org-a";
        // Act / Assert
        await assertSucceeds(getDoc(doc(client("org-a", "TeamMember"), path)));
        await assertFails(updateDoc(doc(client("org-a", "TeamMember"), path), { revision: 1 }));
        await assertFails(getDoc(doc(client("org-b"), path)));
        const noClaim = env.authenticatedContext("no-tenant", { role: "Admin" }).firestore() as unknown as Firestore;
        await assertFails(getDoc(doc(noClaim, path)));
        await assertFails(setDoc(doc(client(), `${path}/reagentUsageLogs/not-atomic`), { organizationId: "org-a", record: usage("not-atomic"), sortAt: "2026-10-11" }));
        await assertFails(updateDoc(doc(client(), path), { ready: false, revision: 1 }));
        await assertFails(updateDoc(doc(client(), "labOpsData/org-a"), { equipment: [] }));
        await assertFails(setDoc(doc(client(), "labOpsRecords/org-b"), { organizationId: "org-b", ready: true, revision: 0 }));
    });

    it("commits a bulk QC import with one atomic revision", async () => {
        await migration.migrateLabOperations(admin, "org-a", await backup());
        const service = createLabRecordService(client());
        const initial = await service.state("org-a");
        const records = [
            { ...SEED_IQC_RESULTS[0], id: "bulk-qc-1" },
            { ...SEED_IQC_RESULTS[1], id: "bulk-qc-2" },
        ];

        const next = await service.writeMany(
            "org-a",
            "iqcResults",
            records,
            initial.revision,
        );
        const page = await service.page("org-a", "iqcResults");

        expect(next.revision).toBe(initial.revision + 1);
        expect(page.records.map((record) => record.id)).toEqual(
            expect.arrayContaining(["bulk-qc-1", "bulk-qc-2"]),
        );
    });

    it("commits rejected QC results and linked lab metadata in one transaction", async () => {
        await migration.migrateLabOperations(admin, "org-a", await backup());
        const service = createLabRecordService(client());
        const initial = await service.state("org-a");
        const reagent = initial.reagents[0];
        const result = {
            ...SEED_IQC_RESULTS[0],
            id: "atomic-rejected-qc",
            rejected: true,
            reagentLot: reagent.lotNumber,
            linkedRiskRecordId: "atomic-rejected-qc-risk",
            linkedCapaId: "atomic-rejected-qc-capa",
        };
        const nextData: LabOpsPersistedData = {
            ...data,
            reagents: [{ ...reagent, status: "quarantine", qualityFlag: "under_investigation" }],
            qualityRisks: [{
                id: result.linkedRiskRecordId,
                relatedCapaId: result.linkedCapaId,
                title: "IQC instability",
                hazard: "Reagent instability",
                potentialHarm: "Inaccurate patient results",
                labSection: result.labSection,
                owner: "Quality Manager",
                likelihood: 4,
                impact: 5,
                riskScore: 20,
                riskLevel: "critical",
                status: "open",
                createdAt: result.createdAt,
                updatedAt: result.createdAt,
            }],
            capaRecords: [{
                id: result.linkedCapaId,
                title: "Investigate reagent lot",
                owner: "Section Supervisor",
                dueDate: "2026-10-18",
                status: "open",
                actionPlan: "Quarantine and investigate the reagent lot",
                createdAt: result.createdAt,
                updatedAt: result.createdAt,
            }],
        };

        const revision = await service.writeIQCResultWithMetadata(
            "org-a",
            result,
            nextData,
            initial.revision,
        );
        const savedState = await service.state("org-a");

        expect(revision).toBe(initial.revision + 1);
        expect((await service.page("org-a", "iqcResults")).records).toContainEqual(result);
        expect(savedState.reagents[0]).toMatchObject({
            status: "quarantine",
            qualityFlag: "under_investigation",
        });
        expect(savedState.qualityRisks.map((record) => record.id)).toContain(result.linkedRiskRecordId);
        expect(savedState.capaRecords.map((record) => record.id)).toContain(result.linkedCapaId);
        await expect(service.writeIQCResultWithMetadata(
            "org-a",
            { ...result, id: "stale-qc" },
            nextData,
            initial.revision,
        )).rejects.toThrow("changed");
        expect((await service.page("org-a", "iqcResults")).records.map((record) => record.id))
            .not.toContain("stale-qc");
    });
});
