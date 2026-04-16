import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  analyzeDocumentStructure,
  ComplianceScore,
  generateComplianceReport,
  getComplianceImprovementSuggestions,
  scoreDocumentCompliance,
} from "@/services/documentComplianceService";
import DOMPurify from "dompurify";
import React, { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "../icons";

interface DocumentAuditPanelProps {
  content: string;
  documentName: string;
  onClose: () => void;
}

const DocumentAuditPanel: React.FC<DocumentAuditPanelProps> = ({
  content,
  documentName,
  onClose,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [complianceScore, setComplianceScore] =
    useState<ComplianceScore | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Analyze compliance on mount or when content changes
  useEffect(() => {
    const analyzeCompliance = async () => {
      setIsAnalyzing(true);
      try {
        const score = scoreDocumentCompliance(content);
        setComplianceScore(score);
      } catch (error) {
        console.error("Error analyzing compliance:", error);
        toast.error(
          t("complianceAnalysisFailed") ||
            "Failed to analyze document compliance",
        );
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeCompliance();
  }, [content, toast, t]);

  const handleGenerateAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const suggestions = await getComplianceImprovementSuggestions(
        content,
        "CBAHI",
      );
      setAiSuggestions(suggestions);
      setShowSuggestions(true);
      toast.success(t("suggestionsGenerated") || "AI suggestions generated");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error(
        t("failedToGenerateSuggestions") || "Failed to generate suggestions",
      );
    } finally {
      setLoadingAI(false);
    }
  };

  const handleExportReport = () => {
    if (!complianceScore) return;

    try {
      const analysis = analyzeDocumentStructure(content);
      const reportHtml = generateComplianceReport(
        documentName,
        complianceScore,
        analysis,
      );

      // Download report as HTML
      const blob = new Blob([reportHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentName}_compliance_report.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t("reportExported") || "Compliance report exported");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error(t("reportExportFailed") || "Failed to export report");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-brand-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b dark:border-dark-brand-border flex items-center justify-between shrink-0">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("documentAuditor") || "Document Auditor"}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t("close") || "Close"}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <SparklesIcon className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("analyzingDocument") || "Analyzing document..."}
              </p>
            </div>
          </div>
        ) : complianceScore ? (
          <>
            {/* Overall Score Card */}
            <div
              className={`p-4 rounded-lg ${getScoreBgColor(complianceScore.overall)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("overallCompliance") || "Overall Compliance"}
                </span>
                {complianceScore.overall >= 80 && (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div
                className={`text-3xl font-bold ${getScoreColor(complianceScore.overall)} mb-2`}
              >
                {complianceScore.overall}%
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${getScoreColor(complianceScore.overall)} bg-current`}
                  style={{ width: `${complianceScore.overall}%` }}
                />
              </div>
            </div>

            {/* Sub-Scores */}
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: t("structure") || "Structure",
                  value: complianceScore.structure,
                },
                {
                  label: t("completeness") || "Completeness",
                  value: complianceScore.completeness,
                },
                {
                  label: t("language") || "Language",
                  value: complianceScore.language,
                },
                {
                  label: t("readability") || "Readability",
                  value: complianceScore.readability,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                    {value}%
                  </div>
                </div>
              ))}
            </div>

            {/* Issues Section */}
            {complianceScore.issues.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  {t("issues") || "Issues"} ({complianceScore.issues.length})
                </h4>
                <div className="space-y-2">
                  {complianceScore.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        issue.severity === "error"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-600"
                          : issue.severity === "warning"
                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-600"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-600"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1 text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {issue.title}
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                            {issue.description}
                          </div>
                          {issue.suggestion && (
                            <div className="text-gray-700 dark:text-gray-300 text-xs mt-2 italic border-t border-current pt-1 mt-2">
                              💡 {issue.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions Section */}
            {showSuggestions && aiSuggestions && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-blue-600" />
                  {t("aiSuggestions") || "AI Improvement Suggestions"}
                </h4>
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(aiSuggestions),
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {!showSuggestions && (
                <button
                  onClick={handleGenerateAISuggestions}
                  disabled={loadingAI}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-primary text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {loadingAI
                    ? t("generating") || "Generating..."
                    : t("generateSuggestions") || "Generate Suggestions"}
                </button>
              )}
              <button
                onClick={handleExportReport}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {t("exportReport") || "Export Report"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default React.memo(DocumentAuditPanel);
