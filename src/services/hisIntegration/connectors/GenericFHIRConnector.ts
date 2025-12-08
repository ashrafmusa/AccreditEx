/**
 * Generic FHIR Server Connector
 * Connects to any FHIR R4 compliant server
 */

import { BaseHISConnector } from '../BaseHISConnector';
import { FHIRResource } from '../types';
import { HISConnectionError, HISDataError } from '../integrations/ErrorHandler';

interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource?: FHIRResource;
    response?: {
      status: string;
    };
  }>;
}

export class GenericFHIRConnector extends BaseHISConnector {
  private accessToken: string | null = null;

  /**
   * Connect to FHIR server
   */
  async connect(): Promise<void> {
    try {
      this.logMessage('Connecting to FHIR server');

      // For FHIR servers, we typically use the apiKey as bearer token
      if (this.config.authType === 'bearer_token' && this.config.apiKey) {
        this.accessToken = this.config.apiKey;
      } else if (this.config.authType === 'api_key' && this.config.apiKey) {
        this.accessToken = this.config.apiKey;
      }

      // Test connectivity by accessing the CapabilityStatement
      await this.getCapabilityStatement();

      this.isConnected = true;
      this.logMessage('FHIR server connection established');
    } catch (error) {
      this.logError('Connection', error instanceof Error ? error.message : String(error));
      throw new HISConnectionError(`Failed to connect to FHIR server: ${error}`, true);
    }
  }

  /**
   * Disconnect from FHIR server
   */
  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.isConnected = false;
    this.logMessage('Disconnected from FHIR server');
  }

  /**
   * Fetch FHIR resources
   */
  async fetchData(resourceType: string, filters?: Record<string, any>): Promise<FHIRResource[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const endpoint = `/${resourceType}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.makeFHIRRequest('GET', endpoint);
      const data = (await response.json()) as FHIRBundle | FHIRResource;

      let resources: FHIRResource[] = [];

      if (data.resourceType === 'Bundle') {
        // Extract resources from bundle
        resources = (data as FHIRBundle).entry?.map((entry) => entry.resource).filter(Boolean) as FHIRResource[] || [];
      } else {
        // Single resource response
        resources = [data as FHIRResource];
      }

      this.logMessage(`Fetched ${resources.length} ${resourceType} resources from FHIR server`, 'Fetch');
      return resources;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addSyncError(resourceType, message);
      this.logError('Fetch', message);
      throw new HISDataError(`Failed to fetch ${resourceType} from FHIR server: ${message}`, resourceType, true);
    }
  }

  /**
   * Send FHIR resource to server
   */
  async sendData(resource: FHIRResource): Promise<string> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.validateFHIRResource(resource)) {
        throw new Error('Invalid FHIR resource');
      }

      // Use transaction bundle for batch operations
      const bundle: any = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource,
            request: {
              method: resource.id ? 'PUT' : 'POST',
              url: resource.id ? `${resource.resourceType}/${resource.id}` : resource.resourceType,
            },
          },
        ],
      };

      const response = await this.makeFHIRRequest('POST', '', bundle);
      const result = (await response.json()) as any;

      // Extract the created/updated resource ID
      const entry = result.entry?.[0];
      const location = entry?.response?.location || entry?.resource?.id;

      if (!location) {
        throw new Error('No resource ID returned from FHIR server');
      }

      // Extract ID from location (format: ResourceType/id)
      const resourceId = location.split('/').pop() || location;

      this.logMessage(`Sent ${resource.resourceType} to FHIR server with ID: ${resourceId}`, 'Send');
      return resourceId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Send', message);
      throw new HISDataError(`Failed to send ${resource.resourceType} to FHIR server: ${message}`, resource.resourceType, true);
    }
  }

  /**
   * Get FHIR CapabilityStatement
   */
  private async getCapabilityStatement(): Promise<any> {
    try {
      const response = await this.makeFHIRRequest('GET', '/metadata');
      return await response.json();
    } catch (error) {
      this.logMessage('Could not fetch CapabilityStatement, but connection may still work', 'Warning');
      // Don't throw - CapabilityStatement is optional
      return null;
    }
  }

  /**
   * Make FHIR-specific HTTP request
   */
  private async makeFHIRRequest(
    method: string,
    endpoint: string,
    body?: any,
    options?: { timeout?: number }
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = options?.timeout || this.config.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
          ...this.getFHIRAuthHeaders(),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('abort')) {
        throw new HISConnectionError(`FHIR request timeout after ${timeout}ms`, true);
      }

      throw new HISConnectionError(`FHIR request failed: ${message}`, true);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get FHIR-specific authentication headers
   */
  private getFHIRAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }

    return headers;
  }

  /**
   * Validate FHIR resource before sending
   */
  protected validateFHIRResource(resource: FHIRResource): boolean {
    if (!resource.resourceType) {
      this.logError('Validation', 'Missing resourceType in FHIR resource');
      return false;
    }

    // Basic FHIR validation - could be extended
    const validTypes = ['Patient', 'Observation', 'Encounter', 'Medication', 'MedicationStatement', 'MeasureReport'];

    if (!validTypes.includes(resource.resourceType)) {
      this.logMessage(`Warning: Unknown resource type ${resource.resourceType}, but allowing it`, 'Validation');
    }

    return true;
  }

  /**
   * Search FHIR resources with advanced filters
   */
  async searchResources(
    resourceType: string,
    filters: Record<string, string | number | boolean>
  ): Promise<FHIRResource[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, String(value));
      });

      const response = await this.makeFHIRRequest('GET', `/${resourceType}?${params.toString()}`);
      const data = (await response.json()) as FHIRBundle;

      return data.entry?.map((e) => e.resource).filter(Boolean) as FHIRResource[] || [];
    } catch (error) {
      this.logError('Search', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Execute FHIR operation
   */
  async executeOperation(operationName: string, resourceType?: string, body?: any): Promise<any> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const endpoint = resourceType ? `/${resourceType}/$${operationName}` : `/$${operationName}`;
      const response = await this.makeFHIRRequest('POST', endpoint, body);
      return await response.json();
    } catch (error) {
      this.logError('Operation', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
