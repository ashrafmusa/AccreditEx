/**
 * Orchard LIS Connector
 * Connects to Orchard Harvest LIS via REST API
 * Orchard uses /orch/api/ prefix
 */

import { BaseLIMSConnector } from '../BaseLIMSConnector';
import { LIMSQueryFilters, LabResult, Specimen, LabOrder, QCData } from '../types';

export class OrchardConnector extends BaseLIMSConnector {
    async connect(): Promise<void> {
        try {
            this.logMessage('Connecting to Orchard LIS');
            const response = await fetch(`${this.config.baseUrl}/orch/api/status`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                signal: AbortSignal.timeout(this.config.timeout || 15000),
            });
            if (!response.ok) throw new Error(`Orchard connection failed: ${response.status}`);
            this.isConnected = true;
            this.logMessage('Connected to Orchard');
        } catch (error) {
            this.logError('Orchard connection', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
        this.logMessage('Disconnected from Orchard');
    }

    async fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]> {
        return this.orchardFetch('/orch/api/results', filters);
    }

    async fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]> {
        return this.orchardFetch('/orch/api/specimens', filters);
    }

    async fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]> {
        return this.orchardFetch('/orch/api/orders', filters);
    }

    async fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]> {
        return this.orchardFetch('/orch/api/quality-control', filters);
    }

    private async orchardFetch<T>(path: string, filters?: LIMSQueryFilters): Promise<T[]> {
        if (!this.isConnected) await this.connect();
        const url = `${this.config.baseUrl}${path}${this.buildQueryString(filters)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getAuthHeaders(),
            signal: AbortSignal.timeout(this.config.timeout || 30000),
        });
        if (!response.ok) throw new Error(`Orchard API ${response.status}: ${response.statusText}`);
        const json = await response.json();
        return json.data ?? json.records ?? [];
    }
}
