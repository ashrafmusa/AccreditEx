import { generateProjectTemplates } from "@/data/projectTemplates";
import { omanPrivateLabInspectionTemplate } from "@/data/omanPrivateLabInspectionTemplate";
import { ChecklistItem, ComplianceStatus } from "@/types";
import { validateStep2 } from "@/components/projects/wizard/projectValidation";
import { buildProjectChecklist } from "@/utils/projectSetup";
import {
  localizeOmanPilotItem,
  omanPrivateLabInspectionItemsAr,
} from "@/data/omanPrivateLabInspectionTemplateAr";
import {
  omanLabInspectionRating,
  omanLabInspectionScore,
} from "@/utils/omanLabInspectionScoring";

describe("Oman private-laboratory inspection pilot", () => {
  it("offers a self-contained pilot template without importing hospital standards", () => {
    // Arrange
    const programs = [
      { id: "prog-ohap", name: "OHAS", description: { en: "", ar: "" } },
    ];

    // Act
    const template = generateProjectTemplates(programs).find(
      (candidate) => candidate.id === omanPrivateLabInspectionTemplate.id,
    );

    // Assert
    expect(template).toMatchObject({
      programId: "prog-ohap",
      inspectionProfile: "oman-private-lab-2026",
      selfContainedChecklist: true,
    });
    expect(template?.checklist.length).toBeGreaterThanOrEqual(70);
    expect(
      new Set(template?.checklist.map((item) => item.standardId)).size,
    ).toBe(template?.checklist.length);
    expect(
      validateStep2({
        programId: "prog-ohap",
        standardIds: [],
        selfContainedChecklist: true,
      }).isValid,
    ).toBe(true);
    expect(
      validateStep2({
        programId: "prog-ohap",
        standardIds: [],
      }).errors.standardIds,
    ).toBe("setupStandardsRequired");
  });

  it("preserves pilot references, sections, and evidence guidance in project checklist records", () => {
    // Arrange / Act
    const checklist = buildProjectChecklist(
      "prog-ohap",
      [],
      [],
      omanPrivateLabInspectionTemplate.checklist,
    );

    // Assert
    expect(checklist).toHaveLength(omanPrivateLabInspectionTemplate.checklist.length);
    expect(checklist[0]).toMatchObject({
      standardId: "PILOT-STAFF-01",
      category: "Staffing",
      requiredEvidence: ["Current staff roster", "Workload and shift coverage"],
      status: ComplianceStatus.NotStarted,
    });
  });

  it("calculates the MOH-style scoring basis without counting unassessed or N/A items", () => {
    // Arrange
    const item = (
      id: string,
      status: ComplianceStatus,
      overrides: Partial<ChecklistItem> = {},
    ): ChecklistItem => ({
      id,
      status,
      item: id,
      standardId: id,
      assignedTo: "",
      dueDate: "",
      actionPlan: "",
      notes: "",
      evidenceFiles: [],
      comments: [],
      ...overrides,
    });
    const checklist = [
      item("1", ComplianceStatus.Compliant),
      item("2", ComplianceStatus.PartiallyCompliant),
      item("3", ComplianceStatus.NonCompliant),
      item("4", ComplianceStatus.NotApplicable),
      item("5", ComplianceStatus.NotStarted),
    ];

    // Act
    const result = omanLabInspectionScore(checklist);

    // Assert
    expect(result).toMatchObject({
      fullyMet: 1,
      partiallyMet: 1,
      notMet: 1,
      notApplicable: 1,
      unassessed: 1,
      assessed: 3,
      applicable: 4,
      earnedPoints: 1.5,
      maximumAssessedPoints: 3,
      scorePercent: 50,
      coveragePercent: 75,
      unassignedOutstanding: 3,
      gapsWithoutActionPlan: 2,
    });
    expect(omanLabInspectionRating(ComplianceStatus.Compliant)).toBe(1);
    expect(
      omanLabInspectionRating(ComplianceStatus.PartiallyCompliant),
    ).toBe(0.5);
    expect(
      omanLabInspectionRating(ComplianceStatus.NonCompliant),
    ).toBe(0);
    expect(
      omanLabInspectionRating(ComplianceStatus.NotApplicable),
    ).toBeNull();
  });
  it("provides Arabic text for every pilot item with matching evidence counts", () => {
    // Arrange
    const items = omanPrivateLabInspectionTemplate.checklist;

    // Act
    const missing = items.filter((item) => {
      const arabic = omanPrivateLabInspectionItemsAr[item.standardId ?? ""];
      return (
        !arabic ||
        arabic.requiredEvidence.length !== (item.requiredEvidence ?? []).length
      );
    });

    // Assert
    expect(missing.map((item) => item.standardId)).toEqual([]);
  });

  it("shows Arabic for untouched pilot items but keeps user-edited text", () => {
    // Arrange
    const [checklistItem] = buildProjectChecklist(
      "prog-ohap",
      [],
      [],
      omanPrivateLabInspectionTemplate.checklist.slice(0, 1),
      [],
    );
    const arabic =
      omanPrivateLabInspectionItemsAr[checklistItem.standardId];

    // Act
    const untouched = localizeOmanPilotItem(checklistItem, "ar");
    const edited = localizeOmanPilotItem(
      { ...checklistItem, notes: "Local note" },
      "ar",
    );
    const english = localizeOmanPilotItem(checklistItem, "en");

    // Assert
    expect(untouched.item).toBe(arabic.title);
    expect(untouched.notes).toBe(arabic.description);
    expect(untouched.requiredEvidence).toEqual(arabic.requiredEvidence);
    expect(edited.notes).toBe("Local note");
    expect(edited.item).toBe(arabic.title);
    expect(english.item).toBe(checklistItem.item);
  });
});