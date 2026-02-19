/**
 * Sunquest LIS Connector
 * Connects to Sunquest LIS via REST API
 * Sunquest uses /sunquest/api/v1/ prefix
 */

import { BaseLIMSConnector } from '../BaseLIMSConnector';
import { LIMSQueryFilters, LabResult, Specimen, LabOrder, QCData } from '../types';

export class SunquestConnector extends BaseLIMSConnector {
    async connect(): Promise<void> {
        try {
            this.logMessage('Connecting to Sunquest');
            const headers = this.getAuthHeaders();
            const response = await fetch(`${this.config.baseUrl}/sunquest/api/v1/ping`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(this.config.timeout || 15000),
            });
            if (!response.ok) throw new Error(`Sunquest connection failed: ${response.status}`);
            this.isConnected = true;
            this.logMessage('Connected to Sunquest');
        } catch (error) {
            this.logError('Sunquest connection', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
        this.logMessage('Disconnected from Sunquest');
    }

    async fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]> {
        return this.sunquestFetch('/sunquest/api/v1/lab-results', filters);
    }

    async fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]> {
        return this.sunquestFetch('/sunquest/api/v1/specimens', filters);
    }

    async fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]> {
        return this.sunquestFetch('/sunquest/api/v1/lab-orders', filters);
    }

    async fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]> {
        return this.sunquestFetch('/sunquest/api/v1/qc-data', filters);
    }

    private async sunquestFetch<T>(path: string, filters?: LIMSQueryFilters): Promise<T[]> {
        if (!this.isConnected) await this.connect();
        const url = `${this.config.baseUrl}${path}${this.buildQueryString(filters)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getAuthHeaders(),
            signal: AbortSignal.timeout(this.config.timeout || 30000),
        });
        if (!response.ok) throw new Error(`Sunquest API ${response.status}: ${response.statusText}`);
        const json = await response.json();
        return json.results ?? json.data ?? [];
    }
}
