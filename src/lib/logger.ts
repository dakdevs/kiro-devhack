/**
 * Structured logging utility for the interview management system
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  resource?: string;
  resourceId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print for development
      const contextStr = entry.context 
        ? ` [${Object.entries(entry.context)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join(', ')}]`
        : '';
      
      const errorStr = entry.error 
        ? `\nError: ${entry.error.name}: ${entry.error.message}${
            entry.error.stack ? `\n${entry.error.stack}` : ''
          }`
        : '';

      console.log(
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`
      );
    } else {
      // JSON format for production
      console.log(JSON.stringify(entry));
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.output(this.formatLogEntry(LogLevel.ERROR, message, context, error));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatLogEntry(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatLogEntry(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.output(this.formatLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  // Specialized logging methods for interview management operations
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: Omit<LogContext, 'operation' | 'duration'>
  ): void {
    this.info(`Database ${operation} completed`, {
      ...context,
      operation: `db.${table}.${operation}`,
      duration,
    });
  }

  logAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method} ${path} - ${statusCode}`;
    
    this.output(this.formatLogEntry(level, message, {
      ...context,
      operation: `api.${method.toLowerCase()}.${path.replace(/\//g, '.')}`,
      duration,
      metadata: { statusCode },
    }));
  }

  logAIOperation(
    operation: string,
    duration: number,
    success: boolean,
    context?: LogContext,
    error?: Error
  ): void {
    const message = `AI ${operation} ${success ? 'completed' : 'failed'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    this.output(this.formatLogEntry(level, message, {
      ...context,
      operation: `ai.${operation}`,
      duration,
      metadata: { success },
    }, error));
  }

  logSchedulingOperation(
    operation: string,
    success: boolean,
    context?: LogContext,
    error?: Error
  ): void {
    const message = `Scheduling ${operation} ${success ? 'completed' : 'failed'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    this.output(this.formatLogEntry(level, message, {
      ...context,
      operation: `scheduling.${operation}`,
    }, error));
  }

  logNotificationOperation(
    operation: string,
    type: string,
    success: boolean,
    context?: LogContext,
    error?: Error
  ): void {
    const message = `Notification ${operation} (${type}) ${success ? 'completed' : 'failed'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    this.output(this.formatLogEntry(level, message, {
      ...context,
      operation: `notification.${operation}`,
      metadata: { type },
    }, error));
  }
}

// Export singleton instance
export const logger = new Logger();

// Performance monitoring utility
export class PerformanceMonitor {
  private startTime: number;
  private operation: string;
  private context?: LogContext;

  constructor(operation: string, context?: LogContext) {
    this.startTime = Date.now();
    this.operation = operation;
    this.context = context;
  }

  end(success: boolean = true, error?: Error): number {
    const duration = Date.now() - this.startTime;
    
    if (success) {
      logger.info(`Operation ${this.operation} completed`, {
        ...this.context,
        operation: this.operation,
        duration,
      });
    } else {
      logger.error(`Operation ${this.operation} failed`, {
        ...this.context,
        operation: this.operation,
        duration,
      }, error);
    }

    return duration;
  }
}

// Utility function to create performance monitor
export function monitorPerformance(
  operation: string,
  context?: LogContext
): PerformanceMonitor {
  return new PerformanceMonitor(operation, context);
}

// Utility function to wrap async operations with logging
export async function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const monitor = monitorPerformance(operation, context);
  
  try {
    const result = await fn();
    monitor.end(true);
    return result;
  } catch (error) {
    monitor.end(false, error as Error);
    throw error;
  }
}