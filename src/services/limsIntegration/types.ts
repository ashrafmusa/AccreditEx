/**
 * LIMS Integration Types & Interfaces
 * Defines all types for Laboratory Information Management System integration
 * Mirrors the HIS integration architecture but with lab-specific data models
 */

import type { AuthType, SyncStatus, SyncError, DataMappingConfig } from '../hisIntegration/types';

// Re-export shared types
export type { SyncError, DataMappingConfig };
export { AuthType, SyncStatus } from '../hisIntegration/types';

export enum LIMSType {
    SOFTLAB = 'softlab',
    SUNQUEST = 'sunquest',
    ORCHARD = 'orchard',
    NETLIMS = 'netlims',
    LABVANTAGE = 'labvantage',
    GENERIC_REST = 'generic_rest',
    GENERIC_HL7 = 'generic_hl7',
}

export const LIMS_TYPE_LABELS: Record<LIMSType, string> = {
    [LIMSType.SOFTLAB]: 'SoftLab',
    [LIMSType.SUNQUEST]: 'Sunquest',
    [LIMSType.ORCHARD]: 'Orchard LIS',
    [LIMSType.NETLIMS]: 'NetLIMS',
    [LIMSType.LABVANTAGE]: 'LabVantage',
    [LIMSType.GENERIC_REST]: 'Generic REST API',
    [LIMSType.GENERIC_HL7]: 'Generic HL7 v2',
};

// ── Configuration ────────────────────────────────────────

export interface LIMSConfig {
    id: string;
    name: string;
    type: LIMSType;
    baseUrl: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    authType: AuthType;
    customHeaders?: Record<string, string>;
    mappingConfig?: DataMappingConfig[];
    enabled: boolean;
    syncInterval?: number; // minutes
    lastSyncAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    description?: string;
    timeout?: number; // ms
    retryCount?: number;
    retryDelay?: number; // ms
    // LIMS-specific config
    labSections?: string[]; // Which lab sections to sync (Chemistry, Hematology, etc.)
    resultStatusFilter?: LabResultStatus[]; // Only sync specific result statuses
    qcSyncEnabled?: boolean;
    specimenSyncEnabled?: boolean;
    orderSyncEnabled?: boolean;
}

// ── Lab Results ──────────────────────────────────────────

export type LabResultStatus = 'pending' | 'preliminary' | 'final' | 'corrected' | 'cancelled';
export type LabResultFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'abnormal';

export interface LabResult {
    id: string;
    limsId: string; // ID in source LIMS
    limsConfigId: string; // Which LIMS config this came from
    accessionNumber: string;
    patientId?: string;
    patientMRN?: string;
    testCode: string;
    testName: string;
    value: string;
    numericValue?: number;
    unit?: string;
    referenceRangeLow?: number;
    referenceRangeHigh?: number;
    referenceRangeText?: string;
    flag?: LabResultFlag;
    status: LabResultStatus;
    labSection: string; // Chemistry, Hematology, etc.
    performedBy?: string;
    verifiedBy?: string;
    collectionDate?: Date;
    receivedDate?: Date;
    resultDate: Date;
    instrumentId?: string;
    instrumentName?: string;
    comments?: string;
    importedAt: Date;
}

// ── Specimens ────────────────────────────────────────────

export type SpecimenStatus = 'collected' | 'in_transit' | 'received' | 'in_process' | 'completed' | 'rejected';
export type SpecimenType = 'blood' | 'urine' | 'csf' | 'tissue' | 'swab' | 'stool' | 'sputum' | 'other';

export interface Specimen {
    id: string;
    limsId: string;
    limsConfigId: string;
    accessionNumber: string;
    patientId?: string;
    patientMRN?: string;
    specimenType: SpecimenType;
    specimenTypeOther?: string;
    collectionDate: Date;
    receivedDate?: Date;
    collectedBy?: string;
    status: SpecimenStatus;
    rejectionReason?: string;
    labSection: string;
    containerType?: string;
    volume?: string;
    orderedTests: string[];
    importedAt: Date;
}

// ── Lab Orders ───────────────────────────────────────────

export type LabOrderStatus = 'ordered' | 'collected' | 'in_process' | 'completed' | 'cancelled';
export type LabOrderPriority = 'routine' | 'urgent' | 'stat' | 'asap';

export interface LabOrder {
    id: string;
    limsId: string;
    limsConfigId: string;
    orderNumber: string;
    patientId?: string;
    patientMRN?: string;
    tests: { testCode: string; testName: string }[];
    priority: LabOrderPriority;
    orderedBy: string;
    orderedDate: Date;
    status: LabOrderStatus;
    clinicalInfo?: string;
    labSection: string;
    importedAt: Date;
}

// ── QC Data ──────────────────────────────────────────────

export type WestgardRule = '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10x' | 'none';

export interface QCData {
    id: string;
    limsId: string;
    limsConfigId: string;
    instrumentId: string;
    instrumentName: string;
    analyteCode: string;
    analyteName: string;
    level: number; // QC level (1, 2, 3)
    lotNumber: string;
    value: number;
    mean: number;
    sd: number;
    cv?: number; // coefficient of variation
    zScore?: number;
    westgardViolation: WestgardRule;
    controlDate: Date;
    labSection: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    accepted: boolean;
    comments?: string;
    importedAt: Date;
}

// ── Sync & Connector Interfaces ──────────────────────────

export interface LIMSSyncStatusInfo {
    lastSync: Date | null;
    status: SyncStatus;
    recordsSynced: number;
    errors: SyncError[];
    duration?: number;
    nextSyncAt?: Date;
    breakdown?: {
        results: number;
        specimens: number;
        orders: number;
        qcData: number;
    };
}

export interface LIMSSyncResult {
    limsId: string;
    startTime: Date;
    endTime: Date;
    status: SyncStatus;
    resultsImported: number;
    specimensImported: number;
    ordersImported: number;
    qcDataImported: number;
    errorCount: number;
    errors: SyncError[];
}

export interface LIMSIntegrationLog {
    id: string;
    limsId: string;
    limsName: string;
    action: 'sync_start' | 'sync_complete' | 'sync_error' | 'data_received' | 'connection_test' | 'config_update';
    resourceType?: 'results' | 'specimens' | 'orders' | 'qcData';
    status: 'success' | 'error' | 'warning' | 'info';
    recordCount?: number;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    duration?: number;
    userId?: string;
}

export interface LIMSConnector {
    config: LIMSConfig;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<{ success: boolean; message: string }>;
    getSyncStatus(): Promise<LIMSSyncStatusInfo>;
    fetchResults(filters?: LIMSQueryFilters): Promise<LabResult[]>;
    fetchSpecimens(filters?: LIMSQueryFilters): Promise<Specimen[]>;
    fetchOrders(filters?: LIMSQueryFilters): Promise<LabOrder[]>;
    fetchQCData(filters?: LIMSQueryFilters): Promise<QCData[]>;
}

export interface LIMSQueryFilters {
    dateFrom?: Date;
    dateTo?: Date;
    labSection?: string;
    status?: string;
    instrumentId?: string;
    testCode?: string;
    limit?: number;
    offset?: number;
}

export interface LIMSHealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
        connectivity: boolean;
        authentication: boolean;
        dataAccess: boolean;
        qcEndpoint: boolean;
    };
    lastCheck: Date;
    message: string;
}
