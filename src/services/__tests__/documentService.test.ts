import { addDocumentWithProjectEvidence } from "@/services/documentService";
import { runTransaction } from "firebase/firestore";

jest.mock("@/firebase/firebaseConfig", () => ({
  db: {},
  auth: { currentUser: { uid: "user-1" } },
}));
jest.mock("@/services/freeTierMonitor", () => ({
  freeTierMonitor: { recordRead: jest.fn(), recordWrite: jest.fn() },
}));
jest.mock("@/services/storageService", () => ({ storageService: {} }));
jest.mock("@/services/cloudinaryService", () => ({ cloudinaryService: {} }));
jest.mock("@/utils/tenantQuery", () => ({
  getTenantQuery: jest.fn(),
  getTenantStamp: () => ({ organizationId: "org-1" }),
  getTenantCollection: jest.fn(),
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "documents-collection"),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn((...args: unknown[]) =>
    args.length === 1 ? { id: "new-document-id" } : `${args[1]}/${args[2]}`,
  ),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  runTransaction: jest.fn(),
}));

const projectSnapshot = (checklist: unknown[]) => ({
  exists: () => true,
  data: () => ({ checklist }),
});

describe("addDocumentWithProjectEvidence", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates the document and links it to the checklist in one transaction", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue(
        projectSnapshot([
          { id: "item-1", evidenceFiles: ["existing-document"] },
          { id: "item-2", evidenceFiles: [] },
        ]),
      ),
      set: jest.fn(),
      update: jest.fn(),
    };
    jest.mocked(runTransaction).mockImplementation(async (_db, callback) =>
      callback(transaction as never),
    );

    const result = await addDocumentWithProjectEvidence(
      {
        name: { en: "Evidence", ar: "دليل" },
        type: "Evidence",
        isControlled: false,
        status: "Draft",
        content: null,
        currentVersion: 1,
        uploadedAt: "2026-10-18",
        projectId: "project-1",
      },
      "project-1",
      "item-1",
    );

    expect(transaction.set).toHaveBeenCalledWith(
      { id: "new-document-id" },
      expect.objectContaining({ projectId: "project-1", organizationId: "org-1" }),
    );
    expect(transaction.update).toHaveBeenCalledWith(
      "projects/project-1",
      expect.objectContaining({
        checklist: [
          {
            id: "item-1",
            evidenceFiles: ["existing-document", "new-document-id"],
          },
          { id: "item-2", evidenceFiles: [] },
        ],
      }),
    );
    expect(result).toMatchObject({ id: "new-document-id", projectId: "project-1" });
  });

  it("does not write either record when the checklist item is missing", async () => {
    const transaction = {
      get: jest.fn().mockResolvedValue(projectSnapshot([{ id: "other-item" }])),
      set: jest.fn(),
      update: jest.fn(),
    };
    jest.mocked(runTransaction).mockImplementation(async (_db, callback) =>
      callback(transaction as never),
    );

    await expect(
      addDocumentWithProjectEvidence(
        {
          name: { en: "Evidence", ar: "دليل" },
          type: "Evidence",
          isControlled: false,
          status: "Draft",
          content: null,
          currentVersion: 1,
          uploadedAt: "2026-10-18",
        },
        "project-1",
        "missing-item",
      ),
    ).rejects.toThrow("Checklist item not found");

    expect(transaction.set).not.toHaveBeenCalled();
    expect(transaction.update).not.toHaveBeenCalled();
  });
});
