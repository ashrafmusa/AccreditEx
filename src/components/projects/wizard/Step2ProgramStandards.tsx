/**
 * Step 2: Program & Standards Selection
 * Phase 1: Forms & Wizards Enhancement
 *
 * Second step of project creation wizard
 * - Select accreditation program (required)
 * - Select applicable standards (conditional, multi-select)
 */

import { CheckCircleIcon, ShieldCheckIcon } from "@/components/icons";
import { ErrorMessage } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { AccreditationProgram, Standard } from "@/types";
import React, { useMemo } from "react";
import { WizardData } from "./useProjectWizard";

interface Step2ProgramStandardsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  validationErrors: Record<string, string>;
  touched: Record<string, boolean>;
  touchField: (field: string) => void;
  programs: AccreditationProgram[];
  allStandards: Standard[];
}

export const Step2ProgramStandards: React.FC<Step2ProgramStandardsProps> = ({
  data,
  updateData,
  validationErrors,
  touched,
  touchField,
  programs,
  allStandards,
}) => {
  const { t } = useTranslation();

  /**
   * Filter standards by selected program
   */
  const relevantStandards = useMemo(() => {
    if (!data.programId) return [];
    return allStandards.filter((std) => std.programId === data.programId);
  }, [data.programId, allStandards]);

  /**
   * Get selected program details
   */
  const selectedProgram = useMemo(() => {
    return programs.find((p) => p.id === data.programId);
  }, [data.programId, programs]);

  /**
   * Handle program selection
   */
  const handleProgramChange = (programId: string) => {
    updateData({
      programId,
      // Clear standards when program changes
      standardIds: [],
    });
    touchField("programId");
  };

  /**
   * Handle standard selection (multi-select)
   */
  const handleStandardToggle = (standardId: string) => {
    const newStandardIds = data.standardIds.includes(standardId)
      ? data.standardIds.filter((id) => id !== standardId)
      : [...data.standardIds, standardId];

    updateData({ standardIds: newStandardIds });
    touchField("standardIds");
  };

  /**
   * Select all standards
   */
  const handleSelectAll = () => {
    updateData({ standardIds: relevantStandards.map((std) => std.standardId) });
    touchField("standardIds");
  };

  /**
   * Clear all standards
   */
  const handleClearAll = () => {
    updateData({ standardIds: [] });
    touchField("standardIds");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
          {t("selectAccreditationProgram") || "Select Accreditation Program"}
        </h2>
        <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("chooseProgramAndStandards") ||
            "Choose the accreditation program and applicable standards for your project."}
        </p>
      </div>

      {/* Program Selection */}
      <div>
        <label
          htmlFor="program"
          className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2"
        >
          {t("accreditationProgram")} <span className="text-red-500">*</span>
        </label>

        {/* Program Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() => handleProgramChange(program.id)}
              type="button"
              className={`border-2 rounded-lg p-4 text-left transition-all ${
                data.programId === program.id
                  ? "border-brand-primary bg-brand-primary-light dark:bg-brand-primary/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-brand-primary"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.programId === program.id
                      ? "bg-brand-primary text-white"
                      : "bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary text-brand-text-secondary"
                  }`}
                >
                  {data.programId === program.id ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <ShieldCheckIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {program.name}
                  </h3>
                  {program.description && (
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                      {typeof program.description === "string"
                        ? program.description
                        : (program.description as any).en}
                    </p>
                  )}
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
                    {
                      allStandards.filter((s) => s.programId === program.id)
                        .length
                    }{" "}
                    {t("standards")}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {validationErrors.programId && touched.programId && (
          <ErrorMessage message={validationErrors.programId} />
        )}
      </div>

      {/* Standards Selection (Conditional) */}
      {data.programId && relevantStandards.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("applicableStandards")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                {t("selectStandardsForProject") ||
                  "Select the standards that apply to this project."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-brand-primary hover:underline"
              >
                {t("selectAll")}
              </button>
              {data.standardIds.length > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-brand-text-secondary hover:underline"
                  >
                    {t("clearAll")}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Selected Count Badge */}
          {data.standardIds.length > 0 && (
            <div className="mb-4 inline-flex items-center gap-2 bg-brand-primary-light dark:bg-brand-primary/10 text-brand-primary rounded-full px-3 py-1 text-sm font-medium">
              <CheckCircleIcon className="w-4 h-4" />
              {data.standardIds.length} {t("standardsSelected")}
            </div>
          )}

          {/* Standards List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {relevantStandards.map((standard) => {
              const isSelected = data.standardIds.includes(standard.standardId);

              return (
                <label
                  key={standard.standardId}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-primary bg-brand-surface dark:bg-dark-brand-surface"
                      : "border-transparent hover:bg-brand-surface-secondary dark:hover:bg-dark-brand-surface-secondary"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleStandardToggle(standard.standardId)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                        {standard.standardId}
                      </span>
                      {standard.criticality && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            standard.criticality === "High"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : standard.criticality === "Medium"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {standard.criticality}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                      {standard.description}
                    </p>
                    {standard.description && (
                      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 line-clamp-2">
                        {standard.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {validationErrors.standardIds && touched.standardIds && (
            <ErrorMessage message={validationErrors.standardIds} />
          )}
        </div>
      )}

      {/* No standards message */}
      {data.programId && relevantStandards.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️{" "}
            {t("noStandardsAvailable") ||
              "No standards are available for this program yet. You can continue and add standards later."}
          </p>
        </div>
      )}

      {/* Helper Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>{t("tip")}:</strong>{" "}
          {t("step2Tip") ||
            "Select only the standards that are relevant to this specific project. You can add more standards later if needed."}
        </p>
      </div>
    </div>
  );
};
