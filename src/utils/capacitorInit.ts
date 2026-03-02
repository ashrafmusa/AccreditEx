/**
 * Capacitor App Lifecycle Manager
 * 
 * Initializes native platform features when running as a Capacitor app:
 * - Status bar styling
 * - Splash screen management
 * - App state handling (background/foreground)
 * - Keyboard adjustments
 * - Back button handling (Android)
 * 
 * This file should be imported once in the app entry point (index.tsx).
 * On web, all calls are no-ops.
 * 
 * @module capacitorInit
 */

import { isNativePlatform, isAndroid, isIOS, isPluginAvailable } from '@/utils/capacitorPlatform';

/**
 * Initialize all native platform features.
 * Safe to call on web — all plugin calls check availability first.
 */
export async function initializeCapacitor(): Promise<void> {
    if (!isNativePlatform()) {
        console.log('[Capacitor] Running in web mode — native plugins disabled');
        return;
    }

    console.log(`[Capacitor] Initializing native platform: ${isAndroid() ? 'Android' : 'iOS'}`);

    try {
        await Promise.all([
            initStatusBar(),
            initSplashScreen(),
            initAppLifecycle(),
            initKeyboard(),
        ]);
        console.log('[Capacitor] All native plugins initialized');
    } catch (error) {
        console.warn('[Capacitor] Some plugins failed to initialize:', error);
    }
}

// ─── Status Bar ─────────────────────────────────────────────────────

async function initStatusBar(): Promise<void> {
    if (!isPluginAvailable('StatusBar')) return;

    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Check if user prefers dark mode
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    await StatusBar.setStyle({
        style: isDarkMode ? Style.Dark : Style.Light,
    });

    if (isAndroid()) {
        await StatusBar.setBackgroundColor({
            color: isDarkMode ? '#1e293b' : '#ffffff', // slate-800 or white
        });
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
        await StatusBar.setStyle({
            style: e.matches ? Style.Dark : Style.Light,
        });
        if (isAndroid()) {
            await StatusBar.setBackgroundColor({
                color: e.matches ? '#1e293b' : '#ffffff',
            });
        }
    });
}

// ─── Splash Screen ──────────────────────────────────────────────────

async function initSplashScreen(): Promise<void> {
    if (!isPluginAvailable('SplashScreen')) return;

    const { SplashScreen } = await import('@capacitor/splash-screen');

    // Hide splash screen after a short delay (app is ready)
    await SplashScreen.hide({ fadeOutDuration: 300 });
}

// ─── App Lifecycle ──────────────────────────────────────────────────

async function initAppLifecycle(): Promise<void> {
    if (!isPluginAvailable('App')) return;

    const { App } = await import('@capacitor/app');

    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
            window.history.back();
        } else {
            // At root — minimize the app instead of closing
            App.minimizeApp();
        }
    });

    // Handle app state changes (background/foreground)
    App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
            console.log('[Capacitor] App returned to foreground');
            // Could trigger data refresh here
        } else {
            console.log('[Capacitor] App moved to background');
        }
    });

    // Handle deep links / URL opens
    App.addListener('appUrlOpen', ({ url }) => {
        console.log('[Capacitor] App opened with URL:', url);
        // Parse deep link and navigate
        const path = new URL(url).pathname;
        if (path) {
            window.location.hash = `#${path}`;
        }
    });
}

// ─── Keyboard ───────────────────────────────────────────────────────

async function initKeyboard(): Promise<void> {
    if (!isPluginAvailable('Keyboard')) return;

    const { Keyboard } = await import('@capacitor/keyboard');

    // Adjust scroll when keyboard opens (prevents content from being hidden)
    Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.removeProperty('--keyboard-height');
        document.body.classList.remove('keyboard-open');
    });
}
