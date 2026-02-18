import React, { useState, useEffect } from "react";
import {
  Project,
  AppDocument,
  DesignControlItem,
  ComplianceStatus,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  PlusIcon,
  TrashIcon,
  PaperClipIcon,
  XMarkIcon,
  UploadIcon,
} from "@/components/icons";
import { TableContainer } from "@/components/ui";
import DocumentPicker from "@/components/common/DocumentPicker";
import DocumentListItem from "@/components/documents/DocumentListItem";
import FileUploader from "@/components/documents/FileUploader";
import PDFViewerModal from "@/components/documents/PDFViewerModal";
import DocumentEditorModal from "@/components/documents/DocumentEditorModal";
import { useAppStore } from "@/stores/useAppStore";
import { storageService } from "@/services/storageService";
import { getDocumentViewAction } from "@/utils/documentViewingHelper";
import { aiAgentService } from "@/services/aiAgentService";
import { useToast } from "@/hooks/useToast";
import AISuggestionModal from "@/components/ai/AISuggestionModal";

interface DesignControlsComponentProps {
  project: Project;
  documents: AppDocument[];
  isFinalized: boolean;
  onSave: (designControls: DesignControlItem[]) => void;
}

const DesignControlsComponent: React.FC<DesignControlsComponentProps> = ({
  project,
  documents,
  isFinalized,
  onSave,
}) => {
  const { t, lang } = useTranslation();
  const { addDocument } = useAppStore();
  const toast = useToast();
  const [controls, setControls] = useState<DesignControlItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingPDF, setViewingPDF] = useState<AppDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiFillingRow, setAiFillingRow] = useState<number | null>(null);

  useEffect(() => {
    setControls(JSON.parse(JSON.stringify(project.designControls || [])));
  }, [project.designControls]);

  const handleUpdate = (
    index: number,
    field: keyof DesignControlItem,
    value: any,
  ) => {
    const newControls = [...controls];
    (newControls[index] as any)[field] = value;
    setControls(newControls);
  };

  const addRow = () => {
    const newRow: DesignControlItem = {
      id: `dc-${Date.now()}`,
      requirement: "",
      policyProcess: "",
      implementationEvidence: "",
      auditFindings: "",
      outcomeKPI: "",
      standardId: "",
      status: ComplianceStatus.NotApplicable,
      linkedDocumentIds: [],
    };
    setControls([...controls, newRow]);
  };

  const removeRow = (index: number) => {
    setControls(controls.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(controls);
    alert(t("changesSaved"));
  };

  const handleAIComplianceCheck = async () => {
    if (aiChecking || controls.length === 0) return;

    setAiChecking(true);
    try {
      const requirements = controls
        .filter((c) => c.requirement)
        .map((c) => c.requirement)
        .filter(Boolean) as string[];

      const complianceCheck = await aiAgentService.checkDesignCompliance({
        designTitle: project.name,
        standard: (project as any).standard,
        phase: "Design Controls",
        description: `${controls.length} design control items`,
        requirements,
      });

      setAiModalContent(complianceCheck);
      setAiModalOpen(true);
      toast.success(t("aiComplianceCheckComplete"));
    } catch (error) {
      toast.error(t("failedAiComplianceCheck"));
      console.error("AI compliance check error:", error);
    } finally {
      setAiChecking(false);
    }
  };

  const handleAIFillRow = async (index: number) => {
    if (aiFillingRow !== null) return;
    setAiFillingRow(index);
    try {
      const row = controls[index];
      const emptyFields: string[] = [];
      if (!row.requirement.trim()) emptyFields.push("requirement");
      if (!row.policyProcess.trim()) emptyFields.push("policyProcess");
      if (!row.implementationEvidence.trim())
        emptyFields.push("implementationEvidence");
      if (!row.outcomeKPI.trim()) emptyFields.push("outcomeKPI");
      if (!row.auditFindings.trim()) emptyFields.push("auditFindings");

      if (emptyFields.length === 0) {
        toast.info("All fields already filled for this row.");
        return;
      }

      const contextParts = [
        `Project: ${project.name}`,
        row.requirement ? `Requirement: ${row.requirement}` : "",
        row.policyProcess ? `Policy/Process: ${row.policyProcess}` : "",
        row.implementationEvidence
          ? `Implementation Evidence: ${row.implementationEvidence}`
          : "",
        row.auditFindings ? `Audit Findings: ${row.auditFindings}` : "",
        row.outcomeKPI ? `Outcome KPI: ${row.outcomeKPI}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const prompt = `You are a healthcare accreditation expert. For this design control row in project "${project.name}", generate content ONLY for the empty fields listed below.

Existing context:
${contextParts}

Empty fields to fill: ${emptyFields.join(", ")}

Respond with EXACTLY these sections (only for empty fields), using the exact headers:
${emptyFields.includes("requirement") ? "### Requirement\n(suggested standard requirement text)\n" : ""}
${emptyFields.includes("policyProcess") ? "### PolicyProcess\n(suggested policy/process description)\n" : ""}
${emptyFields.includes("implementationEvidence") ? "### ImplementationEvidence\n(suggested implementation evidence)\n" : ""}
${emptyFields.includes("auditFindings") ? "### AuditFindings\n(suggested audit findings)\n" : ""}
${emptyFields.includes("outcomeKPI") ? "### OutcomeKPI\n(suggested measurable KPI)\n" : ""}

Keep each section concise (2-3 sentences). Use healthcare accreditation terminology.`;

      const chatResult = await aiAgentService.chat(prompt, true);
      const responseText = chatResult.response || "";

      const newControls = [...controls];
      const parseSection = (header: string): string => {
        const regex = new RegExp(
          `###\\s*${header}\\s*\\n([\\s\\S]*?)(?=###|$)`,
        );
        const match = responseText.match(regex);
        return match ? match[1].trim() : "";
      };

      if (emptyFields.includes("requirement")) {
        const val = parseSection("Requirement");
        if (val) newControls[index].requirement = val;
      }
      if (emptyFields.includes("policyProcess")) {
        const val = parseSection("PolicyProcess");
        if (val) newControls[index].policyProcess = val;
      }
      if (emptyFields.includes("implementationEvidence")) {
        const val = parseSection("ImplementationEvidence");
        if (val) newControls[index].implementationEvidence = val;
      }
      if (emptyFields.includes("auditFindings")) {
        const val = parseSection("AuditFindings");
        if (val) newControls[index].auditFindings = val;
      }
      if (emptyFields.includes("outcomeKPI")) {
        const val = parseSection("OutcomeKPI");
        if (val) newControls[index].outcomeKPI = val;
      }

      setControls(newControls);
      toast.success("AI filled empty fields for this row.");
    } catch (error) {
      console.error("AI fill row error:", error);
      toast.error("Failed to generate AI suggestions for this row.");
    } finally {
      setAiFillingRow(null);
    }
  };

  const handleLinkDocument = (rowIndex: number) => {
    setCurrentRowIndex(rowIndex);
    setPickerOpen(true);
  };

  const handleDocumentsSelected = (documentIds: string[]) => {
    if (currentRowIndex !== null) {
      const newControls = [...controls];
      // Add new documents, avoiding duplicates
      const existingIds = newControls[currentRowIndex].linkedDocumentIds;
      const uniqueNewIds = documentIds.filter(
        (id) => !existingIds.includes(id),
      );
      newControls[currentRowIndex].linkedDocumentIds = [
        ...existingIds,
        ...uniqueNewIds,
      ];
      setControls(newControls);
    }
    setPickerOpen(false);
    setCurrentRowIndex(null);
  };

  const handleRemoveDocument = (rowIndex: number, docId: string) => {
    const newControls = [...controls];
    newControls[rowIndex].linkedDocumentIds = newControls[
      rowIndex
    ].linkedDocumentIds.filter((id) => id !== docId);
    setControls(newControls);
  };
  const handleUploadDocument = (rowIndex: number) => {
    setCurrentRowIndex(rowIndex);
    setShowUploader(true);
  };
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0 || currentRowIndex === null) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const file = files[0];
      const documentId = `design-control-${Date.now()}`;
      const fileUrl = await storageService.uploadDocument(
        file,
        documentId,
        (progress) => setUploadProgress(progress.progress),
      );
      const newDoc: AppDocument = {
        id: documentId,
        name: { en: file.name, ar: file.name },
        type: "Evidence",
        isControlled: false,
        status: "Approved",
        content: { en: "", ar: "" },
        fileUrl,
        currentVersion: 1,
        versionHistory: [],
        uploadedAt: new Date().toISOString(),
      };
      addDocument(newDoc);
      const newControls = [...controls];
      newControls[currentRowIndex].linkedDocumentIds = [
        ...newControls[currentRowIndex].linkedDocumentIds,
        documentId,
      ];
      setControls(newControls);
      setShowUploader(false);
      setCurrentRowIndex(null);
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  const handleViewDocument = (doc: AppDocument) => {
    const action = getDocumentViewAction(doc);

    switch (action) {
      case "pdf":
        setViewingPDF(doc);
        break;
      case "richText":
        setViewingDoc(doc);
        break;
      default:
        // Document type not supported for viewing
        break;
    }
  };
  const getDocumentName = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return "Unknown Document";
    return lang === "ar" ? doc.name.ar : doc.name.en;
  };

  const textareaClasses =
    "w-full min-h-[80px] p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900";
  const selectClasses =
    "w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900";

  return (
    <div className="space-y-6">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("evidenceMatrix")}
            </h2>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("evidenceMatrixDescription")}
            </p>
          </div>
          {!isFinalized && (
            <div className="flex gap-2">
              <button
                onClick={handleAIComplianceCheck}
                disabled={aiChecking || controls.length === 0}
                className="bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg hover:from-rose-700 hover:to-cyan-700 font-semibold shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiChecking ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("checking")}
                  </>
                ) : (
                  <>🤖 {t("aiComplianceCheck")}</>
                )}
              </button>
              <button
                onClick={handleSave}
                className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-sky-700 font-semibold shadow-sm w-full sm:w-auto"
              >
                {t("saveChanges")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <TableContainer>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t("standardRequirement")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t("policyProcess")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t("implementationEvidence")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t("auditFindings")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t("outcomeKPI")}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t("status")}
                  </th>
                  <th scope="col" className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
                {controls.map((row, index) => (
                  <tr key={row.id}>
                    <td className="p-2 align-top">
                      <textarea
                        value={row.requirement}
                        onChange={(e) =>
                          handleUpdate(index, "requirement", e.target.value)
                        }
                        disabled={isFinalized}
                        className={textareaClasses}
                        placeholder={t("enterRequirement")}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea
                        value={row.policyProcess}
                        onChange={(e) =>
                          handleUpdate(index, "policyProcess", e.target.value)
                        }
                        disabled={isFinalized}
                        className={textareaClasses}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea
                        value={row.implementationEvidence}
                        onChange={(e) =>
                          handleUpdate(
                            index,
                            "implementationEvidence",
                            e.target.value,
                          )
                        }
                        disabled={isFinalized}
                        className={textareaClasses}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea
                        value={row.auditFindings}
                        onChange={(e) =>
                          handleUpdate(index, "auditFindings", e.target.value)
                        }
                        disabled={isFinalized}
                        className={textareaClasses}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea
                        value={row.outcomeKPI}
                        onChange={(e) =>
                          handleUpdate(index, "outcomeKPI", e.target.value)
                        }
                        disabled={isFinalized}
                        className={textareaClasses}
                      />
                      <div className="mt-2">
                        <button
                          onClick={() => handleLinkDocument(index)}
                          disabled={isFinalized}
                          className="text-xs flex items-center gap-1 text-brand-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <PaperClipIcon className="w-3 h-3" />
                          {t("linkDocument")}
                        </button>
                        <button
                          onClick={() => handleUploadDocument(index)}
                          disabled={isFinalized}
                          className="text-xs flex items-center gap-1 text-brand-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <UploadIcon className="w-3 h-3" />
                          {t("uploadDocument") || "Upload"}
                        </button>
                      </div>

                      {/* Display linked documents */}
                      {row.linkedDocumentIds.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {row.linkedDocumentIds.map((docId) => {
                            const doc = documents.find((d) => d.id === docId);
                            if (!doc) return null;
                            return (
                              <DocumentListItem
                                key={docId}
                                document={doc}
                                compact={true}
                                showActions={true}
                                onView={handleViewDocument}
                                onRemove={
                                  !isFinalized
                                    ? () => handleRemoveDocument(index, docId)
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          handleUpdate(
                            index,
                            "status",
                            e.target.value as ComplianceStatus,
                          )
                        }
                        disabled={isFinalized}
                        className={selectClasses}
                      >
                        {Object.values(ComplianceStatus).map((status) => (
                          <option key={status} value={status}>
                            {t(
                              status
                                .replace(/\s/g, "")
                                .replace(/\-/g, "")
                                .toLowerCase() as any,
                            ) || status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 align-middle">
                      {!isFinalized && (
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => handleAIFillRow(index)}
                            disabled={aiFillingRow !== null}
                            title="AI Fill Empty Fields"
                            className="p-1 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-cyan-600 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {aiFillingRow === index ? (
                              <svg
                                className="animate-spin h-5 w-5 text-cyan-600"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <span className="text-lg">🤖</span>
                            )}
                          </button>
                          <button
                            onClick={() => removeRow(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      </div>
      {!isFinalized && (
        <button
          onClick={addRow}
          className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
        >
          <PlusIcon className="w-4 h-4" /> {t("addNewItem")}
        </button>
      )}

      {/* Document Picker Modal */}
      <DocumentPicker
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setCurrentRowIndex(null);
        }}
        onSelect={handleDocumentsSelected}
        documents={documents}
        selectedIds={
          currentRowIndex !== null
            ? controls[currentRowIndex]?.linkedDocumentIds
            : []
        }
        multiSelect={true}
      />
      {/* File Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("uploadDocument") || "Upload Document"}
            </h3>

            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple={false}
              maxFiles={1}
              disabled={isUploading}
            />
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
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploader(false);
                  setCurrentRowIndex(null);
                }}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {t("cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF Viewer Modal */}
      {viewingPDF && (
        <PDFViewerModal
          isOpen={!!viewingPDF}
          onClose={() => setViewingPDF(null)}
          fileUrl={viewingPDF.fileUrl || ""}
          fileName={viewingPDF.name.en}
        />
      )}
      {/* Document Editor Modal */}
      {viewingDoc && (
        <DocumentEditorModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          onSave={(doc) => setViewingDoc(null)}
          standards={[]}
        />
      )}

      {/* AI Suggestion Modal */}
      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={t("aiComplianceCheck")}
        content={aiModalContent}
        type="compliance-check"
      />
    </div>
  );
};

export default DesignControlsComponent;
