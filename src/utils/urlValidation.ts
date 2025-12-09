/**
 * URL Validation Utility
 * Prevents open redirect vulnerabilities by validating URLs before navigation
 */

/**
 * Check if a URL is safe for internal navigation
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
export const isSafeUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') {
        return false;
    }

    // Remove leading/trailing whitespace
    const trimmedUrl = url.trim();

    // Block javascript: and data: protocols
    if (/^(javascript|data|vbscript|file):/i.test(trimmedUrl)) {
        return false;
    }

    // Allow relative paths (starting with /)
    if (trimmedUrl.startsWith('/')) {
        return true;
    }

    // Allow hash navigation
    if (trimmedUrl.startsWith('#')) {
        return true;
    }

    // For absolute URLs, validate the origin
    try {
        const urlObj = new URL(trimmedUrl, window.location.origin);
        const currentOrigin = window.location.origin;

        // Only allow same-origin URLs
        return urlObj.origin === currentOrigin;
    } catch (error) {
        // Invalid URL format
        return false;
    }
};

/**
 * Safely navigate to a URL after validation
 * @param url - The URL to navigate to
 * @returns true if navigation was performed, false if blocked
 */
export const safeNavigate = (url: string): boolean => {
    if (!isSafeUrl(url)) {
        console.warn(`[Security] Blocked navigation to potentially unsafe URL: ${url}`);
        return false;
    }

    window.location.href = url;
    return true;
};

/**
 * Get a sanitized URL for display or href attributes
 * Returns null if the URL is not safe
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null
 */
export const getSafeUrl = (url: string): string | null => {
    return isSafeUrl(url) ? url : null;
};

/**
 * Validate and normalize a redirect URL
 * @param url - The URL to validate
 * @param fallbackUrl - Fallback URL if validation fails (default: '/')
 * @returns Safe URL or fallback
 */
export const validateRedirectUrl = (url: string, fallbackUrl: string = '/'): string => {
    return isSafeUrl(url) ? url : fallbackUrl;
};
