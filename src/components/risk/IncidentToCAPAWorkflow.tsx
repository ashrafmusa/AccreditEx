import { FC, useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { addCAPAReport, linkCAPAToIncident } from "../../services/capaService";
import { addIncidentReport } from "../../services/incidentReportService";
import { addRisk, getRisks } from "../../services/riskService";
import { useProjectStore } from "../../stores/useProjectStore";
import { useUserStore } from "../../stores/useUserStore";
import { CAPAReport, IncidentReport, Risk } from "../../types";
import { CheckCircleIcon } from "../icons";
import { Button } from "../ui";
import DatePicker from "../ui/DatePicker";

type WorkflowStep = "incident" | "risk" | "rca" | "capa" | "review";

interface WorkflowState {
  // Incident
  incidentDate: Date;
  location: string;
  type: IncidentReport["type"];
  severity: IncidentReport["severity"];
  description: string;
  reportedBy: string;
  investigatorId: string;
  department: string;

  // Risk Linking
  linkToExistingRisk: boolean;
  selectedRiskId: string | null;
  newRiskTitle: string;
  newRiskDescription: string;

  // RCA
  rootCause: string;
  rootCauseCategory: string;
  contributingFactors: string;

  // CAPA
  capaTitle: string;
  correctiveAction: string;
  preventiveAction: string;
  assignedTo: string | null;
  dueDate: Date | undefined;
}

interface IncidentToCAPAWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (incident: IncidentReport, capa?: CAPAReport) => void;
  prefillIncidentData?: Partial<IncidentReport>;
}

