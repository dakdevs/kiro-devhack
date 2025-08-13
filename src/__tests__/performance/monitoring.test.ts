import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor, PerformanceTimer, withPerformanceMonitoring } from '~/lib/performance-monitor';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor.clearMetrics();
  });

  describe('PerformanceTimer', () => {
    it('should measure operation duration', async () => {
      const timer = performanceMonitor.startTimer('test_operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = timer.end();
      
      expect(duration).toBeGreaterThan(90); // Allow for some timing variance
      expect(duration).toBeLessThan(150);
    });

    it('should record metadata with metrics', async () => {
      const timer = performanceMonitor.startTimer('test_with_metadata');
      timer.addMetadata('userId', '123')
           .addMetadata('operation', 'test');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      timer.end();
      
      const metrics = performanceMonitor.getRecentMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata).toEqual({
        userId: '123',
        operation: 'test'
      });
    });
  });

  describe('Performance Statistics', () => {
    it('should calculate correct statistics', async () => {
      // Record multiple metrics
      const durations = [100, 200, 300, 400, 500];
      
      for (const duration of durations) {
        const timer = performanceMonitor.startTimer('test_stats');
        await new Promise(resolve => setTimeout(resolve, duration / 10)); // Scale down for test speed
        timer.end();
      }
      
      const stats = performanceMonitor.getStats('test_stats');
      
      expect(stats.count).toBe(5);
      expect(stats.minDuration).toBeGreaterThan(0);
      expect(stats.maxDuration).toBeGreaterThan(stats.minDuration);
      expect(stats.avgDuration).toBeGreaterThan(0);
      expect(stats.p50).toBeGreaterThan(0);
      expect(stats.p95).toBeGreaterThan(stats.p50);
      expect(stats.p99).toBeGreaterThan(stats.p95);
    });

    it('should filter by time window', async () => {
      // Record an old metric
      const oldTimer = performanceMonitor.startTimer('old_operation');
      oldTimer.end();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Record a new metric
      const newTimer = performanceMonitor.startTimer('new_operation');
      newTimer.end();
      
      // Get stats for last 50ms (should only include new metric)
      const recentStats = performanceMonitor.getStats(undefined, 50);
      const allStats = performanceMonitor.getStats();
      
      expect(allStats.count).toBe(2);
      expect(recentStats.count).toBeLessThanOrEqual(1); // May be 0 or 1 depending on timing
    });

    it('should handle empty metrics gracefully', () => {
      const stats = performanceMonitor.getStats('nonexistent_operation');
      
      expect(stats.count).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.minDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
      expect(stats.p50).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.p99).toBe(0);
    });
  });

  describe('Performance Thresholds', () => {
    it('should detect threshold violations', async () => {
      // Set a very low threshold for testing
      performanceMonitor.setThresholds('slow_operation', {
        warning: 50,
        critical: 100
      });
      
      // Mock logger to capture warnings
      const mockWarn = vi.fn();
      const mockError = vi.fn();
      
      // Mock the logger
      vi.doMock('~/lib/logger', () => ({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: mockError
        }
      }));
      
      // Record a slow operation
      const timer = performanceMonitor.startTimer('slow_operation');
      await new Promise(resolve => setTimeout(resolve, 120)); // Exceeds critical threshold
      timer.end();
      
      // Should have logged an error for critical threshold
      expect(mockError).toHaveBeenCalledWith(
        'Critical performance threshold exceeded',
        expect.objectContaining({
          operation: 'slow_operation',
          threshold: 100
        })
      );
    });
  });

  describe('Health Status', () => {
    it('should report healthy status when all operations are fast', async () => {
      // Record some fast operations
      for (let i = 0; i < 5; i++) {
        const timer = performanceMonitor.startTimer('fast_operation');
        await new Promise(resolve => setTimeout(resolve, 10));
        timer.end();
      }
      
      const health = performanceMonitor.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.criticalOperations).toHaveLength(0);
      expect(health.warningOperations).toHaveLength(0);
    });

    it('should report warning status for slow operations', async () => {
      // Set thresholds
      performanceMonitor.setThresholds('warning_operation', {
        warning: 50,
        critical: 200
      });
      
      // Record operations that exceed warning but not critical
      for (let i = 0; i < 5; i++) {
        const timer = performanceMonitor.startTimer('warning_operation');
        await new Promise(resolve => setTimeout(resolve, 80)); // Exceeds warning
        timer.end();
      }
      
      const health = performanceMonitor.getHealthStatus();
      
      expect(health.status).toBe('warning');
      expect(health.warningOperations.length).toBeGreaterThan(0);
      expect(health.criticalOperations).toHaveLength(0);
    });
  });

  describe('withPerformanceMonitoring utility', () => {
    it('should monitor async function performance', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test result';
      };
      
      const result = await withPerformanceMonitoring(
        'utility_test',
        testFunction,
        { testMetadata: 'value' }
      );
      
      expect(result).toBe('test result');
      
      const metrics = performanceMonitor.getRecentMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('utility_test');
      expect(metrics[0].metadata).toEqual({ testMetadata: 'value' });
      expect(metrics[0].duration).toBeGreaterThan(90);
    });

    it('should handle errors and still record metrics', async () => {
      const errorFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Test error');
      };
      
      await expect(
        withPerformanceMonitoring('error_test', errorFunction)
      ).rejects.toThrow('Test error');
      
      const metrics = performanceMonitor.getRecentMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('error_test');
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should record memory usage with metrics', async () => {
      const timer = performanceMonitor.startTimer('memory_test');
      
      // Create some objects to use memory
      const largeArray = new Array(10000).fill('test data');
      
      timer.end();
      
      const metrics = performanceMonitor.getRecentMetrics(1);
      expect(metrics).toHaveLength(1);
      
      if (typeof process !== 'undefined' && process.memoryUsage) {
        expect(metrics[0].memoryUsage).toBeDefined();
        expect(metrics[0].memoryUsage!.heapUsed).toBeGreaterThan(0);
        expect(metrics[0].memoryUsage!.heapTotal).toBeGreaterThan(0);
      }
      
      // Clean up
      largeArray.length = 0;
    });
  });

  describe('Metrics Cleanup', () => {
    it('should limit stored metrics to prevent memory leaks', async () => {
      // Record more metrics than the limit (1000)
      for (let i = 0; i < 1100; i++) {
        const timer = performanceMonitor.startTimer(`test_${i}`);
        timer.end();
      }
      
      const allMetrics = performanceMonitor.getRecentMetrics(2000);
      expect(allMetrics.length).toBeLessThanOrEqual(1000);
    });

    it('should clear all metrics when requested', async () => {
      // Record some metrics
      for (let i = 0; i < 10; i++) {
        const timer = performanceMonitor.startTimer(`test_${i}`);
        timer.end();
      }
      
      expect(performanceMonitor.getRecentMetrics().length).toBe(10);
      
      performanceMonitor.clearMetrics();
      
      expect(performanceMonitor.getRecentMetrics().length).toBe(0);
    });
  });

  describe('Percentile Calculations', () => {
    it('should calculate percentiles correctly', async () => {
      // Record metrics with known durations
      const durations = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      
      for (const duration of durations) {
        const timer = performanceMonitor.startTimer('percentile_test');
        // Mock the duration by directly recording the metric
        performanceMonitor.recordMetric({
          operation: 'percentile_test',
          duration,
          timestamp: new Date()
        });
      }
      
      const stats = performanceMonitor.getStats('percentile_test');
      
      expect(stats.count).toBe(10);
      expect(stats.minDuration).toBe(100);
      expect(stats.maxDuration).toBe(1000);
      expect(stats.avgDuration).toBe(550);
      
      // P50 should be around 500-600
      expect(stats.p50).toBeGreaterThanOrEqual(500);
      expect(stats.p50).toBeLessThanOrEqual(600);
      
      // P95 should be around 950-1000
      expect(stats.p95).toBeGreaterThanOrEqual(950);
      expect(stats.p95).toBeLessThanOrEqual(1000);
      
      // P99 should be close to 1000
      expect(stats.p99).toBeGreaterThanOrEqual(990);
      expect(stats.p99).toBeLessThanOrEqual(1000);
    });
  });
});