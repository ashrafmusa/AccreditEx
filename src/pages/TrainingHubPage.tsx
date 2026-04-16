import AISuggestionModal from "@/components/ai/AISuggestionModal";
import LoadingScreen from "@/components/common/LoadingScreen";
import { Button } from "@/components/ui";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { aiAgentService } from "@/services/aiAgentService";
import React, { lazy, Suspense, useState } from "react";
import { AcademicCapIcon, SparklesIcon } from "../components/icons";
import MyTrainingTab from "../components/training/MyTrainingTab";
import TrainingAdminTab from "../components/training/TrainingAdminTab";
import { useTranslation } from "../hooks/useTranslation";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
import { NavigationState } from "../types";

const PerformanceEvaluationPage = lazy(
  () => import("@/pages/PerformanceEvaluationPage"),
);
const CompetencyLibraryPage = lazy(
  () => import("@/components/competencies/CompetencyLibraryPage"),
);
const SkillMatrixTab = lazy(
  () => import("@/components/training/SkillMatrixTab"),
);
const LicensureTrackingTab = lazy(
  () => import("@/components/training/LicensureTrackingTab"),
);
const PersonnelFilesTab = lazy(
  () => import("@/components/training/PersonnelFilesTab"),
);
const CAPAssessmentTab = lazy(
  () => import("@/components/training/CAPAssessmentTab"),
);
const CECreditsTab = lazy(() => import("@/components/training/CECreditsTab"));
const LearningPathsTab = lazy(
  () => import("@/components/training/LearningPathsTab"),
);

type TrainingHubTab = "overview" | "competency" | "learning" | "personnel";

type SubTab = {
  overview: "myTraining" | "admin";
  competency: "competencies" | "evaluations" | "capAssessment";
  learning: "learningPaths" | "ceCredits";
  personnel: "personnelFiles" | "licenses" | "skillMatrix";
};

interface TrainingHubPageProps {
  setNavigation: (state: NavigationState) => void;
}

