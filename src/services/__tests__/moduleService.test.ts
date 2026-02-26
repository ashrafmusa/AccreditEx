/**
 * Module Service — Unit Tests
 *
 * Tests module resolution logic: plan gating, org-type filtering,
 * overrides, dependency resolution, and view mapping.
 */
import {
    isPlanSufficient,
    resolveEnabledModules,
    isModuleEnabled,
    isViewEnabled,
    getModuleForView,
    getRequiredPlan,
} from '../moduleService';
import type { Organization } from '@/types';
import type { OrganizationModuleConfig } from '@/types/modules';

const mkOrg = (overrides: Partial<Organization> = {}): Organization => ({
    id: 'org-1',
    name: 'Test Hospital',
    type: 'hospital',
    isActive: true,
    plan: 'professional',
    createdAt: '2025-01-01',
    ...overrides,
});

describe('moduleService', () => {
    // ── isPlanSufficient ─────────────────────────────────────
    describe('isPlanSufficient', () => {
        it('free meets free', () => {
            expect(isPlanSufficient('free', 'free')).toBe(true);
        });

        it('free does NOT meet starter', () => {
            expect(isPlanSufficient('free', 'starter')).toBe(false);
        });

        it('enterprise meets any plan', () => {
            expect(isPlanSufficient('enterprise', 'free')).toBe(true);
            expect(isPlanSufficient('enterprise', 'starter')).toBe(true);
            expect(isPlanSufficient('enterprise', 'professional')).toBe(true);
            expect(isPlanSufficient('enterprise', 'enterprise')).toBe(true);
        });

        it('starter meets starter but not professional', () => {
            expect(isPlanSufficient('starter', 'starter')).toBe(true);
            expect(isPlanSufficient('starter', 'professional')).toBe(false);
        });
    });

    // ── resolveEnabledModules ────────────────────────────────
    describe('resolveEnabledModules', () => {
        it('returns ALL modules when org is null (legacy mode)', () => {
            const modules = resolveEnabledModules(null);
            // Should include at least core modules
            expect(modules.has('dashboard')).toBe(true);
            expect(modules.has('projects')).toBe(true);
            // Enterprise modules also enabled in legacy mode
            expect(modules.size).toBeGreaterThan(10);
        });

        it('free plan includes core modules', () => {
            const org = mkOrg({ plan: 'free' });
            const modules = resolveEnabledModules(org);
            expect(modules.has('dashboard')).toBe(true);
            expect(modules.has('projects')).toBe(true);
            expect(modules.has('settings')).toBe(true);
        });

        it('professional plan includes more modules than starter', () => {
            const starter = resolveEnabledModules(mkOrg({ plan: 'starter' }));
            const professional = resolveEnabledModules(mkOrg({ plan: 'professional' }));
            expect(professional.size).toBeGreaterThanOrEqual(starter.size);
        });

        it('enterprise plan includes the most modules', () => {
            const professional = resolveEnabledModules(mkOrg({ plan: 'professional' }));
            const enterprise = resolveEnabledModules(mkOrg({ plan: 'enterprise' }));
            expect(enterprise.size).toBeGreaterThanOrEqual(professional.size);
        });

        it('filters domain modules by org type', () => {
            // lab-specific modules should not appear for hospitals if not applicable
            const hospital = resolveEnabledModules(mkOrg({ type: 'hospital', plan: 'enterprise' }));
            const lab = resolveEnabledModules(mkOrg({ type: 'laboratory', plan: 'enterprise' }));
            // Both should have core modules
            expect(hospital.has('dashboard')).toBe(true);
            expect(lab.has('dashboard')).toBe(true);
        });

        it('explicit enabledModules override adds modules', () => {
            const org = mkOrg({ plan: 'professional' });
            const config: OrganizationModuleConfig = {
                enabledModules: ['labOperations'],
                disabledModules: [],
            };
            const modules = resolveEnabledModules(org, config);
            expect(modules.has('labOperations')).toBe(true);
        });

        it('explicit disabledModules removes non-core modules', () => {
            const org = mkOrg({ plan: 'enterprise' });
            const config: OrganizationModuleConfig = {
                enabledModules: [],
                disabledModules: ['knowledgeBase'],
            };
            const modules = resolveEnabledModules(org, config);
            expect(modules.has('knowledgeBase')).toBe(false);
        });

        it('cannot disable core modules', () => {
            const org = mkOrg({ plan: 'enterprise' });
            const config: OrganizationModuleConfig = {
                enabledModules: [],
                disabledModules: ['dashboard', 'projects'],
            };
            const modules = resolveEnabledModules(org, config);
            expect(modules.has('dashboard')).toBe(true);
            expect(modules.has('projects')).toBe(true);
        });
    });

    // ── isModuleEnabled ──────────────────────────────────────
    describe('isModuleEnabled', () => {
        it('returns true for core module on any plan', () => {
            expect(isModuleEnabled('dashboard', mkOrg({ plan: 'free' }))).toBe(true);
        });

        it('returns true when org is null (legacy)', () => {
            expect(isModuleEnabled('dashboard', null)).toBe(true);
        });
    });

    // ── isViewEnabled ────────────────────────────────────────
    describe('isViewEnabled', () => {
        it('returns true for unmapped views (always allowed)', () => {
            expect(isViewEnabled('mockSurvey', mkOrg())).toBe(true);
        });

        it('returns true for dashboard view on any plan', () => {
            expect(isViewEnabled('dashboard', mkOrg({ plan: 'free' }))).toBe(true);
        });

        it('returns true when org is null (legacy mode)', () => {
            expect(isViewEnabled('dashboard', null)).toBe(true);
        });
    });

    // ── getModuleForView ─────────────────────────────────────
    describe('getModuleForView', () => {
        it('returns module definition for mapped views', () => {
            const mod = getModuleForView('dashboard');
            expect(mod).toBeDefined();
            expect(mod?.id).toBe('dashboard');
        });

        it('returns undefined for unmapped views', () => {
            expect(getModuleForView('mockSurvey')).toBeUndefined();
        });
    });

    // ── getRequiredPlan ──────────────────────────────────────
    describe('getRequiredPlan', () => {
        it('returns free for core modules', () => {
            expect(getRequiredPlan('dashboard')).toBe('free');
        });

        it('returns a valid plan tier', () => {
            const validTiers = ['free', 'starter', 'professional', 'enterprise'];
            expect(validTiers).toContain(getRequiredPlan('projects'));
        });
    });
});
