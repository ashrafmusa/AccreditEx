/**
 * useModuleStore — Unit Tests
 *
 * Tests module resolution, view/navKey gating, and reset behavior.
 */
import type { Organization } from '@/types';
import type { ModuleId } from '@/types/modules';

/* ── Mock MODULE_REGISTRY ────────────────────────────────── */
const MOCK_REGISTRY: Record<string, { id: string; views: string[]; requiredPlan: string; core: boolean }> = {
    core_dashboard: { id: 'core_dashboard', views: ['dashboard'], requiredPlan: 'free', core: true },
    projects: { id: 'projects', views: ['projects', 'projectDetail'], requiredPlan: 'starter', core: false },
    risk_management: { id: 'risk_management', views: ['riskManagement'], requiredPlan: 'professional', core: false },
    analytics: { id: 'analytics', views: ['analytics'], requiredPlan: 'enterprise', core: false },
};

jest.mock('@/data/moduleRegistry', () => ({
    MODULE_REGISTRY: {
        core_dashboard: { id: 'core_dashboard', views: ['dashboard'], requiredPlan: 'free', core: true },
        projects: { id: 'projects', views: ['projects', 'projectDetail'], requiredPlan: 'starter', core: false },
        risk_management: { id: 'risk_management', views: ['riskManagement'], requiredPlan: 'professional', core: false },
        analytics: { id: 'analytics', views: ['analytics'], requiredPlan: 'enterprise', core: false },
    },
}));

/* ── Mock moduleService ──────────────────────────────────── */
const mockResolveEnabledModules = jest.fn() as jest.Mock<Set<ModuleId>>;
const mockIsViewEnabled = jest.fn() as jest.Mock<boolean>;
const mockNavKeyToModule: Record<string, ModuleId> = {
    projects: 'projects' as ModuleId,
    riskManagement: 'risk_management' as ModuleId,
    analytics: 'analytics' as ModuleId,
};

jest.mock('@/services/moduleService', () => ({
    resolveEnabledModules: (...args: unknown[]) => mockResolveEnabledModules(args[0] as any, args[1] as any),
    isViewEnabled: (...args: unknown[]) => mockIsViewEnabled(args[0] as any, args[1] as any),
    NAV_KEY_TO_MODULE: mockNavKeyToModule,
}));

/* ── Import AFTER mocks ──────────────────────────────────── */
import { useModuleStore } from '@/stores/useModuleStore';

/* ── Helpers ─────────────────────────────────────────────── */
const starterOrg = {
    id: 'org-1',
    name: 'Test Clinic',
    plan: 'starter',
    status: 'active',
} as unknown as Organization;

describe('useModuleStore', () => {
    beforeEach(() => {
        // Reset store to default state
        useModuleStore.getState().reset();
        jest.clearAllMocks();
    });

    describe('initial state', () => {
        it('starts with all modules enabled (backward compat)', () => {
            const { enabledModules, initialized } = useModuleStore.getState();
            expect(enabledModules.size).toBe(Object.keys(MOCK_REGISTRY).length);
            expect(initialized).toBe(false);
        });

        it('moduleConfig starts null', () => {
            expect(useModuleStore.getState().moduleConfig).toBeNull();
        });
    });

    describe('resolveModules', () => {
        it('calls resolveEnabledModules and updates state', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard', 'projects'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);

            useModuleStore.getState().resolveModules(starterOrg);

            expect(mockResolveEnabledModules).toHaveBeenCalledWith(starterOrg, null);
            expect(useModuleStore.getState().enabledModules).toBe(resultSet);
            expect(useModuleStore.getState().initialized).toBe(true);
        });

        it('stores moduleConfig when provided', () => {
            const config = { enabledModules: ['projects'], disabledModules: [] };
            mockResolveEnabledModules.mockReturnValue(new Set<ModuleId>());

            useModuleStore.getState().resolveModules(starterOrg, config as any);

            expect(mockResolveEnabledModules).toHaveBeenCalledWith(starterOrg, config);
            expect(useModuleStore.getState().moduleConfig).toEqual(config);
        });

        it('handles null org', () => {
            mockResolveEnabledModules.mockReturnValue(new Set<ModuleId>());
            useModuleStore.getState().resolveModules(null);
            expect(mockResolveEnabledModules).toHaveBeenCalledWith(null, null);
        });
    });

    describe('isModuleEnabled', () => {
        it('returns true for enabled module', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard', 'projects'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg);

            expect(useModuleStore.getState().isModuleEnabled('projects' as ModuleId)).toBe(true);
        });

        it('returns false for disabled module', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg);

            expect(useModuleStore.getState().isModuleEnabled('risk_management' as ModuleId)).toBe(false);
        });
    });

    describe('isViewEnabled', () => {
        it('returns true when all modules are enabled (default)', () => {
            // Default state: all modules enabled
            expect(useModuleStore.getState().isViewEnabled('dashboard' as any)).toBe(true);
        });

        it('returns true for unmapped view', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg);

            // A view not in any module's views array
            expect(useModuleStore.getState().isViewEnabled('unknownView' as any)).toBe(true);
        });

        it('returns false when module for that view is disabled', () => {
            // Only core_dashboard enabled, risk_management disabled
            const resultSet = new Set<ModuleId>(['core_dashboard'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg);

            // riskManagement view belongs to risk_management module
            expect(useModuleStore.getState().isViewEnabled('riskManagement' as any)).toBe(false);
        });
    });

    describe('isNavKeyEnabled', () => {
        it('returns true for unmapped nav key', () => {
            expect(useModuleStore.getState().isNavKeyEnabled('homepage')).toBe(true);
        });

        it('returns true for enabled module nav key', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard', 'projects'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg);

            expect(useModuleStore.getState().isNavKeyEnabled('projects')).toBe(true);
        });

        it('returns false for disabled module nav key', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg);

            expect(useModuleStore.getState().isNavKeyEnabled('analytics')).toBe(false);
        });
    });

    describe('reset', () => {
        it('restores all modules and clears config', () => {
            const resultSet = new Set<ModuleId>(['core_dashboard'] as unknown as ModuleId[]);
            mockResolveEnabledModules.mockReturnValue(resultSet);
            useModuleStore.getState().resolveModules(starterOrg, { enabledModules: [] } as any);

            expect(useModuleStore.getState().enabledModules.size).toBe(1);
            expect(useModuleStore.getState().initialized).toBe(true);

            useModuleStore.getState().reset();

            expect(useModuleStore.getState().enabledModules.size).toBe(Object.keys(MOCK_REGISTRY).length);
            expect(useModuleStore.getState().moduleConfig).toBeNull();
            expect(useModuleStore.getState().initialized).toBe(false);
        });
    });
});
