/**
 * QC Data Import Service
 * Parses QC data from Bio-Rad Unity CSV, Randox QC CSV/XLSX, and generic Excel/CSV files
 * Computes z-scores, detects Westgard rule violations, and returns QCData[]
 */

import type { QCData, WestgardRule } from './limsIntegration/types';
import { applyWestgardRules } from '@/types/labOps';
import type { WestgardRule as LabWestgardRule } from '@/types/labOps';

export type QCImportSource = 'biorad_unity' | 'randox' | 'excel_csv' | 'manual';

export const QC_IMPORT_SOURCE_LABELS: Record<QCImportSource, string> = {
    biorad_unity: 'Bio-Rad Unity',
    randox: 'Randox QC',
    excel_csv: 'Generic Excel / CSV',
    manual: 'Manual Entry',
};

export interface QCImportValidationError {
    row: number;
    field: string;
    message: string;
}

export interface QCImportResult {
    source: QCImportSource;
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    errors: QCImportValidationError[];
    records: QCData[];
}

export interface QCColumnMapping {
    instrumentId: string;
    instrumentName: string;
    analyteCode: string;
    analyteName: string;
    level: string;
    lotNumber: string;
    value: string;
    mean: string;
    sd: string;
    controlDate: string;
    labSection: string;
}

// ── Bio-Rad Unity CSV column names ───────────────────────

const BIORAD_COLUMNS: QCColumnMapping = {
    instrumentId: 'Instrument ID',
    instrumentName: 'Instrument',
    analyteCode: 'Analyte Code',
    analyteName: 'Analyte',
    level: 'Level',
    lotNumber: 'Lot Number',
    value: 'Result',
    mean: 'Mean',
    sd: 'SD',
    controlDate: 'Date',
    labSection: 'Department',
};

// ── Randox QC CSV column names ───────────────────────────

const RANDOX_COLUMNS: QCColumnMapping = {
    instrumentId: 'AnalyzerID',
    instrumentName: 'Analyzer',
    analyteCode: 'TestCode',
    analyteName: 'TestName',
    level: 'QCLevel',
    lotNumber: 'LotNo',
    value: 'Value',
    mean: 'Target',
    sd: 'SD',
    controlDate: 'RunDate',
    labSection: 'Lab',
};

// ── Westgard Rule Detection ──────────────────────────────

function computeZScore(value: number, mean: number, sd: number): number {
    if (sd === 0) return 0;
    return (value - mean) / sd;
}

const WESTGARD_PRIORITY: readonly LabWestgardRule[] = [
    '1_3s',
    '2_2s',
    'R_4s',
    '4_1s',
    '10_x',
    '1_2s',
];

const WESTGARD_IMPORT_RULES: Record<LabWestgardRule, WestgardRule> = {
    '1_2s': '1-2s',
    '1_3s': '1-3s',
    '2_2s': '2-2s',
    R_4s: 'R-4s',
    '4_1s': '4-1s',
    '10_x': '10x',
};

function detectWestgardViolation(
    zScore: number,
    recentZScores: number[] = [],
): WestgardRule {
    const history = recentZScores
        .slice()
        .reverse()
        .map((sdFromMean) => ({ sdFromMean }));
    const violations = new Set(applyWestgardRules(history, zScore));
    const highestPriority = WESTGARD_PRIORITY.find((rule) => violations.has(rule));
    return highestPriority ? WESTGARD_IMPORT_RULES[highestPriority] : 'none';
}

// ── CSV Parsing ──────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const record: Record<string, string> = {};
        headers.forEach((h, i) => {
            record[h] = values[i] || '';
        });
        return record;
    });
}

// ── Core Parsing Logic ───────────────────────────────────

function mapRowToQCData(
    row: Record<string, string>,
    mapping: QCColumnMapping,
    index: number,
    recentZScoresBySeries: Map<string, number[]>,
    errors: QCImportValidationError[],
    source: QCImportSource,
): QCData | null {
    const value = parseFloat(row[mapping.value]);
    const mean = parseFloat(row[mapping.mean]);
    const sd = parseFloat(row[mapping.sd]);

    // Validate required fields
    if (isNaN(value)) {
        errors.push({ row: index + 2, field: mapping.value, message: 'Invalid or missing value' });
        return null;
    }
    if (isNaN(mean)) {
        errors.push({ row: index + 2, field: mapping.mean, message: 'Invalid or missing mean' });
        return null;
    }
    if (isNaN(sd) || sd <= 0) {
        errors.push({ row: index + 2, field: mapping.sd, message: 'Invalid or missing SD' });
        return null;
    }

    const zScore = computeZScore(value, mean, sd);
    const seriesKey = [
        row[mapping.instrumentId],
        row[mapping.analyteCode] || row[mapping.analyteName],
        row[mapping.level],
        row[mapping.lotNumber],
    ].join('\u0000');
    const recentZScores = recentZScoresBySeries.get(seriesKey) ?? [];
    const westgardViolation = detectWestgardViolation(zScore, recentZScores);
    recentZScores.push(zScore);
    recentZScoresBySeries.set(seriesKey, recentZScores);

    const controlDate = row[mapping.controlDate]
        ? new Date(row[mapping.controlDate])
        : new Date();
    if (!Number.isFinite(controlDate.getTime())) {
        errors.push({ row: index + 2, field: mapping.controlDate, message: 'Invalid or missing control date' });
        return null;
    }

    return {
        id: `qc-${source}-${Date.now()}-${index}`,
        limsId: '',
        limsConfigId: source,
        instrumentId: row[mapping.instrumentId] || 'unknown',
        instrumentName: row[mapping.instrumentName] || 'Unknown Instrument',
        analyteCode: row[mapping.analyteCode] || '',
        analyteName: row[mapping.analyteName] || 'Unknown',
        level: parseInt(row[mapping.level]) || 1,
        lotNumber: row[mapping.lotNumber] || '',
        value,
        mean,
        sd,
        cv: sd > 0 && mean !== 0 ? (sd / Math.abs(mean)) * 100 : undefined,
        zScore,
        westgardViolation,
        controlDate,
        labSection: row[mapping.labSection] || 'General',
        accepted: westgardViolation === 'none' || westgardViolation === '1-2s',
        importedAt: new Date(),
    };
}

