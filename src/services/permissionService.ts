/**
 * Centralized Permission Service
 * 
 * THE single source of truth for all RBAC decisions in AccreditEx.
 * Every permission check — UI visibility, store actions, Firestore operations —
 * MUST go through this service. No more scattered `=== 'Admin'` checks.
 * 
 * Architecture:
 *   1. Client-side gate:  permissionService.can(user, Action, Resource)
 *   2. Server-side guard: permissionService.ensureFirestoreReady() — verifies
 *      the user doc exists at users/{auth.uid} so Firestore rules can resolve.
 *   3. Firestore rules:   getUserRole() reads users/{auth.uid}.data.role
 * 
 * Usage:
 *   import { permissionService, Action, Resource } from '@/services/permissionService';
 *   
 *   // Check permission (client-side, synchronous)
 *   permissionService.can(user, Action.Create, Resource.Project)
 *   permissionService.can(user, Action.Delete, Resource.Document)
 *   
 *   // Guard before Firestore write (async, throws on failure)
 *   await permissionService.ensureFirestoreReady(Action.Delete, Resource.Document);
 *   
 *   // Check role
 *   permissionService.isAdmin(user)
 *   permissionService.canModify(user)
 */

import { UserRole, User } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db, getAuthInstance } from '@/firebase/firebaseConfig';

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

    // ═══════════════════════════════════════════════════════════
    // SERVER-SIDE GUARD: ensures Firestore can resolve user role
    // ═══════════════════════════════════════════════════════════

    /**
     * Throws if the client-side user lacks the required permission.
     * Call this as a fast-fail before any Firestore write.
     */
    requirePermission(user: UserLike | null | undefined, action: Action, resource: Resource): void {
        if (!user) {
            throw new PermissionError('Not authenticated. Please log in.', 'NOT_AUTHENTICATED');
        }
        if (user.isActive === false) {
            throw new PermissionError('Your account is deactivated.', 'ACCOUNT_INACTIVE');
        }
        if (!this.can(user, action, resource)) {
            throw new PermissionError(
                `Your role (${user.role}) does not have ${action} permission on ${resource}.`,
                'INSUFFICIENT_ROLE',
                { role: user.role, action, resource }
            );
        }
    }

    /**
     * Ensures the current Firebase Auth user has a Firestore document at
     * `users/{auth.uid}` with a valid role. If the doc is missing, attempts
     * to create it from the app-state user (auto-migration).
     * 
     * MUST be called before any Firestore write that requires role-based
     * security rules (delete, admin-only creates, etc.).
     * 
     * @returns The verified User with confirmed Firestore doc at users/{auth.uid}
     * @throws PermissionError with actionable message if verification fails
     */
    async ensureFirestoreReady(): Promise<User> {
        // 1. Check Firebase Auth
        const auth = getAuthInstance();
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            throw new PermissionError(
                'Not signed in to Firebase. Please log out and log in again.',
                'NOT_AUTHENTICATED'
            );
        }

        // 2. Dynamically import to avoid circular dependencies
        const { useUserStore } = await import('@/stores/useUserStore');
        const appUser = useUserStore.getState().currentUser;
        if (!appUser) {
            throw new PermissionError(
                'User session not found. Please refresh the page.',
                'NO_SESSION'
            );
        }

        const authUid = firebaseUser.uid;

        // 3. Check if user doc exists at users/{auth.uid}
        const uidDocRef = doc(db, 'users', authUid);
        const uidDocSnap = await getDoc(uidDocRef);

        if (uidDocSnap.exists()) {
            const docData = uidDocSnap.data();
            console.info('[RBAC Guard] User doc verified at users/' + authUid, {
                role: docData.role,
                email: docData.email,
            });

            // Sync store if ID mismatch (e.g., migration completed but store stale)
            if (appUser.id !== authUid) {
                const syncedUser = { ...docData, id: authUid } as User;
                useUserStore.getState().setCurrentUser(syncedUser);
                return syncedUser;
            }
            return appUser;
        }

        // 4. Doc missing — attempt auto-creation (self-repair)
        console.warn('[RBAC Guard] No user doc at users/' + authUid + '. Attempting auto-repair...');

        // 4a. If store user has a different ID, try migrating the legacy doc
        if (appUser.id !== authUid) {
            console.info('[RBAC Guard] Migrating legacy doc', appUser.id, '→', authUid);
            const { migrateUserDocToAuthUid } = await import('@/services/secureUserService');
            try {
                await migrateUserDocToAuthUid(appUser.id, authUid);
                // Verify migration succeeded
                const verifySnap = await getDoc(uidDocRef);
                if (verifySnap.exists()) {
                    const migratedUser = { ...verifySnap.data(), id: authUid } as User;
                    useUserStore.getState().setCurrentUser(migratedUser);
                    console.info('[RBAC Guard] Migration successful');
                    return migratedUser;
                }
            } catch (migError) {
                console.error('[RBAC Guard] Migration failed:', migError);
            }
        }

        // 4b. Last resort — create user doc from app state (self-heal)
        try {
            const { setDoc } = await import('firebase/firestore');
            const newDocData = {
                ...appUser,
                id: authUid,
                email: appUser.email || firebaseUser.email,
                _autoRepaired: true,
                _repairedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await setDoc(uidDocRef, newDocData);

            // Verify
            const finalSnap = await getDoc(uidDocRef);
            if (finalSnap.exists()) {
                const repairedUser = { ...finalSnap.data(), id: authUid } as User;
                useUserStore.getState().setCurrentUser(repairedUser);
                console.info('[RBAC Guard] Auto-repair successful — created users/' + authUid);
                return repairedUser;
            }
        } catch (repairError) {
            console.error('[RBAC Guard] Auto-repair failed:', repairError);
        }

        // 5. All attempts failed — give the user an actionable error
        throw new PermissionError(
            'Unable to verify your account permissions. Your user profile could not be found or created in the database. ' +
            'Please try logging out and logging back in. If the problem persists, contact your administrator.',
            'FIRESTORE_DOC_MISSING',
            { authUid, appUserId: appUser.id, appUserRole: appUser.role }
        );
    }

    /**
     * Full pre-flight check: client permission + Firestore doc verification.
     * Use this before ANY protected Firestore write operation.
     * 
     * @returns The verified User object
     * @throws PermissionError with clear, user-facing message
     */
    async guard(action: Action, resource: Resource): Promise<User> {
        // Dynamic import to avoid circular dependency
        const { useUserStore } = await import('@/stores/useUserStore');
        const appUser = useUserStore.getState().currentUser;

        // Client-side permission check (fast fail)
        this.requirePermission(appUser, action, resource);

        // Server-side doc readiness check
        return this.ensureFirestoreReady();
    }
}

/**
 * Structured error class for permission failures.
 * Provides both a user-facing message and a machine-readable code
 * so the UI can differentiate between "no permission" and "broken account".
 */
export class PermissionError extends Error {
    code: string;
    details?: Record<string, unknown>;

    constructor(message: string, code: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'PermissionError';
        this.code = code;
        this.details = details;
    }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Export class for testing
export { PermissionService };
