/**
 * SurveyorQuestionBankPage
 *
 * Drill-practice page for accreditation survey preparation.
 * Provides curated question banks per standard (JCI, CBAHI, DNV, CAP, ISO 15189)
 * with AI-evaluated practice mode so staff can rehearse surveyor interactions.
 */

import { useTranslation } from "@/hooks/useTranslation";
import { NavigationState } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";

interface Props {
  setNavigation: (state: NavigationState) => void;
}

interface Question {
  id: string;
  category: string;
  chapter: string;
  question: string;
  expectedTopics: string[];
}

type Standard = "JCI" | "CBAHI" | "DNV" | "CAP" | "ISO 15189";

const QUESTION_BANK: Record<Standard, Question[]> = {
  JCI: [
    {
      id: "jci-1",
      category: "Patient Safety",
      chapter: "IPSG.1",
      question:
        "How does your organisation ensure accurate patient identification before medication administration?",
      expectedTopics: [
        "two identifiers",
        "name and date of birth",
        "wristband",
        "barcode scanning",
      ],
    },
    {
      id: "jci-2",
      category: "Infection Prevention",
      chapter: "PCI.9",
      question:
        "Describe your hand hygiene compliance monitoring programme and how results are fed back to staff.",
      expectedTopics: [
        "WHO 5 moments",
        "compliance rate",
        "feedback sessions",
        "champions",
      ],
    },
    {
      id: "jci-3",
      category: "Quality Improvement",
      chapter: "QPS.8",
      question:
        "Walk me through how you conduct a root cause analysis following a sentinel event.",
      expectedTopics: [
        "RCA team",
        "fishbone diagram",
        "5 whys",
        "corrective actions",
        "recurrence prevention",
      ],
    },
    {
      id: "jci-4",
      category: "Medication Management",
      chapter: "MMU.7",
      question:
        "How does your pharmacy ensure look-alike/sound-alike medications are clearly identified and stored separately?",
      expectedTopics: [
        "LASA list",
        "tall-man lettering",
        "separate storage",
        "labels",
        "alerts",
      ],
    },
    {
      id: "jci-5",
      category: "Staff Qualifications",
      chapter: "SQE.3",
      question:
        "How do you verify the credentials and clinical competencies of a newly hired physician before granting clinical privileges?",
      expectedTopics: [
        "primary source verification",
        "license check",
        "reference check",
        "provisional privileges",
        "privileging committee",
      ],
    },
    {
      id: "jci-6",
      category: "Facility Safety",
      chapter: "FMS.7",
      question:
        "When did you last conduct a fire drill and what were the outcomes?",
      expectedTopics: [
        "frequency",
        "evacuation routes",
        "deficiencies identified",
        "corrective actions",
        "documentation",
      ],
    },
    {
      id: "jci-7",
      category: "Patient Rights",
      chapter: "PFR.2",
      question:
        "How do patients who do not speak Arabic or English communicate with their care team?",
      expectedTopics: [
        "interpreter services",
        "translation cards",
        "trained staff",
        "phone interpretation",
        "documented",
      ],
    },
  ],
  CBAHI: [
    {
      id: "cbahi-1",
      category: "Patient Safety Goals",
      chapter: "NSG.1",
      question:
        "What are the National Patient Safety Goals you have implemented and how do you monitor compliance?",
      expectedTopics: [
        "falls prevention",
        "medication reconciliation",
        "correct site surgery",
        "critical results",
        "monitoring frequency",
      ],
    },
    {
      id: "cbahi-2",
      category: "Nursing Standards",
      chapter: "NS.12",
      question:
        "Describe your nursing competency assessment process for newly recruited nurses.",
      expectedTopics: [
        "orientation period",
        "skills checklist",
        "written exam",
        "preceptor",
        "annual renewal",
      ],
    },
    {
      id: "cbahi-3",
      category: "Medical Records",
      chapter: "MR.5",
      question:
        "How do you ensure that medical records are completed within the required timeframe after discharge?",
      expectedTopics: [
        "48-hour rule",
        "completion tracking",
        "physician reminders",
        "penalties",
        "audit results",
      ],
    },
    {
      id: "cbahi-4",
      category: "Pharmacy",
      chapter: "PH.8",
      question:
        "Explain your process for reporting and analysing adverse drug reactions.",
      expectedTopics: [
        "ADR form",
        "pharmacovigilance committee",
        "SFDA reporting",
        "trend analysis",
        "corrective actions",
      ],
    },
    {
      id: "cbahi-5",
      category: "Environment of Care",
      chapter: "EC.14",
      question:
        "How do you manage the risk of healthcare-associated infections in the operating theatre?",
      expectedTopics: [
        "traffic control",
        "air changes",
        "positive pressure",
        "temperature humidity",
        "staff attire",
      ],
    },
  ],
  DNV: [
    {
      id: "dnv-1",
      category: "Quality Management System",
      chapter: "QM.1",
      question:
        "How does your senior leadership demonstrate commitment to the quality management system?",
      expectedTopics: [
        "policy statement",
        "management review",
        "resource provision",
        "performance monitoring",
        "customer focus",
      ],
    },
    {
      id: "dnv-2",
      category: "Internal Audit",
      chapter: "QM.5",
      question:
        "Show me your last internal audit plan and explain how findings are tracked to closure.",
      expectedTopics: [
        "audit schedule",
        "auditor independence",
        "corrective action register",
        "closure verification",
        "trend analysis",
      ],
    },
    {
      id: "dnv-3",
      category: "Patient Care",
      chapter: "NIAHO PC.5",
      question:
        "How do you assess and reassess patient pain and what non-pharmacological interventions are available?",
      expectedTopics: [
        "pain scale",
        "reassessment frequency",
        "multidisciplinary",
        "complementary therapy",
        "patient education",
      ],
    },
    {
      id: "dnv-4",
      category: "Human Resources",
      chapter: "HR.1",
      question:
        "Describe how job descriptions are developed and kept current for clinical roles.",
      expectedTopics: [
        "review cycle",
        "stakeholder input",
        "competencies",
        "regulatory requirements",
        "sign-off process",
      ],
    },
  ],
  CAP: [
    {
      id: "cap-1",
      category: "Quality Management",
      chapter: "GEN.20316",
      question:
        "Describe your laboratory's quality management plan and how it is reviewed.",
      expectedTopics: [
        "written plan",
        "annual review",
        "quality indicators",
        "quality committee",
        "director involvement",
      ],
    },
    {
      id: "cap-2",
      category: "Proficiency Testing",
      chapter: "GEN.15000",
      question:
        "What happens when a proficiency testing result is unsatisfactory?",
      expectedTopics: [
        "investigation",
        "root cause",
        "corrective action",
        "director review",
        "repeat testing",
        "documentation",
      ],
    },
    {
      id: "cap-3",
      category: "Specimen Management",
      chapter: "PRE.04100",
      question:
        "Walk me through your specimen rejection criteria and how rejected specimens are handled.",
      expectedTopics: [
        "rejection list",
        "clinician notification",
        "re-collection",
        "documentation",
        "tracking rate",
      ],
    },
    {
      id: "cap-4",
      category: "Reagent Management",
      chapter: "GEN.40490",
      question:
        "How do you ensure reagents and consumables are within their expiry date at the time of use?",
      expectedTopics: [
        "FIFO",
        "daily checks",
        "expiry labels",
        "quarantine",
        "removal procedure",
      ],
    },
    {
      id: "cap-5",
      category: "Safety",
      chapter: "GEN.73600",
      question:
        "What personal protective equipment is required in your lab and how is compliance ensured?",
      expectedTopics: [
        "gloves",
        "lab coat",
        "eye protection",
        "PPE assessment",
        "training records",
        "monitoring",
      ],
    },
  ],
  "ISO 15189": [
    {
      id: "iso-1",
      category: "Document Control",
      chapter: "8.3",
      question:
        "How do you control documents to ensure only current versions are available at the point of use?",
      expectedTopics: [
        "document register",
        "version numbering",
        "distribution control",
        "obsolete document withdrawal",
        "review cycle",
      ],
    },
    {
      id: "iso-2",
      category: "Competency Assessment",
      chapter: "6.2.6",
      question:
        "Describe your process for assessing the competency of laboratory personnel on an ongoing basis.",
      expectedTopics: [
        "initial assessment",
        "6-month review",
        "annual assessment",
        "direct observation",
        "proficiency testing",
        "remedial training",
      ],
    },
    {
      id: "iso-3",
      category: "Measurement Uncertainty",
      chapter: "7.3.3",
      question:
        "Explain how your laboratory estimates measurement uncertainty for a quantitative test.",
      expectedTopics: [
        "bias",
        "precision",
        "combined uncertainty",
        "IQC data",
        "EQA performance",
        "patient result",
      ],
    },
    {
      id: "iso-4",
      category: "Nonconformity",
      chapter: "7.7",
      question:
        "How are nonconformities detected and how do you verify that corrective actions have been effective?",
      expectedTopics: [
        "nonconformity log",
        "investigation",
        "root cause analysis",
        "corrective action",
        "effectiveness check",
        "recurrence monitoring",
      ],
    },
    {
      id: "iso-5",
      category: "Method Verification",
      chapter: "7.2.1",
      question:
        "What experiments do you perform before implementing a new examination procedure?",
      expectedTopics: [
        "precision",
        "accuracy",
        "reference interval",
        "analytical measurement range",
        "interference testing",
      ],
    },
  ],
};

