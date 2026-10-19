/**
 * Audit Change Control Service
 * Links audit findings to change control requests
 * Creates and manages change requests for compliance issues
 */

import { db } from '@/firebase/firebaseConfig';
import {
    AuditedDocument,
    AuditedIssueWithChangeControl,
    AuditFindingForChangeControl,
} from '@/types/audit';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ComplianceIssue } from './documentComplianceService';
import { createChangeRequest } from './changeControlService';

/**
 * Convert an audit issue to a change control request
 */
export async function createChangeRequestFromAuditIssue(
    documentId: string,
    documentName: string,
    projectId: string,
    issue: ComplianceIssue,
    severity: 'critical' | 'high' | 'medium' | 'low'
): Promise<string> {
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        // Map issue severity to change control priority
        const priority = severity;

        // Determine impact area based on issue
        let impactArea = 'Document Quality';
        if (issue.description?.includes('structure') || issue.description?.includes('hierarchy')) {
            impactArea = 'Document Structure';
        } else if (
            issue.description?.includes('language') ||
            issue.description?.includes('terminology')
        ) {
            impactArea = 'Compliance Terminology';
        } else if (
            issue.description?.includes('readability') ||
            issue.description?.includes('clarity')
        ) {
            impactArea = 'Readability & Clarity';
        } else if (issue.description?.includes('missing') || issue.description?.includes('required')) {
            impactArea = 'Missing Required Sections';
        }

        if (!currentUser) {
            throw new Error('Sign in before creating an audit change request');
        }

        const now = new Date();
        const request = await createChangeRequest({
            projectId,
            title: `Compliance Issue: ${issue.title}`,
            description: issue.description || issue.title,
            changeType: 'documentation',
            priority,
            status: 'draft',
            requestedBy: currentUser.uid,
            requestedByName: currentUser.displayName || currentUser.email || currentUser.uid,
            dateRequested: now,
            businessJustification: `Resolve the audit finding: ${issue.title}`,
            expectedBenefits: issue.suggestion || 'Restore document compliance.',
            detailedDescription: `${impactArea}: ${issue.description || issue.title}`,
            scope: `Update document ${documentName} (${documentId}) in project ${projectId}.`,
            impact: null,
            approvals: [],
            requiredApprovals: 1,
            plannedStartDate: now,
            plannedEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            supportingDocuments: [documentId],
            tags: ['audit', 'compliance', severity],
            updatedBy: currentUser.uid,
        }, currentUser.uid);

        // Update document to link the change request
        const docRef = doc(db, 'projects', projectId, 'documents', documentId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error(`Audited document ${documentId} not found in project ${projectId}`);
        }
        const currentLinkedCRs = docSnap.data().linkedChangeRequests || [];
        await updateDoc(docRef, {
            linkedChangeRequests: [
                ...currentLinkedCRs,
                { crId: request.id, createdAt: new Date() },
            ],
            lastAuditLink: new Date(),
        });

        return request.id;
    } catch (error) {
        console.error('Error creating change request from audit issue:', error);
        throw error;
    }
}

/**
 * Create change requests for critical issues in an audited document
 */
export async function createChangeRequestsFromAudit(
    auditedDoc: AuditedDocument,
    criticalThreshold: number = 70 // Create CRs if score is below this
): Promise<string[]> {
    try {
        const crIds: string[] = [];

        // Create CRs for critical issues (errors) only
        const criticalIssues = auditedDoc.complianceScore.issues.filter(
            (issue) => issue.severity === 'error'
        );

        if (criticalIssues.length > 0 && auditedDoc.complianceScore.overall < criticalThreshold) {
            for (const issue of criticalIssues) {
                const crId = await createChangeRequestFromAuditIssue(
                    auditedDoc.documentId,
                    auditedDoc.documentName,
                    auditedDoc.projectId,
                    issue,
                    'critical'
                );
                crIds.push(crId);
            }
        }

        return crIds;
    } catch (error) {
        console.error('Error creating change requests:', error);
        throw error;
    }
}

/**
 * Link an existing audit finding to a change request
 */
