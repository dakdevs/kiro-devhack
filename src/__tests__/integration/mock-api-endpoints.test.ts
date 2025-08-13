import './setup-integration';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database and embeddings for integration tests
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn()
  },
  serializeVector: vi.fn((vector: number[]) => `[${vector.join(',')}]`)
}));

vi.mock('~/db/schema', () => ({
  documents: {
    id: 'id',
    content: 'content',
    metadata: 'metadata',
    embedding: 'embedding',
    createdAt: 'created_at'
  }
}));

vi.mock('~/embeddings', () => ({
  embed4B: vi.fn(),
  embedOne4B: vi.fn(),
  testEmbeddingClient: vi.fn()
}));

describe('API Endpoints Integration Tests (Mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ingest Endpoint', () => {
    it('should successfully process ingest request with mocked embeddings', async () => {
      // Mock embeddings
      const { embed4B } = await import('~/embeddings');
      const mockEmbeddings = [
        new Array(2560).fill(0.1),
        new Array(2560).fill(0.2)
      ];
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);

      // Mock database operations
      const { db } = await import('~/db');
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'doc-1', content: 'Test 1', metadata: {}, embedding: '[0.1,0.1,...]', createdAt: new Date() },
            { id: 'doc-2', content: 'Test 2', metadata: {}, embedding: '[0.2,0.2,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const testDocuments = [
        {
          content: 'Test document 1',
          metadata: { category: 'test' }
        },
        {
          content: 'Test document 2',
          metadata: { category: 'test' }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(2);
      expect(data.documentIds).toHaveLength(2);
      expect(data.processingTime).toBeGreaterThan(0);

      // Verify mocks were called
      expect(embed4B).toHaveBeenCalledWith(['Test document 1', 'Test document 2']);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const invalidDocuments = [
        {
          content: '', // Empty content should fail validation
          metadata: {}
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: invalidDocuments })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle embedding generation errors', async () => {
      // Mock embedding failure
      const { embed4B } = await import('~/embeddings');
      vi.mocked(embed4B).mockRejectedValue(new Error('Embedding API failed'));

      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const testDocuments = [
        {
          content: 'Test document',
          metadata: { category: 'test' }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle database insertion errors', async () => {
      // Mock successful embeddings
      const { embed4B } = await import('~/embeddings');
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);

      // Mock database failure
      const { db } = await import('~/db');
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      } as any);

      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const testDocuments = [
        {
          content: 'Test document',
          metadata: { category: 'test' }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('Search Endpoint', () => {
    it('should successfully process search request with mocked results', async () => {
      // Mock embedding generation for query
      const { embedOne4B } = await import('~/embeddings');
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));

      // Mock database search results
      const { db } = await import('~/db');
      vi.mocked(db.execute).mockResolvedValue({
        rows: [
          {
            id: 'doc-1',
            content: 'Test document about machine learning',
            metadata: { category: 'ai' },
            similarity: 0.95
          },
          {
            id: 'doc-2', 
            content: 'Another document about AI',
            metadata: { category: 'ai' },
            similarity: 0.87
          }
        ]
      } as any);

      const { POST: searchPOST } = await import('~/app/api/search/route');

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'machine learning artificial intelligence',
          k: 5
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(2);
      expect(data.query).toBe('machine learning artificial intelligence');
      expect(data.k).toBe(5);
      expect(data.processingTime).toBeGreaterThan(0);

      // Verify results structure
      data.results.forEach((result: any) => {
        expect(result.id).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.similarity).toBeDefined();
        expect(typeof result.similarity).toBe('number');
      });

      // Verify mocks were called
      expect(embedOne4B).toHaveBeenCalledWith('machine learning artificial intelligence');
      expect(db.execute).toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      // Mock embedding generation
      const { embedOne4B } = await import('~/embeddings');
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));

      // Mock empty database results
      const { db } = await import('~/db');
      vi.mocked(db.execute).mockResolvedValue({
        rows: []
      } as any);

      const { POST: searchPOST } = await import('~/app/api/search/route');

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'completely unrelated topic'
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(0);
      expect(data.k).toBe(10); // Default value
    });

    it('should handle search validation errors', async () => {
      const { POST: searchPOST } = await import('~/app/api/search/route');

      const invalidRequests = [
        { query: '' }, // Empty query
        { query: 'valid query', k: 0 }, // Invalid k value
        { query: 'valid query', k: 101 } // k too large
      ];

      for (const invalidBody of invalidRequests) {
        const request = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidBody)
        });

        const response = await searchPOST(request);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });

    it('should handle embedding generation errors in search', async () => {
      // Mock embedding failure
      const { embedOne4B } = await import('~/embeddings');
      vi.mocked(embedOne4B).mockRejectedValue(new Error('Embedding API failed'));

      const { POST: searchPOST } = await import('~/app/api/search/route');

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test query'
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle database search errors', async () => {
      // Mock successful embedding
      const { embedOne4B } = await import('~/embeddings');
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));

      // Mock database failure
      const { db } = await import('~/db');
      vi.mocked(db.execute).mockRejectedValue(new Error('Database query failed'));

      const { POST: searchPOST } = await import('~/app/api/search/route');

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test query'
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('Health Endpoint', () => {
    it('should return healthy status with mocked services', async () => {
      // Mock database health check
      const { db } = await import('~/db');
      vi.mocked(db.execute).mockResolvedValue({ rows: [{ result: 1 }] } as any);

      // Mock embedding health check
      const { testEmbeddingClient } = await import('~/embeddings');
      vi.mocked(testEmbeddingClient).mockResolvedValue(true);

      const { GET: healthGET } = await import('~/app/api/health/route');

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.services.database.status).toBe('up');
      expect(data.services.embeddings.status).toBe('up');
    });

    it('should handle database connection errors in health check', async () => {
      // Mock database failure
      const { db } = await import('~/db');
      vi.mocked(db.execute).mockRejectedValue(new Error('Database connection failed'));

      const { GET: healthGET } = await import('~/app/api/health/route');

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);
      
      expect(response.status).toBe(503);
      
      const data = await response.json();
      expect(data.status).toBe('unhealthy');
      expect(data.services.database.status).toBe('down');
    });
  });

  describe('End-to-End Workflow (Mocked)', () => {
    it('should complete full ingest-search workflow with mocks', async () => {
      // Step 1: Mock ingest
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embed4B).mockResolvedValue([
        new Array(2560).fill(0.1),
        new Array(2560).fill(0.2)
      ]);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'doc-1', content: 'React framework', metadata: { type: 'framework' }, embedding: '[0.1,...]', createdAt: new Date() },
            { id: 'doc-2', content: 'Vue.js framework', metadata: { type: 'framework' }, embedding: '[0.2,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const testDocuments = [
        {
          content: 'React is a JavaScript library for building user interfaces',
          metadata: { framework: 'react', language: 'javascript' }
        },
        {
          content: 'Vue.js is a progressive JavaScript framework',
          metadata: { framework: 'vue', language: 'javascript' }
        }
      ];

      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const ingestResponse = await ingestPOST(ingestRequest);
      expect(ingestResponse.status).toBe(201);

      const ingestData = await ingestResponse.json();
      expect(ingestData.success).toBe(true);
      expect(ingestData.documentsProcessed).toBe(2);

      // Step 2: Mock search
      const { embedOne4B } = await import('~/embeddings');
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.15));

      vi.mocked(db.execute).mockResolvedValue({
        rows: [
          {
            id: 'doc-1',
            content: 'React is a JavaScript library for building user interfaces',
            metadata: { framework: 'react', language: 'javascript' },
            similarity: 0.92
          },
          {
            id: 'doc-2',
            content: 'Vue.js is a progressive JavaScript framework',
            metadata: { framework: 'vue', language: 'javascript' },
            similarity: 0.88
          }
        ]
      } as any);

      const { POST: searchPOST } = await import('~/app/api/search/route');

      const searchRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'JavaScript frameworks for web development',
          k: 5
        })
      });

      const searchResponse = await searchPOST(searchRequest);
      expect(searchResponse.status).toBe(200);

      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);
      expect(searchData.results).toHaveLength(2);
      expect(searchData.results[0].similarity).toBeGreaterThan(searchData.results[1].similarity);
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle missing request body', async () => {
      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
        // No body
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle very large document content', async () => {
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      // Mock successful processing of large content
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'large-doc', content: 'Large content...', metadata: {}, embedding: '[0.1,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const largeContent = 'Large document content. '.repeat(1000); // ~24KB
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documents: [{
            content: largeContent,
            metadata: { type: 'large-document' }
          }]
        })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(1);
    });

    it('should handle unicode content correctly', async () => {
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'unicode-doc', content: 'Unicode content', metadata: {}, embedding: '[0.1,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const { POST: ingestPOST } = await import('~/app/api/ingest/route');

      const unicodeContent = 'Unicode text: 你好世界 🌍 café naïve résumé';
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documents: [{
            content: unicodeContent,
            metadata: { type: 'unicode' }
          }]
        })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(1);

      // Verify the embedding function was called with unicode content
      expect(embed4B).toHaveBeenCalledWith([unicodeContent]);
    });
  });
});