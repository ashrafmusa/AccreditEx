/**
 * Generic HL7 v2 LIMS Connector
 * Sends HL7 v2 messages over HTTP/REST wrapper to LIMS systems
 * Many legacy LIMS expose HL7 message formats via REST gateway
 */

import { BaseLIMSConnector } from '../BaseLIMSConnector';
import { LIMSQueryFilters, LabResult, Specimen, LabOrder, QCData } from '../types';

export class GenericHL7LIMSConnector extends BaseLIMSConnector {
    async connect(): Promise<void> {
        try {
            this.logMessage('Connecting to HL7 LIMS gateway');
            const response = await fetch(`${this.config.baseUrl}/hl7/status`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                signal: AbortSignal.timeout(this.config.timeout || 15000),
            });
            if (!response.ok) throw new Error(`HL7 gateway connection failed: ${response.status}`);
            this.isConnected = true;
            this.logMessage('Connected to HL7 gateway');
        } catch (error) {
            this.logError('HL7 connection', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
        this.logMessage('Disconnected from HL7 gateway');
    }

    async fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]> {
        return this.hl7Fetch('/hl7/oru', 'ORU^R01', filters);
    }

    async fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]> {
        return this.hl7Fetch('/hl7/oml', 'OML^O21', filters);
    }

    async fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]> {
        return this.hl7Fetch('/hl7/orm', 'ORM^O01', filters);
    }

    async fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]> {
        return this.hl7Fetch('/hl7/qc', 'QCData', filters);
    }

    private async hl7Fetch<T>(path: string, _messageType: string, filters?: LIMSQueryFilters): Promise<T[]> {
        if (!this.isConnected) await this.connect();
        const url = `${this.config.baseUrl}${path}${this.buildQueryString(filters)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...this.getAuthHeaders(),
                'X-HL7-Accept': 'application/json', // Request JSON-translated HL7
            },
            signal: AbortSignal.timeout(this.config.timeout || 30000),
        });
        if (!response.ok) throw new Error(`HL7 Gateway ${response.status}: ${response.statusText}`);
        const json = await response.json();
        return json.data ?? json.records ?? [];
    }
}
