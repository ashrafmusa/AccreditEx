import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.accreditex.app',
    appName: 'AccreditEx',
    webDir: 'dist',
    // Use the live Firebase Hosting URL for the web view in development
    // Comment out for production builds (will use local dist/ folder)
    // server: {
    //   url: 'https://accreditex.web.app',
    //   cleartext: true,
    // },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#ffffff',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        Camera: {
            // Use photo quality (0-100)
            quality: 80,
        },
        Keyboard: {
            resize: 'body' as any,
            style: 'dark' as any,
            resizeOnFullScreen: true,
        },
        StatusBar: {
            style: 'dark',
            backgroundColor: '#4f46e5',
        },
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystorePassword: undefined,
            keystoreAlias: undefined,
            keystoreAliasPassword: undefined,
            releaseType: 'APK',
        },
    },
    ios: {
        contentInset: 'automatic',
        scheme: 'AccreditEx',
    },
};

export default config;
