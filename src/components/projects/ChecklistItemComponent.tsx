import React, { useMemo, useState } from "react";
import { ChecklistItem, Project, ComplianceStatus, Comment } from "@/types";
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

  const statusColors: Record<string, string> = {
    [ComplianceStatus.Compliant]:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    [ComplianceStatus.NonCompliant]:
      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    [ComplianceStatus.PartiallyCompliant]:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
    [ComplianceStatus.NotApplicable]:
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    [ComplianceStatus.NotStarted]:
      "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
  };

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
    if (!currentUser) return;

    // Use editedItem if in edit mode (unsaved changes), otherwise use item
    const currentData = isEditing ? editedItem : item;

    try {
      await createCAPA(project.id, {
        checklistItemId: currentData.id || "",
        description: `${currentData.standardId}: ${currentData.item}${
          suggestedCrossReferences.length > 0
            ? `\nCross-standard references: ${suggestedCrossReferences.join(", ")}`
            : ""
        }`,
        rootCause: "To be analyzed",
        correctiveAction: currentData.actionPlan || "To be defined",
        preventiveAction: "To be defined",
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
      toast.success("CAPA Report created successfully!");
    } catch (error) {
      toast.error("Failed to create CAPA report");
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
              {t(
                (item.status.charAt(0).toLowerCase() +
                  item.status.slice(1).replace(/\s/g, "")) as any,
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{t("standard")}:</span>
            <span>{item.standardId}</span>
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
                <span>{new Date(item.dueDate).toLocaleDateString()}</span>
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
                onChange={(e) =>
                  setEditedItem({
                    ...editedItem,
                    status: e.target.value as ComplianceStatus,
                  })
                }
                className="w-full p-2 border rounded text-sm"
              >
                {Object.values(ComplianceStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(
                      (status.charAt(0).toLowerCase() +
                        status.slice(1).replace(/\s/g, "")) as any,
                    )}
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

          {/* Smart Actions - Auto-create from Non-Compliant Items */}
          {!isEditing &&
            (item.status === ComplianceStatus.NonCompliant ||
              item.status === ComplianceStatus.PartiallyCompliant) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
                  🔗 Smart Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAI();
                    }}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-linear-to-r from-rose-600 to-cyan-600 text-white rounded-lg hover:from-rose-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAI ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                      <>🤖 Ask AI for Action Plan</>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreatePDCA();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create PDCA Cycle
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateCAPA();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create CAPA Report
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ℹ️ Use AI to generate action plans or create improvement
                  actions from this non-compliant item
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ChecklistItemComponent;
