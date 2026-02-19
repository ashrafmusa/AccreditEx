import React, { useState, useMemo } from "react";
import {
  LearningPath,
  LearningPathStep,
  UserLearningPathProgress,
  LEARNING_PATH_CATEGORY_LABELS,
  UserRole,
} from "@/types";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
} from "@/components/icons";
import { useUserStore } from "@/stores/useUserStore";

// ── Seed data: 4 built-in learning paths ──────────────────

const SEED_PATHS: LearningPath[] = [
  {
    id: "lp-onboard-clinical",
    title: "New Clinical Staff Onboarding",
    description:
      "Comprehensive onboarding pathway for newly hired clinical staff, covering orientation, safety, and compliance essentials.",
    category: "onboarding",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Hospital Orientation & Policies",
        type: "reading",
        description:
          "Review organizational policies, mission, and code of conduct.",
        estimatedMinutes: 60,
        requiredForCompletion: true,
      },
      {
        id: "s2",
        order: 2,
        title: "Infection Prevention Fundamentals",
        type: "training",
        description:
          "Complete the Infection Control training module (WHO 5 Moments).",
        estimatedMinutes: 45,
        requiredForCompletion: true,
      },
      {
        id: "s3",
        order: 3,
        title: "Patient Safety & National Safety Goals",
        type: "training",
        description:
          "JCI/CBAHI patient safety goals: identification, communication, medication safety.",
        estimatedMinutes: 60,
        requiredForCompletion: true,
      },
      {
        id: "s4",
        order: 4,
        title: "Fire & Life Safety",
        type: "training",
        description:
          "RACE/PASS procedure, evacuation routes, fire extinguisher use.",
        estimatedMinutes: 30,
        requiredForCompletion: true,
      },
      {
        id: "s5",
        order: 5,
        title: "BLS Certification Verification",
        type: "external_ce",
        description:
          "Provide evidence of current BLS certification from an approved provider.",
        externalProvider: {
          providerName: "American Heart Association",
          creditCategory: "CME",
          credits: 4,
        },
        estimatedMinutes: 0,
        requiredForCompletion: true,
      },
      {
        id: "s6",
        order: 6,
        title: "Competency Assessment",
        type: "assessment",
        description:
          "Pass the onboarding competency assessment (≥80% passing score).",
        estimatedMinutes: 30,
        requiredForCompletion: true,
      },
    ],
    estimatedHours: 4,
    ceCreditsTotal: 4,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: "lp-annual-compliance",
    title: "Annual Compliance Refresher",
    description:
      "Yearly mandatory training covering regulatory updates, safety refreshers, and compliance documentation requirements.",
    category: "compliance",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "CBAHI/JCI Standards Update",
        type: "reading",
        description:
          "Review latest accreditation standard changes for the current survey cycle.",
        estimatedMinutes: 45,
        requiredForCompletion: true,
      },
      {
        id: "s2",
        order: 2,
        title: "Infection Control Annual Update",
        type: "training",
        description:
          "Annual IC refresher: hand hygiene audit results, SSI bundles, antimicrobial stewardship.",
        estimatedMinutes: 30,
        requiredForCompletion: true,
      },
      {
        id: "s3",
        order: 3,
        title: "Patient Rights & Ethical Practice",
        type: "training",
        description: "Informed consent, confidentiality, cultural competence.",
        estimatedMinutes: 30,
        requiredForCompletion: true,
      },
      {
        id: "s4",
        order: 4,
        title: "Environment of Care & Hazmat",
        type: "training",
        description:
          "Hazardous materials handling, waste segregation, spill response.",
        estimatedMinutes: 30,
        requiredForCompletion: true,
      },
      {
        id: "s5",
        order: 5,
        title: "Compliance Attestation",
        type: "assessment",
        description: "Sign the annual compliance acknowledgment form.",
        estimatedMinutes: 10,
        requiredForCompletion: true,
      },
    ],
    estimatedHours: 2.5,
    ceCreditsTotal: 0,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: "lp-lab-safety",
    title: "Laboratory Safety & Quality Pathway",
    description:
      "Structured training for laboratory personnel covering CAP/CLIA compliance, QC procedures, and specimen handling.",
    category: "safety",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "CAP Accreditation Overview",
        type: "reading",
        description:
          "Introduction to CAP Laboratory Accreditation Program and the 6 elements.",
        estimatedMinutes: 45,
        requiredForCompletion: true,
      },
      {
        id: "s2",
        order: 2,
        title: "Specimen Collection & Handling",
        type: "training",
        description:
          "Pre-analytical processes: patient ID, labeling, transport, rejection criteria.",
        estimatedMinutes: 45,
        requiredForCompletion: true,
      },
      {
        id: "s3",
        order: 3,
        title: "Quality Control Fundamentals",
        type: "training",
        description:
          "Levey-Jennings charts, Westgard rules, corrective actions for QC failures.",
        estimatedMinutes: 60,
        requiredForCompletion: true,
      },
      {
        id: "s4",
        order: 4,
        title: "Chemical Hygiene & Lab Safety",
        type: "training",
        description:
          "SDS review, PPE selection, chemical spill response, biosafety levels.",
        estimatedMinutes: 45,
        requiredForCompletion: true,
      },
      {
        id: "s5",
        order: 5,
        title: "Lab Safety CE Module",
        type: "external_ce",
        description:
          "Complete ASCP-approved laboratory safety continuing education module.",
        externalProvider: {
          providerName: "ASCP",
          providerUrl: "https://www.ascp.org",
          creditCategory: "CEU",
          credits: 2,
        },
        estimatedMinutes: 60,
        requiredForCompletion: false,
      },
      {
        id: "s6",
        order: 6,
        title: "Lab Competency Assessment",
        type: "assessment",
        description: "Pass the laboratory competency exam (≥80%).",
        estimatedMinutes: 30,
        requiredForCompletion: true,
      },
    ],
    estimatedHours: 5,
    ceCreditsTotal: 2,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: "lp-leadership-qi",
    title: "Quality Improvement Leadership",
    description:
      "Develop leadership skills in quality improvement methodology: PDSA, Lean, Six Sigma concepts for healthcare leaders.",
    category: "leadership",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Introduction to Healthcare QI",
        type: "reading",
        description:
          "Overview of QAPI framework, IHI Triple Aim, and regulatory QI requirements.",
        estimatedMinutes: 45,
        requiredForCompletion: true,
      },
      {
        id: "s2",
        order: 2,
        title: "PDSA Cycle Workshop",
        type: "training",
        description:
          "Plan-Do-Study-Act methodology with hands-on project planning.",
        estimatedMinutes: 90,
        requiredForCompletion: true,
      },
      {
        id: "s3",
        order: 3,
        title: "Root Cause Analysis & FMEA",
        type: "training",
        description:
          "Advanced RCA techniques, Fishbone diagrams, 5-Why analysis, and Failure Mode & Effects Analysis.",
        estimatedMinutes: 60,
        requiredForCompletion: true,
      },
      {
        id: "s4",
        order: 4,
        title: "Data-Driven Decision Making",
        type: "training",
        description:
          "Statistical process control, benchmarking, and KPI dashboards for improvement projects.",
        estimatedMinutes: 60,
        requiredForCompletion: true,
      },
      {
        id: "s5",
        order: 5,
        title: "IHI Open School QI Certificate",
        type: "external_ce",
        description:
          "Complete one IHI Open School course module for CME credit.",
        externalProvider: {
          providerName: "IHI Open School",
          providerUrl: "https://www.ihi.org/education",
          creditCategory: "CME",
          credits: 3,
        },
        estimatedMinutes: 120,
        requiredForCompletion: false,
      },
    ],
    estimatedHours: 6,
    ceCreditsTotal: 3,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    isPublished: true,
  },
];

