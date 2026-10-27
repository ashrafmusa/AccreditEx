import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  TracerType,
  TracerTemplate,
  TracerSession,
  TracerStep,
  TracerCheckpoint,
  TRACER_TYPE_LABELS,
  UserRole,
} from "@/types";
import { Button, EmptyState } from "@/components/ui";
import {
  PlusIcon,
  CheckCircleIcon,
  ClipboardDocumentSearchIcon,
  SparklesIcon,
} from "@/components/icons";
import {
  getTenantTracerTemplates,
  getTracerSessions,
  getTracerTemplates,
  saveTracerSession,
  saveTracerTemplate,
} from "@/services/tracerPersistenceService";

// ── Built-in Tracer Templates ──

const uid = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const BUILTIN_TEMPLATES: TracerTemplate[] = [
  {
    id: "tmpl-patient-tracer",
    name: "Patient Tracer — General Inpatient",
    tracerType: "patient",
    description:
      "Follow a patient journey from admission through discharge, evaluating care transitions, medication management, infection prevention, and patient rights at each step.",
    programRef: "JCI / CBAHI",
    createdAt: "2026-01-01",
    steps: [
      {
        id: "ps-1",
        order: 1,
        department: "Emergency Department",
        area: "Triage / Initial Assessment",
        checkpoints: [
          {
            id: "pc-1a",
            question: "Was the patient identified using two identifiers?",
            standardRef: "IPSG.1",
          },
          {
            id: "pc-1b",
            question:
              "Was a triage assessment completed within the facility target time?",
            standardRef: "ACC.1",
          },
          {
            id: "pc-1c",
            question: "Were allergies documented and visible on the chart?",
            standardRef: "IPSG.5",
          },
          {
            id: "pc-1d",
            question:
              "Was informed consent obtained before any invasive procedure?",
            standardRef: "PCC.4",
          },
        ],
      },
      {
        id: "ps-2",
        order: 2,
        department: "Nursing Unit",
        area: "Admission & Nursing Assessment",
        checkpoints: [
          {
            id: "pc-2a",
            question:
              "Was a comprehensive nursing assessment completed within 24h?",
            standardRef: "COP.2",
          },
          {
            id: "pc-2b",
            question: "Was fall risk assessed and documented?",
            standardRef: "IPSG.6",
          },
          {
            id: "pc-2c",
            question: "Were high-risk medications double-checked per policy?",
            standardRef: "IPSG.3",
          },
          {
            id: "pc-2d",
            question: "Was hand hygiene observed at point of care?",
            standardRef: "PCI.5",
          },
        ],
      },
      {
        id: "ps-3",
        order: 3,
        department: "Pharmacy",
        area: "Medication Management",
        checkpoints: [
          {
            id: "pc-3a",
            question:
              "Was the medication order reviewed by a pharmacist before dispensing?",
            standardRef: "MMU.4",
          },
          {
            id: "pc-3b",
            question:
              "Were look-alike/sound-alike medications stored separately and labeled?",
            standardRef: "IPSG.3",
          },
          {
            id: "pc-3c",
            question:
              "Was the medication reconciliation completed at transition?",
            standardRef: "IPSG.3",
          },
        ],
      },
      {
        id: "ps-4",
        order: 4,
        department: "Laboratory",
        area: "Specimen Collection & Reporting",
        checkpoints: [
          {
            id: "pc-4a",
            question:
              "Was specimen labeled at bedside with two patient identifiers?",
            standardRef: "IPSG.1",
          },
          {
            id: "pc-4b",
            question: "Were critical results communicated and read back?",
            standardRef: "IPSG.2",
          },
          {
            id: "pc-4c",
            question: "Was turnaround time within established targets?",
            standardRef: "AOP.5",
          },
        ],
      },
      {
        id: "ps-5",
        order: 5,
        department: "Discharge Planning",
        area: "Discharge & Follow-up",
        checkpoints: [
          {
            id: "pc-5a",
            question:
              "Were discharge instructions provided in patient's language?",
            standardRef: "PCC.3",
          },
          {
            id: "pc-5b",
            question: "Was medication reconciliation completed at discharge?",
            standardRef: "IPSG.3",
          },
          {
            id: "pc-5c",
            question: "Was follow-up appointment scheduled and communicated?",
            standardRef: "ACC.4",
          },
        ],
      },
    ],
  },
  {
    id: "tmpl-system-tracer-ic",
    name: "System Tracer — Infection Prevention & Control",
    tracerType: "system",
    description:
      "Evaluate the infection prevention and control program across the facility, including surveillance, hand hygiene, environmental cleaning, and sterilization.",
    programRef: "JCI PCI / CBAHI IC",
    createdAt: "2026-01-01",
    steps: [
      {
        id: "ss-1",
        order: 1,
        department: "Infection Control Office",
        area: "Surveillance & Reporting",
        checkpoints: [
          {
            id: "sc-1a",
            question: "Is there an active surveillance program for HAIs?",
            standardRef: "PCI.6",
          },
          {
            id: "sc-1b",
            question: "Are infection rates calculated and benchmarked monthly?",
            standardRef: "PCI.6",
          },
          {
            id: "sc-1c",
            question:
              "Is there a mechanism for outbreak investigation and rapid response?",
            standardRef: "PCI.7",
          },
        ],
      },
      {
        id: "ss-2",
        order: 2,
        department: "Clinical Areas",
        area: "Hand Hygiene Compliance",
        checkpoints: [
          {
            id: "sc-2a",
            question: "Are hand hygiene stations accessible at point of care?",
            standardRef: "PCI.5",
          },
          {
            id: "sc-2b",
            question: "Is hand hygiene compliance monitored and the rate ≥80%?",
            standardRef: "PCI.5",
          },
          {
            id: "sc-2c",
            question:
              "Is the '5 moments' framework known to staff (ask 2 staff)?",
            standardRef: "PCI.5",
          },
        ],
      },
      {
        id: "ss-3",
        order: 3,
        department: "CSSD / Sterilization",
        area: "Reprocessing & Sterilization",
        checkpoints: [
          {
            id: "sc-3a",
            question:
              "Are sterilization logs maintained with biological indicators?",
            standardRef: "PCI.7",
          },
          {
            id: "sc-3b",
            question:
              "Is the instrument reprocessing workflow compliant with national standards?",
            standardRef: "PCI.7",
          },
        ],
      },
      {
        id: "ss-4",
        order: 4,
        department: "Environmental Services",
        area: "Cleaning & Waste Management",
        checkpoints: [
          {
            id: "sc-4a",
            question: "Are cleaning schedules posted and followed?",
            standardRef: "FMS.4",
          },
          {
            id: "sc-4b",
            question: "Is biomedical waste segregated and disposed per policy?",
            standardRef: "PCI.7",
          },
          {
            id: "sc-4c",
            question:
              "Are terminal cleaning procedures documented for isolation rooms?",
            standardRef: "PCI.7",
          },
        ],
      },
    ],
  },
  {
    id: "tmpl-system-tracer-fm",
    name: "System Tracer — Facility Management & Safety",
    tracerType: "system",
    description:
      "Evaluate the environment of care program including fire safety, utilities management, medical equipment, and emergency preparedness.",
    programRef: "JCI FMS / CBAHI FMS",
    createdAt: "2026-01-01",
    steps: [
      {
        id: "fs-1",
        order: 1,
        department: "Facility Management",
        area: "Safety Plan & Committee",
        checkpoints: [
          {
            id: "fc-1a",
            question:
              "Is there a current facility management safety plan approved by leadership?",
            standardRef: "FMS.1",
          },
          {
            id: "fc-1b",
            question:
              "Are safety committee meetings held monthly with documented minutes?",
            standardRef: "FMS.2",
          },
        ],
      },
      {
        id: "fs-2",
        order: 2,
        department: "Clinical Areas",
        area: "Fire Safety & Emergency Codes",
        checkpoints: [
          {
            id: "fc-2a",
            question:
              "Can 2 staff members demonstrate knowledge of fire response (RACE)?",
            standardRef: "FMS.7",
          },
          {
            id: "fc-2b",
            question: "Are fire exits unobstructed and clearly marked?",
            standardRef: "FMS.7",
          },
          {
            id: "fc-2c",
            question: "Were fire drills conducted per required frequency?",
            standardRef: "FMS.7",
          },
        ],
      },
      {
        id: "fs-3",
        order: 3,
        department: "Biomedical Engineering",
        area: "Medical Equipment",
        checkpoints: [
          {
            id: "fc-3a",
            question: "Is there a current inventory of all medical equipment?",
            standardRef: "FMS.8",
          },
          {
            id: "fc-3b",
            question:
              "Are preventive maintenance schedules current (no overdue items)?",
            standardRef: "FMS.8",
          },
          {
            id: "fc-3c",
            question:
              "Is equipment recall process documented and recent recalls managed?",
            standardRef: "FMS.8",
          },
        ],
      },
      {
        id: "fs-4",
        order: 4,
        department: "Utilities",
        area: "Utility Systems Management",
        checkpoints: [
          {
            id: "fc-4a",
            question: "Is emergency power tested monthly under load?",
            standardRef: "FMS.9",
          },
          {
            id: "fc-4b",
            question: "Is medical gas system inspected per schedule?",
            standardRef: "FMS.9",
          },
          {
            id: "fc-4c",
            question: "Is water quality monitoring performed per policy?",
            standardRef: "FMS.9",
          },
        ],
      },
    ],
  },
  {
    id: "tmpl-program-tracer-mm",
    name: "Program Tracer — Medication Management",
    tracerType: "program",
    description:
      "Trace the medication management system from selection/procurement through prescribing, dispensing, administration, and monitoring.",
    programRef: "JCI MMU / CBAHI MM",
    createdAt: "2026-01-01",
    steps: [
      {
        id: "ms-1",
        order: 1,
        department: "P&T Committee / Pharmacy",
        area: "Selection & Procurement",
        checkpoints: [
          {
            id: "mc-1a",
            question:
              "Is there a current formulary approved by the P&T committee?",
            standardRef: "MMU.1",
          },
          {
            id: "mc-1b",
            question:
              "Is there a process for non-formulary medication requests?",
            standardRef: "MMU.1",
          },
        ],
      },
      {
        id: "ms-2",
        order: 2,
        department: "Pharmacy",
        area: "Storage & Preparation",
        checkpoints: [
          {
            id: "mc-2a",
            question:
              "Are high-alert medications identified, labeled, and stored per policy?",
            standardRef: "MMU.3",
          },
          {
            id: "mc-2b",
            question:
              "Are concentrated electrolytes removed from patient care areas?",
            standardRef: "IPSG.3",
          },
          {
            id: "mc-2c",
            question: "Are refrigerator temperatures logged and within range?",
            standardRef: "MMU.3",
          },
        ],
      },
      {
        id: "ms-3",
        order: 3,
        department: "Nursing Unit",
        area: "Administration & Monitoring",
        checkpoints: [
          {
            id: "mc-3a",
            question:
              "Are the 5 Rights verified before each medication administration?",
            standardRef: "MMU.6",
          },
          {
            id: "mc-3b",
            question:
              "Is medication administration timed and documented in real-time?",
            standardRef: "MMU.6",
          },
          {
            id: "mc-3c",
            question:
              "Are adverse drug reactions reported through the incident system?",
            standardRef: "MMU.7",
          },
        ],
      },
    ],
  },
];