// ── Public API ───────────────────────────────────────────

/**
 * Parse Bio-Rad Unity CSV export
 */
export function parseBioRadUnityCSV(csvText: string): QCImportResult {
    const rows = parseCSV(csvText);
    const errors: QCImportValidationError[] = [];
    const recentZScoresBySeries = new Map<string, number[]>();
    const records: QCData[] = [];

    for (let i = 0; i < rows.length; i++) {
        const rec = mapRowToQCData(rows[i], BIORAD_COLUMNS, i, recentZScoresBySeries, errors, 'biorad_unity');
        if (rec) records.push(rec);
    }

    return {
        source: 'biorad_unity',
        totalRows: rows.length,
        importedCount: records.length,
        skippedCount: rows.length - records.length,
        errors,
        records,
    };
}

/**
 * Parse Randox QC CSV export
 */
export function parseRandoxCSV(csvText: string): QCImportResult {
    const rows = parseCSV(csvText);
    const errors: QCImportValidationError[] = [];
    const recentZScoresBySeries = new Map<string, number[]>();
    const records: QCData[] = [];

    for (let i = 0; i < rows.length; i++) {
        const rec = mapRowToQCData(rows[i], RANDOX_COLUMNS, i, recentZScoresBySeries, errors, 'randox');
        if (rec) records.push(rec);
    }

    return {
        source: 'randox',
        totalRows: rows.length,
        importedCount: records.length,
        skippedCount: rows.length - records.length,
        errors,
        records,
    };
}

/**
 * Parse a generic CSV/Excel file with user-specified column mapping
 */
export function parseGenericCSV(csvText: string, mapping: QCColumnMapping): QCImportResult {
    const rows = parseCSV(csvText);
    const errors: QCImportValidationError[] = [];
    const recentZScoresBySeries = new Map<string, number[]>();
    const records: QCData[] = [];

    for (let i = 0; i < rows.length; i++) {
        const rec = mapRowToQCData(rows[i], mapping, i, recentZScoresBySeries, errors, 'excel_csv');
        if (rec) records.push(rec);
    }

    return {
        source: 'excel_csv',
        totalRows: rows.length,
        importedCount: records.length,
        skippedCount: rows.length - records.length,
        errors,
        records,
    };
}

/**
 * Parse an Excel (.xlsx) file using ExcelJS (dynamic import)
 */
export async function parseExcelFile(
    file: File,
    source: QCImportSource,
    mapping?: QCColumnMapping,
): Promise<QCImportResult> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
        return {
            source,
            totalRows: 0,
            importedCount: 0,
            skippedCount: 0,
            errors: [{ row: 0, field: 'file', message: 'Empty or invalid worksheet' }],
            records: [],
        };
    }

    // Read headers from row 1
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, colNum) => {
        headers[colNum - 1] = String(cell.value ?? '').trim();
    });

    // Read data rows
    const rows: Record<string, string>[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const record: Record<string, string> = {};
        row.eachCell((cell, colNum) => {
            const h = headers[colNum - 1];
            if (h) record[h] = String(cell.value ?? '').trim();
        });
        if (Object.keys(record).length > 0) rows.push(record);
    }

    const colMap = mapping ?? (source === 'biorad_unity' ? BIORAD_COLUMNS : source === 'randox' ? RANDOX_COLUMNS : mapping!);
    if (!colMap) {
        return {
            source,
            totalRows: rows.length,
            importedCount: 0,
            skippedCount: rows.length,
            errors: [{ row: 0, field: 'mapping', message: 'Column mapping required for generic import' }],
            records: [],
        };
    }

    const errors: QCImportValidationError[] = [];
    const recentZScoresBySeries = new Map<string, number[]>();
    const records: QCData[] = [];
    for (let i = 0; i < rows.length; i++) {
        const rec = mapRowToQCData(rows[i], colMap, i, recentZScoresBySeries, errors, source);
        if (rec) records.push(rec);
    }

    return {
        source,
        totalRows: rows.length,
        importedCount: records.length,
        skippedCount: rows.length - records.length,
        errors,
        records,
    };
}

/**
 * Auto-detect headers in the first row and return column names
 */
export function detectCSVHeaders(csvText: string): string[] {
    const firstLine = csvText.split(/\r?\n/)[0];
    if (!firstLine) return [];
    return firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
}

/**
 * Get a downloadable template CSV for the specified source type
 */
export function getQCImportTemplate(source: QCImportSource): string {
    const cols =
        source === 'biorad_unity'
            ? BIORAD_COLUMNS
            : source === 'randox'
                ? RANDOX_COLUMNS
                : BIORAD_COLUMNS; // default

    const header = Object.values(cols).join(',');
    const sampleRow = [
        'INST-001',
        'Beckman AU5800',
        'GLU',
        'Glucose',
        '1',
        'LOT-2026-01',
        '102.5',
        '100.0',
        '3.2',
        '2026-02-19',
        'Chemistry',
    ].join(',');
    return `${header}\n${sampleRow}\n`;
}
