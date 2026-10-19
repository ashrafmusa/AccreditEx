import { AnalyticsService } from "@/services/hisIntegration/AnalyticsService";
import { DataMappingService } from "@/services/hisIntegration/DataMappingService";

describe("HIS integration services", () => {
  it("uses bidirectional mappings for inbound and outbound transforms", () => {
    const service = new DataMappingService();
    service.createMapping({
      localField: "patient.displayName",
      hisField: "display",
      resourceType: "TestPatient",
      direction: "both",
      required: false,
    });

    expect(
      service.transformInbound(
        { resourceType: "TestPatient", display: "Amina" },
        "TestPatient",
      ),
    ).toEqual({ patient: { displayName: "Amina" } });
    expect(
      service.transformOutbound(
        { patient: { displayName: "Amina" } },
        "TestPatient",
      ),
    ).toEqual({ display: "Amina" });
  });

  it("returns the overall health score on a 0-100 scale", () => {
    const service = new AnalyticsService();
    service.recordSyncMetric({
      configId: "test",
      duration: 10,
      recordsProcessed: 1,
      recordsSuccessful: 1,
      recordsFailed: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      status: "success",
    });

    expect(service.calculateHealthScore("test").overall).toBe(100);
  });
});
