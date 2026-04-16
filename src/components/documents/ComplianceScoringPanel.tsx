import { useTranslation } from "@/hooks/useTranslation";
import {
  analyzeComplianceLanguage,
  analyzeDocumentStructure,
  calculateReadabilityScore,
  calculateStructureScore,
} from "@/services/documentComplianceService";
import React, { useMemo } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "../icons";

interface ComplianceScoringPanelProps {
  htmlContent: string;
  documentType: string;
}

/**
 * Real-time compliance scoring panel for document editor
 * Shows JCI/CBAHI compliance analysis, readability, and improvement suggestions
 */
const ComplianceScoringPanel: React.FC<ComplianceScoringPanelProps> = ({
  htmlContent,
  documentType,
}) => {
  const { t } = useTranslation();

  const analysis = useMemo(() => {
    if (!htmlContent) {
      return {
        structure: 0,
        compliance: 0,
        readability: 0,
        overall: 0,
        structureAnalysis: null,
      };
    }

    const structAnalysis = analyzeDocumentStructure(htmlContent);
    const structScore = calculateStructureScore(structAnalysis);
    const complianceScore = analyzeComplianceLanguage(htmlContent);
    const readabilityScore = calculateReadabilityScore(htmlContent);
    const overall = Math.round(
      (structScore + complianceScore + readabilityScore) / 3,
    );

    return {
      structure: structScore,
      compliance: complianceScore,
      readability: readabilityScore,
      overall,
      structureAnalysis: structAnalysis,
    };
  }, [htmlContent]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-50 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-50 dark:bg-yellow-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  const getMissingRequiredSections = () => {
    if (!analysis.structureAnalysis) return [];
    const missing: string[] = [];
    if (!analysis.structureAnalysis.hasTitle) missing.push("Title");
    if (!analysis.structureAnalysis.hasSummary) missing.push("Summary");
    if (!analysis.structureAnalysis.hasScope) missing.push("Scope");
    if (!analysis.structureAnalysis.hasObjectives) missing.push("Objectives");
    if (!analysis.structureAnalysis.hasProcedures) missing.push("Procedures");
    if (!analysis.structureAnalysis.hasResponsibilities)
      missing.push("Responsibilities");
    if (!analysis.structureAnalysis.hasFrequency)
      missing.push("Review Frequency");
    if (!analysis.structureAnalysis.hasApproval)
      missing.push("Approval/Signature");
    return missing;
  };

  const missingItems = getMissingRequiredSections();

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className={`p-4 rounded-lg ${getScoreBgColor(analysis.overall)}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              {t("complianceScore") || "Compliance Score"}
            </p>
            <p
              className={`text-3xl font-bold ${getScoreColor(analysis.overall)}`}
            >
              {analysis.overall}
              <span className="text-lg">/100</span>
            </p>
          </div>
          <div>
            {analysis.overall >= 80 && (
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            )}
            {analysis.overall >= 60 && analysis.overall < 80 && (
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            )}
            {analysis.overall < 60 && (
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {analysis.overall >= 80
            ? "✓ Meets JCI/CBAHI compliance standards"
            : analysis.overall >= 60
              ? "⚠ Address issues below to improve"
              : "⚠ Significant improvements needed"}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        <ScoreBar
          label={t("structure") || "Structure"}
          score={analysis.structure}
        />
        <ScoreBar
          label={t("complianceLanguage") || "Compliance Language"}
          score={analysis.compliance}
        />
        <ScoreBar
          label={t("readability") || "Readability"}
          score={analysis.readability}
        />
      </div>

      {/* Content Statistics */}
      {analysis.structureAnalysis && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              {t("wordCount") || "Word Count"}:
            </span>
            <span className="font-semibold">
              {analysis.structureAnalysis.wordCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              {t("readingTime") || "Reading Time"}:
            </span>
            <span className="font-semibold">
              ~{analysis.structureAnalysis.estimatedReadingTime} min
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              {t("sections") || "Sections"} (H1-H6):
            </span>
            <span className="font-semibold">
              {analysis.structureAnalysis.headingCount}
            </span>
          </div>
        </div>
      )}

      {/* Missing Required Sections */}
      {missingItems.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3">
          <div className="flex gap-2 items-start mb-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-700 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-300">
                {t("missingRequiredSections") || "Missing Required Sections"}
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-1">
                Add these sections to improve compliance:{" "}
                <span className="font-semibold">{missingItems.join(", ")}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Tips */}
      {analysis.overall < 80 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3">
          <div className="flex gap-2 items-start">
            <SparklesIcon className="w-4 h-4 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                {t("improvementTips") || "Improvement Tips"}
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                {analysis.structure < 75 && (
                  <li>
                    • Use headings (H1, H2, H3) to structure your document
                  </li>
                )}
                {analysis.compliance < 75 && (
                  <li>
                    • Use compliance language: "shall", "should", "must",
                    "required"
                  </li>
                )}
                {analysis.readability < 75 && (
                  <li>
                    • Keep sentences concise and break content into smaller
                    paragraphs
                  </li>
                )}
                {missingItems.length > 0 && (
                  <li>• Ensure all required sections are present</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Reusable score bar component
 */
interface ScoreBarProps {
  label: string;
  score: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score }) => {
  const getColor = (s: number): string => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          {score}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default ComplianceScoringPanel;
