/**
 * usePermission Hook
 * 
 * React hook for permission-based UI rendering.
 * Uses the centralized PermissionService to check user capabilities.
 * 
 * Usage:
 *   const { canModify, isViewer, isAdmin, can } = usePermission();
 *   
 *   if (canModify) { ... }  // Hide edit buttons for Viewer
 *   if (can(Action.Delete, Resource.User)) { ... }  // Granular check
 */

import { useMemo } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { permissionService, Action, Resource } from '@/services/permissionService';

export function usePermission() {
    const currentUser = useUserStore((state) => state.currentUser);

    return useMemo(() => ({
        /** Whether user can modify any data (not a Viewer) */
        canModify: permissionService.canModify(currentUser),
        /** Whether user is Admin */
        isAdmin: permissionService.isAdmin(currentUser),
        /** Whether user is Viewer (read-only) */
        isViewer: permissionService.isViewer(currentUser),
        /** Whether user can access admin features */
        canAccessAdmin: permissionService.canAccessAdmin(currentUser),
        /** Whether user can manage other users */
        canManageUsers: permissionService.canManageUsers(currentUser),
        /** Whether user can configure settings */
        canConfigureSettings: permissionService.canConfigureSettings(currentUser),
        /** Granular check: can(Action, Resource) */
        can: (action: Action, resource: Resource) => permissionService.can(currentUser, action, resource),
        /** Get all allowed actions for a resource */
        getAllowedActions: (resource: Resource) => permissionService.getAllowedActions(currentUser, resource),
    }), [currentUser]);
}

// Re-export for convenience
export { Action, Resource } from '@/services/permissionService';
