/**
 * Tour Step Definitions for GuidedTour
 * 
 * Each tour targets real DOM elements using CSS selectors.
 * The nav items all have IDs like #nav-item-dashboard, #nav-item-projects, etc.
 * 
 * Tours:
 * 1. "new-user" — First-time user orientation after onboarding wizard
 * 2. "quality-manager" — QM-specific features tour
 */

import { TourStep } from '@/components/onboarding/GuidedTour';

/**
 * New User Tour — shown after initial onboarding wizard completion
 * Walks through the main navigation and key features
 */
export const newUserTourSteps: TourStep[] = [
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
];

/**
 * Quality Manager Tour — highlights audit, risk, and compliance features
 * Shown when a Quality Manager role user first logs in
 */
export const qualityManagerTourSteps: TourStep[] = [
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
];
