import React, { useMemo, useState, useCallback } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
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
} from "@/components/icons";

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

const RESULT_STYLES: Record<string, { label: string; cls: string }> = {
  compliant: {
    label: "Compliant",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  partial: {
    label: "Partial",
    cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  non_compliant: {
    label: "Non-Compliant",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  not_observed: {
    label: "Not Observed",
    cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

type ViewMode = "templates" | "sessions" | "conduct";

const TracerWorksheetTab: React.FC = () => {
  const { currentUser, users } = useUserStore();
  const { departments } = useAppStore();
  const isAdmin = currentUser?.role === UserRole.Admin;

  const [view, setView] = useState<ViewMode>("templates");
  const [sessions, setSessions] = useState<TracerSession[]>([]);
  const [activeSession, setActiveSession] = useState<TracerSession | null>(
    null,
  );
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTemplates = useMemo(
    () =>
      filterType === "all"
        ? BUILTIN_TEMPLATES
        : BUILTIN_TEMPLATES.filter((t) => t.tracerType === filterType),
    [filterType],
  );

  const startTracer = useCallback(
    (tmpl: TracerTemplate) => {
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
      setSessions((prev) => [...prev, session]);
      setActiveSession(session);
      setActiveStepIdx(0);
      setView("conduct");
    },
    [currentUser],
  );

  const updateCheckpoint = useCallback(
    (
      stepIdx: number,
      cpIdx: number,
      field: keyof TracerCheckpoint,
      value: string,
    ) => {
      if (!activeSession) return;
      setActiveSession((prev) => {
        if (!prev) return prev;
        const steps = [...prev.steps];
        const step = {
          ...steps[stepIdx],
          checkpoints: [...steps[stepIdx].checkpoints],
        };
        step.checkpoints[cpIdx] = {
          ...step.checkpoints[cpIdx],
          [field]: value,
        };
        steps[stepIdx] = step;
        return { ...prev, steps };
      });
    },
    [activeSession],
  );

  const completeSession = useCallback(() => {
    if (!activeSession) return;
    const completed = {
      ...activeSession,
      status: "completed" as const,
      completedAt: new Date().toISOString(),
    };
    setSessions((prev) =>
      prev.map((s) => (s.id === completed.id ? completed : s)),
    );
    setActiveSession(null);
    setView("sessions");
  }, [activeSession]);

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
            Tracer Methodology
          </h3>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Patient, system, and program-specific tracer worksheets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "templates" ? "primary" : "ghost"}
            onClick={() => setView("templates")}
            className="text-xs"
          >
            Templates
          </Button>
          <Button
            variant={view === "sessions" ? "primary" : "ghost"}
            onClick={() => setView("sessions")}
            className="text-xs"
          >
            Sessions ({sessions.length})
          </Button>
        </div>
      </div>

      {/* ── Templates ── */}
      {view === "templates" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`${inputCls} w-auto`}
            >
              <option value="all">All Types</option>
              {Object.entries(TRACER_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
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
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {TRACER_TYPE_LABELS[tmpl.tracerType]}
                    </span>
                    <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {tmpl.name}
                    </h4>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => startTracer(tmpl)}
                    className="text-xs shrink-0"
                  >
                    Start
                  </Button>
                </div>
                <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
                  {tmpl.description}
                </p>
                <div className="flex gap-3 text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  <span>{tmpl.steps.length} departments</span>
                  <span>
                    {tmpl.steps.reduce((s, st) => s + st.checkpoints.length, 0)}{" "}
                    checkpoints
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
              title="No Tracer Sessions"
              description="Start a tracer from the Templates tab."
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
                      Tracer
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Type
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Date
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Progress
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Compliance
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      Action
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
                          {TRACER_TYPE_LABELS[s.tracerType]}
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
                            {s.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => resumeSession(s)}
                            className="text-brand-primary-600 dark:text-brand-primary-400 hover:underline text-xs"
                          >
                            {s.status === "completed" ? "Review" : "Continue"}
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
                    Step {step.order}: {step.department} — {step.area}
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
                          ([key, { label, cls }]) => (
                            <button
                              key={key}
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
                              {label}
                            </button>
                          ),
                        )}
                      </div>
                      {(cp.result === "partial" ||
                        cp.result === "non_compliant") && (
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
                          placeholder="Findings / observations..."
                          rows={2}
                          className={`${inputCls} ml-4`}
                        />
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
              disabled={activeStepIdx === 0}
              onClick={() => setActiveStepIdx((i) => i - 1)}
              className="text-xs"
            >
              ← Previous
            </Button>
            {activeStepIdx < activeSession.steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setActiveStepIdx((i) => i + 1)}
                className="text-xs"
              >
                Next →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={completeSession}
                className="text-xs"
              >
                Complete Tracer
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TracerWorksheetTab;
