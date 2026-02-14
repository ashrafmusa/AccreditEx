/**
 * HIS Integration Services
 * Barrel export for all HIS integration services
 */

export { HISDataSyncService } from './HISDataSyncService';
export { HISSyncScheduler } from './HISSyncScheduler';
export { ChangeDataCaptureService, changeDataCaptureService } from './ChangeDataCaptureService';
export { DataMappingService, dataMappingService } from './DataMappingService';
export { AuditLoggingService, auditLoggingService } from './AuditLoggingService';
export { WebhookManagerService, webhookManagerService } from './WebhookManagerService';
export { AnalyticsService, analyticsService } from './AnalyticsService';
export { ReportingService, reportingService } from './ReportingService';
export { useHISIntegrationStore } from '../../stores/useHISIntegrationStore';
export { HISType, SyncStatus, AuthType } from './types';
export type { HISConfig, FHIRResource, SyncStatusInfo, SyncError, DataMappingConfig, IntegrationLog, HISConnector, SyncResult, ApiResponse, HealthCheckResult } from './types';
export * from './BaseHISConnector';
export * from './integrations/ErrorHandler';
export * from './integrations/ConnectorFactory';
export * from './connectors/GenericRESTConnector';
export * from './connectors/GenericFHIRConnector';
export * from './connectors/EpicConnector';
export * from './connectors/CernerConnector';
export * from './connectors/HL7Connector';
