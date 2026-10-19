import {
  parseGenericCSV,
  type QCColumnMapping,
} from "@/services/qcDataImportService";

const mapping: QCColumnMapping = {
  instrumentId: "Instrument ID",
  instrumentName: "Instrument",
  analyteCode: "Analyte Code",
  analyteName: "Analyte",
  level: "Level",
  lotNumber: "Lot",
  value: "Result",
  mean: "Mean",
  sd: "SD",
  controlDate: "Date",
  labSection: "Department",
};

function csvFor(...values: number[]): string {
  const header =
    "Instrument ID,Instrument,Analyte Code,Analyte,Level,Lot,Result,Mean,SD,Date,Department";
  const rows = values.map(
    (value, index) =>
      `instrument-1,Analyzer,GLU,Glucose,1,lot-1,${value},100,10,2026-01-${String(index + 1).padStart(2, "0")},Chemistry`,
  );
  return [header, ...rows].join("\n");
}

describe("QC import Westgard detection", () => {
  it("prioritizes the 2-2s rejection over the 1-2s warning", () => {
    const result = parseGenericCSV(csvFor(125, 126), mapping);

    expect(result.records[1].westgardViolation).toBe("2-2s");
    expect(result.records[1].accepted).toBe(false);
  });

  it("detects an R-4s rejection across opposite-side control results", () => {
    const result = parseGenericCSV(csvFor(79, 121), mapping);

    expect(result.records[1].westgardViolation).toBe("R-4s");
    expect(result.records[1].accepted).toBe(false);
  });

  it("keeps a single 1-2s result as an accepted warning", () => {
    const result = parseGenericCSV(csvFor(125), mapping);

    expect(result.records[0].westgardViolation).toBe("1-2s");
    expect(result.records[0].accepted).toBe(true);
  });

  it("does not carry Westgard history across different analytes", () => {
    const csv = csvFor(125, 126).replace(
      "instrument-1,Analyzer,GLU,Glucose,1,lot-1,126",
      "instrument-1,Analyzer,ALT,Alanine Aminotransferase,1,lot-1,126",
    );
    const result = parseGenericCSV(csv, mapping);

    expect(result.records[1].westgardViolation).toBe("1-2s");
    expect(result.records[1].accepted).toBe(true);
  });

  it("rejects a zero standard deviation", () => {
    const result = parseGenericCSV(
      csvFor(100).replace(",100,10,", ",100,0,"),
      mapping,
    );

    expect(result.importedCount).toBe(0);
    expect(result.errors).toHaveLength(1);
  });
});
