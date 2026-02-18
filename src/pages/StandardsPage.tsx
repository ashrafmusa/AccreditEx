import React, { useState, useMemo, useRef } from "react";
import {
  Standard,
  AccreditationProgram,
  User,
  UserRole,
  StandardCriticality,
  ComplianceStatus,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { ContextualHelp } from "@/components/common/ContextualHelp";
import { getHelpContent } from "@/data/helpContent";
import {
  ShieldCheckIcon,
  PlusIcon,
  SearchIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import StandardAccordion from "@/components/accreditation/StandardAccordion";
import StandardModal from "@/components/accreditation/StandardModal";
import ImportStandardsModal from "@/components/accreditation/ImportStandardsModal";
import RestrictedFeatureIndicator from "@/components/common/RestrictedFeatureIndicator";
import { Button, Input } from "@/components/ui";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  exportStandardsGovernanceLog,
  getStandardsGovernanceStatus,
  saveStandardsBaseline,
} from "@/services/standardsGovernanceService";
import { buildCrossStandardMappingSummary } from "@/services/crossStandardMappingService";

interface StandardsPageProps {
  program: AccreditationProgram;
  standards: Standard[];
  allStandards: Standard[];
  allPrograms: AccreditationProgram[];
  currentUser: User;
  onCreateStandard: (
    standard: Omit<Standard, "programId"> & { programId: string },
  ) => Promise<void>;
  onUpdateStandard: (standard: Standard) => Promise<void>;
  onDeleteStandard: (standardId: string) => Promise<void>;
}

const StandardsPage: React.FC<StandardsPageProps> = ({
  program,
  standards,
  allStandards,
  allPrograms,
  currentUser,
  onCreateStandard,
  onUpdateStandard,
  onDeleteStandard,
}) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<StandardCriticality | "all">(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);

  const [fileContent, setFileContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [governanceRefreshKey, setGovernanceRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canModify = currentUser.role === UserRole.Admin;

  const governanceStatus = useMemo(() => {
    return getStandardsGovernanceStatus(program.id, standards);
  }, [program.id, standards, governanceRefreshKey]);

  const crosswalkSummary = useMemo(() => {
    return buildCrossStandardMappingSummary(
      program.id,
      allStandards,
      allPrograms,
    );
  }, [program.id, allStandards, allPrograms]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    n: () => canModify && setIsModalOpen(true),
    i: () => canModify && setIsImportModalOpen(true),
    f: () => setShowFilters((prev) => !prev),
    "/": () => {
      document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    },
  });

  const filteredStandards = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return standards.filter((s) => {
      const matchesSearch =
        s.standardId.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.section?.toLowerCase().includes(searchLower);

      const matchesRisk = riskFilter === "all" || s.criticality === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [standards, searchTerm, riskFilter]);

  const handleImportStandards = async (programId: string) => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const raw = JSON.parse(fileContent);
      // Accept both plain array and wrapped { documents: [...] } format
      const data = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.documents)
          ? raw.documents
          : null;
      if (!data) {
        toast.error(
          t("invalidStandardsFormat") ||
            "Invalid standards format. Expected an array.",
        );
        return;
      }

      // Validate structure before import
      const validationErrors: string[] = [];
      const getDesc = (d: any): string =>
        typeof d === "string" ? d : d?.en || "";
      const validStandards = data.filter((standard: any, index: number) => {
        if (!standard.standardId || !standard.standardId.trim()) {
          validationErrors.push(`Row ${index + 1}: standardId is required`);
          return false;
        }
        const desc = getDesc(standard.description);
        if (!desc || !desc.trim()) {
          validationErrors.push(`Row ${index + 1}: description is required`);
          return false;
        }
        return true;
      });

      if (validationErrors.length > 0) {
        toast.error(
          `Validation errors: ${validationErrors.slice(0, 3).join("; ")}${
            validationErrors.length > 3 ? "..." : ""
          }`,
        );
        return;
      }

      if (validStandards.length === 0) {
        toast.error(
          t("noValidStandardsFound") || "No valid standards found in file",
        );
        return;
      }

      let importCount = 0;
      let failCount = 0;

      for (const standard of validStandards) {
        try {
          const desc =
            typeof standard.description === "string"
              ? standard.description.trim()
              : (standard.description?.en || "").trim();
          // Omit any 'id' from imported data — let Firebase generate the doc ID
          const { id: _discardId, ...rest } = standard;
          await onCreateStandard({
            ...rest,
            standardId: standard.standardId.trim(),
            description: desc,
            section: standard.section?.trim() || "",
            criticality: standard.criticality || "Medium",
            programId: programId,
          });
          importCount++;
        } catch (error) {
          console.warn(
            `Failed to import standard ${standard.standardId}:`,
            error,
          );
          failCount++;
        }
      }

      if (importCount > 0) {
        const message =
          failCount > 0
            ? `${importCount} ${
                t("standardsImportedSuccessfully") || "standards imported"
              }, ${failCount} failed`
            : `${importCount} ${
                t("standardsImportedSuccessfully") ||
                "standards imported successfully"
              }`;
        toast.success(message);
        setFileContent("");
        setIsImportModalOpen(false);
      } else {
        toast.error(
          t("noValidStandardsFound") || "No standards could be imported",
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToImportStandards") || "Failed to import standards";
      toast.error(errorMsg);
      console.error("Standards import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async (data: Omit<Standard, "programId">) => {
    try {
      if (!data.standardId || !data.standardId.trim()) {
        toast.error(t("standardIdRequired") || "Standard ID is required");
        return;
      }
      if (!data.description || !data.description.trim()) {
        toast.error(t("descriptionRequired") || "Description is required");
        return;
      }

      if (editingStandard) {
        await onUpdateStandard({ ...data, programId: program.id });
        toast.success(
          t("standardUpdatedSuccessfully") || "Standard updated successfully",
        );
      } else {
        await onCreateStandard({ ...data, programId: program.id });
        toast.success(
          t("standardCreatedSuccessfully") || "Standard created successfully",
        );
      }
      setIsModalOpen(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToSaveStandard") || "Failed to save standard";
      toast.error(errorMsg);
      console.error("Standard save failed:", error);
    }
  };

  const handleDelete = async (standardId: string) => {
    if (
      !window.confirm(
        t("areYouSureDeleteStandard") || "Are you sure? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await onDeleteStandard(standardId);
      toast.success(
        t("standardDeletedSuccessfully") || "Standard deleted successfully",
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToDeleteStandard") || "Failed to delete standard";
      toast.error(errorMsg);
      console.error("Standard delete failed:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      if (!file.name.endsWith(".json")) {
        toast.error(t("invalidFileFormat") || "Please select a JSON file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Validate JSON format
          JSON.parse(content);
          setFileContent(content);
          setIsImportModalOpen(true);
          toast.success(
            t("fileLoadedSuccessfully") || "File loaded successfully",
          );
        } catch (parseError) {
          toast.error(t("invalidJsonFormat") || "Invalid JSON format in file");
          console.error("JSON parse error:", parseError);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("fileLoadError") || "Error loading file";
      toast.error(errorMsg);
      console.error("File load failed:", error);
    }
  };

  const clearFilters = () => {
    setRiskFilter("all");
    setSearchTerm("");
  };

  // Cross-project standard compliance analytics
  const { projects } = useProjectStore();
  const standardComplianceMap = useMemo(() => {
    const map = new Map<
      string,
      {
        standardId: string;
        description: string;
        section: string;
        total: number;
        compliant: number;
        partial: number;
        nonCompliant: number;
        notStarted: number;
        projectCount: number;
      }
    >();

    // Only consider projects for this program
    const programProjects = projects.filter(
      (p) => p.programId === program.id && p.archived !== true,
    );

    for (const proj of programProjects) {
      for (const item of proj.checklist) {
        if (!item.standardId) continue;
        if (!map.has(item.standardId)) {
          const std = standards.find((s) => s.standardId === item.standardId);
          map.set(item.standardId, {
            standardId: item.standardId,
            description: std?.description || item.standardId,
            section: std?.section || "",
            total: 0,
            compliant: 0,
            partial: 0,
            nonCompliant: 0,
            notStarted: 0,
            projectCount: 0,
          });
        }
        const entry = map.get(item.standardId)!;
        entry.total++;
        if (item.status === ComplianceStatus.Compliant) entry.compliant++;
        else if (item.status === ComplianceStatus.PartiallyCompliant)
          entry.partial++;
        else if (item.status === ComplianceStatus.NonCompliant)
          entry.nonCompliant++;
        else if (item.status === ComplianceStatus.NotStarted)
          entry.notStarted++;
      }
    }

    // Count distinct projects per standard
    for (const proj of programProjects) {
      const standardsInProject = new Set(
        proj.checklist.map((i) => i.standardId),
      );
      standardsInProject.forEach((sid) => {
        const entry = map.get(sid);
        if (entry) entry.projectCount++;
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => b.nonCompliant - a.nonCompliant,
    );
  }, [projects, program.id, standards]);

  const handleSetBaseline = () => {
    saveStandardsBaseline(program.id, standards);
    setGovernanceRefreshKey((prev) => prev + 1);
    toast.success(
      "Standards baseline has been updated for governance tracking.",
    );
  };

  const handleExportGovernanceLog = () => {
    try {
      const exportPayload = exportStandardsGovernanceLog(program.id);
      const blob = new Blob([exportPayload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `standards-governance-${program.id}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Governance log exported successfully.");
    } catch (error) {
      toast.error("Failed to export governance log.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <ShieldCheckIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
                {program.name}
              </h1>
              <ContextualHelp content={getHelpContent("standards")!} />
            </div>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("programStandards")}
            </p>
          </div>
        </div>
        {canModify && (
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".json"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
            >
              {t("importStandards")}
            </Button>
            <Button
              onClick={() => {
                setEditingStandard(null);
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {t("addStandard")}
            </Button>
          </div>
        )}
      </div>

      {!canModify && (
        <RestrictedFeatureIndicator featureName="Standards Management" />
      )}

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Standards Change Governance
            </p>
            {!governanceStatus.hasBaseline ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                No governance baseline found for this program. Set a baseline to
                detect future drift.
              </p>
            ) : governanceStatus.driftDetected ? (
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                Drift detected since baseline (count:{" "}
                {governanceStatus.standardCount}). Review and re-baseline after
                approval.
              </p>
            ) : (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                No drift detected since baseline.
              </p>
            )}
            {governanceStatus.baseline && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Baseline date:{" "}
                {new Date(governanceStatus.baseline.createdAt).toLocaleString()}
              </p>
            )}
          </div>
          {canModify && (
            <div className="flex gap-2">
              <Button onClick={handleExportGovernanceLog} variant="ghost">
                Export Governance Log
              </Button>
              <Button onClick={handleSetBaseline} variant="secondary">
                {governanceStatus.hasBaseline
                  ? "Refresh Baseline"
                  : "Set Baseline"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Cross-Standard Control Mapping
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Reuse opportunities across accreditation programs based on control
              section and key terms.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mapped Standards
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {crosswalkSummary.mappedStandardsCount}/
                {crosswalkSummary.totalStandardsInProgram}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Coverage
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {crosswalkSummary.mappingCoveragePercent}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reusable Control Groups
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {crosswalkSummary.reusableControlGroupsCount}
              </p>
            </div>
          </div>

          {crosswalkSummary.topReusableControlGroups.length > 0 ? (
            <div className="space-y-2">
              {crosswalkSummary.topReusableControlGroups
                .slice(0, 3)
                .map((group) => (
                  <div
                    key={group.controlKey}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Section: {group.section}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Programs: {group.programsCovered} | Key terms:{" "}
                      {group.keyTerms.join(", ") || "general"}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              No cross-program mappings detected yet for this program.
            </p>
          )}
        </div>
      </div>

      {/* Cross-Project Standard Compliance Analytics */}
      {standardComplianceMap.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  📊 Organization-Wide Standard Compliance
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Compliance status for each standard aggregated across all{" "}
                  {
                    projects.filter(
                      (p) => p.programId === program.id && p.archived !== true,
                    ).length
                  }{" "}
                  active projects in this program.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standards Tracked
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {standardComplianceMap.length}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 dark:border-green-800 p-3 bg-green-50/50 dark:bg-green-900/10">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Fully Compliant Standards
                </p>
                <p className="text-xl font-semibold text-green-700 dark:text-green-300">
                  {
                    standardComplianceMap.filter(
                      (s) =>
                        s.total > 0 &&
                        s.nonCompliant === 0 &&
                        s.partial === 0 &&
                        s.notStarted === 0,
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-lg border border-red-200 dark:border-red-800 p-3 bg-red-50/50 dark:bg-red-900/10">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Standards with Non-Compliance
                </p>
                <p className="text-xl font-semibold text-red-700 dark:text-red-300">
                  {
                    standardComplianceMap.filter((s) => s.nonCompliant > 0)
                      .length
                  }
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {standardComplianceMap.slice(0, 15).map((s) => {
                const rate =
                  s.total > 0 ? Math.round((s.compliant / s.total) * 100) : 0;
                return (
                  <div
                    key={s.standardId}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                  >
                    <div className="shrink-0 w-10">
                      {s.nonCompliant > 0 ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      ) : rate === 100 ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="grow min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {s.standardId}
                        {s.section ? ` — ${s.section}` : ""}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {s.description.slice(0, 100)}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-xs">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {s.compliant}✓
                      </span>
                      {s.partial > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {s.partial}◐
                        </span>
                      )}
                      {s.nonCompliant > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {s.nonCompliant}✗
                        </span>
                      )}
                      {s.notStarted > 0 && (
                        <span className="text-slate-400 font-medium">
                          {s.notStarted}○
                        </span>
                      )}
                      <span className="text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                        {rate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t("searchByStandard")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon className="w-5 h-5" />}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "secondary"}
          >
            <FunnelIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("filterByStatus")}
          </Button>
          {riskFilter !== "all" && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("riskLevel")}
              </label>
              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(e.target.value as StandardCriticality | "all")
                }
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="all">{t("allRisks")}</option>
                {Object.values(StandardCriticality).map((risk) => (
                  <option key={risk} value={risk}>
                    {t(risk.toLowerCase() as any) || risk}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredStandards.map((standard) => (
          <StandardAccordion
            key={standard.standardId}
            standard={standard}
            canModify={canModify}
            onEdit={() => {
              setEditingStandard(standard);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDelete(standard.standardId)}
          />
        ))}
        {filteredStandards.length === 0 && (
          <p className="text-center py-8">{t("noResultsFound")}</p>
        )}
      </div>

      {isModalOpen && (
        <StandardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          existingStandard={editingStandard}
        />
      )}
      {isImportModalOpen && (
        <ImportStandardsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportStandards}
          fileContent={fileContent}
          programs={[program]}
          isImporting={isImporting}
        />
      )}
    </div>
  );
};

export default StandardsPage;
