import { ComplianceStatus } from "@/types";
import { calculateChecklistCompliance } from "@/utils/complianceUtils";

describe("calculateChecklistCompliance", () => {
  it("weights partial compliance and excludes not-applicable items", () => {
    // Arrange
    const checklist = [
      { status: ComplianceStatus.Compliant },
      { status: ComplianceStatus.PartiallyCompliant },
      { status: ComplianceStatus.NonCompliant },
      { status: ComplianceStatus.NotStarted },
      { status: ComplianceStatus.NotApplicable },
    ];

    // Act
    const result = calculateChecklistCompliance(checklist);

    // Assert
    expect(result.complianceRate).toBe(37.5);
    expect(result.applicableCount).toBe(4);
    expect(result.isAllNotApplicable).toBe(false);
  });

  it("returns zero and marks an all-not-applicable checklist explicitly", () => {
    const result = calculateChecklistCompliance([
      { status: ComplianceStatus.NotApplicable },
      { status: ComplianceStatus.NotApplicable },
    ]);

    expect(result.complianceRate).toBe(0);
    expect(result.applicableCount).toBe(0);
    expect(result.isAllNotApplicable).toBe(true);
  });

  it("validates configurable partial credit", () => {
    expect(() =>
      calculateChecklistCompliance([], { partialCredit: Number.NaN }),
    ).toThrow(RangeError);
  });
});
