import React, { useState } from "react";
import {
  User,
  Competency,
  AppDocument,
  UserCompetency,
  UserRole,
} from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  UploadIcon,
} from "../icons";
import { EmptyState } from "@/components/ui";
import UserCompetencyModal from "../competencies/UserCompetencyModal";
import { useToast } from "../../hooks/useToast";
import DocumentListItem from "../documents/DocumentListItem";
import FileUploader from "../documents/FileUploader";
import PDFViewerModal from "../documents/PDFViewerModal";
import DocumentEditorModal from "../documents/DocumentEditorModal";
import { useAppStore } from "../../stores/useAppStore";
import { storageService } from "../../services/storageService";
import { getDocumentViewAction } from "../../utils/documentViewingHelper";

interface Props {
  user: User;
  currentUser: User;
  competencies: Competency[];
  documents: AppDocument[];
  onUpdateUser: (user: User) => void;
}

const UserCompetencies: React.FC<Props> = ({
  user,
  currentUser,
  competencies,
  documents,
  onUpdateUser,
}) => {
  const { t, lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] =
    useState<UserCompetency | null>(null);
  const canEdit = currentUser.role === UserRole.Admin;
  const toast = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const { addDocument } = useAppStore();
  const [showUploader, setShowUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingPDF, setViewingPDF] = useState<AppDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const [uploadingForCompetency, setUploadingForCompetency] = useState<
    string | null
  >(null);

  const getCompetencyStatus = (uc: UserCompetency) => {
    if (!uc.expiryDate) return { text: t("active"), color: "text-green-600" };
    const expiry = new Date(uc.expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(new Date().setDate(now.getDate() + 30));

    if (expiry < now) return { text: t("expired"), color: "text-red-600" };
    if (expiry <= thirtyDaysFromNow)
      return { text: t("expiringSoon"), color: "text-yellow-600" };
    return { text: t("active"), color: "text-green-600" };
  };

  const handleSave = (competency: UserCompetency) => {
    const existingIndex = user.competencies?.findIndex(
      (c) => c.competencyId === competency.competencyId
    );
    let newCompetencies = [...(user.competencies || [])];
    if (existingIndex !== undefined && existingIndex > -1) {
      newCompetencies[existingIndex] = competency;
    } else {
      newCompetencies.push(competency);
    }
    onUpdateUser({ ...user, competencies: newCompetencies });
    setIsModalOpen(false);
    setEditingCompetency(null);
  };

  const handleDelete = (competencyId: string) => {
    if (window.confirm(t("areYouSureDeleteCompetency"))) {
      onUpdateUser({
        ...user,
        competencies:
          user.competencies?.filter((c) => c.competencyId !== competencyId) ||
          [],
      });
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success(t("syncSuccess"));
      // In a real app, you would refetch user competencies here
    }, 1500);
  };

  const handleUploadCertificate = (competencyId: string) => {
    setUploadingForCompetency(competencyId);
    setShowUploader(true);
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0 || !uploadingForCompetency) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = files[0];
      const documentId = `certificate-${Date.now()}`;

      const fileUrl = await storageService.uploadDocument(
        file,
        documentId,
        (progress) => setUploadProgress(progress.progress)
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

      // Link to competency evidence
      const updatedCompetencies = user.competencies?.map((uc) => {
        if (uc.competencyId === uploadingForCompetency) {
          return {
            ...uc,
            evidenceDocumentIds: [
              ...(uc.evidenceDocumentIds || []),
              documentId,
            ],
          };
        }
        return uc;
      });

      onUpdateUser({ ...user, competencies: updatedCompetencies || [] });

      setShowUploader(false);
      setUploadingForCompetency(null);
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

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t("competenciesCerts")}</h2>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center justify-center text-sm bg-slate-100 dark:bg-slate-700 text-brand-text-primary dark:text-dark-brand-text-primary px-2 sm:px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-70"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline ltr:ml-1.5 rtl:mr-1.5">
                {isSyncing ? t("syncing") : t("syncWithHris")}
              </span>
            </button>
            <button
              onClick={() => {
                setEditingCompetency(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center text-sm bg-brand-primary text-white px-2 sm:px-3 py-1.5 rounded-md hover:bg-indigo-700"
              title={t("addCompetency")}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline ltr:ml-1.5 rtl:mr-1.5">
                {t("addCompetency")}
              </span>
            </button>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {(user.competencies || []).map((uc) => {
          const competency = competencies.find((c) => c.id === uc.competencyId);
          if (!competency) return null;
          const status = getCompetencyStatus(uc);
          return (
            <div
              key={uc.competencyId}
              className="p-3 rounded-md border dark:border-dark-brand-border flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div>
                <p className="font-semibold">{competency.name[lang]}</p>
                <p className="text-xs text-gray-500">
                  {t("issueDate")}:{" "}
                  {new Date(uc.issueDate).toLocaleDateString()}{" "}
                  {uc.expiryDate &&
                    `| ${t("expiryDate")}: ${new Date(
                      uc.expiryDate
                    ).toLocaleDateString()}`}
                </p>
                {/* Evidence Documents */}
                {uc.evidenceDocumentIds &&
                  uc.evidenceDocumentIds.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uc.evidenceDocumentIds.map((docId) => {
                        const doc = documents.find((d) => d.id === docId);
                        if (!doc) return null;
                        return (
                          <DocumentListItem
                            key={docId}
                            document={doc}
                            compact={true}
                            showActions={true}
                            onView={handleViewDocument}
                          />
                        );
                      })}
                    </div>
                  )}
                {canEdit && (
                  <button
                    onClick={() => handleUploadCertificate(uc.competencyId)}
                    className="mt-2 text-xs flex items-center gap-1 text-brand-primary hover:underline"
                  >
                    <UploadIcon className="w-3 h-3" />
                    {t("uploadCertificate") || "Upload Certificate"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${status.color}`}>
                  {status.text}
                </span>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCompetency(uc);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-gray-500 hover:text-brand-primary"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(uc.competencyId)}
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(user.competencies || []).length === 0 && (
          <EmptyState icon={PlusIcon} title={t("noCompetencies")} message="" />
        )}
      </div>
      {isModalOpen && (
        <UserCompetencyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          competencies={competencies}
          documents={documents}
          existingUserCompetency={editingCompetency}
        />
      )}

      {/* File Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("uploadCertificate") || "Upload Certificate"}
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
                  setUploadingForCompetency(null);
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
    </div>
  );
};

export default UserCompetencies;
