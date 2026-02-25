/**
 * Tenant-Aware Query Helpers
 *
 * Wraps Firestore queries to automatically filter by organizationId
 * when multi-tenancy is active. Backward compatible: if organizationId
 * is empty (legacy single-tenant), queries run unfiltered.
 *
 * Usage in services:
 *   import { getTenantQuery, getTenantCollection } from '@/utils/tenantQuery';
 *   const q = getTenantQuery('projects', orderBy('createdAt', 'desc'));
 *   const snap = await getDocs(q);
 */

import {
    collection,
    query,
    where,
    QueryConstraint,
    CollectionReference,
    Query,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useTenantStore } from '@/stores/useTenantStore';

/**
 * Get a Firestore query scoped to the current organization.
 * If no organization is active, returns an unfiltered query (backward compat).
 *
 * @param collectionName - Firestore collection name
 * @param constraints    - Additional query constraints (where, orderBy, limit, etc.)
 */
export function getTenantQuery(
    collectionName: string,
    ...constraints: QueryConstraint[]
): Query {
    const orgId = useTenantStore.getState().organizationId;
    const colRef = collection(db, collectionName);

    if (orgId) {
        // Multi-tenant mode: prepend organizationId filter
        return query(colRef, where('organizationId', '==', orgId), ...constraints);
    }

    // Legacy single-tenant: no org filter
    if (constraints.length > 0) {
        return query(colRef, ...constraints);
    }
    return query(colRef);
}

/**
 * Get the current organizationId to stamp on new documents.
 * Returns undefined in single-tenant mode (field simply won't be set).
 */
export function getTenantStamp(): { organizationId?: string } {
    const orgId = useTenantStore.getState().organizationId;
    return orgId ? { organizationId: orgId } : {};
}

/**
 * Get collection reference (no filtering — use when you need the raw ref
 * for addDoc, doc(), etc.).
 */
export function getTenantCollection(collectionName: string): CollectionReference {
    return collection(db, collectionName);
}
