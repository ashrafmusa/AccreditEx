/**
 * Document Creation Wizard - Unified Entry Point
 *
 * Consolidates all document creation paths:
 * - Create Blank (metadata form)
 * - Generate with AI (54 templates)
 * - Upload File (drag & drop)
 *
 * Replaces fragmented "Add New" dropdown for clearer UX.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import type { DocumentGenerationResponse } from "@/services/aiDocumentGeneratorService";
import { cloudinaryService } from "@/services/cloudinaryService";
import { AppDocument } from "@/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AIDocumentGenerator from "../ai/AIDocumentGenerator";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon,
} from "../icons";
import FileUploader from "./FileUploader";

interface DocumentCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDocument: (docData: any) => Promise<void>;
  departments: any[];
  projects: any[];
  currentUser: any;
  preselectedTab?: "blank" | "ai" | "upload";
  templateId?: string;
}

type TabKey = "blank" | "ai" | "upload";

const DocumentCreationWizard: React.FC<DocumentCreationWizardProps> = ({
  isOpen,
  onClose,
  onCreateDocument,
  departments,
  projects,
  currentUser,
  preselectedTab = "ai",
  templateId,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>(preselectedTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Blank Document Form State
  const [blankForm, setBlankForm] = useState({
    name: { en: "", ar: "" },
    type: "Policy" as AppDocument["type"],
    category: "Quality Management",
    departmentId: currentUser?.departmentId || "",
    projectId: projects[0]?.id || "",
  });

  // Update state when preselected tab changes
  useEffect(() => {
    if (preselectedTab) {
      setActiveTab(preselectedTab);
    }
  }, [preselectedTab]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Tab Configuration
  const tabs = [
    {
      id: "ai" as TabKey,
      icon: SparklesIcon,
      label: t("aiGenerate") || "AI Generate",
      desc: t("aiGenerateDesc") || "Use AI with 54 templates",
      color: "purple",
    },
    {
      id: "blank" as TabKey,
      icon: DocumentTextIcon,
      label: t("blankDocument") || "Blank Document",
      desc: t("blankDocumentDesc") || "Start from scratch",
      color: "blue",
    },
    {
      id: "upload" as TabKey,
      icon: ArrowUpTrayIcon,
      label: t("uploadFile") || "Upload File",
      desc: t("uploadFileDesc") || "Import existing document",
      color: "orange",
    },
  ];

  // ─── Blank Document Handler ───────────────────────────────────────────────
  const handleCreateBlank = async () => {
    if (!blankForm.name.en.trim()) {
      toast.error(t("documentNameRequired") || "Document name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateDocument({
        name: blankForm.name,
        type: blankForm.type,
        category: blankForm.category,
        departmentId: blankForm.departmentId,
        projectId: blankForm.projectId,
        content: "",
      });

      toast.success(
        t("documentCreatedSuccessfully") || "Document created successfully",
      );
      onClose();
    } catch (error) {
      console.error("Failed to create blank document:", error);
      toast.error(t("failedToCreateDocument") || "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── AI Generation Handler ────────────────────────────────────────────────
  const handleAIGenerated = useCallback(
    async (response: DocumentGenerationResponse) => {
      try {
        // Extract metadata from AI response
        const docData = {
          name: {
            en: "AI Generated Document",
            ar: "وثيقة مُنشأة بالذكاء الاصطناعي",
          },
          type: "Policy" as AppDocument["type"],
          category: "Quality Management",
          content: response.content || "",
          departmentId: currentUser?.departmentId || "",
          projectId: projects[0]?.id || "",
        };

        await onCreateDocument(docData);
        toast.success(
          t("aiDocumentCreated") || "AI document created successfully",
        );
        onClose();
      } catch (error) {
        console.error("Failed to create AI document:", error);
        toast.error(t("failedToCreateDocument") || "Failed to create document");
      }
    },
    [onCreateDocument, onClose, toast, t, currentUser, projects],
  );

  // ─── File Upload Handler ──────────────────────────────────────────────────
  const handleFileUploaded = async (fileUrl: string, fileName: string) => {
    setIsSubmitting(true);
    try {
      await onCreateDocument({
        name: {
          en: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
          ar: fileName.replace(/\.[^/.]+$/, ""),
        },
        type: "Evidence",
        category: "Quality Management",
        fileUrl,
        departmentId: currentUser?.departmentId || "",
        projectId: projects[0]?.id || "",
      });

      toast.success(
        t("fileUploadedSuccessfully") || "File uploaded successfully",
      );
      onClose();
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast.error(t("failedToUploadFile") || "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ─── Tab Content ──────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case "blank":
        return (
          <div className="space-y-5 p-6 overflow-y-auto max-h-[60vh]">
            {/* Document Name */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                {t("documentName")} *
              </label>
              <input
                type="text"
                value={blankForm.name.en}
                onChange={(e) =>
                  setBlankForm((prev) => ({
                    ...prev,
                    name: { en: e.target.value, ar: e.target.value },
                  }))
                }
                placeholder={t("enterDocumentName") || "Enter document name"}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                {t("documentType")} *
              </label>
              <select
                value={blankForm.type}
                onChange={(e) =>
                  setBlankForm((prev) => ({
                    ...prev,
                    type: e.target.value as AppDocument["type"],
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
              >
                <option value="Policy">{t("policy")}</option>
                <option value="Procedure">{t("procedure")}</option>
                <option value="Work Instruction">{t("workInstruction")}</option>
                <option value="Form">{t("form")}</option>
                <option value="Record">{t("record")}</option>
                <option value="Evidence">{t("evidence")}</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                {t("category")} *
              </label>
              <select
                value={blankForm.category}
                onChange={(e) =>
                  setBlankForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
              >
                <option value="Quality Management">
                  {t("qualityManagement")}
                </option>
                <option value="Safety">{t("safety")}</option>
                <option value="Operations">{t("operations")}</option>
                <option value="Human Resources">{t("humanResources")}</option>
                <option value="Finance">{t("finance")}</option>
                <option value="IT">{t("informationTechnology")}</option>
                <option value="Compliance">{t("compliance")}</option>
              </select>
            </div>

            {/* Department */}
            {departments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                  {t("department")}
                </label>
                <select
                  value={blankForm.departmentId}
                  onChange={(e) =>
                    setBlankForm((prev) => ({
                      ...prev,
                      departmentId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
                >
                  <option value="">{t("selectDepartment")}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {typeof dept.name === "string"
                        ? dept.name
                        : dept.name?.en || dept.name?.ar || dept.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Project */}
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                  {t("project")}
                </label>
                <select
                  value={blankForm.projectId}
                  onChange={(e) =>
                    setBlankForm((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
                >
                  <option value="">{t("selectProject")}</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {typeof proj.name === "string"
                        ? proj.name
                        : proj.name?.en || proj.name?.ar || proj.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreateBlank}
                disabled={isSubmitting || !blankForm.name.en.trim()}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    {t("createDocument")}
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="p-6">
            <AIDocumentGenerator
              templateId={templateId}
              onDocumentGenerated={handleAIGenerated}
              onClose={onClose}
              context={{
                projectId: projects[0]?.id || "",
                departmentId: currentUser?.departmentId || "",
              }}
              preferences={{
                tone: "professional",
                length: "comprehensive",
                format: "markdown",
              }}
            />
          </div>
        );

      case "upload":
        return (
          <div className="p-6 space-y-4">
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("uploadFileDescription") ||
                "Upload PDF, Word, or image files as evidence documents."}
            </p>
            <FileUploader
              onFilesSelected={async (files: File[]) => {
                if (files.length === 0) return;
                const file = files[0];
                try {
                  const url = await cloudinaryService.uploadFile(file);
                  await handleFileUploaded(url, file.name);
                } catch (error) {
                  console.error("Upload failed:", error);
                  toast.error("Failed to upload file");
                }
              }}
              acceptedFileTypes={[
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/*",
              ]}
              maxFileSize={10 * 1024 * 1024}
              maxFiles={1}
              multiple={false}
            />
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-dark-brand-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("createDocument") || "Create Document"}
            </h2>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("chooseCreationMethod") ||
                "Choose how you want to create your document"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t("close")}
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[180px] p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? `border-${tab.color}-500 bg-${tab.color}-50 dark:bg-${tab.color}-900/20`
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive
                        ? `bg-${tab.color}-500 text-white`
                        : `bg-gray-100 dark:bg-gray-700 text-gray-500`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div
                      className={`font-semibold text-sm ${
                        isActive
                          ? "text-brand-text-primary dark:text-dark-brand-text-primary"
                          : "text-brand-text-secondary dark:text-dark-brand-text-secondary"
                      }`}
                    >
                      {tab.label}
                    </div>
                    <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                      {tab.desc}
                    </div>
                  </div>
                  {isActive && (
                    <CheckCircleIcon
                      className={`w-5 h-5 text-${tab.color}-500`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default DocumentCreationWizard;
