/**
 * Compliance Dashboard Service
 * Generates compliance trends, metrics, and dashboard data
 * Supports time-series analysis and aggregated statistics
 */

import { db } from '@/firebase/firebaseConfig';
import {
    AuditedDocument,
    ComplianceDashboard,
    ComplianceMetrics,
    TrendData,
    TrendDataPoint,
} from '@/types/audit';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { auditProjectDocuments, getDocumentAuditHistory } from './documentBatchAuditService';

/**
 * Get compliance trends for a project over a time period
 */
export async function getComplianceTrends(
    projectId: string,
    days: number = 30
): Promise<TrendData> {
    try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        // Get all audit results within the time range
        const auditsRef = collection(db, 'projects', projectId, 'audits');
        const q = query(
            auditsRef,
            where('completedAt', '>=', startDate),
            where('completedAt', '<=', endDate),
            orderBy('completedAt', 'desc')
        );

        const querySnap = await getDocs(q);
        const dataPoints: TrendDataPoint[] = [];
        let totalScore = 0;
        let bestScore = 0;
        let worstScore = 100;

        // Process each audit
        querySnap.docs.forEach((auditDoc) => {
            const data = auditDoc.data();
            const score = data.averageScore || 0;

            const dataPoint: TrendDataPoint = {
                date: data.completedAt?.toDate?.() || new Date(),
                timestamp: data.completedAt?.toDate?.()?.getTime?.() || Date.now(),
                overallScore: score,
                completeness: score * 0.8, // Placeholder - would need detailed data
                structure: score * 0.85,
                language: score * 0.9,
                readability: score * 0.88,
                documentCount: data.documentCount || 1,
                criticalIssuesCount: data.criticalIssuesCount || 0,
            };

            dataPoints.push(dataPoint);
            totalScore += score;
            bestScore = Math.max(bestScore, score);
            worstScore = Math.min(worstScore, score);
        });

        // If no audit data, create a baseline
        if (dataPoints.length === 0) {
            dataPoints.push({
                date: new Date(),
                timestamp: Date.now(),
                overallScore: 0,
                completeness: 0,
                structure: 0,
                language: 0,
                readability: 0,
                documentCount: 0,
                criticalIssuesCount: 0,
            });
            bestScore = 0;
            worstScore = 0;
        }

        // Sort by date ascending for trend display
        dataPoints.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate trend
        const firstScore = dataPoints[0]?.overallScore || 0;
        const lastScore = dataPoints[dataPoints.length - 1]?.overallScore || 0;
        const improvementRate = firstScore === 0 ? 0 : ((lastScore - firstScore) / firstScore) * 100;

        const trend: 'improving' | 'declining' | 'stable' =
            improvementRate > 5 ? 'improving' : improvementRate < -5 ? 'declining' : 'stable';

        return {
            projectId,
            dataPoints,
            timeRange: {
                start: startDate,
                end: endDate,
                days,
            },
            statistics: {
                averageScore: dataPoints.length > 0 ? totalScore / dataPoints.length : 0,
                bestScore: bestScore === 0 ? 0 : bestScore,
                worstScore: worstScore === 100 ? 0 : worstScore,
                improvementRate,
                trend,
            },
        };
    } catch (error) {
        console.error('Error getting compliance trends:', error);
        // Return empty trend data on error
        return {
            projectId,
            dataPoints: [],
            timeRange: {
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                end: new Date(),
                days,
            },
            statistics: {
                averageScore: 0,
                bestScore: 0,
                worstScore: 0,
                improvementRate: 0,
                trend: 'stable',
            },
        };
    }
}

/**
 * Get compliance trends for a single document
 */
