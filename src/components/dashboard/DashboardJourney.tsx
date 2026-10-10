import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowRightIcon } from "@/components/icons";
import type { AppDocument, AuditPlan, NavigationState, Project, User } from "@/types";
import { buildDashboardJourney } from "@/utils/dashboardJourney";

interface Props {
  user: User;
  organizationId: string | null;
  projects: Project[];
  documents: AppDocument[];
  auditPlans: AuditPlan[];
  setNavigation: (navigation: NavigationState) => void;
}

const DashboardJourney: React.FC<Props> = ({
  user, organizationId, projects, documents, auditPlans, setNavigation,
}) => {
  const { t } = useTranslation();
  const { priorities, steps } = buildDashboardJourney(user, organizationId, projects, documents, auditPlans);
  if (!steps.length && !priorities.length) return null;

  return (
    <section aria-labelledby="dashboard-journey-title"
      className="rounded-2xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">{t("journeyEyebrow")}</p>
          <h2 id="dashboard-journey-title" className="mt-1 text-xl sm:text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("journeyTitle")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{t("journeyDescription")}</p>
        </div>
        <a href="#dashboard-overview"
          className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
          {t("journeyOverview")}
        </a>
      </div>

      {priorities.length ? (
        <div className={`mt-5 grid gap-3 ${priorities.length === 3 ? "md:grid-cols-3" : priorities.length === 2 ? "md:grid-cols-2" : ""}`}>
          {priorities.map((action, index) => (
            <button key={action.id} type="button" onClick={() => setNavigation(action.navigation)}
              className={`group flex flex-col items-start rounded-xl border p-4 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                index === 0 ? "border-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10"
                  : "border-brand-border dark:border-dark-brand-border hover:bg-brand-primary/5"
              }`}>
              <span className={`text-xs font-semibold ${action.urgent ? "text-brand-danger" : "text-brand-primary"}`}>
                {index === 0 ? t("journeyRecommended") : t("journeyAlsoNeedsAttention")}
              </span>
              <span className="mt-2 flex w-full items-center justify-between gap-3">
                <span className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{t(action.titleKey)}</span>
                {action.count !== undefined && <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-sm font-bold text-brand-primary">{action.count}</span>}
              </span>
              <span className="mt-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{t(action.descriptionKey)}</span>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
                {t("journeyOpen")} <ArrowRightIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p role="status" className="mt-5 rounded-lg bg-brand-primary/5 p-3 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("journeyNoPriorities")}
        </p>
      )}

      <div className="mt-6 border-t border-brand-border dark:border-dark-brand-border pt-4">
        <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{t("journeyPathTitle")}</h3>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button type="button" onClick={() => setNavigation(step.navigation)}
                className="flex h-full w-full items-start gap-3 rounded-lg p-3 text-start hover:bg-brand-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">{index + 1}</span>
                <span>
                  <span className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{t(step.titleKey)}</span>
                  <span className="mt-1 block text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{t(step.descriptionKey)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{t("journeyCoverageNotice")}</p>
      </div>
    </section>
  );
};

export default DashboardJourney;
