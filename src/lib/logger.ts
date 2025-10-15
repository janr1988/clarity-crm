/**
 * Structured logging utility for the Clarity CRM application
 * Provides consistent logging across all components with context and levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  env: string;
  service: string;
}

class Logger {
  private serviceName = 'clarity-crm';
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      service: this.serviceName,
      env: process.env.NODE_ENV || 'development',
      ...(context && { context }),
    };

    // Add error details if provided
    if (error) {
      logEntry.context = {
        ...logEntry.context,
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        },
      };
    }

    // Format output based on environment
    if (this.isDevelopment) {
      this.logToConsole(level, logEntry);
    } else {
      this.logToProduction(level, logEntry);
    }
  }

  /**
   * Development console logging with colors
   */
  private logToConsole(level: LogLevel, entry: LogEntry) {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    const color = colors[level];
    
    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} ${entry.message}`,
      entry.context ? entry.context : ''
    );
  }

  /**
   * Production logging (JSON format for log aggregation)
   */
  private logToProduction(level: LogLevel, entry: LogEntry) {
    // In production, send to logging service (e.g., Datadog, LogRocket, etc.)
    // For now, we'll use console.log with JSON format
    console.log(JSON.stringify(entry));
    
    // TODO: Integrate with production logging service
    // Example: Sentry, Datadog, CloudWatch, etc.
  }

  /**
   * Debug level logging - only shown in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Info level logging - general information
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Warning level logging - something unexpected but not critical
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Error level logging - something went wrong
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  /**
   * API request logging with timing
   */
  apiRequest(method: string, url: string, context?: LogContext) {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      operation: 'api_request',
    });
  }

  /**
   * API response logging with timing
   */
  apiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `API Response: ${method} ${url} ${statusCode}`, {
      ...context,
      operation: 'api_response',
      duration,
      statusCode,
    });
  }

  /**
   * Database operation logging
   */
  dbOperation(operation: string, table: string, duration?: number, context?: LogContext) {
    this.debug(`DB Operation: ${operation} on ${table}`, {
      ...context,
      operation: 'db_operation',
      table,
      duration,
    });
  }

  /**
   * Authentication logging
   */
  auth(message: string, userId?: string, context?: LogContext) {
    this.info(`Auth: ${message}`, {
      ...context,
      operation: 'authentication',
      userId,
    });
  }

  /**
   * Business logic logging
   */
  business(operation: string, message: string, context?: LogContext) {
    this.info(`Business: ${operation} - ${message}`, {
      ...context,
      operation: 'business_logic',
    });
  }

  /**
   * Performance logging
   */
  performance(operation: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation: 'performance',
      duration,
    });
  }

  /**
   * Security logging
   */
  security(message: string, context?: LogContext) {
    this.warn(`Security: ${message}`, {
      ...context,
      operation: 'security',
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogContext, LogEntry };
