/**
 * useCustomization Hook - AccreditEx
 * 
 * React hook for easy access to customization features with automatic
 * CSS application and persistence.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { useEffect, useRef } from 'react';
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
    const activeCustomization = userId && customization?.userId === userId
        ? customization
        : null;
    const requestedUserId = useRef<string | null>(null);

    // Auto-load customization on mount
    useEffect(() => {
        if (!userId) {
            requestedUserId.current = null;
            return;
        }
        if (!isLoading && requestedUserId.current !== userId) {
            requestedUserId.current = userId;
            void loadCustomization(userId);
        }
    }, [userId, isLoading, loadCustomization]);

    // Auto-apply CSS and classes when customization changes
    useEffect(() => {
        if (activeCustomization) {
            CustomizationService.applyCSSVariables(activeCustomization);
            CustomizationService.applyBodyClasses(activeCustomization);
        }
    }, [activeCustomization]);

    // Update theme (safe wrapper)
    const updateTheme = async (theme: Partial<UserCustomization['theme']>) => {
        if (!activeCustomization) return;
        await updateCustomization({ theme: { ...activeCustomization.theme, ...theme } });
    };

    // Update layout (safe wrapper)
    const updateLayout = async (layout: Partial<UserCustomization['layout']>) => {
        if (!activeCustomization) return;
        await updateCustomization({ layout: { ...activeCustomization.layout, ...layout } });
    };

    // Update features (safe wrapper)
    const updateFeatures = async (features: Partial<UserCustomization['features']>) => {
        if (!activeCustomization) return;
        await updateCustomization({ features: { ...activeCustomization.features, ...features } });
    };

    // Update accessibility (safe wrapper)
    const updateAccessibility = async (accessibility: Partial<UserCustomization['accessibility']>) => {
        if (!activeCustomization) return;
        await updateCustomization({ accessibility: { ...activeCustomization.accessibility, ...accessibility } });
    };

    // Toggle dark mode
    const toggleDarkMode = async () => {
        if (!activeCustomization) return;

        const newMode = activeCustomization.theme.mode === 'dark' ? 'light' : 'dark';
        await updateTheme({ mode: newMode });
    };

    // Toggle sidebar
    const toggleSidebar = async () => {
        if (!activeCustomization) return;

        await updateLayout({ sidebarCollapsed: !activeCustomization.layout.sidebarCollapsed });
    };

    // Export customization
    const exportCustomization = () => {
        if (!activeCustomization) return null;

        try {
            const json = CustomizationService.exportCustomization(activeCustomization);
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
        customization: activeCustomization,
        presets,
        isLoading,
        error,
        themeCSS: activeCustomization ? themeCSS : '',
        layoutClasses: activeCustomization ? layoutClasses : [],

        // Actions
        updateCustomization,
        loadCustomization,
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
        isDarkMode: activeCustomization?.theme.mode === 'dark',
        isSidebarCollapsed: activeCustomization?.layout.sidebarCollapsed || false,
        isHighContrast: activeCustomization?.accessibility.highContrast || false,
        isReducedMotion: activeCustomization?.accessibility.reducedMotion || false,
    };
};
