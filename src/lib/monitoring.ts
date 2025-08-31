/**
 * Monitoring and metrics collection system
 */

import { logger } from './logger';

export interface MetricData {
  name: string;
  value: number;
  unit: 'count' | 'milliseconds' | 'bytes' | 'percentage' | 'rate';
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorMetric {
  operation: string;
  errorType: string;
  errorMessage: string;
  stack?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface BusinessMetric {
  event: string;
  value?: number;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Record a custom metric
   */
  recordMetric(metric: Omit<MetricData, 'timestamp'>): void {
    const metricWithTimestamp: MetricData = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(metricWithTimestamp);
    
    // Log metric in development
    if (!this.isProduction) {
      logger.debug(`Metric recorded: ${metric.name}`, {
        operation: 'monitoring.metric',
        metadata: metricWithTimestamp,
      });
    }

    // In production, you would send this to your monitoring service
    // e.g., DataDog, New Relic, CloudWatch, etc.
    this.sendToMonitoringService(metricWithTimestamp);
  }

  /**
   * Record performance metric
   */
  recordPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.performanceMetrics.push(performanceMetric);

    // Record as a metric as well
    this.recordMetric({
      name: `performance.${metric.operation}`,
      value: metric.duration,
      unit: 'milliseconds',
      tags: {
        success: metric.success.toString(),
        ...metric.metadata,
      },
    });

    logger.info(`Performance metric: ${metric.operation}`, {
      operation: 'monitoring.performance',
      duration: metric.duration,
      metadata: { success: metric.success, ...metric.metadata },
    });
  }

  /**
   * Record error metric
   */
  recordError(metric: Omit<ErrorMetric, 'timestamp'>): void {
    const errorMetric: ErrorMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.errorMetrics.push(errorMetric);

    // Record as a metric as well
    this.recordMetric({
      name: `error.${metric.operation}`,
      value: 1,
      unit: 'count',
      tags: {
        errorType: metric.errorType,
        ...metric.metadata,
      },
    });

    logger.error(`Error metric: ${metric.operation}`, {
      operation: 'monitoring.error',
      metadata: { errorType: metric.errorType, ...metric.metadata },
    }, new Error(metric.errorMessage));
  }

  /**
   * Record business metric
   */
  recordBusinessEvent(metric: Omit<BusinessMetric, 'timestamp'>): void {
    const businessMetric: BusinessMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.businessMetrics.push(businessMetric);

    // Record as a metric as well
    this.recordMetric({
      name: `business.${metric.event}`,
      value: metric.value || 1,
      unit: 'count',
      tags: {
        userId: metric.userId,
        ...metric.properties,
      },
    });

    logger.info(`Business event: ${metric.event}`, {
      operation: 'monitoring.business',
      metadata: { userId: metric.userId, value: metric.value, ...metric.properties },
    });
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics(): {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    timestamp: Date;
  } {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
    };
  }

  /**
   * Get recent metrics for debugging
   */
  getRecentMetrics(limit: number = 100): {
    metrics: MetricData[];
    performance: PerformanceMetric[];
    errors: ErrorMetric[];
    business: BusinessMetric[];
  } {
    return {
      metrics: this.metrics.slice(-limit),
      performance: this.performanceMetrics.slice(-limit),
      errors: this.errorMetrics.slice(-limit),
      business: this.businessMetrics.slice(-limit),
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  clearOldMetrics(olderThanMinutes: number = 60): void {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    this.metrics = this.metrics.filter(m => m.timestamp && m.timestamp > cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
    this.errorMetrics = this.errorMetrics.filter(m => m.timestamp > cutoff);
    this.businessMetrics = this.businessMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Send metric to external monitoring service
   */
  private sendToMonitoringService(metric: MetricData): void {
    // In production, implement integration with your monitoring service
    // Examples:
    
    // DataDog
    // dogstatsd.increment(metric.name, metric.value, metric.tags);
    
    // New Relic
    // newrelic.recordMetric(metric.name, metric.value);
    
    // CloudWatch
    // cloudwatch.putMetricData({...});
    
    // For now, just log in production
    if (this.isProduction) {
      console.log(JSON.stringify({
        type: 'metric',
        ...metric,
      }));
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

/**
 * Performance monitoring decorator
 */
export function monitorPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let error: Error | undefined;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err as Error;
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        
        monitoring.recordPerformance({
          operation: operationName,
          duration,
          success,
          metadata: {
            method: propertyName,
            args: args.length,
            error: error?.message,
          },
        });
      }
    };

    return descriptor;
  };
}

/**
 * Interview-specific monitoring functions
 */
export const interviewMonitoring = {
  /**
   * Monitor interview scheduling operations
   */
  recordSchedulingAttempt(success: boolean, duration: number, metadata?: Record<string, any>): void {
    monitoring.recordPerformance({
      operation: 'interview.scheduling',
      duration,
      success,
      metadata,
    });

    monitoring.recordBusinessEvent({
      event: 'interview_scheduling_attempt',
      value: success ? 1 : 0,
      properties: { success, ...metadata },
    });
  },

  /**
   * Monitor AI analysis operations
   */
  recordAIAnalysis(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    monitoring.recordPerformance({
      operation: `ai.${operation}`,
      duration,
      success,
      metadata,
    });

    monitoring.recordMetric({
      name: 'ai.analysis.duration',
      value: duration,
      unit: 'milliseconds',
      tags: {
        operation,
        success: success.toString(),
      },
    });
  },

  /**
   * Monitor database operations
   */
  recordDatabaseOperation(
    table: string,
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    monitoring.recordPerformance({
      operation: `db.${table}.${operation}`,
      duration,
      success,
      metadata,
    });

    monitoring.recordMetric({
      name: 'database.operation.duration',
      value: duration,
      unit: 'milliseconds',
      tags: {
        table,
        operation,
        success: success.toString(),
      },
    });
  },

  /**
   * Monitor notification operations
   */
  recordNotificationSent(
    type: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    monitoring.recordBusinessEvent({
      event: 'notification_sent',
      value: success ? 1 : 0,
      properties: { type, success, ...metadata },
    });

    monitoring.recordMetric({
      name: 'notification.sent',
      value: 1,
      unit: 'count',
      tags: {
        type,
        success: success.toString(),
      },
    });
  },

  /**
   * Monitor user activity
   */
  recordUserActivity(
    userId: string,
    activity: string,
    metadata?: Record<string, any>
  ): void {
    monitoring.recordBusinessEvent({
      event: 'user_activity',
      userId,
      properties: { activity, ...metadata },
    });
  },

  /**
   * Monitor API endpoint usage
   */
  recordAPIUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    monitoring.recordPerformance({
      operation: `api.${method.toLowerCase()}.${endpoint.replace(/\//g, '.')}`,
      duration,
      success: statusCode < 400,
      metadata: { statusCode, userId },
    });

    monitoring.recordMetric({
      name: 'api.request.duration',
      value: duration,
      unit: 'milliseconds',
      tags: {
        endpoint,
        method,
        status: statusCode.toString(),
      },
    });
  },
};

/**
 * Health check utilities
 */
export const healthCheck = {
  /**
   * Check database connectivity
   */
  async checkDatabase(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Simple query to check database connectivity
      // This would be replaced with actual database health check
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB check
      
      const latency = Date.now() - startTime;
      
      monitoring.recordMetric({
        name: 'health.database.latency',
        value: latency,
        unit: 'milliseconds',
      });
      
      return { healthy: true, latency };
    } catch (error) {
      monitoring.recordError({
        operation: 'health.database',
        errorType: 'connectivity',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Check AI service connectivity
   */
  async checkAIService(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // This would be replaced with actual AI service health check
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate AI service check
      
      const latency = Date.now() - startTime;
      
      monitoring.recordMetric({
        name: 'health.ai_service.latency',
        value: latency,
        unit: 'milliseconds',
      });
      
      return { healthy: true, latency };
    } catch (error) {
      monitoring.recordError({
        operation: 'health.ai_service',
        errorType: 'connectivity',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Overall system health check
   */
  async getSystemHealth(): Promise<{
    healthy: boolean;
    services: {
      database: { healthy: boolean; latency?: number; error?: string };
      aiService: { healthy: boolean; latency?: number; error?: string };
    };
    system: {
      uptime: number;
      memory: NodeJS.MemoryUsage;
    };
  }> {
    const [database, aiService] = await Promise.all([
      healthCheck.checkDatabase(),
      healthCheck.checkAIService(),
    ]);

    const system = monitoring.getHealthMetrics();
    const healthy = database.healthy && aiService.healthy;

    return {
      healthy,
      services: {
        database,
        aiService,
      },
      system: {
        uptime: system.uptime,
        memory: system.memory,
      },
    };
  },
};

/**
 * Cleanup old metrics periodically
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    monitoring.clearOldMetrics(60); // Clear metrics older than 1 hour
  }, 10 * 60 * 1000); // Run every 10 minutes
}