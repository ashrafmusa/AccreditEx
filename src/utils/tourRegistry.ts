/**
 * Tour Registry & Manager
 * 
 * Centralized system for managing all tours across AccrediTex
 * - No duplication — all tours defined in one place
 * - Easy to add/remove tours
 * - Auto-triggering based on user role & program
 * - Tour categories: onboarding, feature-specific, role-specific, program-specific
 * - Completion tracking & analytics
 */

import { TourStep } from '@/components/onboarding/GuidedTour';

export type TourCategory = 'onboarding' | 'feature' | 'role-specific' | 'program-specific';
export type TourTrigger = 'manual' | 'first-login' | 'program-selected' | 'always';
export type AccreditationProgram = 'cbahi' | 'ashk' | 'jci' | 'other';

export interface TourConfig {
    /** Unique tour identifier */
    id: string;
    /** User-friendly tour name */
    name: string;
    /** Tour category for organization */
    category: TourCategory;
    /** When to auto-show this tour */
    trigger: TourTrigger;
    /** Roles that can see this tour (empty = all roles) */
    roles?: string[];
    /** Programs this tour is specific to (empty = all programs) */
    programs?: AccreditationProgram[];
    /** Tour steps */
    steps: TourStep[];
    /** Optional: completion reward (badge name) */
    completionBadge?: string;
    /** Optional: estimated duration in seconds */
    estimatedDuration?: number;
    /** Optional: description/subtitle */
    description?: string;
}

/**
 * Tour Registry — single source of truth for all tours
 * Prevents duplication by centralizing definitions
 */
export const TOUR_REGISTRY: Record<string, TourConfig> = {
    // ── ONBOARDING TOURS ──────────────────────────────────────

    'new-user-main': {
        id: 'new-user-main',
        name: 'Main Navigation Tour',
        category: 'onboarding',
        trigger: 'first-login',
        description: 'Learn your way around AccrediTex',
        estimatedDuration: 120,
        steps: [
            {
                target: '#nav-item-dashboard',
                titleKey: 'tourDashboardTitle',
                descriptionKey: 'tourDashboardDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-projects',
                titleKey: 'tourProjectsTitle',
                descriptionKey: 'tourProjectsDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-accreditationHub',
                titleKey: 'tourAccreditationTitle',
                descriptionKey: 'tourAccreditationDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-documentControl',
                titleKey: 'tourDocumentsTitle',
                descriptionKey: 'tourDocumentsDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-trainingHub',
                titleKey: 'tourTrainingTitle',
                descriptionKey: 'tourTrainingDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-analyticsHub',
                titleKey: 'tourAnalyticsTitle',
                descriptionKey: 'tourAnalyticsDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-settings',
                titleKey: 'tourSettingsTitle',
                descriptionKey: 'tourSettingsDesc',
                placement: 'right',
            },
        ],
    },

    // ── ROLE-SPECIFIC TOURS ──────────────────────────────────

    'quality-manager': {
        id: 'quality-manager',
        name: 'Quality Manager Features',
        category: 'role-specific',
        trigger: 'first-login',
        roles: ['quality_manager', 'auditor'],
        description: 'Explore audit, risk, and compliance tools',
        estimatedDuration: 90,
        completionBadge: 'quality-manager-trained',
        steps: [
            {
                target: '#nav-item-auditHub',
                titleKey: 'tourAuditHubTitle',
                descriptionKey: 'tourAuditHubDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-riskHub',
                titleKey: 'tourRiskHubTitle',
                descriptionKey: 'tourRiskHubDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-dataHub',
                titleKey: 'tourDataHubTitle',
                descriptionKey: 'tourDataHubDesc',
                placement: 'right',
            },
            {
                target: '#nav-item-knowledgeBase',
                titleKey: 'tourKnowledgeBaseTitle',
                descriptionKey: 'tourKnowledgeBaseDesc',
                placement: 'right',
            },
        ],
    },

    // ── PROGRAM-SPECIFIC TOURS ──────────────────────────────

    'cbahi-intro': {
        id: 'cbahi-intro',
        name: 'CBAHI Accreditation Guide',
        category: 'program-specific',
        trigger: 'program-selected',
        programs: ['cbahi'],
        description: 'Learn CBAHI-specific standards and requirements',
        estimatedDuration: 150,
        completionBadge: 'cbahi-certified',
        steps: [
            {
                target: '#nav-item-accreditationHub',
                titleKey: 'tourAccreditationTitle',
                descriptionKey: 'tourAccreditationDesc',
                placement: 'right',
            },
        ],
    },

    'ashk-intro': {
        id: 'ashk-intro',
        name: 'ASHK Accreditation Guide',
        category: 'program-specific',
        trigger: 'program-selected',
        programs: ['ashk'],
        description: 'Learn ASHK-specific standards and requirements',
        estimatedDuration: 150,
        completionBadge: 'ashk-certified',
        steps: [
            {
                target: '#nav-item-accreditationHub',
                titleKey: 'tourAccreditationTitle',
                descriptionKey: 'tourAccreditationDesc',
                placement: 'right',
            },
        ],
    },

    'jci-intro': {
        id: 'jci-intro',
        name: 'JCI Accreditation Guide',
        category: 'program-specific',
        trigger: 'program-selected',
        programs: ['jci'],
        description: 'Learn JCI standards and requirements',
        estimatedDuration: 150,
        completionBadge: 'jci-certified',
        steps: [
            {
                target: '#nav-item-accreditationHub',
                titleKey: 'tourAccreditationTitle',
                descriptionKey: 'tourAccreditationDesc',
                placement: 'right',
            },
        ],
    },

    // ── FEATURE-SPECIFIC TOURS ─────────────────────────────

    'ai-briefing': {
        id: 'ai-briefing',
        name: 'AI Daily Briefing',
        category: 'feature',
        trigger: 'manual',
        description: 'Get the most from your AI assistant',
        estimatedDuration: 45,
        steps: [
            {
                target: '#ai-daily-briefing-widget',
                titleKey: 'tourAIDailyBriefingTitle',
                descriptionKey: 'tourAIDailyBriefingDesc',
                placement: 'top',
            },
        ],
    },

    'document-editor': {
        id: 'document-editor',
        name: 'Document Editor Features',
        category: 'feature',
        trigger: 'manual',
        description: 'Master document creation and editing',
        estimatedDuration: 60,
        steps: [
            {
                target: '#nav-item-documentControl',
                titleKey: 'tourDocumentsTitle',
                descriptionKey: 'tourDocumentsDesc',
                placement: 'right',
            },
        ],
    },
};

