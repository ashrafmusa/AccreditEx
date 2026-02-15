import React, { useState, useEffect, useCallback } from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import FileUploader from "./FileUploader";
import { cloudinaryService } from "@/services/cloudinaryService";
import { useAppStore } from "@/stores/useAppStore";
import { XMarkIcon, SparklesIcon } from "../icons";
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
  }) => void;
}

const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({
  isOpen,
  onClose,
  onSave,
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

  // ─── AI State ───────────────────────────────────────────────────────────
  const [aiTranslating, setAiTranslating] = useState<"en" | "ar" | null>(null);
  const [aiSuggestingTags, setAiSuggestingTags] = useState(false);
  const [aiSuggestingCategory, setAiSuggestingCategory] = useState(false);
  const [aiFillingAll, setAiFillingAll] = useState(false);

  const hasName = nameEn.trim().length > 2 || nameAr.trim().length > 2;
  const aiAnyLoading = !!(
    aiTranslating ||
    aiSuggestingTags ||
    aiSuggestingCategory ||
    aiFillingAll
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
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setNameEn("");
    setNameAr("");
    setType("Policy");
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadError("");
    setIsUploading(false);
    setTags([]);
    setTagInput("");
    setCategory("");
    setSelectedDepartments([]);
  };

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
              <h3
                id="doc-meta-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {t("addNewDocument")}
              </h3>
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
