import { HelpContent } from "@/components/common/ContextualHelp";

/**
 * Contextual Help Content Data
 * 
 * Defines help content for each page that has contextual help.
 * Content keys should be added to translation files.
 */

export const HELP_CONTENT: Record<string, HelpContent> = {
    // 1. Project Detail (highest complexity)
    projectDetail: {
        pageKey: "projectDetail",
        titleKey: "helpProjectDetailTitle",
        purposeKey: "helpProjectDetailPurpose",
        keyActions: {
            titleKey: "helpKeyActions",
            items: [
                "helpProjectDetailAction1", // Update project information and settings
                "helpProjectDetailAction2", // Assign standards and requirements  
                "helpProjectDetailAction3", // Track compliance progress and milestones
                "helpProjectDetailAction4", // Upload and manage project documents
                "helpProjectDetailAction5", // Collaborate with team members
            ],
        },
        tips: {
            titleKey: "helpTipsAndBestPractices",
            items: [
                "helpProjectDetailTip1", // Set realistic timeline and milestones
                "helpProjectDetailTip2", // Regularly update progress status
                "helpProjectDetailTip3", // Keep all documents organized and tagged
                "helpProjectDetailTip4", // Assign clear responsibilities to team members
            ],
        },
    },

    // 2. Document Control Hub
    documentControl: {
        pageKey: "documentControl",
        titleKey: "helpDocumentControlTitle",
        purposeKey: "helpDocumentControlPurpose",
        keyActions: {
            titleKey: "helpKeyActions",
            items: [
                "helpDocumentControlAction1", // Upload new documents and files
                "helpDocumentControlAction2", // Review and approve document changes
                "helpDocumentControlAction3", // Manage document versions and history
                "helpDocumentControlAction4", // Set permissions and access controls
                "helpDocumentControlAction5", // Generate compliance reports
            ],
        },
        tips: {
            titleKey: "helpTipsAndBestPractices",
            items: [
                "helpDocumentControlTip1", // Use consistent naming conventions
                "helpDocumentControlTip2", // Tag documents with relevant categories
                "helpDocumentControlTip3", // Set up approval workflows early
                "helpDocumentControlTip4", // Regular backup and archive old versions
            ],
        },
    },

    // 3. Standards Management
    standards: {
        pageKey: "standards",
        titleKey: "helpStandardsTitle",
        purposeKey: "helpStandardsPurpose",
        keyActions: {
            titleKey: "helpKeyActions",
            items: [
                "helpStandardsAction1", // Browse available accreditation standards
                "helpStandardsAction2", // Assign standards to your projects
                "helpStandardsAction3", // Track compliance requirements and deadlines
                "helpStandardsAction4", // View detailed standard requirements
                "helpStandardsAction5", // Generate standards compliance reports
            ],
        },
        tips: {
            titleKey: "helpTipsAndBestPractices",
            items: [
                "helpStandardsTip1", // Start with most critical standards first
                "helpStandardsTip2", // Break down requirements into manageable tasks
                "helpStandardsTip3", // Set up automated reminders for deadlines
                "helpStandardsTip4", // Document evidence for each requirement
            ],
        },
    },

    // 4. Create Project
    createProject: {
        pageKey: "createProject",
        titleKey: "helpCreateProjectTitle",
        purposeKey: "helpCreateProjectPurpose",
        keyActions: {
            titleKey: "helpKeyActions",
            items: [
                "helpCreateProjectAction1", // Choose the appropriate project template
                "helpCreateProjectAction2", // Fill in basic project information
                "helpCreateProjectAction3", // Select applicable accreditation standards
                "helpCreateProjectAction4", // Invite team members and assign roles
                "helpCreateProjectAction5", // Set timeline and milestone dates
            ],
        },
        tips: {
            titleKey: "helpTipsAndBestPractices",
            items: [
                "helpCreateProjectTip1", // Choose descriptive project names
                "helpCreateProjectTip2", // Allow extra time for complex accreditations
                "helpCreateProjectTip3", // Involve all stakeholders from the start
                "helpCreateProjectTip4", // Review similar past projects for guidance
            ],
        },
    },

    // 5. User Management
    users: {
        pageKey: "users",
        titleKey: "helpUsersTitle",
        purposeKey: "helpUsersPurpose",
        keyActions: {
            titleKey: "helpKeyActions",
            items: [
                "helpUsersAction1", // Invite new team members to the platform
                "helpUsersAction2", // Assign appropriate roles and permissions
                "helpUsersAction3", // Manage user access to projects and data
                "helpUsersAction4", // Monitor user activity and engagement
                "helpUsersAction5", // Bulk import users from external systems
            ],
        },
        tips: {
            titleKey: "helpTipsAndBestPractices",
            items: [
                "helpUsersTip1", // Use principle of least privilege for security
                "helpUsersTip2", // Regular review and update user permissions
                "helpUsersTip3", // Provide training resources for new users
                "helpUsersTip4", // Set up user groups for easier management
            ],
        },
    },

    // Additional pages can be added here as needed
    // Example: reports, settings, dashboard, etc.

    dashboard: {
        pageKey: "dashboard",
        titleKey: "helpDashboardTitle",
        purposeKey: "helpDashboardPurpose",
        keyActions: {
            titleKey: "helpKeyActions",
            items: [
                "helpDashboardAction1", // View project status and progress summaries
                "helpDashboardAction2", // Access quick actions for common tasks
                "helpDashboardAction3", // Monitor upcoming deadlines and milestones
                "helpDashboardAction4", // Review recent activity and notifications
                "helpDashboardAction5", // Navigate to detailed project views
            ],
        },
        tips: {
            titleKey: "helpTipsAndBestPractices",
            items: [
                "helpDashboardTip1", // Customize widgets to show most important metrics
                "helpDashboardTip2", // Check dashboard daily for status updates
                "helpDashboardTip3", // Use filters to focus on priority projects
                "helpDashboardTip4", // Set up notifications for critical alerts
            ],
        },
    },
};

/**
 * Get help content for a specific page
 */
export const getHelpContent = (pageKey: string): HelpContent | null => {
    return HELP_CONTENT[pageKey] || null;
};

/**
 * Get list of all pages with help content
 */
export const getAvailableHelpPages = (): string[] => {
    return Object.keys(HELP_CONTENT);
};