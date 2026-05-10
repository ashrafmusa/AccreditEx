/**
 * DocumentGapFiller
 *
 * Scans the organisation's document library against required document
 * categories for the active accreditation standard, then lets the user
 * generate AI-drafted policy/procedure content for any missing type.
 *
 * Rendered as a slide-over panel, triggered from DocumentControlHubPage.
 */

import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Required document categories per accreditation body */
const STANDARD_REQUIREMENTS: Record<
  string,
  Array<{ label: string; docType: "Policy" | "Procedure"; hint: string }>
> = {
  JCI: [
    {
      label: "Medication Management Policy",
      docType: "Policy",
      hint: "Cover safe storage, dispensing, administration, and monitoring of medications as required by JCI MMU chapter.",
    },
    {
      label: "Patient Rights & Responsibilities",
      docType: "Policy",
      hint: "Define patient rights, informed consent, privacy, and complaint processes per JCI PFR chapter.",
    },
    {
      label: "Infection Prevention & Control Policy",
      docType: "Policy",
      hint: "Address hand hygiene, isolation precautions, sterilisation, and surveillance per JCI PCI chapter.",
    },
    {
      label: "Emergency Management Procedure",
      docType: "Procedure",
      hint: "Outline mass-casualty response, evacuation, and continuity of care per JCI FMS chapter.",
    },
    {
      label: "Quality Improvement Plan",
      docType: "Policy",
      hint: "Describe the organisation-wide QI programme structure, data collection and reporting per JCI QPS chapter.",
    },
    {
      label: "Staff Credentialing & Privileging Procedure",
      docType: "Procedure",
      hint: "Detail verification, privileging, and annual reappointment for clinical staff per JCI SQE chapter.",
    },
  ],
  CBAHI: [
    {
      label: "Patient Safety Policy",
      docType: "Policy",
      hint: "Address the national patient safety goals set by CBAHI including falls, medication errors, and critical results.",
    },
    {
      label: "Medical Records Policy",
      docType: "Policy",
      hint: "Cover documentation standards, retention, and access per CBAHI Medical Records standard.",
    },
    {
      label: "Fire Safety & Life Safety Procedure",
      docType: "Procedure",
      hint: "Detail fire-drill schedule, evacuation maps, and fire-safety equipment inspection as required by CBAHI FLS chapter.",
    },
    {
      label: "Adverse Drug Reaction Reporting Procedure",
      docType: "Procedure",
      hint: "Define the steps to detect, report, and manage adverse drug reactions per CBAHI pharmacy standards.",
    },
    {
      label: "Clinical Audit Policy",
      docType: "Policy",
      hint: "Establish the process for selecting topics, conducting audits, and implementing corrective actions.",
    },
  ],
  DNV: [
    {
      label: "ISO 9001 Quality Manual",
      docType: "Policy",
      hint: "Describe the organisation's quality management system scope, processes, and their interactions per DNV NIAHO requirements.",
    },
    {
      label: "Risk Management Policy",
      docType: "Policy",
      hint: "Define the enterprise-wide risk identification, assessment, and mitigation framework per DNV standards.",
    },
    {
      label: "Internal Audit Procedure",
      docType: "Procedure",
      hint: "Detail planning, conducting, reporting, and following up internal quality audits per ISO 9001 clause 9.2.",
    },
  ],
  CAP: [
    {
      label: "Laboratory Quality Management Policy",
      docType: "Policy",
      hint: "Align with CAP Laboratory General checklist requirements for quality system elements.",
    },
    {
      label: "Proficiency Testing Procedure",
      docType: "Procedure",
      hint: "Define enrolment, participation, result review, and corrective action for external PT programmes per CAP requirements.",
    },
    {
      label: "Specimen Handling & Processing Procedure",
      docType: "Procedure",
      hint: "Describe specimen collection, transport, receipt, processing, and rejection criteria per CAP checklist.",
    },
    {
      label: "Instrument Calibration & Maintenance Procedure",
      docType: "Procedure",
      hint: "Document calibration schedule, tolerance limits, and corrective action for out-of-tolerance results.",
    },
  ],
  "ISO 15189": [
    {
      label: "Document Control Procedure",
      docType: "Procedure",
      hint: "Describe creation, review, approval, distribution, revision, and retirement of controlled documents per ISO 15189 clause 8.3.",
    },
    {
      label: "Nonconformity & Corrective Action Procedure",
      docType: "Procedure",
      hint: "Define detection, documentation, root-cause analysis, and verification of corrective actions per ISO 15189 clause 7.7.",
    },
    {
      label: "Competency Assessment Policy",
      docType: "Policy",
      hint: "Outline the schedule and methods for assessing staff competency per ISO 15189 clause 6.2.",
    },
    {
      label: "Method Validation Procedure",
      docType: "Procedure",
      hint: "Describe validation/verification of examination procedures including precision, accuracy, and reference intervals per ISO 15189.",
    },
    {
      label: "Uncertainty of Measurement Procedure",
      docType: "Procedure",
      hint: "Explain how measurement uncertainty is estimated for quantitative examination results per ISO 15189 clause 7.3.",
    },
  ],
};

interface GapItem {
  label: string;
  docType: "Policy" | "Procedure";
  hint: string;
  filled: boolean;
}

