import React, { useMemo } from "react";
import {
  Project,
  ChecklistItem,
  User,
  AccreditationProgram,
  ComplianceStatus,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { ClipboardDocumentCheckIcon } from "@/components/icons";

interface MyTasksWidgetProps {
  projects: Project[];
  currentUser: User;
  programs: AccreditationProgram[];
  maxTasks?: number;
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({
  projects,
  currentUser,
  programs,
  maxTasks = 10,
}) => {
  const { t } = useTranslation();

  const myTasks = useMemo(() => {
    return projects.flatMap((project) =>
      project.checklist
        .filter(
          (item) =>
            item.assignedTo === currentUser.id &&
            item.status !== ComplianceStatus.Compliant &&
            item.status !== ComplianceStatus.NotApplicable,
        )
        .map((item) => ({
          ...item,
          projectName: project.name,
          programId: project.programId,
        })),
    );
  }, [projects, currentUser]);

  const displayTasks = myTasks.slice(0, maxTasks);

  const statusColors: Record<string, string> = {
    "Non-Compliant":
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "Partially Compliant":
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "Not Assessed":
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };

  if (myTasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl border border-gray-200 dark:border-dark-brand-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-brand-border">
        <div className="flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("myTasks") || "My Tasks"}
          </h3>
          <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-brand-primary/10 text-brand-primary">
            {myTasks.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-dark-brand-border">
        {displayTasks.map((task) => {
          const program = programs.find((p) => p.id === task.programId);
          return (
            <div
              key={task.id}
              className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                    {task.item}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {task.projectName}
                    </span>
                    {program && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">
                          •
                        </span>
                        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {program.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[task.status] ||
                    "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {myTasks.length > maxTasks && (
        <div className="px-5 py-3 border-t border-gray-200 dark:border-dark-brand-border text-center">
          <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            +{myTasks.length - maxTasks} {t("moreTasks") || "more tasks"}
          </span>
        </div>
      )}
    </div>
  );
};

export default MyTasksWidget;