const RESULT_STYLES: Record<string, { labelKey: string; cls: string }> = {
  compliant: {
    labelKey: "tracerCompliant",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  partial: {
    labelKey: "tracerPartial",
    cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  non_compliant: {
    labelKey: "tracerNonCompliant",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  not_observed: {
    labelKey: "tracerNotObserved",
    cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

type ViewMode = "templates" | "sessions" | "conduct";

const TRACER_TYPE_LABEL_KEYS: Record<TracerType, string> = {
  patient: "tracerPatient",
  system: "tracerSystem",
  program: "tracerProgram",
};

const TracerWorksheetTab: React.FC = () => {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const { currentUser, users } = useUserStore();
  const { departments, addRisk } = useAppStore();
  const { projects, createCAPA } = useProjectStore();
  const toast = useToast();
  const isAdmin = currentUser?.role === UserRole.Admin;
  const [escalatingCpId, setEscalatingCpId] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("templates");
  const [sessions, setSessions] = useState<TracerSession[]>([]);
  const [activeSession, setActiveSession] = useState<TracerSession | null>(
    null,
  );
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [templates, setTemplates] =
    useState<TracerTemplate[]>(BUILTIN_TEMPLATES);

  useEffect(() => {
    let isCurrent = true;
    const loadTracerData = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const [storedTemplates, storedSessions] = await Promise.all([
          getTracerTemplates(),
          getTracerSessions(),
        ]);
        let templates = storedTemplates;
        if (isAdmin) {
          const tenantDefaults = getTenantTracerTemplates(BUILTIN_TEMPLATES);
          const storedIds = new Set(storedTemplates.map((template) => template.id));
          const missingDefaults = tenantDefaults.filter(
            (template) => !storedIds.has(template.id),
          );
          if (missingDefaults.length > 0) {
            await Promise.all(missingDefaults.map(saveTracerTemplate));
          }
          templates = [...storedTemplates, ...missingDefaults];
        } else if (templates.length === 0) {
          templates = BUILTIN_TEMPLATES;
        }
        if (isCurrent) {
          setSessions(storedSessions);
          setTemplates(templates);
        }
      } catch (error) {
        console.error("Failed to load tracer records:", error);
        if (isCurrent) setLoadError(t("tracerLoadFailed"));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadTracerData();
    return () => {
      isCurrent = false;
    };
  }, [isAdmin, t]);

  const filteredTemplates = useMemo(
    () =>
      filterType === "all"
        ? templates
        : templates.filter((template) => template.tracerType === filterType),
    [filterType, templates],
  );

  const persistSession = useCallback(
    async (session: TracerSession): Promise<boolean> => {
      setIsSaving(true);
      setSaveError("");
      try {
        await saveTracerSession(session);
        return true;
      } catch (error) {
        console.error("Failed to save tracer session:", error);
        setSaveError(t("tracerSaveFailed"));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [t],
  );

  const startTracer = useCallback(
    async (tmpl: TracerTemplate) => {
      if (!currentUser?.id) {
        setSaveError(t("tracerSaveFailed"));
        return;
      }
      const session: TracerSession = {
        id: uid(),
        templateId: tmpl.id,
        tracerType: tmpl.tracerType,
        title: tmpl.name,
        surveyorId: currentUser?.id ?? "",
        date: new Date().toISOString().split("T")[0],
        steps: JSON.parse(JSON.stringify(tmpl.steps)),
        status: "in_progress",
        createdAt: new Date().toISOString(),
      };
      if (!(await persistSession(session))) return;
      setSessions((prev) => [...prev, session]);
      setActiveSession(session);
      setActiveStepIdx(0);
      setView("conduct");
    },
    [currentUser, persistSession, t],
  );

  const updateCheckpoint = useCallback(
    (
      stepIdx: number,
      cpIdx: number,
      field: keyof TracerCheckpoint,
      value: string,
    ) => {
      if (!activeSession) return;
      const steps = [...activeSession.steps];
      const step = {
        ...steps[stepIdx],
        checkpoints: [...steps[stepIdx].checkpoints],
      };
      step.checkpoints[cpIdx] = {
        ...step.checkpoints[cpIdx],
        [field]: value,
      };
      steps[stepIdx] = step;
      const updated = { ...activeSession, steps };
      setActiveSession(updated);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === updated.id ? updated : session,
        ),
      );
      if (field === "result") void persistSession(updated);
    },
    [activeSession, persistSession],
  );

  const completeSession = useCallback(async () => {
    if (!activeSession) return;
    const completed = {
      ...activeSession,
      status: "completed" as const,
      completedAt: new Date().toISOString(),
    };
    if (!(await persistSession(completed))) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === completed.id ? completed : s)),
    );
    setActiveSession(null);
    setView("sessions");
  }, [activeSession, persistSession]);

  const resumeSession = useCallback((s: TracerSession) => {
    setActiveSession(s);
    setActiveStepIdx(0);
    setView("conduct");
  }, []);

  // Session stats
  const sessionStats = useCallback((s: TracerSession) => {
    let total = 0,
      answered = 0,
      comp = 0,
      nc = 0;
    s.steps.forEach((st) =>
      st.checkpoints.forEach((cp) => {
        total++;
        if (cp.result) {
          answered++;
          if (cp.result === "compliant") comp++;
          if (cp.result === "non_compliant") nc++;
        }
      }),
    );
    return {
      total,
      answered,
      comp,
      nc,
      pct: total > 0 ? Math.round((comp / total) * 100) : 0,
    };
  }, []);

  const inputCls =
    "text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary w-full";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("tracerMethodology")}
          </h3>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("tracerMethodologyDescription")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "templates" ? "primary" : "ghost"}
            onClick={() => setView("templates")}
            className="text-xs"
          >
            {t("tracerTemplates")}
          </Button>
          <Button
            variant={view === "sessions" ? "primary" : "ghost"}
            onClick={() => setView("sessions")}
            className="text-xs"
          >
            {t("tracerSessions")} ({sessions.length})
          </Button>
        </div>
      </div>

      {isLoading && (
        <p role="status" className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("tracerLoading")}
        </p>
      )}
      {loadError && (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      )}
      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}

      {/* ── Templates ── */}
      {view === "templates" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`${inputCls} w-auto`}
            >
              <option value="all">{t("tracerAllTypes")}</option>
              {Object.entries(TRACER_TYPE_LABEL_KEYS).map(([k, labelKey]) => (
                <option key={k} value={k}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="border border-brand-border dark:border-dark-brand-border rounded-lg p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${
                        tmpl.tracerType === "patient"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : tmpl.tracerType === "system"
                            ? "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/90/30 dark:text-brand-primary"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {t(TRACER_TYPE_LABEL_KEYS[tmpl.tracerType])}
                    </span>
                    <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {tmpl.name}
                    </h4>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => startTracer(tmpl)}
                    disabled={isLoading || isSaving}
                    className="text-xs shrink-0"
                  >
                    {t("tracerStart")}
                  </Button>
                </div>
                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
                  {tmpl.description}
                </p>
                <div className="flex gap-3 text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  <span>
                    {tmpl.steps.length} {t("tracerDepartments")}
                  </span>
                  <span>
                    {tmpl.steps.reduce((s, st) => s + st.checkpoints.length, 0)}{" "}
                    {t("tracerCheckpoints")}
                  </span>
                  {tmpl.programRef && <span>{tmpl.programRef}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sessions List ── */}
      {view === "sessions" && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <EmptyState
              title={t("tracerNoSessions")}
              description={t("tracerNoSessionsDescription")}
              icon={
                <ClipboardDocumentSearchIcon className="h-10 w-10 text-gray-400" />
              }
            />
          ) : (
            <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnTracer")}
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnType")}
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnDate")}
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnProgress")}
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnCompliance")}
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnStatus")}
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {t("tracerColumnAction")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
                  {sessions.map((s) => {
                    const st = sessionStats(s);
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-3 py-2 font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                          {s.title}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {t(TRACER_TYPE_LABEL_KEYS[s.tracerType])}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {s.date}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {st.answered}/{st.total}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`text-xs font-semibold ${st.pct >= 80 ? "text-green-600" : st.pct >= 60 ? "text-yellow-600" : "text-red-600"}`}
                          >
                            {st.pct}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              s.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : s.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {s.status === "completed"
                              ? t("tracerCompleted")
                              : t("tracerInProgress")}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => resumeSession(s)}
                            className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                          >
                            {s.status === "completed"
                              ? t("tracerReview")
                              : t("tracerContinue")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Conduct Tracer ── */}
      {view === "conduct" && activeSession && (
        <div className="space-y-4">
          {/* Step Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {activeSession.steps.map((step, idx) => {
              const answered = step.checkpoints.filter(
                (cp) => cp.result,
              ).length;
              const total = step.checkpoints.length;
              const isCurrent = idx === activeStepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    isCurrent
                      ? "bg-brand-primary-600 text-white border-brand-primary-600"
                      : answered === total && total > 0
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : "bg-brand-surface dark:bg-dark-brand-surface text-brand-text-secondary dark:text-dark-brand-text-secondary border-brand-border dark:border-dark-brand-border"
                  }`}
                >
                  <div>{step.department}</div>
                  <div className="text-[10px] opacity-80">
                    {answered}/{total}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Content */}
          {(() => {
            const step = activeSession.steps[activeStepIdx];
            if (!step) return null;
            return (
              <div className="border border-brand-border dark:border-dark-brand-border rounded-lg">
                <div className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt px-4 py-3 border-b border-brand-border dark:border-dark-brand-border">
                  <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {t("tracerStep")} {step.order}: {step.department} —{" "}
                    {step.area}
                  </h4>
                </div>
                <div className="divide-y divide-brand-border/50 dark:divide-dark-brand-border/50">
                  {step.checkpoints.map((cp, cpIdx) => (
                    <div key={cp.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                          {cpIdx + 1}.
                        </span>
                        <div className="grow">
                          <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                            {cp.question}
                          </p>
                          {cp.standardRef && (
                            <span className="text-[10px] text-brand-primary-600 dark:text-brand-primary-400">
                              {cp.standardRef}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-4">
                        {Object.entries(RESULT_STYLES).map(
                          ([key, { labelKey, cls }]) => (
                            <button
                              key={key}
                              disabled={isSaving}
                              onClick={() =>
                                updateCheckpoint(
                                  activeStepIdx,
                                  cpIdx,
                                  "result",
                                  key,
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                cp.result === key
                                  ? `${cls} ring-2 ring-offset-1 ring-brand-primary-400`
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:opacity-80"
                              }`}
                            >
                              {t(labelKey)}
                            </button>
                          ),
                        )}
                      </div>
                      {(cp.result === "partial" ||
                        cp.result === "non_compliant") && (
                        <div className="ml-4 space-y-2">
                          <textarea
                            value={cp.findings ?? ""}
                            onChange={(e) =>
                              updateCheckpoint(
                                activeStepIdx,
                                cpIdx,
                                "findings",
                                e.target.value,
                              )
                            }
                            placeholder={t("tracerFindingsPlaceholder")}
                            rows={2}
                            className={inputCls}
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={escalatingCpId === cp.id}
                              onClick={async () => {
                                if (!currentUser || escalatingCpId) return;
                                setEscalatingCpId(cp.id);
                                try {
                                  const targetProject = projects.find(
                                    (p) => !p.archived,
                                  );
                                  const dueDate = new Date(
                                    Date.now() + 14 * 24 * 60 * 60 * 1000,
                                  ).toISOString();
                                  const detailText =
                                    cp.findings?.trim() ||
                                    `Non-compliance observed during ${activeSession.title} (${step.department} — ${step.area})`;

                                  if (targetProject) {
                                    await createCAPA(targetProject.id, {
                                      checklistItemId:
                                        cp.standardRef || cp.id,
                                      description: `Tracer Finding [${cp.standardRef || step.department}]: ${cp.question}`,
                                      rootCause: detailText,
                                      correctiveAction: `Implement immediate corrective action in ${step.department} (${step.area}) for ${cp.standardRef || "standard"}.`,
                                      preventiveAction:
                                        "Re-audit checkpoint during next monthly clinical tracer round.",
                                      status: "Open" as any,
                                      assignedTo: currentUser.id,
                                      dueDate,
                                      pdcaStage: "Plan",
                                      pdcaHistory: [],
                                    } as any);
                                  }

                                  await addRisk({
                                    title: `Tracer Finding (${cp.standardRef || step.department}): ${cp.question.slice(0, 65)}`,
                                    description: `${detailText} [Tracer: ${activeSession.title}]`,
                                    likelihood:
                                      cp.result === "non_compliant" ? 4 : 3,
                                    impact: 4,
                                    ownerId: currentUser.id,
                                    status: "Open",
                                    mitigationPlan: `Complete CAPA verification in ${step.department} (${step.area}).`,
                                    createdAt: new Date().toISOString(),
                                  });

                                  toast.success(
                                    isAr
                                      ? "تم تصعيد ملاحظة المتتبع إلى تقرير CAPA وسجل المخاطر بنجاح"
                                      : "Escalated tracer finding to CAPA & Risk Register",
                                  );
                                } catch (err) {
                                  console.error(
                                    "Failed to escalate tracer finding:",
                                    err,
                                  );
                                  toast.error(
                                    isAr
                                      ? "تعذر تصعيد الملاحظة"
                                      : "Failed to escalate tracer finding",
                                  );
                                } finally {
                                  setEscalatingCpId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1 text-xs font-semibold transition-colors"
                            >
                              <SparklesIcon className="w-3.5 h-3.5" />
                              {escalatingCpId === cp.id
                                ? isAr
                                  ? "جاري التصعيد..."
                                  : "Escalating..."
                                : isAr
                                  ? "تصعيد إلى CAPA وسجل المخاطر"
                                  : "Escalate to CAPA & Risk"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              disabled={isSaving}
              onClick={() => {
                if (activeSession) void persistSession(activeSession);
              }}
              className="text-xs"
            >
              {isSaving ? t("tracerSaving") : t("tracerSaveProgress")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={activeStepIdx === 0}
                onClick={() => setActiveStepIdx((i) => i - 1)}
                className="text-xs"
              >
                {t("tracerPrevious")}
              </Button>
              {activeStepIdx < activeSession.steps.length - 1 ? (
                <Button
                  variant="primary"
                  disabled={isSaving}
                  onClick={() => setActiveStepIdx((i) => i + 1)}
                  className="text-xs"
                >
                  {t("tracerNext")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={isSaving}
                  onClick={completeSession}
                  className="text-xs"
                >
                  {t("tracerComplete")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TracerWorksheetTab;
