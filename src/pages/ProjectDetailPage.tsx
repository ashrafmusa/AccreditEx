import React, { useState, useEffect } from "react";
import { NavigationState, ProjectDetailView, User, Project } from "@/types";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import ProjectDetailHeader from "@/components/projects/ProjectDetailHeader";
import ProjectDetailSidebar from "@/components/projects/ProjectDetailSidebar";
import ProjectOverview from "@/pages/ProjectOverview";
import ProjectChecklist from "@/components/projects/ProjectChecklist";
import SignatureModal from "@/components/common/SignatureModal";
import GenerateReportModal from "@/components/documents/GenerateReportModal";
import DesignControlsComponent from "@/components/projects/DesignControlsComponent";
import AuditLogComponent from "@/components/audits/AuditLogComponent";
import SurveyListComponent from "@/components/projects/SurveyListComponent";
import PDCACycleManager from "@/components/projects/PDCACycleManager";
import { Button } from "@/components/ui";

interface ProjectDetailPageProps {
  navigation: { view: "projectDetail"; projectId: string };
  setNavigation: (state: NavigationState) => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  navigation,
  setNavigation,
}) => {
  const {
    projects,
    updateProject,
    finalizeProject,
    updateDesignControls,
    generateReport,
    loading,
  } = useProjectStore();
  const { currentUser } = useUserStore();
  const { accreditationPrograms, documents, standards, risks } = useAppStore();
  const toast = useToast();

  const [activeView, setActiveView] = useState<ProjectDetailView>("overview");
  const [isSigning, setIsSigning] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Shared data cache - prevents duplicate fetches when switching tabs
  const [cachedData, setCachedData] = useState({
    project: null as Project | null,
    lastFetch: 0,
  });

  const project =
    projects.find((p) => p.id === navigation.projectId) || cachedData.project;

  // Update cache when project changes
  React.useEffect(() => {
    if (project) {
      setCachedData({
        project,
        lastFetch: Date.now(),
      });
    }
  }, [project]);

  // Real-time subscription for this specific project
  useEffect(() => {
    setLocalLoading(true);

    // Import projectService dynamically to subscribe to single project
    import("@/services/projectService")
      .then(({ subscribeToProject }) => {
        let isSubscribed = true;
        let unsubscribe: (() => void) | undefined;

        const handleSubscribe = () => {
          try {
            unsubscribe = subscribeToProject(
              navigation.projectId,
              (updatedProject) => {
                if (!isSubscribed) return;

                if (updatedProject) {
                  // Project will be updated in the store automatically via the subscription
                  setLocalLoading(false);
                } else {
                  // Project was deleted or doesn't exist
                  toast.error("Project not found");
                  setNavigation({ view: "projects" });
                }
              },
              (error) => {
                // Handle subscription errors
                if (isSubscribed) {
                  console.error("Subscription error:", error);
                  toast.warning(
                    "Failed to load real-time updates, showing cached data",
                  );
                  setLocalLoading(false);
                }
              },
            );
          } catch (error) {
            console.error("Subscription setup failed:", error);
            if (isSubscribed) {
              toast.warning("Failed to set up real-time updates");
              setLocalLoading(false);
            }
          }
        };

        handleSubscribe();

        return () => {
          isSubscribed = false;
          if (unsubscribe) {
            try {
              unsubscribe();
            } catch (error) {
              console.error("Unsubscribe failed:", error);
            }
          }
        };
      })
      .catch((error) => {
        console.error("Failed to load project service:", error);
        toast.error("Failed to load project service");
        setLocalLoading(false);
      });
  }, [navigation.projectId, setNavigation, toast]);

  if (localLoading || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!project || !currentUser) {
    return <div>Project not found or user not loaded.</div>;
  }

  const program = accreditationPrograms.find((p) => p.id === project.programId);

  const handleFinalize = async () => {
    try {
      await finalizeProject(project.id);
      toast.success("Project finalized successfully!");
      setIsSigning(false);
    } catch (error) {
      toast.error("Incorrect password. Please try again.");
    }
  };

  const handleGenerateReport = async (reportType: string) => {
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
          documents,
          risks,
          generatedBy: currentUser.name,
        });

        exportAssessorReportPackJson(reportPack);
        exportAssessorEvidenceMatrixCsv(reportPack);
        recordAssessorPackExportAudit(reportPack);
        toast.success(
          "Assessor pack exported successfully (JSON + evidence matrix CSV).",
        );
        setIsGeneratingReport(false);
        return;
      }

      setIsGeneratingReport(false); // Close modal immediately
      toast.info(
        "Generating professional PDF compliance report with AI analysis... This may take 30-60 seconds.",
      );

      const reportDoc = await generateReport(project.id, reportType);

      toast.success(
        `PDF report generated successfully! View it in Document Control Hub or download from the report link.`,
      );

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
        error instanceof Error
          ? error.message
          : "Failed to generate report. Please try again.",
      );
      setIsGeneratingReport(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <ProjectOverview project={project} />;
      case "checklist":
        return <ProjectChecklist project={project} onUpdate={updateProject} />;
      case "design_controls":
        return (
          <DesignControlsComponent
            project={project}
            documents={documents}
            isFinalized={false}
            onSave={updateDesignControls}
          />
        );
      case "mock_surveys":
        return (
          <SurveyListComponent
            project={project}
            setNavigation={setNavigation}
          />
        );
      case "audit_log":
        return <AuditLogComponent project={project} />;
      case "pdca_cycles":
        return <PDCACycleManager project={project} onUpdate={updateProject} />;
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
            programName={program?.name || "Unknown Program"}
            currentUser={currentUser}
            onFinalize={() => setIsSigning(true)}
            onGenerateReport={() => setIsGeneratingReport(true)}
          />
          {renderContent()}
        </div>
      </main>

      {isSigning && (
        <SignatureModal
          isOpen={isSigning}
          onClose={() => setIsSigning(false)}
          onConfirm={() => handleFinalize()}
          actionTitle={`Finalize Project: ${project.name}`}
          signatureStatement="By signing, I attest that I have reviewed this project and confirm its contents are accurate and complete to the best of my knowledge."
          confirmActionText="Sign & Finalize"
        />
      )}

      {isGeneratingReport && (
        <GenerateReportModal
          isOpen={isGeneratingReport}
          onClose={() => setIsGeneratingReport(false)}
          onGenerate={handleGenerateReport}
        />
      )}
    </div>
  );
};

const ProjectDetailPageWrapper: React.FC<ProjectDetailPageProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="min-h-screen flex items-center justify-center bg-brand-background dark:bg-dark-brand-background p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Failed to Load Project
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error?.message ||
                  "An error occurred while loading the project"}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => props.setNavigation({ view: "projects" })}
                  variant="secondary"
                  className="flex-1"
                >
                  Back to Projects
                </Button>
                <Button onClick={retry} className="flex-1">
                  Retry
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
