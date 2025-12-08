/**
 * HIS Integration Types & Interfaces
 * Defines all types for Health Information System integration
 */

export enum HISType {
  EPIC = 'epic',
  CERNER = 'cerner',
  HL7 = 'hl7',
  MEDIDATA = 'medidata',
  GENERIC_REST = 'generic_rest',
  GENERIC_FHIR = 'generic_fhir',
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
  SUCCESS = 'success',
  PAUSED = 'paused',
}

export enum AuthType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC = 'basic',
  BEARER_TOKEN = 'bearer_token',
  CUSTOM = 'custom',
}

export interface HISConfig {
  id: string;
  name: string;
  type: HISType;
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
  syncInterval?: number; // in minutes
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  timeout?: number; // in milliseconds
  retryCount?: number;
  retryDelay?: number; // in milliseconds
}

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  [key: string]: any;
}

export interface SyncStatusInfo {
  lastSync: Date | null;
  status: SyncStatus;
  recordsSynced: number;
  errors: SyncError[];
  duration?: number;
  nextSyncAt?: Date;
}

export interface SyncError {
  timestamp: Date;
  resource: string;
  error: string;
  recoverable: boolean;
  details?: Record<string, any>;
}

export interface DataMappingConfig {
  id: string;
  sourceField: string;
  targetField: string;
  transformFn?: string; // JSON stringified function
  required: boolean;
  dataType?: string;
  description?: string;
}

export interface IntegrationLog {
  id: string;
  hisId: string;
  hisName: string;
  action: 'sync_start' | 'sync_complete' | 'sync_error' | 'data_sent' | 'data_received' | 'connection_test' | 'config_update';
  resourceType?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  recordCount?: number;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number; // in milliseconds
  userId?: string;
  ipAddress?: string;
}

export interface HISConnector {
  config: HISConfig;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchData(resourceType: string, filters?: Record<string, any>): Promise<FHIRResource[]>;
  sendData(resource: FHIRResource): Promise<string>;
  testConnection(): Promise<{ success: boolean; message: string }>;
  getSyncStatus(): Promise<SyncStatusInfo>;
}

export interface ConnectorFactory {
  createConnector(config: HISConfig): HISConnector;
  getConnectorTypes(): HISType[];
}

export interface SyncResult {
  hisId: string;
  resourceType: string;
  startTime: Date;
  endTime: Date;
  recordCount: number;
  successCount: number;
  errorCount: number;
  errors: SyncError[];
  status: SyncStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: Date;
    duration: number;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connectivity: boolean;
    authentication: boolean;
    dataAccess: boolean;
  };
  lastCheck: Date;
  message: string;
}
