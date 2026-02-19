/**
 * Route Prefetching Service
 *
 * Maps navigation views to their lazy-loaded chunk imports.
 * Called on hover/pointer-enter over navigation items to preload
 * the target page's JavaScript bundle before the user clicks.
 *
 * Each import is called at most once — subsequent calls are no-ops
 * because the browser caches the resolved module.
 */

import { NavigationView } from "@/types";

// ── Prefetch map: NavigationView → dynamic import ────────
const PREFETCH_MAP: Partial<Record<NavigationView, () => Promise<unknown>>> = {
    dashboard: () => import("@/pages/DashboardPage"),
    analyticsHub: () => import("@/pages/AnalyticsHubPage"),
    projects: () => import("@/pages/ProjectListPage"),
    projectDetail: () => import("@/pages/ProjectDetailPage"),
    createProject: () => import("@/pages/CreateProjectPage"),
    standards: () => import("@/pages/StandardsPage"),
    calendar: () => import("@/pages/CalendarPage"),
    riskHub: () => import("@/pages/RiskHubPage"),
    auditHub: () => import("@/pages/AuditHubPage"),
    documentControl: () => import("@/pages/DocumentControlHubPage"),
    departments: () => import("@/pages/DepartmentsPage"),
    departmentDetail: () => import("@/pages/DepartmentDetailPage"),
    settings: () => import("@/components/settings/SettingsLayout"),
    trainingHub: () => import("@/pages/TrainingHubPage"),
    dataHub: () => import("@/pages/DataHubPage"),
    messaging: () => import("@/pages/MessagingPage"),
    accreditationHub: () => import("@/pages/AccreditationHubPage"),
    knowledgeBase: () => import("@/pages/KnowledgeBasePage"),
    labOperations: () => import("@/pages/LabOperationsPage"),
    surveyReport: () => import("@/pages/SurveyReportPage"),
};

// Track which views have already been prefetched
const prefetchedViews = new Set<NavigationView>();

/**
 * Prefetch the JavaScript chunk for a given navigation view.
 * Safe to call multiple times — only triggers one fetch per view.
 * Uses requestIdleCallback when available for non-blocking prefetch.
 */
export function prefetchRoute(view: NavigationView): void {
    if (prefetchedViews.has(view)) return;

    const loader = PREFETCH_MAP[view];
    if (!loader) return;

    prefetchedViews.add(view);

    const doPrefetch = () => {
        loader().catch(() => {
            // If prefetch fails, allow retry
            prefetchedViews.delete(view);
        });
    };

    if ("requestIdleCallback" in window) {
        (window as Window).requestIdleCallback(doPrefetch, { timeout: 3000 });
    } else {
        // Fallback for Safari
        setTimeout(doPrefetch, 100);
    }
}
