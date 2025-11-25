import React, { useEffect } from 'react';
import { NavigationState, UserRole } from '@/types';
import DashboardPage from '@/pages/DashboardPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import QualityInsightsPage from '@/pages/QualityInsightsPage';
// FIX: Corrected import path for CalendarPage
import CalendarPage from '@/pages/CalendarPage';
import RiskHubPage from '@/pages/RiskHubPage';
import AuditHubPage from '@/pages/AuditHubPage';
import DocumentControlHubPage from '@/pages/DocumentControlHubPage';
import ProjectListPage from '@/pages/ProjectListPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import CreateProjectPage from '@/pages/CreateProjectPage';
import StandardsPage from '@/pages/StandardsPage';
import MyTasksPage from '@/pages/MyTasksPage';
import DepartmentsPage from '@/pages/DepartmentsPage';
import DepartmentDetailPage from '@/pages/DepartmentDetailPage';
import SettingsLayout from '@/components/settings/SettingsLayout';
import UserProfilePage from '@/pages/UserProfilePage';
import TrainingHubPage from '@/pages/TrainingHubPage';
import TrainingDetailPage from '@/pages/TrainingDetailPage';
import CertificatePage from '@/pages/CertificatePage';
import MockSurveyPage from '@/pages/MockSurveyPage';
import SurveyReportPage from '@/pages/SurveyReportPage';
import DataHubPage from '@/pages/DataHubPage';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';

interface MainRouterProps {
    navigation: NavigationState;
    setNavigation: (state: NavigationState) => void;
}

