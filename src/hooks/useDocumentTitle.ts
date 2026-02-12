/**
 * useDocumentTitle Hook
 * 
 * Dynamically updates the document title based on current route
 * Improves SEO and user experience with browser tabs
 */

import { useEffect } from 'react';
import { NavigationState } from '@/types';

const getTitleForView = (navigation: NavigationState): string => {
    const { view, section } = navigation;

    const baseTitles: Record<string, string> = {
        dashboard: 'Dashboard',
        analytics: 'Analytics',
        qualityInsights: 'Quality Insights',
        calendar: 'Calendar',
        riskHub: 'Risk Management',
        auditHub: 'Audit Hub',
        documentControl: 'Document Control',
        projects: 'Projects',
        projectDetail: 'Project Details',
        createProject: 'Create Project',
        editProject: 'Edit Project',
        standards: 'Standards',
        myTasks: 'My Tasks',
        departments: 'Departments',
        departmentDetail: 'Department Details',
        settings: 'Settings',
        userProfile: 'User Profile',
        trainingHub: 'Training Hub',
        trainingDetail: 'Training Details',
        certificate: 'Certificate',
        mockSurvey: 'Survey',
        surveyReport: 'Survey Report',
        dataHub: 'Data Hub',
        messaging: 'Messages',
    };

    let title = baseTitles[view] || 'Dashboard';

    // Add section for settings
    if (view === 'settings' && section) {
        const sectionTitles: Record<string, string> = {
            general: 'General Settings',
            profile: 'Profile Settings',
            security: 'Security Settings',
            notifications: 'Notification Settings',
            accessibility: 'Accessibility Settings',
            visual: 'Visual Settings',
            usageTracking: 'Usage Tracking',
            firebaseUsage: 'Firebase Usage',
            users: 'User Management',
            accreditationHub: 'Accreditation Hub',
            competencies: 'Competencies',
            data: 'Data Settings',
            firebaseSetup: 'Firebase Setup',
            about: 'About',
            settingsPresets: 'Settings Presets',
            versionHistory: 'Version History',
            auditLog: 'Audit Log',
            bulkUserImport: 'Bulk User Import',
        };
        title = sectionTitles[section] || `Settings - ${section}`;
    }

    return `${title} | AccreditEx`;
};

export const useDocumentTitle = (navigation: NavigationState) => {
    useEffect(() => {
        const title = getTitleForView(navigation);
        document.title = title;

        // Update meta description for better SEO
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }

        const descriptions: Record<string, string> = {
            dashboard: 'AccreditEx Dashboard - Overview of your accreditation management system',
            analytics: 'Analytics and reporting for accreditation compliance',
            projects: 'Manage and track your accreditation projects',
            documentControl: 'Control and manage your quality management documents',
            trainingHub: 'Employee training and development programs',
            settings: 'Configure your AccreditEx system settings',
        };

        metaDescription.setAttribute(
            'content',
            descriptions[navigation.view] || 'AccreditEx - Accreditation Management System'
        );

        return () => {
            // Reset to default on unmount
            document.title = 'AccreditEx';
        };
    }, [navigation]);
};
