import { ChecklistItem, ComplianceStatus } from "@/types";

export interface OmanLabInspectionScore {
  fullyMet: number;
  partiallyMet: number;
  notMet: number;
  notApplicable: number;
  unassessed: number;
  applicable: number;
  assessed: number;
  earnedPoints: number;
  maximumAssessedPoints: number;
  scorePercent: number | null;
  coveragePercent: number | null;
  unassignedOutstanding: number;
  gapsWithoutActionPlan: number;
}

export function omanLabInspectionScore(
  checklist: ChecklistItem[],
): OmanLabInspectionScore {
  const fullyMet = checklist.filter(
    (item) => item.status === ComplianceStatus.Compliant,
  ).length;
  const partiallyMet = checklist.filter(
    (item) => item.status === ComplianceStatus.PartiallyCompliant,
  ).length;
  const notMet = checklist.filter(
    (item) => item.status === ComplianceStatus.NonCompliant,
  ).length;
  const notApplicable = checklist.filter(
    (item) => item.status === ComplianceStatus.NotApplicable,
  ).length;
  const unassessed = checklist.filter(
    (item) => item.status === ComplianceStatus.NotStarted,
  ).length;
  const assessed = fullyMet + partiallyMet + notMet;
  const applicable = checklist.length - notApplicable;
  const earnedPoints = fullyMet + partiallyMet * 0.5;
  const outstanding = checklist.filter(
    (item) =>
      item.status === ComplianceStatus.NotStarted ||
      item.status === ComplianceStatus.PartiallyCompliant ||
      item.status === ComplianceStatus.NonCompliant,
  );
  const gaps = checklist.filter(
    (item) =>
      item.status === ComplianceStatus.PartiallyCompliant ||
      item.status === ComplianceStatus.NonCompliant,
  );

  return {
    fullyMet,
    partiallyMet,
    notMet,
    notApplicable,
    unassessed,
    applicable,
    assessed,
    earnedPoints,
    maximumAssessedPoints: assessed,
    scorePercent:
      assessed > 0 ? Math.round((earnedPoints / assessed) * 100) : null,
    coveragePercent:
      applicable > 0 ? Math.round((assessed / applicable) * 100) : null,
    unassignedOutstanding: outstanding.filter(
      (item) => !item.assignedTo?.trim(),
    ).length,
    gapsWithoutActionPlan: gaps.filter(
      (item) => !item.actionPlan?.trim(),
    ).length,
  };
}

export function omanLabInspectionRating(
  status: ComplianceStatus,
): 0 | 0.5 | 1 | null {
  switch (status) {
    case ComplianceStatus.Compliant:
      return 1;
    case ComplianceStatus.PartiallyCompliant:
      return 0.5;
    case ComplianceStatus.NonCompliant:
      return 0;
    case ComplianceStatus.NotApplicable:
    case ComplianceStatus.NotStarted:
      return null;
  }
}
