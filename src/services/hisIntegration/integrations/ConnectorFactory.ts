/**
 * HIS Connector Factory
 * Factory pattern for creating HIS connectors based on configuration type
 */

import { HISConnector, HISConfig, HISType } from '../types';
import { GenericRESTConnector } from '../connectors/GenericRESTConnector';
import { GenericFHIRConnector } from '../connectors/GenericFHIRConnector';
import { EpicConnector } from '../connectors/EpicConnector';
import { CernerConnector } from '../connectors/CernerConnector';
import { HL7Connector } from '../connectors/HL7Connector';
import { HISConfigurationError } from './ErrorHandler';

export class ConnectorFactory {
  private static connectors: Map<HISType, any> = (() => {
    const map = new Map<HISType, any>();
    map.set(HISType.GENERIC_REST, GenericRESTConnector);
    map.set(HISType.GENERIC_FHIR, GenericFHIRConnector);
    map.set(HISType.EPIC, EpicConnector);
    map.set(HISType.CERNER, CernerConnector);
    map.set(HISType.HL7, HL7Connector);
    return map;
  })();

  /**
   * Create a connector instance based on HIS type
   */
  static createConnector(config: HISConfig): HISConnector {
    const ConnectorClass = this.connectors.get(config.type);

    if (!ConnectorClass) {
      throw new HISConfigurationError(`Unsupported HIS type: ${config.type}. Available types: ${this.getAvailableTypes().join(', ')}`);
    }

    try {
      return new ConnectorClass(config);
    } catch (error) {
      throw new HISConfigurationError(
        `Failed to create connector for ${config.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Register a custom connector type
   */
  static registerConnector(type: HISType, connectorClass: new (config: HISConfig) => HISConnector): void {
    this.connectors.set(type, connectorClass);
  }

  /**
   * Get all available connector types
   */
  static getAvailableTypes(): HISType[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Get connector type by name
   */
  static getConnectorType(typeName: string): HISType | null {
    const type = Object.values(HISType).find((t) => t === typeName);
    return (type as HISType) || null;
  }

  /**
   * Check if connector type is available
   */
  static isConnectorAvailable(type: HISType): boolean {
    return this.connectors.has(type);
  }

  /**
   * Get connector metadata
   */
  static getConnectorMetadata(type: HISType): {
    name: string;
    description: string;
    authTypes: string[];
    requiredFields: string[];
    documentationUrl?: string;
  } | null {
    const metadata: Record<HISType, any> = {
      [HISType.GENERIC_REST]: {
        name: 'Generic REST API',
        description: 'Connect to any REST-based healthcare system',
        authTypes: ['api_key', 'oauth2', 'basic', 'custom'],
        requiredFields: ['baseUrl', 'authType'],
        documentationUrl: '/docs/connectors/generic-rest',
      },
      [HISType.GENERIC_FHIR]: {
        name: 'Generic FHIR Server',
        description: 'Connect to any FHIR-compliant server',
        authTypes: ['api_key', 'oauth2', 'bearer_token', 'basic'],
        requiredFields: ['baseUrl'],
        documentationUrl: '/docs/connectors/generic-fhir',
      },
      [HISType.EPIC]: {
        name: 'Epic',
        description: 'Epic EHR system with FHIR and proprietary API support',
        authTypes: ['oauth2'],
        requiredFields: ['baseUrl', 'clientId', 'clientSecret'],
        documentationUrl: '/docs/connectors/epic',
      },
      [HISType.CERNER]: {
        name: 'Cerner Millennium',
        description: 'Cerner healthcare platform with MuleSoft integration',
        authTypes: ['oauth2'],
        requiredFields: ['baseUrl', 'clientId', 'clientSecret'],
        documentationUrl: '/docs/connectors/cerner',
      },
      [HISType.HL7]: {
        name: 'HL7 v2',
        description: 'HL7 version 2 messaging for legacy systems',
        authTypes: ['basic', 'custom'],
        requiredFields: ['baseUrl'],
        documentationUrl: '/docs/connectors/hl7',
      },
      [HISType.MEDIDATA]: {
        name: 'Medidata',
        description: 'Medidata clinical trial platform (coming soon)',
        authTypes: ['api_key', 'oauth2'],
        requiredFields: ['baseUrl', 'apiKey'],
        documentationUrl: '/docs/connectors/medidata',
      },
    };

    return metadata[type] || null;
  }

  /**
   * Validate configuration for a connector type
   */
  static validateConfiguration(config: HISConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!config.baseUrl) {
      errors.push('baseUrl is required');
    }

    if (!config.name) {
      errors.push('name is required');
    }

    // Check auth configuration
    switch (config.authType) {
      case 'api_key':
        if (!config.apiKey) {
          errors.push('apiKey is required for API Key authentication');
        }
        break;

      case 'oauth2':
        if (!config.clientId || !config.clientSecret) {
          errors.push('clientId and clientSecret are required for OAuth2 authentication');
        }
        break;

      case 'basic':
        if (!config.username || !config.password) {
          errors.push('username and password are required for Basic authentication');
        }
        break;

      case 'bearer_token':
        if (!config.apiKey) {
          errors.push('apiKey (token) is required for Bearer Token authentication');
        }
        break;

      case 'custom':
        if (!config.customHeaders) {
          errors.push('customHeaders are required for Custom authentication');
        }
        break;
    }

    // Check retry configuration
    if (config.retryCount !== undefined && (config.retryCount < 0 || config.retryCount > 10)) {
      errors.push('retryCount must be between 0 and 10');
    }

    if (config.retryDelay !== undefined && (config.retryDelay < 0 || config.retryDelay > 300000)) {
      errors.push('retryDelay must be between 0 and 300000 milliseconds');
    }

    // Check sync interval
    if (config.syncInterval !== undefined && config.syncInterval < 1) {
      errors.push('syncInterval must be at least 1 minute');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get template configuration for a connector type
   */
  static getConfigurationTemplate(type: HISType): Partial<HISConfig> {
    const templates: Record<HISType, Partial<HISConfig>> = {
      [HISType.GENERIC_REST]: {
        type: HISType.GENERIC_REST,
        name: 'New REST API Connection',
        baseUrl: 'https://api.example.com',
        authType: 'api_key' as any,
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
        enabled: true,
      },
      [HISType.GENERIC_FHIR]: {
        type: HISType.GENERIC_FHIR,
        name: 'New FHIR Server Connection',
        baseUrl: 'https://fhir.example.com/fhir',
        authType: 'bearer_token' as any,
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
        enabled: true,
      },
      [HISType.EPIC]: {
        type: HISType.EPIC,
        name: 'Epic EHR Connection',
        baseUrl: 'https://epic-api.example.com',
        authType: 'oauth2' as any,
        timeout: 30000,
        enabled: false,
      },
      [HISType.CERNER]: {
        type: HISType.CERNER,
        name: 'Cerner Connection',
        baseUrl: 'https://cerner-api.example.com',
        authType: 'oauth2' as any,
        timeout: 30000,
        enabled: false,
      },
      [HISType.HL7]: {
        type: HISType.HL7,
        name: 'HL7 v2 Connection',
        baseUrl: 'hl7://example.com:2575',
        authType: 'basic' as any,
        timeout: 30000,
        enabled: false,
      },
      [HISType.MEDIDATA]: {
        type: HISType.MEDIDATA,
        name: 'Medidata Connection',
        baseUrl: 'https://medidata-api.example.com',
        authType: 'api_key' as any,
        timeout: 30000,
        enabled: false,
      },
    };

    return templates[type] || {};
  }
}
