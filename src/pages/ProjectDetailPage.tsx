import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import {
  NavigationState,
  ProjectDetailView,
  ComplianceStatus,
  ProjectStatus,
  UserRole,
} from "@/types";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import ProjectDetailHeader from "@/components/projects/ProjectDetailHeader";
import ProjectDetailSidebar from "@/components/projects/ProjectDetailSidebar";
import SignatureModal from "@/components/common/SignatureModal";
import GenerateReportModal from "@/components/documents/GenerateReportModal";
import { Button, LoadingSpinner } from "@/components/ui";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import { useProjectRecord } from "@/hooks/useProjectRecord";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { useModuleStore } from "@/stores/useModuleStore";
import { projectEvidenceSummary } from "@/utils/projectEvidence";
import { projectWorkSummary } from "@/utils/projectJourney";

// ── Lazy-loaded tab components (code-splitting) ───────────
const ProjectOverview = lazy(() => import("@/pages/ProjectOverview"));
const ProjectChecklist = lazy(
  () => import("@/components/projects/ProjectChecklist"),
);
const DesignControlsComponent = lazy(
  () => import("@/components/projects/DesignControlsComponent"),
);
const AuditLogComponent = lazy(
  () => import("@/components/audits/AuditLogComponent"),
);
const SurveyListComponent = lazy(
  () => import("@/components/projects/SurveyListComponent"),
);
const PDCACycleManager = lazy(
  () => import("@/components/projects/PDCACycleManager"),
);

