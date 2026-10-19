import {
    calculateQualityTrendMetrics,
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
            organizationId: "org-a",
            readinessScore: 72,
            guideCompletionPercent: 40,
            assessorExportsLast30Days: 3,
            reviewerSignOffRatePercent: 50,
            criticalOpenFindings: 2,
        });

        recordMonthlyQualityOutcomeSnapshot({
            organizationId: "org-a",
            readinessScore: 86,
            guideCompletionPercent: 80,
            assessorExportsLast30Days: 5,
            reviewerSignOffRatePercent: 90,
            criticalOpenFindings: 1,
        });

        const snapshots = getMonthlyQualityOutcomeSnapshots("org-a");
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0].readinessScore).toBe(86);
    });

    it("keeps monthly snapshots isolated by organization", () => {
        recordMonthlyQualityOutcomeSnapshot({
            organizationId: "org-a",
            readinessScore: 70,
        });
        recordMonthlyQualityOutcomeSnapshot({
            organizationId: "org-b",
            readinessScore: 90,
        });

        expect(getMonthlyQualityOutcomeSnapshots("org-a").map((item) => item.readinessScore)).toEqual([70]);
        expect(getMonthlyQualityOutcomeSnapshots("org-b").map((item) => item.readinessScore)).toEqual([90]);
    });

    it("merges monthly metrics so dashboard sections do not overwrite each other", () => {
        recordMonthlyQualityOutcomeSnapshot({
            organizationId: "org-a",
            readinessScore: 72,
            guideCompletionPercent: 40,
            qualityScore: 65,
            complianceRate: 75,
            riskControlIndex: 50,
        });
        recordMonthlyQualityOutcomeSnapshot({
            organizationId: "org-a",
            readinessScore: 78,
        });

        const [snapshot] = getMonthlyQualityOutcomeSnapshots("org-a");
        expect(snapshot.readinessScore).toBe(78);
        expect(snapshot.guideCompletionPercent).toBe(40);
        expect(snapshot.qualityScore).toBe(65);
        expect(snapshot.complianceRate).toBe(75);
        expect(snapshot.riskControlIndex).toBe(50);
    });

    it("surfaces malformed snapshot data instead of treating it as empty history", () => {
        localStorage.setItem(
            "accreditex_quality_outcome_monthly_snapshots:org-a",
            "{invalid",
        );

        expect(() => getMonthlyQualityOutcomeSnapshots("org-a")).toThrow(
            "Quality outcome history contains invalid JSON.",
        );
    });

    it("calculates quality trend metrics from supplied portfolio data", () => {
        const projects: { status: "Completed" | "In Progress" | "On Hold" }[] = [
            { status: "Completed" },
            { status: "In Progress" },
            { status: "On Hold" },
        ];
        const risks: { status: "Mitigated" | "Closed" | "Open" }[] = [
            { status: "Mitigated" },
            { status: "Closed" },
            { status: "Open" },
            { status: "Open" },
        ];
        const metrics = calculateQualityTrendMetrics(
            projects,
            risks,
        );

        expect(metrics).toEqual({
            qualityScore: 60,
            complianceRate: 67,
            riskControlIndex: 50,
        });
    });

    it("returns correlation strength from monthly snapshots", () => {
        const correlation = calculateGuideReadinessCorrelation([
            {
                organizationId: "org-a",
                monthKey: "2025-09",
                capturedAt: "2025-09-01T00:00:00.000Z",
                readinessScore: 60,
                guideCompletionPercent: 30,
                assessorExportsLast30Days: 1,
                reviewerSignOffRatePercent: 20,
                criticalOpenFindings: 7,
            },
            {
                organizationId: "org-a",
                monthKey: "2025-10",
                capturedAt: "2025-10-01T00:00:00.000Z",
                readinessScore: 72,
                guideCompletionPercent: 50,
                assessorExportsLast30Days: 2,
                reviewerSignOffRatePercent: 40,
                criticalOpenFindings: 4,
            },
            {
                organizationId: "org-a",
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
            organizationId: "org-a",
            readinessScore: 80,
            guideCompletionPercent: 60,
            assessorExportsLast30Days: 2,
            reviewerSignOffRatePercent: 75,
            criticalOpenFindings: 1,
        });

        const recent = getRecentMonthlyQualityOutcomeSnapshots(6, "org-a");
        expect(recent.length).toBeLessThanOrEqual(6);
        expect(recent.length).toBeGreaterThanOrEqual(1);
    });
});
