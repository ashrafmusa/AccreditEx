import { AppDocument, CAPAReport, PDCACycle, Project, Risk } from '@/types';

export interface CapaCompletenessResult {
    completenessScore: number;
    missingFields: string[];
    isClosureReady: boolean;
}

export interface PortfolioReadinessResult {
    readinessScore: number;
    evidenceIntegrityIndex: number;
    capaEffectivenessRate: number;
    criticalOpenFindings: number;
}

export interface ArtifactCompletenessResult {
    completenessScore: number;
    missingFields: string[];
}

export interface CapaClosureDecision {
    allowed: boolean;
    reason?: string;
}

const hasText = (value: unknown): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    if (value instanceof Date) {
        return !Number.isNaN(value.getTime());
    }

    return false;
};

export const evaluateCapaCompleteness = (capa: CAPAReport): CapaCompletenessResult => {
    const requiredChecks: Array<{ key: string; valid: boolean }> = [
        { key: 'rootCause', valid: hasText(capa.rootCause) },
        { key: 'correctiveAction', valid: hasText(capa.correctiveAction) },
        { key: 'preventiveAction', valid: hasText(capa.preventiveAction) },
        { key: 'assignedTo', valid: hasText(capa.assignedTo) },
        { key: 'dueDate', valid: hasText(capa.dueDate) },
    ];

    const missingFields = requiredChecks.filter((item) => !item.valid).map((item) => item.key);
    const completenessScore = Math.round(
        ((requiredChecks.length - missingFields.length) / requiredChecks.length) * 100,
    );

    const effectivenessGatePassed =
        !capa.effectivenessCheck?.required ||
        Boolean(capa.effectivenessCheck?.completed && hasText(capa.effectivenessCheck?.results));

    return {
        completenessScore,
        missingFields,
        isClosureReady: missingFields.length === 0 && effectivenessGatePassed,
    };
};

export const canCloseCapa = (
    capa: CAPAReport,
    strictValidationEnabled: boolean,
): CapaClosureDecision => {
    if (!strictValidationEnabled) {
        return { allowed: true };
    }

    const completeness = evaluateCapaCompleteness(capa);
    if (completeness.isClosureReady) {
        return { allowed: true };
    }

    const hasValidException = Boolean(
        capa.closureException?.reason?.trim() &&
        capa.closureException?.approvedBy?.trim() &&
        capa.closureException?.approvedAt?.trim(),
    );

    if (hasValidException) {
        return {
            allowed: true,
            reason: 'Closure allowed by approved exception',
        };
    }

    return {
        allowed: false,
        reason: `Missing required closure evidence: ${completeness.missingFields.join(', ')}`,
    };
};

export const evaluatePDCACycleCompleteness = (cycle: PDCACycle): ArtifactCompletenessResult => {
    const requiredChecks: Array<{ key: string; valid: boolean }> = [
        { key: 'title', valid: hasText(cycle.title) },
        { key: 'owner', valid: hasText(cycle.owner) },
        { key: 'currentStage', valid: hasText(cycle.currentStage) },
        { key: 'stageHistory', valid: Array.isArray(cycle.stageHistory) && cycle.stageHistory.length > 0 },
    ];

    const missingFields = requiredChecks.filter((item) => !item.valid).map((item) => item.key);
    const completenessScore = Math.round(
        ((requiredChecks.length - missingFields.length) / requiredChecks.length) * 100,
    );

    return {
        completenessScore,
        missingFields,
    };
};

export const evaluateControlledDocumentCompleteness = (
    document: AppDocument,
): ArtifactCompletenessResult => {
    const requiredChecks: Array<{ key: string; valid: boolean }> = [
        { key: 'name.en', valid: hasText(document.name?.en) },
        { key: 'name.ar', valid: hasText(document.name?.ar) },
        { key: 'status', valid: hasText(document.status) },
        { key: 'uploadedAt', valid: hasText(document.uploadedAt) },
        { key: 'currentVersion', valid: Number.isFinite(document.currentVersion) && document.currentVersion > 0 },
    ];

    const missingFields = requiredChecks.filter((item) => !item.valid).map((item) => item.key);
    const completenessScore = Math.round(
        ((requiredChecks.length - missingFields.length) / requiredChecks.length) * 100,
    );

    return {
        completenessScore,
        missingFields,
    };
};

export const calculateEvidenceIntegrityIndex = (projects: Project[], documents: AppDocument[] = []): number => {
    const capas = projects.flatMap((project) => project.capaReports || []);
    const pdcaCycles = projects.flatMap((project) => project.pdcaCycles || []);
    const controlledDocs = documents.filter((doc) => doc.isControlled);

    const totalArtifacts = capas.length + pdcaCycles.length + controlledDocs.length;
    if (totalArtifacts === 0) {
        return 100;
    }

    const capaScores = capas.map((capa) => evaluateCapaCompleteness(capa).completenessScore);
    const pdcaScores = pdcaCycles.map((cycle) => evaluatePDCACycleCompleteness(cycle).completenessScore);
    const documentScores = controlledDocs.map((document) =>
        evaluateControlledDocumentCompleteness(document).completenessScore,
    );

    const scored = [...capaScores, ...pdcaScores, ...documentScores];
    const avg = scored.reduce((acc, value) => acc + value, 0) / scored.length;
    return Math.round(avg);
};

export const calculatePortfolioReadiness = (
    projects: Project[],
    risks: Risk[],
    documents: AppDocument[] = [],
): PortfolioReadinessResult => {
    const totalProjects = projects.length || 1;
    const completedProjects = projects.filter((project) => project.status === 'Completed').length;
    const inProgressProjects = projects.filter((project) => project.status === 'In Progress').length;
    const projectDeliveryScore = ((completedProjects + inProgressProjects) / totalProjects) * 100;

    const totalRisks = risks.length || 1;
    const mitigatedRisks = risks.filter(
        (risk) => risk.status === 'Mitigated' || risk.status === 'Closed',
    ).length;
    const riskControlScore = (mitigatedRisks / totalRisks) * 100;

    const capas = projects.flatMap((project) => project.capaReports || []);
    const capaWithCheck = capas.filter((capa) => capa.effectivenessCheck?.required);
    const completedChecks = capaWithCheck.filter(
        (capa) => capa.effectivenessCheck?.completed,
    ).length;
    const capaEffectivenessRate =
        capaWithCheck.length === 0 ? 100 : Math.round((completedChecks / capaWithCheck.length) * 100);

    const evidenceIntegrityIndex = calculateEvidenceIntegrityIndex(projects, documents);
    const criticalOpenFindings = risks.filter((risk) => risk.status === 'Open' && risk.impact >= 4).length;

    const readinessScore = Math.round(
        projectDeliveryScore * 0.35 +
        riskControlScore * 0.25 +
        evidenceIntegrityIndex * 0.25 +
        capaEffectivenessRate * 0.15,
    );

    return {
        readinessScore,
        evidenceIntegrityIndex,
        capaEffectivenessRate,
        criticalOpenFindings,
    };
};
