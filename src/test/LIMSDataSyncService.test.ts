import { LIMSDataSyncService } from "@/services/limsIntegration/LIMSDataSyncService";
import { LIMSConnectorFactory } from "@/services/limsIntegration/LIMSConnectorFactory";
import { AuthType, LIMSType, SyncStatus } from "@/services/limsIntegration/types";

describe("LIMSDataSyncService", () => {
  const config = {
    id: "lims-a",
    name: "Test LIMS",
    type: LIMSType.GENERIC_REST,
    baseUrl: "https://lims.example.test",
    authType: AuthType.API_KEY,
    enabled: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("recreates a connector when config changes or is invalidated", () => {
    const first = { config, connect: jest.fn(), disconnect: jest.fn() };
    const second = {
      config: { ...config, baseUrl: "https://other.example.test" },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const createConnector = jest
      .spyOn(LIMSConnectorFactory, "createConnector")
      .mockReturnValueOnce(first as never)
      .mockReturnValueOnce(second as never)
      .mockReturnValueOnce(first as never);
    const service = new LIMSDataSyncService();

    expect(service.getConnector(config)).toBe(first);
    expect(service.getConnector({ ...config, baseUrl: "https://other.example.test" })).toBe(second);
    service.invalidateConnector(config.id);
    expect(service.getConnector(config)).toBe(first);
    expect(createConnector).toHaveBeenCalledTimes(3);
  });

  it("disconnects after sync fetch failures and reports the failed sync", async () => {
    const connector = {
      config,
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      fetchResults: jest.fn().mockRejectedValue(new Error("results unavailable")),
      fetchSpecimens: jest.fn().mockResolvedValue([]),
      fetchOrders: jest.fn().mockResolvedValue([]),
      fetchQCData: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(LIMSConnectorFactory, "createConnector").mockReturnValue(connector as never);
    const service = new LIMSDataSyncService();

    const result = await service.syncAll(config);

    expect(connector.disconnect).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(SyncStatus.ERROR);
    expect(result.errorCount).toBe(1);
  });
});
