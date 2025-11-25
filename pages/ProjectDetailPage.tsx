import React, { useState } from 'react';
import { NavigationState, ProjectDetailView, User, Project } from '@/types';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import { useToast } from '@/hooks/useToast';
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader';
import ProjectDetailSidebar from '@/components/projects/ProjectDetailSidebar';
import ProjectOverview from '@/pages/ProjectOverview';
// FIX: Corrected import path for ProjectChecklist
import ProjectChecklist from '@/components/projects/ProjectChecklist';
import SignatureModal from '@/components/common/SignatureModal';
import GenerateReportModal from '@/components/documents/GenerateReportModal';
import DesignControlsPage from './DesignControlsPage';
import AuditLogPage from './AuditLogPage';
import MockSurveyListPage from './MockSurveyListPage';

interface ProjectDetailPageProps {
  navigation: { view: 'projectDetail', projectId: string };
  setNavigation: (state: NavigationState) => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ navigation, setNavigation }) => {
  const { projects, updateProject, finalizeProject, updateDesignControls, generateReport } = useProjectStore();
  const { currentUser } = useUserStore();
  const { accreditationPrograms, documents } = useAppStore();
  const toast = useToast();

  const [activeView, setActiveView] = useState<ProjectDetailView>('overview');
  const [isSigning, setIsSigning] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const project = projects.find(p => p.id === navigation.projectId);
  if (!project || !currentUser) {
    return <div>Project not found or user not loaded.</div>;
  }

  const program = accreditationPrograms.find(p => p.id === project.programId);

  const handleFinalize = async (passwordAttempt: string) => {
    try {
      await finalizeProject(project.id, passwordAttempt);
      toast.success('Project finalized successfully!');
      setIsSigning(false);
    } catch (error) {
      toast.error('Incorrect password. Please try again.');
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    await generateReport(project.id, reportType);
    toast.success('Report generation started. You can find it in Document Control.');
    setIsGeneratingReport(false);
  };
  
  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <ProjectOverview project={project} />;
      case 'checklist':
        return <ProjectChecklist project={project} onUpdateProject={updateProject} />;
      case 'design_controls':
        return <DesignControlsPage project={project} documents={documents} isFinalized={project.status === 'Finalized'} onSave={(dcs) => updateDesignControls(project.id, dcs)} />;
      case 'audit_log':
        return <AuditLogPage activityLog={project.activityLog} />;
      case 'mock_surveys':
        return <MockSurveyListPage project={project} setNavigation={setNavigation} />;
      default:
        return <ProjectOverview project={project} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <ProjectDetailSidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="w-full lg:w-3/4 xl:w-4/5">
        <div className="space-y-6">
          <ProjectDetailHeader 
            project={project} 
            programName={program?.name || 'Unknown Program'} 
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
          onConfirm={handleFinalize}
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

export default ProjectDetailPage;