/**
 * Change Request Card Component
 * Displays a change request in card format for list view
 */

import { useTranslation } from "@/hooks/useTranslation";
import {
  ChangePriority,
  ChangeRequest,
  ChangeStatus,
} from "@/types/changeControl";
import { AlertCircle, ChevronRight } from "lucide-react";

interface ChangeRequestCardProps {
  request: ChangeRequest;
  onClick: () => void;
}

export default function ChangeRequestCard({
  request,
  onClick,
}: ChangeRequestCardProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: ChangeStatus) => {
    const colors: Record<
      ChangeStatus,
      { bg: string; text: string; dot: string }
    > = {
      draft: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
      submitted: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      },
      under_review: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        dot: "bg-green-500",
      },
      implemented: {
        bg: "bg-teal-50",
        text: "text-teal-700",
        dot: "bg-teal-500",
      },
      rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      cancelled: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        dot: "bg-gray-400",
      },
    };
    return colors[status] || colors.draft;
  };

  const getPriorityColor = (priority: ChangePriority) => {
    const colors: Record<ChangePriority, string> = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[priority];
  };

  const getPriorityBg = (priority: ChangePriority) => {
    const colors: Record<ChangePriority, string> = {
      low: "bg-green-50",
      medium: "bg-yellow-50",
      high: "bg-orange-50",
      critical: "bg-red-50",
    };
    return colors[priority];
  };

  const statusColor = getStatusColor(request.status);
  const approvalProgress =
    request.approvals.length > 0
      ? (request.approvals.filter((a) => a.status === "approved").length /
          request.approvals.length) *
        100
      : 0;

  return (
    <button
      onClick={onClick}
      className={`block w-full text-left p-4 rounded-lg border border-brand-border dark:border-dark-brand-border hover:shadow-md transition-shadow ${statusColor.bg}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${statusColor.dot}`} />
            <h3 className="text-base font-semibold text-brand-text-primary dark:text-dark-brand-text-primary truncate">
              {request.title}
            </h3>
            <span
              className={`ml-auto flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${statusColor.text} bg-white/50`}
            >
              {t(`status.${request.status}`) || request.status}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-3 line-clamp-2">
            {request.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-3">
            <span>
              {t("requested")}{" "}
              {new Date(request.dateRequested).toLocaleDateString()}
            </span>
            {request.requestedByName && (
              <span>by {request.requestedByName}</span>
            )}
            {request.approvalDeadline && (
              <span
                className={
                  new Date(request.approvalDeadline) < new Date()
                    ? "text-red-600 font-medium"
                    : ""
                }
              >
                {t("deadline")}:{" "}
                {new Date(request.approvalDeadline).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Priority and Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBg(request.priority)} ${getPriorityColor(request.priority)}`}
            >
              {t(`priority.${request.priority}`) || request.priority}
            </span>
            {request.tags && request.tags.length > 0 && (
              <div className="flex gap-1">
                {request.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded text-xs bg-brand-primary/10 text-brand-primary"
                  >
                    {tag}
                  </span>
                ))}
                {request.tags.length > 2 && (
                  <span className="px-2 py-1 rounded text-xs text-brand-text-secondary">
                    +{request.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Approval Progress */}
          {request.requiredApprovals > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-brand-text-secondary">
                {t("approvals")}:{" "}
                {
                  request.approvals.filter((a) => a.status === "approved")
                    .length
                }
                /{request.requiredApprovals}
              </span>
              <div className="h-2 bg-gray-200 rounded-full flex-1 max-w-xs">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${approvalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Risk Alert */}
          {request.impact?.riskLevel === "critical" && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle size={14} />
              {t("criticalRisk")}
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight
          size={20}
          className="text-brand-text-secondary flex-shrink-0 mt-1"
        />
      </div>
    </button>
  );
}
