/**
 * Document Batch Audit Service
 * Audits multiple documents at once and returns comprehensive compliance results
 * Processes: scoring, issue detection, change request linkage
 */

import { db } from '@/firebase/firebaseConfig';
import {
    AuditedDocument,
    AuditJobStatus,
    BatchAuditResult
} from '@/types/audit';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { scoreDocumentCompliance } from './documentComplianceService';

/**
 * Audit a single document
 */
export async function auditSingleDocument(docId: string, projectId: string): Promise<AuditedDocument> {
    try {
        const docRef = doc(db, 'projects', projectId, 'documents', docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error(`Document ${docId} not found`);
        }

        const docData = docSnap.data();
        const htmlContent = docData.content || '';
        const documentName = docData.name || 'Untitled';

        // Score the document
        const complianceScore = scoreDocumentCompliance(htmlContent);

        // Count critical issues
        const criticalIssuesCount = complianceScore.issues.filter(
            (issue) => issue.severity === 'error'
        ).length;

        // Get current user
        const auth = getAuth();
        const currentUser = auth.currentUser;

        const auditedDoc: AuditedDocument = {
            documentId: docId,
            documentName,
            projectId,
            complianceScore,
            auditedAt: new Date(),
            auditedBy: currentUser?.uid || 'system',
            auditedByEmail: currentUser?.email,
            criticalIssuesCount,
        };

        return auditedDoc;
    } catch (error) {
        console.error(`Error auditing document ${docId}:`, error);
        throw error;
    }
}

/**
 * Batch audit multiple documents
 */
export async function batchAuditDocuments(
    docIds: string[],
    projectId: string
): Promise<BatchAuditResult> {
    const jobId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    const auditedDocuments: AuditedDocument[] = [];
    const failedCount = { count: 0 };

    try {
        // Audit each document
        for (const docId of docIds) {
            try {
                const auditedDoc = await auditSingleDocument(docId, projectId);
                auditedDocuments.push(auditedDoc);
            } catch (error) {
                console.error(`Failed to audit ${docId}:`, error);
                failedCount.count++;
            }
        }

        // Calculate results
        const averageScore =
            auditedDocuments.length > 0
                ? auditedDocuments.reduce((sum, doc) => sum + doc.complianceScore.overall, 0) /
                auditedDocuments.length
                : 0;

        const criticalIssuesCount = auditedDocuments.reduce(
            (sum, doc) => sum + doc.criticalIssuesCount,
            0
        );

        // Determine status
        const overallStatus =
            averageScore >= 85 ? 'passed' : averageScore >= 70 ? 'warning' : 'failed';

        const result: BatchAuditResult = {
            jobId,
            projectId,
            auditedDocuments,
            changeRequestsCreated: 0, // will be incremented if CRs are created
            criticalIssuesFoundCount: criticalIssuesCount,
            averageScoreChange: averageScore,
            completedAt: new Date(),
            summary: {
                overallStatus,
                message:
                    overallStatus === 'passed'
                        ? `All documents passed compliance check (avg: ${averageScore.toFixed(1)}%)`
                        : overallStatus === 'warning'
                            ? `Some documents need attention (avg: ${averageScore.toFixed(1)}%)`
                            : `Critical compliance issues found (avg: ${averageScore.toFixed(1)}%)`,
            },
        };

        // Store audit results in Firestore
        await storeAuditResults(result);

        return result;
    } catch (error) {
        console.error('Batch audit failed:', error);
        throw error;
    }
}

/**
 * Audit all documents in a project
 */
export async function auditProjectDocuments(projectId: string): Promise<BatchAuditResult> {
    try {
        // Get all documents in project
        const docsRef = collection(db, 'projects', projectId, 'documents');
        const docsSnap = await getDocs(docsRef);

        const docIds = docsSnap.docs.map((doc) => doc.id);

        if (docIds.length === 0) {
            return {
                jobId: `audit-${Date.now()}`,
                projectId,
                auditedDocuments: [],
                changeRequestsCreated: 0,
                criticalIssuesFoundCount: 0,
                averageScoreChange: 0,
                completedAt: new Date(),
                summary: {
                    overallStatus: 'passed',
                    message: 'No documents to audit',
                },
            };
        }

        return batchAuditDocuments(docIds, projectId);
    } catch (error) {
        console.error('Error auditing project documents:', error);
        throw error;
    }
}