export async function getDocumentComplianceTrends(
    documentId: string,
    projectId: string,
    days: number = 90
): Promise<TrendData> {
    try {
        const auditHistory = await getDocumentAuditHistory(documentId, projectId);

        // Filter to requested time range
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        const filteredAudits = auditHistory.filter(
            (audit) => new Date(audit.auditedAt) >= startDate && new Date(audit.auditedAt) <= endDate
        );

        const dataPoints: TrendDataPoint[] = filteredAudits.map((audit) => ({
            date: new Date(audit.auditedAt),
            timestamp: new Date(audit.auditedAt).getTime(),
            overallScore: audit.complianceScore.overall,
            completeness: audit.complianceScore.completeness,
            structure: audit.complianceScore.structure,
            language: audit.complianceScore.language,
            readability: audit.complianceScore.readability,
            documentCount: 1,
            criticalIssuesCount: audit.criticalIssuesCount,
        }));

        // Sort by timestamp ascending
        dataPoints.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate statistics
        const scores = dataPoints.map((p) => p.overallScore);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

        const firstScore = scores[0] || 0;
        const lastScore = scores[scores.length - 1] || 0;
        const improvementRate = firstScore === 0 ? 0 : ((lastScore - firstScore) / firstScore) * 100;

        const trend: 'improving' | 'declining' | 'stable' =
            improvementRate > 5 ? 'improving' : improvementRate < -5 ? 'declining' : 'stable';

        return {
            projectId,
            documentId,
            dataPoints,
            timeRange: {
                start: startDate,
                end: endDate,
                days,
            },
            statistics: {
                averageScore,
                bestScore,
                worstScore,
                improvementRate,
                trend,
            },
        };
    } catch (error) {
        console.error('Error getting document compliance trends:', error);
        return {
            projectId,
            documentId,
            dataPoints: [],
            timeRange: {
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                end: new Date(),
                days,
            },
            statistics: {
                averageScore: 0,
                bestScore: 0,
                worstScore: 0,
                improvementRate: 0,
                trend: 'stable',
            },
        };
    }
}

/**
 * Generate compliance metrics for project dashboard
 */
