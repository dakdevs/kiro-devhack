import '../integration/setup-integration';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as ingestPOST } from '~/app/api/ingest/route';
import { POST as searchPOST } from '~/app/api/search/route';
import { GET as healthGET } from '~/app/api/health/route';

// Mock the database and embeddings for end-to-end testing
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
  embedOne4B: vi.fn(),
  testEmbeddingClient: vi.fn()
}));

describe('End-to-End Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete System Workflow', () => {
    it('should complete full document lifecycle: health check -> ingest -> search', async () => {
      // Step 1: Health Check
      const { db, testEmbeddingClient } = await import('~/embeddings');
      const dbModule = await import('~/db');
      
      vi.mocked(dbModule.db.execute).mockResolvedValue({ rows: [{ result: 1 }] } as any);
      vi.mocked(testEmbeddingClient).mockResolvedValue(true);

      const healthRequest = new NextRequest('http://localhost:3000/api/health');
      const healthResponse = await healthGET(healthRequest);
      
      expect(healthResponse.status).toBe(200);
      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('healthy');
      
      console.log('✓ Health check passed');

      // Step 2: Document Ingestion
      const { embed4B } = await import('~/embeddings');
      
      const testDocuments = [
        {
          content: 'React is a JavaScript library for building user interfaces, particularly web applications.',
          metadata: { framework: 'react', language: 'javascript', category: 'frontend' }
        },
        {
          content: 'Vue.js is a progressive JavaScript framework for building user interfaces and single-page applications.',
          metadata: { framework: 'vue', language: 'javascript', category: 'frontend' }
        },
        {
          content: 'Angular is a TypeScript-based web application framework developed by Google.',
          metadata: { framework: 'angular', language: 'typescript', category: 'frontend' }
        },
        {
          content: 'Node.js is a JavaScript runtime built on Chrome V8 JavaScript engine for server-side development.',
          metadata: { framework: 'nodejs', language: 'javascript', category: 'backend' }
        },
        {
          content: 'Python is a high-level programming language known for its simplicity and readability.',
          metadata: { language: 'python', type: 'programming-language', category: 'backend' }
        }
      ];

      const mockEmbeddings = testDocuments.map((_, i) => new Array(2560).fill(0.1 + i * 0.1));
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);
      
      const mockInsertResults = testDocuments.map((doc, i) => ({
        id: `doc-${i + 1}`,
        content: doc.content,
        metadata: doc.metadata,
        embedding: `[${mockEmbeddings[i].join(',')}]`,
        createdAt: new Date()
      }));
      
      vi.mocked(dbModule.db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockInsertResults)
        })
      } as any);

      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocuments })
      });

      const ingestResponse = await ingestPOST(ingestRequest);
      expect(ingestResponse.status).toBe(201);
      
      const ingestData = await ingestResponse.json();
      expect(ingestData.success).toBe(true);
      expect(ingestData.documentIds).toHaveLength(5);
      
      console.log(`✓ Ingested ${ingestData.documentIds.length} documents`);

      // Step 3: Semantic Search Tests
      const { embedOne4B } = await import('~/embeddings');
      
      const searchTests = [
        {
          query: 'JavaScript frameworks for web development',
          expectedCategories: ['frontend'],
          expectedFrameworks: ['react', 'vue', 'angular']
        },
        {
          query: 'backend server development',
          expectedCategories: ['backend'],
          expectedFrameworks: ['nodejs']
        },
        {
          query: 'programming languages',
          expectedTypes: ['programming-language'],
          expectedLanguages: ['python']
        },
        {
          query: 'TypeScript development framework',
          expectedFrameworks: ['angular'],
          expectedLanguages: ['typescript']
        }
      ];

      for (const test of searchTests) {
        vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.15));
        
        // Mock search results based on query
        let mockSearchResults;
        if (test.query.includes('JavaScript frameworks')) {
          mockSearchResults = [
            {
              id: 'doc-1',
              content: testDocuments[0].content,
              metadata: testDocuments[0].metadata,
              similarity: 0.92
            },
            {
              id: 'doc-2',
              content: testDocuments[1].content,
              metadata: testDocuments[1].metadata,
              similarity: 0.88
            },
            {
              id: 'doc-3',
              content: testDocuments[2].content,
              metadata: testDocuments[2].metadata,
              similarity: 0.85
            }
          ];
        } else if (test.query.includes('backend')) {
          mockSearchResults = [
            {
              id: 'doc-4',
              content: testDocuments[3].content,
              metadata: testDocuments[3].metadata,
              similarity: 0.90
            },
            {
              id: 'doc-5',
              content: testDocuments[4].content,
              metadata: testDocuments[4].metadata,
              similarity: 0.75
            }
          ];
        } else if (test.query.includes('programming languages')) {
          mockSearchResults = [
            {
              id: 'doc-5',
              content: testDocuments[4].content,
              metadata: testDocuments[4].metadata,
              similarity: 0.88
            }
          ];
        } else if (test.query.includes('TypeScript')) {
          mockSearchResults = [
            {
              id: 'doc-3',
              content: testDocuments[2].content,
              metadata: testDocuments[2].metadata,
              similarity: 0.93
            }
          ];
        } else {
          mockSearchResults = [];
        }

        vi.mocked(dbModule.db.execute).mockResolvedValue({
          rows: mockSearchResults
        } as any);

        const searchRequest = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: test.query,
            k: 5
          })
        });

        const searchResponse = await searchPOST(searchRequest);
        expect(searchResponse.status).toBe(200);
        
        const searchData = await searchResponse.json();
        expect(searchData.success).toBe(true);
        expect(searchData.query).toBe(test.query);
        expect(Array.isArray(searchData.results)).toBe(true);
        
        // Verify search results match expectations
        if (test.expectedCategories) {
          const categories = searchData.results.map((r: any) => r.metadata.category);
          test.expectedCategories.forEach(category => {
            expect(categories).toContain(category);
          });
        }
        
        if (test.expectedFrameworks) {
          const frameworks = searchData.results.map((r: any) => r.metadata.framework).filter(Boolean);
          test.expectedFrameworks.forEach(framework => {
            expect(frameworks).toContain(framework);
          });
        }
        
        if (test.expectedLanguages) {
          const languages = searchData.results.map((r: any) => r.metadata.language).filter(Boolean);
          test.expectedLanguages.forEach(language => {
            expect(languages).toContain(language);
          });
        }
        
        // Verify similarity scores are in descending order
        const similarities = searchData.results.map((r: any) => r.similarity);
        for (let i = 1; i < similarities.length; i++) {
          expect(similarities[i-1]).toBeGreaterThanOrEqual(similarities[i]);
        }
        
        console.log(`✓ Search "${test.query}" returned ${searchData.results.length} results`);
      }
    });

    it('should handle realistic document processing workflow', async () => {
      // Simulate a realistic workflow with technical documentation
      const technicalDocs = [
        {
          content: 'REST APIs use HTTP methods like GET, POST, PUT, DELETE to perform CRUD operations on resources. They follow stateless communication principles.',
          metadata: { type: 'api-documentation', topic: 'rest', difficulty: 'beginner' }
        },
        {
          content: 'GraphQL is a query language and runtime for APIs that allows clients to request exactly the data they need. It provides a single endpoint for all operations.',
          metadata: { type: 'api-documentation', topic: 'graphql', difficulty: 'intermediate' }
        },
        {
          content: 'Microservices architecture breaks down applications into small, independent services that communicate over well-defined APIs. Each service owns its data and business logic.',
          metadata: { type: 'architecture', topic: 'microservices', difficulty: 'advanced' }
        },
        {
          content: 'Docker containers package applications with their dependencies, ensuring consistent deployment across different environments. Containers share the host OS kernel.',
          metadata: { type: 'devops', topic: 'containerization', difficulty: 'intermediate' }
        },
        {
          content: 'Kubernetes orchestrates containerized applications, providing features like service discovery, load balancing, and automatic scaling across clusters.',
          metadata: { type: 'devops', topic: 'orchestration', difficulty: 'advanced' }
        }
      ];

      // Step 1: Ingest technical documentation
      const { embed4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      const mockEmbeddings = technicalDocs.map((_, i) => 
        new Array(2560).fill(0).map(() => Math.random() * 0.1 + i * 0.1)
      );
      vi.mocked(embed4B).mockResolvedValue(mockEmbeddings);
      
      const mockInsertResults = technicalDocs.map((doc, i) => ({
        id: `tech-doc-${i + 1}`,
        content: doc.content,
        metadata: doc.metadata,
        embedding: `[${mockEmbeddings[i].join(',')}]`,
        createdAt: new Date()
      }));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockInsertResults)
        })
      } as any);

      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: technicalDocs })
      });

      const ingestResponse = await ingestPOST(ingestRequest);
      expect(ingestResponse.status).toBe(201);
      
      const ingestData = await ingestResponse.json();
      expect(ingestData.success).toBe(true);
      expect(ingestData.documentIds).toHaveLength(5);
      
      console.log(`✓ Ingested ${ingestData.documentIds.length} technical documents`);

      // Step 2: Perform various search scenarios
      const { embedOne4B } = await import('~/embeddings');
      
      const searchScenarios = [
        {
          name: 'API Development Query',
          query: 'How to build APIs for web applications',
          expectedTopics: ['rest', 'graphql'],
          expectedTypes: ['api-documentation']
        },
        {
          name: 'DevOps Query',
          query: 'Container deployment and orchestration',
          expectedTopics: ['containerization', 'orchestration'],
          expectedTypes: ['devops']
        },
        {
          name: 'Architecture Query',
          query: 'Scalable application architecture patterns',
          expectedTopics: ['microservices'],
          expectedTypes: ['architecture']
        },
        {
          name: 'Beginner Level Query',
          query: 'Simple web development concepts',
          expectedDifficulties: ['beginner', 'intermediate']
        }
      ];

      for (const scenario of searchScenarios) {
        vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
        
        // Mock relevant search results based on scenario
        let mockResults;
        if (scenario.name.includes('API')) {
          mockResults = [
            {
              id: 'tech-doc-1',
              content: technicalDocs[0].content,
              metadata: technicalDocs[0].metadata,
              similarity: 0.89
            },
            {
              id: 'tech-doc-2',
              content: technicalDocs[1].content,
              metadata: technicalDocs[1].metadata,
              similarity: 0.85
            }
          ];
        } else if (scenario.name.includes('DevOps')) {
          mockResults = [
            {
              id: 'tech-doc-5',
              content: technicalDocs[4].content,
              metadata: technicalDocs[4].metadata,
              similarity: 0.91
            },
            {
              id: 'tech-doc-4',
              content: technicalDocs[3].content,
              metadata: technicalDocs[3].metadata,
              similarity: 0.87
            }
          ];
        } else if (scenario.name.includes('Architecture')) {
          mockResults = [
            {
              id: 'tech-doc-3',
              content: technicalDocs[2].content,
              metadata: technicalDocs[2].metadata,
              similarity: 0.88
            }
          ];
        } else {
          mockResults = [
            {
              id: 'tech-doc-1',
              content: technicalDocs[0].content,
              metadata: technicalDocs[0].metadata,
              similarity: 0.82
            }
          ];
        }

        vi.mocked(db.execute).mockResolvedValue({
          rows: mockResults
        } as any);

        const searchRequest = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: scenario.query,
            k: 3
          })
        });

        const searchResponse = await searchPOST(searchRequest);
        expect(searchResponse.status).toBe(200);
        
        const searchData = await searchResponse.json();
        expect(searchData.success).toBe(true);
        expect(searchData.results.length).toBeGreaterThan(0);
        
        // Verify results match expected criteria
        if (scenario.expectedTopics) {
          const topics = searchData.results.map((r: any) => r.metadata.topic);
          scenario.expectedTopics.forEach(topic => {
            expect(topics).toContain(topic);
          });
        }
        
        if (scenario.expectedTypes) {
          const types = searchData.results.map((r: any) => r.metadata.type);
          scenario.expectedTypes.forEach(type => {
            expect(types).toContain(type);
          });
        }
        
        console.log(`✓ ${scenario.name}: "${scenario.query}" returned ${searchData.results.length} relevant results`);
      }
    });

    it('should handle error recovery and system resilience', async () => {
      // Test system behavior under various error conditions
      
      // Step 1: Test health check with database issues
      const { db } = await import('~/db');
      const { testEmbeddingClient } = await import('~/embeddings');
      
      vi.mocked(db.execute).mockRejectedValue(new Error('Database connection failed'));
      vi.mocked(testEmbeddingClient).mockResolvedValue(true);

      const healthRequest = new NextRequest('http://localhost:3000/api/health');
      const healthResponse = await healthGET(healthRequest);
      
      expect(healthResponse.status).toBe(503);
      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('unhealthy');
      expect(healthData.services.database.status).toBe('down');
      
      console.log('✓ Health check correctly reports database issues');

      // Step 2: Test ingest with embedding failures
      const { embed4B } = await import('~/embeddings');
      
      vi.mocked(embed4B).mockRejectedValue(new Error('Embedding API rate limit exceeded'));

      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: [{
            content: 'Test document for error handling',
            metadata: { type: 'error-test' }
          }]
        })
      });

      const ingestResponse = await ingestPOST(ingestRequest);
      expect(ingestResponse.status).toBe(500);
      
      const ingestData = await ingestResponse.json();
      expect(ingestData.success).toBe(false);
      expect(ingestData.error).toBeDefined();
      
      console.log('✓ Ingest correctly handles embedding failures');

      // Step 3: Test search with database failures
      const { embedOne4B } = await import('~/embeddings');
      
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
      vi.mocked(db.execute).mockRejectedValue(new Error('Vector search query failed'));

      const searchRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'error handling test query',
          k: 5
        })
      });

      const searchResponse = await searchPOST(searchRequest);
      expect(searchResponse.status).toBe(500);
      
      const searchData = await searchResponse.json();
      expect(searchData.success).toBe(false);
      expect(searchData.error).toBeDefined();
      
      console.log('✓ Search correctly handles database failures');

      // Step 4: Test recovery after errors
      // Reset mocks to simulate system recovery
      vi.mocked(db.execute).mockResolvedValue({ rows: [{ result: 1 }] } as any);
      vi.mocked(embed4B).mockResolvedValue([new Array(2560).fill(0.1)]);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'recovery-doc', content: 'Recovery test', metadata: {}, embedding: '[0.1,...]', createdAt: new Date() }
          ])
        })
      } as any);

      const recoveryHealthRequest = new NextRequest('http://localhost:3000/api/health');
      const recoveryHealthResponse = await healthGET(recoveryHealthRequest);
      expect(recoveryHealthResponse.status).toBe(200);
      
      const recoveryIngestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: [{
            content: 'Recovery test document',
            metadata: { type: 'recovery-test' }
          }]
        })
      });

      const recoveryIngestResponse = await ingestPOST(recoveryIngestRequest);
      expect(recoveryIngestResponse.status).toBe(201);
      
      console.log('✓ System successfully recovers from errors');
    });
  });

  describe('Performance and Scale Testing', () => {
    it('should handle realistic workload efficiently', async () => {
      // Simulate a realistic workload with mixed operations
      const { embed4B, embedOne4B } = await import('~/embeddings');
      const { db } = await import('~/db');
      
      // Setup mocks for the workload
      vi.mocked(embed4B).mockResolvedValue(
        Array.from({ length: 10 }, () => new Array(2560).fill(0.1))
      );
      vi.mocked(embedOne4B).mockResolvedValue(new Array(2560).fill(0.1));
      
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(
            Array.from({ length: 10 }, (_, i) => ({
              id: `workload-doc-${i + 1}`,
              content: `Workload document ${i + 1}`,
              metadata: { index: i + 1 },
              embedding: '[0.1,...]',
              createdAt: new Date()
            }))
          )
        })
      } as any);
      
      vi.mocked(db.execute).mockResolvedValue({
        rows: Array.from({ length: 5 }, (_, i) => ({
          id: `result-${i + 1}`,
          content: `Search result ${i + 1}`,
          metadata: { relevance: 'high' },
          similarity: 0.9 - i * 0.05
        }))
      } as any);

      const startTime = performance.now();

      // Simulate realistic workload: batch ingest followed by multiple searches
      const documents = Array.from({ length: 10 }, (_, i) => ({
        content: `Realistic workload document ${i + 1} containing technical content about software development, APIs, databases, and system architecture.`,
        metadata: { 
          category: i % 2 === 0 ? 'backend' : 'frontend',
          difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
          index: i + 1
        }
      }));

      // Batch ingest
      const ingestRequest = new NextRequest('http://localhost:3000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      const ingestResponse = await ingestPOST(ingestRequest);
      expect(ingestResponse.status).toBe(201);

      // Multiple concurrent searches
      const searchQueries = [
        'backend development patterns',
        'frontend user interface design',
        'database optimization techniques',
        'API security best practices',
        'system architecture principles'
      ];

      const searchPromises = searchQueries.map(query => {
        const searchRequest = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, k: 5 })
        });
        return searchPOST(searchRequest);
      });

      const searchResponses = await Promise.all(searchPromises);
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Verify all operations succeeded
      searchResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Performance expectations
      expect(totalDuration).toBeLessThan(30000); // Should complete within 30 seconds
      
      console.log(`✓ Realistic workload (10 documents + 5 searches) completed in ${totalDuration.toFixed(2)}ms`);
    });
  });
});