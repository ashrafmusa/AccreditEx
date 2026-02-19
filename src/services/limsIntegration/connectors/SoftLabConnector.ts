/**
 * SoftLab LIMS Connector
 * Connects to SoftLab LIS via its proprietary REST API
 * SoftLab uses /lab-api/v2/ prefix and returns results in { items: [...] } envelope
 */

import { BaseLIMSConnector } from '../BaseLIMSConnector';
import { LIMSQueryFilters, LabResult, Specimen, LabOrder, QCData } from '../types';

export class SoftLabConnector extends BaseLIMSConnector {
    private sessionToken: string | null = null;

    async connect(): Promise<void> {
        try {
            this.logMessage('Connecting to SoftLab');
            const response = await fetch(`${this.config.baseUrl}/lab-api/v2/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.config.username,
                    password: this.config.password,
                    apiKey: this.config.apiKey,
                }),
            });
            if (!response.ok) throw new Error(`SoftLab auth failed: ${response.status}`);
            const data = await response.json();
            this.sessionToken = data.sessionToken || data.token;
            this.isConnected = true;
            this.logMessage('Connected to SoftLab');
        } catch (error) {
            this.logError('SoftLab connection', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.sessionToken) {
            try {
                await fetch(`${this.config.baseUrl}/lab-api/v2/auth/logout`, {
                    method: 'POST',
                    headers: { 'X-Session-Token': this.sessionToken },
                });
            } catch { /* best-effort */ }
        }
        this.sessionToken = null;
        this.isConnected = false;
    }

    async fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]> {
        return this.softLabFetch('/lab-api/v2/results', filters);
    }

    async fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]> {
        return this.softLabFetch('/lab-api/v2/specimens', filters);
    }

    async fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]> {
        return this.softLabFetch('/lab-api/v2/orders', filters);
    }

    async fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]> {
        return this.softLabFetch('/lab-api/v2/quality-control', filters);
    }

    private async softLabFetch<T>(path: string, filters?: LIMSQueryFilters): Promise<T[]> {
        if (!this.isConnected) await this.connect();
        const url = `${this.config.baseUrl}${path}${this.buildQueryString(filters)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...this.getAuthHeaders(),
                'X-Session-Token': this.sessionToken || '',
            },
            signal: AbortSignal.timeout(this.config.timeout || 30000),
        });
        if (!response.ok) throw new Error(`SoftLab API ${response.status}: ${response.statusText}`);
        const json = await response.json();
        return json.items ?? json.data ?? [];
    }
}
