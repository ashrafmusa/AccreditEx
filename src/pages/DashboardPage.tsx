import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import AuditorDashboard from "@/components/dashboard/AuditorDashboard";
import MyTasksWidget from "@/components/dashboard/MyTasksWidget";
import ProjectLeadDashboard from "@/components/dashboard/ProjectLeadDashboard";
import TeamMemberDashboard from "@/components/dashboard/TeamMemberDashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState, Risk, UserRole } from "@/types";
import { normalizeUserRole } from "@/utils/roleAccess";
import React from "react";

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
  risks?: Risk[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  setNavigation,
  risks = [],
}) => {
  const { currentUser } = useUserStore();
  const { projects } = useProjectStore();
  const { accreditationPrograms } = useAppStore();
  const { t } = useTranslation();
  const normalizedRole = currentUser
    ? (normalizeUserRole(currentUser.role) as UserRole)
    : null;

  const discoverabilityActions = React.useMemo(() => {
    if (!normalizedRole)
      return [] as Array<{
        label: string;
        navigation: NavigationState;
      }>;

    switch (normalizedRole) {
      case UserRole.TeamMember:
        return [
          {
            label: t("myTasks") || "My Tasks",
            navigation: { view: "myTasks" },
          },
          {
            label: t("standards") || "Standards",
            navigation: { view: "standards" },
          },
          { label: t("reports") || "Reports", navigation: { view: "reports" } },
        ];
      case UserRole.Auditor:
        return [
          {
            label: t("auditPlans") || "Audit Plans",
            navigation: { view: "audits" },
          },
          {
            label: t("compliance") || "Compliance",
            navigation: { view: "compliance" },
          },
          { label: t("reports") || "Reports", navigation: { view: "reports" } },
        ];
      case UserRole.Viewer:
        return [
          {
            label: t("dashboard") || "Dashboard",
            navigation: { view: "dashboard" },
          },
          {
            label: t("projects") || "Projects",
            navigation: { view: "projects" },
          },
          { label: t("reports") || "Reports", navigation: { view: "reports" } },
        ];
      default:
        return [];
    }
  }, [normalizedRole, t]);

  React.useEffect(() => {
    if (discoverabilityActions.length === 0) return;

    const handleQuickNavigationKeys = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const keyNumber = Number(e.key);
      if (Number.isNaN(keyNumber) || keyNumber < 7) return;

      const action = discoverabilityActions[keyNumber - 7];
      if (!action) return;

      e.preventDefault();
      setNavigation(action.navigation);
    };

    window.addEventListener("keydown", handleQuickNavigationKeys);
    return () =>
      window.removeEventListener("keydown", handleQuickNavigationKeys);
  }, [discoverabilityActions, setNavigation]);

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
    const userRole = normalizeUserRole(currentUser.role) as UserRole;

    switch (userRole) {
      case UserRole.Admin:
        return <AdminDashboard setNavigation={setNavigation} risks={risks} />;
      case UserRole.ProjectLead:
        return <ProjectLeadDashboard setNavigation={setNavigation} />;
      case UserRole.Auditor:
        return <AuditorDashboard setNavigation={setNavigation} />;
      case UserRole.TeamMember:
        return <TeamMemberDashboard setNavigation={setNavigation} />;
      case UserRole.Viewer:
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t("dashboard")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("welcomeBack").replace("{name}", currentUser.name)}
            </p>
          </div>
        );
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

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {renderDashboard()}
        {discoverabilityActions.length > 0 && (
          <section
            aria-label={t("quickNavigation") || "Quick navigation"}
            className="rounded-xl border border-brand-border dark:border-dark-brand-border bg-brand-surface/70 dark:bg-dark-brand-surface/60 p-4"
          >
            <h2 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t("quickNavigation") || "Quick navigation"}
            </h2>
            <p className="mt-1 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("quickNavigationHint") ||
                "Use Alt+7, Alt+8, and Alt+9 to jump directly to key work areas."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {discoverabilityActions.map((action, index) => (
                <button
                  key={action.label}
                  type="button"
                  aria-label={action.label}
                  aria-keyshortcuts={`Alt+${index + 7}`}
                  onClick={() => setNavigation(action.navigation)}
                  className="rounded-full border border-brand-border dark:border-dark-brand-border px-3 py-1.5 text-xs font-semibold text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        )}
        <MyTasksWidget
          projects={projects}
          currentUser={currentUser}
          programs={accreditationPrograms}
        />
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
