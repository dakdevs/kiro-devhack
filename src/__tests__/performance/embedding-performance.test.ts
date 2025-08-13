import { describe, it, expect, vi, beforeAll } from 'vitest';
import { embed4B, embedOne4B } from '~/embeddings';

// Skip environment validation for performance tests
process.env.SKIP_ENV_VALIDATION = 'true';

// Mock the OpenAI client for performance testing
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn()
      }
    }))
  };
});

describe('Embedding Performance Tests', () => {
  const mockEmbeddingsCreate = vi.fn();
  
  beforeAll(() => {
    // Mock the OpenAI client instance
    const { default: OpenAI } = require('openai');
    OpenAI.mockImplementation(() => ({
      embeddings: {
        create: mockEmbeddingsCreate
      }
    }));
  });

  describe('Single Embedding Performance', () => {
    it('should generate single embedding within acceptable time', async () => {
      const mockEmbedding = new Array(2560).fill(0).map(() => Math.random());
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      });

      const startTime = performance.now();
      const result = await embedOne4B('Test document for performance testing');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result).toHaveLength(2560);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`Single embedding generation took ${duration.toFixed(2)}ms`);
    });

    it('should handle various text lengths efficiently', async () => {
      const testCases = [
        { name: 'Short text', content: 'Short text', expectedMaxTime: 3000 },
        { name: 'Medium text', content: 'A'.repeat(500), expectedMaxTime: 3000 },
        { name: 'Long text', content: 'A'.repeat(2000), expectedMaxTime: 4000 },
        { name: 'Very long text', content: 'A'.repeat(5000), expectedMaxTime: 5000 }
      ];

      for (const testCase of testCases) {
        const mockEmbedding = new Array(2560).fill(0.1);
        mockEmbeddingsCreate.mockResolvedValue({
          data: [{ embedding: mockEmbedding }]
        });

        const startTime = performance.now();
        const result = await embedOne4B(testCase.content);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        expect(result).toHaveLength(2560);
        expect(duration).toBeLessThan(testCase.expectedMaxTime);
        
        console.log(`${testCase.name} (${testCase.content.length} chars) took ${duration.toFixed(2)}ms`);
      }
    });
  });

  describe('Batch Embedding Performance', () => {
    it('should process small batches efficiently', async () => {
      const batchSize = 5;
      const documents = Array.from({ length: batchSize }, (_, i) => `Document ${i + 1} for batch testing`);
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const startTime = performance.now();
      const results = await embed4B(documents);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(results).toHaveLength(batchSize);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(avgTimePerDoc).toBeLessThan(2000); // Average less than 2 seconds per document
      
      console.log(`Batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });

    it('should process medium batches efficiently', async () => {
      const batchSize = 20;
      const documents = Array.from({ length: batchSize }, (_, i) => `Document ${i + 1} for medium batch testing`);
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const startTime = performance.now();
      const results = await embed4B(documents);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(results).toHaveLength(batchSize);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(avgTimePerDoc).toBeLessThan(1500); // Average less than 1.5 seconds per document
      
      console.log(`Batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });

    it('should process large batches efficiently', async () => {
      const batchSize = 50;
      const documents = Array.from({ length: batchSize }, (_, i) => `Document ${i + 1} for large batch testing`);
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const startTime = performance.now();
      const results = await embed4B(documents);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(results).toHaveLength(batchSize);
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
      expect(avgTimePerDoc).toBeLessThan(1200); // Average less than 1.2 seconds per document
      
      console.log(`Batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });

    it('should handle maximum batch size efficiently', async () => {
      const batchSize = 100;
      const documents = Array.from({ length: batchSize }, (_, i) => `Document ${i + 1} for maximum batch testing`);
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const startTime = performance.now();
      const results = await embed4B(documents);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(results).toHaveLength(batchSize);
      expect(duration).toBeLessThan(120000); // Should complete within 2 minutes
      expect(avgTimePerDoc).toBeLessThan(1200); // Average less than 1.2 seconds per document
      
      console.log(`Maximum batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should handle large embeddings without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate multiple large embeddings
      const batchSize = 10;
      const documents = Array.from({ length: batchSize }, (_, i) => 'A'.repeat(1000) + ` Document ${i + 1}`);
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      
      mockEmbeddingsCreate.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const results = await embed4B(documents);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerDoc = memoryIncrease / batchSize;
      
      expect(results).toHaveLength(batchSize);
      expect(memoryIncreasePerDoc).toBeLessThan(1024 * 1024); // Less than 1MB per document
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB total, ${(memoryIncreasePerDoc / 1024).toFixed(2)}KB per doc`);
    });

    it('should clean up memory after processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process embeddings and let them go out of scope
      {
        const documents = Array.from({ length: 20 }, (_, i) => `Temporary document ${i + 1}`);
        const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
        
        mockEmbeddingsCreate.mockResolvedValue({
          data: mockEmbeddings.map(embedding => ({ embedding }))
        });

        const results = await embed4B(documents);
        expect(results).toHaveLength(20);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal after cleanup
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
      
      console.log(`Memory increase after cleanup: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle API errors quickly', async () => {
      mockEmbeddingsCreate.mockRejectedValue(new Error('API Error'));

      const startTime = performance.now();
      
      try {
        await embedOne4B('Test document');
        expect.fail('Should have thrown an error');
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(error).toBeInstanceOf(Error);
        expect(duration).toBeLessThan(1000); // Error handling should be fast
        
        console.log(`Error handling took ${duration.toFixed(2)}ms`);
      }
    });

    it('should handle retry logic efficiently', async () => {
      // Mock first call to fail, second to succeed
      mockEmbeddingsCreate
        .mockRejectedValueOnce(new Error('Temporary API Error'))
        .mockResolvedValueOnce({
          data: [{ embedding: new Array(2560).fill(0.1) }]
        });

      const startTime = performance.now();
      const result = await embedOne4B('Test document with retry');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(result).toHaveLength(2560);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds including retry
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
      
      console.log(`Retry logic took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Processing', () => {
    it('should handle concurrent single embeddings efficiently', async () => {
      const concurrentRequests = 5;
      const mockEmbedding = new Array(2560).fill(0.1);
      
      mockEmbeddingsCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      });

      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) => 
        embedOne4B(`Concurrent document ${i + 1}`)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerRequest = duration / concurrentRequests;
      
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveLength(2560);
      });
      
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(avgTimePerRequest).toBeLessThan(3000); // Average less than 3 seconds per request
      
      console.log(`${concurrentRequests} concurrent requests took ${duration.toFixed(2)}ms (${avgTimePerRequest.toFixed(2)}ms per request)`);
    });

    it('should handle mixed concurrent operations efficiently', async () => {
      const mockEmbedding = new Array(2560).fill(0.1);
      const mockBatchEmbeddings = [
        new Array(2560).fill(0.2),
        new Array(2560).fill(0.3)
      ];
      
      mockEmbeddingsCreate
        .mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] })
        .mockResolvedValueOnce({ data: mockBatchEmbeddings.map(e => ({ embedding: e })) })
        .mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });

      const startTime = performance.now();
      
      const [single1, batch, single2] = await Promise.all([
        embedOne4B('Single document 1'),
        embed4B(['Batch document 1', 'Batch document 2']),
        embedOne4B('Single document 2')
      ]);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(single1).toHaveLength(2560);
      expect(batch).toHaveLength(2);
      expect(single2).toHaveLength(2560);
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Mixed concurrent operations took ${duration.toFixed(2)}ms`);
    });
  });
});