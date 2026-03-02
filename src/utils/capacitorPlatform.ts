/**
 * Platform Detection Utility
 * 
 * Detects whether the app is running as a native Capacitor app (Android/iOS)
 * or in a standard web browser. All native plugin calls should check
 * platform availability before invoking Capacitor APIs.
 * 
 * @module capacitorPlatform
 */

import { Capacitor } from '@capacitor/core';

export type AppPlatform = 'android' | 'ios' | 'web';

/**
 * Get the current platform
 */
export const getPlatform = (): AppPlatform => {
    return Capacitor.getPlatform() as AppPlatform;
};

/**
 * Check if running on a native platform (Android or iOS)
 */
export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
    return getPlatform() === 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
    return getPlatform() === 'ios';
};

/**
 * Check if running in a web browser
 */
export const isWeb = (): boolean => {
    return getPlatform() === 'web';
};

/**
 * Check if a specific plugin is available on the current platform
 */
export const isPluginAvailable = (pluginName: string): boolean => {
    return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Safe wrapper to call a native plugin method with web fallback.
 * Returns the native result if available, otherwise calls the web fallback.
 */
export async function withNativeFallback<T>(
    pluginName: string,
    nativeFn: () => Promise<T>,
    webFallback: () => Promise<T>,
): Promise<T> {
    if (isNativePlatform() && isPluginAvailable(pluginName)) {
        try {
            return await nativeFn();
        } catch (error) {
            console.warn(`[Capacitor] ${pluginName} native call failed, falling back to web:`, error);
            return webFallback();
        }
    }
    return webFallback();
}
