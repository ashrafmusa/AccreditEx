// ============================================
// PDCA CYCLE MANAGEMENT TYPE DEFINITIONS
// ============================================
// These are supplementary types re-exported from index.ts

import type { PDCAStage } from './index';

// Re-export PDCAStage for backward compatibility
export type { PDCAStage };

// PDCA Cycle Template
export interface PDCACycleTemplate {
    title: string;
    description: string;
    category: 'Process' | 'Quality' | 'Safety' | 'Efficiency' | 'Other';
    priority: 'High' | 'Medium' | 'Low';
    estimatedDays: number;
}

// PDCA Stage History - tracks transitions between stages
export interface PDCAStageHistory {
    stage: PDCAStage;
    enteredAt: string;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    attachments?: string[];
}

// Individual Improvement Metric
export interface ImprovementMetric {
    metric: string;                  // Name of the metric (e.g., "Patient Wait Time")
    value: number;                   // Numeric value
    unit: string;                    // Unit of measurement (e.g., "minutes", "%")
    measuredAt?: string;             // ISO date string when measured (for actual metrics)
}

// Improvement Metrics Collection
export interface ImprovementMetrics {
    baseline: ImprovementMetric[];
    target: ImprovementMetric[];
    actual?: ImprovementMetric[];
}
