import type { User } from "@/types";

jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  where: jest.fn(),
}));

import {
  buildSyntheticDemoSeed,
  DEMO_SEED_ORGANIZATION_ID,
  DEMO_SEED_VERSION,
  getDemoSeedCollectionCounts,
  mergeLabOpsDemoData,
} from "@/services/demoDataSeedService";

const admin: User = {
  id: "admin-uid",
  name: "Accreditex Admin",
  email: "admin@example.invalid",
  role: "Admin",
  organizationId: DEMO_SEED_ORGANIZATION_ID,
};

describe("synthetic Accreditex demo data", () => {
  const now = new Date("2026-10-12T12:00:00.000Z");

  it("restricts seed generation to the target organization and its admin", () => {
    expect(() => buildSyntheticDemoSeed("org-other", admin, now)).toThrow(
      "restricted to Accreditex",
    );
    expect(() =>
      buildSyntheticDemoSeed(DEMO_SEED_ORGANIZATION_ID, {
        ...admin,
        role: "TeamMember",
      }, now),
    ).toThrow("organization admin is required");
    expect(() =>
      buildSyntheticDemoSeed(DEMO_SEED_ORGANIZATION_ID, {
        ...admin,
        organizationId: "org-other",
      }, now),
    ).toThrow("organization admin is required");
  });

  it("builds a linked, marked synthetic dataset without creating fake user or patient records", () => {
    const records = buildSyntheticDemoSeed(
      DEMO_SEED_ORGANIZATION_ID,
      admin,
      now,
    );
    const byId = new Map(records.map((record) => [record.id, record]));
    const project = byId.get("demo-accreditex-marketing-v1-project-accreditation-readiness");
    const program = byId.get("demo-accreditex-marketing-v1-program-demo-accreditation");
    const labOps = byId.get(DEMO_SEED_ORGANIZATION_ID);

    expect(records.length).toBeGreaterThan(40);
    expect(records.every((record) =>
      record.data.organizationId === DEMO_SEED_ORGANIZATION_ID &&
      record.data.demoSeedVersion === DEMO_SEED_VERSION &&
      record.data.syntheticDemo === true,
    )).toBe(true);
    expect(program?.collectionName).toBe("accreditationPrograms");
    expect(project?.collectionName).toBe("projects");
    expect((project?.data.programId)).toBe(program?.id);
    expect(labOps?.collectionName).toBe("labOpsData");
    expect(records.some((record) => record.collectionName === "users")).toBe(false);
    expect(records.some((record) => record.collectionName === "patients")).toBe(false);
    expect(records.some((record) => record.data.email === admin.email)).toBe(false);
  });

  it("keeps project standards, checklist evidence, audit findings, and Lab Ops IDs linked", () => {
    const records = buildSyntheticDemoSeed(
      DEMO_SEED_ORGANIZATION_ID,
      admin,
      now,
    );
    const project = records.find(
      (record) => record.collectionName === "projects",
    );
    const standards = records
      .filter((record) => record.collectionName === "standards")
      .map((record) => record.id);
    const projectData = project?.data as {
      standardIds: string[];
      checklist: Array<{ standardId: string }>;
    };
    const labOps = records.find(
      (record) => record.collectionName === "labOpsData",
    );
    if (!project || !labOps) {
      throw new Error("Expected project and Lab Operations demo records.");
    }
    const labOpsData = labOps?.data as {
      equipment: Array<{ id: string }>;
      iqcAnalytes: Array<{ id: string; equipmentId: string }>;
      iqcResults: Array<{ analyteId: string; equipmentId: string }>;
    };
    const equipmentIds = new Set(labOpsData.equipment.map(({ id }) => id));
    const analyteIds = new Set(
      labOpsData.iqcAnalytes.map(({ id }) => id),
    );

    expect(projectData.standardIds).toEqual(standards);
    expect(projectData.checklist.every((item) =>
      standards.includes(item.standardId),
    )).toBe(true);
    expect(labOpsData.iqcAnalytes.every((analyte) =>
      equipmentIds.has(analyte.equipmentId),
    )).toBe(true);
    expect(labOpsData.iqcResults.every((result) =>
      analyteIds.has(result.analyteId) &&
      equipmentIds.has(result.equipmentId),
    )).toBe(true);
  });

  it("returns stable per-collection preview counts", () => {
    const records = buildSyntheticDemoSeed(
      DEMO_SEED_ORGANIZATION_ID,
      admin,
      now,
    );
    const counts = getDemoSeedCollectionCounts(records);

    expect(counts.branches).toBe(3);
    expect(counts.projects).toBe(1);
    expect(counts.labOpsData).toBe(1);
    expect(counts.trainingPrograms).toBe(3);
  });

  it("preserves existing Lab Operations records and appends demo IDs once", () => {
    const existing = {
      organizationId: DEMO_SEED_ORGANIZATION_ID,
      equipment: [{ id: "real-equipment-1", name: "Existing asset" }],
      iqcResults: [{ id: "existing-result-1" }],
      notes: "Preserve unrelated aggregate fields",
    };
    const seeded = {
      equipment: [
        { id: "demo-equipment-1" },
        { id: "demo-equipment-1" },
      ],
      iqcResults: [{ id: "demo-result-1" }],
    };
    const firstMerge = mergeLabOpsDemoData(
      existing,
      seeded,
      DEMO_SEED_ORGANIZATION_ID,
      true,
      now.toISOString(),
    );
    const secondMerge = mergeLabOpsDemoData(
      firstMerge.data,
      seeded,
      DEMO_SEED_ORGANIZATION_ID,
      true,
      now.toISOString(),
    );

    expect(firstMerge.added).toBe(2);
    expect(secondMerge.added).toBe(0);
    expect(secondMerge.data.notes).toBe(existing.notes);
    expect(secondMerge.data.containsSyntheticDemoData).toBe(true);
    expect(secondMerge.data.syntheticDemo).toBeUndefined();
    expect(secondMerge.data.equipment).toEqual([
      { id: "real-equipment-1", name: "Existing asset" },
      { id: "demo-equipment-1" },
    ]);
    expect(secondMerge.data.iqcResults).toHaveLength(2);
  });

  it("refuses unsafe Lab Operations ownership or malformed arrays", () => {
    expect(() =>
      mergeLabOpsDemoData(
        { organizationId: "org-other" },
        { equipment: [] },
        DEMO_SEED_ORGANIZATION_ID,
        true,
        now.toISOString(),
      ),
    ).toThrow("not owned by Accreditex");
    expect(() =>
      mergeLabOpsDemoData(
        {
          organizationId: DEMO_SEED_ORGANIZATION_ID,
          equipment: "not-an-array",
        },
        { equipment: [] },
        DEMO_SEED_ORGANIZATION_ID,
        true,
        now.toISOString(),
      ),
    ).toThrow('field "equipment" is not an array');
  });
});
