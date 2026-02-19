import React, { useState, lazy, Suspense } from "react";
import { NavigationState, UserRole } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
import MyTrainingTab from "../components/training/MyTrainingTab";
import TrainingAdminTab from "../components/training/TrainingAdminTab";
import { AcademicCapIcon, SparklesIcon } from "../components/icons";
import { Button } from "@/components/ui";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import LoadingScreen from "@/components/common/LoadingScreen";

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

type TrainingHubTab =
  | "myTraining"
  | "admin"
  | "evaluations"
  | "competencies"
  | "skillMatrix"
  | "licenses"
  | "personnelFiles"
  | "capAssessment"
  | "ceCredits"
  | "learningPaths";

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
  const [activeTab, setActiveTab] = useState<TrainingHubTab>("myTraining");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");

  const isAdmin = currentUser?.role === UserRole.Admin;

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const programCount = trainingPrograms.length;
      const activePrograms = trainingPrograms.filter(
        (p) => p.status === "active",
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
      setAiModalTitle("AI Training & Performance Analysis");
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
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 dark:text-purple-400 dark:border-purple-800"
        >
          <SparklesIcon className="h-4 w-4" />
          {aiLoading ? t("loading") + "..." : "AI Analyze"}
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-brand-border">
        <nav
          className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto"
          aria-label="Tabs"
        >
          <Button
            onClick={() => setActiveTab("myTraining")}
            variant={activeTab === "myTraining" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            {t("myTraining")}
          </Button>
          {isAdmin && (
            <Button
              onClick={() => setActiveTab("admin")}
              variant={activeTab === "admin" ? "primary" : "ghost"}
              className="rounded-t-lg border-b-2 whitespace-nowrap"
            >
              {t("trainingAdministration")}
            </Button>
          )}
          <Button
            onClick={() => setActiveTab("evaluations")}
            variant={activeTab === "evaluations" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            {t("performanceEvaluations")}
          </Button>
          <Button
            onClick={() => setActiveTab("competencies")}
            variant={activeTab === "competencies" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            {t("competencies")}
          </Button>
          <Button
            onClick={() => setActiveTab("skillMatrix")}
            variant={activeTab === "skillMatrix" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            Skill Matrix
          </Button>
          <Button
            onClick={() => setActiveTab("licenses")}
            variant={activeTab === "licenses" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            Licenses
          </Button>
          <Button
            onClick={() => setActiveTab("personnelFiles")}
            variant={activeTab === "personnelFiles" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            Personnel Files
          </Button>
          <Button
            onClick={() => setActiveTab("capAssessment")}
            variant={activeTab === "capAssessment" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            CAP Assessment
          </Button>
          <Button
            onClick={() => setActiveTab("ceCredits")}
            variant={activeTab === "ceCredits" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            CE Credits
          </Button>
          <Button
            onClick={() => setActiveTab("learningPaths")}
            variant={activeTab === "learningPaths" ? "primary" : "ghost"}
            className="rounded-t-lg border-b-2 whitespace-nowrap"
          >
            Learning Paths
          </Button>
        </nav>
      </div>

      <div>
        {activeTab === "myTraining" && (
          <MyTrainingTab
            trainingPrograms={trainingPrograms}
            userTrainingStatus={userTrainingStatuses[currentUser!.id] || {}}
            currentUser={currentUser!}
            setNavigation={setNavigation}
          />
        )}
        {isAdmin && activeTab === "admin" && (
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
        {activeTab === "evaluations" && (
          <Suspense fallback={<LoadingScreen />}>
            <PerformanceEvaluationPage setNavigation={setNavigation} />
          </Suspense>
        )}
        {activeTab === "competencies" && (
          <Suspense fallback={<LoadingScreen />}>
            <CompetencyLibraryPage />
          </Suspense>
        )}
        {activeTab === "skillMatrix" && (
          <Suspense fallback={<LoadingScreen />}>
            <SkillMatrixTab />
          </Suspense>
        )}
        {activeTab === "licenses" && (
          <Suspense fallback={<LoadingScreen />}>
            <LicensureTrackingTab />
          </Suspense>
        )}
        {activeTab === "personnelFiles" && (
          <Suspense fallback={<LoadingScreen />}>
            <PersonnelFilesTab />
          </Suspense>
        )}
        {activeTab === "capAssessment" && (
          <Suspense fallback={<LoadingScreen />}>
            <CAPAssessmentTab />
          </Suspense>
        )}
        {activeTab === "ceCredits" && (
          <Suspense fallback={<LoadingScreen />}>
            <CECreditsTab />
          </Suspense>
        )}
        {activeTab === "learningPaths" && (
          <Suspense fallback={<LoadingScreen />}>
            <LearningPathsTab />
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
