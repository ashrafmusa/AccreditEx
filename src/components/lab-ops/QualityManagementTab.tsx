/**
 * Quality Management Tab (LQMS Core)
 * Nonconformity / quality-event tracking with CAPA management.
 */
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type {
  CAPARecord,
  CAPAStatus,
  QualityEvent,
  QualityEventSeverity,
  QualityEventSource,
  QualityEventStatus,
  QualityRiskRecord,
  QualityRiskStatus,
} from "@/types/labOps";
import {
  CAPA_STATUS_LABELS,
  QUALITY_EVENT_SEVERITY_LABELS,
  QUALITY_EVENT_SOURCE_LABELS,
  QUALITY_EVENT_STATUS_LABELS,
  QUALITY_RISK_LEVEL_LABELS,
  QUALITY_RISK_STATUS_LABELS,
} from "@/types/labOps";
import React, { useMemo, useState } from "react";

const severityColor: Record<QualityEventSeverity, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const eventStatusColor: Record<QualityEventStatus, string> = {
  open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  investigating:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  capa_assigned:
    "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/90/30 dark:text-brand-primary",
  implemented:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  verified:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const capaStatusColor: Record<CAPAStatus, string> = {
  open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  in_progress:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  effectiveness_check:
    "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/90/30 dark:text-brand-primary",
  closed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const riskStatusColor: Record<QualityRiskStatus, string> = {
  open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  mitigated:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  closed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const QualityManagementTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    qualityEvents,
    capaRecords,
    qualityRisks,
    addQualityEvent,
    updateQualityEvent,
    addCAPARecord,
    updateCAPARecord,
    addQualityRisk,
    updateQualityRisk,
  } = useLabOpsStore();

  const [search, setSearch] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [showCAPAForm, setShowCAPAForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [autoCreateRiskOnSevere, setAutoCreateRiskOnSevere] = useState(true);

  const [aiModal, setAiModal] = useState<{
    open: boolean;
    title: string;
    content: string;
    type: "root-cause" | "action-plan" | "risk-assessment";
  } | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const handleSuggestRootCause = async (event: QualityEvent) => {
    setAiLoadingId(event.id);
    try {
      const prompt =
        `You are a laboratory quality management expert.\n` +
        `Analyze the following nonconformance event and suggest 2-3 likely root causes.\n` +
        `Format your response as a structured list with categories (e.g., Human Error, Process Gap, Equipment Failure, Reagent Issue, Environmental Factor).\n\n` +
        `Event: "${event.title}"\n` +
        `Lab Section: ${event.labSection}\n` +
        `Description: ${event.description}\n` +
        `Severity: ${event.severity}\n\n` +
        `Provide concise, actionable root cause categories with brief explanations.`;
      const response = await aiAgentService.chat(prompt, false);
      setAiModal({
        open: true,
        title:
          (t("aiRootCauseTitle") || "AI Root Cause Analysis") +
          ` — ${event.title}`,
        content: response.response,
        type: "root-cause",
      });
    } catch {
      setAiModal({
        open: true,
        title: t("aiRootCauseTitle") || "AI Root Cause Analysis",
        content: "AI service is temporarily unavailable. Please try again.",
        type: "root-cause",
      });
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleSuggestActionPlan = async (capa: CAPARecord) => {
    setAiLoadingId(capa.id);
    try {
      const sourceEvent =
        capaRecords && qualityEvents.find((e) => e.id === capa.sourceEventId);
      const prompt =
        `You are a laboratory quality manager.\n` +
        `Create a concise, step-by-step Corrective and Preventive Action (CAPA) plan for the following issue.\n` +
        `Include: immediate containment, root cause remediation, preventive measures, and effectiveness verification.\n\n` +
        `CAPA Title: "${capa.title}"\n` +
        (sourceEvent ? `Nonconformance: ${sourceEvent.description}\n` : "") +
        `Current Action Plan: ${capa.actionPlan}\n\n` +
        `Format as 3-5 numbered steps. Keep each step concise (1-2 sentences).`;
      const response = await aiAgentService.chat(prompt, false);
      setAiModal({
        open: true,
        title:
          (t("aiActionPlanTitle") || "AI CAPA Action Plan") +
          ` — ${capa.title}`,
        content: response.response,
        type: "action-plan",
      });
    } catch {
      setAiModal({
        open: true,
        title: t("aiActionPlanTitle") || "AI CAPA Action Plan",
        content: "AI service is temporarily unavailable. Please try again.",
        type: "action-plan",
      });
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleAnalyzeRisk = async (risk: QualityRiskRecord) => {
    setAiLoadingId(risk.id);
    try {
      const prompt =
        `You are a laboratory risk management specialist.\n` +
        `Analyze the following quality risk and provide:\n` +
        `(1) A brief risk assessment\n` +
        `(2) 3 specific mitigation strategies\n` +
        `(3) Effectiveness monitoring criteria\n\n` +
        `Risk: "${risk.title}"\n` +
        `Hazard: ${risk.hazard}\n` +
        `Potential Harm: ${risk.potentialHarm}\n` +
        `Lab Section: ${risk.labSection}\n` +
        `Risk Score: ${risk.riskScore} (${risk.riskLevel})\n` +
        (risk.mitigationPlan
          ? `Current Mitigation: ${risk.mitigationPlan}\n`
          : "") +
        `\nFormat as three sections: Risk Assessment, Mitigation Strategies, Monitoring Criteria.`;
      const response = await aiAgentService.chat(prompt, false);
      setAiModal({
        open: true,
        title:
          (t("aiRiskAnalysisTitle") || "AI Risk Analysis") + ` — ${risk.title}`,
        content: response.response,
        type: "risk-assessment",
      });
    } catch {
      setAiModal({
        open: true,
        title: t("aiRiskAnalysisTitle") || "AI Risk Analysis",
        content: "AI service is temporarily unavailable. Please try again.",
        type: "risk-assessment",
      });
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleCreateCapaFromRisk = (risk: QualityRiskRecord) => {
    setCapaForm({
      title: `CAPA — ${risk.title}`,
      sourceEventId: risk.sourceEventId,
      actionPlan: risk.mitigationPlan || "",
      owner: risk.owner,
      status: "open",
    });
    setShowCAPAForm(true);
  };

  const [eventForm, setEventForm] = useState<Partial<QualityEvent>>({
    source: "incident",
    severity: "medium",
    status: "open",
  });

  const [capaForm, setCapaForm] = useState<Partial<CAPARecord>>({
    status: "open",
  });

  const [riskForm, setRiskForm] = useState<Partial<QualityRiskRecord>>({
    likelihood: 3,
    impact: 3,
    status: "open",
    riskLevel: "medium",
  });

  const today = new Date().toISOString().split("T")[0];

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return qualityEvents;
    const q = search.toLowerCase();
    return qualityEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.labSection.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }, [qualityEvents, search]);

  const filteredCAPA = useMemo(() => {
    if (!search.trim()) return capaRecords;
    const q = search.toLowerCase();
    return capaRecords.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.actionPlan.toLowerCase().includes(q),
    );
  }, [capaRecords, search]);

  const filteredRisks = useMemo(() => {
    if (!search.trim()) return qualityRisks;
    const q = search.toLowerCase();
    return qualityRisks.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.hazard.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q),
    );
  }, [qualityRisks, search]);

  const heatmapCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let l = 1; l <= 5; l += 1) {
      for (let i = 1; i <= 5; i += 1) {
        counts[`${l}-${i}`] = 0;
      }
    }
    qualityRisks
      .filter((risk) => risk.status !== "closed")
      .forEach((risk) => {
        const key = `${risk.likelihood}-${risk.impact}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    return counts;
  }, [qualityRisks]);

  const traceabilityRows = useMemo(() => {
    return qualityEvents.map((event) => {
      const linkedRisks = qualityRisks.filter(
        (risk) => risk.sourceEventId === event.id,
      );

      const linkedCAPAFromEvent = capaRecords.filter(
        (capa) => capa.sourceEventId === event.id,
      );

      const linkedCAPAFromRisk = capaRecords.filter((capa) =>
        linkedRisks.some((risk) => risk.relatedCapaId === capa.id),
      );

      const linkedCAPAByEventRef = event.capaId
        ? capaRecords.filter((capa) => capa.id === event.capaId)
        : [];

      const linkedCAPA = [
        ...linkedCAPAFromEvent,
        ...linkedCAPAFromRisk,
        ...linkedCAPAByEventRef,
      ].filter(
        (capa, index, arr) =>
          arr.findIndex((item) => item.id === capa.id) === index,
      );

      const allClosed =
        event.status === "closed" &&
        linkedRisks.every((risk) => risk.status === "closed") &&
        linkedCAPA.every((capa) => capa.status === "closed");

      const anyInProgress =
        event.status !== "open" ||
        linkedRisks.some((risk) => risk.status !== "open") ||
        linkedCAPA.some((capa) => capa.status !== "open");

      const rollupStatus = allClosed
        ? "closed"
        : anyInProgress
          ? "in_progress"
          : "open";

      return {
        event,
        linkedRisks,
        linkedCAPA,
        rollupStatus,
      };
    });
  }, [qualityEvents, qualityRisks, capaRecords]);

  const openEvents = qualityEvents.filter((e) => e.status !== "closed").length;
  const criticalOpen = qualityEvents.filter(
    (e) => e.status !== "closed" && e.severity === "critical",
  ).length;
  const overdueCAPA = capaRecords.filter(
    (c) => c.status !== "closed" && c.dueDate < today,
  ).length;
  const openHighRisks = qualityRisks.filter(
    (r) =>
      r.status !== "closed" &&
      (r.riskLevel === "high" || r.riskLevel === "critical"),
  ).length;
  const capaClosedRate =
    capaRecords.length > 0
      ? Math.round(
          (capaRecords.filter((c) => c.status === "closed").length /
            capaRecords.length) *
            100,
        )
      : 100;

  const handleAddEvent = () => {
    if (!eventForm.title || !eventForm.labSection || !eventForm.description) {
      return;
    }
    const now = new Date().toISOString();
    const eventId = `qe-${Date.now()}`;
    const eventSeverity = eventForm.severity || "medium";
    addQualityEvent({
      id: eventId,
      eventDate: eventForm.eventDate || today,
      labSection: eventForm.labSection,
      source: eventForm.source || "incident",
      title: eventForm.title,
      description: eventForm.description,
      severity: eventSeverity,
      status: eventForm.status || "open",
      immediateContainment: eventForm.immediateContainment,
      rootCause: eventForm.rootCause,
      recurrenceRisk: eventForm.recurrenceRisk,
      createdAt: now,
      updatedAt: now,
    });

    if (
      autoCreateRiskOnSevere &&
      (eventSeverity === "high" || eventSeverity === "critical")
    ) {
      const likelihood = eventSeverity === "critical" ? 4 : 3;
      const impact = eventSeverity === "critical" ? 5 : 4;
      const riskScore = likelihood * impact;

      addQualityRisk({
        id: `qr-${Date.now()}-auto`,
        sourceEventId: eventId,
        title: `${eventForm.title} ${t("autoRiskSuffix") || "(Auto Risk)"}`,
        hazard: eventForm.description,
        potentialHarm: eventForm.description,
        labSection: eventForm.labSection,
        owner: t("defaultRiskOwner") || "Quality Manager",
        likelihood,
        impact,
        riskScore,
        riskLevel: toRiskLevel(riskScore),
        status: "open",
        mitigationPlan: eventForm.immediateContainment,
        createdAt: now,
        updatedAt: now,
      });
    }

    setShowEventForm(false);
    setEventForm({ source: "incident", severity: "medium", status: "open" });
  };

  const toRiskLevel = (score: number): QualityRiskRecord["riskLevel"] => {
    if (score >= 15) return "critical";
    if (score >= 10) return "high";
    if (score >= 5) return "medium";
    return "low";
  };

  const handleAddRisk = () => {
    if (!riskForm.title || !riskForm.hazard || !riskForm.owner) {
      return;
    }

    const likelihood = (riskForm.likelihood || 3) as 1 | 2 | 3 | 4 | 5;
    const impact = (riskForm.impact || 3) as 1 | 2 | 3 | 4 | 5;
    const riskScore = likelihood * impact;
    const now = new Date().toISOString();

    addQualityRisk({
      id: `qr-${Date.now()}`,
      sourceEventId: riskForm.sourceEventId,
      relatedCapaId: riskForm.relatedCapaId,
      title: riskForm.title,
      hazard: riskForm.hazard,
      potentialHarm: riskForm.potentialHarm || "",
      labSection: riskForm.labSection || "General",
      owner: riskForm.owner,
      likelihood,
      impact,
      riskScore,
      riskLevel: toRiskLevel(riskScore),
      status: (riskForm.status || "open") as QualityRiskStatus,
      mitigationPlan: riskForm.mitigationPlan,
      reviewDate: riskForm.reviewDate,
      createdAt: now,
      updatedAt: now,
    });

    setShowRiskForm(false);
    setRiskForm({
      likelihood: 3,
      impact: 3,
      status: "open",
      riskLevel: "medium",
    });
  };

  const handleAddCAPA = () => {
    if (
      !capaForm.title ||
      !capaForm.owner ||
      !capaForm.dueDate ||
      !capaForm.actionPlan
    ) {
      return;
    }
    const now = new Date().toISOString();
    addCAPARecord({
      id: `capa-${Date.now()}`,
      title: capaForm.title,
      sourceEventId: capaForm.sourceEventId,
      owner: capaForm.owner,
      dueDate: capaForm.dueDate,
      status: capaForm.status || "open",
      actionPlan: capaForm.actionPlan,
      effectivenessCriteria: capaForm.effectivenessCriteria,
      createdAt: now,
      updatedAt: now,
    });
    setShowCAPAForm(false);
    setCapaForm({ status: "open" });
  };

  const markEventClosed = (event: QualityEvent) => {
    updateQualityEvent({
      ...event,
      status: "closed",
      updatedAt: new Date().toISOString(),
    });
  };

  const markCAPAClosed = (capa: CAPARecord) => {
    const now = new Date().toISOString();
    updateCAPARecord({
      ...capa,
      status: "closed",
      completedDate: now.split("T")[0],
      updatedAt: now,
    });
  };

  const markRiskClosed = (risk: QualityRiskRecord) => {
    updateQualityRisk({
      ...risk,
      status: "closed",
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
        {t("qualityManagementTitle") || "Quality Management (LQMS)"}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{openEvents}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("openQualityEvents") || "Open Quality Events"}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{criticalOpen}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("criticalOpen") || "Critical Open"}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{overdueCAPA}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("overdueCAPA") || "Overdue CAPA"}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{openHighRisks}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("openHighRisks") || "Open High Risks"}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{capaClosedRate}%</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("capaClosureRate") || "CAPA Closure Rate"}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-60">
          <SearchIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              t("searchQuality") || "Search events, risks, or CAPA..."
            }
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowEventForm((v) => !v)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            {t("newQualityEvent") || "New Quality Event"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCAPAForm((v) => !v)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            {t("newCAPA") || "New CAPA"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRiskForm((v) => !v)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            {t("newRisk") || "New Risk"}
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <label className="flex items-center gap-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
          <input
            type="checkbox"
            checked={autoCreateRiskOnSevere}
            onChange={(e) => setAutoCreateRiskOnSevere(e.target.checked)}
            className="h-4 w-4"
          />
          {t("autoCreateRiskOnSevere") ||
            "Auto-create risk record for High/Critical nonconformances"}
        </label>
      </Card>

      {showEventForm && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            {t("newQualityEvent") || "New Quality Event"}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-sm">
            <input
              value={eventForm.title || ""}
              onChange={(e) =>
                setEventForm({ ...eventForm, title: e.target.value })
              }
              placeholder={t("eventTitleRequired") || "Event title *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={eventForm.labSection || ""}
              onChange={(e) =>
                setEventForm({ ...eventForm, labSection: e.target.value })
              }
              placeholder={t("labSectionRequired") || "Lab section *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <select
              value={eventForm.source || "incident"}
              onChange={(e) =>
                setEventForm({
                  ...eventForm,
                  source: e.target.value as QualityEventSource,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Object.entries(QUALITY_EVENT_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={eventForm.severity || "medium"}
              onChange={(e) =>
                setEventForm({
                  ...eventForm,
                  severity: e.target.value as QualityEventSeverity,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Object.entries(QUALITY_EVENT_SEVERITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              value={eventForm.description || ""}
              onChange={(e) =>
                setEventForm({ ...eventForm, description: e.target.value })
              }
              placeholder={t("descriptionRequired") || "Description *"}
              className="lg:col-span-4 px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEventForm(false)}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddEvent}>
              {t("create") || "Create"}
            </Button>
          </div>
        </Card>
      )}

      {showCAPAForm && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            {t("newCAPA") || "New CAPA"}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-sm">
            <input
              value={capaForm.title || ""}
              onChange={(e) =>
                setCapaForm({ ...capaForm, title: e.target.value })
              }
              placeholder={t("capaTitleRequired") || "CAPA title *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={capaForm.owner || ""}
              onChange={(e) =>
                setCapaForm({ ...capaForm, owner: e.target.value })
              }
              placeholder={t("ownerRequired") || "Owner *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="date"
              value={capaForm.dueDate || ""}
              onChange={(e) =>
                setCapaForm({ ...capaForm, dueDate: e.target.value })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <select
              value={capaForm.status || "open"}
              onChange={(e) =>
                setCapaForm({
                  ...capaForm,
                  status: e.target.value as CAPAStatus,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Object.entries(CAPA_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={capaForm.sourceEventId || ""}
              onChange={(e) =>
                setCapaForm({
                  ...capaForm,
                  sourceEventId: e.target.value || undefined,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">{t("relatedEvent") || "Related Event"}</option>
              {qualityEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <input
              value={capaForm.actionPlan || ""}
              onChange={(e) =>
                setCapaForm({ ...capaForm, actionPlan: e.target.value })
              }
              placeholder={t("actionPlanRequired") || "Action plan *"}
              className="lg:col-span-4 px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCAPAForm(false)}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddCAPA}>
              {t("create") || "Create"}
            </Button>
          </div>
        </Card>
      )}

      {showRiskForm && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            {t("newRisk") || "New Risk"}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-sm">
            <input
              value={riskForm.title || ""}
              onChange={(e) =>
                setRiskForm({ ...riskForm, title: e.target.value })
              }
              placeholder={t("riskTitleRequired") || "Risk title *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={riskForm.hazard || ""}
              onChange={(e) =>
                setRiskForm({ ...riskForm, hazard: e.target.value })
              }
              placeholder={t("hazardRequired") || "Hazard *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={riskForm.owner || ""}
              onChange={(e) =>
                setRiskForm({ ...riskForm, owner: e.target.value })
              }
              placeholder={t("riskOwnerRequired") || "Risk owner *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={riskForm.labSection || ""}
              onChange={(e) =>
                setRiskForm({ ...riskForm, labSection: e.target.value })
              }
              placeholder={t("labSectionRequired") || "Lab section *"}
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <select
              value={String(riskForm.likelihood || 3)}
              onChange={(e) =>
                setRiskForm({
                  ...riskForm,
                  likelihood: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>
                  {(t("likelihood") || "Likelihood") + `: ${val}`}
                </option>
              ))}
            </select>
            <select
              value={String(riskForm.impact || 3)}
              onChange={(e) =>
                setRiskForm({
                  ...riskForm,
                  impact: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>
                  {(t("impact") || "Impact") + `: ${val}`}
                </option>
              ))}
            </select>
            <select
              value={riskForm.sourceEventId || ""}
              onChange={(e) =>
                setRiskForm({
                  ...riskForm,
                  sourceEventId: e.target.value || undefined,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">{t("relatedEvent") || "Related Event"}</option>
              {qualityEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <select
              value={riskForm.relatedCapaId || ""}
              onChange={(e) =>
                setRiskForm({
                  ...riskForm,
                  relatedCapaId: e.target.value || undefined,
                })
              }
              className="px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">{t("relatedCAPA") || "Related CAPA"}</option>
              {capaRecords.map((capa) => (
                <option key={capa.id} value={capa.id}>
                  {capa.title}
                </option>
              ))}
            </select>
            <input
              value={riskForm.potentialHarm || ""}
              onChange={(e) =>
                setRiskForm({ ...riskForm, potentialHarm: e.target.value })
              }
              placeholder={t("potentialHarm") || "Potential harm"}
              className="lg:col-span-2 px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              value={riskForm.mitigationPlan || ""}
              onChange={(e) =>
                setRiskForm({ ...riskForm, mitigationPlan: e.target.value })
              }
              placeholder={t("mitigationPlan") || "Mitigation plan"}
              className="lg:col-span-2 px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRiskForm(false)}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddRisk}>
              {t("create") || "Create"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold dark:text-dark-brand-text-primary">
              {t("qualityEvents") || "Quality Events"}
            </h3>
            <span className="text-xs text-gray-500">
              {filteredEvents.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${severityColor[event.severity]}`}
                  >
                    {QUALITY_EVENT_SEVERITY_LABELS[event.severity]}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${eventStatusColor[event.status]}`}
                  >
                    {QUALITY_EVENT_STATUS_LABELS[event.status]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {QUALITY_EVENT_SOURCE_LABELS[event.source]}
                  </span>
                </div>
                <p className="font-medium text-sm dark:text-dark-brand-text-primary">
                  {event.title}
                </p>
                <p className="text-xs text-gray-500 mb-1">
                  {event.labSection} • {event.eventDate}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestRootCause(event)}
                    disabled={aiLoadingId === event.id}
                    className="text-sky-600 dark:text-sky-400"
                  >
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    {aiLoadingId === event.id
                      ? t("aiAnalyzing") || "Analyzing…"
                      : t("aiSuggestRootCause") || "Suggest Root Cause"}
                  </Button>
                  {event.status !== "closed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markEventClosed(event)}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      {t("markClosed") || "Mark Closed"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <p className="text-sm text-gray-400">
                {t("noQualityEvents") || "No quality events found"}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold dark:text-dark-brand-text-primary">
              {t("capaRecords") || "CAPA Records"}
            </h3>
            <span className="text-xs text-gray-500">{filteredCAPA.length}</span>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {filteredCAPA.map((capa) => {
              const isOverdue =
                capa.status !== "closed" && capa.dueDate < today;
              return (
                <div
                  key={capa.id}
                  className={`border rounded-lg p-3 ${isOverdue ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${capaStatusColor[isOverdue ? "overdue" : capa.status]}`}
                    >
                      {CAPA_STATUS_LABELS[isOverdue ? "overdue" : capa.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t("owner") || "Owner"}: {capa.owner}
                    </span>
                  </div>
                  <p className="font-medium text-sm dark:text-dark-brand-text-primary">
                    {capa.title}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("due") || "Due"}: {capa.dueDate}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {capa.actionPlan}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestActionPlan(capa)}
                      disabled={aiLoadingId === capa.id}
                      className="text-sky-600 dark:text-sky-400"
                    >
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      {aiLoadingId === capa.id
                        ? t("aiAnalyzing") || "Analyzing…"
                        : t("aiSuggestActionPlan") || "Improve Action Plan"}
                    </Button>
                    {capa.status !== "closed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markCAPAClosed(capa)}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {t("markClosed") || "Mark Closed"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredCAPA.length === 0 && (
              <p className="text-sm text-gray-400">
                {t("noCAPARecords") || "No CAPA records found"}
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold dark:text-dark-brand-text-primary">
            {t("riskRegister") || "Risk Register"}
          </h3>
          <span className="text-xs text-gray-500">{filteredRisks.length}</span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredRisks.map((risk) => (
            <div
              key={risk.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${riskStatusColor[risk.status]}`}
                >
                  {QUALITY_RISK_STATUS_LABELS[risk.status]}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {QUALITY_RISK_LEVEL_LABELS[risk.riskLevel]}
                </span>
                <span className="text-xs text-gray-500">
                  {(t("riskScore") || "Risk Score") + `: ${risk.riskScore}`}
                </span>
              </div>
              <p className="font-medium text-sm dark:text-dark-brand-text-primary">
                {risk.title}
              </p>
              <p className="text-xs text-gray-500 mb-1">
                {risk.labSection} •{" "}
                {(t("owner") || "Owner") + `: ${risk.owner}`}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {risk.hazard}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAnalyzeRisk(risk)}
                  disabled={aiLoadingId === risk.id}
                  className="text-sky-600 dark:text-sky-400"
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  {aiLoadingId === risk.id
                    ? t("aiAnalyzing") || "Analyzing…"
                    : t("aiAnalyzeRisk") || "Analyze Risk"}
                </Button>
                {!risk.relatedCapaId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateCapaFromRisk(risk)}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {t("createCapaFromRisk") || "Create CAPA"}
                  </Button>
                )}
                {risk.status !== "closed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markRiskClosed(risk)}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    {t("markClosed") || "Mark Closed"}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filteredRisks.length === 0 && (
            <p className="text-sm text-gray-400">
              {t("noRiskRecords") || "No risk records found"}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
          {t("riskHeatmap") || "Risk Heatmap (Likelihood x Impact)"}
        </h3>
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {t("impactAxis") || "Impact"} (1-5)
          </p>
          <div className="grid grid-cols-6 gap-1 text-xs">
            <div />
            {[1, 2, 3, 4, 5].map((impactVal) => (
              <div
                key={`impact-${impactVal}`}
                className="text-center text-gray-500"
              >
                {impactVal}
              </div>
            ))}

            {[5, 4, 3, 2, 1].map((likelihoodVal) => (
              <React.Fragment key={`row-${likelihoodVal}`}>
                <div className="flex items-center justify-center text-gray-500">
                  {likelihoodVal}
                </div>
                {[1, 2, 3, 4, 5].map((impactVal) => {
                  const score = likelihoodVal * impactVal;
                  const count =
                    heatmapCounts[`${likelihoodVal}-${impactVal}`] || 0;
                  const color =
                    score >= 15
                      ? "bg-red-200 dark:bg-red-900/40"
                      : score >= 10
                        ? "bg-yellow-200 dark:bg-yellow-900/40"
                        : score >= 5
                          ? "bg-blue-200 dark:bg-blue-900/40"
                          : "bg-green-200 dark:bg-green-900/40";

                  return (
                    <div
                      key={`${likelihoodVal}-${impactVal}`}
                      className={`h-10 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center ${color}`}
                      title={`${t("likelihood") || "Likelihood"}: ${likelihoodVal}, ${t("impact") || "Impact"}: ${impactVal}, ${t("riskScore") || "Risk Score"}: ${score}, ${t("count") || "Count"}: ${count}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {t("likelihoodAxis") || "Likelihood"} (1-5)
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
          {t("traceabilityView") || "Nonconformance to Risk to CAPA"}
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {traceabilityRows.map(
            ({ event, linkedRisks, linkedCAPA, rollupStatus }) => {
              const rollupColor =
                rollupStatus === "closed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : rollupStatus === "in_progress"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";

              return (
                <div
                  key={event.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${rollupColor}`}
                    >
                      {rollupStatus === "closed"
                        ? t("statusClosed") || "Closed"
                        : rollupStatus === "in_progress"
                          ? t("statusInProgress") || "In Progress"
                          : t("statusOpen") || "Open"}
                    </span>
                    <span className="text-xs text-gray-500">{event.id}</span>
                  </div>
                  <p className="font-medium text-sm dark:text-dark-brand-text-primary">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(t("linkedRisks") || "Linked Risks") +
                      `: ${linkedRisks.length}`}{" "}
                    •{" "}
                    {(t("linkedCAPA") || "Linked CAPA") +
                      `: ${linkedCAPA.length}`}
                  </p>
                </div>
              );
            },
          )}
          {traceabilityRows.length === 0 && (
            <p className="text-sm text-gray-400">
              {t("noTraceabilityRecords") || "No traceability records found"}
            </p>
          )}
        </div>
      </Card>

      {(criticalOpen > 0 || overdueCAPA > 0 || openHighRisks > 0) && (
        <Card className="p-4 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {t("qualityEscalationHint") ||
                "Critical/open quality risks require immediate review in quality huddle."}
            </p>
          </div>
        </Card>
      )}

      {aiModal?.open && (
        <AISuggestionModal
          isOpen={aiModal.open}
          onClose={() => setAiModal(null)}
          title={aiModal.title}
          content={aiModal.content}
          type={aiModal.type}
        />
      )}
    </div>
  );
};

export default QualityManagementTab;
