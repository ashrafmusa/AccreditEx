import {
    buildAssessorReportPack,
    calculateAssessorPackExportMetrics,
    getAssessorPackExportAudit,
    recordAssessorPackExportAudit,
} from "@/services/assessorReportPackService";
import { ComplianceStatus, ProjectStatus, type Project, type Risk, type Standard } from "@/types";
import { addDoc, getDocsFromServer } from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(() => "activity-logs"),
    addDoc: jest.fn(),
    getDocsFromServer: jest.fn(),
    where: jest.fn((field, operator, value) => ({ field, operator, value })),
    orderBy: jest.fn((field, direction) => ({ field, direction })),
    limit: jest.fn((count) => ({ count })),
}));
jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("@/utils/tenantQuery", () => ({
    getTenantQuery: jest.fn(() => "tenant-query"),
    getTenantStamp: jest.fn(() => ({ organizationId: "org-a" })),
}));

describe("assessorReportPackService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(addDoc).mockResolvedValue({ id: "audit-1" } as Awaited<ReturnType<typeof addDoc>>);
        jest.mocked(getDocsFromServer).mockResolvedValue({
            docs: [],
        } as unknown as Awaited<ReturnType<typeof getDocsFromServer>>);
    });

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

    it("records assessor exports in the tenant-scoped durable activity log", async () => {
        const pack = buildAssessorReportPack({
            project,
            standards,
            documents: documents as any,
            risks,
            generatedBy: "QA Lead",
        });

        const entry = await recordAssessorPackExportAudit(pack, "user-1");

        expect(entry.projectId).toBe("project-1");
        expect(entry.id).toBe("audit-1");
        expect(entry.format).toBe("json+csv");
        expect(addDoc).toHaveBeenCalledWith(
            "activity-logs",
            expect.objectContaining({
                projectId: "project-1",
                projectName: "Medication Safety Program",
                userId: "user-1",
                organizationId: "org-a",
                type: "assessor_pack_export",
                resourceId: "project-1",
            }),
        );
    });

    it("persists reviewer sign-off metadata when provided", async () => {
        const pack = buildAssessorReportPack({
            project,
            standards,
            documents: documents as any,
            risks,
            generatedBy: "QA Lead",
        });

        const entry = await recordAssessorPackExportAudit(pack, "user-1", {
            reviewerName: "Dr. Sarah Ahmed",
            note: "Reviewed for mock assessor readiness",
        });

        expect(entry.reviewerSignOff?.reviewerName).toBe("Dr. Sarah Ahmed");
        expect(entry.reviewerSignOff?.approvedAt).toBeDefined();
        expect(entry.reviewerSignOff?.note).toBe(
            "Reviewed for mock assessor readiness",
        );
    });

    it("rejects the export when the durable audit write fails", async () => {
        // Arrange
        const pack = buildAssessorReportPack({
            project,
            standards,
            documents: documents as any,
            risks,
            generatedBy: "QA Lead",
        });
        jest.mocked(addDoc).mockRejectedValue(new Error("Audit unavailable"));

        // Act / Assert
        await expect(recordAssessorPackExportAudit(pack, "user-1")).rejects.toThrow(
            "Audit unavailable",
        );
    });

    it("loads tenant-scoped export history and calculates sign-off metrics", async () => {
        const pack = buildAssessorReportPack({
            project,
            standards,
            documents: documents as any,
            risks,
            generatedBy: "QA Lead",
        });

        const signedAt = new Date().toISOString();
        const olderAt = new Date(Date.now() - 2 * 86400000).toISOString();
        jest.mocked(getDocsFromServer).mockResolvedValue({
            docs: [
                {
                    id: "audit-1",
                    data: () => ({
                        projectId: "project-1",
                        projectName: "Medication Safety Program",
                        generatedBy: "QA Lead",
                        exportedAt: signedAt,
                        format: "json+csv",
                        reviewerSignOff: {
                            reviewerName: "Dr. Sarah Ahmed",
                            approvedAt: signedAt,
                            note: "Approved",
                        },
                    }),
                },
                {
                    id: "audit-2",
                    data: () => ({
                        projectId: "project-1",
                        projectName: "Medication Safety Program",
                        generatedBy: "QA Lead",
                        exportedAt: olderAt,
                        format: "json+csv",
                    }),
                },
            ],
        } as unknown as Awaited<ReturnType<typeof getDocsFromServer>>);

        const entries = await getAssessorPackExportAudit();
        const metrics = calculateAssessorPackExportMetrics(entries);

        expect(metrics.totalExports).toBe(2);
        expect(metrics.exportsLast30Days).toBe(2);
        expect(metrics.reviewerSignOffRatePercent).toBe(50);
        expect(getDocsFromServer).toHaveBeenCalledWith("tenant-query");
    });
});
