/**
 * Supplier Quality Management Types
 * Supplier.ts contains all types for the Supplier Quality Management module
 */

export type SupplierStatus = 'approved' | 'conditional' | 'probation' | 'suspended' | 'inactive';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AuditType = 'compliance' | 'performance' | 'quality' | 'financial' | 'on-site';
export type AuditStatus = 'scheduled' | 'in-progress' | 'completed' | 'failed';
export type FindingCategory = 'critical' | 'major' | 'minor' | 'observation';

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    type: string; // e.g., "Equipment Vendor", "Service Provider", "Chemical/Reagent"
    categories: string[]; // e.g., ["Laboratory Equipment", "Chemicals"]
    status: SupplierStatus;
    riskLevel: RiskLevel;
    scorecard: VendorScorecard;
    certifications: SupplierCertification[];
    contracts: string[]; // Contract/PO IDs
    auditHistory: SupplierAudit[];
    nonConformances: NonConformance[];
    correctionPlans: CorrectionPlan[];
    lastAuditDate?: Date;
    nextAuditDate?: Date;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export interface VendorScorecard {
    id: string;
    supplierId: string;
    overallScore: number; // 0-100
    qualityScore: number; // 0-100
    deliveryScore: number; // 0-100
    responsiveness: number; // 0-100
    complianceScore: number; // 0-100
    lastEvaluationDate: Date;
    nextEvaluationDate: Date;
    history: ScorecardHistory[];
}

export interface ScorecardHistory {
    date: Date;
    overallScore: number;
    qualityScore: number;
    deliveryScore: number;
    responsiveness: number;
    complianceScore: number;
    evaluatedBy: string;
    notes?: string;
}

export interface SupplierAudit {
    id: string;
    supplierId: string;
    type: AuditType;
    status: AuditStatus;
    scheduledDate: Date;
    actualDate?: Date;
    completionDate?: Date;
    auditedBy: string;
    findings: AuditFinding[];
    overallRating: number; // 0-5 stars
    comments: string;
    correctionDeadline?: Date;
    attachments: string[]; // File URLs
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditFinding {
    id: string;
    category: FindingCategory;
    description: string;
    evidence: string;
    rootCause?: string;
    correctionRequired: boolean;
    correctionPlan?: string;
    dueDate?: Date;
    status: 'open' | 'in-progress' | 'closed';
    assignedTo: string;
}

export interface SupplierCertification {
    id: string;
    name: string; // e.g., "ISO 13485", "FDA Registration", "CAP Accreditation"
    issueDate: Date;
    expiryDate: Date;
    issuingBody: string;
    certificateNumber: string;
    documentUrl: string;
    status: 'valid' | 'expiring-soon' | 'expired';
}

export interface NonConformance {
    id: string;
    supplierId: string;
    type: 'quality' | 'delivery' | 'compliance' | 'safety' | 'other';
    severity: FindingCategory;
    description: string;
    reportedDate: Date;
    reportedBy: string;
    status: 'open' | 'under-review' | 'accepted' | 'corrected' | 'closed';
    dueDate?: Date;
    correctionPlan?: CorrectionPlan;
    attachments: string[];
}

export interface CorrectionPlan {
    id: string;
    supplierId: string;
    nonConformanceId?: string;
    auditFindingId?: string;
    title: string;
    description: string;
    rootCause: string;
    correctionActions: CorrectionAction[];
    preventiveActions?: string[];
    dueDate: Date;
    owner: string;
    status: 'open' | 'in-progress' | 'completed' | 'closed';
    completionDate?: Date;
    verificationDate?: Date;
    verifiedBy?: string;
    effectiveness?: 'effective' | 'ineffective' | 'pending-verification';
    createdAt: Date;
    updatedAt: Date;
}

export interface CorrectionAction {
    id: string;
    action: string;
    owner: string;
    dueDate: Date;
    completionDate?: Date;
    status: 'pending' | 'in-progress' | 'completed';
    evidence?: string;
}

export interface SupplierMetrics {
    totalSuppliers: number;
    approvedCount: number;
    probationCount: number;
    suspendedCount: number;
    pendingAuditsCount: number;
    overdueCorrectionPlans: number;
    averageRiskLevel: RiskLevel;
    averageScorecard: number;
    suppliersWithExpiringCertifications: number;
}
