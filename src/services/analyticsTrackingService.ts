/**
 * Analytics Tracking Service
 *
 * Centralized analytics event tracking using Firebase Analytics.
 * Provides typed helper methods for common application events.
 *
 * Usage:
 *   import { analytics } from "@/services/analyticsTrackingService";
 *   analytics.trackPageView("dashboard");
 *   analytics.trackFeatureUsed("ai_recommendations");
 */

import { getAnalytics, logEvent, isSupported, Analytics } from "firebase/analytics";
import { getApp } from "firebase/app";

// ── Singleton analytics instance ────────────────────────

let analyticsInstance: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

async function getAnalyticsInstance(): Promise<Analytics | null> {
    if (analyticsInstance) return analyticsInstance;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const supported = await isSupported();
            if (!supported) {
                console.warn("📊 Firebase Analytics not supported in this environment");
                return null;
            }
            analyticsInstance = getAnalytics(getApp());
            return analyticsInstance;
        } catch (err) {
            console.warn("📊 Failed to initialize Firebase Analytics:", err);
            return null;
        }
    })();

    return initPromise;
}

// ── Event types ─────────────────────────────────────────

type EventParams = Record<string, string | number | boolean | undefined>;

// ── Core tracking function ──────────────────────────────

async function trackEvent(eventName: string, params?: EventParams): Promise<void> {
    try {
        const instance = await getAnalyticsInstance();
        if (!instance) return;
        logEvent(instance, eventName, params);
    } catch {
        // Silently fail — analytics should never break the app
    }
}

// ── Public API ──────────────────────────────────────────

export const analytics = {
    /**
     * Track a page/view navigation
     */
    trackPageView(viewName: string, params?: EventParams) {
        trackEvent("page_view", { page_title: viewName, ...params });
    },

    /**
     * Track when a feature is used
     */
    trackFeatureUsed(featureName: string, params?: EventParams) {
        trackEvent("feature_used", { feature_name: featureName, ...params });
    },

    /**
     * Track user login
     */
    trackLogin(method: string = "email") {
        trackEvent("login", { method });
    },

    /**
     * Track document actions (create, edit, export, approve)
     */
    trackDocumentAction(
        action: "create" | "edit" | "export" | "approve" | "delete",
        docType?: string,
    ) {
        trackEvent("document_action", { action, doc_type: docType });
    },

    /**
     * Track project milestones
     */
    trackProjectAction(
        action: "create" | "update_status" | "assign" | "complete",
        projectId?: string,
    ) {
        trackEvent("project_action", { action, project_id: projectId });
    },

    /**
     * Track AI agent interactions
     */
    trackAIInteraction(
        action: "chat" | "compliance_check" | "risk_assessment" | "training_recommendations",
        success: boolean = true,
    ) {
        trackEvent("ai_interaction", { action, success });
    },

    /**
     * Track training/learning path events
     */
    trackTrainingEvent(
        action: "enroll" | "complete_step" | "complete_path" | "view_certificate",
        pathId?: string,
    ) {
        trackEvent("training_event", { action, path_id: pathId });
    },

    /**
     * Track search actions
     */
    trackSearch(query: string, resultCount?: number) {
        trackEvent("search", {
            search_term: query.slice(0, 100),
            result_count: resultCount,
        });
    },

    /**
     * Track errors for observability
     */
    trackError(errorType: string, errorMessage?: string) {
        trackEvent("app_error", {
            error_type: errorType,
            error_message: errorMessage?.slice(0, 200),
        });
    },

    /**
     * Generic event for anything not covered
     */
    track: trackEvent,
};
