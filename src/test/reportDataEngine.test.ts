jest.mock("@/stores/useAppStore", () => ({
  useAppStore: { getState: () => ({}) },
}));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: { getState: () => ({ projects: [] }) },
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: { getState: () => ({ users: [] }) },
}));
jest.mock("@/stores/useTenantStore", () => ({
  useTenantStore: { getState: () => ({ organizationId: "org-1" }) },
}));
jest.mock("@/services/qualityRoundingService", () => ({
  calculateComplianceRate: jest.fn(() => 75),
  calculateOverallScore: jest.fn(() => 80),
  getQualityRounds: jest.fn(),
}));
jest.mock("jspdf", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("jspdf-autotable", () => ({ __esModule: true, default: jest.fn() }));

import { aggregate, resolveDataSource } from "@/services/reportDataEngine";
import type { QualityRound } from "@/types";

describe("report data engine compliance metrics", () => {
  it("calculates weighted compliance while excluding not-applicable statuses", () => {
    const records = [
      { status: "Compliant" },
      { status: "Partially Compliant" },
      { status: "Non-Compliant" },
      { status: "Not Applicable" },
    ];

    expect(aggregate(records, "status", "compliance_rate")).toBe(50);
  });

  it("averages numeric compliance rates", () => {
    expect(
      aggregate(
        [{ complianceRate: 50 }, { complianceRate: 100 }],
        "complianceRate",
        "compliance_rate",
      ),
    ).toBe(75);
  });

  it("resolves quality rounds into report-builder field names", () => {
    const round: QualityRound = {
      id: "round-1",
      templateId: "template-1",
      templateName: "Safety",
      department: "Emergency",
      scheduledDate: "2026-10-18",
      status: "Completed",
      frequency: "Monthly",
      rounderId: "user-1",
      rounderName: "Reviewer",
      observations: [],
      findings: [],
      overallScore: 80,
      complianceRate: 75,
      createdAt: "2026-10-18",
    };

    expect(resolveDataSource("quality_rounds", { qualityRounds: [round] })).toEqual([
      expect.objectContaining({
        id: "round-1",
        date: "2026-10-18",
        findings: 0,
        score: 80,
        complianceRate: 75,
      }),
    ]);
  });
});
