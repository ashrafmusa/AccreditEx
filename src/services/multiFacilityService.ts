/**
 * Multi-Facility Analytics Service
 *
 * Fetches branch-level compliance snapshots for cross-facility reporting.
 * Works with the existing Branch + Organization types and Firestore collections.
 */

import { db } from "@/firebase/firebaseConfig";
import type { Branch } from "@/types";
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
} from "firebase/firestore";

// ── Types ──────────────────────────────────────────────────────────────────

export interface FacilityMetrics {
    branchId: string;
    branchName: string;
    location: string;
    city?: string;
    activeProjects: number;
    totalChecklistItems: number;
    compliantItems: number;
    partialItems: number;
    nonCompliantItems: number;
    complianceRate: number; // 0-100
    openFindings: number;
    lastUpdated: string | null;
}

export interface OrganizationFacilityReport {
    organizationId: string;
    organizationName: string;
    branches: Branch[];
    facilityMetrics: FacilityMetrics[];
    averageCompliance: number;
    topPerformerName: string | null;
    needsAttentionName: string | null;
    totalOpenFindings: number;
    generatedAt: string;
}

// ── Service Functions ──────────────────────────────────────────────────────

/**
 * Fetch all branches for an organization.
 */
export async function getOrganizationBranches(orgId: string): Promise<Branch[]> {
    if (!orgId) return [];
    try {
        const branchesRef = collection(db, "branches");
        const q = query(
            branchesRef,
            where("organizationId", "==", orgId),
            where("isActive", "==", true),
            orderBy("name", "asc"),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Branch));
    } catch {
        return [];
    }
}

/**
 * Aggregate compliance metrics per branch from the projects collection.
 * Returns per-branch compliance rates computed from checklist items.
 */
export async function getFacilityMetrics(
    orgId: string,
    branches: Branch[],
): Promise<FacilityMetrics[]> {
    if (!orgId || branches.length === 0) return [];

    // Fetch all projects for this org
    let projectDocs: Array<{ branchId?: string; updatedAt?: string; status?: string; checklistItems?: Array<{ status: string }> }> = [];
    try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, where("organizationId", "==", orgId));
        const snap = await getDocs(q);
        projectDocs = snap.docs.map((d) => d.data() as typeof projectDocs[0]);
    } catch {
        projectDocs = [];
    }

    // Build metrics per branch
    return branches.map((branch) => {
        const branchProjects = projectDocs.filter(
            (p) => p.branchId === branch.id,
        );

        let total = 0;
        let compliant = 0;
        let partial = 0;
        let nonCompliant = 0;
        let openFindings = 0;
        let lastUpdated: string | null = null;

        for (const proj of branchProjects) {
            const items: Array<{ status: string }> = proj.checklistItems ?? [];
            total += items.length;
            compliant += items.filter((i) => i.status === "compliant").length;
            partial += items.filter((i) => i.status === "partiallyCompliant").length;
            nonCompliant += items.filter((i) => i.status === "nonCompliant").length;
            openFindings += items.filter(
                (i) => i.status === "nonCompliant" || i.status === "partiallyCompliant",
            ).length;

            if (proj.updatedAt) {
                if (!lastUpdated || proj.updatedAt > lastUpdated) {
                    lastUpdated = proj.updatedAt;
                }
            }
        }

        const complianceRate =
            total > 0 ? Math.round((compliant / total) * 100) : 0;

        return {
            branchId: branch.id,
            branchName: branch.name,
            location: branch.location ?? branch.city ?? "",
            city: branch.city,
            activeProjects: branchProjects.filter((p) => p.status !== "completed")
                .length,
            totalChecklistItems: total,
            compliantItems: compliant,
            partialItems: partial,
            nonCompliantItems: nonCompliant,
            complianceRate,
            openFindings,
            lastUpdated,
        };
    });
}

/**
 * Generate a full organization facility report.
 */
export async function getOrganizationFacilityReport(
    orgId: string,
    orgName: string,
): Promise<OrganizationFacilityReport> {
    const branches = await getOrganizationBranches(orgId);
    const facilityMetrics = await getFacilityMetrics(orgId, branches);

    const rates = facilityMetrics.map((m) => m.complianceRate);
    const averageCompliance =
        rates.length > 0
            ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
            : 0;

    const sorted = [...facilityMetrics].sort(
        (a, b) => b.complianceRate - a.complianceRate,
    );
    const topPerformerName = sorted[0]?.branchName ?? null;
    const needsAttentionName = sorted[sorted.length - 1]?.branchName ?? null;
    const totalOpenFindings = facilityMetrics.reduce(
        (s, m) => s + m.openFindings,
        0,
    );

    return {
        organizationId: orgId,
        organizationName: orgName,
        branches,
        facilityMetrics,
        averageCompliance,
        topPerformerName:
            facilityMetrics.length > 1 ? topPerformerName : null,
        needsAttentionName:
            facilityMetrics.length > 1 ? needsAttentionName : null,
        totalOpenFindings,
        generatedAt: new Date().toISOString(),
    };
}
