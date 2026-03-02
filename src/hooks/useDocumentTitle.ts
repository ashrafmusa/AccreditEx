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
        analyticsHub: 'Analytics Hub',
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
        accreditationHub: 'Accreditation Hub',
        knowledgeBase: 'Knowledge Base',
        labOperations: 'Lab Operations',
        workflowAutomation: 'Workflow Automation',
        reportBuilder: 'Report Builder',
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

    return `${title} | AccreditEx — Healthcare Accreditation Management`;
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
            dashboard: 'AccreditEx Dashboard - Real-time overview of accreditation compliance, project progress, and key quality metrics.',
            analytics: 'Analytics and reporting for accreditation compliance trends and performance insights.',
            analyticsHub: 'Deep-dive analytics hub with compliance dashboards, gap analysis, and trend visualizations.',
            projects: 'Manage and track your healthcare accreditation projects with detailed checklists and progress tracking.',
            documentControl: 'Document control center for policies, procedures, and evidence management with version tracking.',
            trainingHub: 'Employee training hub — track competencies, certifications, and performance evaluations.',
            settings: 'Configure your AccreditEx system settings, profile, and preferences.',
            riskHub: 'Risk management hub — identify, assess, and mitigate organizational risks with heat maps and FMEA.',
            auditHub: 'Audit hub — plan, schedule, and conduct internal audits with findings tracking.',
            accreditationHub: 'Accreditation hub — manage JCI, CBAHI, DNV programs and standards compliance.',
            dataHub: 'Data hub — centralized data management with import/export and validation tools.',
            knowledgeBase: 'Knowledge base — accreditation guidelines, best practices, and reference materials.',
            labOperations: 'Lab operations management — track laboratory quality, equipment, and test results.',
            workflowAutomation: 'Workflow automation — create automated workflows for accreditation processes.',
            messaging: 'Team messaging — collaborate with your accreditation team in real-time.',
            calendar: 'Calendar — schedule audits, training sessions, and accreditation deadlines.',
            myTasks: 'My Tasks — view and manage your assigned accreditation tasks and action items.',
        };

        metaDescription.setAttribute(
            'content',
            descriptions[navigation.view] || 'AccreditEx — Enterprise-grade healthcare accreditation management platform with AI-powered compliance tracking.'
        );

        return () => {
            document.title = 'AccreditEx — Healthcare Accreditation Management Platform';
        };
    }, [navigation]);
};
