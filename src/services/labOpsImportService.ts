import * as XLSX from "xlsx";
import type { LabOpsPersistedData } from "@/services/labOpsService";
import {
    SEED_CALIBRATION_RECORDS,
    SEED_CAPA_RECORDS,
    SEED_COMPETENCY_RECORDS,
    SEED_EQUIPMENT,
    SEED_IQC_ANALYTES,
    SEED_IQC_RESULTS,
    SEED_MAINTENANCE_LOGS,
    SEED_PROFICIENCY_TESTS,
    SEED_QUALITY_EVENTS,
    SEED_QUALITY_RISKS,
    SEED_REAGENTS,
} from "@/types/labOps";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const IMPORT_FORMAT = "accreditex-lab-operations-backup";
const importKeys = [
    "equipment",
    "calibrations",
    "maintenanceLogs",
    "reagents",
    "reagentUsageLogs",
    "proficiencyTests",
    "qualityEvents",
    "capaRecords",
    "qualityRisks",
    "competencyRecords",
    "iqcAnalytes",
    "iqcResults",
] as const satisfies readonly (keyof LabOpsPersistedData)[];

type ImportKey = (typeof importKeys)[number];
type ImportRecord = Record<string, unknown>;

export interface LabOpsImportPreview {
    data: LabOpsPersistedData;
    rowCount: number;
    source: "json" | "excel";
}

const requiredFields: Record<ImportKey, string[]> = {
    equipment: [
        "id", "name", "manufacturer", "model", "serialNumber", "category", "labSection",
        "location", "status", "purchaseDate", "calibrationIntervalDays", "maintenanceIntervalDays",
    ],
    calibrations: ["id", "equipmentId", "equipmentName", "calibratedBy", "calibrationDate", "nextDueDate", "result"],
    maintenanceLogs: [
        "id", "equipmentId", "equipmentName", "type", "status", "performedBy", "scheduledDate", "description",
    ],
    reagents: [
        "id", "name", "manufacturer", "catalogNumber", "lotNumber", "expirationDate", "receivedDate",
        "quantity", "unit", "reorderLevel", "storageConditions", "labSection", "status",
    ],
    reagentUsageLogs: ["id", "reagentId", "reagentName", "usedBy", "usageDate", "quantityUsed", "unit"],
    proficiencyTests: [
        "id", "program", "provider", "surveyId", "analyteName", "labSection", "enrollmentDate",
        "status", "acceptable", "correctiveActionRequired",
    ],
    qualityEvents: ["id", "eventDate", "labSection", "source", "title", "description", "severity", "status"],
    capaRecords: ["id", "title", "owner", "dueDate", "status", "actionPlan"],
    qualityRisks: [
        "id", "title", "hazard", "potentialHarm", "labSection", "owner", "likelihood", "impact",
        "riskScore", "riskLevel", "status",
    ],
    competencyRecords: [
        "id", "staffName", "analyteCode", "analyteName", "labSection", "status",
        "authorizedUntil", "lastAssessedDate", "assessor",
    ],
    iqcAnalytes: [
        "id", "analyteCode", "analyteName", "labSection", "equipmentId", "equipmentName",
        "controlMaterial", "controlLot", "level", "targetMean", "targetSD", "unit", "active",
    ],
    iqcResults: [
        "id", "analyteId", "analyteName", "analyteCode", "labSection", "equipmentId", "level",
        "measuredValue", "sdFromMean", "measuredAt", "measuredBy", "violatedRules", "rejected",
    ],
};

const numericFields = new Set([
    "calibrationIntervalDays", "maintenanceIntervalDays", "quantity", "reorderLevel",
    "quantityUsed", "downtimeHours", "cost", "submittedValue", "peerMean", "peerSD",
    "sdIndex", "score", "likelihood", "impact", "riskScore", "level", "targetMean", "sdFromMean",
    "targetSD", "measuredValue",
]);
const booleanFields = new Set(["acceptable", "correctiveActionRequired", "active", "rejected"]);
const arrayFields = new Set(["complianceStandardIds", "partsReplaced", "associatedTests", "violatedRules"]);
const generatedTimestampFields: Partial<Record<ImportKey, string[]>> = {
    equipment: ["createdAt", "updatedAt"],
    calibrations: ["createdAt"],
    maintenanceLogs: ["createdAt", "updatedAt"],
    reagents: ["createdAt", "updatedAt"],
    proficiencyTests: ["createdAt", "updatedAt"],
    qualityEvents: ["createdAt", "updatedAt"],
    capaRecords: ["createdAt", "updatedAt"],
    qualityRisks: ["createdAt", "updatedAt"],
    competencyRecords: ["createdAt", "updatedAt"],
    iqcAnalytes: ["createdAt", "updatedAt"],
    iqcResults: ["createdAt"],
};

