import '../integration/setup-integration';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as ingestPOST } from '~/app/api/ingest/route';
import { POST as searchPOST } from '~/app/api/search/route';

// Mock the database and embeddings for performance testing
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn()
  },
  serializeVector: vi.fn((vector: number[]) => `[${vector.join(',')}]`)
}));

vi.mock('~/embeddings', () => ({
  embed4B: vi.fn(),
  embedOne4B: vi.fn()
}));

describe('API Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ingest API Performance', () => {
    it('should handle single document ingestion within acceptable time', async () => {
      // Mock embeddings and database
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'doc-1', content: 'Test', metadata: {}, embedding: '[0.1,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: [{
            content: 'Single document for performance testing',
            metadata: { type: 'performance-test' }
          }]
        })
      });

      const startTime = performance.now();
      const response = await ingestPOST(request);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`Single document ingestion took ${duration.toFixed(2)}ms`);
    });

    it('should handle small batch ingestion efficiently', async () => {
      const batchSize = 5;
      const documents = Array.from({ length: batchSize }, (_, i) => ({
        content: `Performance test document ${i + 1}`,
        metadata: { index: i + 1, type: 'performance-test' }
      }));

      // Mock embeddings and database
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);
      
      const mockResults = documents.map((_, i) => ({
        id: `doc-${i + 1}`,
        content: documents[i].content,
        metadata: documents[i].metadata,
        embedding: '[0.1,...]',
        createdAt: new Date()
      }));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResults)
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      const startTime = performance.now();
      const response = await ingestPOST(request);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(avgTimePerDoc).toBeLessThan(3000); // Average less than 3 seconds per document
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      console.log(`Batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });

    it('should handle medium batch ingestion efficiently', async () => {
      const batchSize = 20;
      const documents = Array.from({ length: batchSize }, (_, i) => ({
        content: `Medium batch performance test document ${i + 1}`,
        metadata: { index: i + 1, type: 'performance-test' }
      }));

      // Mock embeddings and database
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);
      
      const mockResults = documents.map((_, i) => ({
        id: `doc-${i + 1}`,
        content: documents[i].content,
        metadata: documents[i].metadata,
        embedding: '[0.1,...]',
        createdAt: new Date()
      }));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResults)
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      const startTime = performance.now();
      const response = await ingestPOST(request);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(45000); // Should complete within 45 seconds
      expect(avgTimePerDoc).toBeLessThan(2250); // Average less than 2.25 seconds per document
      
      console.log(`Medium batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });

    it('should handle large batch ingestion efficiently', async () => {
      const batchSize = 50;
      const documents = Array.from({ length: batchSize }, (_, i) => ({
        content: `Large batch performance test document ${i + 1}`,
        metadata: { index: i + 1, type: 'performance-test' }
      }));

      // Mock embeddings and database
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);
      
      const mockResults = documents.map((_, i) => ({
        id: `doc-${i + 1}`,
        content: documents[i].content,
        metadata: documents[i].metadata,
        embedding: '[0.1,...]',
        createdAt: new Date()
      }));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResults)
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      const startTime = performance.now();
      const response = await ingestPOST(request);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(90000); // Should complete within 90 seconds
      expect(avgTimePerDoc).toBeLessThan(1800); // Average less than 1.8 seconds per document
      
      console.log(`Large batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });

    it('should handle maximum batch size efficiently', async () => {
      const batchSize = 100;
      const documents = Array.from({ length: batchSize }, (_, i) => ({
        content: `Maximum batch performance test document ${i + 1}`,
        metadata: { index: i + 1, type: 'performance-test' }
      }));

      // Mock embeddings and database
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      const mockEmbeddings = documents.map(() => new Array(2560).fill(0.1));
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);
      
      const mockResults = documents.map((_, i) => ({
        id: `doc-${i + 1}`,
        content: documents[i].content,
        metadata: documents[i].metadata,
        embedding: '[0.1,...]',
        createdAt: new Date()
      }));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResults)
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      const startTime = performance.now();
      const response = await ingestPOST(request);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerDoc = duration / batchSize;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(180000); // Should complete within 3 minutes
      expect(avgTimePerDoc).toBeLessThan(1800); // Average less than 1.8 seconds per document
      
      console.log(`Maximum batch of ${batchSize} documents took ${duration.toFixed(2)}ms (${avgTimePerDoc.toFixed(2)}ms per doc)`);
    });
  });

  describe('Search API Performance', () => {
    it('should handle single search query efficiently', async () => {
      // Mock embedding generation and database search
      const { embedOne4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
      vi.mocked(db.execute).mockResolvedValue([
        {
          id: 'doc-1',
          content: 'Test document about machine learning',
          metadata: { category: 'ai' },
          similarity: 0.95,
          created_at: new Date()
        }
      ] as any);

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'machine learning performance test',
          k: 10
        })
      });

      const startTime = performance.now();
      const response = await searchPOST(request);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      console.log(`Single search query took ${duration.toFixed(2)}ms`);
    });

    it('should handle search with different k values efficiently', async () => {
      const kValues = [1, 5, 10, 25, 50, 100];
      
      for (const k of kValues) {
        // Mock embedding generation and database search
        const { embedOne4B } = await import('~/embeddings');
        const { db } = await import('~/db');
        
        vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
        
        // Generate mock results based on k value
        const mockResults = Array.from({ length: Math.min(k, 20) }, (_, i) => ({
          id: `doc-${i + 1}`,
          content: `Test document ${i + 1}`,
          metadata: { index: i + 1 },
          similarity: 0.9 - (i * 0.01),
          created_at: new Date()
        }));
        
        vi.mocked(db.execute).mockResolvedValue(mockResults as any);

        const request = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `performance test query for k=${k}`,
            k: k
          })
        });

        const startTime = performance.now();
        const response = await searchPOST(request);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.count).toBeLessThanOrEqual(k);
        
        console.log(`Search with k=${k} took ${duration.toFixed(2)}ms`);
        
        // Clear mocks for next iteration
        vi.clearAllMocks();
      }
    });

    it('should handle complex queries efficiently', async () => {
      const complexQueries = [
        'simple query',
        'machine learning artificial intelligence neural networks deep learning',
        'A very long and complex query that contains multiple technical terms, concepts, and ideas that should be processed efficiently by the semantic search system',
        'Query with unicode characters: 机器学习 人工智能 🤖 café naïve résumé',
        'Query with numbers and symbols: API v2.0 HTTP/HTTPS @mentions #hashtags $variables 100% performance'
      ];

      for (const query of complexQueries) {
        // Mock embedding generation and database search
        const { embedOne4B } = await import('~/embeddings');
        const { db } = await import('~/db');
        
        vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
        vi.mocked(db.execute).mockResolvedValue([
          {
            id: 'doc-1',
            content: 'Relevant document',
            metadata: { type: 'test' },
            similarity: 0.85,
            created_at: new Date()
          }
        ] as any);

        const request = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            k: 5
          })
        });

        const startTime = performance.now();
        const response = await searchPOST(request);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        
        const data = await response.json();
        expect(data.success).toBe(true);
        
        console.log(`Complex query (${query.length} chars) took ${duration.toFixed(2)}ms`);
        
        // Clear mocks for next iteration
        vi.clearAllMocks();
      }
    });
  });

  describe('Concurrent API Performance', () => {
    it('should handle concurrent ingest requests efficiently', async () => {
      const concurrentRequests = 3;
      
      // Mock embeddings and database for all requests
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'doc-1', content: 'Test', metadata: {}, embedding: '[0.1,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        new NextRequest('http://localhost:3000/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: [{
              content: `Concurrent ingest document ${i + 1}`,
              metadata: { index: i + 1, type: 'concurrent-test' }
            }]
          })
        })
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests.map(req => ingestPOST(req)));
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerRequest = duration / concurrentRequests;
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(avgTimePerRequest).toBeLessThan(4000); // Average less than 4 seconds per request
      
      console.log(`${concurrentRequests} concurrent ingest requests took ${duration.toFixed(2)}ms (${avgTimePerRequest.toFixed(2)}ms per request)`);
    });

    it('should handle concurrent search requests efficiently', async () => {
      const concurrentRequests = 5;
      
      // Mock embedding generation and database search for all requests
      const { embedOne4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
      vi.mocked(db.execute).mockResolvedValue([
        {
          id: 'doc-1',
          content: 'Concurrent search result',
          metadata: { type: 'test' },
          similarity: 0.85,
          created_at: new Date()
        }
      ] as any);

      const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `concurrent search query ${i + 1}`,
            k: 5
          })
        })
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests.map(req => searchPOST(req)));
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgTimePerRequest = duration / concurrentRequests;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
      expect(avgTimePerRequest).toBeLessThan(2000); // Average less than 2 seconds per request
      
      console.log(`${concurrentRequests} concurrent search requests took ${duration.toFixed(2)}ms (${avgTimePerRequest.toFixed(2)}ms per request)`);
    });

    it('should handle mixed concurrent operations efficiently', async () => {
      // Mock embeddings and database
      const { embed4B, embedOne4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'doc-1', content: 'Test', metadata: {}, embedding: '[0.1,...]', createdAt: new Date() }
          ])
        })
      } as any);
      
      vi.mocked(db.execute).mockResolvedValue([
        {
          id: 'doc-1',
          content: 'Search result',
          metadata: { type: 'test' },
          similarity: 0.85,
          created_at: new Date()
        }
      ] as any);

      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: [{
            content: 'Mixed operations ingest document',
            metadata: { type: 'mixed-test' }
          }]
        })
      });

      const searchRequest1 = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'mixed operations search query 1',
          k: 5
        })
      });

      const searchRequest2 = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'mixed operations search query 2',
          k: 10
        })
      });

      const startTime = performance.now();
      const [ingestResponse, searchResponse1, searchResponse2] = await Promise.all([
        ingestPOST(ingestRequest),
        searchPOST(searchRequest1),
        searchPOST(searchRequest2)
      ]);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(ingestResponse.status).toBe(201);
      expect(searchResponse1.status).toBe(200);
      expect(searchResponse2.status).toBe(200);
      
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
      
      console.log(`Mixed concurrent operations took ${duration.toFixed(2)}ms`);
    });
  });
});