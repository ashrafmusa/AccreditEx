import { AppDocument, Project, Risk, Standard } from "@/types";
import { convertToCSV, downloadCSV } from "@/utils/exportUtils";
import {
    addDoc,
    collection,
    getDocsFromServer,
    limit,
    orderBy,
    where,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { getTenantQuery, getTenantStamp } from "@/utils/tenantQuery";

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

export interface AssessorPackExportAuditEntry {
    id: string;
    projectId: string;
    projectName: string;
    generatedBy: string;
    exportedAt: string;
    format: "json+csv";
    reviewerSignOff?: {
        reviewerName: string;
        approvedAt: string;
        note?: string;
    };
}

export interface AssessorPackExportMetrics {
    totalExports: number;
    exportsLast30Days: number;
    reviewerSignOffRatePercent: number;
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

export const exportAssessorReportPackPdf = async (
    pack: AssessorReportPack,
    options?: {
        organizationName?: string;
        reviewerName?: string;
        signOffNote?: string;
    },
): Promise<void> => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;

    // 1. Top Banner Header
    doc.setFillColor(15, 23, 42); // Slate-900 header
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ACCREDITEX — OFFICIAL SURVEYOR EVIDENCE DOSSIER", margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const facilityTitle = options?.organizationName || "Healthcare Facility";
    doc.text(
        `${facilityTitle}  |  Project: ${pack.metadata.projectName}`,
        margin,
        21,
    );
    doc.text(
        `Generated: ${new Date(pack.metadata.generatedAt).toLocaleString()}`,
        pageWidth - margin,
        21,
        { align: "right" },
    );

    let y = 36;

    // 2. Executive Compliance Summary Table
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Executive Accreditation & Evidence Summary", margin, y);
    y += 4;

    const totalApplicable = Math.max(1, pack.summary.totalChecklistItems);
    const complianceRate = Math.round(
        ((pack.summary.compliantItems + pack.summary.partiallyCompliantItems * 0.5) /
            totalApplicable) *
            100,
    );
    const verifiedRows = pack.evidenceMatrix.filter(
        (r) => Boolean(r.evidenceDocumentId),
    ).length;

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [
            [
                "Total Standards",
                "Compliant",
                "Partial",
                "Non-Compliant",
                "Readiness Score",
                "Linked Evidence Docs",
                "Open CAPAs",
                "High Risks",
            ],
        ],
        body: [
            [
                String(pack.summary.totalChecklistItems),
                String(pack.summary.compliantItems),
                String(pack.summary.partiallyCompliantItems),
                String(pack.summary.nonCompliantItems),
                `${complianceRate}%`,
                `${verifiedRows} linked (${pack.summary.controlledEvidenceDocs} controlled)`,
                String(pack.summary.openCapas),
                String(pack.summary.criticalOpenRisks),
            ],
        ],
        theme: "grid",
        headStyles: {
            fillColor: [30, 64, 175],
            textColor: 255,
            fontSize: 8.5,
            fontStyle: "bold",
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [30, 41, 59],
            halign: "center",
        },
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 25) + 10;

    // 3. Standards-to-Evidence Cross-Reference Matrix
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. Standards-to-Evidence Cross-Reference Matrix", margin, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [
            [
                "Standard ID",
                "Checklist Requirement",
                "Compliance Status",
                "Controlled Evidence Document",
                "Doc Status",
            ],
        ],
        body:
            pack.evidenceMatrix.length > 0
                ? pack.evidenceMatrix.map((row) => [
                      row.standardId || "-",
                      (row.checklistItem || "").slice(0, 110),
                      row.status || "-",
                      row.evidenceDocumentName || "UNLINKED (Blind Spot)",
                      row.documentStatus || "-",
                  ])
                : [["-", "No checklist items recorded", "-", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: 255,
            fontSize: 8.5,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
        },
        columnStyles: {
            0: { cellWidth: 26, fontStyle: "bold" },
            1: { cellWidth: 68 },
            2: { cellWidth: 28 },
            3: { cellWidth: 36 },
            4: { cellWidth: 20 },
        },
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 40) + 10;

    // 4. Open Findings, CAPAs & High-Risk Register
    if (y > pageHeight - 55) {
        doc.addPage();
        y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. Open Non-Conformities, CAPA & High-Risk Register", margin, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Type", "Reference", "Finding / Action Details", "Due Date"]],
        body:
            pack.openFindings.length > 0
                ? pack.openFindings.map((finding) => [
                      finding.type,
                      finding.reference || "-",
                      (finding.details || "").slice(0, 120),
                      finding.dueDate
                          ? new Date(finding.dueDate).toLocaleDateString()
                          : "-",
                  ])
                : [
                      [
                          "None",
                          "-",
                          "Zero open non-conformities, CAPAs, or critical risks.",
                          "-",
                      ],
                  ],
        theme: "striped",
        headStyles: {
            fillColor: [185, 28, 28],
            textColor: 255,
            fontSize: 8.5,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
        },
        columnStyles: {
            0: { cellWidth: 22, fontStyle: "bold" },
            1: { cellWidth: 28 },
            2: { cellWidth: 100 },
            3: { cellWidth: 28 },
        },
    });

    y = ((doc as any).lastAutoTable?.finalY || y + 30) + 12;

    // 5. Reviewer Sign-Off & Attestation Block
    if (y > pageHeight - 45) {
        doc.addPage();
        y = 20;
    }
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 32, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("4. Quality & Accreditation Sign-Off Attestation", margin + 4, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
        `Prepared By: ${pack.metadata.generatedBy}    |    Reviewer Sign-Off: ${
            options?.reviewerName?.trim() || "Pending Quality Director Sign-Off"
        }`,
        margin + 4,
        y + 15,
    );
    if (options?.signOffNote?.trim()) {
        doc.text(
            `Reviewer Note: ${options.signOffNote.trim().slice(0, 110)}`,
            margin + 4,
            y + 22,
        );
    }
    doc.text(
        "Digital Signature / Stamp: ____________________________      Date: __________________",
        margin + 4,
        y + 28,
    );

    const safeProject = (pack.metadata.projectName || pack.metadata.projectId)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    doc.save(
        `accreditex-survey-dossier-${safeProject || "project"}-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`,
    );
};

