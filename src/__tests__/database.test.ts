import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '~/db';
import { documents } from '~/db/schema';
import { eq, sql } from 'drizzle-orm';
import { vectorToString } from '~/db/vector-utils';

describe('Database Operations', () => {
  const testDocuments = [
    {
      id: 'test-doc-1',
      content: 'This is a test document about machine learning.',
      metadata: { category: 'tech', tags: ['ml', 'ai'] },
      embedding: new Array(2560).fill(0).map(() => Math.random() * 0.1)
    },
    {
      id: 'test-doc-2', 
      content: 'Another test document about natural language processing.',
      metadata: { category: 'tech', tags: ['nlp', 'ai'] },
      embedding: new Array(2560).fill(0).map(() => Math.random() * 0.1)
    }
  ];

  beforeEach(async () => {
    // Clean up test documents before each test
    await db.delete(documents).where(sql`id LIKE 'test-doc-%'`);
  });

  afterAll(async () => {
    // Clean up test documents after all tests
    await db.delete(documents).where(sql`id LIKE 'test-doc-%'`);
  });

  describe('Document insertion', () => {
    it('should insert a document with embedding', async () => {
      const testDoc = testDocuments[0];
      
      const result = await db.insert(documents).values({
        id: testDoc.id,
        content: testDoc.content,
        metadata: testDoc.metadata,
        embedding: vectorToString(testDoc.embedding)
      }).returning();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testDoc.id);
      expect(result[0].content).toBe(testDoc.content);
      expect(result[0].metadata).toEqual(testDoc.metadata);
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should insert multiple documents', async () => {
      const documentsToInsert = testDocuments.map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        embedding: vectorToString(doc.embedding)
      }));

      const result = await db.insert(documents).values(documentsToInsert).returning();

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual(['test-doc-1', 'test-doc-2']);
    });

    it('should handle documents with null metadata', async () => {
      const docWithoutMetadata = {
        id: 'test-doc-no-meta',
        content: 'Document without metadata',
        metadata: null,
        embedding: vectorToString(new Array(2560).fill(0.1))
      };

      const result = await db.insert(documents).values(docWithoutMetadata).returning();

      expect(result).toHaveLength(1);
      expect(result[0].metadata).toBeNull();
    });
  });

  describe('Document retrieval', () => {
    beforeEach(async () => {
      // Insert test documents
      const documentsToInsert = testDocuments.map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        embedding: vectorToString(doc.embedding)
      }));

      await db.insert(documents).values(documentsToInsert);
    });

    it('should retrieve document by id', async () => {
      const result = await db.select().from(documents).where(eq(documents.id, 'test-doc-1'));

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-doc-1');
      expect(result[0].content).toBe(testDocuments[0].content);
      expect(result[0].metadata).toEqual(testDocuments[0].metadata);
    });

    it('should retrieve all test documents', async () => {
      const result = await db.select().from(documents).where(sql`id LIKE 'test-doc-%'`);

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id).sort()).toEqual(['test-doc-1', 'test-doc-2']);
    });
  });

  describe('Vector operations', () => {
    beforeEach(async () => {
      // Insert test documents with known embeddings
      const doc1Embedding = new Array(2560).fill(0.1);
      const doc2Embedding = new Array(2560).fill(0.2);
      
      await db.insert(documents).values([
        {
          id: 'test-doc-1',
          content: 'First test document',
          metadata: { type: 'test' },
          embedding: vectorToString(doc1Embedding)
        },
        {
          id: 'test-doc-2',
          content: 'Second test document',
          metadata: { type: 'test' },
          embedding: vectorToString(doc2Embedding)
        }
      ]);
    });

    it('should perform vector similarity search', async () => {
      const queryEmbedding = new Array(2560).fill(0.15); // Closer to doc1
      const queryVector = vectorToString(queryEmbedding);

      const result = await db.execute(sql`
        SELECT id, content, metadata, 1 - (embedding <=> ${queryVector}::vector) as similarity
        FROM documents 
        WHERE id LIKE 'test-doc-%'
        ORDER BY embedding <=> ${queryVector}::vector
        LIMIT 2
      `);

      expect(result.rows).toHaveLength(2);
      
      // First result should be doc1 (closer to query)
      const firstResult = result.rows[0] as any;
      expect(firstResult.id).toBe('test-doc-1');
      expect(parseFloat(firstResult.similarity)).toBeGreaterThan(0.9);
      
      // Second result should be doc2
      const secondResult = result.rows[1] as any;
      expect(secondResult.id).toBe('test-doc-2');
      expect(parseFloat(secondResult.similarity)).toBeLessThan(parseFloat(firstResult.similarity));
    });

    it('should handle vector search with no results', async () => {
      // Delete all test documents first
      await db.delete(documents).where(sql`id LIKE 'test-doc-%'`);
      
      const queryEmbedding = new Array(2560).fill(0.1);
      const queryVector = vectorToString(queryEmbedding);

      const result = await db.execute(sql`
        SELECT id, content, metadata, 1 - (embedding <=> ${queryVector}::vector) as similarity
        FROM documents 
        WHERE id LIKE 'test-doc-%'
        ORDER BY embedding <=> ${queryVector}::vector
        LIMIT 5
      `);

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should handle duplicate id insertion', async () => {
      const testDoc = {
        id: 'test-duplicate',
        content: 'First document',
        metadata: { test: true },
        embedding: vectorToString(new Array(2560).fill(0.1))
      };

      // Insert first document
      await db.insert(documents).values(testDoc);

      // Try to insert duplicate
      await expect(
        db.insert(documents).values({
          ...testDoc,
          content: 'Second document with same id'
        })
      ).rejects.toThrow();
    });

    it('should handle invalid vector dimensions', async () => {
      const invalidDoc = {
        id: 'test-invalid-vector',
        content: 'Document with wrong vector size',
        metadata: { test: true },
        embedding: vectorToString(new Array(100).fill(0.1)) // Wrong size
      };

      await expect(
        db.insert(documents).values(invalidDoc)
      ).rejects.toThrow();
    });
  });
});