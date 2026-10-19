import {
  deleteTrainingHubRecord,
  getTrainingHubRecords,
  saveTrainingHubRecord,
} from "@/services/trainingHubPersistenceService";
import { deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";

jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("@/utils/tenantQuery", () => ({
  getTenantQuery: jest.fn((name) => ({ collection: name })),
  getTenantStamp: jest.fn(() => ({ organizationId: "org-1" })),
}));
jest.mock("firebase/firestore", () => ({
  deleteDoc: jest.fn(),
  doc: jest.fn((_db: unknown, ...parts: string[]) => parts.join("/")),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
}));

describe("Training Hub persistence", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads records through the tenant-scoped collection query", async () => {
    jest.mocked(getDocs).mockResolvedValue({
      docs: [{ id: "cap-1", data: () => ({ userId: "user-1" }) }],
    } as Awaited<ReturnType<typeof getDocs>>);

    await expect(getTrainingHubRecords("capAssessments")).resolves.toEqual([
      { id: "cap-1", userId: "user-1" },
    ]);
  });

  it("stamps writes with the active organization", async () => {
    await saveTrainingHubRecord("ceCredits", { id: "credit-1", userId: "u1" });
    expect(doc).toHaveBeenCalledWith({}, "ceCredits", "credit-1");
    expect(setDoc).toHaveBeenCalledWith(
      "ceCredits/credit-1",
      expect.objectContaining({ organizationId: "org-1" }),
      { merge: true },
    );
  });

  it("rejects unsafe IDs and deletes scoped records by exact ID", async () => {
    await expect(
      saveTrainingHubRecord("learningPaths", { id: "../x" }),
    ).rejects.toThrow("valid document ID");
    await deleteTrainingHubRecord("smcsCompetencies", "record-1");
    expect(deleteDoc).toHaveBeenCalledWith("smcsCompetencies/record-1");
  });
});
