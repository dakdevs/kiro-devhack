import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { performance } from 'perf_hooks';
import { performanceMonitor } from '~/lib/performance-monitor';

// Mock the embeddings and database for consistent testing
vi.mock('~/embeddings', () => ({
  embed4B: vi.fn(),
  embedOne4B: vi.fn()
}));

vi.mock('~/db', () => ({
  db: {
    insert: vi.fn(),
    execute: vi.fn()
  },
  serializeVector: vi.fn((vector: number[]) => `[${vector.join(',')}]`)
}));

describe('End-to-End Performance Tests', () => {
  beforeAll(() => {
    // Set up realistic mocks
    const { embed4B, embedOne4B } = require('~/embeddings');
    const { db } = require('~/db');
    
    // Mock embedding generation with realistic performance characteristics
    embed4B.mockImplementation(async (texts: string[]) => {
      // Simulate batch processing efficiency
      const baseLatency = 200;
      const perItemLatency = 30;
      const batchEfficiency = Math.max(0.5, 1 - (texts.length * 0.01)); // Efficiency decreases with batch size
      const totalLatency = baseLatency + (texts.length * perItemLatency * batchEfficiency);
      
      await new Promise(resolve => setTimeout(resolve, totalLatency));
      return texts.map(() => new Array(2560).fill(0).map(() => Math.random() * 2 - 1));
    });
    
    embedOne4B.mockImplementation(async (text: string) => {
      // Simulate single embedding latency
      const latency = 150 + (text.length * 0.1); // Slight increase with text length
      await new Promise(resolve => setTimeout(resolve, latency));
      return new Array(2560).fill(0).map(() => Math.random() * 2 - 1);
    });
    
    // Mock database operations with realistic performance
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(async (docs: any[]) => {
          // Simulate database insert latency based on batch size
          const latency = 50 + (docs.length * 10);
          await new Promise(resolve => setTimeout(resolve, latency));
          return docs.map((doc, i) => ({ 
            id: `doc-${i}`, 
            ...doc, 
            createdAt: new Date() 
          }));
        })
      })
    });
    
    db.execute.mockImplementation(async () => {
      // Simulate vector search latency
      await new Promise(resolve => setTimeout(resolve, 80));
      return Array.from({ length: 10 }, (_, i) => ({
        id: `result-${i}`,
        content: `Search result ${i + 1}`,
        metadata: { score: 0.9 - (i * 0.05) },
        similarity: 0.9 - (i * 0.05),
        created_at: new Date()
      }));
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Workflow Performance', () => {
    it('should handle realistic document ingestion workflow', async () => {
      const { POST: ingestPOST } = await import('~/app/api/ingest/route');
      const { NextRequest } = await import('next/server');
      
      // Simulate realistic document sizes and content
      const documents = [
        {
          content: 'Short document for testing performance with minimal content.',
          metadata: { type: 'short', words: 10 }
        },
        {
          content: 'Medium length document that contains more substantial content for testing embedding generation and database insertion performance. This document has multiple sentences and should provide a good test case for realistic usage patterns.',
          metadata: { type: 'medium', words: 35 }
        },
        {
          content: 'This is a very long document that simulates real-world content with substantial text that would be typical in a production environment. It contains multiple paragraphs, detailed information, and represents the kind of content that users would actually ingest into the system. The document discusses various topics including technology, performance optimization, database management, and software engineering best practices. This length of content is important for testing how the system handles larger text inputs and ensures that performance remains acceptable even with substantial document sizes.',
          metadata: { type: 'long', words: 95 }
        }
      ];
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });
      
      const startTime = performance.now();
      const response = await ingestPOST(request);
      const endTime = performance.now();
      
      const result = await response.json();
      const totalTime = endTime - startTime;
      
      // Verify response
      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(3);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      console.log(`Ingestion workflow completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per document: ${(totalTime / documents.length).toFixed(2)}ms`);
    });

    it('should handle realistic search workflow', async () => {
      const { POST: searchPOST } = await import('~/app/api/search/route');
      const { NextRequest } = await import('next/server');
      
      const queries = [
        'AI',
        'machine learning algorithms',
        'comprehensive guide to database optimization and performance tuning'
      ];
      
      const results = [];
      
      for (const query of queries) {
        const request = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, k: 10 })
        });
        
        const startTime = performance.now();
        const response = await searchPOST(request);
        const endTime = performance.now();
        
        const result = await response.json();
        const totalTime = endTime - startTime;
        
        // Verify response
        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(Array.isArray(result.results)).toBe(true);
        
        // Performance assertions
        expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
        
        results.push({
          query: query.substring(0, 30) + (query.length > 30 ? '...' : ''),
          time: totalTime,
          resultCount: result.results.length
        });
      }
      
      // Log performance summary
      console.log('\\nSearch Performance Summary:');
      results.forEach(r => {
        console.log(`  "${r.query}": ${r.time.toFixed(2)}ms (${r.resultCount} results)`);
      });
      
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      console.log(`  Average search time: ${avgTime.toFixed(2)}ms`);
      
      // Verify performance consistency
      const maxTime = Math.max(...results.map(r => r.time));
      const minTime = Math.min(...results.map(r => r.time));
      const variance = maxTime - minTime;
      
      // Variance should be reasonable (not more than 3x difference)
      expect(variance).toBeLessThan(minTime * 3);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance metrics during operations', async () => {
      const { POST: ingestPOST } = await import('~/app/api/ingest/route');
      const { NextRequest } = await import('next/server');
      
      // Clear existing metrics
      performanceMonitor.clearMetrics();
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: [{
            content: 'Performance monitoring test document',
            metadata: { test: true }
          }]
        })
      });
      
      await ingestPOST(request);
      
      // Check that performance metrics were recorded
      const recentMetrics = performanceMonitor.getRecentMetrics(10);
      
      expect(recentMetrics.length).toBeGreaterThan(0);
      
      // Should have metrics for different operations
      const operationTypes = [...new Set(recentMetrics.map(m => m.operation))];
      expect(operationTypes).toContain('embedding_batch');
      expect(operationTypes).toContain('database_insert');
      
      // Check performance statistics
      const embeddingStats = performanceMonitor.getStats('embedding_batch');
      expect(embeddingStats.count).toBeGreaterThan(0);
      expect(embeddingStats.avgDuration).toBeGreaterThan(0);
      
      console.log('\\nPerformance Metrics Summary:');
      operationTypes.forEach(op => {
        const stats = performanceMonitor.getStats(op);
        console.log(`  ${op}: ${stats.avgDuration.toFixed(2)}ms avg (${stats.count} samples)`);
      });
    });

    it('should provide health status based on performance', async () => {
      // Record some performance metrics
      const timer1 = performanceMonitor.startTimer('test_operation');
      await new Promise(resolve => setTimeout(resolve, 100));
      timer1.end();
      
      const timer2 = performanceMonitor.startTimer('test_operation');
      await new Promise(resolve => setTimeout(resolve, 150));
      timer2.end();
      
      const health = performanceMonitor.getHealthStatus();
      
      expect(health.status).toMatch(/^(healthy|warning|critical)$/);
      expect(health.overallStats).toBeDefined();
      expect(health.timestamp).toBeInstanceOf(Date);
      
      console.log(`\\nSystem Health Status: ${health.status}`);
      console.log(`Overall Stats: ${health.overallStats.count} operations, ${health.overallStats.avgDuration.toFixed(2)}ms avg`);
    });
  });
});