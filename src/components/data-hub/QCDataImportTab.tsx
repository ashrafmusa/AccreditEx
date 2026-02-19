/**
 * QC Data Import Tab
 * Allows admins to import Quality Control data from Bio-Rad Unity, Randox, or generic CSV/Excel files
 * Shows parsed data preview with Westgard violation highlighting before confirming import
 */

import React, { useState, useRef, useCallback } from "react";
import type { QCData, WestgardRule } from "@/services/limsIntegration/types";
import {
  QCImportSource,
  QC_IMPORT_SOURCE_LABELS,
  QCImportResult,
  QCColumnMapping,
  parseBioRadUnityCSV,
  parseRandoxCSV,
  parseGenericCSV,
  parseExcelFile,
  detectCSVHeaders,
  getQCImportTemplate,
} from "@/services/qcDataImportService";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  DownloadIcon,
} from "@/components/icons";

// ── Westgard display helpers ─────────────────────────────

const WESTGARD_LABELS: Record<WestgardRule, string> = {
  none: "None",
  "1-2s": "1-2s Warning",
  "1-3s": "1-3s Reject",
  "2-2s": "2-2s Reject",
  "R-4s": "R-4s Reject",
  "4-1s": "4-1s Reject",
  "10x": "10× Reject",
};

const westgardColor = (rule: WestgardRule): string => {
  if (rule === "none") return "text-green-600 dark:text-green-400";
  if (rule === "1-2s") return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const westgardBgColor = (rule: WestgardRule): string => {
  if (rule === "none") return "";
  if (rule === "1-2s")
    return "bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400";
  return "bg-red-50 dark:bg-red-900/20 border-l-2 border-red-400";
};

// ── Component ────────────────────────────────────────────

const QCDataImportTab: React.FC = () => {
  const [source, setSource] = useState<QCImportSource>("biorad_unity");
  const [step, setStep] = useState<"select" | "mapping" | "preview" | "done">(
    "select",
  );
  const [importResult, setImportResult] = useState<QCImportResult | null>(null);
  const [allImported, setAllImported] = useState<QCData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawCSV, setRawCSV] = useState<string>("");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Partial<QCColumnMapping>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File reading ─────────────────────────────────────

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      try {
        const isExcel =
          file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
        if (isExcel) {
          setRawFile(file);
          // For generic mapping, read headers from Excel
          if (source === "excel_csv") {
            const text = await file.text(); // Won't work for xlsx binary, but we handle below
            // For xlsx we detect headers differently — show mapping step
            setHeaders([]); // will be filled by Excel parser
            setStep("mapping");
          } else {
            // Known source with known mapping — parse immediately
            const result = await parseExcelFile(file, source);
            setImportResult(result);
            setStep("preview");
          }
        } else {
          // CSV
          const text = await file.text();
          setRawCSV(text);
          if (source === "excel_csv") {
            // Show mapping step
            const cols = detectCSVHeaders(text);
            setHeaders(cols);
            setStep("mapping");
          } else {
            // Known source — parse immediately
            const result =
              source === "biorad_unity"
                ? parseBioRadUnityCSV(text)
                : parseRandoxCSV(text);
            setImportResult(result);
            setStep("preview");
          }
        }
      } catch (err) {
        console.error("File parse error:", err);
        setImportResult({
          source,
          totalRows: 0,
          importedCount: 0,
          skippedCount: 0,
          errors: [
            {
              row: 0,
              field: "file",
              message: `Failed to parse file: ${err}`,
            },
          ],
          records: [],
        });
        setStep("preview");
      } finally {
        setLoading(false);
      }
    },
    [source],
  );

  const handleMappingComplete = useCallback(async () => {
    const requiredFields: (keyof QCColumnMapping)[] = [
      "value",
      "mean",
      "sd",
      "analyteName",
    ];
    const missing = requiredFields.filter((f) => !mapping[f]);
    if (missing.length) return;

    setLoading(true);
    try {
      const fullMapping: QCColumnMapping = {
        instrumentId: mapping.instrumentId || "",
        instrumentName: mapping.instrumentName || "",
        analyteCode: mapping.analyteCode || "",
        analyteName: mapping.analyteName || "",
        level: mapping.level || "",
        lotNumber: mapping.lotNumber || "",
        value: mapping.value || "",
        mean: mapping.mean || "",
        sd: mapping.sd || "",
        controlDate: mapping.controlDate || "",
        labSection: mapping.labSection || "",
      };
      let result: QCImportResult;
      if (rawFile) {
        result = await parseExcelFile(rawFile, "excel_csv", fullMapping);
      } else {
        result = parseGenericCSV(rawCSV, fullMapping);
      }
      setImportResult(result);
      setStep("preview");
    } catch (err) {
      console.error("Mapping parse error:", err);
    } finally {
      setLoading(false);
    }
  }, [mapping, rawCSV, rawFile]);

  const handleConfirmImport = () => {
    if (!importResult) return;
    setAllImported((prev) => [...prev, ...importResult.records]);
    setStep("done");
  };

  const handleReset = () => {
    setStep("select");
    setImportResult(null);
    setHeaders([]);
    setRawCSV("");
    setRawFile(null);
    setMapping({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadTemplate = () => {
    const csv = getQCImportTemplate(source);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qc-import-template-${source}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Renders ──────────────────────────────────────────

  const renderSourceSelect = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            Import QC Data
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Import Quality Control data from Bio-Rad Unity, Randox, or custom
            CSV/Excel files for Westgard rule evaluation and compliance
            dashboards.
          </p>
        </div>
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(
          Object.entries(QC_IMPORT_SOURCE_LABELS).filter(
            ([k]) => k !== "manual",
          ) as [QCImportSource, string][]
        ).map(([key, label]) => (
          <Card
            key={key}
            className={`p-4 cursor-pointer transition-all ${source === key ? "ring-2 ring-brand-primary" : "hover:shadow-md"}`}
            onClick={() => setSource(key)}
          >
            <div className="flex items-center gap-3 mb-2">
              <BeakerIcon
                className={`h-6 w-6 ${source === key ? "text-brand-primary" : "text-gray-400"}`}
              />
              <span className="font-semibold dark:text-dark-brand-text-primary">
                {label}
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {key === "biorad_unity" &&
                "Standard Bio-Rad Unity QC export CSV/XLSX format"}
              {key === "randox" &&
                "Randox QC data export with TestCode columns"}
              {key === "excel_csv" &&
                "Custom CSV or Excel file — you'll map columns manually"}
            </p>
          </Card>
        ))}
      </div>

      {/* Upload area */}
      <Card className="p-6 text-center border-dashed border-2">
        <BeakerIcon className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file from{" "}
          {QC_IMPORT_SOURCE_LABELS[source]}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          id="qc-file-input"
        />
        <div className="flex items-center justify-center gap-3">
          <label htmlFor="qc-file-input">
            <Button
              variant="primary"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {loading ? "Reading…" : "Select File"}
            </Button>
          </label>
          <Button
            variant="ghost"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            Download Template
          </Button>
        </div>
      </Card>

      {/* Previously imported summary */}
      {allImported.length > 0 && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-300">
              {allImported.length} QC records imported this session
            </span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Westgard violations:{" "}
            {allImported.filter((r) => r.westgardViolation !== "none").length}
          </p>
        </Card>
      )}
    </div>
  );

  const renderMappingStep = () => {
    const fields: {
      key: keyof QCColumnMapping;
      label: string;
      required: boolean;
    }[] = [
      { key: "value", label: "Result Value *", required: true },
      { key: "mean", label: "Mean *", required: true },
      { key: "sd", label: "Standard Deviation *", required: true },
      { key: "analyteName", label: "Analyte Name *", required: true },
      { key: "analyteCode", label: "Analyte Code", required: false },
      { key: "instrumentId", label: "Instrument ID", required: false },
      { key: "instrumentName", label: "Instrument Name", required: false },
      { key: "level", label: "QC Level", required: false },
      { key: "lotNumber", label: "Lot Number", required: false },
      { key: "controlDate", label: "Date", required: false },
      { key: "labSection", label: "Lab Section", required: false },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            ← Back
          </Button>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            Map Columns
          </h2>
        </div>
        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          Map your file columns to QC data fields. Fields marked * are required.
        </p>
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                  {f.label}
                </label>
                <select
                  value={mapping[f.key] || ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [f.key]: e.target.value })
                  }
                  className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">— Select column —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              onClick={handleMappingComplete}
              disabled={
                loading ||
                !mapping.value ||
                !mapping.mean ||
                !mapping.sd ||
                !mapping.analyteName
              }
            >
              {loading ? "Parsing…" : "Parse & Preview"}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderPreview = () => {
    if (!importResult) return null;
    const violations = importResult.records.filter(
      (r) => r.westgardViolation !== "none",
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            ← Back
          </Button>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            Preview &amp; Confirm
          </h2>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-brand-primary">
              {importResult.totalRows}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Total Rows
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {importResult.importedCount}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Valid Records
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {violations.length}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Westgard Violations
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">
              {importResult.skippedCount}
            </p>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Skipped / Errors
            </p>
          </Card>
        </div>

        {/* Errors */}
        {importResult.errors.length > 0 && (
          <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-1">
              Validation Errors
            </h4>
            <div className="max-h-32 overflow-y-auto text-xs text-red-600 dark:text-red-400 space-y-0.5">
              {importResult.errors.slice(0, 20).map((e, i) => (
                <p key={i}>
                  Row {e.row}: {e.field} — {e.message}
                </p>
              ))}
              {importResult.errors.length > 20 && (
                <p>…and {importResult.errors.length - 20} more</p>
              )}
            </div>
          </Card>
        )}

        {/* Data table */}
        {importResult.records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-2 py-1.5 text-left font-medium">Analyte</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Instrument
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium">Level</th>
                  <th className="px-2 py-1.5 text-right font-medium">Value</th>
                  <th className="px-2 py-1.5 text-right font-medium">Mean</th>
                  <th className="px-2 py-1.5 text-right font-medium">SD</th>
                  <th className="px-2 py-1.5 text-right font-medium">
                    Z-Score
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Westgard
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {importResult.records.slice(0, 100).map((rec) => (
                  <tr
                    key={rec.id}
                    className={`border-b border-gray-100 dark:border-gray-700 ${westgardBgColor(rec.westgardViolation)}`}
                  >
                    <td className="px-2 py-1.5 dark:text-dark-brand-text-primary">
                      {rec.analyteName}
                    </td>
                    <td className="px-2 py-1.5 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {rec.instrumentName}
                    </td>
                    <td className="px-2 py-1.5 text-right">{rec.level}</td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {rec.value.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {rec.mean.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {rec.sd.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-medium">
                      {rec.zScore?.toFixed(2) ?? "—"}
                    </td>
                    <td
                      className={`px-2 py-1.5 font-medium ${westgardColor(rec.westgardViolation)}`}
                    >
                      {WESTGARD_LABELS[rec.westgardViolation]}
                    </td>
                    <td className="px-2 py-1.5 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {new Date(rec.controlDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {importResult.records.length > 100 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Showing first 100 of {importResult.records.length} records
              </p>
            )}
          </div>
        )}

        {/* Confirm */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleReset}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmImport}
            disabled={importResult.importedCount === 0}
            className="flex items-center gap-2"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Import {importResult.importedCount} Records
          </Button>
        </div>
      </div>
    );
  };

  const renderDone = () => (
    <div className="space-y-4">
      <Card className="p-8 text-center bg-green-50 dark:bg-green-900/20">
        <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
        <h2 className="text-xl font-bold text-green-700 dark:text-green-300">
          Import Successful
        </h2>
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          {importResult?.importedCount ?? 0} QC records imported from{" "}
          {QC_IMPORT_SOURCE_LABELS[source]}.
          {(importResult?.records.filter((r) => r.westgardViolation !== "none")
            .length ?? 0) > 0 && (
            <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
              {
                importResult?.records.filter(
                  (r) => r.westgardViolation !== "none",
                ).length
              }{" "}
              Westgard violation(s) detected — review in QC dashboard.
            </span>
          )}
        </p>
        <Button variant="primary" onClick={handleReset} className="mt-4">
          Import More Data
        </Button>
      </Card>
    </div>
  );

  return (
    <div>
      {step === "select" && renderSourceSelect()}
      {step === "mapping" && renderMappingStep()}
      {step === "preview" && renderPreview()}
      {step === "done" && renderDone()}
    </div>
  );
};

export default QCDataImportTab;