const MainRouter: React.FC<MainRouterProps> = ({ navigation, setNavigation }) => {
    const { projects, updateMockSurvey, applySurveyFindingsToProject } = useProjectStore();
    const { users, currentUser, updateUser } = useUserStore();
    const { 
        documents, certificates, trainingPrograms, standards,
        accreditationPrograms, departments, appSettings,
        userTrainingStatuses, competencies, risks,
        updateDocument, addControlledDocument, addProcessMap, 
        deleteDocument, approveDocument, addDepartment, updateDepartment,
        deleteDepartment, addStandard, updateStandard, deleteStandard
    } = useAppStore();

    // Role-based Access Control
    useEffect(() => {
        if (currentUser && currentUser.role !== UserRole.Admin) {
            const adminOnlyViews: (NavigationState['view'])[] = ['settings', 'departments', 'departmentDetail', 'auditHub', 'dataHub'];
            if (adminOnlyViews.includes(navigation.view)) {
                // Redirect non-admins from admin pages to the dashboard
                setNavigation({ view: 'dashboard' });
            }
        }
    }, [navigation, currentUser, setNavigation]);

    // Standalone pages (no main layout context needed beyond navigation)
    if (navigation.view === 'certificate') {
        const certificate = certificates.find(c => c.id === navigation.certificateId);
        if (!certificate) return <div>Certificate Not Found</div>;
        return <CertificatePage certificate={certificate} />;
    }
    if (navigation.view === 'mockSurvey') {
        const project = projects.find(p => p.id === navigation.projectId);
        const survey = project?.mockSurveys.find(s => s.id === navigation.surveyId);
        if (!project || !survey) return <div>Survey not found</div>;
        return <MockSurveyPage 
            project={project} 
            survey={survey} 
            users={users} 
            onUpdateSurvey={updateMockSurvey} 
            setNavigation={setNavigation} 
        />;
    }
    if (navigation.view === 'surveyReport') {
        const project = projects.find(p => p.id === navigation.projectId);
        const survey = project?.mockSurveys.find(s => s.id === navigation.surveyId);
        if (!project || !survey) return <div>Report not found</div>;
        const surveyor = users.find(u => u.id === survey.surveyorId);
        return <SurveyReportPage
            project={project}
            survey={survey}
            users={users}
            surveyor={surveyor}
            onApplyFindings={applySurveyFindingsToProject}
            setNavigation={setNavigation}
        />;
    }

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    // Main content pages
    switch (navigation.view) {
      case 'dashboard':
        return <DashboardPage setNavigation={setNavigation} />;
      case 'analytics':
        return <AnalyticsPage setNavigation={setNavigation} />;
      case 'qualityInsights':
        return <QualityInsightsPage projects={projects} risks={risks} users={users} departments={departments} competencies={competencies} userTrainingStatuses={userTrainingStatuses} />;
      case 'calendar':
        return <CalendarPage setNavigation={setNavigation} />;
      case 'risk':
        return <RiskHubPage setNavigation={setNavigation} />;
      case 'auditHub':
        return <AuditHubPage setNavigation={setNavigation} />;
      case 'documentControl':
        return <DocumentControlHubPage documents={documents} standards={standards} currentUser={currentUser} onUpdateDocument={updateDocument} onCreateDocument={addControlledDocument} onAddProcessMap={addProcessMap} onDeleteDocument={deleteDocument} onApproveDocument={approveDocument} />;
      case 'projects':
        return <ProjectListPage setNavigation={setNavigation} />;
      case 'projectDetail':
        return <ProjectDetailPage navigation={navigation} setNavigation={setNavigation} />;
      case 'createProject':
        return <CreateProjectPage navigation={navigation} setNavigation={setNavigation} />;
      case 'editProject':
        return <CreateProjectPage navigation={navigation} setNavigation={setNavigation} />;
      case 'standards': {
        const program = accreditationPrograms.find(p => p.id === navigation.programId);
        if (!program) return <div>Program Not Found</div>;
        return <StandardsPage 
            program={program} 
            standards={standards.filter(s => s.programId === navigation.programId)} 
            currentUser={currentUser} 
            onCreateStandard={addStandard}
            onUpdateStandard={updateStandard}
            onDeleteStandard={deleteStandard}
        />;
      }
      case 'myTasks':
        return <MyTasksPage projects={projects} currentUser={currentUser} programs={accreditationPrograms} />;
      case 'departments':
        return <DepartmentsPage departments={departments} users={users} projects={projects} currentUser={currentUser} setNavigation={setNavigation} onCreateDepartment={addDepartment} onUpdateDepartment={updateDepartment} onDeleteDepartment={deleteDepartment} />;
      case 'departmentDetail': {
        const department = departments.find(d => d.id === navigation.departmentId);
        if (!department) return <div>Department Not Found</div>;
        return <DepartmentDetailPage 
            department={department}
            users={users}
            projects={projects}
            currentUser={currentUser}
            setNavigation={setNavigation}
            onUpdateDepartment={updateDepartment}
            onDeleteDepartment={(deptId) => {
                deleteDepartment(deptId);
                setNavigation({ view: 'departments' });
            }}
        />;
      }
      case 'settings': {
        if (!appSettings) return <div>Loading settings...</div>;
        return <SettingsLayout 
            section={navigation.section} 
            setNavigation={setNavigation}
        />;
      }
      case 'userProfile': {
        const user = users.find(u => u.id === navigation.userId);
        if (!user) return <div>User Not Found</div>;
        const department = departments.find(d => d.id === user.departmentId);
        const userTrainingStatus = userTrainingStatuses[user.id] || {};
        return <UserProfilePage 
            user={user}
            currentUser={currentUser}
            department={department}
            projects={projects}
            trainingPrograms={trainingPrograms}
            userTrainingStatus={userTrainingStatus}
            competencies={competencies}
            documents={documents}
            onUpdateUser={updateUser}
            setNavigation={setNavigation}
        />;
      }
      case 'trainingHub': {
        return <TrainingHubPage setNavigation={setNavigation} />;
      }
      case 'trainingDetail': {
        const trainingProgram = trainingPrograms.find(p => p.id === navigation.trainingId);
        if (!trainingProgram) return <div>Training not found</div>;
        return <TrainingDetailPage 
            trainingProgram={trainingProgram}
            setNavigation={setNavigation}
        />;
      }
      case 'dataHub':
        return <DataHubPage />;
      default:
        return <DashboardPage setNavigation={setNavigation} />;
    }
};

export default MainRouter;