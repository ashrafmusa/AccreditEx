import { Standard } from '@/types';
import {
    clearStandardsBaseline,
    clearStandardsGovernanceLog,
    exportStandardsGovernanceLog,
    getStandardsBaseline,
    getStandardsGovernanceLog,
    getStandardsGovernanceStatus,
    saveStandardsBaseline,
} from '@/services/standardsGovernanceService';

describe('standardsGovernanceService', () => {
    const programId = 'program-1';

    const standards: Standard[] = [
        {
            standardId: 'STD-001',
            programId,
            section: 'Leadership',
            description: 'Leadership requirements',
            criticality: 'High' as any,
        },
        {
            standardId: 'STD-002',
            programId,
            section: 'Quality',
            description: 'Quality requirements',
            criticality: 'Medium' as any,
        },
    ];

    beforeEach(() => {
        clearStandardsBaseline(programId);
        clearStandardsGovernanceLog(programId);
    });

    it('creates and reads standards baseline', () => {
        const baseline = saveStandardsBaseline(programId, standards);
        expect(baseline.programId).toBe(programId);
        expect(baseline.standardCount).toBe(2);

        const loaded = getStandardsBaseline(programId);
        expect(loaded).not.toBeNull();
        expect(loaded?.fingerprint).toBe(baseline.fingerprint);
    });

    it('detects no drift when standards are unchanged', () => {
        saveStandardsBaseline(programId, standards);
        const status = getStandardsGovernanceStatus(programId, standards);

        expect(status.hasBaseline).toBe(true);
        expect(status.driftDetected).toBe(false);
    });

    it('detects drift when standards are changed', () => {
        saveStandardsBaseline(programId, standards);

        const changed = [
            ...standards,
            {
                standardId: 'STD-003',
                programId,
                section: 'Safety',
                description: 'New safety requirement',
                criticality: 'High' as any,
            },
        ];

        const status = getStandardsGovernanceStatus(programId, changed);
        expect(status.hasBaseline).toBe(true);
        expect(status.driftDetected).toBe(true);
    });

    it('writes timestamped governance log entries for baseline changes', () => {
        expect(getStandardsGovernanceLog(programId)).toHaveLength(0);

        saveStandardsBaseline(programId, standards);
        const firstLog = getStandardsGovernanceLog(programId);
        expect(firstLog).toHaveLength(1);
        expect(firstLog[0].action).toBe('baseline_set');

        saveStandardsBaseline(programId, standards);
        const secondLog = getStandardsGovernanceLog(programId);
        expect(secondLog).toHaveLength(2);
        expect(secondLog[0].action).toBe('baseline_refreshed');

        clearStandardsBaseline(programId);
        const thirdLog = getStandardsGovernanceLog(programId);
        expect(thirdLog).toHaveLength(3);
        expect(thirdLog[0].action).toBe('baseline_cleared');
    });

    it('exports governance log payload as JSON', () => {
        saveStandardsBaseline(programId, standards);
        const exported = exportStandardsGovernanceLog(programId);
        const parsed = JSON.parse(exported);

        expect(parsed.programId).toBe(programId);
        expect(parsed.entryCount).toBeGreaterThan(0);
        expect(Array.isArray(parsed.entries)).toBe(true);
        expect(parsed.entries[0].timestamp).toBeDefined();
    });
});