/**
 * Get tours by criteria
 */
export const getToursByCategory = (category: TourCategory): TourConfig[] => {
    return Object.values(TOUR_REGISTRY).filter((tour) => tour.category === category);
};

export const getToursByTrigger = (trigger: TourTrigger): TourConfig[] => {
    return Object.values(TOUR_REGISTRY).filter((tour) => tour.trigger === trigger);
};

export const getToursByRole = (role: string): TourConfig[] => {
    return Object.values(TOUR_REGISTRY).filter(
        (tour) => !tour.roles || tour.roles.includes(role)
    );
};

export const getToursByProgram = (program: AccreditationProgram): TourConfig[] => {
    return Object.values(TOUR_REGISTRY).filter(
        (tour) => !tour.programs || tour.programs.includes(program)
    );
};

export const getTourById = (id: string): TourConfig | undefined => {
    return TOUR_REGISTRY[id];
};

/**
 * Get applicable tours for a user
 */
export const getApplicableTours = (options: {
    role?: string;
    program?: AccreditationProgram;
    trigger?: TourTrigger;
    excludeCompleted?: boolean;
    completedTours?: string[];
}): TourConfig[] => {
    let tours = Object.values(TOUR_REGISTRY);

    if (options.role) {
        tours = tours.filter((tour) => !tour.roles || tour.roles.includes(options.role!));
    }

    if (options.program) {
        tours = tours.filter((tour) => !tour.programs || tour.programs.includes(options.program!));
    }

    if (options.trigger) {
        tours = tours.filter((tour) => tour.trigger === options.trigger);
    }

    if (options.excludeCompleted && options.completedTours) {
        tours = tours.filter((tour) => !options.completedTours!.includes(tour.id));
    }

    return tours;
};
