// ============================================
// PDCA CYCLE MANAGEMENT TYPE DEFINITIONS
// ============================================
// Add these type definitions to your types.ts file
// Follow the pdca_manual_edits.md guide for exact placement

// PDCA Stage Type
export type PDCAStage = 'Plan' | 'Do' | 'Check' | 'Act' | 'Completed';

// PDCA Stage History - tracks transitions between stages
export interface PDCAStageHistory {
    stage: PDCAStage;
    enteredAt: string;              // ISO date string when stage was entered
    completedAt?: string;            // ISO date string when stage was completed
    completedBy?: string;            // User ID who completed the stage
    notes: string;                   // Notes/comments for this stage transition
    attachments?: string[];          // Array of document IDs attached as evidence
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
    baseline: ImprovementMetric[];   // Baseline measurements before improvement
    target: ImprovementMetric[];     // Target goals for improvement
    actual?: ImprovementMetric[];    // Actual results after implementation
}

// Standalone PDCA Cycle (for improvement initiatives not tied to CAPAs)
export interface PDCACycle {
    id: string;
    projectId: string;                                                    // Parent project ID
    title: string;                                                        // Cycle title
    description: string;                                                  // Detailed description
    category: 'Process' | 'Quality' | 'Safety' | 'Efficiency' | 'Other'; // Category
    currentStage: PDCAStage;                                             // Current PDCA stage
    priority: 'High' | 'Medium' | 'Low';                                 // Priority level
    owner: string;                                                        // User ID of cycle owner
    team: string[];                                                       // Array of team member user IDs
    createdAt: string;                                                    // ISO date string
    targetCompletionDate: string;                                         // ISO date string
    stageHistory: PDCAStageHistory[];                                     // History of stage transitions
    improvementMetrics: ImprovementMetrics;                               // Metrics tracking
    linkedCAPAIds?: string[];                                             // Optional linked CAPA IDs
    linkedDocumentIds?: string[];                                         // Optional linked document IDs
}

// ============================================
// EXTENSIONS TO EXISTING INTERFACES
// ============================================

// Add these fields to the existing CAPAReport interface:
/*
    // PDCA Cycle fields
    pdcaStage?: PDCAStage;
    pdcaHistory?: PDCAStageHistory[];
    improvementMetrics?: ImprovementMetrics;
*/

// Add this field to the existing Project interface:
/*
    pdcaCycles?: PDCACycle[]; // Optional standalone PDCA cycles
*/

// Update the ProjectDetailView type to include:
/*
export type ProjectDetailView = 'overview' | 'checklist' | 'documents' | 'audit_log' | 'mock_surveys' | 'design_controls' | 'pdca_cycles';
*/