const STANDARDS: Standard[] = ["JCI", "CBAHI", "DNV", "CAP", "ISO 15189"];

interface PracticeState {
  questionId: string;
  userAnswer: string;
  aiFeedback: string | null;
  evaluating: boolean;
  error: string;
}

const SurveyorQuestionBankPage: React.FC<Props> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const [activeStandard, setActiveStandard] = useState<Standard>("JCI");
  const [practiceState, setPracticeState] = useState<
    Record<string, PracticeState>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());

  const questions = QUESTION_BANK[activeStandard];

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const updatePractice = (qId: string, patch: Partial<PracticeState>) => {
    setPracticeState((prev) => ({
      ...prev,
      [qId]: {
        questionId: qId,
        userAnswer: "",
        aiFeedback: null,
        evaluating: false,
        error: "",
        ...(prev[qId] ?? {}),
        ...patch,
      },
    }));
  };

  const evaluateAnswer = async (q: Question) => {
    const state = practiceState[q.id];
    if (!state?.userAnswer.trim()) return;

    updatePractice(q.id, { evaluating: true, aiFeedback: null, error: "" });

    try {
      const { aiAgentService } = await import("@/services/aiAgentService");
      const prompt = `You are a strict but constructive ${activeStandard} accreditation surveyor.
You asked the following question during a survey visit:
"${q.question}" (Chapter: ${q.chapter})

The staff member answered:
"${state.userAnswer}"

Key topics that should be covered: ${q.expectedTopics.join(", ")}.

Evaluate the answer in 3 parts:
1. STRENGTH: What was answered well (1-2 sentences).
2. GAPS: What important topics were missed or insufficiently addressed (bulleted).
3. SUGGESTION: One concrete sentence on how to improve the answer for the real survey.

Keep your response concise (under 200 words). Be professional and constructive.`;

      const feedback = await aiAgentService.chat(prompt, false);
      updatePractice(q.id, { aiFeedback: feedback, evaluating: false });
      setAnsweredIds((prev) => new Set([...prev, q.id]));
    } catch {
      updatePractice(q.id, {
        error: "AI evaluation unavailable. Please try again.",
        evaluating: false,
      });
    }
  };

  const completionPercent = Math.round(
    (answeredIds.size / questions.length) * 100,
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            Surveyor Question Bank
          </h1>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            Practice surveyor questions with AI-evaluated feedback before your
            survey visit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary cursor-pointer select-none">
            <div
              onClick={() => setPracticeMode((v) => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${practiceMode ? "bg-brand-primary" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${practiceMode ? "translate-x-5" : "translate-x-0"}`}
              />
            </div>
            Practice Mode
          </label>
        </div>
      </div>

      {/* Standard tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STANDARDS.map((std) => (
          <button
            key={std}
            onClick={() => {
              setActiveStandard(std);
              setExpandedId(null);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              activeStandard === std
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-brand-surface dark:bg-dark-brand-surface text-brand-text-secondary dark:text-dark-brand-text-secondary border-gray-200 dark:border-gray-700 hover:border-brand-primary hover:text-brand-primary"
            }`}
          >
            {std}
          </button>
        ))}
      </div>

      {/* Progress bar (practice mode only) */}
      {practiceMode && (
        <div className="mb-5 bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Practice Progress — {activeStandard}
            </p>
            <p className="text-xs font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {answeredIds.size}/{questions.length} answered
            </p>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className="h-1.5 bg-brand-primary rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Question list */}
      <div className="space-y-3">
        {questions.map((q) => {
          const pState = practiceState[q.id];
          const isExpanded = expandedId === q.id;
          const isAnswered = answeredIds.has(q.id);

          return (
            <div
              key={q.id}
              className={`rounded-xl border transition ${
                isAnswered
                  ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10"
                  : "border-gray-200 dark:border-gray-700 bg-brand-surface dark:bg-dark-brand-surface"
              }`}
            >
              {/* Question header */}
              <button
                onClick={() => toggleExpand(q.id)}
                className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-primary/10 text-brand-primary">
                      {q.chapter}
                    </span>
                    <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {q.category}
                    </span>
                    {isAnswered && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        ✓ Practiced
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {q.question}
                  </p>
                </div>
                <span
                  className={`text-brand-text-secondary dark:text-dark-brand-text-secondary shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    />
                  </svg>
                </span>
              </button>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                      {/* Expected topics */}
                      <div>
                        <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-1.5">
                          Key Topics to Cover
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {q.expectedTopics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-brand-text-secondary dark:text-dark-brand-text-secondary"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Practice mode answer box */}
                      {practiceMode && (
                        <div>
                          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider mb-1.5">
                            Your Answer
                          </p>
                          <textarea
                            rows={4}
                            value={pState?.userAnswer ?? ""}
                            onChange={(e) =>
                              updatePractice(q.id, {
                                userAnswer: e.target.value,
                              })
                            }
                            placeholder="Type your answer as you would respond to the surveyor…"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-brand-text-primary dark:text-dark-brand-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 resize-none"
                          />
                          {pState?.error && (
                            <p className="text-xs text-red-500 mt-1">
                              {pState.error}
                            </p>
                          )}
                          <button
                            onClick={() => evaluateAnswer(q)}
                            disabled={
                              pState?.evaluating || !pState?.userAnswer?.trim()
                            }
                            className="mt-2 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                          >
                            {pState?.evaluating ? (
                              <>
                                <svg
                                  className="animate-spin h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                  />
                                </svg>
                                Evaluating…
                              </>
                            ) : (
                              <>✦ Evaluate with AI</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* AI feedback */}
                      {pState?.aiFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-3"
                        >
                          <p className="text-xs font-semibold text-brand-primary mb-1.5">
                            ✦ AI Surveyor Feedback
                          </p>
                          <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary whitespace-pre-wrap leading-relaxed">
                            {pState.aiFeedback}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SurveyorQuestionBankPage;
