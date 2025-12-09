import React, { useState } from "react";
import { NavigationState, UserRole } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
import MyTrainingTab from "../components/training/MyTrainingTab";
import TrainingAdminTab from "../components/training/TrainingAdminTab";
import { AcademicCapIcon } from "../components/icons";
import { Button } from "@/components/ui";

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
  const [activeTab, setActiveTab] = useState("myTraining");

  const isAdmin = currentUser?.role === UserRole.Admin;

  return (
    <div className="space-y-6">
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

      {isAdmin && (
        <div className="border-b border-gray-200 dark:border-dark-brand-border">
          <nav
            className="-mb-px flex space-x-4 rtl:space-x-reverse"
            aria-label="Tabs"
          >
            <Button
              onClick={() => setActiveTab("myTraining")}
              variant={activeTab === "myTraining" ? "primary" : "ghost"}
              className="rounded-t-lg border-b-2"
            >
              {t("myTraining")}
            </Button>
            <Button
              onClick={() => setActiveTab("admin")}
              variant={activeTab === "admin" ? "primary" : "ghost"}
              className="rounded-t-lg border-b-2"
            >
              {t("trainingAdministration")}
            </Button>
          </nav>
        </div>
      )}

      <div>
        {(!isAdmin || activeTab === "myTraining") && (
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
      </div>
    </div>
  );
};

export default TrainingHubPage;
