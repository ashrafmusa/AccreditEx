/**
 * Module Service — AccreditEx
 *
 * Resolves which modules are enabled for the current organization
 * based on plan tier, organization type, and explicit overrides.
 *
 * SAFETY: If no organization is loaded (legacy single-tenant mode),
 * ALL modules are enabled to maintain backward compatibility.
 */

import type { Organization, NavigationView } from '@/types';
import type {
    ModuleId,
    ModuleDefinition,
    OrganizationModuleConfig,
    PlanTier,
} from '@/types/modules';
import { CORE_MODULES, PLAN_MODULE_MAP } from '@/types/modules';
import { MODULE_REGISTRY, VIEW_TO_MODULE_MAP } from '@/data/moduleRegistry';

/** Plan tier hierarchy for comparison */
const PLAN_HIERARCHY: Record<PlanTier, number> = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
};

/**
 * Check if a plan tier meets or exceeds the required plan.
 */
export function isPlanSufficient(
    currentPlan: PlanTier,
    requiredPlan: PlanTier
): boolean {
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Resolve the set of enabled modules for an organization.
 *
 * Resolution order:
 * 1. Start with core modules (always on)
 * 2. Add plan-default modules for the org's plan tier
 * 3. Filter by organization type (domain modules)
 * 4. Apply explicit enabledModules overrides
 * 5. Apply explicit disabledModules overrides (cannot disable core)
 * 6. Resolve dependencies (ensure parents are enabled)
 *
 * If org is null (legacy mode), returns ALL modules.
 */
export function resolveEnabledModules(
    org: Organization | null,
    moduleConfig?: OrganizationModuleConfig | null
): Set<ModuleId> {
    // Legacy single-tenant mode: everything enabled
    if (!org) {
        return new Set(Object.keys(MODULE_REGISTRY) as ModuleId[]);
    }

    const plan: PlanTier = org.plan || 'free';
    const orgType = org.type || 'other';

    // 1. Core modules (always on)
    const enabled = new Set<ModuleId>([...CORE_MODULES]);

    // 2. Plan-default modules
    const planModules = PLAN_MODULE_MAP[plan] || [];
    for (const m of planModules) {
        enabled.add(m);
    }

    // 3. Filter: remove domain modules not applicable to this org type
    //    (only if applicableTypes is non-empty)
    for (const moduleId of [...enabled]) {
        const def = MODULE_REGISTRY[moduleId];
        if (
            def &&
            def.tier === 'domain' &&
            def.applicableTypes.length > 0 &&
            !def.applicableTypes.includes(orgType)
        ) {
            // Only remove if not explicitly overridden
            if (!moduleConfig?.enabledModules?.includes(moduleId)) {
                enabled.delete(moduleId);
            }
        }
    }

    // 4. Explicit overrides — add
    if (moduleConfig?.enabledModules) {
        for (const m of moduleConfig.enabledModules) {
            // Only add if plan supports it (or it's a core module)
            const def = MODULE_REGISTRY[m];
            if (def && (def.tier === 'core' || isPlanSufficient(plan, def.requiredPlan))) {
                enabled.add(m);
            }
        }
    }

    // 5. Explicit overrides — remove (cannot remove core)
    if (moduleConfig?.disabledModules) {
        for (const m of moduleConfig.disabledModules) {
            if (!CORE_MODULES.includes(m)) {
                enabled.delete(m);
            }
        }
    }

    // 6. Resolve dependencies: if a module is enabled, its deps must be too
    let changed = true;
    while (changed) {
        changed = false;
        for (const moduleId of [...enabled]) {
            const def = MODULE_REGISTRY[moduleId];
            if (!def) continue;
            for (const dep of def.dependencies) {
                if (!enabled.has(dep)) {
                    enabled.add(dep);
                    changed = true;
                }
            }
        }
    }

    return enabled;
}

/**
 * Check if a specific module is enabled for the given organization.
 */
export function isModuleEnabled(
    moduleId: ModuleId,
    org: Organization | null,
    moduleConfig?: OrganizationModuleConfig | null
): boolean {
    return resolveEnabledModules(org, moduleConfig).has(moduleId);
}

/**
 * Check if a NavigationView is allowed based on module configuration.
 * Views not mapped to any module are always allowed (e.g., mockSurvey).
 */
export function isViewEnabled(
    view: NavigationView,
    org: Organization | null,
    moduleConfig?: OrganizationModuleConfig | null
): boolean {
    const moduleId = VIEW_TO_MODULE_MAP[view];
    // Views not mapped to any module are always allowed
    if (!moduleId) return true;
    return isModuleEnabled(moduleId, org, moduleConfig);
}

/**
 * Get the module definition for a NavigationView.
 * Returns undefined if the view isn't mapped to a module.
 */
export function getModuleForView(view: NavigationView): ModuleDefinition | undefined {
    const moduleId = VIEW_TO_MODULE_MAP[view];
    if (!moduleId) return undefined;
    return MODULE_REGISTRY[moduleId];
}

/**
 * Get the required plan for a module.
 */
export function getRequiredPlan(moduleId: ModuleId): PlanTier {
    return MODULE_REGISTRY[moduleId]?.requiredPlan || 'free';
}

/**
 * Get the navigation key → ModuleId mapping for sidebar filtering.
 * Maps the nav item `key` values used in NavigationRail/MobileSidebar
 * to their corresponding ModuleId.
 */
export const NAV_KEY_TO_MODULE: Record<string, ModuleId> = {
    dashboard: 'dashboard',
    analyticsHub: 'analyticsHub',
    analytics: 'analyticsHub',
    qualityInsights: 'analyticsHub',
    calendar: 'calendar',
    projects: 'projects',
    documentControl: 'documentControl',
    messaging: 'messaging',
    riskHub: 'riskManagement',
    auditHub: 'auditHub',
    dataHub: 'dataHub',
    trainingHub: 'trainingHub',
    accreditationHub: 'accreditation',
    knowledgeBase: 'knowledgeBase',
    labOperations: 'labOperations',
    workflowAutomation: 'workflowAutomation',
    departments: 'departments',
    settings: 'settings',
    // myTasks is always available (maps to projects)
    myTasks: 'projects',
};