const TrainingHubPage: React.FC<TrainingHubPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { currentUser, users } = useUserStore();
  const {
    trainingPrograms,
    userTrainingStatuses,
    departments,
    addTrainingProgram,
    updateTrainingProgram,
    deleteTrainingProgram,
    assignTraining,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<TrainingHubTab>("overview");
  const [overviewSubTab, setOverviewSubTab] =
    useState<SubTab["overview"]>("myTraining");
  const [competencySubTab, setCompetencySubTab] =
    useState<SubTab["competency"]>("competencies");
  const [learningSubTab, setLearningSubTab] =
    useState<SubTab["learning"]>("learningPaths");
  const [personnelSubTab, setPersonnelSubTab] =
    useState<SubTab["personnel"]>("personnelFiles");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");

  // Permission check: only users who can create/assign training see the admin tab
  const { can } = usePermission();
  const canAdminTraining =
    can(Action.Create, Resource.Training) ||
    can(Action.Assign, Resource.Training);

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const programCount = trainingPrograms.length;
      const activePrograms = trainingPrograms.filter(
        (p) => p.isActive === true,
      ).length;
      const deptCount = departments.length;

      const prompt = `You are a healthcare accreditation training & performance specialist. Analyze the following training hub data and provide actionable insights:

**Training Programs:** ${programCount} total (${activePrograms} active)
**Departments:** ${deptCount}
**Users:** ${users.length}

Provide a structured analysis with:
1. **Training Gaps** — Areas where training coverage appears insufficient
2. **Performance Correlation** — How training completion relates to expected competency improvements
3. **Recommendations** — Specific actions to improve training effectiveness and staff development
4. **Compliance Risks** — Training-related compliance risks for healthcare accreditation
5. **Priority Actions** — Top 3 immediate actions to take

Format your response in clear Markdown with headers and bullet points.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalTitle(t("aiTrainingAnalysis"));
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <AcademicCapIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("trainingHubTitle")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("trainingPageDescription")}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAIAnalyze}
          variant="ghost"
          disabled={aiLoading}
          className="flex items-center gap-2 text-brand-primary hover:text-brand-primary border border-brand-primary/40 hover:border-brand-primary/40 dark:text-brand-primary dark:border-brand-primary/40"
        >
          <SparklesIcon className="h-4 w-4" />
          {aiLoading ? t("loading") + "..." : t("aiAnalyze")}
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-brand-border">
        {/* Main Tabs */}
        <nav
          className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto"
          aria-label="Tabs"
        >
          <Button
            onClick={() => setActiveTab("overview")}
            variant={activeTab === "overview" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap px-6 py-3"
          >
            {t("overviewAndPrograms")}
          </Button>
          <Button
            onClick={() => setActiveTab("competency")}
            variant={activeTab === "competency" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap px-6 py-3"
          >
            {t("competencyAndAssessments")}
          </Button>
          <Button
            onClick={() => setActiveTab("learning")}
            variant={activeTab === "learning" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap px-6 py-3"
          >
            {t("learningAndCE")}
          </Button>
          <Button
            onClick={() => setActiveTab("personnel")}
            variant={activeTab === "personnel" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap px-6 py-3"
          >
            {t("personnelAndLicensure")}
          </Button>
        </nav>

        {/* Sub-tabs */}
        {activeTab === "overview" && (
          <nav className="flex space-x-2 rtl:space-x-reverse mt-2 px-4 pb-2">
            <Button
              onClick={() => setOverviewSubTab("myTraining")}
              variant={overviewSubTab === "myTraining" ? "secondary" : "ghost"}
              size="sm"
            >
              {t("myTraining")}
            </Button>
            {canAdminTraining && (
              <Button
                onClick={() => setOverviewSubTab("admin")}
                variant={overviewSubTab === "admin" ? "secondary" : "ghost"}
                size="sm"
              >
                {t("trainingAdministration")}
              </Button>
            )}
          </nav>
        )}

        {activeTab === "competency" && (
          <nav className="flex space-x-2 rtl:space-x-reverse mt-2 px-4 pb-2">
            <Button
              onClick={() => setCompetencySubTab("competencies")}
              variant={
                competencySubTab === "competencies" ? "secondary" : "ghost"
              }
              size="sm"
            >
              {t("competencies")}
            </Button>
            <Button
              onClick={() => setCompetencySubTab("evaluations")}
              variant={
                competencySubTab === "evaluations" ? "secondary" : "ghost"
              }
              size="sm"
            >
              {t("performanceEvaluations")}
            </Button>
            <Button
              onClick={() => setCompetencySubTab("capAssessment")}
              variant={
                competencySubTab === "capAssessment" ? "secondary" : "ghost"
              }
              size="sm"
            >
              {t("capAssessment")}
            </Button>
          </nav>
        )}

        {activeTab === "learning" && (
          <nav className="flex space-x-2 rtl:space-x-reverse mt-2 px-4 pb-2">
            <Button
              onClick={() => setLearningSubTab("learningPaths")}
              variant={
                learningSubTab === "learningPaths" ? "secondary" : "ghost"
              }
              size="sm"
            >
              {t("learningPaths")}
            </Button>
            <Button
              onClick={() => setLearningSubTab("ceCredits")}
              variant={learningSubTab === "ceCredits" ? "secondary" : "ghost"}
              size="sm"
            >
              {t("ceCredits")}
            </Button>
          </nav>
        )}

        {activeTab === "personnel" && (
          <nav className="flex space-x-2 rtl:space-x-reverse mt-2 px-4 pb-2">
            <Button
              onClick={() => setPersonnelSubTab("personnelFiles")}
              variant={
                personnelSubTab === "personnelFiles" ? "secondary" : "ghost"
              }
              size="sm"
            >
              {t("personnelFiles")}
            </Button>
            <Button
              onClick={() => setPersonnelSubTab("licenses")}
              variant={personnelSubTab === "licenses" ? "secondary" : "ghost"}
              size="sm"
            >
              {t("licenses")}
            </Button>
            <Button
              onClick={() => setPersonnelSubTab("skillMatrix")}
              variant={
                personnelSubTab === "skillMatrix" ? "secondary" : "ghost"
              }
              size="sm"
            >
              {t("skillMatrix")}
            </Button>
          </nav>
        )}
      </div>

      <div>
        {activeTab === "overview" && overviewSubTab === "myTraining" && (
          <MyTrainingTab
            trainingPrograms={trainingPrograms}
            userTrainingStatus={userTrainingStatuses[currentUser!.id] || {}}
            currentUser={currentUser!}
            setNavigation={setNavigation}
          />
        )}
        {activeTab === "overview" &&
          canAdminTraining &&
          overviewSubTab === "admin" && (
            <TrainingAdminTab
              trainingPrograms={trainingPrograms}
              users={users}
              departments={departments}
              onAssign={assignTraining}
              onCreate={addTrainingProgram}
              onUpdate={updateTrainingProgram}
              onDelete={deleteTrainingProgram}
            />
          )}
        {activeTab === "competency" && competencySubTab === "competencies" && (
          <Suspense fallback={<LoadingScreen />}>
            <CompetencyLibraryPage />
          </Suspense>
        )}
        {activeTab === "competency" && competencySubTab === "evaluations" && (
          <Suspense fallback={<LoadingScreen />}>
            <PerformanceEvaluationPage setNavigation={setNavigation} />
          </Suspense>
        )}
        {activeTab === "competency" && competencySubTab === "capAssessment" && (
          <Suspense fallback={<LoadingScreen />}>
            <CAPAssessmentTab />
          </Suspense>
        )}
        {activeTab === "learning" && learningSubTab === "learningPaths" && (
          <Suspense fallback={<LoadingScreen />}>
            <LearningPathsTab />
          </Suspense>
        )}
        {activeTab === "learning" && learningSubTab === "ceCredits" && (
          <Suspense fallback={<LoadingScreen />}>
            <CECreditsTab />
          </Suspense>
        )}
        {activeTab === "personnel" && personnelSubTab === "personnelFiles" && (
          <Suspense fallback={<LoadingScreen />}>
            <PersonnelFilesTab />
          </Suspense>
        )}
        {activeTab === "personnel" && personnelSubTab === "licenses" && (
          <Suspense fallback={<LoadingScreen />}>
            <LicensureTrackingTab />
          </Suspense>
        )}
        {activeTab === "personnel" && personnelSubTab === "skillMatrix" && (
          <Suspense fallback={<LoadingScreen />}>
            <SkillMatrixTab />
          </Suspense>
        )}
      </div>

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        content={aiModalContent}
        type="improvements"
      />
    </div>
  );
};

export default TrainingHubPage;
