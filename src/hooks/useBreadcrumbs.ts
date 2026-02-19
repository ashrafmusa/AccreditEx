/**
 * useBreadcrumbs Hook
 * 
 * Generates breadcrumb items from the current NavigationState.
 * Used by the Layout component to display contextual navigation breadcrumbs.
 */

import { useMemo } from 'react';
import { NavigationState, NavigationView } from '@/types';
import { BreadcrumbItem } from '@/components/common/Breadcrumbs';

// ── Breadcrumb label mapping ─────────────────────────────

const VIEW_LABELS: Partial<Record<NavigationView, string>> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    projectDetail: 'Project Detail',
    createProject: 'New Project',
    editProject: 'Edit Project',
    standards: 'Standards',
    documentControl: 'Documents',
    trainingHub: 'Training',
    trainingDetail: 'Training Detail',
    riskHub: 'Risk Management',
    auditHub: 'Audit',
    analyticsHub: 'Analytics',
    departments: 'Departments',
    departmentDetail: 'Department Detail',
    settings: 'Settings',
    userProfile: 'User Profile',
    calendar: 'Calendar',
    messaging: 'Messages',
    accreditationHub: 'Accreditation',
    knowledgeBase: 'Knowledge Base',
    labOperations: 'Lab Operations',
    dataHub: 'Data Hub',
    mockSurvey: 'Mock Survey',
    surveyReport: 'Survey Report',
    certificate: 'Certificate',
};

// ── Parent view mapping (for generating breadcrumb trails) ──

const PARENT_VIEW: Partial<Record<NavigationView, NavigationView>> = {
    projectDetail: 'projects',
    createProject: 'projects',
    editProject: 'projects',
    departmentDetail: 'departments',
    trainingDetail: 'trainingHub',
    mockSurvey: 'projects',
    surveyReport: 'projects',
    certificate: 'trainingHub',
    standards: 'accreditationHub',
};

/**
 * Build breadcrumb trail from navigation state
 */
export function useBreadcrumbs(navigation: NavigationState): BreadcrumbItem[] {
    return useMemo(() => {
        const { view } = navigation;

        // Dashboard doesn't need breadcrumbs — it IS home
        if (view === 'dashboard') return [];

        const items: BreadcrumbItem[] = [];

        // Check if this view has a parent
        const parentView = PARENT_VIEW[view];
        if (parentView) {
            const parentLabel = VIEW_LABELS[parentView] || parentView;
            items.push({
                label: parentLabel,
                nav: { view: parentView },
            });
        }

        // Current view
        const label = VIEW_LABELS[view] || view;
        items.push({
            label,
            nav: { view },
        });

        return items;
    }, [navigation]);
}
