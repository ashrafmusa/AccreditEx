import { ProjectStatus, type CAPAReport, type Project, type Risk } from '@/types';
import {
    evaluateCapaCompleteness,
    evaluatePDCACycleCompleteness,
    evaluateControlledDocumentCompleteness,
    calculateEvidenceIntegrityIndex,
    calculatePortfolioReadiness,
    canCloseCapa,
} from '@/services/tqmReadinessService';

describe('tqmReadinessService', () => {
    const createCapa = (overrides: Partial<CAPAReport> = {}): CAPAReport => ({
        id: 'capa-1',
        checklistItemId: 'item-1',
        rootCause: 'Root cause',
        correctiveAction: 'Corrective action',
        preventiveAction: 'Preventive action',
        assignedTo: 'user-1',
        dueDate: new Date().toISOString(),
        status: ProjectStatus.InProgress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    });

    const createProject = (overrides: Partial<Project> = {}): Project => ({
        id: 'project-1',
        name: 'Project 1',
        programId: 'program-1',
        status: ProjectStatus.InProgress,
        startDate: new Date().toISOString(),
        progress: 50,
        checklist: [],
        mockSurveys: [],
        capaReports: [createCapa()],
        designControls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    });

    const createRisk = (overrides: Partial<Risk> = {}): Risk => ({
        id: 'risk-1',
        title: 'Risk 1',
        description: 'Risk',
        likelihood: 4,
        impact: 4,
        ownerId: 'user-1',
        status: 'Open',
        mitigationPlan: 'Mitigate',
        createdAt: new Date().toISOString(),
        ...overrides,
    });

    it('evaluates CAPA completeness and missing fields', () => {
        const complete = evaluateCapaCompleteness(createCapa());
        expect(complete.completenessScore).toBe(100);
        expect(complete.missingFields).toEqual([]);
        expect(complete.isClosureReady).toBe(true);

        const incomplete = evaluateCapaCompleteness(
            createCapa({ preventiveAction: '', dueDate: undefined }),
        );
        expect(incomplete.completenessScore).toBeLessThan(100);
        expect(incomplete.missingFields).toEqual(
            expect.arrayContaining(['preventiveAction', 'dueDate']),
        );
    });

    it('calculates evidence integrity index across projects', () => {
        const projects: Project[] = [
            createProject({ capaReports: [createCapa()] }),
            createProject({
                id: 'project-2',
                capaReports: [createCapa({ rootCause: '', correctiveAction: '' })],
            }),
        ];

        const index = calculateEvidenceIntegrityIndex(projects);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(100);
    });

    it('evaluates PDCA and controlled document completeness', () => {
        const pdca = {
            id: 'pdca-1',
            title: 'Medication error reduction',
            owner: 'user-1',
            currentStage: 'Plan',
            stageHistory: [{ stage: 'Plan', enteredAt: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
        } as any;

        const pdcaResult = evaluatePDCACycleCompleteness(pdca);
        expect(pdcaResult.completenessScore).toBe(100);

        const docResult = evaluateControlledDocumentCompleteness({
            id: 'doc-1',
            name: { en: 'Policy A', ar: 'سياسة أ' },
            type: 'Policy',
            isControlled: true,
            status: 'Draft',
            content: { en: '', ar: '' },
            currentVersion: 1,
            uploadedAt: new Date().toISOString(),
        });
        expect(docResult.completenessScore).toBe(100);
    });

    it('handles legacy non-string controlled document fields without crashing', () => {
        const projects: Project[] = [createProject()];
        const risks: Risk[] = [createRisk({ status: 'Mitigated' })];

        const legacyLikeDocument = {
            id: 'doc-legacy',
            name: { en: 'Legacy Policy', ar: 'سياسة قديمة' },
            type: 'Policy',
            isControlled: true,
            status: 'Approved',
            content: { en: '', ar: '' },
            currentVersion: 1,
            uploadedAt: new Date() as any,
        } as any;

        expect(() =>
            calculatePortfolioReadiness(projects, risks, [legacyLikeDocument]),
        ).not.toThrow();
    });

    it('calculates portfolio readiness metrics', () => {
        const projects: Project[] = [
            createProject({ status: ProjectStatus.Completed }),
            createProject({
                id: 'project-2',
                capaReports: [
                    createCapa({
                        effectivenessCheck: { required: true, completed: true, results: 'Effective' },
                    }),
                ],
            }),
        ];

        const risks: Risk[] = [
            createRisk({ status: 'Open', impact: 5 }),
            createRisk({ id: 'risk-2', status: 'Mitigated', impact: 2, likelihood: 2 }),
        ];

        const result = calculatePortfolioReadiness(projects, risks, []);

        expect(result.readinessScore).toBeGreaterThanOrEqual(0);
        expect(result.readinessScore).toBeLessThanOrEqual(100);
        expect(result.evidenceIntegrityIndex).toBeGreaterThanOrEqual(0);
        expect(result.capaEffectivenessRate).toBeGreaterThanOrEqual(0);
        expect(result.criticalOpenFindings).toBe(1);
    });

    it('enforces strict closure and supports auditable exception', () => {
        const incomplete = createCapa({ preventiveAction: '', dueDate: undefined });

        const blocked = canCloseCapa(incomplete, true);
        expect(blocked.allowed).toBe(false);
        expect(blocked.reason).toContain('Missing required closure evidence');

        const withException = canCloseCapa(
            {
                ...incomplete,
                closureException: {
                    reason: 'Emergency audit timeline exception',
                    approvedBy: 'qa-director',
                    approvedAt: new Date().toISOString(),
                },
            },
            true,
        );

        expect(withException.allowed).toBe(true);
        expect(withException.reason).toContain('approved exception');

        const nonStrict = canCloseCapa(incomplete, false);
        expect(nonStrict.allowed).toBe(true);
    });
});
