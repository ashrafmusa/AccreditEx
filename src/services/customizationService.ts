/**
 * Customization Service - AccreditEx
 * 
 * Service layer for managing user customizations with Firebase persistence,
 * validation, and safe defaults.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { db } from '@/firebase/firebaseConfig';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { UserCustomization } from '@/types/customization';
import { logger } from '@/services/logger';

const COLLECTION_NAME = 'userCustomizations';

export class CustomizationService {
    /**
     * Load user customization from Firebase
     */
    static async loadCustomization(userId: string): Promise<UserCustomization | null> {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                logger.info('Customization loaded from Firebase');
                return docSnap.data() as UserCustomization;
            }

            logger.info('No customization found, using defaults');
            return null;
        } catch (error) {
            logger.error('Error loading customization:', error);
            throw error;
        }
    }

    /**
     * Save user customization to Firebase
     */
    static async saveCustomization(customization: UserCustomization): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, customization.userId);
            await setDoc(docRef, customization, { merge: true });
            logger.info('Customization saved to Firebase');
        } catch (error) {
            logger.error('Error saving customization:', error);
            throw error;
        }
    }

    /**
     * Update specific customization fields
     */
    static async updateCustomization(
        userId: string,
        updates: Partial<UserCustomization>
    ): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
            logger.info('Customization updated in Firebase');
        } catch (error) {
            logger.error('Error updating customization:', error);
            throw error;
        }
    }

    /**
     * Delete user customization (reset to defaults)
     */
    static async deleteCustomization(userId: string): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, userId);
            await setDoc(docRef, { deleted: true, deletedAt: new Date().toISOString() });
            logger.info('Customization deleted');
        } catch (error) {
            logger.error('Error deleting customization:', error);
            throw error;
        }
    }

    /**
     * Export customization as JSON
     */
    static exportCustomization(customization: UserCustomization): string {
        try {
            return JSON.stringify(customization, null, 2);
        } catch (error) {
            logger.error('Error exporting customization:', error);
            throw error;
        }
    }

    /**
     * Import customization from JSON
     */
    static importCustomization(jsonString: string, userId: string): UserCustomization {
        try {
            const imported = JSON.parse(jsonString);

            // Validate imported data
            if (!this.validateImportedCustomization(imported)) {
                throw new Error('Invalid customization format');
            }

            // Override userId to prevent cross-user imports
            imported.userId = userId;
            imported.updatedAt = new Date().toISOString();

            return imported as UserCustomization;
        } catch (error) {
            logger.error('Error importing customization:', error);
            throw error;
        }
    }

    /**
     * Validate imported customization structure
     */
    private static validateImportedCustomization(data: any): boolean {
        // Check required fields
        if (!data.theme || !data.layout || !data.features) {
            return false;
        }

        // Validate theme colors
        if (data.theme.primaryColor && !/^#[0-9A-F]{6}$/i.test(data.theme.primaryColor)) {
            return false;
        }

        if (data.theme.accentColor && !/^#[0-9A-F]{6}$/i.test(data.theme.accentColor)) {
            return false;
        }

        // Validate enums
        const validThemes = ['light', 'dark', 'auto'];
        if (!validThemes.includes(data.theme.mode)) {
            return false;
        }

        return true;
    }

    /**
     * Apply CSS variables from customization
     */
    static applyCSSVariables(customization: UserCustomization): void {
        const root = document.documentElement;

        // Apply theme colors
        root.style.setProperty('--primary-color', customization.theme.primaryColor);
        root.style.setProperty('--accent-color', customization.theme.accentColor);

        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px',
            'x-large': '20px',
        };
        root.style.setProperty('--font-size-base', fontSizes[customization.theme.fontSize]);

        // Apply border radius
        const borderRadii = {
            none: '0',
            small: '4px',
            medium: '8px',
            large: '12px',
        };
        root.style.setProperty('--border-radius', borderRadii[customization.theme.borderRadius]);

        // Apply density
        const densities = {
            compact: '0.5rem',
            comfortable: '1rem',
            spacious: '1.5rem',
        };
        root.style.setProperty('--density-spacing', densities[customization.theme.density]);

        // Apply font family
        const fontFamilies = {
            'system': 'system-ui, sans-serif',
            'inter': 'Inter, sans-serif',
            'roboto': 'Roboto, sans-serif',
            'arabic-friendly': 'Noto Sans Arabic, system-ui',
        };
        root.style.setProperty('--font-family', fontFamilies[customization.theme.fontFamily]);

        logger.info('CSS variables applied');
    }

    /**
     * Apply body classes from customization
     */
    static applyBodyClasses(customization: UserCustomization): void {
        const body = document.body;

        // Clear existing customization classes
        body.classList.forEach(cls => {
            if (cls.startsWith('custom-')) {
                body.classList.remove(cls);
            }
        });

        // Apply theme mode
        body.classList.add(`custom-theme-${customization.theme.mode}`);

        // Apply sidebar position
        if (customization.layout.sidebarPosition === 'right') {
            body.classList.add('custom-sidebar-right');
        }

        // Apply sidebar state
        if (customization.layout.sidebarCollapsed) {
            body.classList.add('custom-sidebar-collapsed');
        }

        // Apply layout style
        body.classList.add(`custom-layout-${customization.layout.dashboardLayout}`);

        // Apply card style
        body.classList.add(`custom-cards-${customization.layout.cardStyle}`);

        // Apply accessibility features
        if (customization.accessibility.highContrast) {
            body.classList.add('custom-high-contrast');
        }

        if (customization.accessibility.reducedMotion) {
            body.classList.add('custom-reduced-motion');
        }

        if (customization.accessibility.screenReaderOptimized) {
            body.classList.add('custom-sr-optimized');
        }

        logger.info('Body classes applied');
    }

    /**
     * Get safe customization defaults that won't break functionality
     */
    static getSafeDefaults(): Partial<UserCustomization> {
        return {
            theme: {
                mode: 'light',
                primaryColor: '#3B82F6',
                accentColor: '#8B5CF6',
                fontSize: 'medium',
                fontFamily: 'system',
                borderRadius: 'medium',
                density: 'comfortable',
            },
            features: {
                enableNotifications: true,
                enableSounds: false,
                enableAnimations: true,
                enableAutoSave: true,
                autoSaveInterval: 5,
                showCompletedTasks: true,
                showArchivedProjects: true,
                defaultLanguage: 'en' as const,
            },
            accessibility: {
                highContrast: false,
                reducedMotion: false,
                screenReaderOptimized: false,
                keyboardShortcuts: true,
                focusIndicators: 'standard' as const,
            },
            advanced: {
                experimentalFeatures: false,
                betaFeatures: [],
                customCSS: '',
                customScripts: [],
            },
        };
    }

    /**
     * Merge user customization with safe defaults
     */
    static mergeWithDefaults(
        customization: Partial<UserCustomization>
    ): UserCustomization {
        const defaults = this.getSafeDefaults();

        return {
            id: customization.id || '',
            userId: customization.userId || '',
            theme: { ...defaults.theme!, ...customization.theme },
            layout: customization.layout || {
                sidebarPosition: 'left',
                sidebarCollapsed: false,
                topBarStyle: 'fixed',
                dashboardLayout: 'grid',
                cardStyle: 'elevated',
                showBreadcrumbs: true,
                compactNavigation: false,
            },
            dashboard: customization.dashboard || { widgets: [], quickActions: [] },
            features: { ...defaults.features!, ...customization.features },
            dataDisplay: customization.dataDisplay || {
                chartType: 'bar',
                tableStyle: 'striped',
                itemsPerPage: 25,
                sortDirection: 'desc',
                showRowNumbers: true,
            },
            workflow: customization.workflow || {
                defaultView: 'list',
                autoAssignTasks: false,
                reminderBefore: 24,
                showCompletedTasks: true,
            },
            accessibility: { ...defaults.accessibility!, ...customization.accessibility },
            advanced: { ...defaults.advanced!, ...customization.advanced },
            createdAt: customization.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as UserCustomization;
    }
}
