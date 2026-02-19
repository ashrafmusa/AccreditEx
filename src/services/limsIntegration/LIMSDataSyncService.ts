/**
 * LIMS Data Sync Service
 * Orchestrates data synchronization from LIMS systems into AccreditEx
 * Imports results, specimens, orders, and QC data for compliance evidence linkage
 */

import {
    LIMSConfig,
    LIMSConnector,
    LIMSSyncResult,
    LIMSIntegrationLog,
    LIMSQueryFilters,
    LabResult,
    Specimen,
    LabOrder,
    QCData,
    SyncStatus,
} from './types';
import { LIMSConnectorFactory } from './LIMSConnectorFactory';

export class LIMSDataSyncService {
    private connectors: Map<string, LIMSConnector> = new Map();
    private syncHistory: LIMSSyncResult[] = [];
    private logs: LIMSIntegrationLog[] = [];

    /**
     * Initialize a connector for a LIMS config
     */
    getConnector(config: LIMSConfig): LIMSConnector {
        let connector = this.connectors.get(config.id);
        if (!connector) {
            connector = LIMSConnectorFactory.createConnector(config);
            this.connectors.set(config.id, connector);
        }
        return connector;
    }

    /**
     * Run a full sync for a LIMS configuration
     * Returns counts of each resource type imported
     */
    async syncAll(config: LIMSConfig, filters?: LIMSQueryFilters): Promise<LIMSSyncResult> {
        const startTime = new Date();
        const connector = this.getConnector(config);

        this.addLog(config, 'sync_start', 'info', 'Starting full LIMS sync');

        let resultsImported = 0;
        let specimensImported = 0;
        let ordersImported = 0;
        let qcDataImported = 0;
        let errorCount = 0;
        const errors: { timestamp: Date; resource: string; error: string; recoverable: boolean }[] = [];

        try {
            await connector.connect();

            // Sync results
            try {
                const results = await connector.fetchResults(filters);
                resultsImported = results.length;
                this.addLog(config, 'data_received', 'success', `Imported ${results.length} lab results`, 'results', results.length);
            } catch (err) {
                errorCount++;
                errors.push({ timestamp: new Date(), resource: 'results', error: String(err), recoverable: true });
                this.addLog(config, 'sync_error', 'error', `Failed to fetch results: ${err}`, 'results');
            }

            // Sync specimens
            if (config.specimenSyncEnabled !== false) {
                try {
                    const specimens = await connector.fetchSpecimens(filters);
                    specimensImported = specimens.length;
                    this.addLog(config, 'data_received', 'success', `Imported ${specimens.length} specimens`, 'specimens', specimens.length);
                } catch (err) {
                    errorCount++;
                    errors.push({ timestamp: new Date(), resource: 'specimens', error: String(err), recoverable: true });
                    this.addLog(config, 'sync_error', 'error', `Failed to fetch specimens: ${err}`, 'specimens');
                }
            }

            // Sync orders
            if (config.orderSyncEnabled !== false) {
                try {
                    const orders = await connector.fetchOrders(filters);
                    ordersImported = orders.length;
                    this.addLog(config, 'data_received', 'success', `Imported ${orders.length} orders`, 'orders', orders.length);
                } catch (err) {
                    errorCount++;
                    errors.push({ timestamp: new Date(), resource: 'orders', error: String(err), recoverable: true });
                    this.addLog(config, 'sync_error', 'error', `Failed to fetch orders: ${err}`, 'orders');
                }
            }

            // Sync QC data
            if (config.qcSyncEnabled !== false) {
                try {
                    const qc = await connector.fetchQCData(filters);
                    qcDataImported = qc.length;
                    this.addLog(config, 'data_received', 'success', `Imported ${qc.length} QC records`, 'qcData', qc.length);
                } catch (err) {
                    errorCount++;
                    errors.push({ timestamp: new Date(), resource: 'qcData', error: String(err), recoverable: true });
                    this.addLog(config, 'sync_error', 'error', `Failed to fetch QC data: ${err}`, 'qcData');
                }
            }

            await connector.disconnect();
        } catch (err) {
            errorCount++;
            errors.push({ timestamp: new Date(), resource: 'connection', error: String(err), recoverable: false });
            this.addLog(config, 'sync_error', 'error', `Sync aborted: ${err}`);
        }

        const endTime = new Date();
        const result: LIMSSyncResult = {
            limsId: config.id,
            startTime,
            endTime,
            status: errorCount > 0 ? SyncStatus.ERROR : SyncStatus.SUCCESS,
            resultsImported,
            specimensImported,
            ordersImported,
            qcDataImported,
            errorCount,
            errors,
        };

        this.syncHistory.push(result);
        this.addLog(
            config,
            'sync_complete',
            errorCount > 0 ? 'warning' : 'success',
            `Sync completed: ${resultsImported} results, ${specimensImported} specimens, ${ordersImported} orders, ${qcDataImported} QC records. ${errorCount} error(s).`,
            undefined,
            resultsImported + specimensImported + ordersImported + qcDataImported,
            endTime.getTime() - startTime.getTime(),
        );

        return result;
    }

    /**
     * Fetch only lab results
     */
    async fetchResults(config: LIMSConfig, filters?: LIMSQueryFilters): Promise<LabResult[]> {
        const connector = this.getConnector(config);
        await connector.connect();
        const results = await connector.fetchResults(filters);
        await connector.disconnect();
        return results;
    }

    /**
     * Fetch only QC data (for Westgard rule evaluation, Levey-Jennings charting)
     */
    async fetchQCData(config: LIMSConfig, filters?: LIMSQueryFilters): Promise<QCData[]> {
        const connector = this.getConnector(config);
        await connector.connect();
        const qc = await connector.fetchQCData(filters);
        await connector.disconnect();
        return qc;
    }

    /**
     * Fetch only specimens
     */
    async fetchSpecimens(config: LIMSConfig, filters?: LIMSQueryFilters): Promise<Specimen[]> {
        const connector = this.getConnector(config);
        await connector.connect();
        const specimens = await connector.fetchSpecimens(filters);
        await connector.disconnect();
        return specimens;
    }

    /**
     * Test connection to a LIMS
     */
    async testConnection(config: LIMSConfig): Promise<{ success: boolean; message: string }> {
        const connector = this.getConnector(config);
        return connector.testConnection();
    }

    /**
     * Get sync history (last N)
     */
    getSyncHistory(limit = 50): LIMSSyncResult[] {
        return this.syncHistory.slice(-limit);
    }

    /**
     * Get integration logs (last N)
     */
    getLogs(limit = 100): LIMSIntegrationLog[] {
        return this.logs.slice(-limit);
    }

    private addLog(
        config: LIMSConfig,
        action: LIMSIntegrationLog['action'],
        status: LIMSIntegrationLog['status'],
        message: string,
        resourceType?: LIMSIntegrationLog['resourceType'],
        recordCount?: number,
        duration?: number,
    ) {
        this.logs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            limsId: config.id,
            limsName: config.name,
            action,
            resourceType,
            status,
            recordCount,
            message,
            timestamp: new Date(),
            duration,
        });
    }
}

/** Singleton instance */
export const limsDataSyncService = new LIMSDataSyncService();
