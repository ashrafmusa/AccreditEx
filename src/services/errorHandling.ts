import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'VALIDATION_ERROR', userMessage, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'AUTH_ERROR', userMessage, 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'NOT_FOUND', userMessage, 404);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'PERMISSION_DENIED', userMessage, 403);
    this.name = 'PermissionError';
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'User not found. Please check your credentials.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'firestore/permission-denied': 'You do not have permission to perform this action.',
  'firestore/not-found': 'The requested resource was not found.',
  'firestore/unavailable': 'Service temporarily unavailable. Please try again.',
  'storage/unauthorized': 'You do not have permission to access this file.',
  'storage/object-not-found': 'File not found.',
  'storage/quota-exceeded': 'Storage quota exceeded.',
};

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Check for Firebase error codes
    const errorCode = (error as { code?: string }).code;
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }

    // Check for common error patterns
    const message = error.message.toLowerCase();
    if (message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (message.includes('permission')) {
      return 'You do not have permission to perform this action.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

export function handleError(error: unknown, context?: string): string {
  logger.error(`Error in ${context || 'unknown context'}`, error);

  const userMessage = getUserFriendlyMessage(error);

  // Track error for analytics (implement as needed)
  if (error instanceof Error) {
    trackError(error, context);
  }

  return userMessage;
}

function trackError(error: Error, context?: string): void {
  // Implement error tracking (e.g., send to analytics service)
  // For now, store in sessionStorage for debugging
  try {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    const errors = JSON.parse(sessionStorage.getItem('error_log') || '[]');
    errors.push(errorLog);
    sessionStorage.setItem('error_log', JSON.stringify(errors.slice(-100)));
  } catch {
    // Silently fail if storage is full
  }
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = handleError(error, context);
    throw new AppError(
      error instanceof Error ? error.message : 'Unknown error',
      'EXECUTION_ERROR',
      message
    );
  }
}
