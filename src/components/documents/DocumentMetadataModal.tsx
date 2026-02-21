import React, { useState, useEffect, useCallback } from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import FileUploader from "./FileUploader";
import { cloudinaryService } from "@/services/cloudinaryService";
import { useAppStore } from "@/stores/useAppStore";
import { XMarkIcon, SparklesIcon, CheckIcon } from "../icons";
import { aiAgentService } from "@/services/aiAgentService";

// ─── Helpers ────────────────────────────────────────────────────────────────
const extractJSON = (text: string): any | null => {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* continue */
  }
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s !== -1 && e > s) {
    try {
      return JSON.parse(cleaned.slice(s, e + 1));
    } catch {
      /* continue */
    }
  }
  const aS = cleaned.indexOf("[");
  const aE = cleaned.lastIndexOf("]");
  if (aS !== -1 && aE > aS) {
    try {
      return JSON.parse(cleaned.slice(aS, aE + 1));
    } catch {
      /* continue */
    }
  }
  return null;
};

const CATEGORIES = [
  "Quality Management",
  "Safety",
  "Operations",
  "Human Resources",
  "Finance",
  "IT",
  "Compliance",
] as const;

const CATEGORY_I18N: Record<string, string> = {
  "Quality Management": "qualityManagement",
  Safety: "safety",
  Operations: "operations",
  "Human Resources": "humanResources",
  Finance: "finance",
  IT: "informationTechnology",
  Compliance: "compliance",
};

