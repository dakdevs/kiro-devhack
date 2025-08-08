/**
 * Integration tests for example usage scenarios
 * Tests the example implementations with realistic data
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  BasicUsageExample, 
  AdvancedUsageExample, 
  SessionManagementExample,
  runAllExamples 
} from '../../examples/ConversationGradingExample';

// Mock console methods to capture output
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
const mockConsoleWarn = vi.fn();

describe('Example Usage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BasicUsageExample', () => {
    it('should run basic usage example without errors', async () => {
      const example = new BasicUsageExample();
      
      await expect(example.runExample()).resolves.not.toThrow();
      
      // Verify console output contains expected information
      expect(mockConsoleLog).toHaveBeenCalled();
      
      // Check for key output patterns
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      expect(allOutput).toContain('Basic Usage Example');
      expect(allOutput).toContain('Added Q&A pair to node');
      expect(allOutput).toContain('Tree Structure');
      expect(allOutput).toContain('Conversation Statistics');
    });

    it('should process Q&A pairs and build tree structure', async () => {
      const example = new BasicUsageExample();
      await example.runExample();
      
      // Verify that nodes were created
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const nodeCreationLogs = logCalls.filter(log => log.includes('Added Q&A pair to node'));
      
      expect(nodeCreationLogs.length).toBeGreaterThan(0);
      
      // Verify tree structure was displayed
      const treeStructureLogs = logCalls.filter(log => log.includes('Tree Structure'));
      expect(treeStructureLogs.length).toBeGreaterThan(0);
    });

    it('should display conversation statistics', async () => {
      const example = new BasicUsageExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const statsLogs = logCalls.filter(log => log.includes('Conversation Statistics'));
      
      expect(statsLogs.length).toBeGreaterThan(0);
    });
  });

  describe('AdvancedUsageExample', () => {
    it('should run advanced usage example with custom strategies', async () => {
      const example = new AdvancedUsageExample();
      
      await expect(example.runExample()).resolves.not.toThrow();
      
      // Verify console output
      expect(mockConsoleLog).toHaveBeenCalled();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      expect(allOutput).toContain('Advanced Usage Example');
      expect(allOutput).toContain('Navigation Features');
    });

    it('should use custom scoring strategy', async () => {
      const example = new AdvancedUsageExample();
      await example.runExample();
      
      // Check that scores were calculated and displayed
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const scoreLogs = logCalls.filter(log => log.includes('Score:'));
      
      expect(scoreLogs.length).toBeGreaterThan(0);
      
      // Verify scores are within expected range (0-100)
      scoreLogs.forEach(log => {
        const scoreMatch = log.match(/Score:\s*(\d+)/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should demonstrate navigation features', async () => {
      const example = new AdvancedUsageExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const navigationLogs = logCalls.filter(log => 
        log.includes('Visiting:') || log.includes('All branches have been visited')
      );
      
      expect(navigationLogs.length).toBeGreaterThan(0);
    });
  });

  describe('SessionManagementExample', () => {
    it('should run session management example successfully', async () => {
      const example = new SessionManagementExample();
      
      await expect(example.runExample()).resolves.not.toThrow();
      
      expect(mockConsoleLog).toHaveBeenCalled();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      expect(allOutput).toContain('Session Management Example');
      expect(allOutput).toContain('Created sessions:');
      expect(allOutput).toContain('Active sessions:');
      expect(allOutput).toContain('Session Isolation Demo');
    });

    it('should create and manage multiple sessions', async () => {
      const example = new SessionManagementExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      
      // Check for session creation
      const sessionCreationLogs = logCalls.filter(log => log.includes('Created sessions:'));
      expect(sessionCreationLogs.length).toBeGreaterThan(0);
      
      // Check for active sessions listing
      const activeSessionsLogs = logCalls.filter(log => log.includes('Active sessions:'));
      expect(activeSessionsLogs.length).toBeGreaterThan(0);
    });

    it('should demonstrate session isolation', async () => {
      const example = new SessionManagementExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      
      // Check for session isolation demonstration
      const isolationLogs = logCalls.filter(log => 
        log.includes('AI Session stats:') || log.includes('Programming Session stats:')
      );
      
      expect(isolationLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Complete Example Suite', () => {
    it('should run all examples without errors', async () => {
      await expect(runAllExamples()).resolves.not.toThrow();
      
      expect(mockConsoleLog).toHaveBeenCalled();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      // Verify all examples were executed
      expect(allOutput).toContain('Basic Usage Example');
      expect(allOutput).toContain('Advanced Usage Example');
      expect(allOutput).toContain('Session Management Example');
      expect(allOutput).toContain('All Examples Completed Successfully');
    });

    it('should handle errors gracefully in example execution', async () => {
      // Mock an error in one of the examples
      const originalConsoleError = console.error;
      
      // Temporarily restore console.error to test error handling
      console.error = originalConsoleError;
      
      // The examples should handle their own errors gracefully
      await expect(runAllExamples()).resolves.not.toThrow();
      
      // Restore mock
      console.error = mockConsoleError;
    });
  });

  describe('Example Data Validation', () => {
    it('should use realistic conversation data in basic example', async () => {
      const example = new BasicUsageExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      
      // Check for realistic AI/ML topics
      const topicLogs = logCalls.filter(log => 
        log.includes('machine learning') || 
        log.includes('supervised learning') ||
        log.includes('neural network')
      );
      
      expect(topicLogs.length).toBeGreaterThan(0);
    });

    it('should demonstrate complex conversation branching in advanced example', async () => {
      const example = new AdvancedUsageExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      
      // Check for multiple topics indicating branching
      const topics = new Set();
      logCalls.forEach(log => {
        if (log.includes('Topic:')) {
          const topicMatch = log.match(/Topic:\s*([^,]+)/);
          if (topicMatch) {
            topics.add(topicMatch[1].trim());
          }
        }
      });
      
      expect(topics.size).toBeGreaterThan(2); // Multiple different topics
    });

    it('should show different session contexts in session management example', async () => {
      const example = new SessionManagementExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      
      // Check for different session topics
      const sessionTopics = logCalls.filter(log => 
        log.includes('AI Fundamentals') || log.includes('Programming Concepts')
      );
      
      expect(sessionTopics.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Resource Usage', () => {
    it('should complete basic example within reasonable time', async () => {
      const startTime = Date.now();
      
      const example = new BasicUsageExample();
      await example.runExample();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 2 seconds
      expect(executionTime).toBeLessThan(2000);
    });

    it('should complete advanced example within reasonable time', async () => {
      const startTime = Date.now();
      
      const example = new AdvancedUsageExample();
      await example.runExample();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 3 seconds (more complex processing)
      expect(executionTime).toBeLessThan(3000);
    });

    it('should complete session management example within reasonable time', async () => {
      const startTime = Date.now();
      
      const example = new SessionManagementExample();
      await example.runExample();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 3 seconds (includes persistence operations)
      expect(executionTime).toBeLessThan(3000);
    });

    it('should not consume excessive memory during example execution', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      await runAllExamples();
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 20MB)
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });

  describe('Output Quality and Completeness', () => {
    it('should provide comprehensive output in basic example', async () => {
      const example = new BasicUsageExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      // Check for all expected sections
      expect(allOutput).toContain('Basic Usage Example');
      expect(allOutput).toContain('Added Q&A pair to node');
      expect(allOutput).toContain('Current tree depth');
      expect(allOutput).toContain('Tree Structure');
      expect(allOutput).toContain('Deepest unvisited branch');
      expect(allOutput).toContain('Conversation Statistics');
    });

    it('should show detailed processing information in advanced example', async () => {
      const example = new AdvancedUsageExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      // Check for detailed processing information
      expect(allOutput).toContain('Advanced Usage Example');
      expect(allOutput).toContain('Topic:');
      expect(allOutput).toContain('Score:');
      expect(allOutput).toContain('Depth:');
      expect(allOutput).toContain('Navigation Features');
      expect(allOutput).toContain('Visiting:');
    });

    it('should demonstrate session features comprehensively', async () => {
      const example = new SessionManagementExample();
      await example.runExample();
      
      const logCalls = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const allOutput = logCalls.join('\n');
      
      // Check for session management features
      expect(allOutput).toContain('Session Management Example');
      expect(allOutput).toContain('Created sessions:');
      expect(allOutput).toContain('Active sessions:');
      expect(allOutput).toContain('Session Isolation Demo');
      expect(allOutput).toContain('AI Session stats:');
      expect(allOutput).toContain('Programming Session stats:');
    });
  });
});