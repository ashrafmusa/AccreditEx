/**
 * LIMS Connector Factory
 * Factory pattern for creating LIMS connectors based on configuration type
 */

import { LIMSConnector, LIMSConfig, LIMSType } from './types';
import { GenericRESTLIMSConnector } from './connectors/GenericRESTLIMSConnector';
import { SoftLabConnector } from './connectors/SoftLabConnector';
import { SunquestConnector } from './connectors/SunquestConnector';
import { OrchardConnector } from './connectors/OrchardConnector';
import { GenericHL7LIMSConnector } from './connectors/GenericHL7LIMSConnector';

const connectorRegistry = new Map<LIMSType, new (config: LIMSConfig) => LIMSConnector>([
    [LIMSType.GENERIC_REST, GenericRESTLIMSConnector],
    [LIMSType.SOFTLAB, SoftLabConnector],
    [LIMSType.SUNQUEST, SunquestConnector],
    [LIMSType.ORCHARD, OrchardConnector],
    [LIMSType.GENERIC_HL7, GenericHL7LIMSConnector],
    // NetLIMS and LabVantage use generic REST by default; users can configure endpoints
    [LIMSType.NETLIMS, GenericRESTLIMSConnector],
    [LIMSType.LABVANTAGE, GenericRESTLIMSConnector],
]);

export class LIMSConnectorFactory {
    /**
     * Create a connector instance based on LIMS type
     */
    static createConnector(config: LIMSConfig): LIMSConnector {
        const ConnectorClass = connectorRegistry.get(config.type);
        if (!ConnectorClass) {
            throw new Error(
                `Unsupported LIMS type: ${config.type}. Available: ${LIMSConnectorFactory.getAvailableTypes().join(', ')}`,
            );
        }
        return new ConnectorClass(config);
    }

    /**
     * Register a custom connector type
     */
    static registerConnector(type: LIMSType, cls: new (config: LIMSConfig) => LIMSConnector): void {
        connectorRegistry.set(type, cls);
    }

    /**
     * Get all available connector types
     */
    static getAvailableTypes(): LIMSType[] {
        return Array.from(connectorRegistry.keys());
    }
}