const seedRecords: Record<ImportKey, readonly object[]> = {
    equipment: SEED_EQUIPMENT,
    calibrations: SEED_CALIBRATION_RECORDS,
    maintenanceLogs: SEED_MAINTENANCE_LOGS,
    reagents: SEED_REAGENTS,
    reagentUsageLogs: [],
    proficiencyTests: SEED_PROFICIENCY_TESTS,
    qualityEvents: SEED_QUALITY_EVENTS,
    capaRecords: SEED_CAPA_RECORDS,
    qualityRisks: SEED_QUALITY_RISKS,
    competencyRecords: SEED_COMPETENCY_RECORDS,
    iqcAnalytes: SEED_IQC_ANALYTES,
    iqcResults: SEED_IQC_RESULTS,
};

function getTemplateHeaders(key: ImportKey): string[] {
    const headers = [...new Set(seedRecords[key].flatMap((record) => Object.keys(record)))];
    if (!headers.includes("id")) headers.unshift("id");
    if (key === "reagentUsageLogs") {
        for (const field of [
            "reagentId", "reagentName", "usedBy", "usageDate", "quantityUsed", "unit",
            "equipmentId", "testCode", "notes",
        ]) {
            if (!headers.includes(field)) headers.push(field);
        }
    }
    return headers;
}

function emptyData(): LabOpsPersistedData {
    return {
        equipment: [],
        calibrations: [],
        maintenanceLogs: [],
        reagents: [],
        reagentUsageLogs: [],
        proficiencyTests: [],
        qualityEvents: [],
        capaRecords: [],
        qualityRisks: [],
        competencyRecords: [],
        iqcAnalytes: [],
        iqcResults: [],
    };
}

function isRecord(value: unknown): value is ImportRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function validateRecords(data: ImportRecord, allowPartial: boolean): { data: LabOpsPersistedData; rowCount: number } {
    const result = emptyData();
    const recordsByKey = result as Record<ImportKey, unknown[]>;
    const errors: string[] = [];
    let rowCount = 0;

    for (const key of importKeys) {
        const records = data[key];
        if (records === undefined && allowPartial) continue;
        if (!Array.isArray(records)) {
            errors.push(`${key} must be a list of records`);
            continue;
        }

        const seenIds = new Set<string>();
        for (const [index, value] of records.entries()) {
            const row = index + 2;
            if (!isRecord(value)) {
                errors.push(`${key}, row ${row}: expected a record`);
                continue;
            }
            const unsafeField = Object.keys(value).find((field) =>
                field === "__proto__" || field === "prototype" || field === "constructor");
            if (unsafeField) {
                errors.push(`${key}, row ${row}: unsupported field "${unsafeField}"`);
                continue;
            }

            const missing = requiredFields[key].filter((field) => {
                const fieldValue = value[field];
                return fieldValue === undefined || fieldValue === null
                    || (typeof fieldValue === "string" && !fieldValue.trim())
                    || (numericFields.has(field) && (typeof fieldValue !== "number" || !Number.isFinite(fieldValue)))
                    || (booleanFields.has(field) && typeof fieldValue !== "boolean");
            });
            if (missing.length) {
                errors.push(`${key}, row ${row}: missing or invalid ${missing.join(", ")}`);
                continue;
            }

            const id = String(value.id).trim();
            if (seenIds.has(id)) {
                errors.push(`${key}, row ${row}: duplicate ID "${id}" in this file`);
                continue;
            }
            seenIds.add(id);

            const invalidValue = Object.entries(value).find(([, field]) =>
                !isImportValue(field));
            if (invalidValue) {
                errors.push(`${key}, row ${row}: "${invalidValue[0]}" contains an unsupported value`);
                continue;
            }
            const invalidArray = [...arrayFields].find((field) =>
                value[field] !== undefined && !Array.isArray(value[field]));
            if (invalidArray) {
                errors.push(`${key}, row ${row}: "${invalidArray}" must be a JSON array`);
                continue;
            }

            const normalized: ImportRecord = { ...value, id };
            for (const field of generatedTimestampFields[key] ?? []) {
                if (normalized[field] === undefined) normalized[field] = new Date().toISOString();
            }
            recordsByKey[key].push(normalized);
            rowCount += 1;
        }
    }

    if (errors.length) {
        throw new Error(`Import validation failed: ${errors.slice(0, 8).join("; ")}`);
    }
    if (rowCount === 0) throw new Error("The selected file contains no Lab Operations records to import");
    return { data: result, rowCount };
}

function isImportValue(value: unknown): boolean {
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value)) return value.every(isImportValue);
    if (isRecord(value)) {
        return Object.entries(value).every(([key, field]) =>
            key !== "__proto__" && key !== "prototype" && key !== "constructor" && isImportValue(field));
    }
    return false;
}

