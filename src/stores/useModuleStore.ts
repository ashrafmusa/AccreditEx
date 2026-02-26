/**
 * Module Store — AccreditEx
 *
 * Zustand store that caches the set of enabled modules for the
 * current organization. Recalculated when the tenant changes.
 *
 * SAFETY: Defaults to ALL modules enabled until an organization
 * is loaded, ensuring zero breakage for existing deployments.
 */

import { create } from 'zustand';
import type { Organization, NavigationView } from '@/types';
import type { ModuleId, OrganizationModuleConfig } from '@/types/modules';
import {
    resolveEnabledModules,
    isViewEnabled,
    NAV_KEY_TO_MODULE,
} from '@/services/moduleService';
import { MODULE_REGISTRY } from '@/data/moduleRegistry';

interface ModuleState {
    /** Currently enabled modules (Set for O(1) lookups) */
    enabledModules: Set<ModuleId>;

    /** Module config from the organization document */
    moduleConfig: OrganizationModuleConfig | null;

    /** Whether modules have been resolved at least once */
    initialized: boolean;

    /** Recalculate enabled modules from organization data */
    resolveModules: (
        org: Organization | null,
        moduleConfig?: OrganizationModuleConfig | null
    ) => void;

    /** Check if a specific module ID is enabled */
    isModuleEnabled: (moduleId: ModuleId) => boolean;

    /** Check if a navigation view is allowed */
    isViewEnabled: (view: NavigationView) => boolean;

    /** Check if a navigation sidebar key is enabled */
    isNavKeyEnabled: (navKey: string) => boolean;

    /** Reset to all-enabled state */
    reset: () => void;
}

/** Default: ALL modules enabled (backward compat) */
const ALL_MODULES_SET = new Set<ModuleId>(
    Object.keys(MODULE_REGISTRY) as ModuleId[]
);

export const useModuleStore = create<ModuleState>((set, get) => ({
    enabledModules: new Set(ALL_MODULES_SET),
    moduleConfig: null,
    initialized: false,

    resolveModules: (org, moduleConfig = null) => {
        const enabled = resolveEnabledModules(org, moduleConfig);
        set({
            enabledModules: enabled,
            moduleConfig: moduleConfig || null,
            initialized: true,
        });
    },

    isModuleEnabled: (moduleId) => {
        return get().enabledModules.has(moduleId);
    },

    isViewEnabled: (view) => {
        const { enabledModules } = get();
        // Quick check: if all modules are enabled, all views are allowed
        if (enabledModules.size === ALL_MODULES_SET.size) return true;

        // Use the module service for proper lookup
        // But avoid circular dep by doing inline check
        const moduleId = getViewModule(view);
        if (!moduleId) return true; // unmapped views are always allowed
        return enabledModules.has(moduleId);
    },

    isNavKeyEnabled: (navKey) => {
        const moduleId = NAV_KEY_TO_MODULE[navKey];
        if (!moduleId) return true; // unmapped nav keys are always visible
        return get().enabledModules.has(moduleId);
    },

    reset: () => {
        set({
            enabledModules: new Set(ALL_MODULES_SET),
            moduleConfig: null,
            initialized: false,
        });
    },
}));

/**
 * Quick lookup: NavigationView → ModuleId
 * Inlined to avoid circular dependency with moduleService.
 */
function getViewModule(view: NavigationView): ModuleId | undefined {
    for (const mod of Object.values(MODULE_REGISTRY)) {
        if (mod.views.includes(view)) return mod.id;
    }
    return undefined;
}

// ── Convenience hooks ──────────────────────────────────────

/** Hook: check if a module is enabled */
export const useIsModuleEnabled = (moduleId: ModuleId): boolean => {
    return useModuleStore((s) => s.enabledModules.has(moduleId));
};

/** Hook: check if a navigation key is enabled */
export const useIsNavKeyEnabled = (navKey: string): boolean => {
    const moduleId = NAV_KEY_TO_MODULE[navKey];
    if (!moduleId) return true;
    return useModuleStore((s) => s.enabledModules.has(moduleId));
};
