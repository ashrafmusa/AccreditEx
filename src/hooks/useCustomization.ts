/**
 * useCustomization Hook - AccreditEx
 * 
 * React hook for easy access to customization features with automatic
 * CSS application and persistence.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useCustomizationStore } from '@/stores/useCustomizationStore';
import { CustomizationService } from '@/services/customizationService';
import { UserCustomization } from '@/types/customization';
import { logger } from '@/services/logger';

export const useCustomization = (userId?: string) => {
    const {
        customization,
        presets,
        isLoading,
        error,
        loadCustomization,
        updateCustomization,
        resetCustomization,
        applyPreset,
        saveCustomPreset,
        deleteCustomPreset,
        getThemeCSS,
        getLayoutClasses,
    } = useCustomizationStore();

    // Auto-load customization on mount
    useEffect(() => {
        if (userId && !customization) {
            loadCustomization(userId);
        }
    }, [userId, customization, loadCustomization]);

    // Auto-apply CSS and classes when customization changes
    useEffect(() => {
        if (customization) {
            CustomizationService.applyCSSVariables(customization);
            CustomizationService.applyBodyClasses(customization);
        }
    }, [customization]);

    // Update theme (safe wrapper)
    const updateTheme = async (theme: Partial<UserCustomization['theme']>) => {
        if (!customization) return;
        await updateCustomization({ theme: { ...customization.theme, ...theme } });
    };

    // Update layout (safe wrapper)
    const updateLayout = async (layout: Partial<UserCustomization['layout']>) => {
        if (!customization) return;
        await updateCustomization({ layout: { ...customization.layout, ...layout } });
    };

    // Update features (safe wrapper)
    const updateFeatures = async (features: Partial<UserCustomization['features']>) => {
        if (!customization) return;
        await updateCustomization({ features: { ...customization.features, ...features } });
    };

    // Update accessibility (safe wrapper)
    const updateAccessibility = async (accessibility: Partial<UserCustomization['accessibility']>) => {
        if (!customization) return;
        await updateCustomization({ accessibility: { ...customization.accessibility, ...accessibility } });
    };

    // Toggle dark mode
    const toggleDarkMode = async () => {
        if (!customization) return;

        const newMode = customization.theme.mode === 'dark' ? 'light' : 'dark';
        await updateTheme({ mode: newMode });
    };

    // Toggle sidebar
    const toggleSidebar = async () => {
        if (!customization) return;

        await updateLayout({ sidebarCollapsed: !customization.layout.sidebarCollapsed });
    };

    // Export customization
    const exportCustomization = () => {
        if (!customization) return null;

        try {
            const json = CustomizationService.exportCustomization(customization);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `accreditex-customization-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            logger.info('Customization exported');
        } catch (error) {
            logger.error('Failed to export customization:', error);
        }
    };

    // Import customization
    const importCustomization = async (file: File) => {
        if (!userId) return;

        try {
            const text = await file.text();
            const imported = CustomizationService.importCustomization(text, userId);
            await updateCustomization(imported);
            logger.info('Customization imported');
        } catch (error) {
            logger.error('Failed to import customization:', error);
            throw error;
        }
    };

    // Get current theme CSS
    const themeCSS = getThemeCSS();

    // Get current layout classes
    const layoutClasses = getLayoutClasses();

    return {
        // State
        customization,
        presets,
        isLoading,
        error,
        themeCSS,
        layoutClasses,

        // Actions
        updateCustomization,
        updateTheme,
        updateLayout,
        updateFeatures,
        updateAccessibility,
        resetCustomization,
        applyPreset,
        saveCustomPreset,
        deleteCustomPreset,
        toggleDarkMode,
        toggleSidebar,
        exportCustomization,
        importCustomization,

        // Helpers
        isDarkMode: customization?.theme.mode === 'dark',
        isSidebarCollapsed: customization?.layout.sidebarCollapsed || false,
        isHighContrast: customization?.accessibility.highContrast || false,
        isReducedMotion: customization?.accessibility.reducedMotion || false,
    };
};
