/**
 * Native Camera Service
 * 
 * Provides camera access for evidence capture with automatic fallback:
 * - Native: Uses @capacitor/camera for direct camera/gallery access
 * - Web: Falls back to HTML file input for photo capture
 * 
 * Captured photos are uploaded to Firebase Storage via StorageService.
 * 
 * @module nativeCameraService
 */

import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { isNativePlatform, isPluginAvailable } from '@/utils/capacitorPlatform';

export interface CapturedPhoto {
    /** Base64-encoded image data (without prefix) */
    base64Data: string;
    /** MIME type of the image */
    mimeType: string;
    /** File extension (e.g., 'jpeg', 'png') */
    format: string;
    /** Generated filename for storage */
    fileName: string;
    /** Blob for upload */
    blob: Blob;
}

/**
 * Check if native camera is available
 */
export const isCameraAvailable = (): boolean => {
    return isNativePlatform() && isPluginAvailable('Camera');
};

/**
 * Request camera permissions (native only)
 * On web, permissions are handled by the browser.
 */
export const requestCameraPermission = async (): Promise<boolean> => {
    if (!isCameraAvailable()) return true; // Web handles permissions via browser
    try {
        const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        return status.camera === 'granted' || status.camera === 'limited';
    } catch {
        return false;
    }
};

/**
 * Capture a photo using the native camera
 */
export const capturePhoto = async (): Promise<CapturedPhoto | null> => {
    try {
        const photo: Photo = await Camera.getPhoto({
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,
            quality: 80,
            allowEditing: false,
            correctOrientation: true,
            width: 1920,
            height: 1920,
            presentationStyle: 'fullScreen',
        });

        return processPhoto(photo);
    } catch (error: any) {
        // User cancelled
        if (error?.message?.includes('cancel') || error?.message?.includes('User cancelled')) {
            return null;
        }
        console.error('[Camera] Failed to capture photo:', error);
        throw error;
    }
};

/**
 * Pick a photo from the device gallery
 */
export const pickFromGallery = async (): Promise<CapturedPhoto | null> => {
    try {
        const photo: Photo = await Camera.getPhoto({
            resultType: CameraResultType.Base64,
            source: CameraSource.Photos,
            quality: 80,
            correctOrientation: true,
            width: 1920,
            height: 1920,
        });

        return processPhoto(photo);
    } catch (error: any) {
        if (error?.message?.includes('cancel') || error?.message?.includes('User cancelled')) {
            return null;
        }
        console.error('[Camera] Failed to pick from gallery:', error);
        throw error;
    }
};

/**
 * Capture or pick — shows action sheet on native, file picker on web
 */
export const captureOrPickPhoto = async (): Promise<CapturedPhoto | null> => {
    try {
        const photo: Photo = await Camera.getPhoto({
            resultType: CameraResultType.Base64,
            source: CameraSource.Prompt, // Shows action sheet: Camera or Gallery
            quality: 80,
            correctOrientation: true,
            width: 1920,
            height: 1920,
            promptLabelHeader: 'Evidence Photo',
            promptLabelCancel: 'Cancel',
            promptLabelPhoto: 'From Gallery',
            promptLabelPicture: 'Take Photo',
        });

        return processPhoto(photo);
    } catch (error: any) {
        if (error?.message?.includes('cancel') || error?.message?.includes('User cancelled')) {
            return null;
        }
        console.error('[Camera] Failed to capture/pick photo:', error);
        throw error;
    }
};

/**
 * Web fallback: Opens a file input dialog for image selection.
 * This is used when native camera is not available (web browser).
 */
export const pickPhotoFromWeb = (): Promise<CapturedPhoto | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Prefer rear camera on mobile web

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
                resolve(null);
                return;
            }

            try {
                const base64 = await fileToBase64(file);
                const format = file.type.split('/')[1] || 'jpeg';
                const blob = file;

                resolve({
                    base64Data: base64,
                    mimeType: file.type,
                    format,
                    fileName: `evidence-${Date.now()}.${format}`,
                    blob,
                });
            } catch {
                resolve(null);
            }
        };

        input.oncancel = () => resolve(null);
        input.click();
    });
};

/**
 * Smart capture: Uses native camera on mobile, file picker on web
 */
export const smartCapturePhoto = async (): Promise<CapturedPhoto | null> => {
    if (isCameraAvailable()) {
        return captureOrPickPhoto();
    }
    return pickPhotoFromWeb();
};

// ─── Helpers ────────────────────────────────────────────────────────

function processPhoto(photo: Photo): CapturedPhoto {
    const format = photo.format || 'jpeg';
    const mimeType = `image/${format}`;
    const base64Data = photo.base64String!;
    const fileName = `evidence-${Date.now()}.${format}`;

    // Convert base64 to Blob for upload
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return { base64Data, mimeType, format, fileName, blob };
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
