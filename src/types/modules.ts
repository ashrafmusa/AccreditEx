/**
 * Module System Types — AccreditEx
 *
 * Defines the module registry, plan-based gating, and
 * institute-type tailoring for delivering customized
 * app experiences per organization.
 *
 * Safety: Default behavior is ALL modules enabled (backward compat).
 * Disabling is opt-in only.
 */

import type { NavigationView, Organization } from '@/types';

// ── Module Identifiers ──────────────────────────────────────

/** Every toggleable module in AccreditEx */
export type ModuleId =
    // Core — always enabled, cannot be disabled
    | 'dashboard'
    | 'projects'
    | 'accreditation'
    | 'standards'
    | 'users'
    | 'settings'
    | 'notifications'
    // Domain — enabled per institute type
    | 'documentControl'
    | 'riskManagement'
    | 'auditHub'
    | 'qualityRounding'
    | 'trainingHub'
    | 'competencies'
    | 'performanceEval'
    | 'departments'
    | 'labOperations'
    | 'hisIntegration'
    // Premium — enabled per plan tier
    | 'analyticsHub'
    | 'reportBuilder'
    | 'workflowAutomation'
    | 'aiAssistant'
    | 'knowledgeBase'
    | 'calendar'
    | 'messaging'
    | 'dataHub'
    | 'customization';

export type ModuleTier = 'core' | 'domain' | 'premium';
export type ModuleCategory =
    | 'management'
    | 'compliance'
    | 'operations'
    | 'analytics'
    | 'communication'
    | 'system';

export type OrganizationType = NonNullable<Organization['type']>;
export type PlanTier = NonNullable<Organization['plan']>;

// ── Module Definition ───────────────────────────────────────

export interface ModuleDefinition {
    id: ModuleId;
    /** i18n key for module name */
    nameKey: string;
    /** i18n key for module description */
    descriptionKey: string;
    /** NavigationView values this module owns (for route guarding) */
    views: NavigationView[];
    /** Module classification */
    tier: ModuleTier;
    /** Minimum plan required (core modules ignore this) */
    requiredPlan: PlanTier;
    /** Which organization types should have this module (empty = all) */
    applicableTypes: OrganizationType[];
    /** Other modules that must be enabled for this to work */
    dependencies: ModuleId[];
    /** Grouping for admin UI */
    category: ModuleCategory;
}

// ── Organization Module Config ──────────────────────────────

/**
 * Per-organization module configuration.
 * Stored on the Organization document in Firestore.
 * If absent, ALL modules are enabled (backward compat).
 */
export interface OrganizationModuleConfig {
    /** Explicitly enabled modules (overrides plan defaults) */
    enabledModules?: ModuleId[];
    /** Explicitly disabled modules (overrides plan defaults) */
    disabledModules?: ModuleId[];
    /** Sub-module toggles for fine-grained control */
    subModules?: {
        labOperations?: {
            enableQC?: boolean;
            enableProficiencyTesting?: boolean;
            enableReagentTracking?: boolean;
        };
        audit?: {
            enableQualityRounding?: boolean;
            enableTracerMethodology?: boolean;
        };
        training?: {
            enableCECredits?: boolean;
            enableCompetencyAssessment?: boolean;
            enablePerformanceEval?: boolean;
        };
    };
}

// ── Core Module Set ─────────────────────────────────────────

/** Modules that can never be disabled */
export const CORE_MODULES: readonly ModuleId[] = [
    'dashboard',
    'projects',
    'accreditation',
    'standards',
    'users',
    'settings',
    'notifications',
] as const;

// ── Plan → Module Defaults ──────────────────────────────────

/** Default modules enabled at each plan tier (cumulative) */
export const PLAN_MODULE_MAP: Record<PlanTier, readonly ModuleId[]> = {
    free: [
        'calendar',
    ],
    starter: [
        'calendar',
        'documentControl',
        'riskManagement',
        'trainingHub',
        'competencies',
        'departments',
        'messaging',
        'knowledgeBase',
    ],
    professional: [
        'calendar',
        'documentControl',
        'riskManagement',
        'trainingHub',
        'competencies',
        'departments',
        'messaging',
        'knowledgeBase',
        'analyticsHub',
        'auditHub',
        'reportBuilder',
        'workflowAutomation',
        'labOperations',
        'aiAssistant',
        'customization',
    ],
    enterprise: [
        'calendar',
        'documentControl',
        'riskManagement',
        'trainingHub',
        'competencies',
        'departments',
        'messaging',
        'knowledgeBase',
        'analyticsHub',
        'auditHub',
        'qualityRounding',
        'reportBuilder',
        'workflowAutomation',
        'labOperations',
        'aiAssistant',
        'customization',
        'hisIntegration',
        'dataHub',
        'performanceEval',
    ],
};

// ── Organization Type → Module Defaults ─────────────────────

/** Modules particularly relevant to each institute type */
export const TYPE_MODULE_MAP: Record<OrganizationType, readonly ModuleId[]> = {
    hospital: [
        'auditHub',
        'qualityRounding',
        'labOperations',
        'hisIntegration',
        'performanceEval',
        'departments',
    ],
    clinic: [
        'departments',
    ],
    laboratory: [
        'labOperations',
    ],
    group: [
        'analyticsHub',
        'reportBuilder',
        'dataHub',
        'departments',
    ],
    other: [],
};
