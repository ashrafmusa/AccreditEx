import * as XLSX from "xlsx";
import {
    createLabOpsExcelTemplate,
    parseLabOpsImportFile,
} from "@/services/labOpsImportService";

function jsonFile(payload: unknown): File {
    const file = new File([JSON.stringify(payload)], "lab-operations.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => JSON.stringify(payload) });
    return file;
}

const equipmentRecord = (id: string, name = "Analyzer") => ({
    id,
    name,
    manufacturer: "Acme",
    model: "A1",
    serialNumber: `${id}-serial`,
    category: "analyzer",
    labSection: "Chemistry",
    location: "Main Lab",
    status: "active",
    purchaseDate: "2026-01-01",
    calibrationIntervalDays: 365,
    maintenanceIntervalDays: 365,
});

describe("Lab Operations import", () => {
    it("accepts an organization-matched JSON backup and keeps only uploaded records", async () => {
        const preview = await parseLabOpsImportFile(jsonFile({
            format: "accreditex-lab-operations-backup",
            version: 1,
            organizationId: "org-a",
            data: {
                equipment: [equipmentRecord("eq-1")],
            },
        }), "org-a");

        expect(preview.source).toBe("json");
        expect(preview.rowCount).toBe(1);
        expect(preview.data.equipment[0]).toMatchObject(equipmentRecord("eq-1"));
        expect(preview.data.equipment[0].createdAt).toEqual(expect.any(String));
        expect(preview.data.reagents).toEqual([]);
    });

    it("rejects backups from another organization and invalid record rows", async () => {
        const backup = {
            format: "accreditex-lab-operations-backup",
            version: 1,
            organizationId: "org-b",
            data: { equipment: [equipmentRecord("eq-1")] },
        };
        await expect(parseLabOpsImportFile(jsonFile(backup), "org-a"))
            .rejects.toThrow("different organization");
        await expect(parseLabOpsImportFile(jsonFile({
            ...backup,
            organizationId: "org-a",
            data: { equipment: [{ id: "eq-1", category: "analyzer" }] },
        }), "org-a")).rejects.toThrow("missing or invalid name");
    });

    it("rejects duplicate IDs inside a workbook rather than importing ambiguous rows", async () => {
        const workbook = XLSX.utils.book_new();
        const first = equipmentRecord("eq-1", "Analyzer A");
        const second = equipmentRecord("eq-1", "Analyzer B");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
            Object.keys(first),
            Object.values(first),
            Object.values(second),
        ]), "equipment");
        const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
        const file = new File([bytes], "lab-operations.xlsx");
        Object.defineProperty(file, "arrayBuffer", { value: async () => bytes });

        await expect(parseLabOpsImportFile(file, "org-a"))
            .rejects.toThrow('duplicate ID "eq-1"');
    });

    it("parses Excel rows into typed records and fills audit timestamps", async () => {
        const workbook = XLSX.utils.book_new();
        const equipment = equipmentRecord("eq-xlsx");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
            Object.keys(equipment),
            Object.values(equipment),
        ]), "equipment");
        const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
        const file = new File([bytes], "lab-operations.xlsx");
        Object.defineProperty(file, "arrayBuffer", { value: async () => bytes });

        const preview = await parseLabOpsImportFile(file, "org-a");

        expect(preview.source).toBe("excel");
        expect(preview.data.equipment[0]).toMatchObject(equipment);
        expect(preview.data.equipment[0].calibrationIntervalDays).toBe(365);
        expect(preview.data.equipment[0].createdAt).toEqual(expect.any(String));
    });

    it("creates an empty workbook template with a worksheet for each supported record group", () => {
        const bytes = createLabOpsExcelTemplate();
        const workbook = XLSX.read(bytes, { type: "array" });

        expect(workbook.SheetNames).toEqual(expect.arrayContaining([
            "Instructions", "equipment", "calibrations", "maintenanceLogs", "reagents",
            "reagentUsageLogs", "proficiencyTests", "qualityEvents", "capaRecords",
            "qualityRisks", "competencyRecords", "iqcAnalytes", "iqcResults",
        ]));
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets.equipment, { header: 1 });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toContain("id");
    });
});
