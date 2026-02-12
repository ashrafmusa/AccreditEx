import React, { useState, useMemo } from "react";
import {
  User,
  Department,
  Project,
  TrainingProgram,
  UserTrainingStatus,
  Competency,
  AppDocument,
  NavigationState,
} from "../types";
import UserProfileHeader from "../components/users/UserProfileHeader";
import UserCompetencies from "../components/users/UserCompetencies";
import UserTrainingDashboard from "../components/users/UserTrainingDashboard";
import UserProjectInvolvement from "../components/users/UserProjectInvolvement";
import { useTranslation } from "../hooks/useTranslation";

interface UserProfilePageProps {
  user: User;
  currentUser: User;
  department?: Department;
  projects: Project[];
  trainingPrograms: TrainingProgram[];
  userTrainingStatus: UserTrainingStatus;
  competencies: Competency[];
  documents: AppDocument[];
  onUpdateUser: (user: User) => void;
  setNavigation: (state: NavigationState) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = (props) => {
  const { t } = useTranslation();
  const isOwnProfile = props.user.id === props.currentUser.id;

  // Calculate profile completeness dynamically
  const profileCompleteness = useMemo(() => {
    const checks = [
      {
        key: "profile",
        label: t("profileInformation"),
        value: !!(props.user.name && props.user.email && props.user.role),
      },
      {
        key: "competencies",
        label: `${t("competencies")} (${props.user.competencies?.length || 0})`,
        value: (props.user.competencies?.length || 0) > 0,
      },
      { key: "picture", label: t("profilePicture"), value: false }, // Always false for now
      {
        key: "training",
        label: `${t("trainingRecords")} (${
          Object.keys(props.userTrainingStatus).length
        })`,
        value: Object.keys(props.userTrainingStatus).length > 0,
      },
    ];

    const completed = checks.filter((c) => c.value).length;
    const percentage = Math.round((completed / checks.length) * 100);

    return { percentage, checks };
  }, [props.user, props.userTrainingStatus, t]);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <UserProfileHeader
        user={props.user}
        department={props.department}
        isOwnProfile={isOwnProfile}
        onUpdateUser={props.onUpdateUser}
        onEditClick={
          isOwnProfile
            ? () =>
                props.setNavigation({ view: "settings", section: "profile" })
            : undefined
        }
      />

      {isOwnProfile && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <span className="text-lg">📝</span>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {t("yourProfile")}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              You can edit your personal information, job title, hire date, and
              password from your Profile settings page.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Competencies (wider) */}
        <div className="lg:col-span-2">
          <UserCompetencies
            user={props.user}
            currentUser={props.currentUser}
            competencies={props.competencies}
            documents={props.documents}
            onUpdateUser={props.onUpdateUser}
          />
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          {/* Profile Completeness Card */}
          <div className="bg-gradient-to-br from-rose-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-rose-200 dark:border-pink-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("profileStatus")}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("completeness")}
                  </span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {profileCompleteness.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${profileCompleteness.percentage}%` }}
                  />
                </div>
              </div>
              <ul className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
                {profileCompleteness.checks.map((check) => (
                  <li key={check.key}>
                    {check.value ? "✓" : "◯"} {check.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-gray-200 dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Competencies
                </span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {props.user.competencies?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Training Completed
                </span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {
                    Object.values(props.userTrainingStatus).filter(
                      (s: any) => s.status === "Completed"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Projects Involved
                </span>
                <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                  {props.projects.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Training and Projects Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserTrainingDashboard
          user={props.user}
          userTrainingStatus={props.userTrainingStatus}
          trainingPrograms={props.trainingPrograms}
          setNavigation={props.setNavigation}
        />
        <UserProjectInvolvement user={props.user} projects={props.projects} />
      </div>
    </div>
  );
};

export default UserProfilePage;
