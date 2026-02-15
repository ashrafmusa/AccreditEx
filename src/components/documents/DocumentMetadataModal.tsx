import React, { useState, useEffect, useCallback } from "react";
import { AppDocument } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import FileUploader from "./FileUploader";
import { cloudinaryService } from "@/services/cloudinaryService";
import { useAppStore } from "@/stores/useAppStore";
import { XMarkIcon } from "../icons";

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

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    let fileUrl: string | undefined;

    // Upload file if selected
    if (selectedFiles.length > 0) {
      try {
        setIsUploading(true);
        const file = selectedFiles[0];
        const folder = `accreditex/documents/${type.toLowerCase()}`;

        fileUrl = await cloudinaryService.uploadDocument(
          file,
          folder,
          (progress) => {
            setUploadProgress(progress.progress);
          },
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

    // Save document with file URL and metadata
    onSave({
      name: { en: nameEn, ar: nameAr },
      type,
      fileUrl,
      tags: tags.length > 0 ? tags : undefined,
      category: category || undefined,
      departmentIds:
        selectedDepartments.length > 0 ? selectedDepartments : undefined,
    });

    // Reset form
    setNameEn("");
    setNameAr("");
    setType("Policy");
    setSelectedFiles([]);
    setUploadProgress(0);
    setTags([]);
    setTagInput("");
    setCategory("");
    setSelectedDepartments([]);
    onClose();
  };

  const handleClose = () => {
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

  // Escape key handler
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  const toggleDepartment = (deptId: string) => {
    if (selectedDepartments.includes(deptId)) {
      setSelectedDepartments(selectedDepartments.filter((id) => id !== deptId));
    } else {
      setSelectedDepartments([...selectedDepartments, deptId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-meta-modal-title"
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto modal-content-enter"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 id="doc-meta-modal-title" className="text-lg font-medium">
              {t("addNewDocument")}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  {t("documentNameEn")}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                  required
                  disabled={isUploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  {t("documentNameAr")}
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                  dir="rtl"
                  required
                  disabled={isUploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  {t("documentType")}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                  disabled={isUploading}
                >
                  <option value="Policy">{t("policy")}</option>
                  <option value="Procedure">{t("procedure")}</option>
                  <option value="Report">{t("report")}</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium">
                  {t("category") || "Category"} ({t("optional") || "Optional"})
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                  disabled={isUploading}
                >
                  <option value="">
                    {t("selectCategory") || "Select Category"}
                  </option>
                  <option value="Quality Management">
                    {t("qualityManagement") || "Quality Management"}
                  </option>
                  <option value="Safety">{t("safety") || "Safety"}</option>
                  <option value="Operations">
                    {t("operations") || "Operations"}
                  </option>
                  <option value="Human Resources">
                    {t("humanResources") || "Human Resources"}
                  </option>
                  <option value="Finance">{t("finance") || "Finance"}</option>
                  <option value="IT">
                    {t("informationTechnology") || "Information Technology"}
                  </option>
                  <option value="Compliance">
                    {t("compliance") || "Compliance"}
                  </option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("tags") || "Tags"} ({t("optional") || "Optional"})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={t("addTag") || "Add tag..."}
                    className="flex-1 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary text-sm"
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                    disabled={isUploading}
                  >
                    {t("add") || "Add"}
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-900 dark:hover:text-blue-200"
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
                  <label className="block text-sm font-medium mb-2">
                    {t("departments") || "Departments"} (
                    {t("optional") || "Optional"})
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-40 overflow-y-auto bg-white dark:bg-gray-800">
                    {departments.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center space-x-2 rtl:space-x-reverse py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded"
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
                <label className="block text-sm font-medium mb-2">
                  {t("uploadFile") || "Upload File"} (
                  {t("optional") || "Optional"})
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
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("uploading") || "Uploading"}...
                    </span>
                    <span className="text-sm font-medium text-brand-primary">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {uploadError}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={isUploading}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="py-2 px-4 border rounded-md text-sm text-white bg-brand-primary hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
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