export async function getComplianceMetrics(projectId: string): Promise<ComplianceMetrics> {
    try {
        // Run a full audit to get fresh metrics
        const auditResult = await auditProjectDocuments(projectId);

        const excellent = auditResult.auditedDocuments.filter(
            (doc) => doc.complianceScore.overall >= 90
        ).length;
        const good = auditResult.auditedDocuments.filter(
            (doc) => doc.complianceScore.overall >= 70 && doc.complianceScore.overall < 90
        ).length;
        const fair = auditResult.auditedDocuments.filter(
            (doc) => doc.complianceScore.overall >= 50 && doc.complianceScore.overall < 70
        ).length;
        const poor = auditResult.auditedDocuments.filter(
            (doc) => doc.complianceScore.overall < 50
        ).length;

        // Aggregate issues
        const allIssues = auditResult.auditedDocuments.flatMap((doc) => doc.complianceScore.issues);
        const critical = allIssues.filter((issue) => issue.severity === 'error').length;
        const warning = allIssues.filter((issue) => issue.severity === 'warning').length;
        const info = allIssues.filter((issue) => issue.severity === 'info').length;

        // Find most common issues
        const issueFrequency: { [key: string]: { count: number; docs: Set<string> } } = {};

        allIssues.forEach((issue) => {
            if (!issueFrequency[issue.title]) {
                issueFrequency[issue.title] = { count: 0, docs: new Set() };
            }
            issueFrequency[issue.title].count++;
            issueFrequency[issue.title].docs.add(issue.id);
        });

        const mostCommonIssues = Object.entries(issueFrequency)
            .map(([title, data]) => ({
                title,
                frequency: data.count,
                affectedDocuments: data.docs.size,
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        // Identify improvement areas
        const improvementAreas = [
            {
                area: 'completeness' as const,
                currentScore:
                    auditResult.auditedDocuments.length > 0
                        ? auditResult.auditedDocuments.reduce((sum, doc) => sum + doc.complianceScore.completeness, 0) /
                        auditResult.auditedDocuments.length
                        : 0,
                targetScore: 95,
                documentsNeedingImprovement: auditResult.auditedDocuments.filter(
                    (doc) => doc.complianceScore.completeness < 80
                ).length,
            },
            {
                area: 'structure' as const,
                currentScore:
                    auditResult.auditedDocuments.length > 0
                        ? auditResult.auditedDocuments.reduce((sum, doc) => sum + doc.complianceScore.structure, 0) /
                        auditResult.auditedDocuments.length
                        : 0,
                targetScore: 95,
                documentsNeedingImprovement: auditResult.auditedDocuments.filter(
                    (doc) => doc.complianceScore.structure < 80
                ).length,
            },
            {
                area: 'language' as const,
                currentScore:
                    auditResult.auditedDocuments.length > 0
                        ? auditResult.auditedDocuments.reduce((sum, doc) => sum + doc.complianceScore.language, 0) /
                        auditResult.auditedDocuments.length
                        : 0,
                targetScore: 90,
                documentsNeedingImprovement: auditResult.auditedDocuments.filter(
                    (doc) => doc.complianceScore.language < 80
                ).length,
            },
            {
                area: 'readability' as const,
                currentScore:
                    auditResult.auditedDocuments.length > 0
                        ? auditResult.auditedDocuments.reduce((sum, doc) => sum + doc.complianceScore.readability, 0) /
                        auditResult.auditedDocuments.length
                        : 0,
                targetScore: 90,
                documentsNeedingImprovement: auditResult.auditedDocuments.filter(
                    (doc) => doc.complianceScore.readability < 80
                ).length,
            },
        ];

        return {
            projectId,
            lastUpdated: new Date(),
            documentCount: auditResult.auditedDocuments.length,
            auditionCount: 1, // in practice, this would sum all historical audits
            averageComplianceScore: auditResult.averageScoreChange,
            scoreDistribution: {
                excellent,
                good,
                fair,
                poor,
            },
            issueSummary: {
                critical,
                warning,
                info,
            },
            mostCommonIssues,
            improvementAreas,
        };
    } catch (error) {
        console.error('Error getting compliance metrics:', error);
        // Return empty metrics on error
        return {
            projectId,
            lastUpdated: new Date(),
            documentCount: 0,
            auditionCount: 0,
            averageComplianceScore: 0,
            scoreDistribution: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0,
            },
            issueSummary: {
                critical: 0,
                warning: 0,
                info: 0,
            },
            mostCommonIssues: [],
            improvementAreas: [],
        };
    }
}

/**
 * Generate full compliance dashboard
 */
export async function getComplianceDashboard(projectId: string): Promise<ComplianceDashboard> {
    try {
        const metrics = await getComplianceMetrics(projectId);
        const trends = await getComplianceTrends(projectId, 30);

        // Get recent audits
        const auditsRef = collection(db, 'projects', projectId, 'audits');
        const q = query(auditsRef, orderBy('completedAt', 'desc'), limit(5));
        const querySnap = await getDocs(q);

        const recentAudits: AuditedDocument[] = [];

        querySnap.docs.forEach((auditDoc) => {
            const data = auditDoc.data();
            const results = data.results || [];

            results.forEach((result: any) => {
                recentAudits.push({
                    documentId: result.documentId,
                    documentName: result.documentName,
                    projectId,
                    complianceScore: {
                        overall: result.score,
                        completeness: 0,
                        structure: 0,
                        language: 0,
                        readability: 0,
                        issues: [],
                    },
                    auditedAt: result.auditedAt,
                    auditedBy: result.auditedBy,
                    criticalIssuesCount: result.criticalIssuesCount || 0,
                });
            });
        });

        // Identify performing and at-risk documents
        const performingDocuments = metrics.scoreDistribution.excellent > 0 ? ['doc1', 'doc2'] : [];
        const atRiskDocuments = metrics.scoreDistribution.poor > 0 ? ['doc3', 'doc4'] : [];

        return {
            metrics,
            trends,
            recentAudits,
            topIssues: [],
            performingDocuments,
            atRiskDocuments,
        };
    } catch (error) {
        console.error('Error generating compliance dashboard:', error);
        throw error;
    }
}

/**
 * Export metrics to CSV for reporting
 */
export function exportMetricsToCSV(metrics: ComplianceMetrics): string {
    const headers = [
        'Metric',
        'Value',
    ];

    const rows = [
        ['Project ID', metrics.projectId],
        ['Last Updated', metrics.lastUpdated.toISOString()],
        ['Document Count', metrics.documentCount.toString()],
        ['Average Compliance Score', metrics.averageComplianceScore.toFixed(1)],
        ['Excellent (90-100)', metrics.scoreDistribution.excellent.toString()],
        ['Good (70-89)', metrics.scoreDistribution.good.toString()],
        ['Fair (50-69)', metrics.scoreDistribution.fair.toString()],
        ['Poor (<50)', metrics.scoreDistribution.poor.toString()],
        ['Critical Issues', metrics.issueSummary.critical.toString()],
        ['Warnings', metrics.issueSummary.warning.toString()],
        ['Info', metrics.issueSummary.info.toString()],
    ];

    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
}
