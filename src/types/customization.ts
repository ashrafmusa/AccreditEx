/**
 * User Customization System - AccreditEx
 * 
 * Comprehensive, safe customization framework that allows users to personalize
 * the app without negatively impacting core functionality.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

export interface UserCustomization {
    id: string;
    userId: string;

    // Visual Customization
    theme: {
        mode: 'light' | 'dark' | 'auto';
        primaryColor: string;
        accentColor: string;
        fontSize: 'small' | 'medium' | 'large' | 'x-large';
        fontFamily: 'system' | 'inter' | 'roboto' | 'arabic-friendly';
        borderRadius: 'none' | 'small' | 'medium' | 'large';
        density: 'compact' | 'comfortable' | 'spacious';
    };

    // Layout Customization
    layout: {
        sidebarPosition: 'left' | 'right';
        sidebarCollapsed: boolean;
        dashboardLayout: 'grid' | 'list' | 'kanban';
        cardStyle: 'elevated' | 'outlined' | 'flat';
        navigationStyle: 'sidebar' | 'topbar' | 'combined';
    };

    // Dashboard Customization
    dashboard: {
        widgets: DashboardWidget[];
        columns: 1 | 2 | 3 | 4;
        showWelcome: boolean;
        showQuickActions: boolean;
        defaultView: 'overview' | 'projects' | 'tasks' | 'analytics';
    };

    // Feature Preferences
    features: {
        enableNotifications: boolean;
        enableSounds: boolean;
        enableAnimations: boolean;
        enableAutoSave: boolean;
        autoSaveInterval: number; // minutes
        showCompletedTasks: boolean;
        showArchivedProjects: boolean;
        defaultLanguage: 'en' | 'ar' | 'both';
    };

    // Data Display Preferences
    dataDisplay: {
        dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
        timeFormat: '12h' | '24h';
        numberFormat: 'comma' | 'space' | 'dot';
        currency: 'USD' | 'EUR' | 'SAR' | 'AED';
        itemsPerPage: 10 | 25 | 50 | 100;
        defaultChartType: 'bar' | 'line' | 'pie' | 'doughnut';
    };

    // Workflow Customization
    workflow: {
        defaultProjectTemplate: string | null;
        autoAssignTasks: boolean;
        requireApproval: boolean;
        notificationPreferences: NotificationPreferences;
        quickActions: QuickAction[];
    };

    // Accessibility
    accessibility: {
        highContrast: boolean;
        reducedMotion: boolean;
        screenReaderOptimized: boolean;
        keyboardShortcuts: boolean;
        focusIndicators: 'standard' | 'enhanced';
    };

    // Advanced
    advanced: {
        experimentalFeatures: boolean;
        betaFeatures: string[];
        customCSS: string;
        customScripts: string[];
    };

    // Metadata
    createdAt: string;
    updatedAt: string;
    version: string;
    preset?: string; // References a preset if using one
}

export interface DashboardWidget {
    id: string;
    type: 'stats' | 'chart' | 'tasks' | 'calendar' | 'risks' | 'documents' | 'recent-activity' | 'quick-actions';
    position: { x: number; y: number; w: number; h: number };
    visible: boolean;
    config: Record<string, any>;
}

export interface NotificationPreferences {
    email: {
        enabled: boolean;
        frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
        types: string[];
    };
    push: {
        enabled: boolean;
        types: string[];
    };
    inApp: {
        enabled: boolean;
        position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
        duration: number;
    };
}

export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    action: string;
    shortcut?: string;
    visible: boolean;
    order: number;
}

export interface CustomizationPreset {
    id: string;
    name: string;
    description: string;
    category: 'professional' | 'minimal' | 'colorful' | 'accessibility' | 'performance' | 'custom';
    customization: Partial<UserCustomization>;
    isDefault: boolean;
    createdBy?: string;
    isPublic: boolean;
}

// Default safe customization
export const DEFAULT_CUSTOMIZATION: Omit<UserCustomization, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
    theme: {
        mode: 'light',
        primaryColor: '#4f46e5',
        accentColor: '#10b981',
        fontSize: 'medium',
        fontFamily: 'system',
        borderRadius: 'medium',
        density: 'comfortable',
    },
    layout: {
        sidebarPosition: 'left',
        sidebarCollapsed: false,
        dashboardLayout: 'grid',
        cardStyle: 'elevated',
        navigationStyle: 'sidebar',
    },
    dashboard: {
        widgets: [
            { id: 'stats', type: 'stats', position: { x: 0, y: 0, w: 4, h: 1 }, visible: true, config: {} },
            { id: 'chart', type: 'chart', position: { x: 0, y: 1, w: 2, h: 2 }, visible: true, config: {} },
            { id: 'tasks', type: 'tasks', position: { x: 2, y: 1, w: 2, h: 2 }, visible: true, config: {} },
        ],
        columns: 2,
        showWelcome: true,
        showQuickActions: true,
        defaultView: 'overview',
    },
    features: {
        enableNotifications: true,
        enableSounds: false,
        enableAnimations: true,
        enableAutoSave: true,
        autoSaveInterval: 5,
        showCompletedTasks: true,
        showArchivedProjects: false,
        defaultLanguage: 'en',
    },
    dataDisplay: {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: 'comma',
        currency: 'USD',
        itemsPerPage: 25,
        defaultChartType: 'bar',
    },
    workflow: {
        defaultProjectTemplate: null,
        autoAssignTasks: false,
        requireApproval: true,
        notificationPreferences: {
            email: {
                enabled: true,
                frequency: 'daily',
                types: ['project', 'task', 'audit'],
            },
            push: {
                enabled: true,
                types: ['critical', 'approval'],
            },
            inApp: {
                enabled: true,
                position: 'top-right',
                duration: 5000,
            },
        },
        quickActions: [],
    },
    accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReaderOptimized: false,
        keyboardShortcuts: true,
        focusIndicators: 'standard',
    },
    advanced: {
        experimentalFeatures: false,
        betaFeatures: [],
        customCSS: '',
        customScripts: [],
    },
    version: '1.0.0',
};

// Preset templates
export const CUSTOMIZATION_PRESETS: CustomizationPreset[] = [
    {
        id: 'professional',
        name: 'Professional',
        description: 'Clean, minimalist design focused on productivity',
        category: 'professional',
        isDefault: true,
        isPublic: true,
        customization: {
            theme: {
                mode: 'light' as const,
                primaryColor: '#1e40af',
                accentColor: '#059669',
                fontSize: 'medium' as const,
                fontFamily: 'inter' as const,
                borderRadius: 'small' as const,
                density: 'compact' as const,
            },
            layout: {
                sidebarPosition: 'left' as const,
                sidebarCollapsed: false,
                dashboardLayout: 'list' as const,
                cardStyle: 'outlined' as const,
                navigationStyle: 'sidebar' as const,
            },
            features: {
                enableNotifications: true,
                enableSounds: false,
                enableAnimations: false,
                enableAutoSave: true,
                autoSaveInterval: 5,
                showCompletedTasks: true,
                showArchivedProjects: false,
                defaultLanguage: 'en' as const,
            },
        },
    },
    {
        id: 'colorful',
        name: 'Colorful',
        description: 'Vibrant colors and engaging animations',
        category: 'colorful',
        isDefault: false,
        isPublic: true,
        customization: {
            theme: {
                mode: 'light' as const,
                primaryColor: '#7c3aed',
                accentColor: '#f59e0b',
                fontSize: 'medium' as const,
                fontFamily: 'system' as const,
                borderRadius: 'large' as const,
                density: 'comfortable' as const,
            },
            layout: {
                sidebarPosition: 'left' as const,
                sidebarCollapsed: false,
                dashboardLayout: 'grid' as const,
                cardStyle: 'elevated' as const,
                navigationStyle: 'sidebar' as const,
            },
            features: {
                enableNotifications: true,
                enableSounds: true,
                enableAnimations: true,
                enableAutoSave: true,
                autoSaveInterval: 5,
                showCompletedTasks: true,
                showArchivedProjects: true,
                defaultLanguage: 'en' as const,
            },
        },
    },
    {
        id: 'accessibility',
        name: 'Accessibility Focused',
        description: 'High contrast, large text, reduced motion',
        category: 'accessibility',
        isDefault: false,
        isPublic: true,
        customization: {
            theme: {
                mode: 'light' as const,
                primaryColor: '#000000',
                accentColor: '#0066cc',
                fontSize: 'x-large' as const,
                fontFamily: 'system' as const,
                borderRadius: 'none' as const,
                density: 'spacious' as const,
            },
            accessibility: {
                highContrast: true,
                reducedMotion: true,
                screenReaderOptimized: true,
                keyboardShortcuts: true,
                focusIndicators: 'enhanced' as const,
            },
            features: {
                enableNotifications: true,
                enableSounds: false,
                enableAnimations: false,
                enableAutoSave: true,
                autoSaveInterval: 5,
                showCompletedTasks: true,
                showArchivedProjects: true,
                defaultLanguage: 'en' as const,
            },
        },
    },
    {
        id: 'performance',
        name: 'Performance Mode',
        description: 'Optimized for speed and efficiency',
        category: 'performance',
        isDefault: false,
        isPublic: true,
        customization: {
            theme: {
                mode: 'light' as const,
                primaryColor: '#3B82F6',
                accentColor: '#8B5CF6',
                fontSize: 'small' as const,
                fontFamily: 'system' as const,
                borderRadius: 'small' as const,
                density: 'compact' as const,
            },
            features: {
                enableNotifications: true,
                enableSounds: false,
                enableAnimations: false,
                enableAutoSave: true,
                autoSaveInterval: 10,
                showCompletedTasks: false,
                showArchivedProjects: false,
                defaultLanguage: 'en' as const,
            },
            dataDisplay: {
                dateFormat: 'YYYY-MM-DD' as const,
                timeFormat: '24h' as const,
                numberFormat: 'comma' as const,
                currency: 'USD' as const,
                itemsPerPage: 50,
                defaultChartType: 'bar' as const,
            },
            layout: {
                sidebarPosition: 'left' as const,
                sidebarCollapsed: false,
                dashboardLayout: 'list' as const,
                cardStyle: 'flat' as const,
                navigationStyle: 'sidebar' as const,
            },
        },
    },
];