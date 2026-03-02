/**
 * Change Control Types
 * Models for change requests, approvals, impact analysis, and workflow
 */

export type ChangeStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'implemented' | 'rejected' | 'cancelled';
export type ChangePriority = 'low' | 'medium' | 'high' | 'critical';
export type ImpactLevel = 'minimal' | 'moderate' | 'significant' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

/**
 * Impact Analysis - Detailed impact on systems, processes, and documentation
 */
export interface ChangeImpact {
    id: string;
    changeId: string;
    affectedSystems: string[]; // e.g., ["lab operations", "compliance", "documentation"]
    affectedProcesses: string[]; // e.g., ["specimen processing", "QC procedures"]
    affectedDocuments: string[]; // Document IDs from DocumentControl
    dependentChanges: string[]; // Other change request IDs
    riskAssessment: string;
    riskLevel: ImpactLevel;
    mitigation: string;
    backoutPlan: string;
    estimatedImplementationHours: number;
    estimatedTestingHours: number;
    dateCreated: Date;
    lastUpdated: Date;
}

/**
 * Approval Record - Single approval from a reviewer
 */
export interface ApprovalRecord {
    id: string;
    changeId: string;
    approverId: string;
    approverName: string;
    approverRole: string;
    status: ApprovalStatus;
    comments: string;
    dateSubmitted: Date;
    dateReviewed?: Date;
}

/**
 * Implementation Record - Track actual implementation details
 */
export interface ImplementationRecord {
    id: string;
    changeId: string;
    implementedBy: string;
    implementedByName: string;
    implementationDate: Date;
    actualHoursSpent: number;
    successCriteriaMet: boolean;
    issues: string[]; // Issues encountered
    notes: string;
    verificationResults: string;
    rollbackRequired: boolean;
    dateCompleted: Date;
}

/**
 * Verification Record - Post-implementation verification
 */
export interface VerificationRecord {
    id: string;
    changeId: string;
    verifiedBy: string;
    verifiedByName: string;
    verificationDate: Date;
    testResultsPass: boolean;
    deviationsFound: string[];
    additionalActions: string[];
    comments: string;
    dateVerified: Date;
}

/**
 * Change Request - Main aggregate for change control
 */
export interface ChangeRequest {
    id: string;
    title: string;
    description: string;
    changeType: 'process' | 'system' | 'documentation' | 'training' | 'other';
    priority: ChangePriority;
    status: ChangeStatus;

    // Requestor info
    requestedBy: string;
    requestedByName: string;
    dateRequested: Date;

    // Business justification
    businessJustification: string;
    expectedBenefits: string;

    // Change details
    detailedDescription: string;
    scope: string;
    includedInPhase?: string;

    // Impact & risk
    impact: ChangeImpact | null;

    // Approval workflow
    approvals: ApprovalRecord[];
    requiredApprovals: number;
    approvalDeadline?: Date;

    // Implementation
    plannedStartDate: Date;
    plannedEndDate: Date;
    implementation?: ImplementationRecord;

    // Verification
    verification?: VerificationRecord;

    // Related documents
    supportingDocuments: string[]; // Document IDs
    auditTrail: AuditEntry[];

    // Metadata
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
}

/**
 * Audit Entry - Track all changes to a change request
 */
export interface AuditEntry {
    id: string;
    timestamp: Date;
    action: string; // e.g., "status_changed", "approval_added", "impact_updated"
    performedBy: string;
    performedByName: string;
    details: Record<string, any>;
}

/**
 * Change Metrics - Analytics and reporting
 */
export interface ChangeMetrics {
    totalRequests: number;
    draftCount: number;
    submittedCount: number;
    underReviewCount: number;
    approvedCount: number;
    implementedCount: number;
    rejectedCount: number;
    cancelledCount: number;
    averageReviewTime: number; // hours
    averageImplementationTime: number; // hours
    approvalRate: number; // percentage
    successRate: number; // percentage
    highPriorityCount: number;
    criticalRiskCount: number;
}

/**
 * Change Log - For filtering and searching
 */
export interface ChangeLog {
    id: string;
    requestId: string;
    priority: ChangePriority;
    status: ChangeStatus;
    title: string;
    requestedBy: string;
    dateRequested: Date;
    riskLevel?: ImpactLevel;
    approvalCount: number;
    requiredApprovals: number;
}
