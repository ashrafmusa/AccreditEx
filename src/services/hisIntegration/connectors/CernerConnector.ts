/**
 * Cerner EHR Connector
 * Connects to Cerner's FHIR and MuleSoft integration layer
 * Cerner is the second largest EHR system in the US
 */

import { BaseHISConnector } from '../BaseHISConnector';
import { FHIRResource, HISConfig } from '../types';
import { HISConnectionError, HISAuthenticationError, HISDataError, HISConfigurationError } from '../integrations/ErrorHandler';

interface CernerOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  issued_at: number;
  scope?: string;
}

interface CernerFHIRBundle {
  resourceType: 'Bundle';
  type: 'searchset' | 'transaction';
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource?: FHIRResource;
    search?: {
      mode: string;
    };
  }>;
}

export class CernerConnector extends BaseHISConnector {
  private oauthToken: CernerOAuthToken | null = null;
  private cernerFHIRBaseUrl: string = '';
  private cernerAuthUrl: string = '';
  private clientId: string = '';
  private clientSecret: string = '';
  private instanceId: string = '';

  /**
   * Connect to Cerner EHR system
   * Cerner uses MuleSoft gateway with FHIR R4 endpoints
   */
  async connect(): Promise<void> {
    try {
      const config = this.config;

      // Cerner-specific endpoints
      // Format: https://fhir-open.cerner.com/r4/{tenantId}
      const baseUrl = config.baseUrl.replace(/\/$/, '');
      this.cernerFHIRBaseUrl = baseUrl;

      // Cerner OAuth endpoint
      // Format: https://authorization.cerner.com/oauth2/authorize
      this.cernerAuthUrl = config.username || 'https://authorization.cerner.com/oauth2';

      // Parse credentials
      this.clientId = config.clientId || '';
      this.clientSecret = config.clientSecret || '';
      this.instanceId = config.password || '';

      if (!this.clientId || !this.clientSecret) {
        throw new HISConnectionError('Cerner requires clientId and clientSecret credentials');
      }

      // Test authentication
      await this.authenticateWithCerner();

      // Validate FHIR endpoint
      const capabilityUrl = `${this.cernerFHIRBaseUrl}/metadata`;
      const response = await this.makeRequest('GET', capabilityUrl);

      if (!response.ok) {
        throw new HISConnectionError(`Cerner FHIR endpoint validation failed: ${response.statusText}`);
      }

      this.logMessage('Connected to Cerner EHR system', 'Connect');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Connect', message);
      throw new HISConnectionError(`Failed to connect to Cerner: ${message}`);
    }
  }

  /**
   * Disconnect from Cerner
   */
  async disconnect(): Promise<void> {
    this.oauthToken = null;
    this.logMessage('Disconnected from Cerner EHR system', 'Disconnect');
  }

