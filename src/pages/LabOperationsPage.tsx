/**
 * Lab Operations Hub Page
 * Equipment management, maintenance, reagent tracking, QC dashboard, proficiency testing
 */
import {
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckBadgeIcon,
  ClockIcon,
  CogIcon,
  PrinterIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useToast } from "@/hooks/useToast";
import type { LabOpsTab } from "@/types/labOps";
import { computeAnalyticalSigma } from "@/types/labOps";
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { LabOpsImportPreview } from "@/services/labOpsImportService";

const EquipmentTab = lazy(() => import("@/components/lab-ops/EquipmentTab"));
const MaintenanceTab = lazy(
  () => import("@/components/lab-ops/MaintenanceTab"),
);
const ReagentTab = lazy(() => import("@/components/lab-ops/ReagentTab"));
const QCDashboardTab = lazy(
  () => import("@/components/lab-ops/QCDashboardTab"),
);
const ProficiencyTestingTab = lazy(
  () => import("@/components/lab-ops/ProficiencyTestingTab"),
);
const QualityManagementTab = lazy(
  () => import("@/components/lab-ops/QualityManagementTab"),
);
const IQCWestgardTab = lazy(
  () => import("@/components/lab-ops/IQCWestgardTab"),
);
const CompetencyMatrixTab = lazy(
  () => import("@/components/lab-ops/CompetencyMatrixTab"),
);

const tabs: {
  key: LabOpsTab;
  labelKey: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  { key: "equipment", labelKey: "tabEquipment", icon: CogIcon },
  { key: "maintenance", labelKey: "tabMaintenance", icon: ClockIcon },
  { key: "reagents", labelKey: "tabReagents", icon: BeakerIcon },
  { key: "qcDashboard", labelKey: "tabQCDashboard", icon: ChartBarIcon },
  {
    key: "proficiency",
    labelKey: "tabProficiencyTesting",
    icon: CheckBadgeIcon,
  },
  {
    key: "qualityManagement",
    labelKey: "tabQualityManagement",
    icon: ShieldCheckIcon,
  },
  {
    key: "iqcWestgard",
    labelKey: "tabIQCWestgard",
    icon: ChartPieIcon,
  },
  {
    key: "competencyMatrix",
    labelKey: "tabCompetencyMatrix",
    icon: UserGroupIcon,
  },
];

const LabOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabOpsTab>("equipment");
  const { t } = useTranslation();
  const toast = useToast();
  const { isAdmin } = useAdminGuard();
  const syncStatus = useLabOpsStore((state) => state.syncStatus);
  const syncError = useLabOpsStore((state) => state.syncError);
  const lastSyncedAt = useLabOpsStore((state) => state.lastSyncedAt);
  const retrySyncNow = useLabOpsStore((state) => state.retrySyncNow);
  const organizationId = useTenantStore((state) => state.organizationId);
  const loadedOrganizationId = useLabOpsStore((state) => state.loadedOrganizationId);
  const hasLoaded = useLabOpsStore((state) => state.hasLoadedFromFirestore);
  const recordMode = useLabOpsStore((state) => state.recordMode);
  const resetOrganizationData = useLabOpsStore((state) => state.resetOrganizationData);
  const importOrganizationData = useLabOpsStore((state) => state.importOrganizationData);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importPreview, setImportPreview] = useState<LabOpsImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingData, setImportingData] = useState(false);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  useEffect(() => {
    const state = useLabOpsStore.getState();
    if (!state.hasLoadedFromFirestore || state.loadedOrganizationId !== organizationId) {
      void state.loadFromFirestore();
    }
  }, [organizationId]);

  const syncBadgeClass =
    syncStatus === "saving"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : syncStatus === "synced"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        : syncStatus === "error"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const syncLabel =
    syncStatus === "saving"
      ? t("saving") || "Saving"
      : syncStatus === "synced"
        ? t("synced") || "Synced"
        : syncStatus === "error"
          ? t("syncFailed") || "Sync failed"
          : t("idle") || "Idle";

  const handleDownloadResetBackup = async () => {
    try {
      await useLabOpsStore.getState().flushPendingSaves();
      const state = useLabOpsStore.getState();
      if (state.syncStatus === "error" || !state.hasLoadedFromFirestore
        || state.loadedOrganizationId !== organizationId) {
        throw new Error(state.syncError || "Load and synchronize this organization's Lab Operations data before backing it up");
      }
      const data = {
        equipment: state.equipment,
        calibrations: state.calibrations,
        maintenanceLogs: state.maintenanceLogs,
        reagents: state.reagents,
        reagentUsageLogs: state.reagentUsageLogs,
        proficiencyTests: state.proficiencyTests,
        qualityEvents: state.qualityEvents,
        capaRecords: state.capaRecords,
        qualityRisks: state.qualityRisks,
        competencyRecords: state.competencyRecords,
        iqcAnalytes: state.iqcAnalytes,
        iqcResults: state.iqcResults,
      };
      const backup = {
        format: "accreditex-lab-operations-backup",
        version: 1,
        organizationId,
        exportedAt: new Date().toISOString(),
        data,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lab-operations-${organizationId}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setBackupDownloaded(true);
    } catch (error) {
      console.error("Failed to create Lab Operations backup:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsBackupFailed"));
    }
  };

  const handleResetOrganizationData = async () => {
    if (!organizationId || resetConfirmation !== organizationId || !backupDownloaded) return;
    setResettingData(true);
    try {
      await resetOrganizationData(organizationId);
      toast.success(t("labOpsResetSuccess"));
      setShowResetPanel(false);
      setResetConfirmation("");
      setBackupDownloaded(false);
    } catch (error) {
      console.error("Failed to reset Lab Operations data:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsResetFailed"));
    } finally {
      setResettingData(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const { createLabOpsExcelTemplate } = await import("@/services/labOpsImportService");
      const template = createLabOpsExcelTemplate();
      const url = URL.createObjectURL(new Blob([template], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "accreditex-lab-operations-import-template.xlsx";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("Failed to create Lab Operations import template:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsImportFailed"));
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setImportError(null);
    setImportPreview(null);
    try {
      if (recordMode) {
        throw new Error(t("labOpsImportRecordModeBlocked"));
      }
      if (!hasLoaded || loadedOrganizationId !== organizationId) {
        throw new Error(t("labOpsLoadingRequired"));
      }
      const { parseLabOpsImportFile } = await import("@/services/labOpsImportService");
      setImportPreview(await parseLabOpsImportFile(file, organizationId || ""));
    } catch (error) {
      console.error("Failed to preview Lab Operations import:", error);
      setImportError(error instanceof Error ? error.message : t("labOpsImportFailed"));
    }
  };

  const handleConfirmImport = async () => {
    if (!organizationId || !importPreview || importingData) return;
    setImportingData(true);
    try {
      const result = await importOrganizationData(organizationId, importPreview.data);
      toast.success(t("labOpsImportSuccess", result));
      setImportPreview(null);
      setShowImportPanel(false);
      if (importFileRef.current) importFileRef.current.value = "";
    } catch (error) {
      console.error("Failed to import Lab Operations data:", error);
      toast.error(error instanceof Error ? error.message : t("labOpsImportFailed"));
    } finally {
      setImportingData(false);
    }
  };

  const currentOrganization = useTenantStore((state) => state.currentOrganization);
  const equipment = useLabOpsStore((state) => state.equipment);
  const reagents = useLabOpsStore((state) => state.reagents);
  const iqcAnalytes = useLabOpsStore((state) => state.iqcAnalytes);
  const iqcResults = useLabOpsStore((state) => state.iqcResults);
  const proficiencyTests = useLabOpsStore((state) => state.proficiencyTests);
  const capaRecords = useLabOpsStore((state) => state.capaRecords);
  const competencyRecords = useLabOpsStore((state) => state.competencyRecords);

  const labMetrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const activeAnalyzers = equipment.filter((e) => e.status === "active").length;
    const overdueCalOrMaint = equipment.filter(
      (e) =>
        e.status !== "decommissioned" &&
        ((e.nextCalibrationDue && e.nextCalibrationDue < today) ||
          (e.nextMaintenanceDue && e.nextMaintenanceDue < today)),
    ).length;

    const alertReagents = reagents.filter(
      (r) =>
        r.status === "low_stock" ||
        r.status === "expired" ||
        r.status === "quarantine" ||
        r.lotVerificationStatus === "pending",
    ).length;

    const rejectedIqcCount = iqcResults.filter((r) => r.rejected).length;
    const iqcPassRate =
      iqcResults.length > 0
        ? Math.round(
            ((iqcResults.length - rejectedIqcCount) / iqcResults.length) * 100,
          )
        : 100;

    const sigmaValues = iqcAnalytes
      .filter((a) => a.active)
      .map((a) =>
        computeAnalyticalSigma(
          a,
          iqcResults.filter((r) => r.analyteId === a.id),
        ),
      )
      .filter((m): m is NonNullable<typeof m> => m !== null);
    const avgSigma =
      sigmaValues.length > 0
        ? (
            sigmaValues.reduce((acc, s) => acc + s.sigma, 0) /
            sigmaValues.length
          ).toFixed(1)
        : "—";

    const unacceptablePt = proficiencyTests.filter(
      (pt) => pt.status === "unacceptable" || (!pt.acceptable && pt.status === "reviewed"),
    ).length;
    const openCapas = capaRecords.filter((c) => c.status !== "closed").length;

    const authorizedStaffCount = competencyRecords.filter(
      (c) => c.status === "authorized" && c.authorizedUntil >= today,
    ).length;
    const competencyRate =
      competencyRecords.length > 0
        ? Math.round((authorizedStaffCount / competencyRecords.length) * 100)
        : 100;

    return {
      activeAnalyzers,
      overdueCalOrMaint,
      alertReagents,
      iqcPassRate,
      rejectedIqcCount,
      avgSigma,
      unacceptablePt,
      openCapas,
      competencyRate,
    };
  }, [
    capaRecords,
    competencyRecords,
    equipment,
    iqcAnalytes,
    iqcResults,
    proficiencyTests,
    reagents,
  ]);

  const handlePrintLabDossier = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const orgName = currentOrganization?.name || "Clinical & Pathology Laboratory";
    const today = new Date().toISOString().split("T")[0];
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Laboratory Accreditation Readiness Dossier — ${orgName}</title>
        <style>
          @page { margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; max-width: 960px; margin: 0 auto; font-size: 12.5px; line-height: 1.5; }
          h1 { font-size: 20px; margin-bottom: 4px; color: #0f172a; }
          h2 { font-size: 14px; margin-top: 22px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #0284c7; text-transform: uppercase; letter-spacing: 0.04em; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
          .kpi-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #f8fafc; }
          .kpi-box .val { font-size: 18px; font-weight: 700; color: #0369a1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11.5px; }
          th { background: #f1f5f9; font-weight: 700; }
          .badge-ok { color: #047857; font-weight: 700; }
          .badge-warn { color: #b45309; font-weight: 700; }
          .badge-err { color: #dc2626; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>${orgName} — CAP / ISO 15189 / CBAHI Laboratory Inspection Dossier</h1>
        <p style="color:#475569;margin-top:0;">Generated from AccreditEx Lab Operations on ${new Date().toLocaleString()}</p>

        <div class="kpi-grid">
          <div class="kpi-box"><div>Active Analyzers / Overdue Cal-PM</div><div class="val">${labMetrics.activeAnalyzers} Active / ${labMetrics.overdueCalOrMaint} Due</div></div>
          <div class="kpi-box"><div>IQC Westgard Pass Rate &amp; Mean &sigma;</div><div class="val">${labMetrics.iqcPassRate}% (${labMetrics.avgSigma}&sigma;)</div></div>
          <div class="kpi-box"><div>Bench Competency Authorization</div><div class="val">${labMetrics.competencyRate}% Authorized</div></div>
        </div>

        <h2>1. Analyzer &amp; Equipment Calibration / Maintenance Register</h2>
        <table>
          <thead><tr><th>Asset Tag / Name</th><th>Section</th><th>Serial No.</th><th>Status</th><th>Next Calibration</th><th>Next PM</th></tr></thead>
          <tbody>
            ${equipment
              .map(
                (e) =>
                  `<tr><td><strong>${e.assetTag || e.id}</strong> — ${e.name}</td><td>${e.labSection}</td><td>${e.serialNumber}</td><td>${e.status}</td><td class="${e.nextCalibrationDue && e.nextCalibrationDue < today ? "badge-err" : ""}">${e.nextCalibrationDue || "—"}</td><td class="${e.nextMaintenanceDue && e.nextMaintenanceDue < today ? "badge-err" : ""}">${e.nextMaintenanceDue || "—"}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <h2>2. Reagent Inventory &amp; Lot-to-Lot Verification Register (CAP COM.30450)</h2>
        <table>
          <thead><tr><th>Reagent</th><th>Lot No.</th><th>Section</th><th>Qty</th><th>Expiration</th><th>Lot Verification</th><th>Status</th></tr></thead>
          <tbody>
            ${reagents
              .map(
                (r) =>
                  `<tr><td><strong>${r.name}</strong></td><td>${r.lotNumber}</td><td>${r.labSection}</td><td>${r.quantity} ${r.unit}</td><td>${r.expirationDate}</td><td>${r.lotVerificationStatus === "verified" ? "✓ Verified" : r.lotVerificationStatus === "failed" ? "✗ Failed" : "Pending Parallel Test"}</td><td>${r.status}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <h2>3. Proficiency Testing (EQA / PT) Performance</h2>
        <table>
          <thead><tr><th>Program / Survey</th><th>Analyte</th><th>Section</th><th>Submitted</th><th>Peer Mean &plusmn; SD</th><th>SDI</th><th>Status</th></tr></thead>
          <tbody>
            ${proficiencyTests
              .map(
                (pt) =>
                  `<tr><td>${pt.program} (${pt.surveyId})</td><td>${pt.analyteName}</td><td>${pt.labSection}</td><td>${pt.submittedValue ?? "—"} ${pt.submittedUnit ?? ""}</td><td>${pt.peerMean ?? "—"} &plusmn; ${pt.peerSD ?? "—"}</td><td>${pt.sdIndex ?? "—"}</td><td class="${pt.acceptable ? "badge-ok" : "badge-err"}">${pt.status.toUpperCase()}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <h2>4. Staff Bench Competency Authorization Matrix</h2>
        <table>
          <thead><tr><th>Staff Member</th><th>Analyte / Bench</th><th>Section</th><th>Assessor</th><th>Authorized Until</th><th>Status</th></tr></thead>
          <tbody>
            ${competencyRecords
              .map(
                (c) =>
                  `<tr><td><strong>${c.staffName}</strong></td><td>${c.analyteName} (${c.analyteCode})</td><td>${c.labSection}</td><td>${c.assessor}</td><td>${c.authorizedUntil}</td><td class="${c.status === "authorized" ? "badge-ok" : "badge-err"}">${c.status.toUpperCase()}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.print();
  };

  return (
    <div className="space-y-6">
      {(resettingData || importingData) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-lg bg-white px-4 py-3 text-sm font-medium shadow-lg dark:bg-gray-800">
            {resettingData ? t("labOpsResetting") : t("labOpsImporting")}
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <CogIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("labOperations")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("labOpsSubtitle")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLabDossier}
            className="flex items-center gap-1.5"
          >
            <PrinterIcon className="h-4 w-4" />
            {t("printLabDossier") || "Print Lab Inspection Dossier"}
          </Button>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${syncBadgeClass}`}
          >
            {syncLabel}
          </span>
        </div>
      </div>

      {/* Live Executive Lab Readiness Command Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("equipment")}
          className={`text-left rounded-xl border p-3 transition-all ${
            activeTab === "equipment"
              ? "border-brand-primary bg-sky-50/50 dark:bg-sky-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/50"
          }`}
        >
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Analyzers &amp; Cal/PM
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {labMetrics.activeAnalyzers}
            </span>
            <span
              className={`text-xs font-semibold ${
                labMetrics.overdueCalOrMaint > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {labMetrics.overdueCalOrMaint > 0
                ? `${labMetrics.overdueCalOrMaint} overdue`
                : "All current"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reagents")}
          className={`text-left rounded-xl border p-3 transition-all ${
            activeTab === "reagents"
              ? "border-brand-primary bg-sky-50/50 dark:bg-sky-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/50"
          }`}
        >
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Reagent &amp; Lot Control
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {reagents.length}
            </span>
            <span
              className={`text-xs font-semibold ${
                labMetrics.alertReagents > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {labMetrics.alertReagents > 0
                ? `${labMetrics.alertReagents} alerts`
                : "Verified"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("iqcWestgard")}
          className={`text-left rounded-xl border p-3 transition-all ${
            activeTab === "iqcWestgard"
              ? "border-brand-primary bg-sky-50/50 dark:bg-sky-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/50"
          }`}
        >
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            IQC Westgard &amp; Sigma
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {labMetrics.iqcPassRate}%
            </span>
            <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
              {labMetrics.avgSigma}&sigma; mean
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proficiency")}
          className={`text-left rounded-xl border p-3 transition-all ${
            activeTab === "proficiency"
              ? "border-brand-primary bg-sky-50/50 dark:bg-sky-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/50"
          }`}
        >
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Proficiency Testing (PT)
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {proficiencyTests.length}
            </span>
            <span
              className={`text-xs font-semibold ${
                labMetrics.unacceptablePt > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {labMetrics.unacceptablePt > 0
                ? `${labMetrics.unacceptablePt} failed`
                : "100% pass"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("qualityManagement")}
          className={`text-left rounded-xl border p-3 transition-all ${
            activeTab === "qualityManagement"
              ? "border-brand-primary bg-sky-50/50 dark:bg-sky-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/50"
          }`}
        >
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            LQMS &amp; Open CAPAs
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {labMetrics.openCapas}
            </span>
            <span className="text-xs font-semibold text-brand-primary dark:text-sky-400">
              TTP KPIs
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("competencyMatrix")}
          className={`text-left rounded-xl border p-3 transition-all ${
            activeTab === "competencyMatrix"
              ? "border-brand-primary bg-sky-50/50 dark:bg-sky-900/20"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/50"
          }`}
        >
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Bench Competency
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-xl font-bold ${
                labMetrics.competencyRate === 100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {labMetrics.competencyRate}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Authorized
            </span>
          </div>
        </button>
      </div>

      {syncStatus === "error" && syncError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>{recordMode ? t("labOpsRecordSyncFailed") : syncError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void retrySyncNow();
            }}
          >
            {t("retry") || "Retry"}
          </Button>
        </div>
      )}

      {syncStatus === "synced" && lastSyncedAt && (
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {`${t("lastSynced") || "Last synced"}: ${new Date(lastSyncedAt).toLocaleString()}`}
        </p>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-brand-primary/30 p-4">
          {!showImportPanel ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!hasLoaded || loadedOrganizationId !== organizationId || syncStatus === "saving"}
              onClick={() => {
                setImportError(null);
                setImportPreview(null);
                setShowImportPanel(true);
              }}
            >
              {t("labOpsImportOpen")}
            </Button>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold">{t("labOpsImportTitle")}</h2>
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {recordMode ? t("labOpsImportRecordModeBlocked") : t("labOpsImportHelp")}
              </p>
              {!recordMode && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDownloadImportTemplate()}
                      disabled={importingData}
                    >
                      {t("labOpsImportDownloadTemplate")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => importFileRef.current?.click()}
                      disabled={!hasLoaded || loadedOrganizationId !== organizationId || importingData}
                    >
                      {t("labOpsImportChooseFile")}
                    </Button>
                    <input
                      ref={importFileRef}
                      type="file"
                      accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(event) => void handleImportFile(event)}
                    />
                  </div>
                  {importError && (
                    <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                      {importError}
                    </p>
                  )}
                  {importPreview && (
                    <div className="space-y-3 rounded-md bg-brand-background p-3 dark:bg-dark-brand-background">
                      <p className="text-sm font-medium">
                        {t("labOpsImportPreview", { rowCount: importPreview.rowCount })}
                      </p>
                      <ul className="grid gap-1 text-sm sm:grid-cols-2">
                        {Object.entries(importPreview.data).filter(([, records]) => records.length > 0).map(([key, records]) => (
                          <li key={key}>
                            {t(`labOpsImportGroup_${key}`)}: {records.length}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {t("labOpsImportAddOnly")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={importingData || syncStatus === "saving"}
                          onClick={() => void handleConfirmImport()}
                        >
                          {importingData ? t("labOpsImporting") : t("labOpsImportConfirm")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={importingData}
                          onClick={() => {
                            setShowImportPanel(false);
                            setImportPreview(null);
                            setImportError(null);
                            if (importFileRef.current) importFileRef.current.value = "";
                          }}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {!importPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={importingData}
                      onClick={() => setShowImportPanel(false)}
                    >
                      {t("cancel")}
                    </Button>
                  )}
                </>
              )}
              {recordMode && (
                <Button variant="ghost" size="sm" onClick={() => setShowImportPanel(false)}>
                  {t("cancel")}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 p-4">
          {!showResetPanel ? (
            <Button
              variant="danger"
              size="sm"
              disabled={!hasLoaded || loadedOrganizationId !== organizationId || syncStatus === "saving"}
              onClick={() => {
                setBackupDownloaded(false);
                setResetConfirmation("");
                setShowResetPanel(true);
              }}
            >
              {t("labOpsResetOpen")}
            </Button>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold text-red-700 dark:text-red-300">
                {t("labOpsResetTitle")}
              </h2>
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {recordMode
                  ? t("labOpsResetRecordModeBlocked")
                  : t("labOpsResetWarning")}
              </p>
              {!recordMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasLoaded || loadedOrganizationId !== organizationId || syncStatus === "saving" || resettingData}
                    onClick={() => void handleDownloadResetBackup()}
                  >
                    {t("labOpsDownloadBackup")}
                  </Button>
                  {backupDownloaded && (
                    <div className="space-y-2">
                      <label
                        htmlFor="lab-ops-reset-confirmation"
                        className="block text-sm font-medium"
                      >
                        {t("labOpsResetTypeOrgId", { organizationId })}
                      </label>
                      <input
                        id="lab-ops-reset-confirmation"
                        value={resetConfirmation}
                        onChange={(event) => setResetConfirmation(event.target.value)}
                        autoComplete="off"
                        className="w-full max-w-md rounded border border-red-300 px-3 py-2 text-sm dark:border-red-700 dark:bg-gray-800"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={!backupDownloaded || resetConfirmation !== organizationId || resettingData}
                      onClick={() => void handleResetOrganizationData()}
                    >
                      {resettingData ? t("labOpsResetting") : t("labOpsResetConfirm")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resettingData}
                      onClick={() => {
                        setShowResetPanel(false);
                        setResetConfirmation("");
                        setBackupDownloaded(false);
                      }}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </Button>
          );
        })}
      </div>

      {/* Tab content */}
      {!hasLoaded || loadedOrganizationId !== organizationId ? (
        <p role="status">{t("labOpsLoadingRequired")}</p>
      ) : <Suspense
        fallback={
          <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        }
      >
        {activeTab === "equipment" && <EquipmentTab />}
        {activeTab === "maintenance" && <MaintenanceTab />}
        {activeTab === "reagents" && <ReagentTab />}
        {activeTab === "qcDashboard" && <QCDashboardTab />}
        {activeTab === "proficiency" && <ProficiencyTestingTab />}
        {activeTab === "qualityManagement" && <QualityManagementTab />}
        {activeTab === "iqcWestgard" && <IQCWestgardTab />}
        {activeTab === "competencyMatrix" && <CompetencyMatrixTab />}
      </Suspense>}
    </div>
  );
};

export default LabOperationsPage;
