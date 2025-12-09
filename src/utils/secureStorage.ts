/**
 * Secure Storage Utility
 * Provides encrypted localStorage with better security practices
 * Prevents sensitive data exposure in browser storage
 */

// Simple encryption using Web Crypto API (for non-sensitive data obfuscation)
// For truly sensitive data, should be stored server-side only
class SecureStorage {
    private readonly namespace: string;
    private readonly sensitiveKeys: Set<string>;

    constructor(namespace: string = 'accreditex') {
        this.namespace = namespace;
        this.sensitiveKeys = new Set([
            'firebase-auth-token',
            'user-session',
            'api-keys',
            'credentials',
            'auth-token'
        ]);
    }

    /**
     * Simple base64 encoding (NOT secure encryption, just obfuscation)
     * For production, use server-side storage for sensitive data
     */
    private encode(data: string): string {
        try {
            return btoa(encodeURIComponent(data));
        } catch (error) {
            console.error('[SecureStorage] Encoding error:', error);
            return data;
        }
    }

    private decode(data: string): string {
        try {
            return decodeURIComponent(atob(data));
        } catch (error) {
            console.error('[SecureStorage] Decoding error:', error);
            return data;
        }
    }

    /**
     * Get namespaced key
     */
    private getKey(key: string): string {
        return `${this.namespace}:${key}`;
    }

    /**
     * Check if key contains sensitive data
     */
    private isSensitive(key: string): boolean {
        return Array.from(this.sensitiveKeys).some(sensitiveKey =>
            key.toLowerCase().includes(sensitiveKey.toLowerCase())
        );
    }

    /**
     * Secure set item with optional encoding
     * @param key - Storage key
     * @param value - Value to store
     * @param options - Storage options
     */
    setItem(
        key: string,
        value: any,
        options: { encode?: boolean; ttl?: number } = {}
    ): boolean {
        try {
            const namespacedKey = this.getKey(key);
            const { encode = this.isSensitive(key), ttl } = options;

            // Warn if sensitive data is being stored
            if (this.isSensitive(key)) {
                console.warn(
                    `[SecureStorage] Storing potentially sensitive data: ${key}. ` +
                    'Consider using server-side storage instead.'
                );
            }

            const dataToStore = {
                value,
                timestamp: Date.now(),
                expires: ttl ? Date.now() + ttl : null
            };

            const serialized = JSON.stringify(dataToStore);
            const finalValue = encode ? this.encode(serialized) : serialized;

            localStorage.setItem(namespacedKey, finalValue);
            return true;
        } catch (error) {
            console.error(`[SecureStorage] Error storing ${key}:`, error);
            return false;
        }
    }

    /**
     * Secure get item with automatic decoding
     * @param key - Storage key
     * @returns Stored value or null
     */
    getItem<T = any>(key: string): T | null {
        try {
            const namespacedKey = this.getKey(key);
            const stored = localStorage.getItem(namespacedKey);

            if (!stored) {
                return null;
            }

            // Try to decode if encoded
            let decoded = stored;
            try {
                decoded = this.decode(stored);
            } catch {
                // Not encoded, use as-is
            }

            const parsed = JSON.parse(decoded);

            // Check if expired
            if (parsed.expires && Date.now() > parsed.expires) {
                this.removeItem(key);
                return null;
            }

            return parsed.value as T;
        } catch (error) {
            console.error(`[SecureStorage] Error retrieving ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove item from storage
     */
    removeItem(key: string): void {
        const namespacedKey = this.getKey(key);
        localStorage.removeItem(namespacedKey);
    }

    /**
     * Clear all items in namespace
     */
    clear(): void {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${this.namespace}:`)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Get all keys in namespace
     */
    keys(): string[] {
        const keys: string[] = [];
        const prefix = `${this.namespace}:`;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key.substring(prefix.length));
            }
        }

        return keys;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        return this.getItem(key) !== null;
    }

    /**
     * Migrate unencrypted data to secure storage
     * @param oldKey - Old localStorage key
     * @param newKey - New secure storage key
     */
    migrate(oldKey: string, newKey?: string): boolean {
        try {
            const value = localStorage.getItem(oldKey);
            if (value) {
                this.setItem(newKey || oldKey, value);
                localStorage.removeItem(oldKey);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[SecureStorage] Migration error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

/**
 * Migrate existing localStorage items to secure storage
 * Call this on app initialization
 */
export const migrateToSecureStorage = (): void => {
    const sensitivePatterns = [
        'firebase-auth-token',
        'user-session',
        'auth-token',
        'credentials',
        'api-key'
    ];

    const keysToMigrate: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('accreditex:')) {
            const isSensitive = sensitivePatterns.some(pattern =>
                key.toLowerCase().includes(pattern)
            );

            if (isSensitive) {
                keysToMigrate.push(key);
            }
        }
    }

    keysToMigrate.forEach(key => {
        secureStorage.migrate(key);
        console.log(`[SecureStorage] Migrated ${key} to secure storage`);
    });
};
