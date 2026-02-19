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
    { path: "/analytics", view: "analyticsHub", requiresAuth: true },

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

    // Tasks (redirects to dashboard)
    { path: "/tasks", view: "dashboard", requiresAuth: true },

    // Departments
    { path: "/departments", view: "departments", requiresAuth: true, requiresAdmin: true },
    { path: "/departments/:departmentId", view: "departmentDetail", requiresAuth: true, requiresAdmin: true },

    // Settings (accessible to all authenticated users)
    { path: "/settings", view: "settings", requiresAuth: true },
    { path: "/settings/:section", view: "settings", requiresAuth: true },

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

    // Accreditation (promoted from settings)
    { path: "/accreditation", view: "accreditationHub", requiresAuth: true },

    // Knowledge Base
    { path: "/knowledge-base", view: "knowledgeBase", requiresAuth: true },

    // Lab Operations
    { path: "/lab-operations", view: "labOperations", requiresAuth: true },

    // Redirect legacy standalone routes to parent hubs
    { path: "/performance", view: "trainingHub", requiresAuth: true },
    { path: "/quality-rounding", view: "auditHub", requiresAuth: true },
    { path: "/quality-insights", view: "analyticsHub", requiresAuth: true },
    { path: "/reports", view: "analyticsHub", requiresAuth: true },
    { path: "/competencies", view: "trainingHub", requiresAuth: true },
    { path: "/ai-document-generator", view: "documentControl", requiresAuth: true },
];

/**
 * Convert NavigationState to URL path
 */
export const navigationStateToPath = (state: NavigationState): string => {
    switch (state.view) {
        case "dashboard":
            return "/dashboard";
        case "analyticsHub":
            return "/analytics";
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
        case "accreditationHub":
            return "/accreditation";
        case "knowledgeBase":
            return "/knowledge-base";
        case "labOperations":
            return "/lab-operations";
        default:
            return "/dashboard";
    }
};

/**
 * Convert URL path and params to NavigationState
 */
export const pathToNavigationState = (
    pathname: string,
    _params: Record<string, string | undefined>
): NavigationState => {
    // Remove trailing slash
    const path = pathname.replace(/\/$/, "") || "/";
    // Split path into segments for dynamic matching
    const segments = path.split("/").filter(Boolean);

    // Static routes (exact match)
    if (path === "/" || path === "/dashboard") return { view: "dashboard" };
    if (path === "/analytics") return { view: "analyticsHub" };
    if (path === "/calendar") return { view: "calendar" };
    if (path === "/risk") return { view: "riskHub" };
    if (path === "/audit") return { view: "auditHub" };
    if (path === "/documents") return { view: "documentControl" };
    if (path === "/tasks") return { view: "dashboard" };
    if (path === "/departments") return { view: "departments" };
    if (path === "/settings") return { view: "settings" };
    if (path === "/training") return { view: "trainingHub" };
    if (path === "/data") return { view: "dataHub" };
    if (path === "/messages") return { view: "messaging" };
    if (path === "/accreditation") return { view: "accreditationHub" };
    if (path === "/knowledge-base") return { view: "knowledgeBase" };
    if (path === "/lab-operations") return { view: "labOperations" };
    if (path === "/quality-insights") return { view: "analyticsHub" };
    if (path === "/reports") return { view: "analyticsHub" };
    if (path === "/competencies") return { view: "trainingHub" };
    if (path === "/ai-document-generator") return { view: "documentControl" };
    if (path === "/performance") return { view: "trainingHub" };
    if (path === "/quality-rounding") return { view: "auditHub" };
    if (path === "/projects") return { view: "projects" };
    if (path === "/projects/create") return { view: "createProject" };

    // Dynamic routes - parse segments from URL path directly
    // (useParams() is always empty because AppRouter uses catch-all /* route)

    // /settings/:section
    if (segments[0] === "settings" && segments[1]) {
        return { view: "settings", section: segments[1] as any };
    }

    // /departments/:departmentId
    if (segments[0] === "departments" && segments[1]) {
        return { view: "departmentDetail", departmentId: segments[1] };
    }

    // /projects/:projectId/survey/:surveyId
    if (segments[0] === "projects" && segments[2] === "survey" && segments[3]) {
        return { view: "mockSurvey", projectId: segments[1], surveyId: segments[3] };
    }

    // /projects/:projectId/edit
    if (segments[0] === "projects" && segments[2] === "edit") {
        return { view: "editProject", projectId: segments[1] };
    }

    // /projects/:projectId
    if (segments[0] === "projects" && segments[1]) {
        return { view: "projectDetail", projectId: segments[1] };
    }

    // /programs/:programId/standards
    if (segments[0] === "programs" && segments[2] === "standards") {
        return { view: "standards", programId: segments[1] };
    }

    // /users/:userId
    if (segments[0] === "users" && segments[1]) {
        return { view: "userProfile", userId: segments[1] };
    }

    // /training/:trainingId
    if (segments[0] === "training" && segments[1]) {
        return { view: "trainingDetail", trainingId: segments[1] };
    }

    // /certificates/:certificateId
    if (segments[0] === "certificates" && segments[1]) {
        return { view: "certificate", certificateId: segments[1] };
    }

    // /surveys/:surveyId/report
    if (segments[0] === "surveys" && segments[2] === "report") {
        return { view: "surveyReport", surveyId: segments[1] };
    }

    // Default fallback
    return { view: "dashboard" };
};
