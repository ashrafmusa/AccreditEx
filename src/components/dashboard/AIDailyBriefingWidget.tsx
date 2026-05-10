import { ArrowPathIcon, SparklesIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { ComplianceStatus, NavigationState, NavigationView } from "@/types";
import React, { useCallback, useMemo, useState } from "react";

interface AIDailyBriefingWidgetProps {
  setNavigation: (state: NavigationState) => void;
}

type BriefingUrgency = "high" | "medium" | "low";

type BriefingFocusArea = "tasks" | "documents" | "capa" | "audits" | "risks";

interface BriefingAction {
  title: string;
  reason: string;
  urgency: BriefingUrgency;
  focusArea: BriefingFocusArea;
}

interface BriefingPayload {
  headline: string;
  actions: BriefingAction[];
}

interface DashboardSnapshot {
  projectsCount: number;
  myOverdueTasks: number;
  myDueSoonTasks: number;
  openCapaReports: number;
  openRisks: number;
  docsReviewSoon: number;
  pendingAudits: number;
}

const focusToNavigation: Record<
  BriefingFocusArea,
  { view: NavigationView; filter?: string }
> = {
  tasks: { view: "myTasks" },
  documents: { view: "documentControl" },
  capa: { view: "riskHub", filter: "capa" },
  audits: { view: "auditHub" },
  risks: { view: "riskHub" },
};

const isUrgency = (value: string): value is BriefingUrgency => {
  return value === "high" || value === "medium" || value === "low";
};

const isFocusArea = (value: string): value is BriefingFocusArea => {
  return (
    value === "tasks" ||
    value === "documents" ||
    value === "capa" ||
    value === "audits" ||
    value === "risks"
  );
};

const parseBriefingPayload = (raw: string): BriefingPayload | null => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as {
      headline?: unknown;
      actions?: unknown;
    };

    if (typeof parsed.headline !== "string" || !Array.isArray(parsed.actions)) {
      return null;
    }

    const actions: BriefingAction[] = parsed.actions
      .slice(0, 3)
      .map((item): BriefingAction | null => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as {
          title?: unknown;
          reason?: unknown;
          urgency?: unknown;
          focusArea?: unknown;
        };
        if (
          typeof candidate.title !== "string" ||
          typeof candidate.reason !== "string" ||
          typeof candidate.urgency !== "string" ||
          typeof candidate.focusArea !== "string" ||
          !isUrgency(candidate.urgency) ||
          !isFocusArea(candidate.focusArea)
        ) {
          return null;
        }

        return {
          title: candidate.title,
          reason: candidate.reason,
          urgency: candidate.urgency,
          focusArea: candidate.focusArea,
        };
      })
      .filter((item): item is BriefingAction => item !== null);

    if (actions.length === 0) return null;

    return {
      headline: parsed.headline,
      actions,
    };
  } catch {
    return null;
  }
};

