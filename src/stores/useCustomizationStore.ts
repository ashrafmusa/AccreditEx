/**
 * User Customization Store - AccreditEx
 * 
 * Zustand store for managing user customizations with safe defaults
 * and validation to prevent functionality breaks.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    UserCustomization,
    CustomizationPreset,
    DEFAULT_CUSTOMIZATION,
    CUSTOMIZATION_PRESETS,
} from '@/types/customization';
import { logger } from '@/services/logger';

interface CustomizationState {
    customization: UserCustomization | null;
    presets: CustomizationPreset[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadCustomization: (userId: string) => Promise<void>;
    updateCustomization: (updates: Partial<UserCustomization>) => Promise<void>;
    resetCustomization: () => void;
    applyPreset: (presetId: string) => void;
    saveCustomPreset: (preset: Omit<CustomizationPreset, 'id'>) => void;
    deleteCustomPreset: (presetId: string) => void;

    // Getters
    getThemeCSS: () => string;
    getLayoutClasses: () => string[];

    // Validation
    validateCustomization: (customization: Partial<UserCustomization>) => boolean;
}

export const useCustomizationStore = create<CustomizationState>()(
    persist(
        (set, get) => ({
            customization: null,
            presets: CUSTOMIZATION_PRESETS,
            isLoading: false,
            error: null,

            loadCustomization: async (userId: string) => {
                set({ isLoading: true, error: null });

                try {
                    // Try to load from Firebase
                    // For now, create default if none exists
                    const defaultCustom: UserCustomization = {
                        id: `custom_${userId}`,
                        userId,
                        ...DEFAULT_CUSTOMIZATION,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    set({ customization: defaultCustom, isLoading: false });
                    logger.info('Customization loaded for user:', userId);
                } catch (error) {
                    logger.error('Failed to load customization:', error);
                    set({ error: 'Failed to load customization settings', isLoading: false });
                }
            },

            updateCustomization: async (updates: Partial<UserCustomization>) => {
                const { customization, validateCustomization } = get();

                if (!customization) {
                    logger.error('No customization loaded');
                    return;
                }

                // Validate updates
                if (!validateCustomization(updates)) {
                    logger.error('Invalid customization updates');
                    set({ error: 'Invalid customization settings' });
                    return;
                }

                try {
                    const updated: UserCustomization = {
                        ...customization,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    };

                    // Deep merge for nested objects
                    if (updates.theme) {
                        updated.theme = { ...customization.theme, ...updates.theme };
                    }
                    if (updates.layout) {
                        updated.layout = { ...customization.layout, ...updates.layout };
                    }
                    if (updates.dashboard) {
                        updated.dashboard = { ...customization.dashboard, ...updates.dashboard };
                    }
                    if (updates.features) {
                        updated.features = { ...customization.features, ...updates.features };
                    }
                    if (updates.dataDisplay) {
                        updated.dataDisplay = { ...customization.dataDisplay, ...updates.dataDisplay };
                    }
                    if (updates.workflow) {
                        updated.workflow = { ...customization.workflow, ...updates.workflow };
                    }
                    if (updates.accessibility) {
                        updated.accessibility = { ...customization.accessibility, ...updates.accessibility };
                    }
                    if (updates.advanced) {
                        updated.advanced = { ...customization.advanced, ...updates.advanced };
                    }

                    set({ customization: updated });
                    logger.info('Customization updated');

                    // TODO: Save to Firebase

                } catch (error) {
                    logger.error('Failed to update customization:', error);
                    set({ error: 'Failed to save customization' });
                }
            },

            resetCustomization: () => {
                const { customization } = get();

                if (!customization) return;

                const reset: UserCustomization = {
                    ...customization,
                    ...DEFAULT_CUSTOMIZATION,
                    updatedAt: new Date().toISOString(),
                    preset: undefined,
                };

                set({ customization: reset });
                logger.info('Customization reset to defaults');
            },

            applyPreset: (presetId: string) => {
                const { customization, presets } = get();

                if (!customization) return;

                const preset = presets.find(p => p.id === presetId);

                if (!preset) {
                    logger.error('Preset not found:', presetId);
                    return;
                }

                const updated: UserCustomization = {
                    ...customization,
                    ...preset.customization,
                    preset: presetId,
                    updatedAt: new Date().toISOString(),
                };

                // Deep merge preset customization
                if (preset.customization.theme) {
                    updated.theme = { ...customization.theme, ...preset.customization.theme };
                }
                if (preset.customization.layout) {
                    updated.layout = { ...customization.layout, ...preset.customization.layout };
                }
                if (preset.customization.features) {
                    updated.features = { ...customization.features, ...preset.customization.features };
                }
                if (preset.customization.accessibility) {
                    updated.accessibility = { ...customization.accessibility, ...preset.customization.accessibility };
                }

                set({ customization: updated });
                logger.info('Preset applied:', presetId);
            },

            saveCustomPreset: (preset: Omit<CustomizationPreset, 'id'>) => {
                const { presets } = get();

                const newPreset: CustomizationPreset = {
                    ...preset,
                    id: `custom_${Date.now()}`,
                };

                set({ presets: [...presets, newPreset] });
                logger.info('Custom preset saved:', newPreset.id);
            },

            deleteCustomPreset: (presetId: string) => {
                const { presets } = get();

                const preset = presets.find(p => p.id === presetId);

                if (!preset) return;

                if (preset.isDefault) {
                    logger.error('Cannot delete default preset');
                    set({ error: 'Cannot delete default presets' });
                    return;
                }

                set({ presets: presets.filter(p => p.id !== presetId) });
                logger.info('Preset deleted:', presetId);
            },

            getThemeCSS: () => {
                const { customization } = get();

                if (!customization) return '';

                const { theme } = customization;

                return `
          :root {
            --primary-color: ${theme.primaryColor};
            --accent-color: ${theme.accentColor};
            --font-size-base: ${theme.fontSize === 'small' ? '14px' : theme.fontSize === 'large' ? '18px' : theme.fontSize === 'x-large' ? '20px' : '16px'};
            --border-radius: ${theme.borderRadius === 'none' ? '0' : theme.borderRadius === 'small' ? '4px' : theme.borderRadius === 'large' ? '12px' : '8px'};
            --density-spacing: ${theme.density === 'compact' ? '0.5rem' : theme.density === 'spacious' ? '1.5rem' : '1rem'};
          }
          
          body {
            font-family: ${theme.fontFamily === 'inter' ? 'Inter, sans-serif' : theme.fontFamily === 'roboto' ? 'Roboto, sans-serif' : theme.fontFamily === 'arabic-friendly' ? 'Noto Sans Arabic, system-ui' : 'system-ui, sans-serif'};
          }
        `;
            },

            getLayoutClasses: () => {
                const { customization } = get();

                if (!customization) return [];

                const { layout, accessibility } = customization;

                const classes: string[] = [];

                if (layout.sidebarPosition === 'right') classes.push('sidebar-right');
                if (layout.sidebarCollapsed) classes.push('sidebar-collapsed');
                if (layout.dashboardLayout === 'list') classes.push('layout-list');
                if (layout.dashboardLayout === 'kanban') classes.push('layout-kanban');
                if (layout.cardStyle === 'outlined') classes.push('cards-outlined');
                if (layout.cardStyle === 'flat') classes.push('cards-flat');
                if (accessibility.highContrast) classes.push('high-contrast');
                if (accessibility.reducedMotion) classes.push('reduced-motion');

                return classes;
            },

            validateCustomization: (customization: Partial<UserCustomization>) => {
                // Validate theme colors
                if (customization.theme?.primaryColor) {
                    if (!/^#[0-9A-F]{6}$/i.test(customization.theme.primaryColor)) {
                        logger.error('Invalid primary color format');
                        return false;
                    }
                }

                if (customization.theme?.accentColor) {
                    if (!/^#[0-9A-F]{6}$/i.test(customization.theme.accentColor)) {
                        logger.error('Invalid accent color format');
                        return false;
                    }
                }

                // Validate auto-save interval (must be reasonable)
                if (customization.features?.autoSaveInterval !== undefined) {
                    if (customization.features.autoSaveInterval < 1 || customization.features.autoSaveInterval > 60) {
                        logger.error('Auto-save interval must be between 1 and 60 minutes');
                        return false;
                    }
                }

                // Validate items per page
                if (customization.dataDisplay?.itemsPerPage !== undefined) {
                    if (![10, 25, 50, 100].includes(customization.dataDisplay.itemsPerPage)) {
                        logger.error('Invalid items per page value');
                        return false;
                    }
                }

                // Don't allow disabling critical features
                if (customization.features?.enableAutoSave === false) {
                    logger.warn('Auto-save disabled - this may result in data loss');
                }

                return true;
            },
        }),
        {
            name: 'accreditex-customization',
            partialize: (state) => ({
                customization: state.customization,
                presets: state.presets.filter(p => !p.isDefault), // Only save custom presets
            }),
        }
    )
);