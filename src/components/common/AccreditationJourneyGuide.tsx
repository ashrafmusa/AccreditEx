import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { useModuleStore } from "@/stores/useModuleStore";
import { useUserStore } from "@/stores/useUserStore";
import type { NavigationState } from "@/types";
import { isEligibleAuditor } from "@/utils/roleAccess";

const stages = [
  {
    id: "requirements",
    label: "qualityJourneyRequirements",
    description: "qualityJourneyRequirementsHelp",
    view: "accreditationHub",
    views: ["accreditationHub", "standards"],
    resource: Resource.Standard,
  },
  {
    id: "projects",
    label: "qualityJourneyProjects",
    description: "qualityJourneyProjectsHelp",
    view: "projects",
    views: ["projects", "createProject", "editProject", "projectDetail"],
    resource: Resource.Project,
  },
  {
    id: "tasks",
    label: "qualityJourneyTasks",
    description: "qualityJourneyTasksHelp",
    view: "myTasks",
    views: ["myTasks"],
    resource: Resource.Project,
  },
  {
    id: "evidence",
    label: "qualityJourneyEvidence",
    description: "qualityJourneyEvidenceHelp",
    view: "documentControl",
    views: ["documentControl"],
    resource: Resource.Document,
  },
  {
    id: "audits",
    label: "qualityJourneyAudits",
    description: "qualityJourneyAuditsHelp",
    view: "auditHub",
    views: ["auditHub"],
    resource: Resource.Audit,
  },
  {
    id: "improve",
    label: "qualityJourneyImprove",
    description: "qualityJourneyImproveHelp",
    view: "riskHub",
    views: ["riskHub"],
    resource: Resource.Risk,
  },
  {
    id: "report",
    label: "qualityJourneyReport",
    description: "qualityJourneyReportHelp",
    view: "analyticsHub",
    views: ["analyticsHub"],
    resource: Resource.Report,
  },
] as const;

interface Props {
  navigation: NavigationState;
  setNavigation: (state: NavigationState) => void;
}

const AccreditationJourneyGuide: React.FC<Props> = ({
  navigation,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { can } = usePermission();
  const user = useUserStore((state) => state.currentUser);
  const { isNavKeyEnabled: isEnabled } = useModuleStore();
  const currentStage = stages.find((stage) =>
    stage.views.some((view) => view === navigation.view),
  );
  if (!currentStage || !user) return null;
  const visibleStages = stages.filter(
    (stage) =>
      can(Action.Read, stage.resource) &&
      isEnabled(stage.view) &&
      (stage.view !== "auditHub" || isEligibleAuditor(user)),
  );
  if (!visibleStages.some((stage) => stage.id === currentStage.id)) return null;

  return (
    <section
      aria-label={t("qualityJourneyTitle")}
      className="mb-5 rounded-xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-brand-primary">
          {t("qualityJourneyTitle")}
        </h2>
        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("qualityJourneyNavigationNotice")}
        </span>
      </div>
      <p className="mt-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
        {t(currentStage.description)}
      </p>
      <nav aria-label={t("qualityJourneyWorkspaces")} className="mt-3">
        <ol className="flex flex-wrap gap-2">
          {visibleStages.map((stage) => (
            <li key={stage.id}>
              <button
                type="button"
                aria-current={stage.id === currentStage.id ? "step" : undefined}
                onClick={() => setNavigation({ view: stage.view })}
                className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                  stage.id === currentStage.id
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-brand-border dark:border-dark-brand-border text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-brand-primary/5"
                }`}
              >
                {t(stage.label)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
};

export default AccreditationJourneyGuide;