export async function linkAuditToChangeRequest(
    documentId: string,
    projectId: string,
    changeRequestId: string,
    issue: ComplianceIssue
): Promise<void> {
    try {
        const docRef = doc(db, 'projects', projectId, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const linkedIssues = docSnap.data().linkedAuditIssues || [];

            const auditedIssue: AuditedIssueWithChangeControl = {
                ...issue,
                documentId,
                documentName: docSnap.data().name,
                changeRequestId,
                linkedAt: new Date(),
            };

            await updateDoc(docRef, {
                linkedAuditIssues: [...linkedIssues, auditedIssue],
            });
        }
    } catch (error) {
        console.error('Error linking audit to change request:', error);
        throw error;
    }
}

/**
 * Get all change requests linked to a document's audits
 */
export async function getLinkedChangeRequests(
    documentId: string,
    projectId: string
): Promise<Array<{ crId: string; createdAt: Date }>> {
    try {
        const docRef = doc(db, 'projects', projectId, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().linkedChangeRequests || [];
        }

        return [];
    } catch (error) {
        console.error('Error getting linked change requests:', error);
        return [];
    }
}

/**
 * Get all audit issues linked to a document
 */
export async function getLinkedAuditIssues(
    documentId: string,
    projectId: string
): Promise<AuditedIssueWithChangeControl[]> {
    try {
        const docRef = doc(db, 'projects', projectId, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().linkedAuditIssues || [];
        }

        return [];
    } catch (error) {
        console.error('Error getting linked audit issues:', error);
        return [];
    }
}

/**
 * Generate audit finding for change control (with all context)
 */
export function generateAuditFindingForChangeControl(
    auditedDoc: AuditedDocument,
    issue: ComplianceIssue
): AuditFindingForChangeControl {
    // Map issue to severity levels
    const severityMap: { [key in ComplianceIssue['severity']]: 'critical' | 'high' | 'medium' | 'low' } = {
        error: 'critical',
        warning: 'high',
        info: 'medium',
    };

    // Determine impact area
    let impactArea = 'Document Quality';
    if (
        issue.section?.toLowerCase().includes('structure') ||
        issue.description?.toLowerCase().includes('hierarchy')
    ) {
        impactArea = 'Document Structure & Organization';
    } else if (
        issue.section?.toLowerCase().includes('language') ||
        issue.description?.toLowerCase().includes('terminology')
    ) {
        impactArea = 'Compliance Terminology & Standards';
    } else if (
        issue.section?.toLowerCase().includes('readability') ||
        issue.description?.toLowerCase().includes('clarity')
    ) {
        impactArea = 'Readability & Staff Understanding';
    } else if (
        issue.section?.toLowerCase().includes('missing') ||
        issue.description?.toLowerCase().includes('required')
    ) {
        impactArea = 'Missing Required Sections';
    }

    // Estimate effort
    const estimatedEffort =
        severityMap[issue.severity] === 'critical'
            ? ('high' as const)
            : severityMap[issue.severity] === 'high'
                ? ('medium' as const)
                : ('low' as const);

    return {
        auditId: `audit-${Date.now()}`,
        documentId: auditedDoc.documentId,
        documentName: auditedDoc.documentName,
        issue,
        severity: severityMap[issue.severity],
        impactArea,
        proposedResolution: issue.suggestion || `Review and update: ${issue.description}`,
        estimatedEffort,
        relatedStandards: ['JCI', 'CBAHI'],
    };
}

/**
 * Update change request status based on document re-audit
 */
export async function updateChangeRequestStatus(
    changeRequestId: string,
    newStatus: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'closed',
    notes?: string
): Promise<void> {
    try {
        // In a real implementation, this would update the change request in Firestore
        // For now, just log the action
        console.log(
            `Change request ${changeRequestId} status updated to ${newStatus}${notes ? ': ' + notes : ''}`
        );
    } catch (error) {
        console.error('Error updating change request status:', error);
        throw error;
    }
}

/**
 * Generate compliance improvement action items
 */
export async function generateImprovementActions(
    documentId: string,
    projectId: string
): Promise<Array<{ action: string; priority: 'high' | 'medium' | 'low'; estimatedDays: number }>> {
    try {
        const linkedIssues = await getLinkedAuditIssues(documentId, projectId);

        const actions = linkedIssues
            .filter((issue) => issue.severity === 'error') // Only critical issues
            .map((issue) => ({
                action: issue.suggestion || `Address: ${issue.title}`,
                priority: 'high' as const,
                estimatedDays: issue.severity === 'error' ? 7 : 14,
            }));

        return actions;
    } catch (error) {
        console.error('Error generating improvement actions:', error);
        return [];
    }
}