const AIDailyBriefingWidget: React.FC<AIDailyBriefingWidgetProps> = ({
  setNavigation,
}) => {
  const { t, lang } = useTranslation();
  const { currentUser } = useUserStore();
  const { projects } = useProjectStore();
  const { documents, risks, auditPlans } = useAppStore();

  const [briefing, setBriefing] = useState<BriefingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const snapshot = useMemo<DashboardSnapshot>(() => {
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);

    const allChecklistItems = projects.flatMap(
      (project) => project.checklist || [],
    );
    const myItems = currentUser
      ? allChecklistItems.filter((item) => item.assignedTo === currentUser.id)
      : [];

    const myOverdueTasks = myItems.filter((item) => {
      if (!item.dueDate) return false;
      const dueDate = new Date(item.dueDate);
      return (
        dueDate < now &&
        item.status !== ComplianceStatus.Compliant &&
        item.status !== ComplianceStatus.NotApplicable
      );
    }).length;

    const myDueSoonTasks = myItems.filter((item) => {
      if (!item.dueDate) return false;
      const dueDate = new Date(item.dueDate);
      return (
        dueDate >= now &&
        dueDate <= in7Days &&
        item.status !== ComplianceStatus.Compliant &&
        item.status !== ComplianceStatus.NotApplicable
      );
    }).length;

    const openCapaReports = projects
      .flatMap((project) => project.capaReports || [])
      .filter((report) => report.status === "Open").length;

    const openRisks = risks.filter((risk) => risk.status === "Open").length;

    const docsReviewSoon = documents.filter((doc) => {
      if (!doc.reviewDate) return false;
      const reviewDate = new Date(doc.reviewDate);
      return reviewDate >= now && reviewDate <= in7Days;
    }).length;

    const pendingAudits = auditPlans.filter((plan) => {
      if (plan.status === "cancelled" || plan.status === "completed")
        return false;
      if (!plan.startDate && !plan.endDate) return true;
      const scheduledDate = new Date(
        plan.startDate || plan.endDate || now.toISOString(),
      );
      return scheduledDate <= in7Days;
    }).length;

    return {
      projectsCount: projects.length,
      myOverdueTasks,
      myDueSoonTasks,
      openCapaReports,
      openRisks,
      docsReviewSoon,
      pendingAudits,
    };
  }, [auditPlans, currentUser, documents, projects, risks]);

  const fallbackBriefing = useMemo<BriefingPayload>(() => {
    const actions: BriefingAction[] = [];

    if (snapshot.myOverdueTasks > 0) {
      actions.push({
        title: t("aiBriefingActionOverdueTasksTitle"),
        reason: t("aiBriefingActionOverdueTasksReason").replace(
          "{count}",
          String(snapshot.myOverdueTasks),
        ),
        urgency: "high",
        focusArea: "tasks",
      });
    }

    if (snapshot.openCapaReports > 0) {
      actions.push({
        title: t("aiBriefingActionCapaTitle"),
        reason: t("aiBriefingActionCapaReason").replace(
          "{count}",
          String(snapshot.openCapaReports),
        ),
        urgency: snapshot.openCapaReports >= 5 ? "high" : "medium",
        focusArea: "capa",
      });
    }

    if (snapshot.docsReviewSoon > 0) {
      actions.push({
        title: t("aiBriefingActionDocsTitle"),
        reason: t("aiBriefingActionDocsReason").replace(
          "{count}",
          String(snapshot.docsReviewSoon),
        ),
        urgency: "medium",
        focusArea: "documents",
      });
    }

    if (snapshot.pendingAudits > 0 && actions.length < 3) {
      actions.push({
        title: t("aiBriefingActionAuditsTitle"),
        reason: t("aiBriefingActionAuditsReason").replace(
          "{count}",
          String(snapshot.pendingAudits),
        ),
        urgency: "medium",
        focusArea: "audits",
      });
    }

    if (snapshot.openRisks > 0 && actions.length < 3) {
      actions.push({
        title: t("aiBriefingActionRisksTitle"),
        reason: t("aiBriefingActionRisksReason").replace(
          "{count}",
          String(snapshot.openRisks),
        ),
        urgency: "high",
        focusArea: "risks",
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: t("aiBriefingActionMaintainTitle"),
        reason: t("aiBriefingActionMaintainReason"),
        urgency: "low",
        focusArea: "tasks",
      });
    }

    return {
      headline: t("aiDailyBriefingHeadlineDefault"),
      actions: actions.slice(0, 3),
    };
  }, [snapshot, t]);

  const urgencyBadge = useCallback(
    (urgency: BriefingUrgency) => {
      if (urgency === "high") {
        return {
          text: t("aiDailyBriefingUrgencyHigh"),
          className:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        };
      }
      if (urgency === "medium") {
        return {
          text: t("aiDailyBriefingUrgencyMedium"),
          className:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        };
      }
      return {
        text: t("aiDailyBriefingUrgencyLow"),
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      };
    },
    [t],
  );

  const generateBriefing = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `You are a healthcare accreditation operations assistant.
Create a short DAILY BRIEFING with exactly top 3 actions.
Return ONLY valid JSON without markdown fences.

Required JSON schema:
{
  "headline": "string (max 120 chars)",
  "actions": [
    {
      "title": "string (max 90 chars)",
      "reason": "string (max 140 chars)",
      "urgency": "high | medium | low",
      "focusArea": "tasks | documents | capa | audits | risks"
    }
  ]
}

Language: ${lang === "ar" ? "Arabic" : "English"}

User summary:
- Projects: ${snapshot.projectsCount}
- My overdue tasks: ${snapshot.myOverdueTasks}
- My tasks due in 7 days: ${snapshot.myDueSoonTasks}
- Open CAPA reports: ${snapshot.openCapaReports}
- Open risks: ${snapshot.openRisks}
- Documents due review in 7 days: ${snapshot.docsReviewSoon}
- Pending audits: ${snapshot.pendingAudits}`;

      const response = await aiAgentService.chat(prompt, true);
      const parsed = parseBriefingPayload(response.response);

      if (!parsed) {
        setBriefing(fallbackBriefing);
        setError(t("aiDailyBriefingError"));
      } else {
        setBriefing(parsed);
      }

      setUpdatedAt(new Date().toISOString());
    } catch {
      setBriefing(fallbackBriefing);
      setError(t("aiDailyBriefingError"));
      setUpdatedAt(new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  }, [fallbackBriefing, lang, snapshot, t]);

  React.useEffect(() => {
    if (!currentUser || briefing || isLoading) return;
    void generateBriefing();
  }, [briefing, currentUser, generateBriefing, isLoading]);

  if (!currentUser) return null;

  return (
    <section className="rounded-xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-brand-primary" />
            {t("aiDailyBriefingTitle")}
          </h2>
          <p className="mt-1 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("aiDailyBriefingSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generateBriefing()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border dark:border-dark-brand-border px-3 py-1.5 text-xs font-medium text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 disabled:opacity-60"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          {briefing
            ? t("aiDailyBriefingRefresh")
            : t("aiDailyBriefingGenerate")}
        </button>
      </div>

      {isLoading && !briefing && (
        <div className="mt-4 rounded-lg border border-dashed border-brand-border dark:border-dark-brand-border p-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("aiDailyBriefingLoading")}
        </div>
      )}

      {!isLoading && briefing && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
            {briefing.headline}
          </p>

          {briefing.actions.map((action, index) => {
            const urgency = urgencyBadge(action.urgency);
            const target = focusToNavigation[action.focusArea];

            return (
              <article
                key={`${action.title}-${index}`}
                className="rounded-lg border border-brand-border dark:border-dark-brand-border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {index + 1}. {action.title}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgency.className}`}
                  >
                    {urgency.text}
                  </span>
                </div>

                <p className="mt-1 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {action.reason}
                </p>

                <button
                  type="button"
                  onClick={() => setNavigation(target)}
                  className="mt-2 text-xs font-semibold text-brand-primary hover:underline"
                >
                  {t("aiDailyBriefingOpen")}
                </button>
              </article>
            );
          })}

          {updatedAt && (
            <p className="text-[11px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("aiDailyBriefingUpdated")}:{" "}
              {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          {error}
        </p>
      )}
    </section>
  );
};

export default AIDailyBriefingWidget;
