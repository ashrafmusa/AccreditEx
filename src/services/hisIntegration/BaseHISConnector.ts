/**
 * Base HIS Connector Class
 * Abstract base class for all HIS connectors with common functionality
 */

import {
  HISConnector,
  HISConfig,
  FHIRResource,
  SyncStatusInfo,
  SyncStatus,
  SyncError,
  HealthCheckResult,
} from './types';

export abstract class BaseHISConnector implements HISConnector {
  config: HISConfig;
  protected isConnected: boolean = false;
  protected lastError: Error | null = null;
  protected syncErrors: SyncError[] = [];
  protected lastSyncDuration: number = 0;

  constructor(config: HISConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration on initialization
   */
  protected validateConfig(): void {
    if (!this.config.baseUrl) {
      throw new Error('HIS configuration missing baseUrl');
    }
    if (!this.config.name) {
      throw new Error('HIS configuration missing name');
    }
  }

  /**
   * Abstract methods - must be implemented by subclasses
   */
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract fetchData(resourceType: string, filters?: Record<string, any>): Promise<FHIRResource[]>;
  abstract sendData(resource: FHIRResource): Promise<string>;

  /**
   * Test connection to HIS system
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.connect();
      const healthCheck = await this.healthCheck();
      await this.disconnect();

      return {
        success: healthCheck.status !== 'unhealthy',
        message: healthCheck.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      this.logError('Connection test failed', message);
      return { success: false, message };
    }
  }

  /**
   * Get current synchronization status
   */
  async getSyncStatus(): Promise<SyncStatusInfo> {
    return {
      lastSync: this.config.lastSyncAt || null,
      status: this.isConnected ? SyncStatus.IDLE : SyncStatus.ERROR,
      recordsSynced: 0,
      errors: this.syncErrors.slice(-10), // Last 10 errors
      duration: this.lastSyncDuration,
      nextSyncAt: this.calculateNextSyncTime(),
    };
  }

  /**
   * Perform health check on the HIS system
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test connectivity
      const connectivityOk = await this.testConnectivity();

      // Test authentication
      const authOk = await this.testAuthentication();

      // Test data access
      const dataAccessOk = await this.testDataAccess();

      const status =
        connectivityOk && authOk && dataAccessOk
          ? 'healthy'
          : connectivityOk && authOk
            ? 'degraded'
            : 'unhealthy';

      return {
        status,
        checks: {
          connectivity: connectivityOk,
          authentication: authOk,
          dataAccess: dataAccessOk,
        },
        lastCheck: new Date(),
        message: `Health check ${status}: ${connectivityOk ? '✓' : '✗'} Connectivity, ${authOk ? '✓' : '✗'} Auth, ${dataAccessOk ? '✓' : '✗'} Data Access`,
      };
    } catch (error) {
      this.logError('Health check failed', error instanceof Error ? error.message : String(error));
      return {
        status: 'unhealthy',
        checks: {
          connectivity: false,
          authentication: false,
          dataAccess: false,
        },
        lastCheck: new Date(),
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Protected helper methods
   */

  /**
   * Test basic connectivity
   */
  protected async testConnectivity(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/health', undefined, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Test authentication
   */
  protected async testAuthentication(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test data access
   */
  protected async testDataAccess(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      // Try to fetch a small dataset
      const data = await this.fetchData('Patient', { _count: 1 });
      return Array.isArray(data);
    } catch {
      return false;
    }
  }

  /**
   * Make HTTP request with error handling
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
          'Content-Type': 'application/fhir+json',
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get authentication headers based on auth type
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
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
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

  /**
   * Validate FHIR resource structure
   */
  protected validateFHIRResource(resource: FHIRResource): boolean {
    if (!resource.resourceType) {
      this.logError('FHIR validation', 'Missing resourceType');
      return false;
    }
    return true;
  }

  /**
   * Safe transform map — predefined transformations instead of eval/new Function.
   * Add new transform types here as needed.
   */
  private static readonly SAFE_TRANSFORMS: Record<string, (value: any) => any> = {
    'toString': (v) => String(v),
    'toNumber': (v) => Number(v),
    'toBoolean': (v) => Boolean(v),
    'toUpperCase': (v) => String(v).toUpperCase(),
    'toLowerCase': (v) => String(v).toLowerCase(),
    'trim': (v) => String(v).trim(),
    'toISODate': (v) => new Date(v).toISOString(),
    'toDateString': (v) => new Date(v).toLocaleDateString(),
    'parseJSON': (v) => JSON.parse(v),
    'stringifyJSON': (v) => JSON.stringify(v),
    'toArray': (v) => Array.isArray(v) ? v : [v],
    'first': (v) => Array.isArray(v) ? v[0] : v,
    'last': (v) => Array.isArray(v) ? v[v.length - 1] : v,
    'count': (v) => Array.isArray(v) ? v.length : 1,
    'toFHIRDate': (v) => { const d = new Date(v); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
    'genderToFHIR': (v) => { const m: Record<string, string> = { 'M': 'male', 'F': 'female', 'm': 'male', 'f': 'female', 'male': 'male', 'female': 'female' }; return m[String(v)] || 'unknown'; },
  };

  /**
   * Apply a safe, predefined transformation by name instead of eval/new Function.
   */
  protected applySafeTransform(transformName: string, value: any): any {
    const transform = BaseHISConnector.SAFE_TRANSFORMS[transformName];
    if (!transform) {
      this.logError('Data mapping', `Unknown transform: "${transformName}". Available: ${Object.keys(BaseHISConnector.SAFE_TRANSFORMS).join(', ')}`);
      return value;
    }
    return transform(value);
  }

  /**
   * Map data using configuration
   */
  protected mapData(sourceData: any, mappingConfig: any[]): FHIRResource {
    const mapped: any = {};

    for (const mapping of mappingConfig) {
      if (sourceData[mapping.sourceField] !== undefined) {
        let value = sourceData[mapping.sourceField];

        // Apply safe transformation if provided
        if (mapping.transformFn) {
          try {
            value = this.applySafeTransform(mapping.transformFn, value);
          } catch (e) {
            this.logError('Data mapping', `Transform failed for ${mapping.sourceField}`);
          }
        }

        mapped[mapping.targetField] = value;
      } else if (mapping.required) {
        throw new Error(`Required field missing: ${mapping.sourceField}`);
      }
    }

    return mapped as FHIRResource;
  }

  /**
   * Add sync error to tracking
   */
  protected addSyncError(resource: string, error: string, recoverable: boolean = true): void {
    const syncError: SyncError = {
      timestamp: new Date(),
      resource,
      error,
      recoverable,
    };

    this.syncErrors.push(syncError);
    // Keep only last 100 errors
    if (this.syncErrors.length > 100) {
      this.syncErrors = this.syncErrors.slice(-100);
    }
  }

  /**
   * Log message helper
   */
  protected logMessage(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    console.log(`[${this.config.name}${contextStr}] ${timestamp} - ${message}`);
  }

  /**
   * Log error helper
   */
  protected logError(context: string, error: string): void {
    const timestamp = new Date().toISOString();
    console.error(`[${this.config.name}] ${timestamp} [${context}] ERROR: ${error}`);
    this.lastError = new Error(error);
  }

  /**
   * Calculate next sync time
   */
  protected calculateNextSyncTime(): Date | undefined {
    if (!this.config.syncInterval || !this.config.lastSyncAt) {
      return undefined;
    }
    const nextTime = new Date(this.config.lastSyncAt);
    nextTime.setMinutes(nextTime.getMinutes() + this.config.syncInterval);
    return nextTime;
  }

  /**
   * Get last error
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Clear sync errors
   */
  clearSyncErrors(): void {
    this.syncErrors = [];
  }

  /**
   * Get formatted config (without sensitive data)
   */
  getSafeConfig(): Partial<HISConfig> {
    const { apiKey, clientSecret, password, ...safe } = this.config;
    return {
      ...safe,
      apiKey: apiKey ? '***' : undefined,
      clientSecret: clientSecret ? '***' : undefined,
      password: password ? '***' : undefined,
    };
  }
}