const DocumentGapFiller: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { documents, addDocument } = useAppStore();
  const { projects } = useProjectStore();

  const [selectedStandard, setSelectedStandard] = useState<string>("JCI");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const standards = Object.keys(STANDARD_REQUIREMENTS);

  // Compute gap list
  const gaps = useMemo<GapItem[]>(() => {
    const requirements = STANDARD_REQUIREMENTS[selectedStandard] ?? [];
    return requirements.map((req) => {
      const nameLower = req.label.toLowerCase();
      const filled = documents.some(
        (doc) =>
          doc.type === req.docType &&
          (doc.name?.en
            ?.toLowerCase()
            .includes(nameLower.split(" ")[0].toLowerCase()) ||
            doc.category
              ?.toLowerCase()
              .includes(nameLower.split(" ")[0].toLowerCase())),
      );
      return { ...req, filled };
    });
  }, [selectedStandard, documents]);

  const missingCount = gaps.filter((g) => !g.filled).length;

  const generate = async (gap: GapItem) => {
    if (generatingFor) return;
    setGeneratingFor(gap.label);
    setErrors((prev) => ({ ...prev, [gap.label]: "" }));

    try {
      const { aiAgentService } = await import("@/services/aiAgentService");
      const prompt = `You are an expert healthcare accreditation consultant.
Write a professional, comprehensive ${gap.docType} titled "${gap.label}" for a healthcare organisation preparing for ${selectedStandard} accreditation.
${gap.hint}
Format the output as a ready-to-use document with numbered sections, clear policy statements or step-by-step procedures, scope, purpose, definitions, and references to the relevant ${selectedStandard} standards. Use formal English.`;

      const result = await aiAgentService.chat(prompt, false);
      setGenerated((prev) => ({ ...prev, [gap.label]: result }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [gap.label]: "AI generation failed. Please try again.",
      }));
    } finally {
      setGeneratingFor(null);
    }
  };

  const saveToDocumentLibrary = (gap: GapItem) => {
    const content = generated[gap.label];
    if (!content) return;

    addDocument?.({
      id: `ai-${Date.now()}`,
      name: { en: gap.label, ar: gap.label },
      type: gap.docType,
      isControlled: true,
      status: "Draft",
      content: { en: content, ar: "" },
      currentVersion: 1,
      uploadedAt: new Date().toISOString(),
      category: selectedStandard,
      tags: [selectedStandard, "AI-Generated", "Gap-Fill"],
    });

    setSaved((prev) => ({ ...prev, [gap.label]: true }));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-brand-background dark:bg-dark-brand-background shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  Document Gap Auto-Filler
                </h2>
                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                  AI-generated drafts for missing accreditation documents
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-brand-text-secondary dark:text-dark-brand-text-secondary"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Standard selector */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-2">
                Accreditation Standard
              </p>
              <div className="flex flex-wrap gap-2">
                {standards.map((std) => (
                  <button
                    key={std}
                    onClick={() => setSelectedStandard(std)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      selectedStandard === std
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-brand-surface dark:bg-dark-brand-surface text-brand-text-secondary dark:text-dark-brand-text-secondary border-gray-200 dark:border-gray-700 hover:border-brand-primary hover:text-brand-primary"
                    }`}
                  >
                    {std}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {missingCount} of {gaps.length} required documents missing
              </p>
            </div>

            {/* Gap list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {gaps.map((gap) => (
                <div
                  key={gap.label}
                  className={`rounded-lg border p-4 ${
                    gap.filled
                      ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
                      : "border-gray-200 dark:border-gray-700 bg-brand-surface dark:bg-dark-brand-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {gap.filled ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <svg
                              viewBox="0 0 12 12"
                              fill="white"
                              className="w-3 h-3"
                            >
                              <path
                                d="M10 3L5 8.5 2 5.5"
                                stroke="white"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                        )}
                        <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                          {gap.label}
                        </p>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-primary/10 text-brand-primary">
                          {gap.docType}
                        </span>
                      </div>
                      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1 ml-6 line-clamp-2">
                        {gap.hint}
                      </p>
                    </div>

                    {!gap.filled && !generated[gap.label] && (
                      <button
                        onClick={() => generate(gap)}
                        disabled={generatingFor !== null}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                      >
                        {generatingFor === gap.label ? (
                          <>
                            <svg
                              className="animate-spin h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                            Drafting…
                          </>
                        ) : (
                          <>✦ Generate</>
                        )}
                      </button>
                    )}
                  </div>

                  {errors[gap.label] && (
                    <p className="mt-2 text-xs text-red-500 ml-6">
                      {errors[gap.label]}
                    </p>
                  )}

                  {/* Generated preview */}
                  {generated[gap.label] && (
                    <div className="mt-3">
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <pre className="text-xs text-brand-text-primary dark:text-dark-brand-text-primary whitespace-pre-wrap font-sans">
                          {generated[gap.label]}
                        </pre>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {!saved[gap.label] ? (
                          <button
                            onClick={() => saveToDocumentLibrary(gap)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                          >
                            Save to Document Library
                          </button>
                        ) : (
                          <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            ✓ Saved as Draft
                          </span>
                        )}
                        <button
                          onClick={() => generate(gap)}
                          disabled={generatingFor !== null}
                          className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary hover:border-brand-primary hover:text-brand-primary transition disabled:opacity-50"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DocumentGapFiller;
