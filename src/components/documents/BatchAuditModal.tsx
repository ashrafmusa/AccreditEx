import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { createChangeRequestsFromAudit } from "@/services/auditChangeControlService";
import {
  auditProjectDocuments,
  batchAuditDocuments,
} from "@/services/documentBatchAuditService";
import { BatchAuditResult } from "@/types/audit";
import { useEffect, useState } from "react";

interface BatchAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  documentIds?: string[];
  onAuditComplete?: (result: BatchAuditResult) => void;
  auditAllDocuments?: boolean; // If true, audit entire project ignoring documentIds
}

export default function BatchAuditModal({
  isOpen,
  onClose,
  projectId,
  documentIds = [],
  onAuditComplete,
  auditAllDocuments = false,
}: BatchAuditModalProps) {
  const { t } = useTranslation();
  const [isAuditing, setIsAuditing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [processedDocs, setProcessedDocs] = useState(0);
  const [auditResult, setAuditResult] = useState<BatchAuditResult | null>(null);
  const [expandedResults, setExpandedResults] = useState<{
    [key: string]: boolean;
  }>({});
  const [createChangeRequests, setCreateChangeRequests] = useState(true);
  const [autoCreateThreshold, setAutoCreateThreshold] = useState(70);

  useEffect(() => {
    if (isOpen && !isAuditing && !auditResult) {
      // Auto-start audit when modal opens
      startAudit();
    }
  }, [isOpen]);

  const startAudit = async () => {
    try {
      setIsAuditing(true);
      setProgress(0);
      setProcessedDocs(0);
      setAuditResult(null);

      let result: BatchAuditResult;

      if (auditAllDocuments) {
        // Audit entire project
        console.log("Auditing all documents in project...");
        result = await auditProjectDocuments(projectId);
      } else if (documentIds.length > 0) {
        // Audit specific documents
        console.log(`Auditing ${documentIds.length} documents...`);
        setTotalDocs(documentIds.length);
        result = await batchAuditDocuments(documentIds, projectId);
      } else {
        throw new Error("No documents to audit");
      }

      setTotalDocs(result.auditedDocuments.length);
      setProcessedDocs(result.auditedDocuments.length);

      // Create change requests if enabled
      if (createChangeRequests) {
        let crCount = 0;
        for (const doc of result.auditedDocuments) {
          if (doc.complianceScore.overall < autoCreateThreshold) {
            const crIds = await createChangeRequestsFromAudit(
              doc,
              autoCreateThreshold,
            );
            crCount += crIds.length;
            doc.changeRequestsCreated = crIds;
          }
        }
        result.changeRequestsCreated = crCount;
      }

      setAuditResult(result);
      setProgress(100);

      // Call callback
      if (onAuditComplete) {
        onAuditComplete(result);
      }
    } catch (error) {
      console.error("Batch audit error:", error);
      setProgress(0);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleClose = () => {
    if (!isAuditing) {
      setAuditResult(null);
      setProgress(0);
      setProcessedDocs(0);
      onClose();
    }
  };

  const toggleExpanded = (docId: string) => {
    setExpandedResults((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const downloadResults = () => {
    if (!auditResult) return;

    const csv = generateResultsCSV(auditResult);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-results-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusIcon = (score: number) => {
    if (score >= 85)
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    if (score >= 70)
      return <ExclamationCircleIcon className="w-5 h-5 text-yellow-600" />;
    return <XCircleIcon className="w-5 h-5 text-red-600" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("documents.batchAudit") || "Batch Compliance Audit"}
      size="2xl"
      maxHeight="80vh"
      footer={
        <div className="flex gap-2 justify-end">
          {auditResult && (
            <>
              <Button onClick={downloadResults} variant="secondary">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Results
              </Button>
              <Button onClick={handleClose}>
                {t("common.close") || "Close"}
              </Button>
            </>
          )}
          {isAuditing && (
            <Button disabled>{t("documents.auditing") || "Auditing..."}</Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isAuditing
            ? `Auditing ${processedDocs}/${totalDocs} documents...`
            : auditResult
              ? `Audit complete: ${auditResult.auditedDocuments.length} documents`
              : "Running compliance audit on documents..."}
        </p>

        {/* Progress Section */}
        {isAuditing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {processedDocs}/{totalDocs}
              </span>
              <span className="text-sm text-gray-600">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 dark:bg-blue-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {t("documents.auditInProgress") || "Running..."}
            </p>
          </div>
        )}

        {/* Results Section */}
        {auditResult && !isAuditing && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600">Documents Audited</p>
                <p className="text-2xl font-bold text-blue-600">
                  {auditResult.auditedDocuments.length}
                </p>
              </div>
              <div className="p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/40">
                <p className="text-xs text-gray-600">Average Score</p>
                <p
                  className={`text-2xl font-bold ${auditResult.averageScoreChange >= 70 ? "text-brand-primary" : "text-orange-600"}`}
                >
                  {auditResult.averageScoreChange.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditResult.criticalIssuesFoundCount}
                </p>
              </div>
            </div>

            {/* Status Message */}
            <div
              className={`p-4 rounded-lg border ${
                auditResult.summary.overallStatus === "passed"
                  ? "bg-green-50 border-green-200"
                  : auditResult.summary.overallStatus === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <p className="text-sm font-medium">
                {auditResult.summary.message}
              </p>
            </div>

            {/* Document Results */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Document Results</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {auditResult.auditedDocuments.map((doc) => (
                  <div key={doc.documentId} className="border rounded-lg">
                    <button
                      onClick={() => toggleExpanded(doc.documentId)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(doc.complianceScore.overall)}
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium">
                            {doc.documentName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.criticalIssuesCount} critical issues
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold px-3 py-1 rounded ${getScoreColor(
                          doc.complianceScore.overall,
                        )}`}
                      >
                        {doc.complianceScore.overall.toFixed(0)}%
                      </div>
                      {expandedResults[doc.documentId] ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {/* Expanded Details */}
                    {expandedResults[doc.documentId] && (
                      <div className="px-3 pb-3 pt-0 border-t bg-gray-50">
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-gray-600">Completeness</p>
                              <p className="font-semibold">
                                {doc.complianceScore.completeness.toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Structure</p>
                              <p className="font-semibold">
                                {doc.complianceScore.structure.toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Language</p>
                              <p className="font-semibold">
                                {doc.complianceScore.language.toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Readability</p>
                              <p className="font-semibold">
                                {doc.complianceScore.readability.toFixed(0)}%
                              </p>
                            </div>
                          </div>

                          {/* Issues */}
                          {doc.complianceScore.issues.length > 0 && (
                            <div className="mt-2">
                              <p className="font-semibold text-gray-700 text-xs uppercase">
                                Issues ({doc.complianceScore.issues.length})
                              </p>
                              <div className="mt-1 space-y-1">
                                {doc.complianceScore.issues
                                  .slice(0, 3)
                                  .map((issue) => (
                                    <div
                                      key={issue.id}
                                      className="text-xs p-1 bg-white rounded border-l-2 border-orange-400"
                                    >
                                      <p className="font-medium">
                                        {issue.title}
                                      </p>
                                      <p className="text-gray-600">
                                        {issue.description}
                                      </p>
                                    </div>
                                  ))}
                                {doc.complianceScore.issues.length > 3 && (
                                  <p className="text-xs text-gray-500 italic">
                                    +{doc.complianceScore.issues.length - 3}{" "}
                                    more issues
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Change Requests */}
                          {doc.changeRequestsCreated &&
                            doc.changeRequestsCreated.length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                <p className="text-xs font-semibold text-blue-700">
                                  ✓ {doc.changeRequestsCreated.length} change
                                  request(s) created
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Generate CSV from audit results
 */
function generateResultsCSV(result: BatchAuditResult): string {
  const headers = [
    "Document Name",
    "Overall Score",
    "Completeness",
    "Structure",
    "Language",
    "Readability",
    "Critical Issues",
    "Change Requests Created",
  ];

  const rows = result.auditedDocuments.map((doc) => [
    doc.documentName,
    doc.complianceScore.overall.toFixed(1),
    doc.complianceScore.completeness.toFixed(1),
    doc.complianceScore.structure.toFixed(1),
    doc.complianceScore.language.toFixed(1),
    doc.complianceScore.readability.toFixed(1),
    doc.criticalIssuesCount.toString(),
    doc.changeRequestsCreated?.length || 0,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
