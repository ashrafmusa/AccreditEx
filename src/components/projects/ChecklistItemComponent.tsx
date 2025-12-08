import React, { useState } from "react";
import { ChecklistItem, Project, ComplianceStatus, Comment } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  PencilIcon,
} from "@/components/icons";
import ChecklistComments from "./ChecklistComments";
import ChecklistEvidence from "./ChecklistEvidence";
import { useUserStore } from "@/stores/useUserStore";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<ChecklistItem>>(item);

  const statusColors = {
    [ComplianceStatus.Compliant]:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    [ComplianceStatus.NonCompliant]:
      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    [ComplianceStatus.PartiallyCompliant]:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
    [ComplianceStatus.NotApplicable]:
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start justify-between"
      >
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex-grow">
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
                  item.status.slice(1).replace(/\s/g, "")) as any
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
                className="px-3 py-1 text-xs bg-brand-primary text-white rounded hover:bg-indigo-700 transition-colors"
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
                className="w-full p-2 border rounded text-sm min-h-[100px]"
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
                className="w-full p-2 border rounded text-sm min-h-[80px]"
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
                        status.slice(1).replace(/\s/g, "")) as any
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
    </div>
  );
};

export default ChecklistItemComponent;