// ─── Spinner component ──────────────────────────────────────────────────────
const Spinner = () => (
  <svg
    className="animate-spin h-3.5 w-3.5"
    xmlns="http://www.w3.org/2000/svg"
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
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ─── AI Assist button ───────────────────────────────────────────────────────
const AIButton: React.FC<{
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label: string;
  compact?: boolean;
}> = ({ onClick, loading, disabled, label, compact }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    title={label}
    className={`inline-flex items-center gap-1 text-xs font-medium rounded-md transition-all
      ${compact ? "px-2 py-1" : "px-2.5 py-1.5"}
      bg-gradient-to-r from-violet-500 to-blue-500 text-white
      hover:from-violet-600 hover:to-blue-600
      disabled:opacity-50 disabled:cursor-not-allowed
      shadow-sm hover:shadow`}
  >
    {loading ? <Spinner /> : <SparklesIcon className="w-3.5 h-3.5" />}
    <span className="hidden sm:inline">{loading ? "..." : label}</span>
  </button>
);

// ─── Templates ──────────────────────────────────────────────────────────────
interface DocTemplate {
  id: string;
  labelKey: string;
  label: string;
  descKey: string;
  desc: string;
  nameHint: string;
  category: string;
  tags: string[];
}

const POLICY_TEMPLATES: DocTemplate[] = [
  {
    id: "infection-control",
    labelKey: "infectionControlPolicy",
    label: "Infection Prevention & Control",
    descKey: "infectionControlPolicyDesc",
    desc: "IPC policies covering hand hygiene, isolation precautions, and outbreak management",
    nameHint: "Infection Prevention and Control Policy",
    category: "Safety",
    tags: ["infection-control", "IPC", "patient-safety"],
  },
  {
    id: "medication-mgmt",
    labelKey: "medicationMgmtPolicy",
    label: "Medication Management",
    descKey: "medicationMgmtPolicyDesc",
    desc: "Safe prescribing, dispensing, administration, and monitoring of medications",
    nameHint: "Medication Management Policy",
    category: "Quality Management",
    tags: ["medication", "pharmacy", "patient-safety"],
  },
  {
    id: "patient-rights",
    labelKey: "patientRightsPolicy",
    label: "Patient Rights & Responsibilities",
    descKey: "patientRightsPolicyDesc",
    desc: "Policies on informed consent, privacy, complaints, and patient engagement",
    nameHint: "Patient Rights and Responsibilities Policy",
    category: "Compliance",
    tags: ["patient-rights", "consent", "privacy"],
  },
  {
    id: "quality-improvement",
    labelKey: "qualityImprovementPolicy",
    label: "Quality Improvement",
    descKey: "qualityImprovementPolicyDesc",
    desc: "Continuous quality improvement framework, KPIs, and performance monitoring",
    nameHint: "Quality Improvement Policy",
    category: "Quality Management",
    tags: ["quality", "KPI", "performance"],
  },
  {
    id: "info-security",
    labelKey: "infoSecurityPolicy",
    label: "Information Security",
    descKey: "infoSecurityPolicyDesc",
    desc: "Data protection, access control, information security, and breach management",
    nameHint: "Information Security and Data Protection Policy",
    category: "IT",
    tags: ["information-security", "data-protection", "HIPAA"],
  },
  {
    id: "hr-credentialing",
    labelKey: "credentialingPolicy",
    label: "Staff Credentialing",
    descKey: "credentialingPolicyDesc",
    desc: "Verification of staff qualifications, licenses, and ongoing competency",
    nameHint: "Staff Credentialing and Privileging Policy",
    category: "Human Resources",
    tags: ["credentialing", "privileging", "HR"],
  },
];

const PROCEDURE_TEMPLATES: DocTemplate[] = [
  {
    id: "hand-hygiene",
    labelKey: "handHygieneProcedure",
    label: "Hand Hygiene",
    descKey: "handHygieneProcedureDesc",
    desc: "Step-by-step hand hygiene procedure with WHO 5 moments",
    nameHint: "Hand Hygiene Procedure",
    category: "Safety",
    tags: ["hand-hygiene", "IPC", "patient-safety"],
  },
  {
    id: "code-blue",
    labelKey: "codeBlueProcedure",
    label: "Code Blue Response",
    descKey: "codeBlueProcedureDesc",
    desc: "Emergency response procedure for cardiac/respiratory arrest",
    nameHint: "Code Blue Emergency Response Procedure",
    category: "Safety",
    tags: ["emergency", "code-blue", "resuscitation"],
  },
  {
    id: "blood-transfusion",
    labelKey: "bloodTransfusionProcedure",
    label: "Blood Transfusion",
    descKey: "bloodTransfusionProcedureDesc",
    desc: "Safe blood product administration including verification and monitoring",
    nameHint: "Blood and Blood Products Transfusion Procedure",
    category: "Quality Management",
    tags: ["blood-transfusion", "patient-safety", "laboratory"],
  },
  {
    id: "patient-identification",
    labelKey: "patientIdProcedure",
    label: "Patient Identification",
    descKey: "patientIdProcedureDesc",
    desc: "Two-identifier verification procedure for all patient interactions",
    nameHint: "Patient Identification Procedure",
    category: "Safety",
    tags: ["patient-identification", "patient-safety", "IPSG"],
  },
  {
    id: "incident-reporting",
    labelKey: "incidentReportingProcedure",
    label: "Incident Reporting",
    descKey: "incidentReportingProcedureDesc",
    desc: "Reporting, investigation, and follow-up of adverse events and near-misses",
    nameHint: "Incident Reporting and Investigation Procedure",
    category: "Quality Management",
    tags: ["incident-reporting", "adverse-event", "root-cause"],
  },
  {
    id: "discharge-planning",
    labelKey: "dischargePlanningProcedure",
    label: "Discharge Planning",
    descKey: "dischargePlanningProcedureDesc",
    desc: "Patient discharge planning, education, and transition of care steps",
    nameHint: "Patient Discharge Planning Procedure",
    category: "Operations",
    tags: ["discharge", "transition-of-care", "patient-education"],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────
interface DocumentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: { en: string; ar: string };
    type: AppDocument["type"];
    fileUrl?: string;
    tags?: string[];
    category?: string;
    departmentIds?: string[];
    content?: { en: string; ar: string };
  }) => void;
  preselectedType?: AppDocument["type"];
}

