/**
 * Native Biometric Authentication Service
 * 
 * Provides fingerprint/face authentication with platform-aware behavior:
 * - Native (Android/iOS): Uses capacitor-native-biometric for hardware biometrics
 * - Web: Falls back to Web Authentication API (WebAuthn) or disabled
 * 
 * Biometric auth is OPTIONAL — users can enable/disable it in settings.
 * When enabled, it provides quick re-authentication after initial login.
 * 
 * @module nativeBiometricService
 */

import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { isNativePlatform, isPluginAvailable } from '@/utils/capacitorPlatform';

const BIOMETRIC_PREF_KEY = 'accreditex_biometric_enabled';
const CREDENTIALS_SERVER = 'com.accreditex.app';

export interface BiometricStatus {
    /** Whether biometric hardware is available on this device */
    isAvailable: boolean;
    /** Type of biometric available */
    biometryType: 'fingerprint' | 'face' | 'iris' | 'multiple' | 'none';
    /** Whether the user has enabled biometric login */
    isEnabled: boolean;
    /** Human-readable description */
    description: string;
}

/**
 * Check if native biometric authentication is available on this device
 */
export const checkBiometricAvailability = async (): Promise<BiometricStatus> => {
    // Not available on web
    if (!isNativePlatform() || !isPluginAvailable('NativeBiometric')) {
        return {
            isAvailable: false,
            biometryType: 'none',
            isEnabled: false,
            description: 'Biometric authentication is not available on web',
        };
    }

    try {
        const result = await NativeBiometric.isAvailable();
        const biometryType = mapBiometryType(result.biometryType);
        const isEnabled = isBiometricEnabled();

        return {
            isAvailable: true,
            biometryType,
            isEnabled,
            description: getBiometricDescription(biometryType),
        };
    } catch (error) {
        console.warn('[Biometric] Availability check failed:', error);
        return {
            isAvailable: false,
            biometryType: 'none',
            isEnabled: false,
            description: 'Biometric hardware not detected',
        };
    }
};

/**
 * Prompt the user for biometric verification.
 * Returns true if authentication succeeded, false otherwise.
 */
export const verifyBiometric = async (reason?: string): Promise<boolean> => {
    if (!isNativePlatform()) return false;

    try {
        await NativeBiometric.verifyIdentity({
            reason: reason || 'Verify your identity to access AccreditEx',
            title: 'AccreditEx Login',
            subtitle: 'Use biometrics to sign in',
            description: reason || 'Place your finger on the sensor or look at the camera',
            negativeButtonText: 'Use Password',
            maxAttempts: 3,
        });
        return true;
    } catch (error: any) {
        // User cancelled or failed
        console.log('[Biometric] Verification failed or cancelled:', error?.message);
        return false;
    }
};

/**
 * Store user credentials securely using the device keychain/keystore.
 * Called after successful email/password login when biometric is enabled.
 */
export const storeCredentials = async (email: string, password: string): Promise<void> => {
    if (!isNativePlatform()) return;

    try {
        await NativeBiometric.setCredentials({
            username: email,
            password: password,
            server: CREDENTIALS_SERVER,
        });
        console.log('[Biometric] Credentials stored securely');
    } catch (error) {
        console.error('[Biometric] Failed to store credentials:', error);
        throw error;
    }
};

/**
 * Retrieve stored credentials after successful biometric verification.
 * Returns null if no credentials are stored.
 */
export const getStoredCredentials = async (): Promise<{ email: string; password: string } | null> => {
    if (!isNativePlatform()) return null;

    try {
        const credentials = await NativeBiometric.getCredentials({
            server: CREDENTIALS_SERVER,
        });
        return {
            email: credentials.username,
            password: credentials.password,
        };
    } catch (error) {
        console.log('[Biometric] No stored credentials found');
        return null;
    }
};

/**
 * Delete stored credentials (called when user disables biometric or logs out)
 */
export const deleteStoredCredentials = async (): Promise<void> => {
    if (!isNativePlatform()) return;

    try {
        await NativeBiometric.deleteCredentials({
            server: CREDENTIALS_SERVER,
        });
        console.log('[Biometric] Credentials deleted');
    } catch {
        // Credentials may not exist — ignore
    }
};

/**
 * Perform biometric login flow:
 * 1. Verify biometric (fingerprint/face)
 * 2. Retrieve stored credentials
 * 3. Return credentials for Firebase Auth login
 */
export const biometricLogin = async (): Promise<{ email: string; password: string } | null> => {
    // First verify biometric identity
    const verified = await verifyBiometric('Sign in to AccreditEx');
    if (!verified) return null;

    // Retrieve stored credentials
    const credentials = await getStoredCredentials();
    if (!credentials) {
        console.warn('[Biometric] Verified but no stored credentials');
        return null;
    }

    return credentials;
};

/**
 * Enable biometric login for the current user.
 * Must be called after a successful email/password login.
 */
export const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    try {
        // First check if biometric is available
        const status = await checkBiometricAvailability();
        if (!status.isAvailable) return false;

        // Store credentials securely
        await storeCredentials(email, password);

        // Save preference
        localStorage.setItem(BIOMETRIC_PREF_KEY, 'true');
        return true;
    } catch (error) {
        console.error('[Biometric] Failed to enable:', error);
        return false;
    }
};

/**
 * Disable biometric login
 */
export const disableBiometric = async (): Promise<void> => {
    await deleteStoredCredentials();
    localStorage.removeItem(BIOMETRIC_PREF_KEY);
};

/**
 * Check if the user has enabled biometric login
 */
export const isBiometricEnabled = (): boolean => {
    try {
        return localStorage.getItem(BIOMETRIC_PREF_KEY) === 'true';
    } catch {
        return false;
    }
};

// ─── Internal Helpers ───────────────────────────────────────────────

function mapBiometryType(type: BiometryType): BiometricStatus['biometryType'] {
    switch (type) {
        case BiometryType.FINGERPRINT:
            return 'fingerprint';
        case BiometryType.FACE_AUTHENTICATION:
            return 'face';
        case BiometryType.IRIS_AUTHENTICATION:
            return 'iris';
        case BiometryType.MULTIPLE:
            return 'multiple';
        default:
            return 'none';
    }
}

function getBiometricDescription(type: BiometricStatus['biometryType']): string {
    switch (type) {
        case 'fingerprint':
            return 'Fingerprint authentication available';
        case 'face':
            return 'Face recognition available';
        case 'iris':
            return 'Iris authentication available';
        case 'multiple':
            return 'Multiple biometric methods available';
        default:
            return 'No biometric authentication available';
    }
}
