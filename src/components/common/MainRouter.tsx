import React, { useEffect, useState, Suspense, lazy } from "react";
import { NavigationState, UserRole } from "@/types";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import EmptyState from "@/components/common/EmptyState";
import LoadingScreen from "@/components/common/LoadingScreen";
import { LockClosedIcon } from "@/components/icons";

// Performance Optimization: Lazy load all page components
// This reduces the main bundle from 4.39MB to under 500KB

// Core Dashboard (high priority - load first)
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));

// Analytics and Reporting (heavy components with charts)
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const QualityInsightsPage = lazy(() => import("@/pages/QualityInsightsPage"));

// Project Management
const ProjectListPage = lazy(() => import("@/pages/ProjectListPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const CreateProjectPage = lazy(() => import("@/pages/CreateProjectPage"));

// Standards and Requirements
const StandardsPage = lazy(() => import("@/pages/StandardsPage"));
const MyTasksPage = lazy(() => import("@/pages/MyTasksPage"));

// Calendar and Events
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));

// Risk and Audit Management
const RiskHubPage = lazy(() => import("@/pages/RiskHubPage"));
const AuditHubPage = lazy(() => import("@/pages/AuditHubPage"));

// Document Management
const DocumentControlHubPage = lazy(
  () => import("@/pages/DocumentControlHubPage"),
);

// Department Management
const DepartmentsPage = lazy(() => import("@/pages/DepartmentsPage"));
const DepartmentDetailPage = lazy(() => import("@/pages/DepartmentDetailPage"));

// User Management and Settings
const SettingsLayout = lazy(
  () => import("@/components/settings/SettingsLayout"),
);
const UserProfilePage = lazy(() => import("@/pages/UserProfilePage"));

// Training and Certification
const TrainingHubPage = lazy(() => import("@/pages/TrainingHubPage"));
const TrainingDetailPage = lazy(() => import("@/pages/TrainingDetailPage"));
const CertificatePage = lazy(() => import("@/pages/CertificatePage"));

// Survey Components
const SurveyComponent = lazy(
  () => import("@/components/projects/SurveyComponent"),
);
const SurveyReportPage = lazy(() => import("@/pages/SurveyReportPage"));

// Data and Communication
const DataHubPage = lazy(() => import("@/pages/DataHubPage"));
const MessagingPage = lazy(() => import("@/pages/MessagingPage"));
const AIDocumentGeneratorPage = lazy(
  () => import("@/pages/AIDocumentGeneratorPage"),
);

// Loading component for lazy-loaded routes
const RouteLoadingFallback: React.FC = () => (
  <LoadingScreen message="Loading page..." />
);

interface MainRouterProps {
  navigation: NavigationState;
  setNavigation: (state: NavigationState) => void;
}

