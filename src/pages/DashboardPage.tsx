import React from "react";
import { UserRole, NavigationState, Risk } from "@/types";
import { useUserStore } from "@/stores/useUserStore";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ProjectLeadDashboard from "@/components/dashboard/ProjectLeadDashboard";
import TeamMemberDashboard from "@/components/dashboard/TeamMemberDashboard";
import AuditorDashboard from "@/components/dashboard/AuditorDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
  risks?: Risk[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  setNavigation,
  risks = [],
}) => {
  const { currentUser } = useUserStore();
  const { t } = useTranslation();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    // Normalize role to handle both 'Project Lead' and 'ProjectLead' formats
    const normalizedRole = currentUser.role.replace(/\s+/g, "") as UserRole;

    switch (normalizedRole) {
      case UserRole.Admin:
        return <AdminDashboard setNavigation={setNavigation} risks={risks} />;
      case UserRole.ProjectLead:
        return <ProjectLeadDashboard setNavigation={setNavigation} />;
      case UserRole.Auditor:
        return <AuditorDashboard setNavigation={setNavigation} />;
      case UserRole.TeamMember:
        return <TeamMemberDashboard setNavigation={setNavigation} />;
      default:
        return (
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold">
              {t("welcomeBack").replace("{name}", currentUser.name)}
            </h1>
            <p>{t("dashboardNotAvailable")}</p>
          </div>
        );
    }
  };

  return <ErrorBoundary>{renderDashboard()}</ErrorBoundary>;
};

export default DashboardPage;
