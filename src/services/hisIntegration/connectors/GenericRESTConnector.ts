/**
 * Generic REST API Connector
 * Connects to any REST-based healthcare system
 */

import { BaseHISConnector } from '../BaseHISConnector';
import { FHIRResource } from '../types';
import { HISConnectionError, HISAuthenticationError, HISDataError } from '../integrations/ErrorHandler';

export class GenericRESTConnector extends BaseHISConnector {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  /**
   * Connect to the REST API
   */
  async connect(): Promise<void> {
    try {
      this.logMessage('Attempting connection');

      // Handle different authentication types
      if (this.config.authType === 'oauth2') {
        await this.authenticateOAuth();
      } else if (this.config.authType === 'api_key') {
        this.accessToken = this.config.apiKey || null;
      } else if (this.config.authType === 'bearer_token') {
        this.accessToken = this.config.apiKey || null;
      }
      // Basic and custom auth headers are handled in getAuthHeaders()

      this.isConnected = true;
      this.logMessage('Connection established successfully');
    } catch (error) {
      this.logError('Connection', error instanceof Error ? error.message : String(error));
      throw new HISConnectionError(`Failed to connect to ${this.config.name}: ${error}`, true);
    }
  }

  /**
   * Disconnect from the REST API
   */
  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.isConnected = false;
    this.logMessage('Disconnected');
  }

  /**
   * Fetch data from REST API
   */
  async fetchData(resourceType: string, filters?: Record<string, any>): Promise<FHIRResource[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const params = new URLSearchParams();

      // Add filters to query parameters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const url = `${this.config.baseUrl}/${resourceType}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.makeRequest('GET', `/${resourceType}${params.toString() ? `?${params.toString()}` : ''}`);

      const data = await response.json();

      // Handle different response formats
      let resources: FHIRResource[] = [];

      if (Array.isArray(data)) {
        resources = data;
      } else if (data.entry && Array.isArray(data.entry)) {
        // FHIR Bundle response
        resources = data.entry.map((entry: any) => entry.resource);
      } else if (data.resourceType) {
        // Single resource response
        resources = [data];
      } else if (data.data && Array.isArray(data.data)) {
        // Wrapped array response
        resources = data.data;
      }

      this.logMessage(`Fetched ${resources.length} ${resourceType} resources`, 'Fetch');
      return resources;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addSyncError(resourceType, message);
      this.logError('Fetch', message);
      throw new HISDataError(`Failed to fetch ${resourceType}: ${message}`, resourceType, true);
    }
  }

  /**
   * Send data to REST API
   */
  async sendData(resource: FHIRResource): Promise<string> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.validateFHIRResource(resource)) {
        throw new Error('Invalid FHIR resource: missing resourceType');
      }

      const endpoint = resource.id ? `/${resource.resourceType}/${resource.id}` : `/${resource.resourceType}`;

      const response = await this.makeRequest(
        resource.id ? 'PUT' : 'POST',
        endpoint,
        resource
      );

      const result = await response.json();
      const resourceId = result.id || result.uuid || result.ID;

      if (!resourceId) {
        throw new Error('No ID returned from server');
      }

      this.logMessage(`Sent ${resource.resourceType} resource`, 'Send');
      return resourceId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError('Send', message);
      throw new HISDataError(`Failed to send ${resource.resourceType}: ${message}`, resource.resourceType, true);
    }
  }

  /**
   * OAuth2 authentication
   */
  private async authenticateOAuth(): Promise<void> {
    try {
      if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
        // Token still valid
        return;
      }

      if (!this.config.clientId || !this.config.clientSecret) {
        throw new HISAuthenticationError('OAuth2 requires clientId and clientSecret');
      }

      const tokenUrl = `${this.config.baseUrl}/oauth/token`;
      const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'system/*.read system/*.write',
        }).toString(),
      });

      if (!response.ok) {
        throw new HISAuthenticationError(`OAuth2 authentication failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Set token expiration
      if (data.expires_in) {
        this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
      }

      this.logMessage('OAuth2 authentication successful');
    } catch (error) {
      this.logError('OAuth2', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Make HTTP request with authentication headers
   */
  protected async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = options?.timeout || this.config.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorData}`);
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('abort')) {
        throw new HISConnectionError(`Request timeout after ${timeout}ms`, true);
      }

      throw new HISConnectionError(message, true);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get authentication headers
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.config.authType) {
      case 'api_key':
        if (this.config.apiKey) {
          headers['X-API-Key'] = this.config.apiKey;
        }
        break;

      case 'bearer_token':
        if (this.accessToken) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        break;

      case 'basic':
        if (this.config.username && this.config.password) {
          const encoded = btoa(`${this.config.username}:${this.config.password}`);
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;

      case 'custom':
        if (this.config.customHeaders) {
          Object.assign(headers, this.config.customHeaders);
        }
        break;
    }

    return headers;
  }
}