  /**
   * Fetch data from Cerner using FHIR search
   */
  async fetchData(resourceType: string, filters?: Record<string, string>): Promise<FHIRResource[]> {
    try {
      if (!this.oauthToken) {
        await this.authenticateWithCerner();
      }

      // Build FHIR search query
      const searchUrl = `${this.cernerFHIRBaseUrl}/${resourceType}`;
      const params = new URLSearchParams();

      // Add filters - Cerner has specific filter formats
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, value);
        });
      }

      const url = params.toString() ? `${searchUrl}?${params.toString()}` : searchUrl;

      const response = await this.makeRequest('GET', url);

      if (!response.ok) {
        throw new HISDataError(
          `Cerner FHIR search failed: ${response.statusText}`,
          resourceType,
          response.status === 401 || response.status === 403
        );
      }

      const bundle = (await response.json()) as CernerFHIRBundle;
      const resources: FHIRResource[] = [];

      // Extract resources from bundle entries
      if (bundle.entry) {
        bundle.entry.forEach((entry) => {
          if (entry.resource) {
            resources.push(entry.resource);
          }
        });
      }

      this.logMessage(`Fetched ${resources.length} ${resourceType} resources from Cerner`, 'Fetch');
      return resources;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Fetch', message);
      throw new HISDataError(`Failed to fetch ${resourceType} from Cerner: ${message}`, resourceType, true);
    }
  }

  /**
   * Send data to Cerner using FHIR transaction
   */
  async sendData(resource: FHIRResource): Promise<string> {
    try {
      if (!this.oauthToken) {
        await this.authenticateWithCerner();
      }

      // Cerner uses transaction bundles for batch operations
      const bundle: any = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource,
            request: {
              method: resource.id ? 'PUT' : 'POST',
              url: `${resource.resourceType}${resource.id ? `/${resource.id}` : ''}`,
            },
          },
        ],
      };

      const response = await this.makeRequest('POST', this.cernerFHIRBaseUrl, bundle);

      if (!response.ok) {
        throw new HISDataError(
          `Cerner FHIR transaction failed: ${response.statusText}`,
          resource.resourceType,
          response.status === 401 || response.status === 403
        );
      }

      const result = (await response.json()) as any;
      const entry = result.entry?.[0];
      const location = entry?.response?.location || entry?.resource?.id;

      if (!location) {
        throw new Error('No resource ID returned from Cerner');
      }

      const resourceId = location.split('/').pop() || location;
      this.logMessage(`Sent ${resource.resourceType} to Cerner with ID: ${resourceId}`, 'Send');
      return resourceId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Send', message);
      throw new HISDataError(`Failed to send ${resource.resourceType} to Cerner: ${message}`, resource.resourceType, true);
    }
  }

  /**
   * Cerner-specific OAuth2 authentication
   * Uses SMART on FHIR backend authorization
   */
  private async authenticateWithCerner(): Promise<void> {
    try {
      // Cerner OAuth token endpoint
      const tokenUrl = `${this.cernerAuthUrl}/token`;

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.cernerFHIRBaseUrl,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new HISAuthenticationError(`Cerner OAuth failed: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      this.oauthToken = {
        access_token: data.access_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in || 3600,
        issued_at: Date.now(),
        scope: data.scope,
      };

      this.logMessage('Successfully authenticated with Cerner OAuth', 'Auth');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HISAuthenticationError(`Cerner authentication failed: ${message}`);
    }
  }

  /**
   * Get Cerner-specific auth headers
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
    };

    if (this.oauthToken) {
      headers.Authorization = `${this.oauthToken.token_type} ${this.oauthToken.access_token}`;
    }

    return headers;
  }

  /**
   * Cerner-specific request handler
   * Handles Cerner's MuleSoft gateway requirements
   */
  protected async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<Response> {
    const timeout = options?.timeout || this.config.timeout || 30000;
    const headers = this.getAuthHeaders();

    // Add Cerner-specific headers
    if (this.instanceId) {
      headers['X-Cerner-InstanceID'] = this.instanceId;
    }

    // Check token expiration and refresh if needed
    if (this.oauthToken && Date.now() - this.oauthToken.issued_at > this.oauthToken.expires_in * 1000 - 60000) {
      await this.authenticateWithCerner();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HISConnectionError(`Cerner request timeout (${timeout}ms)`);
      }
      throw error;
    }
  }

  /**
   * Test connection to Cerner
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.oauthToken) {
        await this.authenticateWithCerner();
      }

      const response = await this.makeRequest('GET', `${this.cernerFHIRBaseUrl}/metadata`);
      if (response.ok) {
        return { success: true, message: 'Connected to Cerner successfully' };
      }
      return { success: false, message: `Cerner health check failed: ${response.statusText}` };
    } catch (error) {
      return { success: false, message: `Cerner connection test failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Cerner-specific capabilities check
   */
  async getCapabilities(): Promise<Record<string, any>> {
    try {
      const response = await this.makeRequest('GET', `${this.cernerFHIRBaseUrl}/metadata`);
      const data = await response.json();
      return {
        fhirVersion: data.fhirVersion,
        software: data.software?.[0],
        implementation: data.implementation,
        resourceSupport: data.rest?.[0]?.resource?.map((r: any) => r.type) || [],
        instanceId: this.instanceId,
      };
    } catch (error) {
      this.logError('GetCapabilities', String(error));
      return {};
    }
  }
}
