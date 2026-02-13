import {
    buildCrossStandardMappingSummary,
    getRelatedCrosswalkStandards,
    suggestReusableEvidenceForChecklistItem,
} from "@/services/crossStandardMappingService";
import type { AccreditationProgram, Standard } from "@/types";

describe("crossStandardMappingService", () => {
    const programs: AccreditationProgram[] = [
        {
            id: "jci",
            name: "JCI",
            description: { en: "Joint Commission", ar: "" },
        },
        {
            id: "cbahi",
            name: "CBAHI",
            description: { en: "Saudi Accreditation", ar: "" },
        },
        {
            id: "iso",
            name: "ISO 9001",
            description: { en: "Quality Management", ar: "" },
        },
    ];

    const standards: Standard[] = [
        {
            id: "s1",
            standardId: "JCI-IPC-01",
            programId: "jci",
            section: "Infection Prevention",
            description: "Hand hygiene training and infection surveillance program",
        },
        {
            id: "s2",
            standardId: "CBAHI-IPC-09",
            programId: "cbahi",
            section: "Infection Prevention",
            description: "Infection surveillance and hand hygiene monitoring",
        },
        {
            id: "s3",
            standardId: "ISO-QM-10",
            programId: "iso",
            section: "Quality Management",
            description: "Corrective action and quality risk controls",
        },
        {
            id: "s4",
            standardId: "JCI-QM-11",
            programId: "jci",
            section: "Quality Management",
            description: "Quality risk controls and corrective action follow-up",
        },
        {
            id: "s5",
            standardId: "JCI-EDU-01",
            programId: "jci",
            section: "Education",
            description: "Annual staff competency program",
        },
    ];

    it("computes mapping coverage and reusable groups for selected program", () => {
        const summary = buildCrossStandardMappingSummary("jci", standards, programs);

        expect(summary.totalStandardsInProgram).toBe(3);
        expect(summary.mappedStandardsCount).toBe(2);
        expect(summary.mappingCoveragePercent).toBe(67);
        expect(summary.reusableControlGroupsCount).toBeGreaterThanOrEqual(2);
        expect(summary.topReusableControlGroups.length).toBeGreaterThan(0);
    });

    it("returns zero coverage when no cross-program overlap exists", () => {
        const isolated: Standard[] = [
            {
                id: "s10",
                standardId: "ISO-ONLY-1",
                programId: "iso",
                section: "Internal Audit",
                description: "Internal audit planning and execution",
            },
        ];

        const summary = buildCrossStandardMappingSummary("iso", isolated, programs);
        expect(summary.mappedStandardsCount).toBe(0);
        expect(summary.mappingCoveragePercent).toBe(0);
        expect(summary.reusableControlGroupsCount).toBe(0);
    });

    it("finds cross-program related standards for a source standard", () => {
        const related = getRelatedCrosswalkStandards("JCI-IPC-01", "jci", standards);
        expect(related.map((item) => item.standardId)).toContain("CBAHI-IPC-09");
        expect(related.every((item) => item.programId !== "jci")).toBe(true);
    });

    it("suggests reusable evidence documents based on crosswalk links", () => {
        const documents: any[] = [
            {
                id: "doc-1",
                name: { en: "Infection surveillance policy", ar: "" },
                isControlled: true,
                tags: ["cbahi-ipc-09", "surveillance"],
            },
            {
                id: "doc-2",
                name: { en: "Unrelated HR policy", ar: "" },
                isControlled: true,
                tags: ["hr"],
            },
        ];

        const suggestions = suggestReusableEvidenceForChecklistItem({
            standardId: "JCI-IPC-01",
            checklistText: "infection surveillance",
            currentProgramId: "jci",
            standards,
            documents: documents as any,
            existingEvidenceIds: [],
        });

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].documentId).toBe("doc-1");
    });
});
