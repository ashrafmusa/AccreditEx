/**
 * Change Control Service
 * Manages change requests, approvals, impact analysis, and implementation tracking
 */

import { db } from '@/firebase/firebaseConfig';
import {
    ApprovalRecord,
    AuditEntry,
    ChangeImpact,
    ChangeMetrics,
    ChangePriority,
    ChangeRequest,
    ChangeStatus,
    ImplementationRecord,
    VerificationRecord
} from '@/types/changeControl';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc
} from 'firebase/firestore';

// ============================================================
// CHANGE REQUESTS - CRUD OPERATIONS
// ============================================================

export async function getChangeRequests(
    filters?: {
        status?: ChangeStatus;
        priority?: ChangePriority;
        search?: string;
    }
): Promise<ChangeRequest[]> {
    try {
        const requestsRef = collection(db, 'changeRequests');
        let q = query(requestsRef, orderBy('dateRequested', 'desc'));

        const snapshot = await getDocs(q);
        let requests = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            dateRequested: doc.data().dateRequested?.toDate?.() ?? new Date(),
            plannedStartDate: doc.data().plannedStartDate?.toDate?.() ?? new Date(),
            plannedEndDate: doc.data().plannedEndDate?.toDate?.() ?? new Date(),
            createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
        } as ChangeRequest));

        // Apply filters
        if (filters?.status) {
            requests = requests.filter((r) => r.status === filters.status);
        }
        if (filters?.priority) {
            requests = requests.filter((r) => r.priority === filters.priority);
        }
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            requests = requests.filter(
                (r) =>
                    r.title.toLowerCase().includes(search) ||
                    r.description.toLowerCase().includes(search)
            );
        }

        return requests;
    } catch (error) {
        console.error('Failed to fetch change requests:', error);
        throw error;
    }
}

export async function getChangeRequest(id: string): Promise<ChangeRequest | null> {
    try {
        const ref = doc(db, 'changeRequests', id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return null;
        }

        const data = snap.data();
        return {
            ...data,
            id: snap.id,
            dateRequested: data.dateRequested?.toDate?.() ?? new Date(),
            plannedStartDate: data.plannedStartDate?.toDate?.() ?? new Date(),
            plannedEndDate: data.plannedEndDate?.toDate?.() ?? new Date(),
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as ChangeRequest;
    } catch (error) {
        console.error(`Failed to fetch change request ${id}:`, error);
        return null;
    }
}

export async function createChangeRequest(
    request: Omit<ChangeRequest, 'id' | 'auditTrail' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<ChangeRequest> {
    try {
        const now = new Date();
        const docRef = await addDoc(collection(db, 'changeRequests'), {
            ...request,
            status: 'draft',
            approvals: [],
            auditTrail: [
                {
                    id: `audit-${Date.now()}`,
                    timestamp: Timestamp.fromDate(now),
                    action: 'created',
                    performedBy: userId,
                    performedByName: request.requestedByName,
                    details: { status: 'draft' },
                },
            ],
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
            dateRequested: Timestamp.fromDate(request.dateRequested),
            plannedStartDate: Timestamp.fromDate(request.plannedStartDate),
            plannedEndDate: Timestamp.fromDate(request.plannedEndDate),
        });

        return {
            ...request,
            id: docRef.id,
            status: 'draft',
            auditTrail: [],
            createdAt: now,
            updatedAt: now,
            approvals: [],
        } as ChangeRequest;
    } catch (error) {
        console.error('Failed to create change request:', error);
        throw error;
    }
}

export async function updateChangeRequest(
    id: string,
    updates: Partial<ChangeRequest>,
    userId: string
): Promise<void> {
    try {
        const now = new Date();
        const ref = doc(db, 'changeRequests', id);

        const auditEntry: AuditEntry = {
            id: `audit-${Date.now()}`,
            timestamp: now,
            action: 'updated',
            performedBy: userId,
            performedByName: 'System',
            details: Object.keys(updates),
        };

        await updateDoc(ref, {
            ...updates,
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
            auditTrail: [...(updates.auditTrail || []), auditEntry],
        });
    } catch (error) {
        console.error(`Failed to update change request ${id}:`, error);
        throw error;
    }
}

export async function deleteChangeRequest(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'changeRequests', id));
    } catch (error) {
        console.error(`Failed to delete change request ${id}:`, error);
        throw error;
    }
}

