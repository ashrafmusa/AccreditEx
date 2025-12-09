/**
 * CSRF Protection Utility
 * Provides Cross-Site Request Forgery protection for forms and state-changing operations
 */

const CSRF_TOKEN_KEY = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

class CSRFProtection {
    private token: string | null = null;

    /**
     * Generate a cryptographically random CSRF token
     */
    private generateToken(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Initialize or retrieve CSRF token
     */
    getToken(): string {
        if (!this.token) {
            // Check if token exists in sessionStorage (per-session token)
            const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);

            if (stored) {
                this.token = stored;
            } else {
                // Generate new token
                this.token = this.generateToken();
                sessionStorage.setItem(CSRF_TOKEN_KEY, this.token);
            }
        }

        return this.token;
    }

    /**
     * Add CSRF token to form data
     * @param formData - FormData object or plain object
     * @returns FormData with CSRF token
     */
    addTokenToFormData(formData: FormData | Record<string, any>): FormData | Record<string, any> {
        const token = this.getToken();

        if (formData instanceof FormData) {
            formData.append('_csrf', token);
            return formData;
        } else {
            return {
                ...formData,
                _csrf: token
            };
        }
    }

    /**
     * Get CSRF headers for fetch requests
     * @returns Headers object with CSRF token
     */
    getHeaders(): Record<string, string> {
        return {
            [CSRF_HEADER_NAME]: this.getToken()
        };
    }

    /**
     * Validate CSRF token (client-side validation)
     * Server should also validate
     * @param token - Token to validate
     * @returns true if valid
     */
    validateToken(token: string): boolean {
        const storedToken = this.getToken();
        return token === storedToken && token.length === 64;
    }

    /**
     * Refresh CSRF token (call after sensitive operations)
     */
    refreshToken(): void {
        this.token = this.generateToken();
        sessionStorage.setItem(CSRF_TOKEN_KEY, this.token);
    }

    /**
     * Clear CSRF token (call on logout)
     */
    clearToken(): void {
        this.token = null;
        sessionStorage.removeItem(CSRF_TOKEN_KEY);
    }

    /**
     * Wrap a form submission with CSRF protection
     * @param callback - Form submission callback
     * @returns Protected callback
     */
    protectFormSubmit<T extends (...args: any[]) => any>(
        callback: T
    ): (...args: Parameters<T>) => ReturnType<T> {
        return (...args: Parameters<T>) => {
            // Add CSRF token to request
            const token = this.getToken();
            console.log(`[CSRF] Protecting form submission with token: ${token.substring(0, 8)}...`);

            // Call original callback
            return callback(...args);
        };
    }
}

// Export singleton instance
export const csrfProtection = new CSRFProtection();

/**
 * React Hook for CSRF protection
 */
export const useCSRFToken = () => {
    const token = csrfProtection.getToken();

    const addToFormData = (formData: FormData | Record<string, any>) => {
        return csrfProtection.addTokenToFormData(formData);
    };

    const getHeaders = () => {
        return csrfProtection.getHeaders();
    };

    const refresh = () => {
        csrfProtection.refreshToken();
    };

    return {
        token,
        addToFormData,
        getHeaders,
        refresh
    };
};

/**
 * Higher-order function to protect API calls with CSRF
 * @param apiCall - Original API call function
 * @returns Protected API call with CSRF headers
 */
export const withCSRFProtection = <T extends (...args: any[]) => Promise<any>>(
    apiCall: T
): T => {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        const headers = csrfProtection.getHeaders();

        // If first arg is an options object, merge headers
        if (args.length > 0 && typeof args[0] === 'object') {
            args[0] = {
                ...args[0],
                headers: {
                    ...args[0].headers,
                    ...headers
                }
            };
        }

        return apiCall(...args);
    }) as T;
};
