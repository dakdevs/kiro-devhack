/**
 * Structured logging utility for debugging and monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
}

class Logger {
  private minLevel: LogLevel;
  private requestId: string | null = null;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  clearRequestId() {
    this.requestId = null;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.requestId || undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // In development, use console with colors
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
      };
      
      const reset = '\x1b[0m';
      const levelName = LogLevel[level];
      const color = colors[level];
      
      console.log(
        `${color}[${entry.timestamp}] ${levelName}${reset}: ${message}`,
        context ? JSON.stringify(context, null, 2) : '',
        error ? `\n${error.stack}` : ''
      );
    } else {
      // In production, output structured JSON
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // API-specific logging methods
  apiRequest(method: string, endpoint: string, context?: Record<string, any>) {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      endpoint,
      method,
    });
  }

  apiResponse(method: string, endpoint: string, statusCode: number, duration: number, context?: Record<string, any>) {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${endpoint} - ${statusCode}`, {
      ...context,
      endpoint,
      method,
      statusCode,
      duration,
    });
  }

  embeddingRequest(operation: string, inputCount: number, context?: Record<string, any>) {
    this.info(`Embedding Request: ${operation}`, {
      ...context,
      operation,
      inputCount,
    });
  }

  embeddingResponse(operation: string, outputCount: number, duration: number, context?: Record<string, any>) {
    this.info(`Embedding Response: ${operation}`, {
      ...context,
      operation,
      outputCount,
      duration,
    });
  }

  embeddingError(operation: string, error: Error, context?: Record<string, any>) {
    this.error(`Embedding Error: ${operation}`, {
      ...context,
      operation,
    }, error);
  }

  databaseQuery(query: string, duration: number, context?: Record<string, any>) {
    this.debug(`Database Query`, {
      ...context,
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      duration,
    });
  }

  databaseError(operation: string, error: Error, context?: Record<string, any>) {
    this.error(`Database Error: ${operation}`, {
      ...context,
      operation,
    }, error);
  }

  validationError(field: string, value: any, error: string, context?: Record<string, any>) {
    this.warn(`Validation Error: ${field}`, {
      ...context,
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      validationError: error,
    });
  }

  rateLimitExceeded(identifier: string, endpoint: string, context?: Record<string, any>) {
    this.warn(`Rate Limit Exceeded`, {
      ...context,
      identifier,
      endpoint,
    });
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>) {
    this.error(`Security Event: ${event}`, {
      ...context,
      event,
      severity,
    });
  }
}

// Global logger instance
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

/**
 * Request ID middleware utility
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Performance monitoring utilities
 */
export class PerformanceTimer {
  private startTime: number;
  private markers: Map<string, number> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  mark(name: string) {
    this.markers.set(name, Date.now() - this.startTime);
  }

  getDuration(name?: string): number {
    if (name) {
      return this.markers.get(name) || 0;
    }
    return Date.now() - this.startTime;
  }

  getMarkers(): Record<string, number> {
    return Object.fromEntries(this.markers);
  }

  log(operation: string, context?: Record<string, any>) {
    const duration = this.getDuration();
    const markers = this.getMarkers();
    
    logger.info(`Performance: ${operation}`, {
      ...context,
      duration,
      markers,
    });
  }
}

/**
 * Error tracking utilities
 */
interface ErrorMetrics {
  count: number;
  lastOccurrence: string;
  examples: Array<{
    timestamp: string;
    message: string;
    context?: Record<string, any>;
  }>;
}

class ErrorTracker {
  private errors = new Map<string, ErrorMetrics>();
  private readonly maxExamples = 5;

  track(error: Error, context?: Record<string, any>) {
    const key = `${error.name}:${error.message}`;
    const existing = this.errors.get(key);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = new Date().toISOString();
      
      // Keep only recent examples
      existing.examples.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        context,
      });
      
      if (existing.examples.length > this.maxExamples) {
        existing.examples.shift();
      }
    } else {
      this.errors.set(key, {
        count: 1,
        lastOccurrence: new Date().toISOString(),
        examples: [{
          timestamp: new Date().toISOString(),
          message: error.message,
          context,
        }],
      });
    }
  }

  getMetrics(): Record<string, ErrorMetrics> {
    return Object.fromEntries(this.errors);
  }

  getTopErrors(limit: number = 10): Array<{ error: string; metrics: ErrorMetrics }> {
    return Array.from(this.errors.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([error, metrics]) => ({ error, metrics }));
  }

  clear() {
    this.errors.clear();
  }
}

export const errorTracker = new ErrorTracker();

/**
 * Health check utilities
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'degraded';
    embeddings: 'up' | 'down' | 'degraded';
  };
  metrics: {
    uptime: number;
    errorRate: number;
    responseTime: number;
  };
}

class HealthMonitor {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private readonly maxResponseTimes = 100;

  recordRequest(duration: number, isError: boolean = false) {
    this.requestCount++;
    if (isError) this.errorCount++;
    
    this.responseTimes.push(duration);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
  }

  getStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 0.1 || avgResponseTime > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 0.05 || avgResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: 'up', // TODO: Implement actual health checks
        embeddings: 'up', // TODO: Implement actual health checks
      },
      metrics: {
        uptime,
        errorRate,
        responseTime: avgResponseTime,
      },
    };
  }
}

export const healthMonitor = new HealthMonitor();