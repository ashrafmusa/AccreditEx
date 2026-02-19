/**
 * Generic REST LIMS Connector
 * Connects to any REST-based LIMS through a conventional API contract
 * Endpoint convention: /api/results, /api/specimens, /api/orders, /api/qc
 */

import { BaseLIMSConnector } from '../BaseLIMSConnector';
import {
    LIMSQueryFilters,
    LabResult,
    Specimen,
    LabOrder,
    QCData,
} from '../types';

export class GenericRESTLIMSConnector extends BaseLIMSConnector {
    private accessToken: string | null = null;

    async connect(): Promise<void> {
        try {
            this.logMessage('Attempting connection');
            if (this.config.authType === 'oauth2') {
                await this.authenticateOAuth();
            } else if (this.config.authType === 'api_key' || this.config.authType === 'bearer_token') {
                this.accessToken = this.config.apiKey || null;
            }
            this.isConnected = true;
            this.logMessage('Connected');
        } catch (error) {
            this.logError('Connection', error instanceof Error ? error.message : String(error));
            throw new Error(`Failed to connect to ${this.config.name}: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        this.accessToken = null;
        this.isConnected = false;
        this.logMessage('Disconnected');
    }

    async fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]> {
        return this.fetchEndpoint<LabResult>('/api/results', filters);
    }

    async fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]> {
        return this.fetchEndpoint<Specimen>('/api/specimens', filters);
    }

    async fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]> {
        return this.fetchEndpoint<LabOrder>('/api/orders', filters);
    }

    async fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]> {
        return this.fetchEndpoint<QCData>('/api/qc', filters);
    }

    // ── Internal ───────────────────────────────────────────

    private async fetchEndpoint<T>(path: string, filters?: LIMSQueryFilters): Promise<T[]> {
        if (!this.isConnected) await this.connect();
        const url = `${this.config.baseUrl}${path}${this.buildQueryString(filters)}`;
        const headers = this.getAuthHeaders();
        if (this.accessToken && this.config.authType === 'oauth2') {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(this.config.timeout || 30000),
        });
        if (!response.ok) {
            throw new Error(`LIMS API error ${response.status}: ${response.statusText}`);
        }
        const json = await response.json();
        return Array.isArray(json) ? json : json.data ?? json.results ?? [];
    }

    private async authenticateOAuth(): Promise<void> {
        if (!this.config.clientId || !this.config.clientSecret) {
            throw new Error('OAuth2 requires clientId and clientSecret');
        }
        const tokenUrl = `${this.config.baseUrl}/oauth/token`;
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
            }),
        });
        if (!response.ok) throw new Error('OAuth2 authentication failed');
        const data = await response.json();
        this.accessToken = data.access_token;
    }
}
