import type { Project, Risk } from "@/types";

export interface MonthlyQualityOutcomeSnapshot {
    organizationId: string;
    monthKey: string;
    capturedAt: string;
    readinessScore: number;
    guideCompletionPercent: number;
    assessorExportsLast30Days: number;
    reviewerSignOffRatePercent: number;
    criticalOpenFindings: number;
    qualityScore?: number;
    complianceRate?: number;
    riskControlIndex?: number;
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

/** Extended AI-powered result — superset of rule-based result (B1) */
export interface AIPredictiveAuditRiskResult extends PredictiveAuditRiskResult {
    aiNarrative: string;           // AI-written paragraph explaining the risk
    recommendations: string[];     // Actionable steps to reduce risk
    confidencePercent: number;     // AI's self-reported confidence 0–100
    isAIGenerated: true;
}

const QUALITY_OUTCOME_SNAPSHOT_STORAGE_KEY =
    "accreditex_quality_outcome_monthly_snapshots";

const getStorageKey = (organizationId?: string): string =>
    `${QUALITY_OUTCOME_SNAPSHOT_STORAGE_KEY}:${encodeURIComponent(organizationId?.trim() || "legacy")}`;

const clampPercent = (value: number): number =>
    Math.max(0, Math.min(100, Math.round(value)));

const getFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const resolveMetric = (
    value: number | undefined,
    previousValue: number | undefined,
    fieldName: string,
): number => {
    const resolved = value ?? previousValue ?? 0;
    if (!getFiniteNumber(resolved)) {
        throw new Error(`Invalid quality outcome metric: ${fieldName}.`);
    }
    return resolved;
};

const getCurrentMonthKey = (): string => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
};

export const getMonthlyQualityOutcomeSnapshots =
    (organizationId?: string): MonthlyQualityOutcomeSnapshot[] => {
        let raw: string | null;
        try {
            raw = localStorage.getItem(getStorageKey(organizationId));
        } catch {
            throw new Error("Unable to access quality outcome history storage.");
        }
        if (!raw) {
            return [];
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error("Quality outcome history contains invalid JSON.");
        }
        if (!Array.isArray(parsed)) {
            throw new Error("Quality outcome history has an invalid format.");
        }

        const scopedOrganizationId = organizationId?.trim() || "legacy";
        return parsed.map((entry: unknown) => {
            if (
                !entry ||
                typeof entry !== "object" ||
                Array.isArray(entry)
            ) {
                throw new Error(
                    "Quality outcome history contains an invalid snapshot.",
                );
            }
            const snapshot = entry as Partial<MonthlyQualityOutcomeSnapshot>;
            if (
                snapshot.organizationId !== scopedOrganizationId ||
                typeof snapshot.monthKey !== "string" ||
                !/^\d{4}-(0[1-9]|1[0-2])$/.test(snapshot.monthKey) ||
                typeof snapshot.capturedAt !== "string" ||
                !getFiniteNumber(snapshot.readinessScore) ||
                !getFiniteNumber(snapshot.guideCompletionPercent) ||
                !getFiniteNumber(snapshot.assessorExportsLast30Days) ||
                !getFiniteNumber(snapshot.reviewerSignOffRatePercent) ||
                !getFiniteNumber(snapshot.criticalOpenFindings) ||
                (snapshot.qualityScore !== undefined &&
                    !getFiniteNumber(snapshot.qualityScore)) ||
                (snapshot.complianceRate !== undefined &&
                    !getFiniteNumber(snapshot.complianceRate)) ||
                (snapshot.riskControlIndex !== undefined &&
                    !getFiniteNumber(snapshot.riskControlIndex))
            ) {
                throw new Error("Quality outcome history contains an invalid snapshot.");
            }
            return snapshot as MonthlyQualityOutcomeSnapshot;
        });
    };

export const recordMonthlyQualityOutcomeSnapshot = (input: {
    organizationId?: string;
    readinessScore?: number;
    guideCompletionPercent?: number;
    assessorExportsLast30Days?: number;
    reviewerSignOffRatePercent?: number;
    criticalOpenFindings?: number;
    qualityScore?: number;
    complianceRate?: number;
    riskControlIndex?: number;
}): MonthlyQualityOutcomeSnapshot => {
    const monthKey = getCurrentMonthKey();
    const organizationId = input.organizationId?.trim() || "legacy";
    const existing = getMonthlyQualityOutcomeSnapshots(organizationId);
    const existingMonth = existing.find((entry) => entry.monthKey === monthKey);
    const snapshot: MonthlyQualityOutcomeSnapshot = {
        ...existingMonth,
        organizationId,
        monthKey,
        capturedAt: new Date().toISOString(),
        readinessScore: clampPercent(
            resolveMetric(
                input.readinessScore,
                existingMonth?.readinessScore,
                "readinessScore",
            ),
        ),
        guideCompletionPercent: clampPercent(
            resolveMetric(
                input.guideCompletionPercent,
                existingMonth?.guideCompletionPercent,
                "guideCompletionPercent",
            ),
        ),
        assessorExportsLast30Days: Math.max(
            0,
            Math.round(
                resolveMetric(
                    input.assessorExportsLast30Days,
                    existingMonth?.assessorExportsLast30Days,
                    "assessorExportsLast30Days",
                ),
            ),
        ),
        reviewerSignOffRatePercent: clampPercent(
            resolveMetric(
                input.reviewerSignOffRatePercent,
                existingMonth?.reviewerSignOffRatePercent,
                "reviewerSignOffRatePercent",
            ),
        ),
        criticalOpenFindings: Math.max(
            0,
            Math.round(
                resolveMetric(
                    input.criticalOpenFindings,
                    existingMonth?.criticalOpenFindings,
                    "criticalOpenFindings",
                ),
            ),
        ),
        ...(input.qualityScore !== undefined
            ? {
                  qualityScore: clampPercent(
                      resolveMetric(
                          input.qualityScore,
                          existingMonth?.qualityScore,
                          "qualityScore",
                      ),
                  ),
              }
            : {}),
        ...(input.complianceRate !== undefined
            ? {
                  complianceRate: clampPercent(
                      resolveMetric(
                          input.complianceRate,
                          existingMonth?.complianceRate,
                          "complianceRate",
                      ),
                  ),
              }
            : {}),
        ...(input.riskControlIndex !== undefined
            ? {
                  riskControlIndex: clampPercent(
                      resolveMetric(
                          input.riskControlIndex,
                          existingMonth?.riskControlIndex,
                          "riskControlIndex",
                      ),
                  ),
              }
            : {}),
    };

    try {
        const filtered = existing.filter((entry) => entry.monthKey !== monthKey);
        const updated = [snapshot, ...filtered]
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
            .slice(0, 24);

        localStorage.setItem(
            getStorageKey(organizationId),
            JSON.stringify(updated),
        );
    } catch {
        throw new Error("Unable to save quality outcome history.");
    }

    return snapshot;
};

