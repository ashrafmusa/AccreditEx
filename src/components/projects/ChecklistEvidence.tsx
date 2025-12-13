import React, { useState } from "react";
import { ChecklistItem, Project, AppDocument } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  PaperClipIcon,
  CircleStackIcon,
  PlusIcon,
  UploadIcon,
} from "@/components/icons";
import { useAppStore } from "@/stores/useAppStore";
import DocumentPicker from "../common/DocumentPicker";
import DocumentListItem from "../documents/DocumentListItem";
import FileUploader from "../documents/FileUploader";
import PDFViewerModal from "../documents/PDFViewerModal";
import DocumentEditorModal from "../documents/DocumentEditorModal";
import DOCXViewerModal from "../documents/DOCXViewerModal";
import { cloudinaryService } from "@/services/cloudinaryService";
import { getDocumentViewAction } from "@/utils/documentViewingHelper";

interface ChecklistEvidenceProps {
  item: ChecklistItem;
  project: Project;
  isFinalized: boolean;
  onUpload: (projectId: string, checklistItemId: string, fileData: any) => void;
  onLinkData: () => void;
  onUpdate: (updates: Partial<ChecklistItem>) => void;
}

const ChecklistEvidence: React.FC<ChecklistEvidenceProps> = ({
  item,
  project,
  isFinalized,
  onUpload,
  onLinkData,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { documents, addControlledDocument } = useAppStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingPDF, setViewingPDF] = useState<AppDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const [viewingDOCX, setViewingDOCX] = useState<AppDocument | null>(null);

  const evidenceDocs = documents.filter((doc) =>
    item.evidenceFiles.includes(doc.id)
  );

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = files[0];

      console.log("🚀 Starting upload process for:", file.name);
      console.log("📊 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Upload to Cloudinary
      const fileUrl = await cloudinaryService.uploadDocument(
        file,
        `projects/${project.id}/checklist/${item.id}`,
        (progress) => setUploadProgress(progress.progress)
      );

      console.log("✅ Cloudinary upload successful:", fileUrl);

      // Create and save document to Firebase
      console.log("💾 Creating document in Firebase...");
      const createdDoc = await addControlledDocument({
        name: { en: file.name, ar: file.name },
        type: "Evidence",
        fileUrl,
        projectId: project.id, // Link document to project for RBAC
      });

      console.log("✅ Firebase document created:", createdDoc.id);

      // Link to checklist item
      onUpdate({ evidenceFiles: [...item.evidenceFiles, createdDoc.id] });

      console.log("✅ Checklist item updated");

      setShowUploader(false);
    } catch (error) {
      console.error("❌ Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDocumentsSelected = (documentIds: string[]) => {
    const uniqueIds = documentIds.filter(
      (id) => !item.evidenceFiles.includes(id)
    );
    onUpdate({ evidenceFiles: [...item.evidenceFiles, ...uniqueIds] });
    setIsPickerOpen(false);
  };

  const handleRemoveDocument = (docId: string) => {
    onUpdate({
      evidenceFiles: item.evidenceFiles.filter((id) => id !== docId),
    });
  };

  const handleViewDocument = (doc: AppDocument) => {
    const action = getDocumentViewAction(doc);

    switch (action) {
      case "pdf":
        setViewingPDF(doc);
        break;
      case "docx":
        setViewingDOCX(doc);
        break;
      case "richText":
        setViewingDoc(doc);
        break;
      default:
        // Document type not supported for viewing
        break;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{t("evidence")}</label>

      {/* Evidence Documents */}
      <div className="space-y-2 mb-3">
        {evidenceDocs.map((doc) => (
          <DocumentListItem
            key={doc.id}
            document={doc}
            compact={true}
            showActions={true}
            onView={handleViewDocument}
            onRemove={!isFinalized ? handleRemoveDocument : undefined}
          />
        ))}

        {/* Linked FHIR Resources */}
        {item.linkedFhirResources?.map((res) => (
          <div
            key={res.resourceId}
            className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md text-sm"
          >
            <CircleStackIcon className="w-4 h-4 text-blue-500" />
            <span className="grow">{res.displayText}</span>
          </div>
        ))}

        {evidenceDocs.length === 0 && !item.linkedFhirResources?.length && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {t("noEvidenceAttached") || "No evidence attached"}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {!isFinalized && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 rounded-md transition-colors"
          >
            <UploadIcon className="w-4 h-4" />
            {t("uploadEvidence") || "Upload Evidence"}
          </button>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-brand-primary rounded-md transition-colors"
          >
            <PaperClipIcon className="w-4 h-4" />
            {t("linkDocument") || "Link Document"}
          </button>
          <button
            onClick={onLinkData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
          >
            <CircleStackIcon className="w-4 h-4" />
            {t("linkLiveData") || "Link Live Data"}
          </button>
        </div>
      )}

      {/* File Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("uploadEvidence") || "Upload Evidence"}
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
                onClick={() => setShowUploader(false)}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {t("cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Picker */}
      <DocumentPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleDocumentsSelected}
        documents={documents}
        selectedIds={item.evidenceFiles}
        multiSelect={true}
        filterType={["Evidence", "Report"]}
      />

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
          onSave={(doc) => {
            // Handle save if needed
            setViewingDoc(null);
          }}
          standards={[]}
        />
      )}

      {/* DOCX Viewer Modal */}
      {viewingDOCX && (
        <DOCXViewerModal
          isOpen={!!viewingDOCX}
          onClose={() => setViewingDOCX(null)}
          fileUrl={viewingDOCX.fileUrl || ""}
          fileName={viewingDOCX.name.en}
        />
      )}
    </div>
  );
};

export default ChecklistEvidence;
