import { CustomRole, CustomPermission, UserRole } from '@/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'custom_roles';

// Default permissions for each resource
export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
    projects: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    users: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    settings: ['read', 'update', 'manage'],
    reports: ['create', 'read', 'export'],
    audits: ['create', 'read', 'update', 'manage'],
    documents: ['create', 'read', 'update', 'delete'],
    training: ['create', 'read', 'update', 'manage'],
    risks: ['create', 'read', 'update', 'delete'],
    capa: ['create', 'read', 'update', 'delete'],
    pdca: ['create', 'read', 'update', 'delete'],
};

export const createCustomRole = async (
    role: Omit<CustomRole, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>
): Promise<string> => {
    const roleData = {
        ...role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userCount: 0,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...roleData,
        createdAtTimestamp: Timestamp.now(),
    });

    return docRef.id;
};

export const getAllCustomRoles = async (): Promise<CustomRole[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as CustomRole[];
};

export const getActiveCustomRoles = async (): Promise<CustomRole[]> => {
    const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as CustomRole[];
};

export const getCustomRoleById = async (roleId: string): Promise<CustomRole | null> => {
    const allRoles = await getAllCustomRoles();
    return allRoles.find(r => r.id === roleId) || null;
};

export const updateCustomRole = async (
    roleId: string,
    updates: Partial<CustomRole>
): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, roleId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
};

export const deleteCustomRole = async (roleId: string): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, roleId);
    await deleteDoc(docRef);
};

export const checkPermission = (
    role: CustomRole,
    resource: string,
    action: string
): boolean => {
    const permission = role.permissions.find(
        p => p.resource === resource && p.action === action
    );
    return permission?.granted ?? false;
};

export const getDefaultPermissionsForRole = (baseRole: UserRole): CustomPermission[] => {
    const permissions: CustomPermission[] = [];

    Object.entries(DEFAULT_PERMISSIONS).forEach(([resource, actions]) => {
        actions.forEach(action => {
            let granted = false;

            // Define default permissions based on base role
            switch (baseRole) {
                case UserRole.Admin:
                    granted = true; // Admins have all permissions
                    break;
                case UserRole.ProjectLead:
                    granted = resource !== 'users' && resource !== 'settings' && action !== 'delete';
                    break;
                case UserRole.TeamMember:
                    granted = action === 'read' || (action === 'create' && ['projects', 'reports', 'documents'].includes(resource));
                    break;
                case UserRole.Auditor:
                    granted = action === 'read' || resource === 'audits';
                    break;
            }

            permissions.push({
                id: `${resource}-${action}`,
                resource,
                action: action as CustomPermission['action'],
                granted,
            });
        });
    });

    return permissions;
};

export const cloneRole = async (roleId: string, newName: string, createdBy: string): Promise<string> => {
    const originalRole = await getCustomRoleById(roleId);

    if (!originalRole) {
        throw new Error('Role not found');
    }

    return createCustomRole({
        name: newName,
        description: `Cloned from ${originalRole.name}`,
        baseRole: originalRole.baseRole,
        permissions: [...originalRole.permissions],
        createdBy,
        isActive: true,
    });
};

export const exportRole = (role: CustomRole): Blob => {
    const data = JSON.stringify(role, null, 2);
    return new Blob([data], { type: 'application/json' });
};

export const importRole = async (file: File, createdBy: string): Promise<string> => {
    const text = await file.text();
    const roleData = JSON.parse(text);

    return createCustomRole({
        name: roleData.name,
        description: roleData.description,
        baseRole: roleData.baseRole,
        permissions: roleData.permissions,
        createdBy,
        isActive: true,
    });
};
