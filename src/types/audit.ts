/**
 * Audit Type Definitions
 * Types for document batch auditing, compliance dashboards, and audit-to-change control integration
 */

import { ComplianceIssue, ComplianceScore } from '../services/documentComplianceService';

/**
 * Single document audit result - used in batch audits
 */
export interface AuditedDocument {
    documentId: string;
    documentName: string;
    projectId: string;
    complianceScore: ComplianceScore;
    auditedAt: Date;
    auditedBy: string; // user UID
    auditedByEmail?: string;
    criticalIssuesCount: number;
    changeRequestsCreated?: string[]; // change control request IDs
}

/**
 * Batch audit job status - for tracking long-running batch operations
 */
export interface AuditJobStatus {
    jobId: string;
    projectId: string;
    docIds: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    progress: {
        total: number;
        processed: number;
        successful: number;
        failed: number;
    };
    startedAt: Date;
    completedAt?: Date;
    results: AuditedDocument[];
    errorMessage?: string;
}

/**
 * Data point for compliance trends (time series)
 */
export interface TrendDataPoint {
    date: Date;
    timestamp: number; // Unix timestamp
    overallScore: number;
    completeness: number;
    structure: number;
    language: number;
    readability: number;
    documentCount: number;
    criticalIssuesCount: number;
}

/**
 * Trend data for dashboard visualization
 */
export interface TrendData {
    projectId: string;
    documentId?: string; // if per-document trends
    dataPoints: TrendDataPoint[];
    timeRange: {
        start: Date;
        end: Date;
        days: number;
    };
    statistics: {
        averageScore: number;
        bestScore: number;
        worstScore: number;
        improvementRate: number; // percentage change from first to last score
        trend: 'improving' | 'declining' | 'stable';
    };
}

/**
 * Compliance metrics for dashboard - aggregated stats
 */
export interface ComplianceMetrics {
    projectId: string;
    lastUpdated: Date;
    documentCount: number;
    auditionCount: number;
    averageComplianceScore: number;
    scoreDistribution: {
        excellent: number; // 90-100
        good: number; // 70-89
        fair: number; // 50-69
        poor: number; // below 50
    };
    issueSummary: {
        critical: number;
        warning: number;
        info: number;
    };
    mostCommonIssues: Array<{
        title: string;
        frequency: number;
        affectedDocuments: number;
    }>;
    improvementAreas: Array<{
        area: 'completeness' | 'structure' | 'language' | 'readability';
        currentScore: number;
        targetScore: number;
        documentsNeedingImprovement: number;
    }>;
}

/**
 * Compliance issue with link to change control
 */
export interface AuditedIssueWithChangeControl extends ComplianceIssue {
    documentId: string;
    documentName: string;
    changeRequestId?: string; // if a change request was created
    changeRequestStatus?: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'closed';
    linkedAt?: Date;
}

/**
 * Dashboard view data - combines metrics + trends
 */
export interface ComplianceDashboard {
    metrics: ComplianceMetrics;
    trends: TrendData;
    recentAudits: AuditedDocument[];
    topIssues: AuditedIssueWithChangeControl[];
    performingDocuments: string[]; // document IDs with score > 85
    atRiskDocuments: string[]; // document IDs with score < 50
}

/**
 * Audit-to-change-control mapping
 */
export interface AuditFindingForChangeControl {
    auditId: string;
    documentId: string;
    documentName: string;
    issue: ComplianceIssue;
    severity: 'critical' | 'high' | 'medium' | 'low';
    impactArea: string; // e.g., "Organizational Structure", "Process Documentation"
    proposedResolution: string;
    estimatedEffort: 'low' | 'medium' | 'high'; // based on issue type
    relatedStandards?: string[]; // JCI, CBAHI, MOH
}

/**
 * Document with audit status (for batch audit modals)
 */
export interface AuditedDocWithStatus {
    documentId: string;
    documentName: string;
    projectId: string;
    auditStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
    complianceScore?: ComplianceScore;
    error?: string;
    timestamp?: Date;
}

/**
 * Batch audit request
 */
export interface BatchAuditRequest {
    projectId: string;
    docIds: string[];
    createChangeRequests: boolean; // auto-create change requests for critical issues
    criticalThreshold: number; // only create CRs for issues with score below this
    notifyTeam: boolean;
}

/**
 * Batch audit result summary
 */
export interface BatchAuditResult {
    jobId: string;
    projectId: string;
    auditedDocuments: AuditedDocument[];
    changeRequestsCreated: number;
    criticalIssuesFoundCount: number;
    averageScoreChange: number;
    completedAt: Date;
    summary: {
        overallStatus: 'passed' | 'warning' | 'failed';
        message: string;
    };
}
