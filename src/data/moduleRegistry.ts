/**
 * Module Registry — AccreditEx
 *
 * Central registry of all modules with their metadata, tier,
 * plan requirements, and institute-type relevance.
 * Used by moduleService to resolve which modules are enabled.
 */

import type { NavigationView } from '@/types';
import type { ModuleDefinition, ModuleId } from '@/types/modules';

/** Complete registry of every module in AccreditEx */
export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
    // ── Core Modules (always enabled) ──────────────────────────

    dashboard: {
        id: 'dashboard',
        nameKey: 'moduleDashboard',
        descriptionKey: 'moduleDashboardDesc',
        views: ['dashboard'],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'management',
    },

    projects: {
        id: 'projects',
        nameKey: 'moduleProjects',
        descriptionKey: 'moduleProjectsDesc',
        views: ['projects', 'projectDetail', 'createProject', 'editProject'],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'management',
    },

    accreditation: {
        id: 'accreditation',
        nameKey: 'moduleAccreditation',
        descriptionKey: 'moduleAccreditationDesc',
        views: ['accreditationHub'],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'compliance',
    },

    standards: {
        id: 'standards',
        nameKey: 'moduleStandards',
        descriptionKey: 'moduleStandardsDesc',
        views: ['standards'],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: ['accreditation'],
        category: 'compliance',
    },

    users: {
        id: 'users',
        nameKey: 'moduleUsers',
        descriptionKey: 'moduleUsersDesc',
        views: ['userProfile'],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'system',
    },

    settings: {
        id: 'settings',
        nameKey: 'moduleSettings',
        descriptionKey: 'moduleSettingsDesc',
        views: ['settings'],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'system',
    },

    notifications: {
        id: 'notifications',
        nameKey: 'moduleNotifications',
        descriptionKey: 'moduleNotificationsDesc',
        views: [],
        tier: 'core',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'communication',
    },

    // ── Domain Modules (per institute type) ────────────────────

    documentControl: {
        id: 'documentControl',
        nameKey: 'moduleDocumentControl',
        descriptionKey: 'moduleDocumentControlDesc',
        views: ['documentControl'],
        tier: 'domain',
        requiredPlan: 'starter',
        applicableTypes: ['hospital', 'clinic', 'laboratory', 'group', 'other'],
        dependencies: [],
        category: 'compliance',
    },

    riskManagement: {
        id: 'riskManagement',
        nameKey: 'moduleRiskManagement',
        descriptionKey: 'moduleRiskManagementDesc',
        views: ['riskHub'],
        tier: 'domain',
        requiredPlan: 'starter',
        applicableTypes: ['hospital', 'clinic', 'laboratory', 'group', 'other'],
        dependencies: [],
        category: 'compliance',
    },

    auditHub: {
        id: 'auditHub',
        nameKey: 'moduleAuditHub',
        descriptionKey: 'moduleAuditHubDesc',
        views: ['auditHub'],
        tier: 'domain',
        requiredPlan: 'professional',
        applicableTypes: ['hospital', 'group'],
        dependencies: [],
        category: 'compliance',
    },

    qualityRounding: {
        id: 'qualityRounding',
        nameKey: 'moduleQualityRounding',
        descriptionKey: 'moduleQualityRoundingDesc',
        views: ['qualityRounding'],
        tier: 'domain',
        requiredPlan: 'enterprise',
        applicableTypes: ['hospital'],
        dependencies: ['auditHub'],
        category: 'compliance',
    },

    trainingHub: {
        id: 'trainingHub',
        nameKey: 'moduleTrainingHub',
        descriptionKey: 'moduleTrainingHubDesc',
        views: ['trainingHub', 'trainingDetail', 'certificate'],
        tier: 'domain',
        requiredPlan: 'starter',
        applicableTypes: ['hospital', 'clinic', 'laboratory', 'group', 'other'],
        dependencies: [],
        category: 'operations',
    },

    competencies: {
        id: 'competencies',
        nameKey: 'moduleCompetencies',
        descriptionKey: 'moduleCompetenciesDesc',
        views: [],
        tier: 'domain',
        requiredPlan: 'starter',
        applicableTypes: ['hospital', 'clinic', 'laboratory', 'group', 'other'],
        dependencies: ['trainingHub'],
        category: 'operations',
    },

    performanceEval: {
        id: 'performanceEval',
        nameKey: 'modulePerformanceEval',
        descriptionKey: 'modulePerformanceEvalDesc',
        views: [],
        tier: 'domain',
        requiredPlan: 'enterprise',
        applicableTypes: ['hospital', 'group'],
        dependencies: ['trainingHub', 'competencies'],
        category: 'operations',
    },

    departments: {
        id: 'departments',
        nameKey: 'moduleDepartments',
        descriptionKey: 'moduleDepartmentsDesc',
        views: ['departments', 'departmentDetail'],
        tier: 'domain',
        requiredPlan: 'starter',
        applicableTypes: ['hospital', 'clinic', 'group'],
        dependencies: [],
        category: 'management',
    },

    labOperations: {
        id: 'labOperations',
        nameKey: 'moduleLabOperations',
        descriptionKey: 'moduleLabOperationsDesc',
        views: ['labOperations'],
        tier: 'domain',
        requiredPlan: 'professional',
        applicableTypes: ['hospital', 'laboratory'],
        dependencies: [],
        category: 'operations',
    },

    hisIntegration: {
        id: 'hisIntegration',
        nameKey: 'moduleHISIntegration',
        descriptionKey: 'moduleHISIntegrationDesc',
        views: [],
        tier: 'domain',
        requiredPlan: 'enterprise',
        applicableTypes: ['hospital'],
        dependencies: [],
        category: 'system',
    },

    // ── Premium Modules (per plan tier) ────────────────────────

    analyticsHub: {
        id: 'analyticsHub',
        nameKey: 'moduleAnalyticsHub',
        descriptionKey: 'moduleAnalyticsHubDesc',
        views: ['analyticsHub'],
        tier: 'premium',
        requiredPlan: 'professional',
        applicableTypes: [],
        dependencies: [],
        category: 'analytics',
    },

    reportBuilder: {
        id: 'reportBuilder',
        nameKey: 'moduleReportBuilder',
        descriptionKey: 'moduleReportBuilderDesc',
        views: ['reportBuilder'],
        tier: 'premium',
        requiredPlan: 'professional',
        applicableTypes: [],
        dependencies: [],
        category: 'analytics',
    },

    workflowAutomation: {
        id: 'workflowAutomation',
        nameKey: 'moduleWorkflowAutomation',
        descriptionKey: 'moduleWorkflowAutomationDesc',
        views: ['workflowAutomation'],
        tier: 'premium',
        requiredPlan: 'professional',
        applicableTypes: [],
        dependencies: [],
        category: 'operations',
    },

    aiAssistant: {
        id: 'aiAssistant',
        nameKey: 'moduleAIAssistant',
        descriptionKey: 'moduleAIAssistantDesc',
        views: [],
        tier: 'premium',
        requiredPlan: 'professional',
        applicableTypes: [],
        dependencies: [],
        category: 'system',
    },

    knowledgeBase: {
        id: 'knowledgeBase',
        nameKey: 'moduleKnowledgeBase',
        descriptionKey: 'moduleKnowledgeBaseDesc',
        views: ['knowledgeBase'],
        tier: 'premium',
        requiredPlan: 'starter',
        applicableTypes: [],
        dependencies: [],
        category: 'communication',
    },

    calendar: {
        id: 'calendar',
        nameKey: 'moduleCalendar',
        descriptionKey: 'moduleCalendarDesc',
        views: ['calendar'],
        tier: 'premium',
        requiredPlan: 'free',
        applicableTypes: [],
        dependencies: [],
        category: 'management',
    },

    messaging: {
        id: 'messaging',
        nameKey: 'moduleMessaging',
        descriptionKey: 'moduleMessagingDesc',
        views: ['messaging'],
        tier: 'premium',
        requiredPlan: 'starter',
        applicableTypes: [],
        dependencies: [],
        category: 'communication',
    },

    dataHub: {
        id: 'dataHub',
        nameKey: 'moduleDataHub',
        descriptionKey: 'moduleDataHubDesc',
        views: ['dataHub'],
        tier: 'premium',
        requiredPlan: 'enterprise',
        applicableTypes: [],
        dependencies: [],
        category: 'system',
    },

    customization: {
        id: 'customization',
        nameKey: 'moduleCustomization',
        descriptionKey: 'moduleCustomizationDesc',
        views: [],
        tier: 'premium',
        requiredPlan: 'professional',
        applicableTypes: [],
        dependencies: [],
        category: 'system',
    },
};

/** All module definitions as an array */
export const ALL_MODULES: ModuleDefinition[] = Object.values(MODULE_REGISTRY);

/**
 * Map NavigationView → ModuleId for route guarding.
 * Built automatically from MODULE_REGISTRY so it stays in sync.
 */
export const VIEW_TO_MODULE_MAP: Partial<Record<NavigationView, ModuleId>> = {};

for (const mod of ALL_MODULES) {
    for (const view of mod.views) {
        VIEW_TO_MODULE_MAP[view] = mod.id;
    }
}
