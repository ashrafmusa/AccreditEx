import { act, renderHook } from "@testing-library/react";
import { getPendingSyncCount, getPendingSyncQueue, pruneOldCache } from "@/services/offlineStorage";
import { useOfflineSync } from "@/hooks/useOfflineSync";

jest.mock("@/services/offlineStorage", () => ({
  getPendingSyncCount: jest.fn(),
  getPendingSyncQueue: jest.fn(),
  pruneOldCache: jest.fn(),
}));

describe("useOfflineSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    (getPendingSyncCount as jest.Mock).mockResolvedValue(1);
    (getPendingSyncQueue as jest.Mock).mockResolvedValue([
      {
        id: 7,
        collection: "projects",
        operation: "update",
        data: { name: "Unsynced" },
        timestamp: 1,
        retries: 0,
      },
    ]);
    (pruneOldCache as jest.Mock).mockResolvedValue(0);
  });

  it("retains queued mutations and reports that remote sync was not performed", async () => {
    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.processQueue();
    });

    expect(getPendingSyncQueue).toHaveBeenCalledTimes(1);
    expect(result.current.pendingCount).toBe(1);
    expect(result.current.lastSyncAt).toBeNull();
    expect(result.current.syncError).toBe("offlineSyncUnavailable");
    expect(pruneOldCache).toHaveBeenCalledTimes(1);
  });
});
