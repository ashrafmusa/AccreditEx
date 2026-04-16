import {
  ArrowRightIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  generateImprovementActions,
  getLinkedAuditIssues,
  getLinkedChangeRequests,
} from "@/services/auditChangeControlService";
import { AuditedIssueWithChangeControl } from "@/types/audit";
import { useEffect, useState } from "react";

interface AuditChangeControlPanelProps {
  documentId: string;
  projectId: string;
  documentName?: string;
}

interface ImprovementAction {
  action: string;
  priority: "high" | "medium" | "low";
  estimatedDays: number;
}

export default function AuditChangeControlPanel({
  documentId,
  projectId,
  documentName = "Document",
}: AuditChangeControlPanelProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [linkedIssues, setLinkedIssues] = useState<
    AuditedIssueWithChangeControl[]
  >([]);
  const [linkedChangeRequests, setLinkedChangeRequests] = useState<
    Array<{ crId: string; createdAt: Date }>
  >([]);
  const [improvementActions, setImprovementActions] = useState<
    ImprovementAction[]
  >([]);
  const [expandedIssues, setExpandedIssues] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    loadData();
  }, [documentId, projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [issues, crs, actions] = await Promise.all([
        getLinkedAuditIssues(documentId, projectId),
        getLinkedChangeRequests(documentId, projectId),
        generateImprovementActions(documentId, projectId),
      ]);

      setLinkedIssues(issues);
      setLinkedChangeRequests(crs);
      setImprovementActions(actions);
    } catch (error) {
      console.error("Error loading audit change control data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "info":
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
      case "critical":
        return <XCircleIcon className="w-4 h-4" />;
      case "warning":
      case "high":
        return <ExclamationCircleIcon className="w-4 h-4" />;
      default:
        return <ClipboardDocumentCheckIcon className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const toggleIssueExpanded = (issueId: string) => {
    setExpandedIssues((prev) => ({
      ...prev,
      [issueId]: !prev[issueId],
    }));
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t("common.loading") || "Loading..."}
      </div>
    );
  }

  const hasCriticalIssues = linkedIssues.some(
    (issue) => issue.severity === "error",
  );
  const hasChangeRequests = linkedChangeRequests.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-brand-primary/80 dark:from-blue-900 dark:to-brand-primary/80 rounded-lg border border-blue-200 dark:border-blue-700">
        <h3 className="font-semibold text-brand-text-primary mb-2">
          Audit & Change Control
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {documentName} - Audit findings linked to change requests
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {linkedIssues.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Audit Issues
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-primary dark:text-brand-primary">
              {linkedChangeRequests.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Change Requests
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {improvementActions.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Actions
            </div>
          </div>
        </div>
      </div>

      {/* No Data State */}
      {linkedIssues.length === 0 && linkedChangeRequests.length === 0 && (
        <div className="p-6 text-center bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <CheckCircleIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No audit issues found. Document is compliant.
          </p>
        </div>
      )}

      {/* Critical Alert */}
      {hasCriticalIssues && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 rounded">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Critical Issues Found
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {linkedIssues.filter((i) => i.severity === "error").length}{" "}
                critical compliance issues require immediate attention. Change
                requests have been created.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Linked Audit Issues */}
      {linkedIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-brand-text-primary flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-4 h-4" />
            Audit Findings ({linkedIssues.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {linkedIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => toggleIssueExpanded(issue.id)}
                className={`w-full p-3 rounded-lg border text-left transition ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                  {issue.changeRequestId && (
                    <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                      CR: {issue.changeRequestId.split("-")[0]}
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedIssues[issue.id] && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                    {issue.suggestion && (
                      <div>
                        <p className="text-xs font-semibold opacity-75">
                          Suggestion:
                        </p>
                        <p className="text-xs mt-1">{issue.suggestion}</p>
                      </div>
                    )}
                    {issue.section && (
                      <div>
                        <p className="text-xs font-semibold opacity-75">
                          Section:
                        </p>
                        <p className="text-xs">{issue.section}</p>
                      </div>
                    )}
                    {issue.changeRequestId && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircleIcon className="w-3 h-3" />
                        <span>
                          Change Request {issue.changeRequestId}{" "}
                          {issue.changeRequestStatus &&
                            `(${issue.changeRequestStatus})`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Actions */}
      {improvementActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-brand-text-primary flex items-center gap-2">
            <ArrowRightIcon className="w-4 h-4" />
            Recommended Actions ({improvementActions.length})
          </h4>
          <div className="space-y-2">
            {improvementActions.map((action, index) => (
              <div
                key={`${action.action}-${index}`}
                className={`p-3 rounded-lg border ${getPriorityColor(action.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.action}</p>
                    <p className="text-xs opacity-75 mt-1">
                      Estimated effort: {action.estimatedDays} days
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded capitalize opacity-75`}
                  >
                    {action.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Control Link Info */}
      {linkedChangeRequests.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            Change Requests Created
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
            {linkedChangeRequests.length} change request(s) have been generated
            from audit findings. These are tracked in your Change Control
            system.
          </p>
          <div className="mt-3 space-y-1">
            {linkedChangeRequests.map((cr) => (
              <div
                key={cr.crId}
                className="text-xs flex items-center gap-2 text-blue-700 dark:text-blue-300"
              >
                <CheckCircleIcon className="w-3 h-3" />
                {cr.crId} - Created{" "}
                {new Date(cr.createdAt).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
