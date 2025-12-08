import React from 'react';
import { UserRole, NavigationState } from '@/types';
import { useUserStore } from '@/stores/useUserStore';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import ProjectLeadDashboard from '@/components/dashboard/ProjectLeadDashboard';
import TeamMemberDashboard from '@/components/dashboard/TeamMemberDashboard';
import AuditorDashboard from '@/components/dashboard/AuditorDashboard';
import { useTranslation } from '@/hooks/useTranslation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ setNavigation }) => {
  const { currentUser } = useUserStore();
  const { t } = useTranslation();

  if (!currentUser) {
    return null; // or a loading indicator
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case UserRole.Admin:
        return <AdminDashboard setNavigation={setNavigation} />;
      case UserRole.ProjectLead:
        return <ProjectLeadDashboard setNavigation={setNavigation} />;
      case UserRole.Auditor:
        return <AuditorDashboard setNavigation={setNavigation} />;
      case UserRole.TeamMember:
        return <TeamMemberDashboard setNavigation={setNavigation} />;
      default:
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold">{t('welcomeBack').replace('{name}', currentUser.name)}</h1>
                <p>{t('dashboardNotAvailable')}</p>
            </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      {renderDashboard()}
    </ErrorBoundary>
  );
};

export default DashboardPage;
