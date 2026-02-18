import React, { useMemo, useState, useCallback } from "react";
import {
  ChecklistItem,
  Project,
  ComplianceStatus,
  Comment,
  AppDocument,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
} from "@/components/icons";
import ChecklistComments from "./ChecklistComments";
import ChecklistEvidence from "./ChecklistEvidence";
import { useUserStore } from "@/stores/useUserStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useToast } from "@/hooks/useToast";
import { aiAgentService } from "@/services/aiAgentService";
import { useAppStore } from "@/stores/useAppStore";
import { suggestReusableEvidenceForChecklistItem } from "@/services/crossStandardMappingService";
import { statusToTranslationKey, STATUS_COLORS } from "@/utils/complianceUtils";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import { useNavigate } from "react-router-dom";

interface ChecklistItemComponentProps {
  item: ChecklistItem;
  project: Project;
  isFinalized?: boolean;
  onUpdate?: (updates: Partial<ChecklistItem>) => void;
  onDelete?: () => void;
}

const ChecklistItemComponent: React.FC<ChecklistItemComponentProps> = ({
  item,
  project,
  isFinalized = false,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const { createPDCACycle, createCAPA } = useProjectStore();
  const { standards, documents } = useAppStore();
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<ChecklistItem>>(item);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingCAPA, setIsGeneratingCAPA] = useState(false);
  const [aiToolbarOpen, setAiToolbarOpen] = useState(false);
  const [aiActiveAction, setAiActiveAction] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");
  const [aiModalType, setAiModalType] = useState<
    | "action-plan"
    | "root-cause"
    | "improvements"
    | "risk-assessment"
    | "compliance-check"
    | "readiness-check"
  >("improvements");
  const [aiEvidenceSuggestions, setAiEvidenceSuggestions] = useState<
    AppDocument[]
  >([]);
  const [aiBackendStatus, setAiBackendStatus] = useState<
    "unknown" | "checking" | "ready" | "offline"
  >("unknown");
  const [aiModalMode, setAiModalMode] = useState<
    "default" | "evidence-advisor"
  >("default");
  const navigate = useNavigate();

  // Safely get standardId with fallback
  const itemStandardId = item.standardId || "";

  const reusableEvidenceSuggestions = useMemo(
    () =>
      suggestReusableEvidenceForChecklistItem({
        standardId: item.standardId,
        checklistText: item.item,
        currentProgramId: project.programId,
        standards,
        documents,
        existingEvidenceIds: item.evidenceFiles,
      }),
    [
      item.standardId,
      item.item,
      item.evidenceFiles,
      project.programId,
      standards,
      documents,
    ],
  );

  const suggestedCrossReferences = useMemo(
    () =>
      [
        ...new Set(
          reusableEvidenceSuggestions.flatMap(
            (entry) => entry.matchedStandardIds,
          ),
        ),
      ].slice(0, 6),
    [reusableEvidenceSuggestions],
  );

  const statusColors = STATUS_COLORS;

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedItem);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  const handleAddComment = (commentText: string) => {
    if (onUpdate && currentUser) {
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        text: commentText,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      };
      onUpdate({
        comments: [...item.comments, newComment],
      });
    }
  };

  const handleEvidenceUpdate = (updates: Partial<ChecklistItem>) => {
    if (onUpdate) {
      onUpdate(updates);
    }
  };

  const handleCreatePDCA = async () => {
    if (!currentUser) return;

    // Use editedItem if in edit mode (unsaved changes), otherwise use item
    const currentData = isEditing ? editedItem : item;

    try {
      await createPDCACycle(project.id, {
        projectId: project.id,
        title: `${currentData.standardId}: ${currentData.item}`,
        description: `Auto-created from non-compliant checklist item.\n\nStandard: ${
          currentData.standardId
        }\nIssue: ${currentData.item}\n\nAction Plan: ${
          currentData.actionPlan || "Not specified"
        }`,
        category: "Process",
        priority: "High",
        owner: currentUser.id,
        team: currentData.assignedTo ? [currentData.assignedTo] : [],
        currentStage: "Plan",
        targetCompletionDate:
          currentData.dueDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        improvementMetrics: {
          baseline: [],
          target: [],
          actual: [],
        },
      } as any);
      toast.success(
        "PDCA Cycle created successfully! View in PDCA Cycles tab.",
      );
    } catch (error) {
      toast.error("Failed to create PDCA cycle");
    }
  };

  const handleCreateCAPA = async () => {
    if (!currentUser || isGeneratingCAPA) return;

    // Use editedItem if in edit mode (unsaved changes), otherwise use item
    const currentData = isEditing ? editedItem : item;

    setIsGeneratingCAPA(true);
    try {
      // AI pre-fill: generate root cause analysis and corrective/preventive actions
      let rootCause = "To be analyzed";
      let correctiveAction = currentData.actionPlan || "To be defined";
      let preventiveAction = "To be defined";

      try {
        const aiAnalysis = await aiAgentService.analyzeRootCause({
          title: `${currentData.standardId}: ${currentData.item}`,
          description: `Non-compliant checklist item in accreditation project.\n\nStandard: ${currentData.standardId}\nItem: ${currentData.item}\nStatus: ${currentData.status}\nNotes: ${currentData.notes || "None"}${currentData.actionPlan ? `\nExisting Action Plan: ${currentData.actionPlan}` : ""}`,
          category: "Process",
          findings: currentData.notes || undefined,
        });

        // Parse AI response to extract sections
        const sections = aiAnalysis.split(
          /\n(?=#{1,3}\s|(?:Root Cause|Corrective|Preventive|Immediate))/i,
        );
        const fullText = aiAnalysis;

        // Try to extract root cause section
        const rootCauseMatch = fullText.match(
          /(?:root\s*cause)[:\s]*\n?([\s\S]*?)(?=\n(?:#{1,3}\s|corrective|preventive|immediate|recommendation)|$)/i,
        );
        if (rootCauseMatch) {
          rootCause = rootCauseMatch[1].trim().slice(0, 2000) || rootCause;
        } else {
          // Use first meaningful paragraph as root cause
          rootCause = fullText.slice(0, 1500);
        }

        // Try to extract corrective action
        const correctiveMatch = fullText.match(
          /(?:corrective\s*action)[:\s]*\n?([\s\S]*?)(?=\n(?:#{1,3}\s|preventive|recommendation|conclusion)|$)/i,
        );
        if (correctiveMatch) {
          correctiveAction =
            correctiveMatch[1].trim().slice(0, 2000) || correctiveAction;
        }

        // Try to extract preventive action
        const preventiveMatch = fullText.match(
          /(?:preventive\s*action|prevention)[:\s]*\n?([\s\S]*?)(?=\n(?:#{1,3}\s|recommendation|conclusion|next\s*step)|$)/i,
        );
        if (preventiveMatch) {
          preventiveAction =
            preventiveMatch[1].trim().slice(0, 2000) || preventiveAction;
        }

        toast.success("AI-powered CAPA created with root cause analysis!");
      } catch (aiError) {
        console.warn(
          "AI pre-fill failed, creating CAPA with defaults:",
          aiError,
        );
        // Continue with default values — don't block CAPA creation
      }

      await createCAPA(project.id, {
        checklistItemId: currentData.id || "",
        description: `${currentData.standardId}: ${currentData.item}${
          suggestedCrossReferences.length > 0
            ? `\nCross-standard references: ${suggestedCrossReferences.join(", ")}`
            : ""
        }`,
        rootCause,
        correctiveAction,
        preventiveAction,
        status: "Open",
        assignedTo: currentData.assignedTo || currentUser.id,
        dueDate:
          currentData.dueDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        pdcaStage: "Plan",
        pdcaHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (!rootCause.startsWith("To be")) {
        toast.success("CAPA Report created with AI root cause analysis!");
      } else {
        toast.success("CAPA Report created successfully!");
      }
    } catch (error) {
      toast.error("Failed to create CAPA report");
    } finally {
      setIsGeneratingCAPA(false);
    }
  };

  const handleAskAI = async () => {
    if (!currentUser || isGeneratingAI) return;

    setIsGeneratingAI(true);
    try {
      const actionPlan = await aiAgentService.generateActionPlan({
        standardId: item.standardId,
        item: item.item,
        status: item.status,
        findings: item.notes,
      });

      setEditedItem({ ...item, actionPlan });
      setIsEditing(true);
      toast.success("AI-generated action plan ready! Review and save.");
    } catch (error) {
      toast.error("Failed to generate AI action plan");
      console.error("AI action plan error:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ── AI Audit Assistant Handlers ──────────────────────────────────────

  // AI backend health check — runs once when toolbar opens
  const checkAiBackendStatus = useCallback(async () => {
    if (aiBackendStatus === "ready" || aiBackendStatus === "checking") return;
    setAiBackendStatus("checking");
    try {
      await aiAgentService.healthCheck();
      setAiBackendStatus("ready");
    } catch {
      setAiBackendStatus("offline");
      toast.error(
        "AI backend is currently offline. Some features may be unavailable.",
      );
    }
  }, [aiBackendStatus, toast]);

  const runAiAuditAction = useCallback(
    async (
      actionKey: string,
      prompt: string,
      title: string,
      type: typeof aiModalType,
    ) => {
      if (aiActiveAction) return;
      // Feasibility pre-check
      if (aiBackendStatus === "offline") {
        toast.error(
          "AI is offline — please check your connection and try again.",
        );
        return;
      }
      if (!item.standardId || !item.item) {
        toast.error("Item data is insufficient for AI analysis.");
        return;
      }
      setAiActiveAction(actionKey);
      setAiModalMode("default");
      try {
        const response = await aiAgentService.chat(prompt, true);
        setAiModalTitle(title);
        setAiModalContent(response.response);
        setAiModalType(type);
        setAiModalOpen(true);
        if (aiBackendStatus !== "ready") setAiBackendStatus("ready");
      } catch (error) {
        toast.error(
          `AI ${title} failed — the service may be temporarily unavailable.`,
        );
        console.error(`AI ${actionKey} error:`, error);
        setAiBackendStatus("offline");
      } finally {
        setAiActiveAction(null);
      }
    },
    [aiActiveAction, toast, aiBackendStatus, item.standardId, item.item],
  );

  const handleAIAutoAssess = useCallback(() => {
    const evidenceCount = item.evidenceFiles.length;
    const prompt = `You are an experienced healthcare accreditation surveyor. Assess this checklist item and recommend a compliance status.

**Standard ID:** ${item.standardId}
**Requirement:** ${item.item}
**Current Status:** ${item.status}
**Evidence Attached:** ${evidenceCount} document(s)
**Notes/Findings:** ${item.notes || "None recorded"}
**Action Plan:** ${item.actionPlan || "None"}
**Assigned To:** ${item.assignedTo || "Unassigned"}
**Due Date:** ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "Not set"}
**Comments:** ${item.comments.length > 0 ? item.comments.map((c) => c.text).join("; ") : "None"}

Based on this information, provide:
1. **Recommended Status** — Compliant / Partially Compliant / Non-Compliant / Not Applicable (with confidence level)
2. **Rationale** — Why this status is recommended
3. **Gaps Identified** — What's missing to achieve full compliance
4. **Required Actions** — Specific steps needed before the status can improve
5. **Evidence Sufficiency** — Is the current evidence adequate? What else is needed?`;
    runAiAuditAction(
      "auto-assess",
      prompt,
      "AI Compliance Assessment",
      "compliance-check",
    );
  }, [item, runAiAuditAction]);

  const handleAISmartEvidence = useCallback(async () => {
    if (aiActiveAction) return;
    // Feasibility pre-check
    if (aiBackendStatus === "offline") {
      toast.error(
        "AI is offline — please check your connection and try again.",
      );
      return;
    }
    if (!item.standardId || !item.item) {
      toast.error("Item data is insufficient for AI analysis.");
      return;
    }
    setAiActiveAction("smart-evidence");
    try {
      // Scan documents store for relevant matches
      const attachedDocs = documents.filter((d) =>
        item.evidenceFiles.includes(d.id),
      );
      const candidateDocs = documents.filter(
        (d) =>
          !item.evidenceFiles.includes(d.id) &&
          d.status === "Approved" &&
          ["Evidence", "Policy", "Procedure", "Report"].includes(d.type),
      );

      // Pre-build doc lists for the prompt (avoids nested template literal issues)
      const attachedList =
        attachedDocs.length > 0
          ? attachedDocs
              .map((d) => '- ✅ "' + d.name.en + '" (' + d.type + ")")
              .join("\n")
          : "- None attached yet";
      const candidateList =
        candidateDocs
          .slice(0, 20)
          .map(
            (d) =>
              '- 📄 "' +
              d.name.en +
              '" (Type: ' +
              d.type +
              ", Category: " +
              (d.category || "N/A") +
              ")",
          )
          .join("\n") || "- No approved documents found";

      const prompt = `You are an expert accreditation evidence advisor. Analyze this checklist item and provide SPECIFIC, ACTIONABLE evidence recommendations.

**Standard ID:** ${item.standardId}
**Requirement:** ${item.item}
**Current Status:** ${item.status}

**Evidence Already Attached (${attachedDocs.length}):**
${attachedList}

**Available Approved Documents in System (${candidateDocs.length} total, showing top 20):**
${candidateList}

Based on this information, provide:

## 1. Evidence Gap Analysis
What specific evidence types are MISSING for full compliance with this standard?

## 2. Recommended Existing Documents to Link
From the "Available Approved Documents" listed above, which ones should be linked to this checklist item? Reference exact document names.
- Mark each with 🔗 **LINK:** "Document Name" — reason

## 3. Documents That Need to Be Created
List specific NEW documents that should be created in the Document Control Hub:
- Mark each with 📄 **CREATE:** Document title — what it should contain
- Include document type (Policy, Procedure, Evidence, Report)

## 4. Evidence Sufficiency Score
Rate current evidence completeness: **X/100%**

## 5. Priority Actions (Top 3)
Numbered list of immediate actions to strengthen evidence for this standard.

Be specific and actionable. Reference real document names from the system when possible.`;

      const response = await aiAgentService.chat(prompt, true);

      // Find matching unlinked docs using keyword matching
      const itemKeywords = item.item
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const stdId = item.standardId.toLowerCase();
      const matched = candidateDocs
        .filter((d) => {
          const name = d.name.en.toLowerCase();
          const tags = (d.tags || []).join(" ").toLowerCase();
          const cat = (d.category || "").toLowerCase();
          return (
            name.includes(stdId) ||
            tags.includes(stdId) ||
            itemKeywords.some(
              (kw) =>
                name.includes(kw) || tags.includes(kw) || cat.includes(kw),
            )
          );
        })
        .slice(0, 8);

      setAiEvidenceSuggestions(matched);
      setAiModalTitle("🧭 Smart Evidence Advisor");
      setAiModalContent(response.response);
      setAiModalType("improvements");
      setAiModalMode("evidence-advisor");
      setAiModalOpen(true);
      if (aiBackendStatus !== "ready") setAiBackendStatus("ready");
    } catch (error) {
      toast.error(
        "Smart Evidence Advisor failed — the service may be temporarily unavailable.",
      );
      console.error("Smart evidence error:", error);
      setAiBackendStatus("offline");
    } finally {
      setAiActiveAction(null);
    }
  }, [item, documents, aiActiveAction, aiBackendStatus, toast]);

  // Link all AI-suggested documents to this checklist item
  const handleLinkSuggestedEvidence = useCallback(() => {
    if (aiEvidenceSuggestions.length === 0 || !onUpdate) return;
    const newIds = aiEvidenceSuggestions
      .map((d) => d.id)
      .filter((id) => !item.evidenceFiles.includes(id));
    if (newIds.length === 0) {
      toast.info("All suggested documents are already linked.");
      return;
    }
    onUpdate({ evidenceFiles: [...item.evidenceFiles, ...newIds] });
    toast.success(`Linked ${newIds.length} document(s) as evidence.`);
    setAiEvidenceSuggestions([]);
  }, [aiEvidenceSuggestions, item.evidenceFiles, onUpdate, toast]);

  const handleAIAuditNotes = useCallback(() => {
    const prompt = `You are a senior healthcare accreditation auditor. Generate professional audit observation notes for this checklist item.

**Standard ID:** ${item.standardId}
**Requirement:** ${item.item}
**Current Status:** ${item.status}
**Existing Notes:** ${item.notes || "None"}
**Evidence Count:** ${item.evidenceFiles.length}
**Action Plan:** ${item.actionPlan || "None"}

Generate comprehensive audit notes that include:
1. **Observation Summary** — Objective description of what was observed during assessment
2. **Compliance Assessment** — How the current state maps to the standard requirement
3. **Strengths Noted** — Positive aspects observed (if any based on status/evidence)
4. **Gaps & Deficiencies** — Specific areas where the requirement is not fully met
5. **Risk Impact** — Patient safety, quality, or operational risks from current gaps
6. **Recommended Follow-up** — What actions should occur before the next review

Write in formal audit language suitable for an accreditation report. Be specific and factual.`;
    runAiAuditAction(
      "audit-notes",
      prompt,
      "AI Audit Observation Notes",
      "root-cause",
    );
  }, [item, runAiAuditAction]);

  const handleAIInterviewQuestions = useCallback(() => {
    const prompt = `You are a healthcare accreditation surveyor preparing for a facility assessment visit. Generate interview questions for this standard.

**Standard ID:** ${item.standardId}
**Requirement:** ${item.item}
**Current Status:** ${item.status}

Generate a structured set of interview questions:
1. **For Department Leaders (3-4 questions)** — Strategic awareness of this standard, resource allocation, oversight
2. **For Frontline Staff (3-4 questions)** — Practical knowledge, daily adherence, awareness of procedures
3. **For Quality/Compliance Officers (2-3 questions)** — Monitoring, measurement, reporting mechanisms
4. **Tracer Questions (2-3 questions)** — Follow-the-patient/process questions that trace compliance through actual workflows
5. **Document Verification Prompts (2-3 items)** — "Can you show me..." questions to verify documented evidence matches practice
6. **Red Flag Indicators** — What surveyor responses/observations would indicate non-compliance

Format each question clearly with the target audience labeled. Make questions open-ended to encourage detailed responses.`;
    runAiAuditAction(
      "interview-qs",
      prompt,
      "Surveyor Interview Questions",
      "readiness-check",
    );
  }, [item, runAiAuditAction]);

  const handleAISuggestStatus = useCallback(async () => {
    if (aiActiveAction) return;
    setAiActiveAction("suggest-status");
    try {
      const prompt = `Based on this checklist item, suggest the most appropriate compliance status. Reply ONLY with one of these exact values: Compliant, Partially Compliant, Non-Compliant, Not Applicable, Not Started. Then on a new line, write a one-sentence justification.

Standard: ${item.standardId}
Requirement: ${item.item}
Evidence: ${item.evidenceFiles.length} documents
Notes: ${item.notes || "None"}
Action Plan: ${item.actionPlan || "None"}`;
      const response = await aiAgentService.chat(prompt, true);
      const lines = response.response.trim().split("\n");
      const suggestedStatus = lines[0]?.trim();
      const justification = lines.slice(1).join(" ").trim();

      const validStatuses = Object.values(ComplianceStatus);
      const matched = validStatuses.find(
        (s) => s.toLowerCase() === suggestedStatus.toLowerCase(),
      );

      if (matched) {
        setEditedItem({ ...item, status: matched });
        setIsEditing(true);
        toast.success(
          `AI suggests: ${matched}. ${justification ? justification.slice(0, 100) : ""}`,
        );
      } else {
        toast.info(`AI suggestion: ${response.response.slice(0, 200)}`);
      }
    } catch (error) {
      toast.error("AI status suggestion failed");
    } finally {
      setAiActiveAction(null);
    }
  }, [item, aiActiveAction, toast]);

  const handleAIApplyNotes = useCallback(async () => {
    if (aiActiveAction) return;
    setAiActiveAction("apply-notes");
    try {
      const prompt = `Generate concise, professional audit findings notes for this checklist item. Keep under 250 words. Be specific and factual.

Standard: ${item.standardId}
Requirement: ${item.item}
Status: ${item.status}
Evidence: ${item.evidenceFiles.length} documents attached
Existing Notes: ${item.notes || "None"}
Action Plan: ${item.actionPlan || "None"}`;
      const response = await aiAgentService.chat(prompt, true);
      setEditedItem({ ...item, notes: response.response });
      setIsEditing(true);
      toast.success("AI-generated audit notes ready — review and save.");
    } catch (error) {
      toast.error("Failed to generate audit notes");
    } finally {
      setAiActiveAction(null);
    }
  }, [item, aiActiveAction, toast]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start justify-between"
      >
        <div className="grow">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white grow">
              {isEditing ? (
                <input
                  type="text"
                  value={editedItem.item || ""}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, item: e.target.value })
                  }
                  className="w-full px-2 py-1 border rounded text-base"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                item.item
              )}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[item.status as ComplianceStatus]
              }`}
            >
              {t(statusToTranslationKey(item.status) as any)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{t("standard")}:</span>
            <span>{item.standardId}</span>
            {item.departmentId &&
              (() => {
                const dept = (useAppStore.getState().departments || []).find(
                  (d) => d.id === item.departmentId,
                );
                return dept ? (
                  <>
                    <span className="mx-2">•</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                      🏢 {dept.name.en || dept.name.ar}
                    </span>
                  </>
                ) : null;
              })()}
            {item.assignedTo && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">{t("assignedTo")}:</span>
                <span>{item.assignedTo}</span>
              </>
            )}
            {item.dueDate && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">{t("dueDate")}:</span>
                <span
                  className={
                    new Date(item.dueDate) < new Date() &&
                    item.status !== ComplianceStatus.Compliant &&
                    item.status !== ComplianceStatus.NotApplicable
                      ? "text-red-600 dark:text-red-400 font-semibold"
                      : ""
                  }
                >
                  {new Date(item.dueDate).toLocaleDateString()}
                  {new Date(item.dueDate) < new Date() &&
                    item.status !== ComplianceStatus.Compliant &&
                    item.status !== ComplianceStatus.NotApplicable &&
                    " ⚠"}
                </span>
              </>
            )}
            {/* Evidence & Comment count badges */}
            {item.evidenceFiles.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                  📎 {item.evidenceFiles.length}
                </span>
              </>
            )}
            {item.comments.length > 0 && (
              <>
                <span className="mx-1">•</span>
                <span className="inline-flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300">
                  💬 {item.comments.length}
                </span>
              </>
            )}
            {item.actionPlan && (
              <>
                <span className="mx-1">•</span>
                <span className="text-xs text-green-700 dark:text-green-300">
                  ✓ {t("actionPlan") || "Action Plan"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {!isFinalized && !isEditing && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={t("edit")}
              >
                <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this item?")) {
                      onDelete();
                    }
                  }}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title={t("delete")}
                >
                  <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              )}
            </>
          )}
          {isEditing && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="px-3 py-1 text-xs bg-brand-primary text-white rounded hover:bg-sky-700 transition-colors"
              >
                {t("save")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400 transition-colors"
              >
                {t("cancel")}
              </button>
            </>
          )}
          <div className="text-gray-600 dark:text-gray-400">
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {/* ── AI Audit Assistant Toolbar ─────────────────────────────── */}
          {!isEditing && !isFinalized && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-linear-to-r from-indigo-50 via-purple-50 to-cyan-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-cyan-950/40 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const opening = !aiToolbarOpen;
                  setAiToolbarOpen(opening);
                  if (opening) checkAiBackendStatus();
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    AI Audit Assistant
                  </span>
                  {aiBackendStatus === "ready" && (
                    <span
                      className="w-2 h-2 rounded-full bg-green-500"
                      title="AI Ready"
                    />
                  )}
                  {aiBackendStatus === "checking" && (
                    <span
                      className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"
                      title="Checking AI..."
                    />
                  )}
                  {aiBackendStatus === "offline" && (
                    <span
                      className="w-2 h-2 rounded-full bg-red-500"
                      title="AI Offline"
                    />
                  )}
                  {aiActiveAction && (
                    <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  )}
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-indigo-500 transition-transform ${aiToolbarOpen ? "rotate-180" : ""}`}
                />
              </button>

              {aiToolbarOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Row 1: Assessment & Quick Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIAutoAssess();
                      }}
                      disabled={!!aiActiveAction}
                      className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">🎯</span>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Auto-Assess
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        AI compliance check
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAISuggestStatus();
                      }}
                      disabled={!!aiActiveAction}
                      className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium rounded-lg border border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">✅</span>
                      <span className="text-green-800 dark:text-green-200">
                        Suggest Status
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Set status via AI
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIApplyNotes();
                      }}
                      disabled={!!aiActiveAction}
                      className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">📝</span>
                      <span className="text-amber-800 dark:text-amber-200">
                        Write Notes
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        AI audit findings
                      </span>
                    </button>
                  </div>

                  {/* Row 2: Deep Analysis Tools */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAISmartEvidence();
                      }}
                      disabled={!!aiActiveAction}
                      className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">🧭</span>
                      <span className="text-blue-800 dark:text-blue-200">
                        Smart Evidence
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Suggest & link docs
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIAuditNotes();
                      }}
                      disabled={!!aiActiveAction}
                      className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">🔍</span>
                      <span className="text-purple-800 dark:text-purple-200">
                        Audit Report
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Full observations
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIInterviewQuestions();
                      }}
                      disabled={!!aiActiveAction}
                      className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">🎤</span>
                      <span className="text-teal-800 dark:text-teal-200">
                        Interview Q&A
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Surveyor questions
                      </span>
                    </button>
                  </div>

                  {/* Row 3: Corrective Actions (for non-compliant/partial) */}
                  {(item.status === ComplianceStatus.NonCompliant ||
                    item.status === ComplianceStatus.PartiallyCompliant ||
                    item.status === ComplianceStatus.NotStarted) && (
                    <div className="border-t border-indigo-200 dark:border-indigo-800 pt-3">
                      <p className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2 tracking-wider">
                        Corrective Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskAI();
                          }}
                          disabled={isGeneratingAI || !!aiActiveAction}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-linear-to-r from-rose-600 to-cyan-600 text-white rounded-lg hover:from-rose-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingAI ? (
                            <>
                              <svg
                                className="animate-spin h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>📋 AI Action Plan</>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePDCA();
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          PDCA Cycle
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateCAPA();
                          }}
                          disabled={isGeneratingCAPA || !!aiActiveAction}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingCAPA ? (
                            <>
                              <svg
                                className="animate-spin h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              AI Analyzing...
                            </>
                          ) : (
                            <>🤖 CAPA Report</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                    AI-powered tools to help auditors assess, document, and
                    remediate standards
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Plan */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("actionPlan") || "Action Plan"}
            </label>
            {isEditing ? (
              <textarea
                value={editedItem.actionPlan || ""}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, actionPlan: e.target.value })
                }
                className="w-full p-2 border rounded text-sm min-h-25"
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {item.actionPlan || "-"}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("notes")}
            </label>
            {isEditing ? (
              <textarea
                value={editedItem.notes || ""}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, notes: e.target.value })
                }
                className="w-full p-2 border rounded text-sm min-h-20"
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {item.notes || "-"}
              </p>
            )}
          </div>

          {/* Status Selection */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("status")}
              </label>
              <select
                value={editedItem.status || item.status}
                onChange={(e) => {
                  const newStatus = e.target.value as ComplianceStatus;
                  setEditedItem({
                    ...editedItem,
                    status: newStatus,
                  });
                }}
                className="w-full p-2 border rounded text-sm"
              >
                {Object.values(ComplianceStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(statusToTranslationKey(status) as any)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Assignment */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium mb-2">
                🏢 {t("department") || "Department"}
              </label>
              <select
                value={editedItem.departmentId || item.departmentId || ""}
                onChange={(e) => {
                  setEditedItem({
                    ...editedItem,
                    departmentId: e.target.value || undefined,
                  });
                }}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">— No Department —</option>
                {(useAppStore.getState().departments || [])
                  .filter((d) => d.isActive !== false)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name.en || d.name.ar}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Evidence Section */}
          {!isEditing && (
            <div>
              <ChecklistEvidence
                item={item}
                project={project}
                isFinalized={isFinalized}
                onUpload={() => {}}
                onLinkData={() => {}}
                onUpdate={handleEvidenceUpdate}
              />
            </div>
          )}

          {/* AI Smart Evidence Suggestions */}
          {!isEditing && aiEvidenceSuggestions.length > 0 && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  🧭 AI-Recommended Evidence
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkSuggestedEvidence();
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                  >
                    🔗 Link All (
                    {
                      aiEvidenceSuggestions.filter(
                        (d) => !item.evidenceFiles.includes(d.id),
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/documents");
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors"
                  >
                    📄 Create in Documents Hub
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {aiEvidenceSuggestions.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 rounded px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.name.en}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {doc.type} • {doc.status}
                        {doc.category ? ` • ${doc.category}` : ""}
                      </p>
                    </div>
                    {!item.evidenceFiles.includes(doc.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUpdate) {
                            onUpdate({
                              evidenceFiles: [...item.evidenceFiles, doc.id],
                            });
                            toast.success(
                              `Linked "${doc.name.en}" as evidence.`,
                            );
                          }
                        }}
                        className="shrink-0 px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                      >
                        🔗 Link
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        ✅ Linked
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 text-center">
                AI-matched documents based on standard requirements •{" "}
                <button
                  onClick={() => navigate("/documents")}
                  className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline"
                >
                  Open Documents Hub
                </button>{" "}
                to create new documents
              </p>
            </div>
          )}

          {!isEditing && reusableEvidenceSuggestions.length > 0 && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Reusable Evidence Suggestions
              </h4>
              <div className="space-y-2">
                {reusableEvidenceSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.documentId}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white dark:bg-gray-800 rounded p-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {suggestion.documentName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Match score: {suggestion.matchScore}
                        {suggestion.matchedStandardIds.length > 0
                          ? ` • Standards: ${suggestion.matchedStandardIds.join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEvidenceUpdate({
                          evidenceFiles: [
                            ...item.evidenceFiles,
                            suggestion.documentId,
                          ],
                        });
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Attach
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          {!isEditing && currentUser && (
            <div>
              <ChecklistComments
                item={item}
                currentUser={currentUser}
                onAddComment={handleAddComment}
              />
            </div>
          )}
        </div>
      )}

      {/* AI Audit Assistant Modal */}
      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setAiModalMode("default");
        }}
        title={aiModalTitle}
        content={aiModalContent}
        type={aiModalType}
        footer={
          aiModalMode === "evidence-advisor" ? (
            <div className="flex items-center gap-2 flex-wrap">
              {aiEvidenceSuggestions.filter(
                (d) => !item.evidenceFiles.includes(d.id),
              ).length > 0 && (
                <button
                  onClick={() => {
                    handleLinkSuggestedEvidence();
                    setAiModalOpen(false);
                    setAiModalMode("default");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  🔗 Link{" "}
                  {
                    aiEvidenceSuggestions.filter(
                      (d) => !item.evidenceFiles.includes(d.id),
                    ).length
                  }{" "}
                  Matching Docs
                </button>
              )}
              <button
                onClick={() => {
                  navigate("/documents");
                  setAiModalOpen(false);
                  setAiModalMode("default");
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
              >
                📄 Go to Documents Hub
              </button>
              <button
                onClick={() => {
                  setAiModalOpen(false);
                  setAiModalMode("default");
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
};

export default React.memo(ChecklistItemComponent);
