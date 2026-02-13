/**
 * Route Configuration
 * Maps NavigationState views to URL paths
 * Maintains backward compatibility with existing NavigationState system
 */

import { NavigationView, NavigationState } from "@/types";

export interface RouteConfig {
    path: string;
    view: NavigationView;
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
}

/**
 * Core route definitions
 * Each view from NavigationState gets a corresponding URL path
 */
export const routes: RouteConfig[] = [
    // Dashboard and Analytics
    { path: "/", view: "dashboard", requiresAuth: true },
    { path: "/dashboard", view: "dashboard", requiresAuth: true },
    { path: "/analytics", view: "analytics", requiresAuth: true },
    { path: "/quality-insights", view: "qualityInsights", requiresAuth: true },

    // Calendar and Planning
    { path: "/calendar", view: "calendar", requiresAuth: true },

    // Risk and Audit
    { path: "/risk", view: "riskHub", requiresAuth: true },
    { path: "/audit", view: "auditHub", requiresAuth: true, requiresAdmin: true },

    // Document Management
    { path: "/documents", view: "documentControl", requiresAuth: true },

    // Project Management
    { path: "/projects", view: "projects", requiresAuth: true },
    { path: "/projects/create", view: "createProject", requiresAuth: true },
    { path: "/projects/:projectId", view: "projectDetail", requiresAuth: true },
    { path: "/projects/:projectId/edit", view: "editProject", requiresAuth: true },

    // Standards
    { path: "/programs/:programId/standards", view: "standards", requiresAuth: true },

    // Tasks
    { path: "/tasks", view: "myTasks", requiresAuth: true },

    // Departments
    { path: "/departments", view: "departments", requiresAuth: true, requiresAdmin: true },
    { path: "/departments/:departmentId", view: "departmentDetail", requiresAuth: true, requiresAdmin: true },

    // Settings
    { path: "/settings", view: "settings", requiresAuth: true, requiresAdmin: true },
    { path: "/settings/:section", view: "settings", requiresAuth: true, requiresAdmin: true },

    // User Profile
    { path: "/users/:userId", view: "userProfile", requiresAuth: true },

    // Training
    { path: "/training", view: "trainingHub", requiresAuth: true },
    { path: "/training/:trainingId", view: "trainingDetail", requiresAuth: true },
    { path: "/certificates/:certificateId", view: "certificate", requiresAuth: true },

    // Survey
    { path: "/projects/:projectId/survey/:surveyId", view: "mockSurvey", requiresAuth: true },
    { path: "/surveys/:surveyId/report", view: "surveyReport", requiresAuth: true },

    // Data Hub
    { path: "/data", view: "dataHub", requiresAuth: true, requiresAdmin: true },

    // Messaging
    { path: "/messages", view: "messaging", requiresAuth: true },

    // AI Tools
    { path: "/ai-document-generator", view: "aiDocumentGenerator", requiresAuth: true },
];

/**
 * Convert NavigationState to URL path
 */
export const navigationStateToPath = (state: NavigationState): string => {
    switch (state.view) {
        case "dashboard":
            return "/dashboard";
        case "analytics":
            return "/analytics";
        case "qualityInsights":
            return "/quality-insights";
        case "calendar":
            return "/calendar";
        case "riskHub":
            return "/risk";
        case "auditHub":
            return "/audit";
        case "documentControl":
            return "/documents";
        case "projects":
            return "/projects";
        case "projectDetail":
            return state.projectId ? `/projects/${state.projectId}` : "/projects";
        case "createProject":
            return "/projects/create";
        case "editProject":
            return state.projectId ? `/projects/${state.projectId}/edit` : "/projects";
        case "standards":
            return state.programId ? `/programs/${state.programId}/standards` : "/dashboard";
        case "myTasks":
            return "/tasks";
        case "departments":
            return "/departments";
        case "departmentDetail":
            return state.departmentId ? `/departments/${state.departmentId}` : "/departments";
        case "settings":
            return state.section ? `/settings/${state.section}` : "/settings";
        case "userProfile":
            return state.userId ? `/users/${state.userId}` : "/dashboard";
        case "trainingHub":
            return "/training";
        case "trainingDetail":
            return state.trainingId ? `/training/${state.trainingId}` : "/training";
        case "certificate":
            return state.certificateId ? `/certificates/${state.certificateId}` : "/training";
        case "mockSurvey":
            return state.projectId && state.surveyId
                ? `/projects/${state.projectId}/survey/${state.surveyId}`
                : "/projects";
        case "surveyReport":
            return state.surveyId ? `/surveys/${state.surveyId}/report` : "/projects";
        case "dataHub":
            return "/data";
        case "messaging":
            return "/messages";
        case "aiDocumentGenerator":
            return "/ai-document-generator";
        default:
            return "/dashboard";
    }
};

/**
 * Convert URL path and params to NavigationState
 */
export const pathToNavigationState = (
    pathname: string,
    params: Record<string, string | undefined>
): NavigationState => {
    // Remove trailing slash
    const path = pathname.replace(/\/$/, "") || "/";

    // Match against route patterns
    if (path === "/" || path === "/dashboard") {
        return { view: "dashboard" };
    }

    if (path === "/analytics") {
        return { view: "analytics" };
    }

    if (path === "/quality-insights") {
        return { view: "qualityInsights" };
    }

    if (path === "/calendar") {
        return { view: "calendar" };
    }

    if (path === "/risk") {
        return { view: "riskHub" };
    }

    if (path === "/audit") {
        return { view: "auditHub" };
    }

    if (path === "/documents") {
        return { view: "documentControl" };
    }

    if (path === "/projects") {
        return { view: "projects" };
    }

    if (path === "/projects/create") {
        return { view: "createProject" };
    }

    if (params.projectId && path.includes("/edit")) {
        return { view: "editProject", projectId: params.projectId };
    }

    if (params.projectId && params.surveyId) {
        return { view: "mockSurvey", projectId: params.projectId, surveyId: params.surveyId };
    }

    if (params.projectId) {
        return { view: "projectDetail", projectId: params.projectId };
    }

    if (params.programId) {
        return { view: "standards", programId: params.programId };
    }

    if (path === "/tasks") {
        return { view: "myTasks" };
    }

    if (path === "/departments") {
        return { view: "departments" };
    }

    if (params.departmentId) {
        return { view: "departmentDetail", departmentId: params.departmentId };
    }

    if (params.section) {
        return { view: "settings", section: params.section as any };
    }

    if (path === "/settings") {
        return { view: "settings" };
    }

    if (params.userId) {
        return { view: "userProfile", userId: params.userId };
    }

    if (path === "/training") {
        return { view: "trainingHub" };
    }

    if (params.trainingId) {
        return { view: "trainingDetail", trainingId: params.trainingId };
    }

    if (params.certificateId) {
        return { view: "certificate", certificateId: params.certificateId };
    }

    if (params.surveyId && path.includes("/report")) {
        return { view: "surveyReport", surveyId: params.surveyId };
    }

    if (path === "/data") {
        return { view: "dataHub" };
    }

    if (path === "/messages") {
        return { view: "messaging" };
    }

    if (path === "/ai-document-generator") {
        return { view: "aiDocumentGenerator" };
    }

    // Default fallback
    return { view: "dashboard" };
};
