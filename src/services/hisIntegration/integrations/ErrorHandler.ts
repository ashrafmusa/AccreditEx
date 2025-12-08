/**
 * HIS Integration Error Handler
 * Centralized error handling and recovery for HIS integrations
 */

import { SyncError, IntegrationLog } from '../types';

export class HISErrorHandler {
  private static readonly RECOVERABLE_ERRORS = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EHOSTUNREACH',
  ];

  private static readonly PERMANENT_ERRORS = ['EACCES', 'ENOENT', 'EISDIR'];

  /**
   * Determine if error is recoverable
   */
  static isRecoverable(error: Error | string): boolean {
    const errorStr = error instanceof Error ? error.message : String(error);

    for (const recoverableError of this.RECOVERABLE_ERRORS) {
      if (errorStr.includes(recoverableError)) {
        return true;
      }
    }

    for (const permanentError of this.PERMANENT_ERRORS) {
      if (errorStr.includes(permanentError)) {
        return false;
      }
    }

    // Default: try to recover from unknown errors
    return true;
  }

  /**
   * Create sync error object
   */
  static createSyncError(resource: string, error: Error | string, details?: any): SyncError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      timestamp: new Date(),
      resource,
      error: errorMessage,
      recoverable: this.isRecoverable(error),
      details,
    };
  }

  /**
   * Create integration log entry
   */
  static createLog(
    hisId: string,
    hisName: string,
    action: string,
    status: 'success' | 'error' | 'warning' | 'info',
    message: string,
    options?: {
      resourceType?: string;
      recordCount?: number;
      duration?: number;
      userId?: string;
      details?: any;
    }
  ): Omit<IntegrationLog, 'id' | 'timestamp'> {
    return {
      hisId,
      hisName,
      action: action as any,
      status,
      message,
      resourceType: options?.resourceType,
      recordCount: options?.recordCount,
      duration: options?.duration,
      userId: options?.userId,
      details: options?.details,
    };
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: Error | string): string {
    const message = error instanceof Error ? error.message : String(error);

    // Replace technical jargon with user-friendly messages
    const replacements: Record<string, string> = {
      ECONNREFUSED: 'Connection refused - HIS system may be offline',
      ETIMEDOUT: 'Connection timeout - HIS system is slow to respond',
      ENOTFOUND: 'Host not found - check base URL configuration',
      EHOSTUNREACH: 'Host unreachable - network issue or firewall',
      'HTTP 401': 'Authentication failed - check credentials',
      'HTTP 403': 'Access forbidden - check permissions',
      'HTTP 404': 'Resource not found - check endpoint URL',
      'HTTP 500': 'Server error - HIS system issue',
      'HTTP 503': 'Service unavailable - HIS system is down',
    };

    let formattedMessage = message;
    for (const [key, value] of Object.entries(replacements)) {
      if (message.includes(key)) {
        formattedMessage = value;
        break;
      }
    }

    return formattedMessage;
  }

  /**
   * Get retry delay with exponential backoff
   */
  static getRetryDelay(attemptNumber: number, baseDelay: number = 1000, maxDelay: number = 60000): number {
    // Exponential backoff: baseDelay * 2^attemptNumber
    const delay = baseDelay * Math.pow(2, attemptNumber);
    return Math.min(delay, maxDelay);
  }

  /**
   * Validate retry configuration
   */
  static validateRetryConfig(retryCount: number, retryDelay: number): boolean {
    return retryCount >= 0 && retryCount <= 10 && retryDelay >= 0 && retryDelay <= 300000;
  }

  /**
   * Should retry based on error and attempt count
   */
  static shouldRetry(error: Error | string, attemptCount: number, maxRetries: number): boolean {
    if (attemptCount >= maxRetries) {
      return false;
    }

    return this.isRecoverable(error);
  }

  /**
   * Log error with context
   */
  static logError(context: string, error: Error | string, additionalData?: any): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[HIS Integration] ${timestamp} [${context}] ERROR:`, errorMessage);

    if (additionalData) {
      console.error('Additional Data:', additionalData);
    }
  }

  /**
   * Log warning
   */
  static logWarning(context: string, message: string): void {
    const timestamp = new Date().toISOString();
    console.warn(`[HIS Integration] ${timestamp} [${context}] WARNING: ${message}`);
  }

  /**
   * Aggregate errors from multiple syncs
   */
  static aggregateErrors(errors: SyncError[]): { total: number; recoverable: number; permanent: number } {
    return {
      total: errors.length,
      recoverable: errors.filter((e) => e.recoverable).length,
      permanent: errors.filter((e) => !e.recoverable).length,
    };
  }

  /**
   * Create error summary for user
   */
  static createErrorSummary(errors: SyncError[]): string {
    if (errors.length === 0) return 'No errors';

    const aggregated = this.aggregateErrors(errors);
    const lines = [
      `Total Errors: ${aggregated.total}`,
      `Recoverable: ${aggregated.recoverable}`,
      `Permanent: ${aggregated.permanent}`,
    ];

    // Add top errors
    const uniqueErrors = new Map<string, number>();
    for (const error of errors) {
      uniqueErrors.set(error.error, (uniqueErrors.get(error.error) || 0) + 1);
    }

    const topErrors = Array.from(uniqueErrors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([error, count]) => `  - ${error} (${count}x)`);

    if (topErrors.length > 0) {
      lines.push('Top Errors:');
      lines.push(...topErrors);
    }

    return lines.join('\n');
  }
}

/**
 * Custom error classes for HIS integration
 */

export class HISConnectionError extends Error {
  constructor(message: string, public readonly recoverable: boolean = true) {
    super(`HIS Connection Error: ${message}`);
    this.name = 'HISConnectionError';
  }
}

export class HISAuthenticationError extends Error {
  constructor(message: string) {
    super(`HIS Authentication Error: ${message}`);
    this.name = 'HISAuthenticationError';
  }
}

export class HISDataError extends Error {
  constructor(message: string, public readonly resourceType: string, public readonly recoverable: boolean = true) {
    super(`HIS Data Error (${resourceType}): ${message}`);
    this.name = 'HISDataError';
  }
}

export class HISConfigurationError extends Error {
  constructor(message: string) {
    super(`HIS Configuration Error: ${message}`);
    this.name = 'HISConfigurationError';
  }
}

export class HISSyncError extends Error {
  constructor(
    message: string,
    public readonly errors: SyncError[] = []
  ) {
    super(`HIS Sync Error: ${message}`);
    this.name = 'HISSyncError';
  }
}
