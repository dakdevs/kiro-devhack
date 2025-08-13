import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createRequestLogger, logPerformance } from '~/lib/logger';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Test info message')
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Test error message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN'),
        expect.stringContaining('Test warning message')
      );
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.stringContaining('Test debug message')
      );
    });
  });

  describe('Structured logging', () => {
    it('should log with metadata', () => {
      const metadata = { userId: '123', action: 'test' };
      logger.info('Test message with metadata', metadata);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Test message with metadata'),
        expect.stringContaining(JSON.stringify(metadata))
      );
    });

    it('should handle complex metadata objects', () => {
      const metadata = {
        user: { id: '123', name: 'Test User' },
        request: { method: 'POST', path: '/api/test' },
        performance: { duration: 150, memory: 1024 }
      };
      
      logger.info('Complex metadata test', metadata);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Complex metadata test'),
        expect.stringContaining(JSON.stringify(metadata))
      );
    });

    it('should handle metadata with circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Should not throw error
      expect(() => logger.info('Circular reference test', circular)).not.toThrow();
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Circular reference test'),
        expect.stringContaining('[Circular]')
      );
    });
  });

  describe('Error logging', () => {
    it('should log Error objects with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { error });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Error occurred'),
        expect.stringContaining(error.stack || '')
      );
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'Custom error', code: 'TEST_ERROR' };
      logger.error('Custom error occurred', { error });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Custom error occurred'),
        expect.stringContaining(JSON.stringify(error))
      );
    });
  });

  describe('Request logging', () => {
    it('should create request logger with correlation ID', () => {
      const requestLogger = createRequestLogger('test-correlation-id');
      
      requestLogger.info('Request test message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Request test message'),
        expect.stringContaining('test-correlation-id')
      );
    });

    it('should generate correlation ID if not provided', () => {
      const requestLogger = createRequestLogger();
      
      requestLogger.info('Auto-generated correlation ID test');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Auto-generated correlation ID test'),
        expect.stringMatching(/correlationId.*[a-f0-9-]{36}/)
      );
    });

    it('should include request metadata in all logs', () => {
      const requestLogger = createRequestLogger('test-id');
      
      requestLogger.error('Request error', { statusCode: 500 });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Request error'),
        expect.stringContaining('test-id'),
        expect.stringContaining('500')
      );
    });
  });

  describe('Performance logging', () => {
    it('should log performance metrics', async () => {
      const operation = vi.fn().mockResolvedValue('test result');
      
      const result = await logPerformance('test-operation', operation);
      
      expect(result).toBe('test result');
      expect(operation).toHaveBeenCalledOnce();
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Performance'),
        expect.stringContaining('test-operation'),
        expect.stringContaining('duration')
      );
    });

    it('should log performance even when operation throws', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      await expect(logPerformance('failing-operation', operation)).rejects.toThrow('Operation failed');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Performance'),
        expect.stringContaining('failing-operation'),
        expect.stringContaining('duration')
      );
    });

    it('should include memory usage in performance logs', async () => {
      const operation = vi.fn().mockResolvedValue('result');
      
      await logPerformance('memory-test', operation);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Performance'),
        expect.stringContaining('memory')
      );
    });

    it('should handle synchronous operations', async () => {
      const operation = vi.fn().mockReturnValue('sync result');
      
      const result = await logPerformance('sync-operation', operation);
      
      expect(result).toBe('sync result');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Performance'),
        expect.stringContaining('sync-operation')
      );
    });
  });

  describe('Log formatting', () => {
    it('should include timestamp in logs', () => {
      logger.info('Timestamp test');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        expect.any(String)
      );
    });

    it('should format log levels consistently', () => {
      logger.info('Info test');
      logger.warn('Warn test');
      logger.error('Error test');
      logger.debug('Debug test');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.any(String)
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.any(String)
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.any(String)
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.any(String)
      );
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      
      expect(() => logger.info(longMessage)).not.toThrow();
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining(longMessage)
      );
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Message with "quotes", \\backslashes\\, and unicode: 你好 🌍';
      
      logger.info(specialMessage);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining(specialMessage)
      );
    });
  });

  describe('Environment-specific behavior', () => {
    it('should handle different NODE_ENV values', () => {
      // Test that logger works regardless of environment
      // In a real implementation, you might have different behavior for production vs development
      
      logger.debug('Debug message');
      
      // Debug messages should still be logged in test environment
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.stringContaining('Debug message')
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined values', () => {
      logger.info('Null test', { value: null });
      logger.info('Undefined test', { value: undefined });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Null test'),
        expect.stringContaining('null')
      );
    });

    it('should handle empty objects and arrays', () => {
      logger.info('Empty object', {});
      logger.info('Empty array', []);
      
      expect(mockConsole.log).toHaveBeenCalledTimes(2);
    });

    it('should handle functions in metadata', () => {
      const metadata = {
        callback: () => 'test',
        data: 'normal data'
      };
      
      logger.info('Function in metadata', metadata);
      
      // Functions should be serialized or handled gracefully
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Function in metadata'),
        expect.any(String)
      );
    });
  });
});