interface ProjectDetailPageProps {
  navigation: { view: "projectDetail"; projectId: string };
  setNavigation: (state: NavigationState) => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  navigation,
  setNavigation,
}) => {
  const {
    updateProject,
    finalizeProject,
    updateDesignControls,
    generateReport,
  } = useProjectStore();
  const { currentUser } = useUserStore();
  const { accreditationPrograms, documents, standards, risks, addDocument } =
    useAppStore();
  const toast = useToast();
  const { t, lang } = useTranslation();
  const { can } = usePermission();
  const { isNavKeyEnabled } = useModuleStore();
  const { project, loading, failed, missing, retry } = useProjectRecord(
    navigation.projectId,
  );

  const [activeView, setActiveView] = useState<ProjectDetailView>("overview");
  const [isSigning, setIsSigning] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [readinessModalOpen, setReadinessModalOpen] = useState(false);
  const [readinessContent, setReadinessContent] = useState("");
  const activeProjectId = useRef(navigation.projectId);
  activeProjectId.current = navigation.projectId;

  useEffect(() => {
    setActiveView("overview");
    setIsSigning(false);
    setIsGeneratingReport(false);
    setReadinessModalOpen(false);
    setReadinessContent("");
    setIsCheckingReadiness(false);
  }, [navigation.projectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (
    failed ||
    missing ||
    !project ||
    !currentUser ||
    !can(Action.Read, Resource.Project)
  ) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-brand-border dark:border-dark-brand-border p-5 space-y-3"
      >
        <p>
          {t(failed ? "projectDetailLoadError" : "projectDetailUnavailable")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => setNavigation({ view: "projects" })}
          >
            {t("projectBackToList")}
          </Button>
          {failed && <Button onClick={retry}>{t("projectRetry")}</Button>}
        </div>
      </div>
    );
  }

  const program = accreditationPrograms.find((p) => p.id === project.programId);
  const evidence = projectEvidenceSummary(project, documents);
  const work = projectWorkSummary(project);
  const readOnly =
    project.archived ||
    project.status === ProjectStatus.Finalized ||
    !can(Action.Update, Resource.Project);
  const canFinalize =
    !readOnly &&
    (currentUser.role === UserRole.Admin ||
      currentUser.id === project.projectLead?.id ||
      (currentUser.role === UserRole.ProjectLead &&
        project.teamMembers?.includes(currentUser.id)));

  const handleReadinessCheck = async () => {
    if (!canFinalize || isCheckingReadiness) return;
    setIsCheckingReadiness(true);
    try {
      const checklist = project.checklist || [];
      const totalItems = checklist.length;
      const compliant = checklist.filter(
        (i) => i.status === ComplianceStatus.Compliant,
      ).length;
      const nonCompliant = checklist.filter(
        (i) => i.status === ComplianceStatus.NonCompliant,
      ).length;
      const partial = checklist.filter(
        (i) => i.status === ComplianceStatus.PartiallyCompliant,
      ).length;
      const notStarted = checklist.filter(
        (i) => i.status === ComplianceStatus.NotStarted,
      ).length;
      const missingEvidence = evidence.missingEvidence;
      const openCAPAs = work.openCapa;
      const designControls = project.designControls || [];
      const dcNotApplicable = designControls.filter(
        (d) => !d.requirement?.trim(),
      ).length;

      const prompt = `You are a healthcare accreditation finalization advisor. A project manager wants to FINALIZE this project. Analyze the data below and provide a readiness assessment.

## Project: ${project.name} (ID: ${project.id}, Program: ${program?.name || project.programId})
- Total Checklist Items: ${totalItems}
- Compliant: ${compliant}
- Non-Compliant: ${nonCompliant}
- Partially Compliant: ${partial}
- Not Started: ${notStarted}
- Items Missing Evidence: ${missingEvidence}
- Unresolved Document References: ${evidence.unresolvedLinks}
- Linked Documents Not Approved: ${evidence.unapprovedDocuments}
- Outstanding Items Without Owners: ${work.unassigned}
- Overdue Outstanding Items: ${work.overdue}
- Open CAPAs (not closed): ${openCAPAs}
- Design Controls: ${designControls.length} (${dcNotApplicable} with empty requirements)
- PDCA Cycles: ${(project.pdcaCycles || []).length}

Provide:
1. **Overall Readiness Score** (Ready / Almost Ready / Not Ready)
2. **Critical Blockers** - things that MUST be resolved before finalization
3. **Warnings** - issues that should ideally be addressed
4. **Recommendations** - suggestions for improvement

This is advisory review, not accreditation certification or permission to sign. Do not infer document content or evidence verification from IDs or status alone. Explain limits of these aggregate counts. Recommend human review of linked evidence. Respond in ${lang === "ar" ? "Arabic" : "English"}.
Be specific and actionable.`;

      const response = await aiAgentService.chat(prompt, true);
      if (activeProjectId.current !== project.id) return;
      setReadinessContent(response.response);
      setReadinessModalOpen(true);
    } catch (error) {
      if (activeProjectId.current !== project.id) return;
      console.error("Readiness check error:", error);
      toast.error(t("projectReadinessFailed"));
    } finally {
      if (activeProjectId.current === project.id) setIsCheckingReadiness(false);
    }
  };

  const handleFinalize = async (password: string) => {
    if (!canFinalize) return;
    try {
      await finalizeProject(project.id, password);
      toast.success(t("projectFinalizedSuccess"));
      setIsSigning(false);
    } catch (error) {
      console.error("Project finalization failed:", error);
      toast.error(t("projectFinalizationFailed"));
    }
  };

  const handleGenerateReport = async (
    reportType: string,
    options?: {
      reviewerName?: string;
      signOffNote?: string;
    },
  ) => {
    if (!can(Action.Read, Resource.Report)) return;
    try {
      if (reportType === "assessorPack") {
        const {
          buildAssessorReportPack,
          exportAssessorEvidenceMatrixCsv,
          exportAssessorReportPackJson,
          recordAssessorPackExportAudit,
        } = await import("@/services/assessorReportPackService");

        const reportPack = buildAssessorReportPack({
          project,
          standards,
          documents: documents.filter(
            (doc) =>
              !project.organizationId ||
              doc.organizationId === project.organizationId,
          ),
          risks: risks.filter(
            (risk) =>
              !project.organizationId ||
              risk.organizationId === project.organizationId,
          ),
          generatedBy: currentUser.name,
        });

        exportAssessorReportPackJson(reportPack);
        exportAssessorEvidenceMatrixCsv(reportPack);
        recordAssessorPackExportAudit(reportPack, {
          reviewerName: options?.reviewerName,
          note: options?.signOffNote,
        });
        toast.success(t("projectAssessorExported"));
        setIsGeneratingReport(false);
        return;
      }

      setIsGeneratingReport(false); // Close modal immediately
      toast.info(t("projectReportGenerating"));

      const reportDoc = await generateReport(project.id, reportType);
      if (
        !useAppStore.getState().documents.some((doc) => doc.id === reportDoc.id)
      ) {
        addDocument(reportDoc);
      }

      toast.success(t("projectReportGenerated"));

      // Optional: Auto-download the PDF
      if (reportDoc?.fileUrl) {
        const link = document.createElement("a");
        link.href = reportDoc.fileUrl;
        link.download = `${
          project.name
        }_Compliance_Report_${new Date().toLocaleDateString()}.pdf`;
        link.target = "_blank";
        link.click();
      }
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error(
        error instanceof Error ? error.message : t("projectReportFailed"),
      );
      setIsGeneratingReport(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <ProjectOverview project={project} />;
      case "checklist":
        return (
          <ProjectChecklist
            project={project}
            readOnly={readOnly}
            onUpdateProject={updateProject}
          />
        );
      case "documents": {
        if (
          !can(Action.Read, Resource.Document) ||
          !isNavKeyEnabled("documentControl")
        )
          return <p>{t("projectDetailUnavailable")}</p>;
        const projectDocs = evidence.documents;
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("projects.documents") || "Project Documents"}{" "}
                <span className="text-sm font-normal text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  ({projectDocs.length})
                </span>
              </h2>
              <button
                type="button"
                onClick={() =>
                  setNavigation({
                    view: "documentControl",
                    filter: `project:${project.id}`,
                  })
                }
                className="min-h-11 rounded-lg px-3 text-sm text-brand-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                {t("viewAllInDocControl") || "View All in Document Control →"}
              </button>
            </div>
            {evidence.unresolvedLinks > 0 && (
              <p
                role="status"
                className="text-sm text-amber-700 dark:text-amber-300"
              >
                {t("projectUnresolvedEvidence", {
                  count: evidence.unresolvedLinks,
                })}
              </p>
            )}
            {projectDocs.length > 0 ? (
              <div className="grid gap-3">
                {projectDocs.map((doc) => (
                  <button
                    type="button"
                    key={doc.id}
                    className="flex items-center gap-3 p-3 text-start bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-lg hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                    onClick={() =>
                      setNavigation({
                        view: "documentControl",
                        documentId: doc.id,
                      })
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                        {doc.name?.[lang] || doc.name?.en || doc.id}
                      </p>
                      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        {doc.documentNumber} •{" "}
                        {t(doc.type.toLowerCase().replace(/\s/g, ""))} •{" "}
                        <span
                          className={
                            doc.status === "Approved"
                              ? "text-green-600"
                              : doc.status === "Draft"
                                ? "text-gray-500"
                                : "text-yellow-600"
                          }
                        >
                          {t(
                            doc.status === "Pending Review"
                              ? "pendingReview"
                              : doc.status.charAt(0).toLowerCase() +
                                  doc.status.slice(1).replace(/\s/g, ""),
                          )}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                <p className="text-sm">
                  {t("noProjectDocuments") ||
                    "No documents linked to this project yet."}
                </p>
                <p className="text-xs mt-1">
                  {t("uploadEvidenceHint") ||
                    "Upload evidence from checklist items to link documents."}
                </p>
              </div>
            )}
          </div>
        );
      }
      case "design_controls":
        return (
          <DesignControlsComponent
            project={project}
            documents={documents.filter(
              (doc) =>
                !project.organizationId ||
                doc.organizationId === project.organizationId,
            )}
            isFinalized={readOnly}
            onSave={(controls) => updateDesignControls(project.id, controls)}
          />
        );
      case "mock_surveys":
        if (!can(Action.Read, Resource.Audit))
          return <p>{t("projectDetailUnavailable")}</p>;
        return (
          <SurveyListComponent
            project={project}
            readOnly={readOnly}
            setNavigation={setNavigation}
          />
        );
      case "audit_log":
        if (!can(Action.Read, Resource.Audit))
          return <p>{t("projectDetailUnavailable")}</p>;
        return <AuditLogComponent project={project} />;
      case "pdca_cycles":
        return (
          <PDCACycleManager
            project={project}
            readOnly={readOnly}
            onUpdate={updateProject}
          />
        );
      default:
        return <ProjectOverview project={project} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <ProjectDetailSidebar
        project={project}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <main className="w-full lg:w-3/4 xl:w-4/5">
        <div className="space-y-6">
          <ProjectDetailHeader
            project={project}
            programName={program?.name || t("projectUnknownProgram")}
            currentUser={currentUser}
            onFinalize={() => handleReadinessCheck()}
            onGenerateReport={() => setIsGeneratingReport(true)}
            isBusy={isCheckingReadiness}
          />
          <section
            aria-label={t("projectNextActions")}
            className="rounded-xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface p-4 space-y-3"
          >
            <h2 className="font-semibold">{t("projectNextActions")}</h2>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("projectWorkspaceHint")}
            </p>
            {readOnly && (
              <p role="status" className="text-sm">
                {t("projectReadOnlyNotice")}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setActiveView("checklist")}
              >
                {t("projectRequirementsAction", { count: work.remaining })}
              </Button>
              {can(Action.Read, Resource.Document) &&
                isNavKeyEnabled("documentControl") && (
                  <Button
                    variant="secondary"
                    onClick={() => setActiveView("documents")}
                  >
                    {t("projectEvidenceAction", {
                      count: evidence.documents.length,
                    })}
                  </Button>
                )}
              <Button
                variant="secondary"
                onClick={() => setActiveView("pdca_cycles")}
              >
                {t("projectImprovementAction", { count: work.openCapa })}
              </Button>
              {can(Action.Read, Resource.Audit) && (
                <Button
                  variant="secondary"
                  onClick={() => setActiveView("mock_surveys")}
                >
                  {t("mockSurveys")}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setNavigation({ view: "projects" })}
              >
                {t("projectBackToList")}
              </Button>
            </div>
          </section>
          {isCheckingReadiness && (
            <div className="flex items-center gap-3 p-4 bg-linear-to-r from-rose-50 to-cyan-50 dark:from-rose-900/20 dark:to-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
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
              <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                {t("projectReadinessLoading")}
              </span>
            </div>
          )}
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            }
          >
            {renderContent()}
          </Suspense>
        </div>
      </main>

      {isSigning && (
        <SignatureModal
          isOpen={isSigning}
          onClose={() => setIsSigning(false)}
          onConfirm={handleFinalize}
          actionTitle={t("projectFinalizeNamed", { name: project.name })}
          signatureStatement={t("projectSignatureStatement")}
          confirmActionText={t("finalizeProject")}
        />
      )}

      {isGeneratingReport && (
        <GenerateReportModal
          isOpen={isGeneratingReport}
          onClose={() => setIsGeneratingReport(false)}
          onGenerate={handleGenerateReport}
        />
      )}

      <AISuggestionModal
        isOpen={readinessModalOpen}
        onClose={() => setReadinessModalOpen(false)}
        title={t("projectReadinessTitle")}
        content={readinessContent}
        type="readiness-check"
        footer={
          <div className="flex flex-wrap gap-3 justify-end mt-4">
            <p className="w-full text-sm">{t("projectReadinessAdvisory")}</p>
            <button
              onClick={() => setReadinessModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t("projectReviewIssues")}
            </button>
            <button
              onClick={() => {
                setReadinessModalOpen(false);
                setIsSigning(true);
              }}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-sky-700 font-semibold"
            >
              {t("projectProceedSignature")}
            </button>
          </div>
        }
      />
    </div>
  );
};

const ProjectDetailPageWrapper: React.FC<ProjectDetailPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                {t("projectDetailLoadError")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error?.message || t("projectDetailLoadError")}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => props.setNavigation({ view: "projects" })}
                  variant="secondary"
                  className="flex-1"
                >
                  {t("projectBackToList")}
                </Button>
                <Button onClick={retry} className="flex-1">
                  {t("projectRetry")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <ProjectDetailPage {...props} />
    </ErrorBoundary>
  );
};

export default ProjectDetailPageWrapper;
