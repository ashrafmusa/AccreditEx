import { AppDocument, Project, Risk, Standard } from "@/types";
import { convertToCSV, downloadCSV } from "@/utils/exportUtils";

export interface AssessorReportPack {
    metadata: {
        projectId: string;
        projectName: string;
        reportType: "assessorPack";
        generatedAt: string;
        generatedBy: string;
    };
    summary: {
        totalChecklistItems: number;
        compliantItems: number;
        partiallyCompliantItems: number;
        nonCompliantItems: number;
        openCapas: number;
        controlledEvidenceDocs: number;
        criticalOpenRisks: number;
    };
    standardsCoverage: Array<{
        standardId: string;
        section: string;
        description: string;
        checklistStatus: string;
        evidenceCount: number;
    }>;
    evidenceMatrix: Array<{
        standardId: string;
        checklistItem: string;
        status: string;
        evidenceDocumentId: string;
        evidenceDocumentName: string;
        documentStatus: string;
        uploadedAt: string;
    }>;
    openFindings: Array<{
        type: "Checklist" | "CAPA" | "Risk";
        reference: string;
        details: string;
        owner?: string;
        dueDate?: string;
    }>;
}

const safeText = (value?: string): string => value || "";

export const buildAssessorReportPack = (params: {
    project: Project;
    standards: Standard[];
    documents: AppDocument[];
    risks: Risk[];
    generatedBy: string;
}): AssessorReportPack => {
    const { project, standards, documents, risks, generatedBy } = params;

    const controlledDocs = documents.filter((doc) => doc.isControlled);
    const checklist = project.checklist || [];
    const projectStandards = standards.filter((standard) => standard.programId === project.programId);

    const evidenceMatrix = checklist.flatMap((item) => {
        const evidenceDocs = (item.evidenceFiles || [])
            .map((docId) => controlledDocs.find((doc) => doc.id === docId))
            .filter((doc): doc is AppDocument => Boolean(doc));

        if (evidenceDocs.length === 0) {
            return [
                {
                    standardId: item.standardId,
                    checklistItem: item.item,
                    status: item.status,
                    evidenceDocumentId: "",
                    evidenceDocumentName: "",
                    documentStatus: "",
                    uploadedAt: "",
                },
            ];
        }

        return evidenceDocs.map((doc) => ({
            standardId: item.standardId,
            checklistItem: item.item,
            status: item.status,
            evidenceDocumentId: doc.id,
            evidenceDocumentName: doc.name?.en || doc.name?.ar || doc.id,
            documentStatus: doc.status,
            uploadedAt: safeText(doc.uploadedAt),
        }));
    });

    const openFindings: AssessorReportPack["openFindings"] = [
        ...checklist
            .filter((item) => item.status === "Non-Compliant" || item.status === "Partially Compliant")
            .map((item) => ({
                type: "Checklist" as const,
                reference: item.standardId,
                details: item.item,
                owner: item.assignedTo,
                dueDate: item.dueDate,
            })),
        ...(project.capaReports || [])
            .filter((capa) => capa.status === "Open")
            .map((capa) => ({
                type: "CAPA" as const,
                reference: capa.checklistItemId,
                details: capa.description || capa.correctiveAction || "Open CAPA",
                owner: capa.assignedTo,
                dueDate: capa.dueDate,
            })),
        ...risks
            .filter((risk) => risk.status === "Open" && risk.impact >= 4)
            .map((risk) => ({
                type: "Risk" as const,
                reference: risk.id,
                details: risk.title,
                owner: risk.ownerId || undefined,
            })),
    ];

    const standardsCoverage = projectStandards.map((standard) => {
        const checklistMatch = checklist.find((item) => item.standardId === standard.standardId);
        return {
            standardId: standard.standardId,
            section: standard.section,
            description: standard.description,
            checklistStatus: checklistMatch?.status || "Not Mapped",
            evidenceCount: checklistMatch?.evidenceFiles?.length || 0,
        };
    });

    return {
        metadata: {
            projectId: project.id,
            projectName: project.name,
            reportType: "assessorPack",
            generatedAt: new Date().toISOString(),
            generatedBy,
        },
        summary: {
            totalChecklistItems: checklist.length,
            compliantItems: checklist.filter((item) => item.status === "Compliant").length,
            partiallyCompliantItems: checklist.filter((item) => item.status === "Partially Compliant").length,
            nonCompliantItems: checklist.filter((item) => item.status === "Non-Compliant").length,
            openCapas: (project.capaReports || []).filter((capa) => capa.status === "Open").length,
            controlledEvidenceDocs: controlledDocs.length,
            criticalOpenRisks: risks.filter((risk) => risk.status === "Open" && risk.impact >= 4).length,
        },
        standardsCoverage,
        evidenceMatrix,
        openFindings,
    };
};

export const exportAssessorReportPackJson = (pack: AssessorReportPack): void => {
    const blob = new Blob([JSON.stringify(pack, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assessor-pack-${pack.metadata.projectId}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportAssessorEvidenceMatrixCsv = (pack: AssessorReportPack): void => {
    const csv = convertToCSV(pack.evidenceMatrix as any[]);
    downloadCSV(
        csv,
        `assessor-evidence-matrix-${pack.metadata.projectId}-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`,
    );
};