// ============================================================
// APPROVAL WORKFLOW
// ============================================================

export async function submitForApproval(
    requestId: string,
    requiredApprovals: number,
    userId: string
): Promise<void> {
    try {
        const now = new Date();
        const ref = doc(db, 'changeRequests', requestId);

        await updateDoc(ref, {
            status: 'submitted',
            requiredApprovals,
            approvalDeadline: Timestamp.fromDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)), // 7 days
            auditTrail: {
                id: `audit-${Date.now()}`,
                timestamp: Timestamp.fromDate(now),
                action: 'submitted_for_approval',
                performedBy: userId,
                performedByName: 'System',
                details: { requiredApprovals },
            },
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
        });

        console.log(`Change request ${requestId} submitted for approval`);
    } catch (error) {
        console.error(`Failed to submit change request ${requestId} for approval:`, error);
        throw error;
    }
}

export async function addApproval(
    requestId: string,
    approval: Omit<ApprovalRecord, 'id' | 'dateSubmitted'>,
    userId: string
): Promise<void> {
    try {
        const now = new Date();
        const ref = doc(db, 'changeRequests', requestId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            throw new Error(`Change request ${requestId} not found`);
        }

        const request = snap.data() as ChangeRequest;
        const newApproval: ApprovalRecord = {
            ...approval,
            id: `approval-${Date.now()}`,
            dateSubmitted: now,
        };

        const updatedApprovals = [...(request.approvals || []), newApproval];
        const approvalsCount = updatedApprovals.filter((a) => a.status === 'approved').length;

        let newStatus: ChangeStatus = request.status;
        if (approvalsCount >= request.requiredApprovals) {
            newStatus = 'approved';
        }

        await updateDoc(ref, {
            approvals: updatedApprovals,
            status: newStatus,
            auditTrail: {
                id: `audit-${Date.now()}`,
                timestamp: Timestamp.fromDate(now),
                action: 'approval_added',
                performedBy: userId,
                performedByName: 'System',
                details: { approverId: approval.approverId, approved: approvalsCount >= request.requiredApprovals },
            },
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
        });

        console.log(`Approval added to change request ${requestId}`);
    } catch (error) {
        console.error(`Failed to add approval to change request ${requestId}:`, error);
        throw error;
    }
}

// ============================================================
// IMPACT ANALYSIS
// ============================================================

export async function updateImpact(
    requestId: string,
    impact: ChangeImpact,
    userId: string
): Promise<void> {
    try {
        const now = new Date();
        const ref = doc(db, 'changeRequests', requestId);

        await updateDoc(ref, {
            impact,
            auditTrail: {
                id: `audit-${Date.now()}`,
                timestamp: Timestamp.fromDate(now),
                action: 'impact_analysis_updated',
                performedBy: userId,
                performedByName: 'System',
                details: { riskLevel: impact.riskLevel },
            },
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
        });

        console.log(`Impact analysis updated for change request ${requestId}`);
    } catch (error) {
        console.error(`Failed to update impact for change request ${requestId}:`, error);
        throw error;
    }
}

// ============================================================
// IMPLEMENTATION TRACKING
// ============================================================

