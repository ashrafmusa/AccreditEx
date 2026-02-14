import React, { useMemo } from "react";
import {
  UserTrainingStatus,
  TrainingProgram,
  NavigationState,
  User,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { EmptyState } from "@/components/ui";
import { AcademicCapIcon } from "../icons";

interface Props {
  user: User;
  userTrainingStatus: UserTrainingStatus;
  trainingPrograms: TrainingProgram[];
  setNavigation: (state: NavigationState) => void;
}

const UserTrainingDashboard: React.FC<Props> = ({
  user,
  userTrainingStatus,
  trainingPrograms,
  setNavigation,
}) => {
  const { t, lang } = useTranslation();

  const { pending, completed, completionRate, overdueCount } = useMemo(() => {
    const assigned = user.trainingAssignments || [];
    const now = new Date();

    const pending = assigned
      .filter((a) => userTrainingStatus[a.trainingId]?.status !== "Completed")
      .map((a) => ({
        assignment: a,
        program: trainingPrograms.find((p) => p.id === a.trainingId),
      }))
      .filter((item) => item.program);

    const overdue = pending.filter(
      (p) => p.assignment.dueDate && new Date(p.assignment.dueDate) < now,
    );

    const completed = Object.entries(userTrainingStatus)
      .filter(([, status]) => (status as any).status === "Completed")
      .map(([trainingId, status]) => ({
        status,
        program: trainingPrograms.find((p) => p.id === trainingId),
      }))
      .filter((item) => item.program);

    const total = pending.length + completed.length;
    const completionRate =
      total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return { pending, completed, completionRate, overdueCount: overdue.length };
  }, [user, userTrainingStatus, trainingPrograms]);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("trainingHistory")}
          </h2>
          <span className="text-2xl font-bold text-brand-primary dark:text-brand-primary-400">
            {completionRate}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
          {completed.length} {t("of")} {pending.length + completed.length}{" "}
          {t("completed")}
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {overdueCount > 0 && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-semibold text-red-800 dark:text-red-400">
              ⚠️ {overdueCount}{" "}
              {overdueCount === 1
                ? t("overdueTraining")
                : t("overdueTrainings")}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            {t("pendingTraining")} ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(({ assignment, program }) => {
              const isOverdue =
                assignment.dueDate && new Date(assignment.dueDate) < new Date();
              return (
                <div
                  key={assignment.trainingId}
                  className={`p-3 rounded-md border ${
                    isOverdue
                      ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                      : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800"
                  }`}
                >
                  <p className="font-semibold text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                    {program!.title[lang]}
                  </p>
                  <p
                    className={`text-xs ${
                      isOverdue
                        ? "text-red-700 dark:text-red-400 font-semibold"
                        : "text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {t("assignedOn")}:{" "}
                    {new Date(assignment.assignedDate).toLocaleDateString()}
                    {assignment.dueDate &&
                      ` | ${t("dueOn")}: ${new Date(
                        assignment.dueDate,
                      ).toLocaleDateString()}`}
                  </p>
                </div>
              );
            })}
            {pending.length === 0 && (
              <EmptyState
                icon={<AcademicCapIcon className="w-6 h-6" />}
                title={t("noPendingTraining")}
                message=""
              />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {t("completedTraining")} ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map(({ program, status }) => (
              <div
                key={program!.id}
                className="p-3 rounded-md border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                    {program!.title[lang]}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {t("completedOn")}:{" "}
                    {new Date(status.completionDate!).toLocaleDateString()} |{" "}
                    {t("score")}: {status.score}%
                  </p>
                </div>
                {status.certificateId && (
                  <button
                    onClick={() =>
                      setNavigation({
                        view: "certificate",
                        certificateId: status.certificateId!,
                      })
                    }
                    className="text-xs font-semibold text-brand-primary-600 dark:text-brand-primary-400 hover:underline flex-shrink-0 ml-2"
                  >
                    {t("viewCertificate")}
                  </button>
                )}
              </div>
            ))}
            {completed.length === 0 && (
              <EmptyState
                icon={<AcademicCapIcon className="w-6 h-6" />}
                title={t("noCompletedTraining")}
                message=""
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTrainingDashboard;
