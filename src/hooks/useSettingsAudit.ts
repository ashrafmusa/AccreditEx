import { logSettingsChange } from '@/services/settingsAuditService';
import { useUserStore } from '@/stores/useUserStore';

/**
 * Hook that provides a convenient audit logging function for settings changes.
 * Automatically includes the current user's id and name.
 *
 * Usage:
 *   const auditLog = useSettingsAudit();
 *   await auditLog('general', 'appName', oldValue, newValue);
 */
export function useSettingsAudit() {
    const currentUser = useUserStore((state) => state.currentUser);

    /**
     * Log a settings change to the audit trail.
     * @param category - Settings category (e.g., 'general', 'security', 'users')
     * @param field - The specific field changed (e.g., 'appName', 'minLength')
     * @param oldValue - Previous value
     * @param newValue - New value
     * @param action - Type of action (default 'update')
     */
    const auditLog = async (
        category: string,
        field: string,
        oldValue: unknown,
        newValue: unknown,
        action: 'create' | 'update' | 'delete' | 'export' | 'import' = 'update'
    ): Promise<void> => {
        if (!currentUser) return;
        try {
            await logSettingsChange(
                currentUser.id,
                currentUser.name,
                action,
                category,
                field,
                oldValue,
                newValue
            );
        } catch {
            // Audit logging should never block the main flow
            console.warn(`Audit log failed for ${category}.${field}`);
        }
    };

    /**
     * Log multiple field changes at once (batch audit).
     */
    const auditBatch = async (
        category: string,
        changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>,
        action: 'create' | 'update' | 'delete' | 'export' | 'import' = 'update'
    ): Promise<void> => {
        const changedFields = changes.filter(
            (c) => JSON.stringify(c.oldValue) !== JSON.stringify(c.newValue)
        );
        await Promise.allSettled(
            changedFields.map((c) => auditLog(category, c.field, c.oldValue, c.newValue, action))
        );
    };

    return { auditLog, auditBatch };
}
