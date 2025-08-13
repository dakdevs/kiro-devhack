import { logger } from './logger';

/**
 * Performance monitoring utilities for tracking system performance
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  memoryUsage?: NodeJS.MemoryUsage;
}

export interface PerformanceThresholds {
  warning: number; // milliseconds
  critical: number; // milliseconds
}

const DEFAULT_THRESHOLDS: Record<string, PerformanceThresholds> = {
  embedding_single: { warning: 500, critical: 1000 },
  embedding_batch: { warning: 2000, critical: 5000 },
  database_insert: { warning: 200, critical: 500 },
  database_search: { warning: 300, critical: 800 },
  api_ingest: { warning: 1000, critical: 3000 },
  api_search: { warning: 500, critical: 1500 },
  default: { warning: 1000, critical: 2000 }
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory
  private thresholds = DEFAULT_THRESHOLDS;

  /**
   * Start timing an operation
   */
  startTimer(operation: string): PerformanceTimer {
    return new PerformanceTimer(operation, this);
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    // Add memory usage if available
    if (typeof process !== 'undefined' && process.memoryUsage) {
      metric.memoryUsage = process.memoryUsage();
    }

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check thresholds and log warnings
    this.checkThresholds(metric);

    // Log performance metric
    logger.info('Performance metric recorded', {
      operation: metric.operation,
      duration: metric.duration,
      metadata: metric.metadata,
      memoryUsageMB: metric.memoryUsage ? {
        heapUsed: Math.round(metric.memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(metric.memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(metric.memoryUsage.rss / 1024 / 1024)
      } : undefined
    });
  }

  /**
   * Check if a metric exceeds performance thresholds
   */
  private checkThresholds(metric: PerformanceMetrics): void {
    const threshold = this.thresholds[metric.operation] || this.thresholds.default;

    if (metric.duration >= threshold.critical) {
      logger.error('Critical performance threshold exceeded', {
        operation: metric.operation,
        duration: metric.duration,
        threshold: threshold.critical,
        metadata: metric.metadata
      });
    } else if (metric.duration >= threshold.warning) {
      logger.warn('Performance warning threshold exceeded', {
        operation: metric.operation,
        duration: metric.duration,
        threshold: threshold.warning,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation?: string, timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    let filteredMetrics = this.metrics.filter(m => m.timestamp.getTime() >= windowStart);
    
    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (filteredMetrics.length === 0) {
      return {
        operation: operation || 'all',
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        timeWindow: timeWindow || 0
      };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      operation: operation || 'all',
      count: filteredMetrics.length,
      avgDuration: sum / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      timeWindow: timeWindow || 0
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get all recent metrics
   */
  getRecentMetrics(limit = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Set custom thresholds for an operation
   */
  setThresholds(operation: string, thresholds: PerformanceThresholds): void {
    this.thresholds[operation] = thresholds;
  }

  /**
   * Get health status based on recent performance
   */
  getHealthStatus(timeWindow = 5 * 60 * 1000): PerformanceHealth {
    const stats = this.getStats(undefined, timeWindow);
    const criticalOperations = [];
    const warningOperations = [];

    // Check each operation type
    for (const [operation, threshold] of Object.entries(this.thresholds)) {
      if (operation === 'default') continue;
      
      const opStats = this.getStats(operation, timeWindow);
      if (opStats.count === 0) continue;

      if (opStats.p95 >= threshold.critical) {
        criticalOperations.push({
          operation,
          p95: opStats.p95,
          threshold: threshold.critical
        });
      } else if (opStats.p95 >= threshold.warning) {
        warningOperations.push({
          operation,
          p95: opStats.p95,
          threshold: threshold.warning
        });
      }
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalOperations.length > 0) {
      status = 'critical';
    } else if (warningOperations.length > 0) {
      status = 'warning';
    }

    return {
      status,
      overallStats: stats,
      criticalOperations,
      warningOperations,
      timestamp: new Date()
    };
  }
}

export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private monitor: PerformanceMonitor;
  private metadata: Record<string, any> = {};

  constructor(operation: string, monitor: PerformanceMonitor) {
    this.operation = operation;
    this.monitor = monitor;
    this.startTime = performance.now();
  }

  /**
   * Add metadata to the performance metric
   */
  addMetadata(key: string, value: any): PerformanceTimer {
    this.metadata[key] = value;
    return this;
  }

  /**
   * End timing and record the metric
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    
    this.monitor.recordMetric({
      operation: this.operation,
      duration,
      timestamp: new Date(),
      metadata: this.metadata
    });

    return duration;
  }
}

export interface PerformanceStats {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  timeWindow: number;
}

export interface PerformanceHealth {
  status: 'healthy' | 'warning' | 'critical';
  overallStats: PerformanceStats;
  criticalOperations: Array<{
    operation: string;
    p95: number;
    threshold: number;
  }>;
  warningOperations: Array<{
    operation: string;
    p95: number;
    threshold: number;
  }>;
  timestamp: Date;
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Utility function to wrap any async function with performance monitoring
 */
export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = performanceMonitor.startTimer(operation);
  
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      timer.addMetadata(key, value);
    });
  }

  try {
    const result = await fn();
    timer.end();
    return result;
  } catch (error) {
    timer.addMetadata('error', true).end();
    throw error;
  }
}