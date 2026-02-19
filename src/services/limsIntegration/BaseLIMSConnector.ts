/**
 * Base LIMS Connector Class
 * Abstract base class for all LIMS connectors with common functionality
 * Mirrors BaseHISConnector pattern with lab-specific methods
 */

import {
    LIMSConnector,
    LIMSConfig,
    LIMSSyncStatusInfo,
    LIMSHealthCheckResult,
    LIMSQueryFilters,
    LabResult,
    Specimen,
    LabOrder,
    QCData,
    SyncStatus,
    SyncError,
} from './types';

export abstract class BaseLIMSConnector implements LIMSConnector {
    config: LIMSConfig;
    protected isConnected: boolean = false;
    protected lastError: Error | null = null;
    protected syncErrors: SyncError[] = [];
    protected lastSyncDuration: number = 0;

    constructor(config: LIMSConfig) {
        this.config = config;
        this.validateConfig();
    }

    protected validateConfig(): void {
        if (!this.config.baseUrl) {
            throw new Error('LIMS configuration missing baseUrl');
        }
        if (!this.config.name) {
            throw new Error('LIMS configuration missing name');
        }
    }

    // ── Abstract methods — implemented by subclasses ────────

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]>;
    abstract fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]>;
    abstract fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]>;
    abstract fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]>;

    // ── Common methods ─────────────────────────────────────

    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            await this.connect();
            const health = await this.healthCheck();
            await this.disconnect();
            return {
                success: health.status !== 'unhealthy',
                message: health.message,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Connection failed';
            this.logError('Connection test failed', message);
            return { success: false, message };
        }
    }

    async getSyncStatus(): Promise<LIMSSyncStatusInfo> {
        return {
            lastSync: this.config.lastSyncAt || null,
            status: this.isConnected ? SyncStatus.IDLE : SyncStatus.ERROR,
            recordsSynced: 0,
            errors: this.syncErrors.slice(-10),
            duration: this.lastSyncDuration,
            nextSyncAt: this.calculateNextSyncTime(),
        };
    }

    async healthCheck(): Promise<LIMSHealthCheckResult> {
        const checks = { connectivity: false, authentication: false, dataAccess: false, qcEndpoint: false };
        const messages: string[] = [];

        try {
            await this.connect();
            checks.connectivity = true;
        } catch {
            messages.push('Connection failed');
            return { status: 'unhealthy', checks, lastCheck: new Date(), message: messages.join('; ') || 'Unhealthy' };
        }

        try {
            // Try a minimal fetch to verify auth + data access
            await this.fetchResults({ limit: 1 });
            checks.authentication = true;
            checks.dataAccess = true;
        } catch {
            messages.push('Authentication or data access failed');
        }

        if (this.config.qcSyncEnabled) {
            try {
                await this.fetchQCData({ limit: 1 });
                checks.qcEndpoint = true;
            } catch {
                messages.push('QC endpoint unavailable');
            }
        } else {
            checks.qcEndpoint = true; // not applicable
        }

        const allPassed = Object.values(checks).every(Boolean);
        const somePassed = Object.values(checks).some(Boolean);

        return {
            status: allPassed ? 'healthy' : somePassed ? 'degraded' : 'unhealthy',
            checks,
            lastCheck: new Date(),
            message: messages.length ? messages.join('; ') : 'All systems operational',
        };
    }

    // ── Helper methods ─────────────────────────────────────

    protected getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        switch (this.config.authType) {
            case 'api_key':
                if (this.config.apiKey) headers['X-API-Key'] = this.config.apiKey;
                break;
            case 'bearer_token':
                if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;
                break;
            case 'basic':
                if (this.config.username && this.config.password) {
                    const encoded = btoa(`${this.config.username}:${this.config.password}`);
                    headers['Authorization'] = `Basic ${encoded}`;
                }
                break;
            case 'oauth2':
                // OAuth token managed by connect() — subclass sets accessToken
                break;
        }

        if (this.config.customHeaders) {
            Object.assign(headers, this.config.customHeaders);
        }

        return headers;
    }

    protected buildQueryString(filters?: LIMSQueryFilters): string {
        if (!filters) return '';
        const params = new URLSearchParams();
        if (filters.dateFrom) params.set('date_from', filters.dateFrom.toISOString());
        if (filters.dateTo) params.set('date_to', filters.dateTo.toISOString());
        if (filters.labSection) params.set('lab_section', filters.labSection);
        if (filters.status) params.set('status', filters.status);
        if (filters.instrumentId) params.set('instrument_id', filters.instrumentId);
        if (filters.testCode) params.set('test_code', filters.testCode);
        if (filters.limit) params.set('limit', String(filters.limit));
        if (filters.offset) params.set('offset', String(filters.offset));
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }

    protected calculateNextSyncTime(): Date | undefined {
        if (!this.config.syncInterval || !this.config.lastSyncAt) return undefined;
        return new Date(
            new Date(this.config.lastSyncAt).getTime() + this.config.syncInterval * 60000,
        );
    }

    protected logMessage(message: string): void {
        console.log(`[LIMS:${this.config.name}] ${message}`);
    }

    protected logError(context: string, message: string): void {
        console.error(`[LIMS:${this.config.name}] ${context}: ${message}`);
        this.syncErrors.push({
            timestamp: new Date(),
            resource: context,
            error: message,
            recoverable: true,
        });
    }
}