function parseJsonBackup(text: string, organizationId: string): LabOpsImportPreview {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error("This file is not valid JSON");
    }
    if (!isRecord(parsed) || parsed.format !== IMPORT_FORMAT || parsed.version !== 1) {
        throw new Error("This is not a supported AccreditEx Lab Operations backup");
    }
    if (parsed.organizationId !== organizationId) {
        throw new Error("This backup belongs to a different organization");
    }
    if (!isRecord(parsed.data)) throw new Error("The backup is missing its Lab Operations data");

    const unknownKey = Object.keys(parsed.data).find((key) => !importKeys.includes(key as ImportKey));
    if (unknownKey) throw new Error(`Unsupported Lab Operations data group: ${unknownKey}`);
    const validated = validateRecords(parsed.data, true);
    return { ...validated, source: "json" };
}

function parseCell(value: unknown, header: string): unknown {
    if (value === null || value === undefined || value === "") return undefined;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "number" && /date|at$/i.test(header)) {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
            const month = String(date.m).padStart(2, "0");
            const day = String(date.d).padStart(2, "0");
            return `${date.y}-${month}-${day}`;
        }
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]"))
            || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
            try {
                return JSON.parse(trimmed) as unknown;
            } catch {
                throw new Error(`The "${header}" cell must contain valid JSON for arrays or objects`);
            }
        }
    }
    if (numericFields.has(header) && typeof value === "string" && value.trim()) {
        const number = Number(value);
        return Number.isFinite(number) ? number : value;
    }
    if (typeof value === "string" && /^(true|false)$/i.test(value.trim())) {
        return value.trim().toLowerCase() === "true";
    }
    return value;
}

function parseExcel(buffer: ArrayBuffer): LabOpsImportPreview {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const data: ImportRecord = {};
    const knownSheets = new Set<string>(importKeys);
    const unknownSheets = workbook.SheetNames.filter((name) =>
        name !== "Instructions" && !knownSheets.has(name));
    if (unknownSheets.length) throw new Error(`Unsupported worksheet: ${unknownSheets.join(", ")}`);

    for (const key of importKeys) {
        const sheet = workbook.Sheets[key];
        if (!sheet) continue;
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1, defval: null, blankrows: false, raw: true,
        }) as unknown[][];
        if (!rows.length) continue;

        const headers = rows[0].map((header) => String(header ?? "").trim());
        if (headers.some((header) => !header)) throw new Error(`${key}: every column needs a header`);
        const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
        if (duplicateHeader) throw new Error(`${key}: duplicate column "${duplicateHeader}"`);
        const unknownHeader = headers.find((header) => !getTemplateHeaders(key).includes(header));
        if (unknownHeader) throw new Error(`${key}: unsupported column "${unknownHeader}"`);

        const records: ImportRecord[] = [];
        for (const row of rows.slice(1)) {
            if (row.every((value) => value === null || value === undefined || value === "")) continue;
            const record: ImportRecord = {};
            headers.forEach((header, column) => {
                const value = parseCell(row[column], header);
                if (value !== undefined) record[header] = value;
            });
            records.push(record);
            if (records.length > 10_000) throw new Error(`${key}: maximum 10,000 rows per worksheet`);
        }
        if (records.length) data[key] = records;
    }

    const validated = validateRecords(data, true);
    return { ...validated, source: "excel" };
}

export async function parseLabOpsImportFile(
    file: File,
    organizationId: string,
): Promise<LabOpsImportPreview> {
    if (!organizationId) throw new Error("Select an active organization before importing");
    if (file.size > MAX_IMPORT_BYTES) throw new Error("Import files must be 10 MB or smaller");
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension === "json") return parseJsonBackup(await file.text(), organizationId);
    if (extension === "xlsx") return parseExcel(await file.arrayBuffer());
    throw new Error("Choose an AccreditEx JSON backup or an .xlsx workbook");
}

export function createLabOpsExcelTemplate(): ArrayBuffer {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
        ["AccreditEx Lab Operations Import Template"],
        ["Use the worksheet named for each record group; leave unused sheets empty."],
        ["Every record needs a unique ID. Existing IDs are skipped; imports only add records."],
        ["Use JSON text in cells for array fields, for example [\"Chemistry\", \"Hematology\"]."],
        ["Use ISO dates (YYYY-MM-DD). Do not rename worksheets or column headers."],
        ["Export a Lab Operations JSON backup to preserve all fields and record links."],
    ]), "Instructions");

    for (const key of importKeys) {
        const sheet = XLSX.utils.aoa_to_sheet([getTemplateHeaders(key)]);
        XLSX.utils.book_append_sheet(workbook, sheet, key);
    }

    return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export const LAB_OPS_IMPORT_KEYS = importKeys;
