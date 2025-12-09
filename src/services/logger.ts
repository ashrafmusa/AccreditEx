type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.isDevelopment && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(prefix, message, data);
        break;
      case 'info':
        if (this.isDevelopment) console.info(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        // In production, send to error tracking service
        if (!this.isDevelopment) {
          this.sendToErrorTracking(message, data);
        }
        break;
    }
  }

  private sendToErrorTracking(message: string, data?: unknown): void {
    // Implement error tracking service integration (e.g., Sentry)
    // For now, just store in sessionStorage for debugging
    try {
      const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
      errors.push({ timestamp: new Date().toISOString(), message, data });
      sessionStorage.setItem('app_errors', JSON.stringify(errors.slice(-50)));
    } catch {
      // Silently fail if storage is full
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