// ── Helpers ───────────────────────────────────────────────

const STEP_TYPE_LABELS: Record<LearningPathStep["type"], string> = {
  training: "Training Module",
  external_ce: "External CE",
  assessment: "Assessment",
  reading: "Reading / Self-Study",
};

const STEP_TYPE_COLORS: Record<LearningPathStep["type"], string> = {
  training: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  external_ce:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  assessment:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  reading:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const CATEGORY_COLORS: Record<LearningPath["category"], string> = {
  onboarding:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  compliance: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  clinical: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  safety:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  leadership:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  technical: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

// ── Component ─────────────────────────────────────────────

type ViewMode = "catalog" | "detail" | "myProgress";

const LearningPathsTab: React.FC = () => {
  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === UserRole.Admin;

  const [paths] = useState<LearningPath[]>(SEED_PATHS);
  const [progress, setProgress] = useState<UserLearningPathProgress[]>([]);
  const [view, setView] = useState<ViewMode>("catalog");
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<
    LearningPath["category"] | "all"
  >("all");

  const filteredPaths = useMemo(
    () =>
      categoryFilter === "all"
        ? paths.filter((p) => p.isPublished)
        : paths.filter((p) => p.isPublished && p.category === categoryFilter),
    [paths, categoryFilter],
  );

  const getProgress = (pathId: string): UserLearningPathProgress | undefined =>
    progress.find(
      (p) => p.learningPathId === pathId && p.userId === currentUser?.id,
    );

  const enrollInPath = (path: LearningPath) => {
    if (getProgress(path.id)) return;
    setProgress((prev) => [
      ...prev,
      {
        userId: currentUser?.id || "",
        learningPathId: path.id,
        stepsCompleted: [],
        startedAt: new Date().toISOString(),
        earnedCredits: 0,
      },
    ]);
  };

  const toggleStepComplete = (pathId: string, stepId: string) => {
    setProgress((prev) =>
      prev.map((p) => {
        if (p.learningPathId !== pathId || p.userId !== currentUser?.id)
          return p;
        const path = paths.find((lp) => lp.id === pathId);
        const step = path?.steps.find((s) => s.id === stepId);
        const isCompleted = p.stepsCompleted.includes(stepId);
        const newCompleted = isCompleted
          ? p.stepsCompleted.filter((s) => s !== stepId)
          : [...p.stepsCompleted, stepId];
        const newCredits = isCompleted
          ? p.earnedCredits - (step?.externalProvider?.credits || 0)
          : p.earnedCredits + (step?.externalProvider?.credits || 0);
        const allRequired =
          path?.steps.filter((s) => s.requiredForCompletion) || [];
        const allDone = allRequired.every((s) => newCompleted.includes(s.id));
        return {
          ...p,
          stepsCompleted: newCompleted,
          earnedCredits: Math.max(0, newCredits),
          completedAt: allDone ? new Date().toISOString() : undefined,
        };
      }),
    );
  };

  const openDetail = (path: LearningPath) => {
    setSelectedPath(path);
    setView("detail");
  };

  // ── My Progress View ──────────────────────────────────

  const myEnrolled = progress.filter((p) => p.userId === currentUser?.id);

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant={view === "catalog" ? "primary" : "ghost"}
          onClick={() => {
            setView("catalog");
            setSelectedPath(null);
          }}
          size="sm"
        >
          Catalog
        </Button>
        <Button
          variant={view === "myProgress" ? "primary" : "ghost"}
          onClick={() => {
            setView("myProgress");
            setSelectedPath(null);
          }}
          size="sm"
        >
          My Progress ({myEnrolled.length})
        </Button>
      </div>

      {/* ── Catalog View ───────────────────────────────── */}
      {view === "catalog" && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === "all"
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-brand-surface dark:text-gray-300"
              }`}
            >
              All
            </button>
            {(
              Object.keys(
                LEARNING_PATH_CATEGORY_LABELS,
              ) as LearningPath["category"][]
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-brand-surface dark:text-gray-300"
                }`}
              >
                {LEARNING_PATH_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Path cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPaths.map((path) => {
              const prog = getProgress(path.id);
              const pct = prog
                ? Math.round(
                    (prog.stepsCompleted.length / path.steps.length) * 100,
                  )
                : 0;
              return (
                <Card
                  key={path.id}
                  className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDetail(path)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[path.category]}`}
                    >
                      {LEARNING_PATH_CATEGORY_LABELS[path.category]}
                    </span>
                    {prog?.completedAt && (
                      <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold dark:text-dark-brand-text-primary mb-1">
                    {path.title}
                  </h3>
                  <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary line-clamp-2 mb-3">
                    {path.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpenIcon className="h-3.5 w-3.5" />
                      {path.steps.length} steps
                    </span>
                    {path.estimatedHours && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />~
                        {path.estimatedHours}h
                      </span>
                    )}
                    {!!path.ceCreditsTotal && (
                      <span className="flex items-center gap-1">
                        <AcademicCapIcon className="h-3.5 w-3.5" />
                        {path.ceCreditsTotal} CE
                      </span>
                    )}
                  </div>
                  {prog && !prog.completedAt && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-brand-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detail View ────────────────────────────────── */}
      {view === "detail" && selectedPath && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setView("catalog");
              setSelectedPath(null);
            }}
            className="text-sm text-brand-primary hover:underline"
          >
            &larr; Back to Catalog
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${CATEGORY_COLORS[selectedPath.category]}`}
              >
                {LEARNING_PATH_CATEGORY_LABELS[selectedPath.category]}
              </span>
              <h2 className="text-2xl font-bold dark:text-dark-brand-text-primary">
                {selectedPath.title}
              </h2>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                {selectedPath.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{selectedPath.steps.length} steps</span>
                {selectedPath.estimatedHours && (
                  <span>~{selectedPath.estimatedHours} hours</span>
                )}
                {!!selectedPath.ceCreditsTotal && (
                  <span>{selectedPath.ceCreditsTotal} CE credits</span>
                )}
              </div>
            </div>
            <div>
              {!getProgress(selectedPath.id) ? (
                <Button
                  variant="primary"
                  onClick={() => enrollInPath(selectedPath)}
                >
                  <PlayCircleIcon className="h-4 w-4 mr-1" />
                  Enroll
                </Button>
              ) : getProgress(selectedPath.id)?.completedAt ? (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircleIcon className="h-5 w-5" /> Completed
                </span>
              ) : (
                <span className="text-sm text-brand-primary font-medium">
                  In Progress
                </span>
              )}
            </div>
          </div>

          {/* Steps timeline */}
          <div className="relative pl-8 space-y-0">
            {selectedPath.steps.map((step, idx) => {
              const prog = getProgress(selectedPath.id);
              const isDone = prog?.stepsCompleted.includes(step.id) || false;
              const isEnrolled = !!prog;
              return (
                <div key={step.id} className="relative pb-6 last:pb-0">
                  {/* Connector line */}
                  {idx < selectedPath.steps.length - 1 && (
                    <div className="absolute left-[-20px] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}
                  {/* Step dot */}
                  <div
                    className={`absolute left-[-26px] top-1 w-3 h-3 rounded-full border-2 ${
                      isDone
                        ? "bg-green-500 border-green-500"
                        : "bg-white dark:bg-dark-brand-surface border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-400">
                            Step {step.order}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${STEP_TYPE_COLORS[step.type]}`}
                          >
                            {STEP_TYPE_LABELS[step.type]}
                          </span>
                          {step.requiredForCompletion && (
                            <span className="text-xs text-red-500 font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold dark:text-dark-brand-text-primary">
                          {step.title}
                        </h4>
                        {step.description && (
                          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                            {step.description}
                          </p>
                        )}
                        {step.externalProvider && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Provider: {step.externalProvider.providerName}{" "}
                            &middot; {step.externalProvider.credits}{" "}
                            {step.externalProvider.creditCategory} credits
                          </p>
                        )}
                        {step.estimatedMinutes ? (
                          <span className="text-xs text-gray-400 mt-1 inline-block">
                            ~{step.estimatedMinutes} min
                          </span>
                        ) : null}
                      </div>
                      {isEnrolled && (
                        <button
                          onClick={() =>
                            toggleStepComplete(selectedPath.id, step.id)
                          }
                          className={`shrink-0 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                          }`}
                          title={isDone ? "Mark incomplete" : "Mark complete"}
                        >
                          {isDone && <CheckCircleIcon className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── My Progress View ───────────────────────────── */}
      {view === "myProgress" && (
        <div className="space-y-4">
          {myEnrolled.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpenIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                You haven't enrolled in any learning paths yet.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => setView("catalog")}
              >
                Browse Catalog
              </Button>
            </Card>
          ) : (
            myEnrolled.map((prog) => {
              const path = paths.find((p) => p.id === prog.learningPathId);
              if (!path) return null;
              const pct = Math.round(
                (prog.stepsCompleted.length / path.steps.length) * 100,
              );
              return (
                <Card
                  key={prog.learningPathId}
                  className="p-5 hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => openDetail(path)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold dark:text-dark-brand-text-primary">
                      {path.title}
                    </h3>
                    {prog.completedAt ? (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> Completed
                      </span>
                    ) : (
                      <span className="text-sm text-brand-primary font-medium">
                        {pct}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span>
                      {prog.stepsCompleted.length}/{path.steps.length} steps
                    </span>
                    {prog.earnedCredits > 0 && (
                      <span>{prog.earnedCredits} CE earned</span>
                    )}
                    <span>
                      Started {new Date(prog.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!prog.completedAt && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-brand-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default LearningPathsTab;
