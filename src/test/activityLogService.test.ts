import { getActivityLogs } from "@/services/activityLogService";
import { getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { getTenantQuery } from "@/utils/tenantQuery";
import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: { now: jest.fn() },
}));
jest.mock("@/utils/tenantQuery", () => ({
  getTenantQuery: jest.fn(),
  getTenantStamp: jest.fn(),
}));

describe("Activity log queries", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses tenant-scoped newest-first filtering and returns stored activity", async () => {
    // Arrange
    jest
      .mocked(getDocs)
      .mockResolvedValue({
        docs: [
          {
            id: "log1",
            data: () => ({
              timestamp: "2026-10-10",
              user: "Alya",
              action: { en: "Updated checklist" },
            }),
          },
        ],
      } as Awaited<ReturnType<typeof getDocs>>);
    // Act
    const logs = await getActivityLogs({
      userId: "u1",
      type: "checklist",
      limitCount: 200,
    });
    // Assert
    expect(getTenantQuery).toHaveBeenCalledWith("activity_logs");
    expect(where).toHaveBeenCalledWith("userId", "==", "u1");
    expect(where).toHaveBeenCalledWith("type", "==", "checklist");
    expect(orderBy).toHaveBeenCalledWith("timestamp", "desc");
    expect(limit).toHaveBeenCalledWith(200);
    expect(query).toHaveBeenCalled();
    expect(logs[0]).toMatchObject({ id: "log1", user: "Alya" });
  });

  it("propagates missing-index errors rather than returning a false empty log", async () => {
    // Arrange
    const error = new Error("The query requires an index");
    jest.mocked(getDocs).mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    // Act / Assert
    await expect(getActivityLogs()).rejects.toBe(error);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("declares tenant indexes for every supported equality-filter combination", () => {
    // Arrange
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "firestore.indexes.json"), "utf8"),
    ) as {
      indexes: {
        collectionGroup: string;
        queryScope: string;
        fields: { fieldPath: string; order: string }[];
      }[];
    };
    // Assert
    for (const filters of [[], ["userId"], ["type"], ["userId", "type"]]) {
      expect(config.indexes).toContainEqual({
        collectionGroup: "activity_logs",
        queryScope: "COLLECTION",
        fields: [
          ...["organizationId", ...filters].map((fieldPath) => ({
            fieldPath,
            order: "ASCENDING",
          })),
          { fieldPath: "timestamp", order: "DESCENDING" },
        ],
      });
    }
  });
});
