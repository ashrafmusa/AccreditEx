import { ChecklistItem, ComplianceStatus } from "@/types";

export interface ChecklistCompliance {
  complianceRate: number;
  applicableCount: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  notStartedCount: number;
  notApplicableCount: number;
  isAllNotApplicable: boolean;
}

export function calculateChecklistCompliance(
  checklist: Pick<ChecklistItem, "status">[],
  options: { partialCredit?: number } = {},
): ChecklistCompliance {
  const partialCredit = options.partialCredit ?? 0.5;
  if (!Number.isFinite(partialCredit) || partialCredit < 0 || partialCredit > 1) {
    throw new RangeError("partialCredit must be between 0 and 1");
  }

  const counts = {
    compliantCount: 0,
    partiallyCompliantCount: 0,
    nonCompliantCount: 0,
    notStartedCount: 0,
    notApplicableCount: 0,
  };
  for (const item of checklist) {
    switch (item.status) {
      case ComplianceStatus.Compliant:
        counts.compliantCount += 1;
        break;
      case ComplianceStatus.PartiallyCompliant:
        counts.partiallyCompliantCount += 1;
        break;
      case ComplianceStatus.NonCompliant:
        counts.nonCompliantCount += 1;
        break;
      case ComplianceStatus.NotApplicable:
        counts.notApplicableCount += 1;
        break;
      case ComplianceStatus.NotStarted:
        counts.notStartedCount += 1;
        break;
    }
  }

  const applicableCount =
    checklist.length - counts.notApplicableCount;
  const score =
    counts.compliantCount + counts.partiallyCompliantCount * partialCredit;
  return {
    ...counts,
    applicableCount,
    complianceRate:
      applicableCount === 0 ? 0 : (score / applicableCount) * 100,
    isAllNotApplicable:
      checklist.length > 0 && applicableCount === 0,
  };
}

/**
 * Maps a ComplianceStatus value to its translation key.
 * "Non-Compliant" → "nonCompliant", "Partially Compliant" → "partiallyCompliant", etc.
 */
const STATUS_TRANSLATION_KEYS: Record<string, string> = {
    [ComplianceStatus.Compliant]: "compliant",
    [ComplianceStatus.NonCompliant]: "nonCompliant",
    [ComplianceStatus.PartiallyCompliant]: "partiallyCompliant",
    [ComplianceStatus.NotApplicable]: "notApplicable",
    [ComplianceStatus.NotStarted]: "notStarted",
};

export function statusToTranslationKey(status: string): string {
    return STATUS_TRANSLATION_KEYS[status] || status;
}

/**
 * Returns a Tailwind CSS class string for a compliance status badge.
 */
export const STATUS_COLORS: Record<string, string> = {
    [ComplianceStatus.Compliant]:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    [ComplianceStatus.NonCompliant]:
        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    [ComplianceStatus.PartiallyCompliant]:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
    [ComplianceStatus.NotApplicable]:
        "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    [ComplianceStatus.NotStarted]:
        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
};
