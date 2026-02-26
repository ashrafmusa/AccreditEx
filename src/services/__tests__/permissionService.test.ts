/**
 * Permission Service — Unit Tests
 *
 * Tests RBAC permission matrix, role checks, and edge cases.
 */
import { PermissionService, Action, Resource } from '../permissionService';
import { UserRole } from '@/types';

// Use fresh instance (no Firebase dependency for pure logic tests)
const svc = new PermissionService();

const mkUser = (role: string, overrides: Record<string, any> = {}) => ({
    role: role as any,
    id: 'u1',
    isActive: true,
    ...overrides,
});

describe('PermissionService', () => {
    // ── Admin ────────────────────────────────────────────────
    describe('Admin role', () => {
        const admin = mkUser(UserRole.Admin);

        it('should have full access on every resource', () => {
            const allActions = Object.values(Action);
            const allResources = Object.values(Resource);
            for (const resource of allResources) {
                for (const action of allActions) {
                    expect(svc.can(admin, action, resource)).toBe(true);
                }
            }
        });

        it('isAdmin() returns true', () => {
            expect(svc.isAdmin(admin)).toBe(true);
        });

        it('canManageUsers() returns true', () => {
            expect(svc.canManageUsers(admin)).toBe(true);
        });

        it('canConfigureSettings() returns true', () => {
            expect(svc.canConfigureSettings(admin)).toBe(true);
        });
    });

    // ── ProjectLead ──────────────────────────────────────────
    describe('ProjectLead role', () => {
        const lead = mkUser(UserRole.ProjectLead);

        it('can create projects', () => {
            expect(svc.can(lead, Action.Create, Resource.Project)).toBe(true);
        });

        it('can approve projects', () => {
            expect(svc.can(lead, Action.Approve, Resource.Project)).toBe(true);
        });

        it('cannot delete projects', () => {
            expect(svc.can(lead, Action.Delete, Resource.Project)).toBe(false);
        });

        it('cannot create users (read-only on users)', () => {
            expect(svc.can(lead, Action.Create, Resource.User)).toBe(false);
            expect(svc.can(lead, Action.Read, Resource.User)).toBe(true);
        });

        it('cannot configure settings (read-only on settings)', () => {
            expect(svc.canConfigureSettings(lead)).toBe(false);
            expect(svc.can(lead, Action.Read, Resource.Settings)).toBe(true);
        });

        it('isAdmin() returns false', () => {
            expect(svc.isAdmin(lead)).toBe(false);
        });

        it('canModify() returns true', () => {
            expect(svc.canModify(lead)).toBe(true);
        });
    });

    // ── Auditor ──────────────────────────────────────────────
    describe('Auditor role', () => {
        const auditor = mkUser(UserRole.Auditor);

        it('can create/update audits', () => {
            expect(svc.can(auditor, Action.Create, Resource.Audit)).toBe(true);
            expect(svc.can(auditor, Action.Update, Resource.Audit)).toBe(true);
        });

        it('can create/update risks', () => {
            expect(svc.can(auditor, Action.Create, Resource.Risk)).toBe(true);
            expect(svc.can(auditor, Action.Update, Resource.Risk)).toBe(true);
        });

        it('cannot create projects (read/export only by default)', () => {
            expect(svc.can(auditor, Action.Create, Resource.Project)).toBe(false);
            expect(svc.can(auditor, Action.Read, Resource.Project)).toBe(true);
            expect(svc.can(auditor, Action.Export, Resource.Project)).toBe(true);
        });

        it('cannot delete anything', () => {
            expect(svc.can(auditor, Action.Delete, Resource.Audit)).toBe(false);
        });
    });

    // ── TeamMember ───────────────────────────────────────────
    describe('TeamMember role', () => {
        const member = mkUser(UserRole.TeamMember);

        it('can read projects but not create', () => {
            expect(svc.can(member, Action.Read, Resource.Project)).toBe(true);
            expect(svc.can(member, Action.Update, Resource.Project)).toBe(true);
            expect(svc.can(member, Action.Create, Resource.Project)).toBe(false);
        });

        it('can create documents', () => {
            expect(svc.can(member, Action.Create, Resource.Document)).toBe(true);
        });

        it('cannot assign or approve', () => {
            expect(svc.can(member, Action.Assign, Resource.Project)).toBe(false);
            expect(svc.can(member, Action.Approve, Resource.Project)).toBe(false);
        });
    });

    // ── Viewer ───────────────────────────────────────────────
    describe('Viewer role', () => {
        const viewer = mkUser(UserRole.Viewer);

        it('can only read', () => {
            const allResources = Object.values(Resource);
            for (const resource of allResources) {
                expect(svc.can(viewer, Action.Read, resource)).toBe(true);
                expect(svc.can(viewer, Action.Create, resource)).toBe(false);
                expect(svc.can(viewer, Action.Update, resource)).toBe(false);
                expect(svc.can(viewer, Action.Delete, resource)).toBe(false);
            }
        });

        it('isViewer() returns true', () => {
            expect(svc.isViewer(viewer)).toBe(true);
        });

        it('canModify() returns false', () => {
            expect(svc.canModify(viewer)).toBe(false);
        });
    });

    // ── Edge Cases ───────────────────────────────────────────
    describe('Edge cases', () => {
        it('returns false for null user', () => {
            expect(svc.can(null, Action.Read, Resource.Project)).toBe(false);
        });

        it('returns false for undefined user', () => {
            expect(svc.can(undefined, Action.Read, Resource.Project)).toBe(false);
        });

        it('returns false for inactive user', () => {
            const inactive = mkUser(UserRole.Admin, { isActive: false });
            expect(svc.can(inactive, Action.Read, Resource.Project)).toBe(false);
        });

        it('returns false for unknown role', () => {
            const unknown = mkUser('Villain');
            expect(svc.can(unknown, Action.Read, Resource.Project)).toBe(false);
        });

        it('getAllowedActions returns empty array for null user', () => {
            expect(svc.getAllowedActions(null, Resource.Project)).toEqual([]);
        });

        it('getRoleDescription returns string for all roles', () => {
            for (const role of Object.values(UserRole)) {
                const desc = svc.getRoleDescription(role);
                expect(typeof desc).toBe('string');
                expect(desc.length).toBeGreaterThan(0);
            }
        });

        it('canModify returns false for null user', () => {
            expect(svc.canModify(null)).toBe(false);
        });

        it('requirePermission throws PermissionError for denied action', () => {
            const viewer = mkUser(UserRole.Viewer);
            expect(() => svc.requirePermission(viewer, Action.Delete, Resource.Project))
                .toThrow();
        });

        it('requirePermission does not throw for allowed action', () => {
            const admin = mkUser(UserRole.Admin);
            expect(() => svc.requirePermission(admin, Action.Delete, Resource.Project))
                .not.toThrow();
        });
    });
});