export async function recordImplementation(
    requestId: string,
    implementation: Omit<ImplementationRecord, 'id' | 'dateCompleted'>,
    userId: string
): Promise<void> {
    try {
        const now = new Date();
        const ref = doc(db, 'changeRequests', requestId);

        const record: ImplementationRecord = {
            ...implementation,
            id: `impl-${Date.now()}`,
            dateCompleted: now,
        };

        await updateDoc(ref, {
            implementation: record,
            status: 'implemented',
            auditTrail: {
                id: `audit-${Date.now()}`,
                timestamp: Timestamp.fromDate(now),
                action: 'implementation_recorded',
                performedBy: userId,
                performedByName: 'System',
                details: { successCriteriaMet: implementation.successCriteriaMet },
            },
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
        });

        console.log(`Implementation recorded for change request ${requestId}`);
    } catch (error) {
        console.error(`Failed to record implementation for change request ${requestId}:`, error);
        throw error;
    }
}

export async function recordVerification(
    requestId: string,
    verification: Omit<VerificationRecord, 'id' | 'dateVerified'>,
    userId: string
): Promise<void> {
    try {
        const now = new Date();
        const ref = doc(db, 'changeRequests', requestId);

        const record: VerificationRecord = {
            ...verification,
            id: `verify-${Date.now()}`,
            dateVerified: now,
        };

        await updateDoc(ref, {
            verification: record,
            auditTrail: {
                id: `audit-${Date.now()}`,
                timestamp: Timestamp.fromDate(now),
                action: 'verification_recorded',
                performedBy: userId,
                performedByName: 'System',
                details: { testResultsPass: verification.testResultsPass },
            },
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
        });

        console.log(`Verification recorded for change request ${requestId}`);
    } catch (error) {
        console.error(`Failed to record verification for change request ${requestId}:`, error);
        throw error;
    }
}

// ============================================================
// CHANGE METRICS
// ============================================================

export async function getChangeMetrics(): Promise<ChangeMetrics> {
    try {
        const requests = await getChangeRequests();

        const statusCounts = {
            draft: 0,
            submitted: 0,
            under_review: 0,
            approved: 0,
            implemented: 0,
            rejected: 0,
            cancelled: 0,
        };

        let totalReviewTime = 0;
        let totalImplementationTime = 0;
        let implementedCount = 0;
        let successCount = 0;
        let highPriorityCount = 0;
        let criticalRiskCount = 0;

        requests.forEach((req) => {
            statusCounts[req.status as keyof typeof statusCounts]++;

            if (req.priority === 'high' || req.priority === 'critical') {
                highPriorityCount++;
            }

            if (req.impact?.riskLevel === 'critical') {
                criticalRiskCount++;
            }

            // Calculate review time
            if (req.approvals && req.approvals.length > 0) {
                const firstApproval = req.approvals[0];
                const lastApproval = req.approvals[req.approvals.length - 1];
                const reviewTime =
                    (new Date(lastApproval.dateReviewed || new Date()).getTime() -
                        new Date(firstApproval.dateSubmitted).getTime()) /
                    (1000 * 60 * 60);
                totalReviewTime += reviewTime;
            }

            // Calculate implementation time
            if (req.implementation) {
                totalImplementationTime += req.implementation.actualHoursSpent;
                implementedCount++;
                if (req.implementation.successCriteriaMet) {
                    successCount++;
                }
            }
        });

        return {
            totalRequests: requests.length,
            draftCount: statusCounts.draft,
            submittedCount: statusCounts.submitted,
            underReviewCount: statusCounts.under_review,
            approvedCount: statusCounts.approved,
            implementedCount: statusCounts.implemented,
            rejectedCount: statusCounts.rejected,
            cancelledCount: statusCounts.cancelled,
            averageReviewTime: requests.length > 0 ? totalReviewTime / requests.length : 0,
            averageImplementationTime: implementedCount > 0 ? totalImplementationTime / implementedCount : 0,
            approvalRate: requests.length > 0 ? (statusCounts.approved / requests.length) * 100 : 0,
            successRate: implementedCount > 0 ? (successCount / implementedCount) * 100 : 0,
            highPriorityCount,
            criticalRiskCount,
        };
    } catch (error) {
        console.error('Failed to calculate change metrics:', error);
        throw error;
    }
}