const IncidentToCAPAWorkflow: FC<IncidentToCAPAWorkflowProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefillIncidentData,
}) => {
  const { t, dir } = useTranslation();
  const { currentUser } = useUserStore();
  const { projects, createCAPA } = useProjectStore();
  const [step, setStep] = useState<WorkflowStep>("incident");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);

  const [state, setState] = useState<WorkflowState>({
    incidentDate: prefillIncidentData?.incidentDate
      ? new Date(prefillIncidentData.incidentDate)
      : new Date(),
    location: prefillIncidentData?.location || "",
    type: prefillIncidentData?.type || "Patient Safety",
    severity: prefillIncidentData?.severity || "Minor",
    description: prefillIncidentData?.description || "",
    reportedBy: currentUser?.name || "",
    investigatorId: currentUser?.id || "",
    department: currentUser?.department || "",

    linkToExistingRisk: false,
    selectedRiskId: null,
    newRiskTitle: "",
    newRiskDescription: "",

    rootCause: "",
    rootCauseCategory: "",
    contributingFactors: "",

    capaTitle: "",
    correctiveAction: "",
    preventiveAction: "",
    assignedTo: currentUser?.id || null,
    dueDate: undefined,
  });

  useEffect(() => {
    if (isOpen) {
      fetchRisks();
    }
  }, [isOpen]);

  const fetchRisks = async () => {
    try {
      const fetchedRisks = await getRisks();
      setRisks(fetchedRisks);
    } catch (err) {
      console.error("Failed to fetch risks:", err);
    }
  };

  const handleUpdateState = (updates: Partial<WorkflowState>) => {
    setState((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  const validateIncidentStep = (): boolean => {
    if (!state.location || !state.description) {
      setError(t("requiredFieldsMissing") || "Please fill all required fields");
      return false;
    }
    return true;
  };

  const validateRiskStep = (): boolean => {
    if (
      !state.linkToExistingRisk &&
      (!state.newRiskTitle || !state.newRiskDescription)
    ) {
      setError(t("requiredFieldsMissing") || "Please fill risk details");
      return false;
    }
    if (state.linkToExistingRisk && !state.selectedRiskId) {
      setError("Please select a risk to link");
      return false;
    }
    return true;
  };

  const validateCapaStep = (): boolean => {
    if (!state.capaTitle || !state.correctiveAction) {
      setError(t("requiredFieldsMissing") || "Please fill all required fields");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    const stepValidations: Record<WorkflowStep, () => boolean> = {
      incident: validateIncidentStep,
      risk: validateRiskStep,
      rca: () => true, // RCA fields optional
      capa: validateCapaStep,
      review: () => true,
    };

    if (stepValidations[step]?.()) {
      const stepSequence: WorkflowStep[] = [
        "incident",
        "risk",
        "rca",
        "capa",
        "review",
      ];
      const nextIndex = stepSequence.indexOf(step) + 1;
      if (nextIndex < stepSequence.length) {
        setStep(stepSequence[nextIndex]);
      }
    }
  };

  const handlePreviousStep = () => {
    const stepSequence: WorkflowStep[] = [
      "incident",
      "risk",
      "rca",
      "capa",
      "review",
    ];
    const prevIndex = stepSequence.indexOf(step) - 1;
    if (prevIndex >= 0) {
      setStep(stepSequence[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create Incident
      const incidentData: Omit<IncidentReport, "id"> = {
        incidentDate: state.incidentDate.toISOString().split("T")[0],
        location: state.location,
        type: state.type,
        severity: state.severity,
        description: state.description,
        status: "Open",
        reportedBy: state.reportedBy,
        correctiveActionIds: [],
        linkedRiskIds: [],
        investigatorId: state.investigatorId,
        department: state.department,
        rootCause: state.rootCause,
        contributingFactors: state.contributingFactors,
        potentialConsequences: "",
        preventiveActionTaken: "",
      };

      const incident = await addIncidentReport(incidentData);

      // Step 2: Link or Create Risk
      let linkedRiskId: string | null = null;
      if (state.linkToExistingRisk && state.selectedRiskId) {
        linkedRiskId = state.selectedRiskId;
        incidentData.linkedRiskIds = [state.selectedRiskId];
      } else if (!state.linkToExistingRisk && state.newRiskTitle) {
        const newRisk = await addRisk({
          title: state.newRiskTitle,
          description: state.newRiskDescription,
          likelihood: 3, // Default: Medium
          impact: 3, // Default: Medium
          ownerId: currentUser?.id || null,
          status: "Open",
          mitigationPlan: state.correctiveAction,
          rootCauseCategory: state.rootCauseCategory,
          department: state.department,
          createdAt: new Date().toISOString(),
        });
        linkedRiskId = newRisk.id;
        incidentData.linkedRiskIds = [newRisk.id];
      }

      // Step 3: Create CAPA
      const capaData: Omit<CAPAReport, "id"> = {
        type: "CAPA",
        title: state.capaTitle,
        description: state.description,
        checklistItemId: "", // Will be populated if linked to a project
        rootCause: state.rootCause,
        rootCauseAnalysis: state.rootCause,
        rootCauseCategory: state.rootCauseCategory,
        correctiveAction: state.correctiveAction,
        preventiveAction: state.preventiveAction,
        actionPlan: state.correctiveAction,
        linkedDocumentIds: [
          incident.id,
          ...(linkedRiskId ? [linkedRiskId] : []),
        ],
        status: "Not Started",
        pdcaStage: "plan",
        pdcaHistory: [
          {
            stage: "plan",
            completedAt: new Date().toISOString(),
            notes: "CAPA created from incident workflow",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: state.assignedTo || undefined,
        dueDate: state.dueDate?.toISOString().split("T")[0],
        effectivenessCheck: {
          required: true,
          completed: false,
          dueDate: state.dueDate
            ? new Date(
                new Date(state.dueDate).getTime() + 30 * 24 * 60 * 60 * 1000,
              )
                .toISOString()
                .split("T")[0]
            : undefined,
        },
      };

      const capa = await addCAPAReport(capaData);

      // Step 4: Link CAPA to Incident
      await linkCAPAToIncident(capa.id, incident.id);

      // Notify
      if (onSuccess) {
        onSuccess(incident, capa);
      }

      onClose();
    } catch (err) {
      console.error("Workflow error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses =
    "mt-1 block w-full border border-brand-border dark:border-dark-brand-border rounded-md shadow-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2";
  const labelClasses =
    "block text-sm font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm overflow-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-4xl m-4 my-8"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className="border-b border-brand-border dark:border-dark-brand-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {t("incidentToCAPAWorkflow") || "Incident → CAPA Workflow"}
              </h2>
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                Step{" "}
                {["incident", "risk", "rca", "capa", "review"].indexOf(step) +
                  1}{" "}
                of 5
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text-primary transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3">
          <div className="flex gap-2">
            {["incident", "risk", "rca", "capa", "review"].map((s, idx) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition ${
                  ["incident", "risk", "rca", "capa", "review"].indexOf(step) >=
                  idx
                    ? "bg-brand-primary"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-96 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Incident Details */}
          {step === "incident" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("incidentDetails") || "Incident Details"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>
                    {t("incidentDate") || "Incident Date"} *
                  </label>
                  <DatePicker
                    value={state.incidentDate}
                    onChange={(date) =>
                      handleUpdateState({ incidentDate: date || new Date() })
                    }
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    {t("location") || "Location"} *
                  </label>
                  <input
                    type="text"
                    value={state.location}
                    onChange={(e) =>
                      handleUpdateState({ location: e.target.value })
                    }
                    placeholder="e.g., Operating Room 2"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>
                    {t("type") || "Incident Type"} *
                  </label>
                  <select
                    value={state.type}
                    onChange={(e) =>
                      handleUpdateState({
                        type: e.target.value as IncidentReport["type"],
                      })
                    }
                    className={inputClasses}
                  >
                    <option>Patient Safety</option>
                    <option>Staff Injury</option>
                    <option>Facility Issue</option>
                    <option>Medication Error</option>
                    <option>Near-Miss</option>
                    <option>Specimen Error</option>
                    <option>Equipment Malfunction</option>
                    <option>Result Reporting Error</option>
                    <option>Biosafety Exposure</option>
                    <option>Proficiency Testing Failure</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>
                    {t("severity") || "Severity"} *
                  </label>
                  <select
                    value={state.severity}
                    onChange={(e) =>
                      handleUpdateState({
                        severity: e.target.value as IncidentReport["severity"],
                      })
                    }
                    className={inputClasses}
                  >
                    <option>Minor</option>
                    <option>Moderate</option>
                    <option>Severe</option>
                    <option>Sentinel Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  {t("description") || "Description"} *
                </label>
                <textarea
                  value={state.description}
                  onChange={(e) =>
                    handleUpdateState({ description: e.target.value })
                  }
                  placeholder="Describe what happened in detail"
                  rows={4}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  {t("department") || "Department"}
                </label>
                <input
                  type="text"
                  value={state.department}
                  onChange={(e) =>
                    handleUpdateState({ department: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
            </div>
          )}

          {/* Step 2: Risk Linking */}
          {step === "risk" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("linkRisk") || "Link or Create Risk"}
              </h3>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!state.linkToExistingRisk}
                    onChange={() =>
                      handleUpdateState({ linkToExistingRisk: false })
                    }
                  />
                  <span className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    Create new risk
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={state.linkToExistingRisk}
                    onChange={() =>
                      handleUpdateState({ linkToExistingRisk: true })
                    }
                  />
                  <span className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    Link to existing risk
                  </span>
                </label>
              </div>

              {state.linkToExistingRisk ? (
                <div>
                  <label className={labelClasses}>
                    {t("selectRisk") || "Select Risk"} *
                  </label>
                  <select
                    value={state.selectedRiskId || ""}
                    onChange={(e) =>
                      handleUpdateState({ selectedRiskId: e.target.value })
                    }
                    className={inputClasses}
                  >
                    <option value="">-- Select a risk --</option>
                    {risks.map((risk) => (
                      <option key={risk.id} value={risk.id}>
                        {risk.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelClasses}>
                      {t("riskTitle") || "Risk Title"} *
                    </label>
                    <input
                      type="text"
                      value={state.newRiskTitle}
                      onChange={(e) =>
                        handleUpdateState({ newRiskTitle: e.target.value })
                      }
                      placeholder="e.g., Uncontrolled medication storage"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>
                      {t("riskDescription") || "Risk Description"} *
                    </label>
                    <textarea
                      value={state.newRiskDescription}
                      onChange={(e) =>
                        handleUpdateState({
                          newRiskDescription: e.target.value,
                        })
                      }
                      placeholder="Describe the baseline risk"
                      rows={3}
                      className={inputClasses}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: RCA */}
          {step === "rca" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("rootCauseAnalysis") || "Root Cause Analysis"}
              </h3>

              <div>
                <label className={labelClasses}>
                  {t("rootCause") || "Root Cause"}
                </label>
                <textarea
                  value={state.rootCause}
                  onChange={(e) =>
                    handleUpdateState({ rootCause: e.target.value })
                  }
                  placeholder="What is the root cause of this incident?"
                  rows={3}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  {t("rootCauseCategory") || "Root Cause Category"}
                </label>
                <select
                  value={state.rootCauseCategory}
                  onChange={(e) =>
                    handleUpdateState({ rootCauseCategory: e.target.value })
                  }
                  className={inputClasses}
                >
                  <option value="">-- Select category --</option>
                  <option>Human Error</option>
                  <option>Equipment Failure</option>
                  <option>Process Deficiency</option>
                  <option>Communication Breakdown</option>
                  <option>Training Gap</option>
                  <option>Environmental Factor</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>
                  {t("contributingFactors") || "Contributing Factors"}
                </label>
                <textarea
                  value={state.contributingFactors}
                  onChange={(e) =>
                    handleUpdateState({ contributingFactors: e.target.value })
                  }
                  placeholder="List other factors that contributed to this incident"
                  rows={3}
                  className={inputClasses}
                />
              </div>
            </div>
          )}

          {/* Step 4: CAPA */}
          {step === "capa" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("correctiveAction") || "Corrective & Preventive Action"}
              </h3>

              <div>
                <label className={labelClasses}>
                  {t("capaTitle") || "CAPA Title"} *
                </label>
                <input
                  type="text"
                  value={state.capaTitle}
                  onChange={(e) =>
                    handleUpdateState({ capaTitle: e.target.value })
                  }
                  placeholder="e.g., Implement medication storage SOP"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  {t("correctiveAction") || "Corrective Action"} *
                </label>
                <textarea
                  value={state.correctiveAction}
                  onChange={(e) =>
                    handleUpdateState({ correctiveAction: e.target.value })
                  }
                  placeholder="What action will fix this specific incident?"
                  rows={3}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>
                  {t("preventiveAction") || "Preventive Action"}
                </label>
                <textarea
                  value={state.preventiveAction}
                  onChange={(e) =>
                    handleUpdateState({ preventiveAction: e.target.value })
                  }
                  placeholder="How will we prevent this from happening again?"
                  rows={3}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>
                    {t("assignedTo") || "Assigned To"}
                  </label>
                  <select
                    value={state.assignedTo || ""}
                    onChange={(e) =>
                      handleUpdateState({ assignedTo: e.target.value })
                    }
                    className={inputClasses}
                  >
                    <option value="">-- Unassigned --</option>
                    {/* Placeholder - would normally load users */}
                    <option value="current">{currentUser?.name}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>
                    {t("dueDate") || "Due Date"}
                  </label>
                  <DatePicker
                    value={state.dueDate}
                    onChange={(date) => handleUpdateState({ dueDate: date })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === "review" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                {t("reviewAndSubmit") || "Review & Submit"}
              </h3>

              <div className="bg-brand-background dark:bg-dark-brand-background p-4 rounded-lg space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Incident:
                  </span>
                  <p className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    {state.type} - {state.severity} ({state.location})
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Root Cause:
                  </span>
                  <p className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    {state.rootCause || "(Not specified)"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    CAPA Title:
                  </span>
                  <p className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    {state.capaTitle}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Assigned To:
                  </span>
                  <p className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    {state.assignedTo ? currentUser?.name : "(Unassigned)"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    Due Date:
                  </span>
                  <p className="text-brand-text-primary dark:text-dark-brand-text-primary">
                    {state.dueDate?.toLocaleDateString() || "(Not set)"}
                  </p>
                </div>
              </div>

              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                ✓ All fields are ready. Click Submit to create the incident and
                CAPA action.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-brand-border dark:border-dark-brand-border px-6 py-4 flex justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handlePreviousStep}
              disabled={step === "incident"}
            >
              ← {t("back") || "Back"}
            </Button>
            <Button
              variant="primary"
              onClick={handleNextStep}
              disabled={step === "review"}
            >
              {t("next") || "Next"} →
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t("cancel") || "Cancel"}
            </Button>
            {step === "review" && (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                {t("submit") || "Submit"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentToCAPAWorkflow;
