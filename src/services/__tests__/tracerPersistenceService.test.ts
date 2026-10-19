import {
  getTenantTracerTemplates,
  getTracerSessions,
  saveTracerSession,
} from "@/services/tracerPersistenceService";
import { doc, getDocs, setDoc } from "firebase/firestore";

jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("@/utils/tenantQuery", () => ({
  getTenantQuery: jest.fn((name) => ({ collection: name })),
  getTenantStamp: jest.fn(() => ({ organizationId: "org-1" })),
}));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db: unknown, ...parts: string[]) => parts.join("/")),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
}));

describe("Tracer persistence", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads tracer sessions through the tenant query", async () => {
    jest.mocked(getDocs).mockResolvedValue({
      docs: [{ id: "session-1", data: () => ({ status: "in_progress" }) }],
    } as Awaited<ReturnType<typeof getDocs>>);

    await expect(getTracerSessions()).resolves.toEqual([
      { id: "session-1", status: "in_progress" },
    ]);
  });

  it("namespaces built-in template IDs by tenant", () => {
    expect(
      getTenantTracerTemplates([
        {
          id: "default",
          name: "Default",
          tracerType: "patient",
          description: "Template",
          steps: [],
          createdAt: "2026-01-01",
        },
      ]),
    ).toEqual([
      {
        id: "org-1_default",
        name: "Default",
        tracerType: "patient",
        description: "Template",
        steps: [],
        createdAt: "2026-01-01",
      },
    ]);
  });

  it("stamps saved tracer sessions and rejects unsafe document IDs", async () => {
    const session = {
      id: "session-1",
      templateId: "template-1",
      tracerType: "patient" as const,
      title: "Patient tracer",
      surveyorId: "user-1",
      date: "2026-01-01",
      steps: [],
      status: "in_progress" as const,
      createdAt: "2026-01-01",
    };
    await saveTracerSession(session);
    expect(doc).toHaveBeenCalledWith({}, "tracerSessions", "session-1");
    expect(setDoc).toHaveBeenCalledWith(
      "tracerSessions/session-1",
      expect.objectContaining({
        id: "session-1",
        organizationId: "org-1",
      }),
      { merge: true },
    );
    await expect(
      saveTracerSession({ ...session, id: "bad/id" }),
    ).rejects.toThrow("valid document ID");
  });
});
