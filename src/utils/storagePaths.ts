/**
 * Storage Paths Helper — AccreditEx
 *
 * Centralises Firebase Storage path construction with tenant isolation.
 * All new uploads MUST use the tenant-isolated paths returned by these
 * helpers (prefixed with /{orgId}/) so the storage rules enforce data
 * isolation between organisations.
 *
 * Legacy flat paths (without orgId) are still readable for backward
 * compatibility, but no new writes should target them.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StorageCategory = 'programs' | 'standards' | 'users' | 'projects';

export interface StoragePathOptions {
    /** Organisation ID (required for tenant-isolated paths). */
    orgId: string;
    /** Category of the asset — maps to storage rule match paths. */
    category: StorageCategory;
    /** Resource-specific identifier (programId, standardId, userId, projectId). */
    resourceId: string;
    /** Original filename — will be prefixed with a timestamp to avoid collisions. */
    fileName: string;
}

export interface ReportPathOptions {
    orgId: string;
    projectId: string;
    fileName: string;
}

// ---------------------------------------------------------------------------
// Path builders
// ---------------------------------------------------------------------------

/**
 * Build a tenant-isolated document storage path.
 *
 * Output format: `documents/{orgId}/{category}/{resourceId}/{timestamp}-{fileName}`
 *
 * @example
 * ```ts
 * buildDocumentPath({
 *   orgId: 'org_123',
 *   category: 'projects',
 *   resourceId: 'proj_456',
 *   fileName: 'report.pdf',
 * });
 * // => "documents/org_123/projects/proj_456/1719500000000-report.pdf"
 * ```
 */
export function buildDocumentPath(opts: StoragePathOptions): string {
    validateRequiredFields(opts.orgId, opts.category, opts.resourceId, opts.fileName);
    const safeName = sanitiseFileName(opts.fileName);
    return `documents/${opts.orgId}/${opts.category}/${opts.resourceId}/${Date.now()}-${safeName}`;
}

/**
 * Build a tenant-isolated report storage path.
 *
 * Output format: `reports/{orgId}/{projectId}/{timestamp}-{fileName}`
 */
export function buildReportPath(opts: ReportPathOptions): string {
    validateRequiredFields(opts.orgId, opts.projectId, opts.fileName);
    const safeName = sanitiseFileName(opts.fileName);
    return `reports/${opts.orgId}/${opts.projectId}/${Date.now()}-${safeName}`;
}

/**
 * Build a legacy (non-tenant-isolated) document path.
 *
 * **Prefer `buildDocumentPath` for all new uploads.**
 * This helper exists only for reading files stored before the migration.
 *
 * Output format: `documents/{category}/{resourceId}/{fileName}`
 */
export function buildLegacyDocumentPath(
    category: StorageCategory,
    resourceId: string,
    fileName: string,
): string {
    return `documents/${category}/${resourceId}/${fileName}`;
}

// ---------------------------------------------------------------------------
// Migration helper
// ---------------------------------------------------------------------------

export interface MigrationMapping {
    legacyPath: string;
    tenantPath: string;
}

/**
 * Given a legacy storage path, derive the equivalent tenant-isolated path.
 *
 * Supports documents and reports:
 * - `documents/{category}/{resourceId}/{file}` → `documents/{orgId}/{category}/{resourceId}/{file}`
 * - `reports/{projectId}/{file}` → `reports/{orgId}/{projectId}/{file}`
 *
 * @returns The tenant-isolated path, or `null` if the pattern is unrecognised.
 */
export function mapLegacyPathToTenant(
    legacyPath: string,
    orgId: string,
): string | null {
    if (!orgId) return null;

    // documents/{category}/{resourceId}/{file...}
    const docMatch = legacyPath.match(
        /^documents\/(programs|standards|users|projects)\/([^/]+)\/(.+)$/,
    );
    if (docMatch) {
        const [, category, resourceId, file] = docMatch;
        return `documents/${orgId}/${category}/${resourceId}/${file}`;
    }

    // reports/{projectId}/{file...}
    const reportMatch = legacyPath.match(/^reports\/([^/]+)\/(.+)$/);
    if (reportMatch) {
        const [, projectId, file] = reportMatch;
        return `reports/${orgId}/${projectId}/${file}`;
    }

    return null;
}

/**
 * Generate a list of migration mappings for a batch of legacy paths.
 *
 * Usage with Firebase Admin SDK (server-side script):
 * ```ts
 * const mappings = buildMigrationPlan(legacyPaths, 'org_123');
 * for (const m of mappings) {
 *   await bucket.file(m.legacyPath).copy(bucket.file(m.tenantPath));
 * }
 * ```
 */
export function buildMigrationPlan(
    legacyPaths: string[],
    orgId: string,
): MigrationMapping[] {
    return legacyPaths
        .map((lp) => ({
            legacyPath: lp,
            tenantPath: mapLegacyPathToTenant(lp, orgId),
        }))
        .filter((m): m is MigrationMapping => m.tenantPath !== null);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function validateRequiredFields(...fields: string[]): void {
    for (const f of fields) {
        if (!f || f.trim().length === 0) {
            throw new Error('Storage path: all fields (orgId, category, resourceId, fileName) are required');
        }
    }
}

/**
 * Remove characters that are problematic in Firebase Storage paths.
 * Keeps alphanumeric, dashes, underscores, dots, and spaces.
 */
function sanitiseFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._\- ]/g, '_');
}
