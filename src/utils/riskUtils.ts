/**
 * Shared risk level calculation — canonical scale aligned with AI Agent (risk_assessment_agent.py)
 * 
 * Scale:
 *   Low:      1–4   (green)
 *   Medium:   5–9   (yellow)
 *   High:     10–15 (orange)
 *   Critical: 16–25 (red)
 */

export interface RiskLevel {
    name: string;
    key: string;
    color: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
}

export const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 16) return { name: 'Critical', key: 'critical', color: 'bg-red-700', textColor: 'text-white', badgeBg: 'bg-red-100 dark:bg-red-900/30', badgeText: 'text-red-800 dark:text-red-300' };
    if (score >= 10) return { name: 'High', key: 'high', color: 'bg-red-500', textColor: 'text-white', badgeBg: 'bg-orange-100 dark:bg-orange-900/30', badgeText: 'text-orange-800 dark:text-orange-300' };
    if (score >= 5) return { name: 'Medium', key: 'medium', color: 'bg-yellow-400', textColor: 'text-yellow-900', badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30', badgeText: 'text-yellow-800 dark:text-yellow-300' };
    return { name: 'Low', key: 'low', color: 'bg-green-500', textColor: 'text-white', badgeBg: 'bg-green-100 dark:bg-green-900/30', badgeText: 'text-green-800 dark:text-green-300' };
};

export const computeRiskScore = (likelihood: number, impact: number): number => {
    return likelihood * impact;
};

export const computeRiskLevelName = (likelihood: number, impact: number): string => {
    return getRiskLevel(computeRiskScore(likelihood, impact)).name;
};
