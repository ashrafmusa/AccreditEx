import {
    calculateGuideReadinessCorrelation,
    calculatePredictiveAuditRisk,
    getMonthlyQualityOutcomeSnapshots,
    getRecentMonthlyQualityOutcomeSnapshots,
    recordMonthlyQualityOutcomeSnapshot,
} from "@/services/qualityOutcomeIntelligenceService";

describe("qualityOutcomeIntelligenceService", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("records one snapshot per month key", () => {
        recordMonthlyQualityOutcomeSnapshot({
            readinessScore: 72,
            guideCompletionPercent: 40,
            assessorExportsLast30Days: 3,
            reviewerSignOffRatePercent: 50,
            criticalOpenFindings: 2,
        });

        recordMonthlyQualityOutcomeSnapshot({
            readinessScore: 86,
            guideCompletionPercent: 80,
            assessorExportsLast30Days: 5,
            reviewerSignOffRatePercent: 90,
            criticalOpenFindings: 1,
        });

        const snapshots = getMonthlyQualityOutcomeSnapshots();
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0].readinessScore).toBe(86);
    });

    it("returns correlation strength from monthly snapshots", () => {
        const correlation = calculateGuideReadinessCorrelation([
            {
                monthKey: "2025-09",
                capturedAt: "2025-09-01T00:00:00.000Z",
                readinessScore: 60,
                guideCompletionPercent: 30,
                assessorExportsLast30Days: 1,
                reviewerSignOffRatePercent: 20,
                criticalOpenFindings: 7,
            },
            {
                monthKey: "2025-10",
                capturedAt: "2025-10-01T00:00:00.000Z",
                readinessScore: 72,
                guideCompletionPercent: 50,
                assessorExportsLast30Days: 2,
                reviewerSignOffRatePercent: 40,
                criticalOpenFindings: 4,
            },
            {
                monthKey: "2025-11",
                capturedAt: "2025-11-01T00:00:00.000Z",
                readinessScore: 85,
                guideCompletionPercent: 80,
                assessorExportsLast30Days: 4,
                reviewerSignOffRatePercent: 70,
                criticalOpenFindings: 2,
            },
        ]);

        expect(correlation.coefficient).toBeGreaterThan(0);
        expect(["Weak", "Moderate", "Strong"]).toContain(correlation.label);
    });

    it("calculates high predictive risk when core indicators degrade", () => {
        const risk = calculatePredictiveAuditRisk({
            readinessScore: 62,
            evidenceIntegrityIndex: 68,
            criticalOpenFindings: 6,
            openCapas: 12,
            reviewerSignOffRatePercent: 20,
        });

        expect(risk.level).toBe("High");
        expect(risk.score).toBeGreaterThanOrEqual(60);
        expect(risk.reasons.length).toBeGreaterThan(0);
    });

    it("returns recent snapshots window", () => {
        recordMonthlyQualityOutcomeSnapshot({
            readinessScore: 80,
            guideCompletionPercent: 60,
            assessorExportsLast30Days: 2,
            reviewerSignOffRatePercent: 75,
            criticalOpenFindings: 1,
        });

        const recent = getRecentMonthlyQualityOutcomeSnapshots(6);
        expect(recent.length).toBeLessThanOrEqual(6);
        expect(recent.length).toBeGreaterThanOrEqual(1);
    });
});
