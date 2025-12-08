/**
 * Firebase Error Handler with Retry Logic
 * Handles Firestore, Auth, and Storage errors gracefully
 * 
 * Features:
 * - Exponential backoff retry for transient errors
 * - Quota exceeded error handling
 * - User-friendly error messages
 * - Network error detection and handling
 * - Auth error recovery
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ErrorResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    userMessage: string;
    isRetryable: boolean;
    originalError: Error;
  };
}

export enum FirebaseErrorCode {
  // Firestore errors
  PERMISSION_DENIED = 'permission-denied',
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  INVALID_ARGUMENT = 'invalid-argument',
  DEADLINE_EXCEEDED = 'deadline-exceeded',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  FAILED_PRECONDITION = 'failed-precondition',
  UNAVAILABLE = 'unavailable',
  INTERNAL = 'internal',
  UNAUTHENTICATED = 'unauthenticated',

  // Auth errors
  AUTH_EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  AUTH_INVALID_EMAIL = 'auth/invalid-email',
  AUTH_WEAK_PASSWORD = 'auth/weak-password',
  AUTH_USER_NOT_FOUND = 'auth/user-not-found',
  AUTH_WRONG_PASSWORD = 'auth/wrong-password',
  AUTH_TOO_MANY_REQUESTS = 'auth/too-many-requests',
  AUTH_SESSION_EXPIRED = 'auth/session-expired',

  // Network errors
  NETWORK_ERROR = 'network-error',
  TIMEOUT_ERROR = 'timeout-error',
  OFFLINE = 'offline',
}

class ErrorHandler {
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  };

  /**
   * Execute function with automatic retry on transient errors
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<ErrorResult<T>> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error | null = null;
    let delayMs = retryConfig.initialDelayMs;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await fn();
        return { success: true, data: result };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorCode = this.getErrorCode(lastError);

        // Check if error is retryable
        if (!this.isRetryableError(errorCode) || attempt === retryConfig.maxAttempts) {
          return this.formatErrorResult(lastError, errorCode);
        }

        // Wait before retry (exponential backoff)
        await this.delay(delayMs);
        delayMs = Math.min(delayMs * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
      }
    }

    // Should not reach here, but handle gracefully
    return this.formatErrorResult(
      lastError || new Error('Unknown error'),
      'unknown-error'
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(code: string): boolean {
    const retryableCodes = [
      FirebaseErrorCode.DEADLINE_EXCEEDED,
      FirebaseErrorCode.UNAVAILABLE,
      FirebaseErrorCode.INTERNAL,
      FirebaseErrorCode.RESOURCE_EXHAUSTED,
      FirebaseErrorCode.NETWORK_ERROR,
      FirebaseErrorCode.TIMEOUT_ERROR,
      FirebaseErrorCode.AUTH_TOO_MANY_REQUESTS,
    ];

    return retryableCodes.includes(code as FirebaseErrorCode);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(code: string): string {
    const messages: Record<string, string> = {
      // Firestore
      [FirebaseErrorCode.PERMISSION_DENIED]: 'You do not have permission to access this resource.',
      [FirebaseErrorCode.NOT_FOUND]: 'The requested resource was not found.',
      [FirebaseErrorCode.ALREADY_EXISTS]: 'This resource already exists.',
      [FirebaseErrorCode.INVALID_ARGUMENT]: 'The provided data is invalid.',
      [FirebaseErrorCode.DEADLINE_EXCEEDED]: 'The request took too long. Please try again.',
      [FirebaseErrorCode.RESOURCE_EXHAUSTED]: 'Service quota exceeded. Please try again later.',
      [FirebaseErrorCode.UNAVAILABLE]: 'The service is temporarily unavailable. Please try again.',
      [FirebaseErrorCode.INTERNAL]: 'An internal server error occurred. Please try again.',
      [FirebaseErrorCode.UNAUTHENTICATED]: 'You must be logged in to perform this action.',

      // Auth
      [FirebaseErrorCode.AUTH_EMAIL_ALREADY_IN_USE]: 'This email is already associated with an account.',
      [FirebaseErrorCode.AUTH_INVALID_EMAIL]: 'Please enter a valid email address.',
      [FirebaseErrorCode.AUTH_WEAK_PASSWORD]: 'Password must be at least 6 characters.',
      [FirebaseErrorCode.AUTH_USER_NOT_FOUND]: 'No account found with this email.',
      [FirebaseErrorCode.AUTH_WRONG_PASSWORD]: 'Incorrect password. Please try again.',
      [FirebaseErrorCode.AUTH_TOO_MANY_REQUESTS]: 'Too many failed login attempts. Please try again later.',
      [FirebaseErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',

      // Network
      [FirebaseErrorCode.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
      [FirebaseErrorCode.TIMEOUT_ERROR]: 'Request timeout. Please check your internet and try again.',
      [FirebaseErrorCode.OFFLINE]: 'You are offline. Some features may be limited.',
    };

    return messages[code] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Format error result consistently
   */
  private formatErrorResult(error: Error, code: string): ErrorResult<never> {
    return {
      success: false,
      error: {
        code,
        message: error.message,
        userMessage: this.getUserMessage(code),
        isRetryable: this.isRetryableError(code),
        originalError: error,
      },
    };
  }

  /**
   * Extract error code from Firebase error
   */
  private getErrorCode(error: Error): string {
    // Firebase errors have a 'code' property
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }

    // Check message for common patterns
    const message = error.message.toLowerCase();

    if (message.includes('permission') || message.includes('denied')) {
      return FirebaseErrorCode.PERMISSION_DENIED;
    }
    if (message.includes('not found')) {
      return FirebaseErrorCode.NOT_FOUND;
    }
    if (message.includes('quota') || message.includes('limit')) {
      return FirebaseErrorCode.RESOURCE_EXHAUSTED;
    }
    if (message.includes('offline') || message.includes('network')) {
      return FirebaseErrorCode.NETWORK_ERROR;
    }
    if (message.includes('timeout') || message.includes('deadline')) {
      return FirebaseErrorCode.DEADLINE_EXCEEDED;
    }

    return 'unknown-error';
  }

  /**
   * Sleep helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle quota exceeded error specifically
   */
  handleQuotaExceeded(): ErrorResult<never> {
    console.error('[QUOTA EXCEEDED] Free tier limit reached. Operations blocked.');
    return {
      success: false,
      error: {
        code: FirebaseErrorCode.RESOURCE_EXHAUSTED,
        message: 'Firebase free tier quota exceeded',
        userMessage: 'Daily quota exceeded. Please try again tomorrow or upgrade your plan.',
        isRetryable: true,
        originalError: new Error('Quota exceeded'),
      },
    };
  }

  /**
   * Handle network offline error
   */
  handleOfflineError(): ErrorResult<never> {
    console.warn('[OFFLINE] Application is offline. Using cached data.');
    return {
      success: false,
      error: {
        code: FirebaseErrorCode.OFFLINE,
        message: 'Application is offline',
        userMessage: 'You are offline. Some features may be limited until you reconnect.',
        isRetryable: true,
        originalError: new Error('Offline'),
      },
    };
  }

  /**
   * Check if user is online
   */
  isOnline(): boolean {
    return typeof window !== 'undefined' && navigator.onLine;
  }

  /**
   * Setup online/offline listeners
   */
  setupNetworkListener(onStatusChange: (isOnline: boolean) => void): () => void {
    const handleOnline = () => onStatusChange(true);
    const handleOffline = () => onStatusChange(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Return cleanup function
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {};
  }

  /**
   * Log error with context
   */
  logError(context: string, error: Error, metadata?: Record<string, any>): void {
    const errorCode = this.getErrorCode(error);
    const isRetryable = this.isRetryableError(errorCode);

    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      code: errorCode,
      message: error.message,
      retryable: isRetryable,
      metadata,
    };

    // Console logging
    if (isRetryable) {
      console.warn('[RETRYABLE ERROR]', logEntry);
    } else {
      console.error('[ERROR]', logEntry);
    }

    // Could be extended to send to error tracking service (Sentry, etc.)
    // this.sendToErrorTracking(logEntry);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Wrapper for service methods to add automatic retry
 * Usage: await retryableFirestoreCall(async () => getDocs(query(...)));
 */
export async function retryableFirestoreCall<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<ErrorResult<T>> {
  try {
    const result = await errorHandler.executeWithRetry(fn);
    if (!result.success && context) {
      errorHandler.logError(context, result.error!.originalError);
    }
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (context) {
      errorHandler.logError(context, err);
    }
    return {
      success: false,
      error: {
        code: 'unknown-error',
        message: err.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        isRetryable: false,
        originalError: err,
      },
    };
  }
}

/**
 * Hook-friendly error handling
 * Usage: const { execute, isLoading, error } = useRetryableOperation();
 */
export function useRetryableOperation<T>() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fn();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const code = errorHandler['getErrorCode'](error);
      const message = errorHandler.getUserMessage(code);

      setError(message);
      errorHandler.logError('useRetryableOperation', error);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

// Note: React import needed for useRetryableOperation
import React from 'react';