export const getRecentMonthlyQualityOutcomeSnapshots = (
    months: number = 6,
    organizationId?: string,
): MonthlyQualityOutcomeSnapshot[] => {
    const windowSize = Math.max(0, Math.floor(months));
    if (windowSize === 0) return [];
    return getMonthlyQualityOutcomeSnapshots(organizationId)
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .slice(-windowSize);
};

export const calculateQualityTrendMetrics = (
    projects: Pick<Project, "status">[],
    risks: Pick<Risk, "status">[],
): { qualityScore: number; complianceRate: number; riskControlIndex: number } => {
    const completedProjects = projects.filter(
        (project) => project.status === "Completed",
    ).length;
    const activeProjects = projects.filter(
        (project) => project.status === "In Progress",
    ).length;
    const complianceRate = projects.length
        ? ((completedProjects + activeProjects) / projects.length) * 100
        : 0;
    const mitigatedRisks = risks.filter(
        (risk) => risk.status === "Mitigated" || risk.status === "Closed",
    ).length;
    const riskControlIndex = risks.length
        ? (mitigatedRisks / risks.length) * 100
        : 0;

    return {
        qualityScore: clampPercent(complianceRate * 0.6 + riskControlIndex * 0.4),
        complianceRate: clampPercent(complianceRate),
        riskControlIndex: clampPercent(riskControlIndex),
    };
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

/**
 * AI-powered predictive accreditation risk scoring (B1)
 *
 * Calls the AI agent with the same metrics as the rule-based scorer
 * and returns a richer result with narrative, recommendations and confidence.
 * Falls back gracefully to rule-based result if AI call fails.
 */
export const aiCalculatePredictiveAuditRisk = async (input: {
    readinessScore: number;
    evidenceIntegrityIndex: number;
    criticalOpenFindings: number;
    openCapas: number;
    reviewerSignOffRatePercent: number;
}): Promise<AIPredictiveAuditRiskResult> => {
    // Always have the rule-based baseline for fallback / comparison
    const rulebased = calculatePredictiveAuditRisk(input);

    const prompt = `You are an expert healthcare accreditation consultant analysing an organisation's audit readiness.

Current metrics:
- Readiness Score: ${input.readinessScore}%  (target ≥ 85%)
- Evidence Integrity Index: ${input.evidenceIntegrityIndex}%  (target ≥ 90%)
- Critical Open Findings: ${input.criticalOpenFindings}  (target 0)
- Open CAPAs: ${input.openCapas}  (target < 5)
- Reviewer Sign-off Rate: ${input.reviewerSignOffRatePercent}%  (target ≥ 80%)

The rule-based engine has scored this organisation's predicted audit risk as: ${rulebased.score}/100 (${rulebased.level})
Rule-based reasons: ${rulebased.reasons.join('; ')}

Your task:
1. Validate or refine the risk score (0–100) using your expert judgement.
2. Write a concise 2-3 sentence narrative explaining the key risk drivers.
3. List 3–5 actionable recommendations to reduce audit risk.
4. Provide your confidence in this assessment (0–100%).

Respond ONLY in this exact JSON format (no markdown, no explanation outside it):
{
  "score": <integer 0-100>,
  "level": "<Low|Medium|High>",
  "reasons": ["<reason 1>", "<reason 2>"],
  "aiNarrative": "<2-3 sentence narrative>",
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "confidencePercent": <integer 0-100>
}`;

    try {
        // Dynamically import to avoid circular deps in service layer
        const { aiAgentService } = await import('@/services/aiAgentService');
        const response = await aiAgentService.chat(prompt, false);
        const text = (response.response || '').trim();

        // Strip possible markdown code fences
        const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(jsonText);

        return {
            score: Number(parsed.score ?? rulebased.score),
            level: (parsed.level === 'Low' || parsed.level === 'Medium' || parsed.level === 'High')
                ? parsed.level
                : rulebased.level,
            reasons: Array.isArray(parsed.reasons) ? parsed.reasons : rulebased.reasons,
            aiNarrative: String(parsed.aiNarrative ?? ''),
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            confidencePercent: Number(parsed.confidencePercent ?? 75),
            isAIGenerated: true,
        };
    } catch {
        // Graceful fallback: return rule-based result wrapped as AI result
        return {
            ...rulebased,
            aiNarrative: '',
            recommendations: [],
            confidencePercent: 0,
            isAIGenerated: true,
        };
    }
};
