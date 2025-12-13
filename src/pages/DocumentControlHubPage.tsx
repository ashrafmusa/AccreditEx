import React, { useState, useMemo } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../hooks/useToast";
import { AppDocument, User, UserRole, Standard, Department } from "../types";
import { useProjectStore } from "@/stores/useProjectStore";
import DocumentEditorModal from "../components/documents/DocumentEditorModal";
import ProcessMapEditor from "../components/documents/ProcessMapEditor";
import ProcessMapMetadataModal from "../components/documents/ProcessMapMetadataModal";
import StatCard from "../components/common/StatCard";
import DocumentSidebar from "../components/documents/DocumentSidebar";
import DocumentSearch, {
  DocumentFilters,
} from "../components/documents/DocumentSearch";
import DocumentMetadataModal from "../components/documents/DocumentMetadataModal";
import SignatureModal from "../components/common/SignatureModal";
import ControlledDocumentsTable from "../components/documents/ControlledDocumentsTable";
import PDFViewerModal from "../components/documents/PDFViewerModal";
import RestrictedFeatureIndicator from "../components/common/RestrictedFeatureIndicator";
import { Button } from "@/components/ui";
import {
  DocumentTextIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
} from "../components/icons";

interface DocumentControlHubPageProps {
  documents: AppDocument[];
  standards: Standard[];
  departments: Department[];
  currentUser: User;
  onUpdateDocument: (updatedDocument: AppDocument) => void;
  onCreateDocument: (data: {
    name: { en: string; ar: string };
    type: AppDocument["type"];
    fileUrl?: string;
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => void;
  onAddProcessMap: (data: {
    name: { en: string; ar: string };
    tags?: string[];
    category?: string;
    departmentIds?: string[];
  }) => void;
  onDeleteDocument: (docId: string) => void;
  onApproveDocument: (docId: string) => void;
}

const DocumentControlHubPage: React.FC<DocumentControlHubPageProps> = ({
  documents,
  standards,
  departments,
  currentUser,
  onUpdateDocument,
  onCreateDocument,
  onAddProcessMap,
  onDeleteDocument,
  onApproveDocument,
}) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const { projects } = useProjectStore();
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [isProcessMapModalOpen, setIsProcessMapModalOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<AppDocument | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const [viewingPDF, setViewingPDF] = useState<AppDocument | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<DocumentFilters>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnlyMyDocs, setShowOnlyMyDocs] = useState(
    !currentUser || currentUser.role !== UserRole.Admin
  );
  const canModify = currentUser.role === UserRole.Admin;

  const handleConfirmSignature = async () => {
    if (!signingDoc) return;

    setIsSaving(true);
    try {
      onApproveDocument(signingDoc.id);
      toast.success(
        t("documentApprovedSuccessfully") || "Document approved successfully"
      );
      setSigningDoc(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToApproveDocument") || "Failed to approve document";
      toast.error(errorMsg);
      console.error("Document approval failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDocument = async (doc: AppDocument) => {
    setIsSaving(true);
    try {
      onUpdateDocument(doc);
      toast.success(
        t("documentSavedSuccessfully") || "Document saved successfully"
      );
      setViewingDoc(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToSaveDocument") || "Failed to save document";
      toast.error(errorMsg);
      console.error("Document save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    const docName = doc?.name[lang] || "Document";

    if (
      !window.confirm(
        `${
          t("areYouSureDeleteDocument") ||
          "Are you sure you want to delete this document?"
        } "${docName}"?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      onDeleteDocument(docId);
      toast.success(
        t("documentDeletedSuccessfully") || "Document deleted successfully"
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToDeleteDocument") || "Failed to delete document";
      toast.error(errorMsg);
      console.error("Document delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDocument = async (docData: any) => {
    try {
      if (!docData.name?.en || !docData.name?.en.trim()) {
        toast.error(t("documentNameRequired") || "Document name is required");
        return;
      }
      if (!docData.name?.ar || !docData.name?.ar.trim()) {
        toast.error(t("arabicNameRequired") || "Arabic name is required");
        return;
      }

      onCreateDocument(docData);
      toast.success(
        t("documentCreatedSuccessfully") || "Document created successfully"
      );
      setIsMetaModalOpen(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToCreateDocument") || "Failed to create document";
      toast.error(errorMsg);
      console.error("Document creation failed:", error);
    }
  };

  const handleAddProcessMap = async (mapData: any) => {
    try {
      if (!mapData.name?.en || !mapData.name?.en.trim()) {
        toast.error(
          t("processMapNameRequired") || "Process map name is required"
        );
        return;
      }
      if (!mapData.name?.ar || !mapData.name?.ar.trim()) {
        toast.error(t("arabicNameRequired") || "Arabic name is required");
        return;
      }

      // Pass all metadata to the store
      await onAddProcessMap({
        name: mapData.name,
        tags: mapData.tags,
        category: mapData.category,
        departmentIds: mapData.departmentIds,
      });
      toast.success(
        t("processMapCreatedSuccessfully") || "Process map created successfully"
      );
      setIsProcessMapModalOpen(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToCreateProcessMap") || "Failed to create process map";
      toast.error(errorMsg);
      console.error("Process map creation failed:", error);
    }
  };

  const controlledDocuments = useMemo(() => {
    let filtered = documents.filter((doc) => doc.isControlled);

    // Role-based access: Filter by project assignment for evidence documents
    if (showOnlyMyDocs && currentUser.role !== UserRole.Admin) {
      filtered = filtered.filter((doc) => {
        // If document has projectId, check if user has access to that project
        if (doc.projectId) {
          const project = projects.find((p) => p.id === doc.projectId);
          if (!project) return false;
          const isProjectLead = project.projectLead?.id === currentUser.id;
          const isTeamMember = project.teamMembers?.includes(currentUser.id);
          return isProjectLead || isTeamMember;
        }
        // Non-project documents (policies, procedures) visible to all
        return true;
      });
    }

    // 1. Filter by Category
    if (activeCategory === "my_documents") {
      filtered = filtered.filter((doc) => doc.uploadedBy === currentUser.name);
    } else if (activeCategory === "recent") {
      filtered = filtered
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        .slice(0, 10);
    } else if (activeCategory.startsWith("dept_")) {
      // Filter by department ID
      const deptId = activeCategory;
      filtered = filtered.filter((doc) => doc.departmentIds?.includes(deptId));
    } else if (activeCategory !== "all") {
      filtered = filtered.filter((doc) => doc.type === activeCategory);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.en.toLowerCase().includes(query) ||
          doc.name.ar.toLowerCase().includes(query) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 3. Filter by Advanced Filters
    if (activeFilters.status) {
      filtered = filtered.filter((doc) => doc.status === activeFilters.status);
    }
    if (activeFilters.author) {
      filtered = filtered.filter((doc) =>
        doc.uploadedBy
          ?.toLowerCase()
          .includes(activeFilters.author!.toLowerCase())
      );
    }
    if (activeFilters.category) {
      filtered = filtered.filter(
        (doc) => doc.category === activeFilters.category
      );
    }
    if (activeFilters.departmentId) {
      filtered = filtered.filter((doc) =>
        doc.departmentIds?.includes(activeFilters.departmentId!)
      );
    }
    if (activeFilters.tags && activeFilters.tags.length > 0) {
      filtered = filtered.filter((doc) =>
        doc.tags?.some((tag) => activeFilters.tags!.includes(tag))
      );
    }

    return filtered;
  }, [documents, activeCategory, currentUser, searchQuery, activeFilters]);

  const stats = useMemo(() => {
    return {
      total: controlledDocuments.length,
      approved: controlledDocuments.filter((d) => d.status === "Approved")
        .length,
      pending: controlledDocuments.filter((d) => d.status === "Pending Review")
        .length,
      drafts: controlledDocuments.filter((d) => d.status === "Draft").length,
    };
  }, [controlledDocuments]);

  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      my_documents: 0,
      recent: 0,
    };
    const controlled = documents.filter((d) => d.isControlled);
    counts.all = controlled.length;

    // Count by type
    ["Policy", "Procedure", "Process Map", "Evidence", "Report"].forEach(
      (type) => {
        counts[type] = controlled.filter((d) => d.type === type).length;
      }
    );

    // Count by category
    counts.my_documents = controlled.filter(
      (doc) => doc.uploadedBy === currentUser.name
    ).length;
    counts.recent = Math.min(10, controlled.length);

    // Count by department
    departments.forEach((dept) => {
      counts[dept.id] = controlled.filter((doc) =>
        doc.departmentIds?.includes(dept.id)
      ).length;
    });

    return counts;
  }, [documents, currentUser, departments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <DocumentTextIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("documentControl")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("documentControlHubDescription")}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {currentUser.role === UserRole.Admin && (
            <Button
              onClick={() => setShowOnlyMyDocs(!showOnlyMyDocs)}
              variant={showOnlyMyDocs ? "secondary" : "primary"}
              className="w-full sm:w-auto"
            >
              <CheckCircleIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {showOnlyMyDocs ? t("showAllDocuments") : t("showMyDocuments")}
            </Button>
          )}
          {canModify && (
            <div className="relative">
              <Button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="w-full sm:w-auto"
              >
                <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                {t("addNew")}
                <ChevronDownIcon className="w-4 h-4 ltr:ml-2 rtl:mr-2" />
              </Button>
              {isAddMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-dark-brand-surface rounded-md shadow-lg border dark:border-dark-brand-border z-10">
                  <button
                    onClick={() => {
                      setIsMetaModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("policy")}/{t("procedure")}
                  </button>
                  <button
                    onClick={() => {
                      setIsProcessMapModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("processMap")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!canModify && (
        <RestrictedFeatureIndicator featureName="Document Management" />
      )}

      <div className="flex gap-6">
        <DocumentSidebar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          documentCounts={documentCounts}
          departments={departments}
        />

        <div className="flex-1 space-y-6 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t("totalDocuments")}
              value={stats.total}
              icon={DocumentTextIcon}
              color="from-blue-500 to-blue-700 bg-gradient-to-br"
            />
            <StatCard
              title={t("approved")}
              value={stats.approved}
              icon={CheckCircleIcon}
              color="from-green-500 to-green-700 bg-gradient-to-br"
            />
            <StatCard
              title={t("pendingReview")}
              value={stats.pending}
              icon={ClockIcon}
              color="from-yellow-500 to-yellow-700 bg-gradient-to-br"
            />
            <StatCard
              title={t("drafts")}
              value={stats.drafts}
              icon={PencilIcon}
              color="from-gray-500 to-gray-700 bg-gradient-to-br"
            />
          </div>

          <DocumentSearch
            onSearch={setSearchQuery}
            onFilter={setActiveFilters}
          />

          <ControlledDocumentsTable
            documents={controlledDocuments}
            canModify={canModify}
            onApprove={(doc) => setSigningDoc(doc)}
            onDelete={handleDeleteDocument}
            onView={(doc) => {
              if (doc.fileUrl && doc.fileUrl.endsWith(".pdf")) {
                setViewingPDF(doc);
              } else {
                setViewingDoc(doc);
              }
            }}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Process Map Metadata Modal */}
      <ProcessMapMetadataModal
        isOpen={isProcessMapModalOpen}
        onClose={() => setIsProcessMapModalOpen(false)}
        onSave={handleAddProcessMap}
      />

      {/* Document Metadata Modal */}
      <DocumentMetadataModal
        isOpen={isMetaModalOpen}
        onClose={() => setIsMetaModalOpen(false)}
        onSave={handleCreateDocument}
      />

      {signingDoc && (
        <SignatureModal
          isOpen={!!signingDoc}
          onClose={() => setSigningDoc(null)}
          onConfirm={() => handleConfirmSignature()}
          actionTitle={`${t("approve")} "${signingDoc.name[lang]}"`}
          signatureStatement={t("signatureStatementDocument")}
          confirmActionText={t("signAndApprove")}
        />
      )}

      {viewingDoc && viewingDoc.type !== "Process Map" && (
        <DocumentEditorModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          onSave={handleSaveDocument}
          standards={standards}
          isSaving={isSaving}
        />
      )}

      {viewingDoc && viewingDoc.type === "Process Map" && (
        <ProcessMapEditor
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          onSave={handleSaveDocument}
          isSaving={isSaving}
        />
      )}

      {viewingPDF && (
        <PDFViewerModal
          isOpen={!!viewingPDF}
          onClose={() => setViewingPDF(null)}
          fileUrl={viewingPDF.fileUrl || ""}
          fileName={viewingPDF.name[lang]}
        />
      )}
    </div>
  );
};

export default DocumentControlHubPage;
