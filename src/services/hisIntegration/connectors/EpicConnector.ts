/**
 * Epic EHR Connector
 * Connects to Epic's FHIR and proprietary APIs
 * Epic is the most widely used EHR system in the US
 */

import { BaseHISConnector } from '../BaseHISConnector';
import { FHIRResource, HISConfig } from '../types';
import { HISConnectionError, HISAuthenticationError, HISDataError, HISConfigurationError } from '../integrations/ErrorHandler';

interface EpicOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  issued_at: number;
}

interface EpicFHIRBundle {
  resourceType: 'Bundle';
  type: 'searchset' | 'transaction' | 'batch';
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource?: FHIRResource;
    search?: {
      mode: string;
    };
  }>;
}

export class EpicConnector extends BaseHISConnector {
  private oauthToken: EpicOAuthToken | null = null;
  private epicFHIRBaseUrl: string = '';
  private epicOAuthUrl: string = '';
  private clientId: string = '';
  private clientSecret: string = '';

  /**
   * Connect to Epic EHR system
   * Epic uses FHIR R4 endpoints with OAuth2 authentication
   */
  async connect(): Promise<void> {
    try {
      const config = this.config;

      // Epic-specific endpoints
      // Format: https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize
      const baseUrl = config.baseUrl.replace(/\/$/, '');
      this.epicFHIRBaseUrl = `${baseUrl}/api/FHIR/R4`;
      this.epicOAuthUrl = `${baseUrl}/oauth2/authorize`;

      // Parse credentials
      this.clientId = config.clientId || '';
      this.clientSecret = config.clientSecret || '';

      if (!this.clientId || !this.clientSecret) {
        throw new HISConfigurationError('Epic requires clientId and clientSecret credentials');
      }

      // Test authentication
      await this.authenticateWithEpic();

      // Validate FHIR endpoint
      const capabilityUrl = `${this.epicFHIRBaseUrl}/metadata`;
      const response = await this.makeRequest('GET', capabilityUrl);

      if (!response.ok) {
        throw new HISConnectionError(`Epic FHIR endpoint validation failed: ${response.statusText}`);
      }

      this.logMessage('Connected to Epic EHR system', 'Connect');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Connect', message);
      throw new HISConnectionError(`Failed to connect to Epic: ${message}`);
    }
  }

  /**
   * Disconnect from Epic
   */
  async disconnect(): Promise<void> {
    this.oauthToken = null;
    this.logMessage('Disconnected from Epic EHR system', 'Disconnect');
  }

  /**
   * Fetch data from Epic using FHIR search
   */
  async fetchData(resourceType: string, filters?: Record<string, string>): Promise<FHIRResource[]> {
    try {
      if (!this.oauthToken) {
        await this.authenticateWithEpic();
      }

      // Build FHIR search query
      const searchUrl = `${this.epicFHIRBaseUrl}/${resourceType}`;
      const params = new URLSearchParams();

      // Add filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, value);
        });
      }

      const url = params.toString() ? `${searchUrl}?${params.toString()}` : searchUrl;

      const response = await this.makeRequest('GET', url);

      if (!response.ok) {
        throw new HISDataError(
          `Epic FHIR search failed: ${response.statusText}`,
          resourceType,
          response.status === 401 || response.status === 403
        );
      }

      const bundle = (await response.json()) as EpicFHIRBundle;
      const resources: FHIRResource[] = [];

      // Extract resources from bundle entries
      if (bundle.entry) {
        bundle.entry.forEach((entry) => {
          if (entry.resource) {
            resources.push(entry.resource);
          }
        });
      }

      this.logMessage(`Fetched ${resources.length} ${resourceType} resources from Epic`, 'Fetch');
      return resources;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Fetch', message);
      throw new HISDataError(`Failed to fetch ${resourceType} from Epic: ${message}`, resourceType, true);
    }
  }

  /**
   * Send data to Epic using FHIR transaction
   */
  async sendData(resource: FHIRResource): Promise<string> {
    try {
      if (!this.oauthToken) {
        await this.authenticateWithEpic();
      }

      // Epic uses transaction bundles for batch operations
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

      const response = await this.makeRequest('POST', this.epicFHIRBaseUrl, bundle);

      if (!response.ok) {
        throw new HISDataError(
          `Epic FHIR transaction failed: ${response.statusText}`,
          resource.resourceType,
          response.status === 401 || response.status === 403
        );
      }

      const result = (await response.json()) as any;
      const entry = result.entry?.[0];
      const location = entry?.response?.location || entry?.resource?.id;

      if (!location) {
        throw new Error('No resource ID returned from Epic');
      }

      const resourceId = location.split('/').pop() || location;
      this.logMessage(`Sent ${resource.resourceType} to Epic with ID: ${resourceId}`, 'Send');
      return resourceId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Send', message);
      throw new HISDataError(`Failed to send ${resource.resourceType} to Epic: ${message}`, resource.resourceType, true);
    }
  }

  /**
   * Epic-specific OAuth2 authentication
   * Uses client credentials flow (backend-to-backend)
   */
  private async authenticateWithEpic(): Promise<void> {
    try {
      // Epic OAuth endpoint format: {baseUrl}/oauth2/token
      const tokenUrl = this.epicOAuthUrl.replace('/authorize', '/token');

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
        throw new HISAuthenticationError(`Epic OAuth failed: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      this.oauthToken = {
        access_token: data.access_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in || 3600,
        issued_at: Date.now(),
      };

      this.logMessage('Successfully authenticated with Epic OAuth', 'Auth');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HISAuthenticationError(`Epic authentication failed: ${message}`);
    }
  }

  /**
   * Get Epic-specific auth headers
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
   * Epic-specific request handler
   * Adds Epic headers and handles Epic-specific errors
   */
  protected async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<Response> {
    const timeout = options?.timeout || this.config.timeout || 30000;
    const headers = this.getAuthHeaders();

    // Add Epic-specific headers
    headers['Epic-Client-ID'] = this.clientId;

    // Check token expiration and refresh if needed
    if (this.oauthToken && Date.now() - this.oauthToken.issued_at > this.oauthToken.expires_in * 1000 - 60000) {
      await this.authenticateWithEpic();
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
        throw new HISConnectionError(`Epic request timeout (${timeout}ms)`);
      }
      throw error;
    }
  }

  /**
   * Test connection to Epic
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.oauthToken) {
        await this.authenticateWithEpic();
      }

      const response = await this.makeRequest('GET', `${this.epicFHIRBaseUrl}/metadata`);
      if (response.ok) {
        return { success: true, message: 'Connected to Epic successfully' };
      }
      return { success: false, message: `Epic health check failed: ${response.statusText}` };
    } catch (error) {
      return { success: false, message: `Epic connection test failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Epic-specific capabilities check
   */
  async getCapabilities(): Promise<Record<string, any>> {
    try {
      const response = await this.makeRequest('GET', `${this.epicFHIRBaseUrl}/metadata`);
      const data = await response.json();
      return {
        fhirVersion: data.fhirVersion,
        software: data.software?.[0],
        implementation: data.implementation,
        resourceSupport: data.rest?.[0]?.resource?.map((r: any) => r.type) || [],
      };
    } catch (error) {
      this.logError('GetCapabilities', String(error));
      return {};
    }
  }
}