const MainRouter: React.FC<MainRouterProps> = ({
  navigation,
  setNavigation,
}) => {
  const [unauthorizedAttempt, setUnauthorizedAttempt] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState("");

  const { projects, updateMockSurvey, applySurveyFindingsToProject } =
    useProjectStore();
  const { users, currentUser, updateUser } = useUserStore();
  const {
    documents,
    certificates,
    trainingPrograms,
    standards,
    accreditationPrograms,
    departments,
    appSettings,
    userTrainingStatuses,
    competencies,
    risks,
    updateDocument,
    addControlledDocument,
    addProcessMap,
    deleteDocument,
    approveDocument,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addStandard,
    updateStandard,
    deleteStandard,
  } = useAppStore();

  // Role-based Access Control
  useEffect(() => {
    if (currentUser && currentUser.role !== UserRole.Admin) {
      const adminOnlyViews: NavigationState["view"][] = [
        "departments",
        "departmentDetail",
        "auditHub",
        "dataHub",
      ];

      let isUnauthorized = false;
      let message = "";

      // Allow settings for profile section for all users
      if (navigation.view === "settings") {
        const userAllowedSections = [
          "profile",
          "security",
          "appearance",
          "globe",
          "general",
          "notifications",
          "accessibility",
        ];
        const currentSection = navigation.section || "general";
        if (!userAllowedSections.includes(currentSection)) {
          isUnauthorized = true;
          message =
            "This settings section is restricted to administrators. Please access only the available settings for your role.";
        }
      } else if (adminOnlyViews.includes(navigation.view)) {
        isUnauthorized = true;
        const viewNames = {
          departments: "Department Management",
          departmentDetail: "Department Details",
          auditHub: "Audit Management",
          dataHub: "Data Management",
        };
        const viewName =
          viewNames[navigation.view as keyof typeof viewNames] || "this area";
        message = `${viewName} is restricted to administrators only. You don't have permission to access this feature.`;
      }

      if (isUnauthorized) {
        setUnauthorizedAttempt(true);
        setUnauthorizedMessage(message);
        setNavigation({ view: "dashboard" });
      } else {
        setUnauthorizedAttempt(false);
      }
    }
  }, [navigation, currentUser, setNavigation]);

  // Standalone pages (no main layout context needed beyond navigation)
  if (navigation.view === "certificate") {
    const certificate = certificates.find(
      (c) => c.id === navigation.certificateId,
    );
    if (!certificate) return <div>Certificate Not Found</div>;
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <CertificatePage certificate={certificate} />
      </Suspense>
    );
  }
  if (navigation.view === "mockSurvey") {
    const project = projects.find((p) => p.id === navigation.projectId);
    const survey = project?.mockSurveys.find(
      (s) => s.id === navigation.surveyId,
    );
    if (!project || !survey) return <div>Survey not found</div>;
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <SurveyComponent
          project={project}
          survey={survey}
          users={users}
          onUpdateSurvey={updateMockSurvey}
          setNavigation={setNavigation}
        />
      </Suspense>
    );
  }
  if (navigation.view === "surveyReport") {
    const project = projects.find((p) => p.id === navigation.projectId);
    const survey = project?.mockSurveys.find(
      (s) => s.id === navigation.surveyId,
    );
    if (!project || !survey) return <div>Report not found</div>;
    const surveyor = users.find((u) => u.id === survey.surveyorId);
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <SurveyReportPage
          project={project}
          survey={survey}
          users={users}
          surveyor={surveyor}
          onApplyFindings={applySurveyFindingsToProject}
          setNavigation={setNavigation}
        />
      </Suspense>
    );
  }

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  // Display unauthorized access attempt
  if (unauthorizedAttempt && unauthorizedMessage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md text-center animate-slideIn">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
              <LockClosedIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Your role does not have permission to access this area.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 italic">
            {unauthorizedMessage}
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase mb-1">
              ℹ️ Need Help?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              If you believe you should have access to this feature, please
              contact your administrator.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setUnauthorizedAttempt(false);
                setNavigation({ view: "dashboard" });
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content pages with lazy loading support
  const renderMainContent = () => {
    switch (navigation.view) {
      case "dashboard":
        return <DashboardPage setNavigation={setNavigation} />;
      case "analytics":
        return <AnalyticsPage setNavigation={setNavigation} />;
      case "qualityInsights":
        return (
          <QualityInsightsPage
            projects={projects}
            risks={risks}
            users={users}
            departments={departments}
            competencies={competencies}
            userTrainingStatuses={userTrainingStatuses}
          />
        );
      case "calendar":
        return <CalendarPage setNavigation={setNavigation} />;
      case "risk":
        return <RiskHubPage setNavigation={setNavigation} />;
      case "auditHub":
        return <AuditHubPage setNavigation={setNavigation} />;
      case "documentControl":
        return (
          <DocumentControlHubPage
            documents={documents}
            standards={standards}
            departments={departments}
            currentUser={currentUser}
            onUpdateDocument={updateDocument}
            onCreateDocument={addControlledDocument}
            onAddProcessMap={addProcessMap}
            onDeleteDocument={deleteDocument}
            onApproveDocument={approveDocument}
          />
        );
      case "projects":
        return <ProjectListPage setNavigation={setNavigation} />;
      case "projectDetail":
        return (
          <ProjectDetailPage
            navigation={navigation}
            setNavigation={setNavigation}
          />
        );
      case "createProject":
        return (
          <CreateProjectPage
            navigation={navigation}
            setNavigation={setNavigation}
          />
        );
      case "editProject":
        return (
          <CreateProjectPage
            navigation={navigation}
            setNavigation={setNavigation}
          />
        );
      case "standards": {
        const program = accreditationPrograms.find(
          (p) => p.id === navigation.programId,
        );
        if (!program) return <div>Program Not Found</div>;
        return (
          <StandardsPage
            program={program}
            standards={standards.filter(
              (s) => s.programId === navigation.programId,
            )}
            allStandards={standards}
            allPrograms={accreditationPrograms}
            currentUser={currentUser}
            onCreateStandard={addStandard}
            onUpdateStandard={updateStandard}
            onDeleteStandard={deleteStandard}
          />
        );
      }
      case "myTasks":
        return (
          <MyTasksPage
            projects={projects}
            currentUser={currentUser}
            programs={accreditationPrograms}
          />
        );
      case "departments":
        return (
          <DepartmentsPage
            departments={departments}
            users={users}
            projects={projects}
            currentUser={currentUser}
            setNavigation={setNavigation}
            onCreateDepartment={addDepartment}
            onUpdateDepartment={updateDepartment}
            onDeleteDepartment={deleteDepartment}
          />
        );
      case "departmentDetail": {
        const department = departments.find(
          (d) => d.id === navigation.departmentId,
        );
        if (!department) return <div>Department Not Found</div>;
        return (
          <DepartmentDetailPage
            department={department}
            users={users}
            projects={projects}
            risks={risks}
            currentUser={currentUser}
            setNavigation={setNavigation}
            onUpdateDepartment={updateDepartment}
            onDeleteDepartment={(deptId) => {
              deleteDepartment(deptId);
              setNavigation({ view: "departments" });
            }}
          />
        );
      }
      case "settings": {
        if (!appSettings) return <div>Loading settings...</div>;
        return (
          <SettingsLayout
            section={navigation.section}
            setNavigation={setNavigation}
          />
        );
      }
      case "userProfile": {
        const user = users.find((u) => u.id === navigation.userId);
        if (!user) return <div>User Not Found</div>;
        const department = departments.find((d) => d.id === user.departmentId);
        const userTrainingStatus = userTrainingStatuses[user.id] || {};
        return (
          <UserProfilePage
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
          />
        );
      }
      case "trainingHub": {
        return <TrainingHubPage setNavigation={setNavigation} />;
      }
      case "trainingDetail": {
        const trainingProgram = trainingPrograms.find(
          (p) => p.id === navigation.trainingId,
        );
        if (!trainingProgram) return <div>Training not found</div>;
        return (
          <TrainingDetailPage
            trainingProgram={trainingProgram}
            setNavigation={setNavigation}
          />
        );
      }
      case "dataHub":
        return <DataHubPage />;
      case "messaging":
        return <MessagingPage setNavigation={setNavigation} />;
      case "aiDocumentGenerator":
        return <AIDocumentGeneratorPage />;
      default:
        return <DashboardPage setNavigation={setNavigation} />;
    }
  };

  // Wrap main content with Suspense for lazy-loaded components
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {renderMainContent()}
    </Suspense>
  );
};

export default MainRouter;
