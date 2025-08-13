import './setup-integration';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as ingestPOST } from '~/app/api/ingest/route';
import { POST as searchPOST } from '~/app/api/search/route';
import { GET as healthGET } from '~/app/api/health/route';
import { db } from '~/db';
import { documents } from '~/db/schema';
import { sql } from 'drizzle-orm';

describe('API Endpoints Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is ready
    try {
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      console.warn('Database not available for integration tests');
      throw error;
    }
  });

  beforeEach(async () => {
    // Clean up test documents before each test
    await db.delete(documents).where(sql`id LIKE 'test-integration-%'`);
  });

  afterAll(async () => {
    // Clean up test documents after all tests
    await db.delete(documents).where(sql`id LIKE 'test-integration-%'`);
  });

  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.services.database.status).toBe('connected');
      expect(data.services.embeddings.status).toBe('configured');
    });
  });

  describe('Ingest Endpoint', () => {
    it('should successfully ingest documents with embeddings', async () => {
      const testDocuments = [
        {
          content: 'This is a test document about machine learning and artificial intelligence.',
          metadata: { 
            category: 'technology',
            tags: ['ml', 'ai'],
            source: 'integration-test'
          }
        },
        {
          content: 'Another test document discussing natural language processing techniques.',
          metadata: {
            category: 'technology', 
            tags: ['nlp', 'ai'],
            source: 'integration-test'
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(2);
      expect(data.documentIds).toHaveLength(2);
      expect(data.processingTime).toBeGreaterThan(0);

      // Verify documents were actually stored in database
      const storedDocs = await db.select().from(documents).where(sql`metadata->>'source' = 'integration-test'`);
      expect(storedDocs).toHaveLength(2);
      
      // Verify embeddings were generated
      storedDocs.forEach(doc => {
        expect(doc.embedding).toBeDefined();
        expect(doc.embedding).not.toBe('');
        expect(doc.content).toBeDefined();
        expect(doc.metadata).toBeDefined();
      });
    }, 30000); // Longer timeout for embedding generation

    it('should handle single document ingestion', async () => {
      const testDocument = {
        content: 'Single document test for integration testing purposes.',
        metadata: { 
          type: 'single-test',
          source: 'integration-test'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: [testDocument] })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(1);
      expect(data.documentIds).toHaveLength(1);
    }, 15000);

    it('should reject invalid document format', async () => {
      const invalidDocuments = [
        {
          content: '', // Empty content
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

    it('should reject empty documents array', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: [] })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
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

    it('should handle documents with various content types', async () => {
      const diverseDocuments = [
        {
          content: 'Short text.',
          metadata: { type: 'short', source: 'integration-test' }
        },
        {
          content: 'A much longer document that contains multiple sentences and covers various topics including technology, science, and general knowledge. This document is designed to test how the system handles longer content with more complex semantic meaning.',
          metadata: { type: 'long', source: 'integration-test' }
        },
        {
          content: 'Document with numbers: 123, 456.789, and special characters: @#$%^&*()',
          metadata: { type: 'special', source: 'integration-test' }
        },
        {
          content: 'Unicode content: 你好世界 🌍 café naïve résumé',
          metadata: { type: 'unicode', source: 'integration-test' }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: diverseDocuments })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(4);
    }, 30000);
  });

  describe('Search Endpoint', () => {
    beforeEach(async () => {
      // Insert test documents for search tests
      const testDocuments = [
        {
          content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms.',
          metadata: { category: 'ai', source: 'integration-test' }
        },
        {
          content: 'Natural language processing helps computers understand human language.',
          metadata: { category: 'nlp', source: 'integration-test' }
        },
        {
          content: 'Deep learning uses neural networks with multiple layers for complex pattern recognition.',
          metadata: { category: 'deep-learning', source: 'integration-test' }
        }
      ];

      // Ingest documents first
      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      await ingestPOST(ingestRequest);
      
      // Wait a moment for ingestion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }, 30000);

    it('should perform semantic search and return relevant results', async () => {
      const searchQuery = 'artificial intelligence and machine learning';

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          k: 5
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.query).toBe(searchQuery);
      expect(data.processingTime).toBeGreaterThan(0);

      // Should return results
      expect(data.results.length).toBeGreaterThan(0);
      
      // Each result should have required fields
      data.results.forEach((result: any) => {
        expect(result.id).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.similarity).toBeDefined();
        expect(typeof result.similarity).toBe('number');
        expect(result.similarity).toBeGreaterThanOrEqual(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
      });

      // Results should be ordered by similarity (highest first)
      for (let i = 1; i < data.results.length; i++) {
        expect(data.results[i-1].similarity).toBeGreaterThanOrEqual(data.results[i].similarity);
      }
    }, 15000);

    it('should handle search with k parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'neural networks',
          k: 2
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.results.length).toBeLessThanOrEqual(2);
    }, 10000);

    it('should use default k value when not specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'language processing'
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.k).toBe(10); // Default value
    }, 10000);

    it('should handle empty search results gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'completely unrelated topic that should not match anything in the test data like quantum cooking recipes'
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);
      // Results might be empty or have very low similarity scores
    }, 10000);

    it('should reject invalid search queries', async () => {
      const invalidRequests = [
        { query: '' }, // Empty query
        { query: 'a'.repeat(1001) }, // Too long query
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

    it('should handle malformed search JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json for search }'
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle unicode queries correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: '机器学习 artificial intelligence 🤖',
          k: 5
        })
      });

      const response = await searchPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);
    }, 10000);
  });

  describe('End-to-End Workflow', () => {
    it('should complete full ingest-search workflow', async () => {
      // Step 1: Ingest documents
      const testDocuments = [
        {
          content: 'React is a JavaScript library for building user interfaces, particularly web applications.',
          metadata: { framework: 'react', language: 'javascript', source: 'integration-test' }
        },
        {
          content: 'Vue.js is a progressive JavaScript framework for building user interfaces and single-page applications.',
          metadata: { framework: 'vue', language: 'javascript', source: 'integration-test' }
        },
        {
          content: 'Angular is a TypeScript-based web application framework developed by Google.',
          metadata: { framework: 'angular', language: 'typescript', source: 'integration-test' }
        },
        {
          content: 'Python is a high-level programming language known for its simplicity and readability.',
          metadata: { language: 'python', type: 'programming-language', source: 'integration-test' }
        }
      ];

      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const ingestResponse = await ingestPOST(ingestRequest);
      expect(ingestResponse.status).toBe(200);

      const ingestData = await ingestResponse.json();
      expect(ingestData.success).toBe(true);
      expect(ingestData.documentsProcessed).toBe(4);

      // Wait for ingestion to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Search for JavaScript frameworks
      const searchRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'JavaScript frameworks for web development',
          k: 3
        })
      });

      const searchResponse = await searchPOST(searchRequest);
      expect(searchResponse.status).toBe(200);

      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(true);
      expect(searchData.results.length).toBeGreaterThan(0);

      // Should find JavaScript frameworks (React, Vue, Angular) with higher similarity than Python
      const jsFrameworks = searchData.results.filter((result: any) => 
        result.metadata.language === 'javascript' || result.metadata.language === 'typescript'
      );
      expect(jsFrameworks.length).toBeGreaterThan(0);

      // Step 3: Search for programming languages
      const langSearchRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'programming language syntax',
          k: 5
        })
      });

      const langSearchResponse = await searchPOST(langSearchRequest);
      expect(langSearchResponse.status).toBe(200);

      const langSearchData = await langSearchResponse.json();
      expect(langSearchData.success).toBe(true);
      expect(langSearchData.results.length).toBeGreaterThan(0);
    }, 45000);

    it('should handle concurrent requests correctly', async () => {
      // Prepare test documents
      const documents = Array.from({ length: 5 }, (_, i) => ({
        content: `Test document ${i + 1} about concurrent processing and parallel execution in distributed systems.`,
        metadata: { index: i + 1, type: 'concurrent-test', source: 'integration-test' }
      }));

      // Ingest documents first
      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      await ingestPOST(ingestRequest);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make concurrent search requests
      const searchPromises = Array.from({ length: 3 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: `concurrent processing request ${i + 1}`,
            k: 3
          })
        });
        return searchPOST(request);
      });

      const responses = await Promise.all(searchPromises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const results = await Promise.all(responses.map(r => r.json()));
      results.forEach(data => {
        expect(data.success).toBe(true);
        expect(Array.isArray(data.results)).toBe(true);
      });
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle very large documents', async () => {
      const largeContent = 'Large document content. '.repeat(1000); // ~24KB
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documents: [{
            content: largeContent,
            metadata: { type: 'large-document', source: 'integration-test' }
          }]
        })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(1);
    }, 20000);

    it('should handle documents at content length limit', async () => {
      const maxContent = 'a'.repeat(50000); // At the 50k limit
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documents: [{
            content: maxContent,
            metadata: { type: 'max-length', source: 'integration-test' }
          }]
        })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    }, 20000);

    it('should reject documents exceeding content length limit', async () => {
      const tooLargeContent = 'a'.repeat(50001); // Exceeds 50k limit
      
      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documents: [{
            content: tooLargeContent,
            metadata: { type: 'too-large', source: 'integration-test' }
          }]
        })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle maximum batch size', async () => {
      const maxBatch = Array.from({ length: 100 }, (_, i) => ({
        content: `Document ${i + 1} in maximum batch size test.`,
        metadata: { index: i + 1, type: 'max-batch', source: 'integration-test' }
      }));

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: maxBatch })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.documentsProcessed).toBe(100);
    }, 60000); // Longer timeout for large batch

    it('should reject batches exceeding maximum size', async () => {
      const oversizedBatch = Array.from({ length: 101 }, (_, i) => ({
        content: `Document ${i + 1} in oversized batch.`,
        metadata: { index: i + 1, source: 'integration-test' }
      }));

      const request = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: oversizedBatch })
      });

      const response = await ingestPOST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});