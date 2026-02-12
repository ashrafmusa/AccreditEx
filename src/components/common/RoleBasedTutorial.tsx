import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import InteractiveTutorial, { TutorialStep } from "./InteractiveTutorial";

interface RoleBasedTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const RoleBasedTutorial: React.FC<RoleBasedTutorialProps> = ({
  onComplete,
  onSkip,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Show tutorial only once per user
    const hasCompletedTutorial = localStorage.getItem(
      `tutorial-completed-${currentUser?.id}`,
    );

    if (!hasCompletedTutorial && currentUser) {
      // Delay showing tutorial to allow page to render
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleTutorialComplete = () => {
    if (currentUser) {
      localStorage.setItem(`tutorial-completed-${currentUser.id}`, "true");
    }
    setShowTutorial(false);
    onComplete();
  };

  const handleTutorialSkip = () => {
    if (currentUser) {
      localStorage.setItem(`tutorial-completed-${currentUser.id}`, "true");
    }
    setShowTutorial(false);
    if (onSkip) {
      onSkip();
    }
  };

  const getTutorialSteps = (): TutorialStep[] => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case "Admin":
        return [
          {
            id: "dashboard",
            titleKey: "tutorialAdminDashboardTitle",
            descriptionKey: "tutorialAdminDashboardDesc",
            targetSelector: ".dashboard-container",
            highlight: true,
            placement: "bottom",
          },
          {
            id: "projects",
            titleKey: "tutorialAdminProjectsTitle",
            descriptionKey: "tutorialAdminProjectsDesc",
            targetSelector: "[data-nav='projects']",
            highlight: true,
            placement: "right",
          },
          {
            id: "users",
            titleKey: "tutorialAdminUsersTitle",
            descriptionKey: "tutorialAdminUsersDesc",
            targetSelector: "[data-nav='users']",
            highlight: true,
            placement: "right",
          },
          {
            id: "settings",
            titleKey: "tutorialAdminSettingsTitle",
            descriptionKey: "tutorialAdminSettingsDesc",
            targetSelector: "[data-nav='settings']",
            highlight: true,
            placement: "right",
          },
        ];

      case "ProjectLead":
        return [
          {
            id: "myProjects",
            titleKey: "tutorialLeadProjectsTitle",
            descriptionKey: "tutorialLeadProjectsDesc",
            targetSelector: "[data-nav='projects']",
            highlight: true,
            placement: "right",
          },
          {
            id: "tasks",
            titleKey: "tutorialLeadTasksTitle",
            descriptionKey: "tutorialLeadTasksDesc",
            targetSelector: "[data-nav='myTasks']",
            highlight: true,
            placement: "right",
          },
          {
            id: "team",
            titleKey: "tutorialLeadTeamTitle",
            descriptionKey: "tutorialLeadTeamDesc",
            targetSelector: "[data-nav='departments']",
            highlight: true,
            placement: "right",
          },
          {
            id: "analytics",
            titleKey: "tutorialLeadAnalyticsTitle",
            descriptionKey: "tutorialLeadAnalyticsDesc",
            targetSelector: "[data-nav='analytics']",
            highlight: true,
            placement: "right",
          },
        ];

      case "Auditor":
        return [
          {
            id: "auditHub",
            titleKey: "tutorialAuditorAuditsTitle",
            descriptionKey: "tutorialAuditorAuditsDesc",
            targetSelector: "[data-nav='auditHub']",
            highlight: true,
            placement: "right",
          },
          {
            id: "standards",
            titleKey: "tutorialAuditorStandardsTitle",
            descriptionKey: "tutorialAuditorStandardsDesc",
            targetSelector: "[data-nav='standards']",
            highlight: true,
            placement: "right",
          },
          {
            id: "reports",
            titleKey: "tutorialAuditorReportsTitle",
            descriptionKey: "tutorialAuditorReportsDesc",
            targetSelector: "[data-nav='reports']",
            highlight: true,
            placement: "right",
          },
          {
            id: "compliance",
            titleKey: "tutorialAuditorComplianceTitle",
            descriptionKey: "tutorialAuditorComplianceDesc",
            targetSelector: "[data-nav='qualityInsights']",
            highlight: true,
            placement: "right",
          },
        ];

      case "TeamMember":
        return [
          {
            id: "myTasks",
            titleKey: "tutorialMemberTasksTitle",
            descriptionKey: "tutorialMemberTasksDesc",
            targetSelector: "[data-nav='myTasks']",
            highlight: true,
            placement: "right",
          },
          {
            id: "training",
            titleKey: "tutorialMemberTrainingTitle",
            descriptionKey: "tutorialMemberTrainingDesc",
            targetSelector: "[data-nav='trainingHub']",
            highlight: true,
            placement: "right",
          },
          {
            id: "documents",
            titleKey: "tutorialMemberDocumentsTitle",
            descriptionKey: "tutorialMemberDocumentsDesc",
            targetSelector: "[data-nav='documentControl']",
            highlight: true,
            placement: "right",
          },
          {
            id: "profile",
            titleKey: "tutorialMemberProfileTitle",
            descriptionKey: "tutorialMemberProfileDesc",
            targetSelector: "[data-nav='userProfile']",
            highlight: true,
            placement: "right",
          },
        ];

      default:
        return [
          {
            id: "welcome",
            titleKey: "tutorialWelcomeTitle",
            descriptionKey: "tutorialWelcomeDesc",
          },
          {
            id: "navigate",
            titleKey: "tutorialNavigateTitle",
            descriptionKey: "tutorialNavigateDesc",
            targetSelector: ".sidebar-container",
            highlight: true,
            placement: "right",
          },
          {
            id: "search",
            titleKey: "tutorialSearchTitle",
            descriptionKey: "tutorialSearchDesc",
            targetSelector: "[data-search]",
            highlight: true,
            placement: "bottom",
          },
        ];
    }
  };

  if (!showTutorial) return null;

  return (
    <InteractiveTutorial
      steps={getTutorialSteps()}
      onComplete={handleTutorialComplete}
      onSkip={handleTutorialSkip}
      enabled={showTutorial}
    />
  );
};

export default RoleBasedTutorial;
