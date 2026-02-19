/**
 * LIMS Integration Services
 * Barrel export for all LIMS integration services
 */

// Types
export {
    LIMSType,
    LIMS_TYPE_LABELS,
    AuthType,
    SyncStatus,
} from './types';
export type {
    LIMSConfig,
    LIMSConnector,
    LIMSSyncStatusInfo,
    LIMSSyncResult,
    LIMSIntegrationLog,
    LIMSQueryFilters,
    LIMSHealthCheckResult,
    LabResult,
    LabResultStatus,
    LabResultFlag,
    Specimen,
    SpecimenStatus,
    SpecimenType,
    LabOrder,
    LabOrderStatus,
    LabOrderPriority,
    QCData,
    WestgardRule,
    DataMappingConfig,
    SyncError,
} from './types';

// Base class
export { BaseLIMSConnector } from './BaseLIMSConnector';

// Connectors
export { GenericRESTLIMSConnector } from './connectors/GenericRESTLIMSConnector';
export { SoftLabConnector } from './connectors/SoftLabConnector';
export { SunquestConnector } from './connectors/SunquestConnector';
export { OrchardConnector } from './connectors/OrchardConnector';
export { GenericHL7LIMSConnector } from './connectors/GenericHL7LIMSConnector';

// Factory
export { LIMSConnectorFactory } from './LIMSConnectorFactory';

// Services
export { LIMSDataSyncService, limsDataSyncService } from './LIMSDataSyncService';