export const recordAssessorPackExportAudit = async (
    pack: AssessorReportPack,
    userId: string,
    reviewerSignOff?: {
        reviewerName?: string;
        note?: string;
    },
): Promise<AssessorPackExportAuditEntry> => {
    const normalizedReviewerName = reviewerSignOff?.reviewerName?.trim();
    const normalizedReviewerNote = reviewerSignOff?.note?.trim();

    const entry: Omit<AssessorPackExportAuditEntry, "id"> = {
        projectId: pack.metadata.projectId,
        projectName: pack.metadata.projectName,
        generatedBy: pack.metadata.generatedBy,
        exportedAt: new Date().toISOString(),
        format: "json+csv",
        reviewerSignOff: normalizedReviewerName
            ? {
                reviewerName: normalizedReviewerName,
                approvedAt: new Date().toISOString(),
                    ...(normalizedReviewerNote
                        ? { note: normalizedReviewerNote }
                        : {}),
                }
                : undefined,
    };

    const record = await addDoc(collection(db, "activity_logs"), {
            projectId: entry.projectId,
            projectName: entry.projectName,
            generatedBy: entry.generatedBy,
            exportedAt: entry.exportedAt,
            format: entry.format,
            ...(entry.reviewerSignOff
                ? { reviewerSignOff: entry.reviewerSignOff }
                : {}),
        ...getTenantStamp(),
        userId,
        user: pack.metadata.generatedBy,
        timestamp: entry.exportedAt,
        action: {
            en: `Exported assessor pack for "${pack.metadata.projectName}"`,
            ar: `تم تصدير حزمة المقيم للمشروع "${pack.metadata.projectName}"`,
        },
        details: JSON.stringify(entry.reviewerSignOff || {}),
        type: "assessor_pack_export",
        resourceId: pack.metadata.projectId,
    });

    return { ...entry, id: record.id };
};

export const getAssessorPackExportAudit = async (): Promise<AssessorPackExportAuditEntry[]> => {
    const snapshot = await getDocsFromServer(
        getTenantQuery(
            "activity_logs",
            where("type", "==", "assessor_pack_export"),
            limit(500),
        ),
    );

    return snapshot.docs
        .map((record) => {
            const data = record.data();
            return {
                id: record.id,
                projectId: data.projectId,
                projectName: data.projectName,
                generatedBy: data.generatedBy,
                exportedAt: data.exportedAt,
                format: data.format,
                reviewerSignOff: data.reviewerSignOff,
            } as AssessorPackExportAuditEntry;
        })
        .sort((a, b) => (b.exportedAt || "").localeCompare(a.exportedAt || ""));
};

export const calculateAssessorPackExportMetrics = (
    entries: AssessorPackExportAuditEntry[],
): AssessorPackExportMetrics => {
    const now = new Date();
    const days30Ago = new Date();
    days30Ago.setDate(now.getDate() - 30);

    const totalExports = entries.length;
    const exportsLast30Days = entries.filter((entry) => {
        const exportedAt = new Date(entry.exportedAt);
        return !Number.isNaN(exportedAt.getTime()) && exportedAt >= days30Ago;
    }).length;

    const withSignOff = entries.filter((entry) => Boolean(entry.reviewerSignOff?.reviewerName)).length;
    const reviewerSignOffRatePercent =
        totalExports > 0 ? Math.round((withSignOff / totalExports) * 100) : 0;

    return {
        totalExports,
        exportsLast30Days,
        reviewerSignOffRatePercent,
    };
};
