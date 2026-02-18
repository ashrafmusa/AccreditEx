import { ComplianceStatus } from "@/types";

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