const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  preselectedType,
}) => {
  const { t, dir, lang } = useTranslation();
  const { departments } = useAppStore();

  // ─── Form State ─────────────────────────────────────────────────────────
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [type, setType] = useState<AppDocument["type"]>("Policy");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // ─── AI State ───────────────────────────────────────────────────────────
  const [aiTranslating, setAiTranslating] = useState<"en" | "ar" | null>(null);
  const [aiSuggestingTags, setAiSuggestingTags] = useState(false);
  const [aiSuggestingCategory, setAiSuggestingCategory] = useState(false);
  const [aiFillingAll, setAiFillingAll] = useState(false);
  const [generateInitialContent, setGenerateInitialContent] = useState(false);
  const [aiGeneratingContent, setAiGeneratingContent] = useState(false);

  const hasName = nameEn.trim().length > 2 || nameAr.trim().length > 2;
  const aiAnyLoading = !!(
    aiTranslating ||
    aiSuggestingTags ||
    aiSuggestingCategory ||
    aiFillingAll ||
    aiGeneratingContent
  );

  // ─── AI: Translate ──────────────────────────────────────────────────────
  const handleAITranslate = useCallback(
    async (direction: "en" | "ar") => {
      const source = direction === "ar" ? nameEn : nameAr;
      if (!source.trim()) return;
      setAiTranslating(direction);
      try {
        const targetLang = direction === "ar" ? "Arabic" : "English";
        const prompt = `Translate this healthcare document title to ${targetLang}. Return ONLY the translated title, nothing else.\n\nTitle: "${source}"`;
        const resp = await aiAgentService.chat(prompt, false);
        const translated = (resp.response || "")
          .replace(/^["']|["']$/g, "")
          .trim();
        if (translated) {
          if (direction === "ar") setNameAr(translated);
          else setNameEn(translated);
        }
      } catch {
        // silent
      } finally {
        setAiTranslating(null);
      }
    },
    [nameEn, nameAr],
  );

  // ─── AI: Suggest Tags ──────────────────────────────────────────────────
  const handleAISuggestTags = useCallback(async () => {
    const name = nameEn || nameAr;
    if (!name.trim()) return;
    setAiSuggestingTags(true);
    try {
      const prompt = `You are a healthcare accreditation document management expert.
Given this document:
- Title: "${name}"
- Type: ${type}
- Category: ${category || "not set"}

Suggest 3-5 highly relevant tags for categorizing this document in a hospital accreditation system.
Return ONLY a JSON array of lowercase tag strings (e.g. ["infection-control","patient-safety"]).
Tags should be kebab-case, concise (1-3 words each), and specific to healthcare/hospital operations.`;
      const resp = await aiAgentService.chat(prompt, false);
      const parsed = extractJSON(resp.response || "");
      if (Array.isArray(parsed) && parsed.length > 0) {
        const newTags = parsed
          .filter((t: any) => typeof t === "string")
          .map((t: string) => t.trim().toLowerCase())
          .filter((t: string) => t && !tags.includes(t));
        setTags((prev) => [...prev, ...newTags]);
      }
    } catch {
      // silent
    } finally {
      setAiSuggestingTags(false);
    }
  }, [nameEn, nameAr, type, category, tags]);

  // ─── AI: Suggest Category ──────────────────────────────────────────────
  const handleAISuggestCategory = useCallback(async () => {
    const name = nameEn || nameAr;
    if (!name.trim()) return;
    setAiSuggestingCategory(true);
    try {
      const prompt = `You are a healthcare document classification expert.
Given this document title: "${name}" (type: ${type})

Which ONE category best fits? Choose EXACTLY one from this list:
${CATEGORIES.join(", ")}

Return ONLY the category name, nothing else.`;
      const resp = await aiAgentService.chat(prompt, false);
      const raw = (resp.response || "").trim().replace(/[."']/g, "");
      const match = CATEGORIES.find((c) =>
        raw.toLowerCase().includes(c.toLowerCase()),
      );
      if (match) setCategory(match);
    } catch {
      // silent
    } finally {
      setAiSuggestingCategory(false);
    }
  }, [nameEn, nameAr, type]);

  // ─── AI: Fill All ─────────────────────────────────────────────────────
  const handleAIFillAll = useCallback(async () => {
    const name = nameEn || nameAr;
    if (!name.trim()) return;
    setAiFillingAll(true);
    try {
      const srcLang = nameEn.trim() ? "English" : "Arabic";
      const tgtLang = srcLang === "English" ? "Arabic" : "English";
      const prompt = `You are a healthcare accreditation document management expert.
Given this document title in ${srcLang}: "${name}"
Document type: ${type}

Return ONLY a JSON object (no markdown) with:
- "translatedName": the title translated to ${tgtLang}
- "category": one of [${CATEGORIES.map((c) => `"${c}"`).join(", ")}]
- "tags": array of 3-5 lowercase kebab-case tags relevant to healthcare accreditation
- "suggestedType": one of ["Policy","Procedure","Report"] (if a better type fits)`;
      const resp = await aiAgentService.chat(prompt, false);
      const parsed = extractJSON(resp.response || "");
      if (parsed) {
        // Translation
        if (parsed.translatedName) {
          if (nameEn.trim() && !nameAr.trim()) setNameAr(parsed.translatedName);
          else if (nameAr.trim() && !nameEn.trim())
            setNameEn(parsed.translatedName);
        }
        // Category
        if (parsed.category && CATEGORIES.includes(parsed.category as any)) {
          if (!category) setCategory(parsed.category);
        }
        // Tags
        if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
          const newTags = parsed.tags
            .filter((t: any) => typeof t === "string")
            .map((t: string) => t.trim().toLowerCase())
            .filter((t: string) => t && !tags.includes(t));
          if (tags.length === 0) setTags(newTags);
        }
        // Type suggestion
        if (
          parsed.suggestedType &&
          ["Policy", "Procedure", "Report"].includes(parsed.suggestedType)
        ) {
          setType(parsed.suggestedType as AppDocument["type"]);
        }
      }
    } catch {
      // silent
    } finally {
      setAiFillingAll(false);
    }
  }, [nameEn, nameAr, type, category, tags]);

  // ─── AI: Generate Initial Content ─────────────────────────────────────
  const [generatedContent, setGeneratedContent] = useState<
    { en: string; ar: string } | undefined
  >(undefined);

  const handleGenerateInitialContent = useCallback(async () => {
    const name = nameEn || nameAr;
    if (!name.trim()) return;
    setAiGeneratingContent(true);
    try {
      // ── Category-specific writing standards ──
      const categoryGuidance: Record<string, string> = {
        "Quality Management": `Focus on PDCA (Plan-Do-Check-Act) methodology, KPIs, benchmarking, and continuous improvement cycles. Reference ISO 9001:2015 clauses and CBAHI quality standards.`,
        Safety: `Emphasize hazard identification, risk assessment, incident reporting, root-cause analysis, and International Patient Safety Goals (IPSG). Reference JCI IPSG and CBAHI ESR requirements. Include safety alert levels and emergency response triggers.`,
        Operations: `Focus on workflow efficiency, resource management, turnaround times, capacity planning, and interdepartmental coordination. Include flowchart-suitable step descriptions and decision points.`,
        "Human Resources": `Address credentialing, privileging, competency assessment, orientation, ongoing training requirements, and performance evaluation. Reference CBAHI HR standards and JCI SQE chapter.`,
        Finance: `Focus on budget management, cost-benefit analysis, procurement processes, financial reporting, auditing, and fiscal compliance. Include approval thresholds and authorization matrices.`,
        IT: `Address information security, access control, business continuity, disaster recovery, HIPAA-equivalent data protection, and system validation. Reference ISO 27001 and CBAHI information management standards.`,
        Compliance: `Focus on regulatory alignment, audit readiness, corrective action plans, document control, mandatory reporting, and external accreditation requirements. Cross-reference CBAHI, JCI, and applicable MOH regulations.`,
      };

      const catSpecific =
        category && categoryGuidance[category]
          ? `\nCATEGORY-SPECIFIC WRITING GUIDANCE (${category}):\n${categoryGuidance[category]}\n`
          : "";

      // ── Type-specific sections ──
      const policyPrompt = `This is a POLICY document. Use these sections in this exact order:
1. Document Control Block — include placeholders: Document No., Version, Effective Date, Review Date, Approved By, Owner Department.
2. Purpose — Why this policy exists; 2-3 sentences.
3. Scope — Who/what it applies to, exclusions if any.
4. Definitions — Table of key terms and their definitions using <table>.
5. Policy Statement — Clear, authoritative declarations using "shall" for mandatory, "should" for recommended. Number each statement (e.g., 5.1, 5.2…).
6. Responsibilities — Table or list: Role → Responsibility using <table>.
7. Implementation — Practical steps for putting the policy into practice.
8. Monitoring & Compliance — KPIs, audit frequency, reporting mechanism.
9. Review Schedule — How often, by whom, approval process.
10. References — Standards cited (CBAHI, JCI, ISO, MOH regulations).
11. Revision History — Table with Version, Date, Author, Change Description using <table>.`;

      const procedurePrompt = `This is a PROCEDURE document. Use these sections in this exact order:
1. Document Control Block — placeholders: Document No., Version, Effective Date, Review Date, Approved By, Parent Policy.
2. Purpose — Why this procedure exists; 2-3 sentences.
3. Scope — Who must follow this, where it applies, exclusions.
4. Definitions — Table of key terms.
5. Required Equipment / Materials — Bulleted list of everything needed before starting.
6. Precautions & Safety — Warnings, PPE requirements, contraindications. Use <blockquote> for critical safety notes.
7. Step-by-Step Procedure — MUST use <ol> with clear, actionable numbered steps. Each step should:
   • Start with a verb (e.g., "Verify…", "Record…", "Notify…").
   • Include verification checkpoints marked with ✓.
   • Note critical decision points with conditional steps (e.g., "If X, then Y; otherwise Z").
8. Documentation Requirements — What records/forms must be completed, by whom, retention period.
9. Exceptions & Escalation — When to deviate and how to escalate.
10. Quality Control — How to verify the procedure was performed correctly.
11. References — Standards cited (CBAHI, JCI, ISO, WHO guidelines).
12. Revision History — Table with Version, Date, Author, Change Description.`;

      const reportPrompt = `This is a REPORT document. Use these sections:
1. Report Header — Title, report period, prepared by, date.
2. Executive Summary — 3-5 bullet-point overview of findings.
3. Background / Context — Why this report was produced.
4. Methodology — Data sources, analysis methods, scope.
5. Findings — Detailed findings organized with subheadings + tables/lists.
6. Analysis & Discussion — Interpretation of findings, trends, comparisons.
7. Recommendations — Numbered, actionable recommendations with responsible parties and timelines.
8. Conclusion.
9. Appendices / References.`;

      const typePrompt =
        type === "Procedure"
          ? procedurePrompt
          : type === "Report"
            ? reportPrompt
            : policyPrompt;

      const prompt = `You are a senior healthcare accreditation consultant with 15+ years of experience writing ${type} documents for CBAHI and JCI accreditation.

Generate a complete, professional, accreditation-ready ${type} document in English.

Document Title: "${name}"
Document Type: ${type}
${category ? `Category: ${category}` : ""}
${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}
${catSpecific}
${typePrompt}

OUTPUT FORMAT — follow strictly:
- Return ONLY valid HTML (NO markdown, NO code fences, NO preamble).
- Use <h2> for document title. Use <h3> for section headings. Use <h4> for subsections.
- Use <p> for paragraphs. Never output bare text outside tags.
- Use <ul>/<ol> with <li> for lists. Use <ol> for sequential steps.
- Use <table><thead><tr><th>…</th></tr></thead><tbody> for all tables. Style tables with border-collapse.
- Use <strong> for mandatory terms ("shall", "must") and key emphasis.
- Use <em> for secondary emphasis and defined terms.
- Use <blockquote> for important warnings, safety notes, and callouts.
- Number sections consistently (1.0, 2.0… and 2.1, 2.2… for subsections).

WRITING STANDARDS:
- Use "shall" for mandatory requirements, "should" for recommendations, "may" for permissions.
- Write in third person, present tense, formal tone.
- Every section must have substantive, detailed content (minimum 3-4 sentences per section, more for key sections).
- Include specific, realistic healthcare content appropriate for a hospital accreditation setting.
- Cross-reference relevant standards in parentheses (e.g., "per CBAHI ESR-12", "JCI IPSG.3").

Return ONLY the HTML content.`;

      const resp = await aiAgentService.chat(prompt, true);
      let content = (resp.response || "").trim();
      // Strip markdown code fences if AI wraps
      content = content
        .replace(/```html?\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      if (content) {
        setGeneratedContent({ en: content, ar: "" });
      }
    } catch {
      // silent — content generation is optional
    } finally {
      setAiGeneratingContent(false);
    }
  }, [nameEn, nameAr, type, category, tags]);

  // ─── Standard Handlers ────────────────────────────────────────────────
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    let fileUrl: string | undefined;

    if (selectedFiles.length > 0) {
      try {
        setIsUploading(true);
        const file = selectedFiles[0];
        const folder = `accreditex/documents/${type.toLowerCase()}`;
        fileUrl = await cloudinaryService.uploadDocument(
          file,
          folder,
          (progress) => setUploadProgress(progress.progress),
        );
        setIsUploading(false);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed",
        );
        setIsUploading(false);
        return;
      }
    }

    onSave({
      name: { en: nameEn, ar: nameAr },
      type,
      fileUrl,
      tags: tags.length > 0 ? tags : undefined,
      category: category || undefined,
      departmentIds:
        selectedDepartments.length > 0 ? selectedDepartments : undefined,
      content: generatedContent || undefined,
    });

    resetForm();
    onClose();
  };

  const applyTemplate = useCallback(
    (template: DocTemplate) => {
      setSelectedTemplate(template.id);
      setNameEn(template.nameHint);
      setCategory(template.category);
      setTags(template.tags);
      // Trigger AI translation for Arabic
      setTimeout(() => {
        handleAITranslate("ar");
      }, 100);
    },
    [handleAITranslate],
  );

  const resetForm = () => {
    setNameEn("");
    setNameAr("");
    setType(preselectedType || "Policy");
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadError("");
    setIsUploading(false);
    setTags([]);
    setTagInput("");
    setCategory("");
    setSelectedDepartments([]);
    setSelectedTemplate(null);
    setGenerateInitialContent(false);
    setAiGeneratingContent(false);
    setGeneratedContent(undefined);
  };

  // Apply preselectedType when modal opens
  useEffect(() => {
    if (isOpen && preselectedType) {
      setType(preselectedType);
    }
  }, [isOpen, preselectedType]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  };

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-meta-modal-title"
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <form onSubmit={handleSubmit}>
          {/* ─── Header ──────────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    type === "Procedure"
                      ? "bg-purple-100 dark:bg-purple-900/30"
                      : type === "Report"
                        ? "bg-rose-100 dark:bg-rose-900/30"
                        : "bg-blue-100 dark:bg-blue-900/30"
                  }`}
                >
                  <SparklesIcon
                    className={`w-5 h-5 ${
                      type === "Procedure"
                        ? "text-purple-600 dark:text-purple-400"
                        : type === "Report"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    id="doc-meta-modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {type === "Procedure"
                      ? t("newProcedure") || "New Procedure"
                      : type === "Report"
                        ? t("newReport") || "New Report"
                        : t("newPolicy") || "New Policy"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {type === "Procedure"
                      ? t("newProcedureSubtitle") ||
                        "Create a step-by-step operational procedure"
                      : type === "Report"
                        ? t("newReportSubtitle") ||
                          "Create an accreditation report"
                        : t("newPolicySubtitle") ||
                          "Create an organizational governance policy"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* AI Fill All Banner */}
            {hasName && (
              <div className="mt-3 flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-100 dark:border-violet-800/30">
                <SparklesIcon className="w-4 h-4 text-violet-500 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300 flex-1">
                  {t("aiAutoFillDescription") ||
                    "Let AI auto-translate, suggest category & tags based on the document name"}
                </p>
                <AIButton
                  onClick={handleAIFillAll}
                  loading={aiFillingAll}
                  disabled={aiAnyLoading}
                  label={t("aiAutoFill") || "Auto-Fill"}
                />
              </div>
            )}
          </div>

          {/* ─── Body ────────────────────────────────────────────────── */}
          <div className="p-6 space-y-5">
            {/* Template Picker */}
            {!hasName && (type === "Policy" || type === "Procedure") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("startFromTemplate") || "Start from a template"}{" "}
                  <span className="text-gray-400 font-normal">
                    ({t("optional") || "Optional"})
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {(type === "Policy"
                    ? POLICY_TEMPLATES
                    : PROCEDURE_TEMPLATES
                  ).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={`text-start p-2.5 rounded-lg border transition-all text-xs group ${
                        selectedTemplate === tpl.id
                          ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-600"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {t(tpl.labelKey) || tpl.label}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {t(tpl.descKey) || tpl.desc}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {t("orStartFromScratch") || "or start from scratch below"}
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                </div>
              </div>
            )}

            {/* English Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("documentNameEn")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
                  required
                  disabled={isUploading}
                  placeholder="e.g. Infection Control Policy"
                />
                {nameAr.trim() && !nameEn.trim() && (
                  <AIButton
                    onClick={() => handleAITranslate("en")}
                    loading={aiTranslating === "en"}
                    disabled={aiAnyLoading}
                    label={t("aiTranslate") || "Translate"}
                    compact
                  />
                )}
              </div>
            </div>

            {/* Arabic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("documentNameAr")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
                  dir="rtl"
                  required
                  disabled={isUploading}
                  placeholder="مثال: سياسة مكافحة العدوى"
                />
                {nameEn.trim() && !nameAr.trim() && (
                  <AIButton
                    onClick={() => handleAITranslate("ar")}
                    loading={aiTranslating === "ar"}
                    disabled={aiAnyLoading}
                    label={t("aiTranslate") || "Translate"}
                    compact
                  />
                )}
              </div>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("documentType")}
              </label>
              {preselectedType ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      type === "Policy"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : type === "Procedure"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    }`}
                  >
                    {t(type.toLowerCase()) || type}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const types: AppDocument["type"][] = [
                        "Policy",
                        "Procedure",
                        "Report",
                      ];
                      const currIdx = types.indexOf(type);
                      setType(types[(currIdx + 1) % types.length]);
                    }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
                  >
                    {t("changeType") || "change"}
                  </button>
                </div>
              ) : (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
                  disabled={isUploading}
                >
                  <option value="Policy">{t("policy")}</option>
                  <option value="Procedure">{t("procedure")}</option>
                  <option value="Report">{t("report")}</option>
                </select>
              )}
            </div>

            {/* Category with AI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("category") || "Category"}{" "}
                  <span className="text-gray-400 font-normal">
                    ({t("optional") || "Optional"})
                  </span>
                </label>
                {hasName && !category && (
                  <AIButton
                    onClick={handleAISuggestCategory}
                    loading={aiSuggestingCategory}
                    disabled={aiAnyLoading}
                    label={t("aiSuggest") || "Suggest"}
                    compact
                  />
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
                disabled={isUploading}
              >
                <option value="">
                  {t("selectCategory") || "Select Category"}
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(CATEGORY_I18N[cat] || cat) || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags with AI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("tags") || "Tags"}{" "}
                  <span className="text-gray-400 font-normal">
                    ({t("optional") || "Optional"})
                  </span>
                </label>
                {hasName && (
                  <AIButton
                    onClick={handleAISuggestTags}
                    loading={aiSuggestingTags}
                    disabled={aiAnyLoading}
                    label={t("aiSuggestTags") || "Suggest Tags"}
                    compact
                  />
                )}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t("addTag") || "Add tag..."}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={isUploading}
                >
                  {t("add") || "Add"}
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium border border-violet-100 dark:border-violet-800/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-violet-900 dark:hover:text-violet-100"
                        disabled={isUploading}
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Departments */}
            {departments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("departments") || "Departments"}{" "}
                  <span className="text-gray-400 font-normal">
                    ({t("optional") || "Optional"})
                  </span>
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-36 overflow-y-auto bg-white dark:bg-gray-800">
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept.id)}
                        onChange={() => toggleDepartment(dept.id)}
                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        disabled={isUploading}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {dept.name[lang] || dept.name.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* AI Generate Initial Content */}
            {hasName && (
              <div className="border border-violet-200 dark:border-violet-800/40 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    const next = !generateInitialContent;
                    setGenerateInitialContent(next);
                    if (next && !generatedContent) {
                      handleGenerateInitialContent();
                    }
                    if (!next) setGeneratedContent(undefined);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 hover:from-violet-100 hover:to-blue-100 dark:hover:from-violet-900/30 dark:hover:to-blue-900/30 transition-colors"
                  disabled={aiAnyLoading && !aiGeneratingContent}
                >
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      {t("aiGenerateInitialContent") ||
                        "AI Generate Initial Content"}
                    </span>
                  </span>
                  <span
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      generateInitialContent
                        ? "bg-violet-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                        generateInitialContent ? "translate-x-4" : ""
                      }`}
                    />
                  </span>
                </button>
                {generateInitialContent && (
                  <div className="px-4 py-3 bg-white dark:bg-gray-800/50 border-t border-violet-100 dark:border-violet-800/30">
                    {aiGeneratingContent ? (
                      <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                        <Spinner />
                        <span>
                          {t("generatingContent") ||
                            "Generating initial content with AI..."}
                        </span>
                      </div>
                    ) : generatedContent ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckIcon className="w-3.5 h-3.5" />
                            {t("contentGenerated") || "Content generated"}
                          </span>
                          <button
                            type="button"
                            onClick={handleGenerateInitialContent}
                            disabled={aiAnyLoading}
                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            {t("regenerate") || "Regenerate"}
                          </button>
                        </div>
                        <div
                          className="text-xs text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 p-2 prose prose-xs dark:prose-invert"
                          dangerouslySetInnerHTML={{
                            __html:
                              generatedContent.en.slice(0, 500) +
                              (generatedContent.en.length > 500 ? "…" : ""),
                          }}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          {t("contentWillBeEditable") ||
                            "You can edit this content after document creation."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {t("aiContentGenerationFailed") ||
                          "Content generation did not produce results. You can try again or create a blank document."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* File Uploader */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("uploadFile") || "Upload File"}{" "}
                <span className="text-gray-400 font-normal">
                  ({t("optional") || "Optional"})
                </span>
              </label>
              <FileUploader
                onFilesSelected={handleFilesSelected}
                multiple={false}
                maxFiles={1}
                disabled={isUploading}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t("uploading") || "Uploading"}...
                  </span>
                  <span className="text-sm font-medium text-brand-primary">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-brand-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {uploadError}
                </p>
              </div>
            )}
          </div>

          {/* ─── Footer ──────────────────────────────────────────────── */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50 flex justify-end gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={isUploading || aiAnyLoading}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-lg text-sm font-medium text-white bg-brand-primary hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={isUploading || aiAnyLoading}
            >
              {isUploading
                ? (t("uploading") || "Uploading") + "..."
                : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentMetadataModal;
