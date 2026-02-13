export interface MonthlyQualityOutcomeSnapshot {
    monthKey: string;
    capturedAt: string;
    readinessScore: number;
    guideCompletionPercent: number;
    assessorExportsLast30Days: number;
    reviewerSignOffRatePercent: number;
    criticalOpenFindings: number;
}

export interface GuideReadinessCorrelationResult {
    coefficient: number;
    label: "None" | "Weak" | "Moderate" | "Strong";
}

export interface PredictiveAuditRiskResult {
    score: number;
    level: "Low" | "Medium" | "High";
    reasons: string[];
}

const QUALITY_OUTCOME_SNAPSHOT_STORAGE_KEY =
    "accreditex_quality_outcome_monthly_snapshots";

const clampPercent = (value: number): number =>
    Math.max(0, Math.min(100, Math.round(value)));

const getCurrentMonthKey = (): string => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
};

export const getMonthlyQualityOutcomeSnapshots =
    (): MonthlyQualityOutcomeSnapshot[] => {
        try {
            const raw = localStorage.getItem(QUALITY_OUTCOME_SNAPSHOT_STORAGE_KEY);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed as MonthlyQualityOutcomeSnapshot[];
        } catch {
            return [];
        }
    };

export const recordMonthlyQualityOutcomeSnapshot = (input: {
    readinessScore: number;
    guideCompletionPercent: number;
    assessorExportsLast30Days: number;
    reviewerSignOffRatePercent: number;
    criticalOpenFindings: number;
}): MonthlyQualityOutcomeSnapshot => {
    const monthKey = getCurrentMonthKey();
    const snapshot: MonthlyQualityOutcomeSnapshot = {
        monthKey,
        capturedAt: new Date().toISOString(),
        readinessScore: clampPercent(input.readinessScore),
        guideCompletionPercent: clampPercent(input.guideCompletionPercent),
        assessorExportsLast30Days: Math.max(
            0,
            Math.round(input.assessorExportsLast30Days),
        ),
        reviewerSignOffRatePercent: clampPercent(input.reviewerSignOffRatePercent),
        criticalOpenFindings: Math.max(0, Math.round(input.criticalOpenFindings)),
    };

    try {
        const existing = getMonthlyQualityOutcomeSnapshots();
        const filtered = existing.filter((entry) => entry.monthKey !== monthKey);
        const updated = [snapshot, ...filtered]
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
            .slice(0, 24);

        localStorage.setItem(
            QUALITY_OUTCOME_SNAPSHOT_STORAGE_KEY,
            JSON.stringify(updated),
        );
    } catch {
        // no-op to keep dashboard non-blocking
    }

    return snapshot;
};

export const getRecentMonthlyQualityOutcomeSnapshots = (
    months: number = 6,
): MonthlyQualityOutcomeSnapshot[] => {
    return getMonthlyQualityOutcomeSnapshots()
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .slice(-months);
};

export const calculateGuideReadinessCorrelation = (
    snapshots: MonthlyQualityOutcomeSnapshot[],
): GuideReadinessCorrelationResult => {
    if (snapshots.length < 2) {
        return { coefficient: 0, label: "None" };
    }

    const x = snapshots.map((snapshot) => snapshot.guideCompletionPercent);
    const y = snapshots.map((snapshot) => snapshot.readinessScore);

    const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
    const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;

    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    for (let i = 0; i < x.length; i += 1) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        numerator += dx * dy;
        denominatorX += dx * dx;
        denominatorY += dy * dy;
    }

    const denominator = Math.sqrt(denominatorX * denominatorY);
    const rawCoefficient = denominator > 0 ? numerator / denominator : 0;
    const coefficient = Number(rawCoefficient.toFixed(2));
    const abs = Math.abs(coefficient);

    const label: GuideReadinessCorrelationResult["label"] =
        abs >= 0.7 ? "Strong" : abs >= 0.4 ? "Moderate" : abs > 0 ? "Weak" : "None";

    return {
        coefficient,
        label,
    };
};

export const calculatePredictiveAuditRisk = (input: {
    readinessScore: number;
    evidenceIntegrityIndex: number;
    criticalOpenFindings: number;
    openCapas: number;
    reviewerSignOffRatePercent: number;
}): PredictiveAuditRiskResult => {
    const reasons: string[] = [];
    let score = 0;

    if (input.readinessScore < 70) {
        score += 35;
        reasons.push("Readiness score is below 70%");
    } else if (input.readinessScore < 85) {
        score += 20;
        reasons.push("Readiness score is below target threshold (85%)");
    }

    if (input.evidenceIntegrityIndex < 75) {
        score += 25;
        reasons.push("Evidence integrity index is below 75%");
    } else if (input.evidenceIntegrityIndex < 90) {
        score += 12;
        reasons.push("Evidence integrity has improvement opportunity");
    }

    if (input.criticalOpenFindings >= 5) {
        score += 20;
        reasons.push("Critical open findings are high");
    } else if (input.criticalOpenFindings > 0) {
        score += 10;
        reasons.push("Critical findings remain open");
    }

    if (input.openCapas >= 10) {
        score += 12;
        reasons.push("Open CAPA volume is high");
    } else if (input.openCapas >= 5) {
        score += 6;
        reasons.push("Open CAPA volume is moderate");
    }

    if (input.reviewerSignOffRatePercent < 50) {
        score += 8;
        reasons.push("Reviewer sign-off rate is below 50%");
    }

    score = Math.max(0, Math.min(100, score));

    const level: PredictiveAuditRiskResult["level"] =
        score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

    return {
        score,
        level,
        reasons,
    };
};