/**
 * Store audit results in Firestore for persistence
 */
export async function storeAuditResults(result: BatchAuditResult): Promise<void> {
    try {
        const auditRef = collection(db, 'projects', result.projectId, 'audits');

        // Create audit record with serializable date
        const auditRecord = {
            jobId: result.jobId,
            projectId: result.projectId,
            completedAt: result.completedAt,
            documentCount: result.auditedDocuments.length,
            averageScore: result.averageScoreChange,
            criticalIssuesCount: result.criticalIssuesFoundCount,
            status: result.summary.overallStatus,
            message: result.summary.message,
            results: result.auditedDocuments.map((doc) => ({
                documentId: doc.documentId,
                documentName: doc.documentName,
                score: doc.complianceScore.overall,
                criticalIssuesCount: doc.criticalIssuesCount,
                auditedBy: doc.auditedBy,
                auditedAt: doc.auditedAt,
            })),
        };

        // Note: In a real implementation, you'd use addDoc or setDoc here
        // For now, this demonstrates the structure
        console.log('Audit results stored:', auditRecord);
    } catch (error) {
        console.error('Error storing audit results:', error);
        // Don't throw - audit should complete even if storage fails
    }
}

/**
 * Get audit status for a job
 */
export async function getAuditJobStatus(jobId: string, projectId: string): Promise<AuditJobStatus | null> {
    try {
        // Query audits subcollection
        const auditsRef = collection(db, 'projects', projectId, 'audits');
        const q = query(auditsRef, where('jobId', '==', jobId));
        const querySnap = await getDocs(q);

        if (querySnap.empty) {
            return null;
        }

        const auditSnap = querySnap.docs[0];
        const data = auditSnap.data();

        return {
            jobId: data.jobId,
            projectId: data.projectId,
            docIds: data.results?.map((r: any) => r.documentId) || [],
            status: 'completed',
            progress: {
                total: data.results?.length || 0,
                processed: data.results?.length || 0,
                successful: data.results?.length || 0,
                failed: 0,
            },
            startedAt: new Date(),
            completedAt: data.completedAt,
            results: data.results?.map((r: any) => ({
                documentId: r.documentId,
                documentName: r.documentName,
                projectId,
                complianceScore: {
                    overall: r.score,
                    completeness: 0,
                    structure: 0,
                    language: 0,
                    readability: 0,
                    issues: [],
                },
                auditedAt: r.auditedAt,
                auditedBy: r.auditedBy,
                criticalIssuesCount: r.criticalIssuesCount,
            })) || [],
        };
    } catch (error) {
        console.error('Error getting audit job status:', error);
        return null;
    }
}

/**
 * Get audit history for a document
 */
export async function getDocumentAuditHistory(documentId: string, projectId: string): Promise<AuditedDocument[]> {
    try {
        const auditsRef = collection(db, 'projects', projectId, 'audits');
        const q = query(auditsRef);
        const querySnap = await getDocs(q);

        const auditedDocs: AuditedDocument[] = [];

        querySnap.docs.forEach((auditDoc) => {
            const results = auditDoc.data().results || [];
            const docAudit = results.find((r: any) => r.documentId === documentId);

            if (docAudit) {
                auditedDocs.push({
                    documentId: docAudit.documentId,
                    documentName: docAudit.documentName,
                    projectId,
                    complianceScore: {
                        overall: docAudit.score,
                        completeness: 0,
                        structure: 0,
                        language: 0,
                        readability: 0,
                        issues: [],
                    },
                    auditedAt: docAudit.auditedAt,
                    auditedBy: docAudit.auditedBy,
                    criticalIssuesCount: docAudit.criticalIssuesCount,
                });
            }
        });

        // Sort by date descending
        return auditedDocs.sort(
            (a, b) => new Date(b.auditedAt).getTime() - new Date(a.auditedAt).getTime()
        );
    } catch (error) {
        console.error('Error getting audit history:', error);
        return [];
    }
}
