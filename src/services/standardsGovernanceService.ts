import { Standard } from '@/types';

export interface StandardsBaseline {
    programId: string;
    fingerprint: string;
    standardCount: number;
    createdAt: string;
}

export interface StandardsGovernanceStatus {
    hasBaseline: boolean;
    baseline?: StandardsBaseline;
    currentFingerprint: string;
    standardCount: number;
    driftDetected: boolean;
}

export interface StandardsGovernanceLogEntry {
    id: string;
    programId: string;
    action: 'baseline_set' | 'baseline_refreshed' | 'baseline_cleared';
    timestamp: string;
    standardCount: number;
    fingerprint: string;
    previousStandardCount?: number;
    previousFingerprint?: string;
}

const STORAGE_PREFIX = 'accreditex-standards-baseline';
const LOG_STORAGE_PREFIX = 'accreditex-standards-governance-log';

const normalizeStandards = (standards: Standard[]): Array<Pick<Standard, 'standardId' | 'section' | 'description' | 'criticality'>> => {
    return [...standards]
        .map((standard) => ({
            standardId: standard.standardId,
            section: standard.section,
            description: standard.description,
            criticality: standard.criticality,
        }))
        .sort((a, b) => a.standardId.localeCompare(b.standardId));
};

const buildFingerprint = (standards: Standard[]): string => {
    const normalized = normalizeStandards(standards);
    return JSON.stringify(normalized);
};

const keyForProgram = (programId: string): string => `${STORAGE_PREFIX}:${programId}`;
const logKeyForProgram = (programId: string): string => `${LOG_STORAGE_PREFIX}:${programId}`;

const readLog = (programId: string): StandardsGovernanceLogEntry[] => {
    const raw = localStorage.getItem(logKeyForProgram(programId));
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as StandardsGovernanceLogEntry[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeLog = (programId: string, entries: StandardsGovernanceLogEntry[]): void => {
    localStorage.setItem(logKeyForProgram(programId), JSON.stringify(entries));
};

const appendLogEntry = (
    programId: string,
    entry: Omit<StandardsGovernanceLogEntry, 'id' | 'programId' | 'timestamp'>,
): StandardsGovernanceLogEntry => {
    const fullEntry: StandardsGovernanceLogEntry = {
        id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        programId,
        timestamp: new Date().toISOString(),
        ...entry,
    };

    const current = readLog(programId);
    writeLog(programId, [fullEntry, ...current]);
    return fullEntry;
};

export const saveStandardsBaseline = (programId: string, standards: Standard[]): StandardsBaseline => {
    const previousBaseline = getStandardsBaseline(programId);
    const baseline: StandardsBaseline = {
        programId,
        fingerprint: buildFingerprint(standards),
        standardCount: standards.length,
        createdAt: new Date().toISOString(),
    };

    localStorage.setItem(keyForProgram(programId), JSON.stringify(baseline));

    appendLogEntry(programId, {
        action: previousBaseline ? 'baseline_refreshed' : 'baseline_set',
        standardCount: baseline.standardCount,
        fingerprint: baseline.fingerprint,
        previousStandardCount: previousBaseline?.standardCount,
        previousFingerprint: previousBaseline?.fingerprint,
    });

    return baseline;
};

export const getStandardsBaseline = (programId: string): StandardsBaseline | null => {
    const raw = localStorage.getItem(keyForProgram(programId));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StandardsBaseline;
    } catch {
        return null;
    }
};

export const clearStandardsBaseline = (programId: string): void => {
    const previousBaseline = getStandardsBaseline(programId);

    if (previousBaseline) {
        appendLogEntry(programId, {
            action: 'baseline_cleared',
            standardCount: previousBaseline.standardCount,
            fingerprint: previousBaseline.fingerprint,
            previousStandardCount: previousBaseline.standardCount,
            previousFingerprint: previousBaseline.fingerprint,
        });
    }

    localStorage.removeItem(keyForProgram(programId));
};

export const clearStandardsGovernanceLog = (programId: string): void => {
    localStorage.removeItem(logKeyForProgram(programId));
};

export const getStandardsGovernanceLog = (programId: string): StandardsGovernanceLogEntry[] => {
    return readLog(programId);
};

export const exportStandardsGovernanceLog = (programId: string): string => {
    const entries = getStandardsGovernanceLog(programId);
    const baseline = getStandardsBaseline(programId);

    return JSON.stringify(
        {
            programId,
            exportedAt: new Date().toISOString(),
            baseline,
            entryCount: entries.length,
            entries,
        },
        null,
        2,
    );
};

export const getStandardsGovernanceStatus = (
    programId: string,
    standards: Standard[],
): StandardsGovernanceStatus => {
    const baseline = getStandardsBaseline(programId);
    const currentFingerprint = buildFingerprint(standards);

    if (!baseline) {
        return {
            hasBaseline: false,
            currentFingerprint,
            standardCount: standards.length,
            driftDetected: false,
        };
    }

    return {
        hasBaseline: true,
        baseline,
        currentFingerprint,
        standardCount: standards.length,
        driftDetected: baseline.fingerprint !== currentFingerprint,
    };
};
