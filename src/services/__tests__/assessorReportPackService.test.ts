import { buildAssessorReportPack } from "@/services/assessorReportPackService";
import { ComplianceStatus, ProjectStatus, type Project, type Risk, type Standard } from "@/types";

describe("assessorReportPackService", () => {
    const project: Project = {
        id: "project-1",
        name: "Medication Safety Program",
        programId: "jci",
        status: ProjectStatus.InProgress,
        startDate: new Date().toISOString(),
        progress: 55,
        checklist: [
            {
                id: "item-1",
                item: "Medication reconciliation workflow",
                standardId: "JCI-MMU-01",
                status: ComplianceStatus.NonCompliant,
                assignedTo: "user-1",
                dueDate: new Date().toISOString(),
                actionPlan: "Implement pharmacy verification",
                notes: "",
                evidenceFiles: ["doc-1"],
                comments: [],
            },
        ],
        capaReports: [
            {
                id: "capa-1",
                checklistItemId: "item-1",
                rootCause: "Process gap",
                correctiveAction: "Updated workflow",
                status: ProjectStatus.InProgress,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ],
        mockSurveys: [],
        designControls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const standards: Standard[] = [
        {
            id: "std-1",
            standardId: "JCI-MMU-01",
            programId: "jci",
            section: "Medication Management",
            description: "Medication safety governance",
        },
    ];

    const risks: Risk[] = [
        {
            id: "risk-1",
            title: "High-alert medication issue",
            description: "Potential medication harm",
            likelihood: 4,
            impact: 5,
            ownerId: "user-1",
            status: "Open",
            mitigationPlan: "Double-check procedure",
            createdAt: new Date().toISOString(),
        },
    ];

    const documents: any[] = [
        {
            id: "doc-1",
            name: { en: "Medication Reconciliation Policy", ar: "" },
            type: "Policy",
            isControlled: true,
            status: "Approved",
            content: null,
            currentVersion: 1,
            uploadedAt: new Date().toISOString(),
        },
    ];

    it("builds assessor pack with summary and evidence matrix", () => {
        const pack = buildAssessorReportPack({
            project,
            standards,
            documents: documents as any,
            risks,
            generatedBy: "QA Lead",
        });

        expect(pack.metadata.projectId).toBe("project-1");
        expect(pack.summary.totalChecklistItems).toBe(1);
        expect(pack.evidenceMatrix.length).toBeGreaterThan(0);
        expect(pack.openFindings.length).toBeGreaterThan(0);
    });
});
