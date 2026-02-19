/**
 * Centralized Permission Service
 * 
 * Replaces scattered isAdmin checks with a unified permission model.
 * Provides role-based access control (RBAC) with action-resource granularity.
 * 
 * Usage:
 *   import { permissionService, Action, Resource } from '@/services/permissionService';
 *   
 *   // Check permission
 *   permissionService.can(user, Action.Create, Resource.Project)
 *   permissionService.can(user, Action.Delete, Resource.User)
 *   
 *   // Check role
 *   permissionService.isAdmin(user)
 *   permissionService.isViewer(user)
 *   permissionService.canModify(user) // any role except Viewer
 */

import { UserRole } from '@/types';

// ── Actions ────────────────────────────────────────────────

export const Action = {
    Create: 'create',
    Read: 'read',
    Update: 'update',
    Delete: 'delete',
    Export: 'export',
    Assign: 'assign',
    Approve: 'approve',
    Configure: 'configure',
} as const;
export type Action = (typeof Action)[keyof typeof Action];

// ── Resources ──────────────────────────────────────────────

export const Resource = {
    Project: 'project',
    User: 'user',
    Document: 'document',
    Standard: 'standard',
    Program: 'program',
    Department: 'department',
    Training: 'training',
    Risk: 'risk',
    Audit: 'audit',
    CAPA: 'capa',
    Settings: 'settings',
    Report: 'report',
    Survey: 'survey',
    KnowledgeBase: 'knowledgeBase',
    LabOperations: 'labOperations',
    LIMSIntegration: 'limsIntegration',
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];

// ── Permission Matrix ──────────────────────────────────────

interface UserLike {
    role: UserRole;
    id?: string;
    isActive?: boolean;
}

/**
 * Permission matrix defining what each role can do.
 * 
 * Admin: Full access to everything
 * ProjectLead: Can manage projects, assign tasks, approve, export
 * Auditor: Can read everything, create/update audits and risks, export
 * TeamMember: Can read, create/update assigned resources
 * Viewer: Read-only access to all resources
 */
const PERMISSION_MATRIX: Record<string, Record<string, Action[]>> = {
    [UserRole.Admin]: {
        // Admin can do everything on every resource
        _default: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export, Action.Assign, Action.Approve, Action.Configure],
    },
    [UserRole.ProjectLead]: {
        _default: [Action.Create, Action.Read, Action.Update, Action.Export, Action.Assign, Action.Approve],
        [Resource.User]: [Action.Read],
        [Resource.Settings]: [Action.Read],
        [Resource.Department]: [Action.Read],
    },
    [UserRole.Auditor]: {
        _default: [Action.Read, Action.Export],
        [Resource.Audit]: [Action.Create, Action.Read, Action.Update, Action.Export],
        [Resource.Risk]: [Action.Create, Action.Read, Action.Update, Action.Export],
        [Resource.CAPA]: [Action.Create, Action.Read, Action.Update, Action.Export],
        [Resource.Survey]: [Action.Create, Action.Read, Action.Update, Action.Export],
    },
    [UserRole.TeamMember]: {
        _default: [Action.Read],
        [Resource.Project]: [Action.Read, Action.Update],
        [Resource.Document]: [Action.Create, Action.Read, Action.Update],
        [Resource.Training]: [Action.Read, Action.Update],
        [Resource.Risk]: [Action.Read, Action.Update],
        [Resource.CAPA]: [Action.Read, Action.Update],
        [Resource.Report]: [Action.Read, Action.Export],
    },
    [UserRole.Viewer]: {
        _default: [Action.Read],
    },
};

// ── Permission Service ─────────────────────────────────────

class PermissionService {
    /**
     * Check if a user can perform an action on a resource
     */
    can(user: UserLike | null | undefined, action: Action, resource: Resource): boolean {
        if (!user || !user.role) return false;
        if (user.isActive === false) return false;

        const rolePermissions = PERMISSION_MATRIX[user.role];
        if (!rolePermissions) return false;

        // Check resource-specific permissions first, then fallback to _default
        const allowedActions = rolePermissions[resource] ?? rolePermissions._default ?? [];
        return allowedActions.includes(action);
    }

    /**
     * Check if user has Admin role
     */
    isAdmin(user: UserLike | null | undefined): boolean {
        return user?.role === UserRole.Admin;
    }

    /**
     * Check if user has Viewer role (read-only)
     */
    isViewer(user: UserLike | null | undefined): boolean {
        return user?.role === UserRole.Viewer;
    }

    /**
     * Check if user can modify data (any role except Viewer)
     */
    canModify(user: UserLike | null | undefined): boolean {
        if (!user || !user.role) return false;
        if (user.isActive === false) return false;
        return user.role !== UserRole.Viewer;
    }

    /**
     * Check if user can access admin-only features
     */
    canAccessAdmin(user: UserLike | null | undefined): boolean {
        return this.isAdmin(user);
    }

    /**
     * Check if user can manage other users
     */
    canManageUsers(user: UserLike | null | undefined): boolean {
        return this.can(user, Action.Create, Resource.User);
    }

    /**
     * Check if user can configure system settings
     */
    canConfigureSettings(user: UserLike | null | undefined): boolean {
        return this.can(user, Action.Configure, Resource.Settings);
    }

    /**
     * Get all allowed actions for a user on a resource
     */
    getAllowedActions(user: UserLike | null | undefined, resource: Resource): Action[] {
        if (!user || !user.role) return [];
        if (user.isActive === false) return [];

        const rolePermissions = PERMISSION_MATRIX[user.role];
        if (!rolePermissions) return [];

        return rolePermissions[resource] ?? rolePermissions._default ?? [];
    }

    /**
     * Get a human-readable description of the user's role capabilities
     */
    getRoleDescription(role: UserRole): string {
        switch (role) {
            case UserRole.Admin:
                return 'Full access — can manage all system resources, users, and settings';
            case UserRole.ProjectLead:
                return 'Can manage projects, assign tasks, approve work, and export reports';
            case UserRole.Auditor:
                return 'Can read all data, manage audits/risks/CAPAs, and export reports';
            case UserRole.TeamMember:
                return 'Can read data, update assigned projects/documents/tasks';
            case UserRole.Viewer:
                return 'Read-only access — can view all data but cannot make changes';
            default:
                return 'Unknown role';
        }
    }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Export class for testing
export { PermissionService };
